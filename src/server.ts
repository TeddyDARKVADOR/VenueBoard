import Fastify from "fastify";
import dotenv from "dotenv";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import {
  type Id,
  ZEventWithoutId,
  ZId,
  type EventWithoutId,
  type PartialEventWithoutId,
  ZPartialEventWithoutId,
} from "./models.js";
import { Repository } from "./db.js";
import z from "zod";

dotenv.config();

function start_web_server() {
  const web_server = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();
  web_server.setValidatorCompiler(validatorCompiler);
  web_server.setSerializerCompiler(serializerCompiler);

  // ----- Error Handler -----

  web_server.setErrorHandler(async (error, _, reply) => {
    if (error instanceof z.ZodError) {
      return error;
    }
    console.error("Unexpected error: ", error);
    reply.code(500);
    return { message: "Unexpected server error" };
  });

  // ----- Set Repo -----

  const repo = new Repository();

  // ----- Event routes -----

  web_server.post<{ Body: EventWithoutId }>(
    "/events",
    { schema: { body: ZEventWithoutId } },
    async (req) => {
      const res = await repo.createEvent(req.body);
      return { event_id: res[0].id, message: "created" };
    },
  );

  web_server.get<{ Params: Id }>(
    "/events/:id",
    { schema: { params: ZId } },
    async (req) => {
      const res = await repo.readEventById(req.params);
      return res[0];
    },
  );

  web_server.get("/events", async () => {
    const res = await repo.readAllEvents();
    return res;
  });

  web_server.put<{ Params: Id; Body: PartialEventWithoutId }>(
    "/events/:id",
    { schema: { params: ZId, body: ZPartialEventWithoutId } },
    async (req) => {
      const res = await repo.updateEventById(req.params, req.body);
      return { event_id: res[0].id, message: "edited" };
    },
  );

  web_server.delete<{ Params: Id }>(
    "/events/:id",
    { schema: { params: ZId } },
    async (req) => {
      await repo.deleteEventById(req.params);
      return { message: "deleted" };
    },
  );

  // ----- Listen -----

  web_server.listen({ port: 1234, host: "0.0.0.0" }, (err, address) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`listening on ${address}`);
    }
  });
}

start_web_server();
