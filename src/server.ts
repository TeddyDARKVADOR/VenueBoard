import dotenv from "dotenv";
import Fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import z from "zod";
import { CustomError } from "./CustomError.js";
import { Repository } from "./db.js";
import {
  type EventWithoutId,
  type Id,
  type PartialEventWithoutId,
  ZEventWithoutId,
  ZId,
  ZPartialEventWithoutId,
} from "./models.js";

dotenv.config();

function start_web_server() {
  const web_server = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();
  web_server.setValidatorCompiler(validatorCompiler);
  web_server.setSerializerCompiler(serializerCompiler);

  // ----- Error Handler -----

  web_server.setErrorHandler(async (error, _, reply) => {
    // to catch zod validation errors if fastify format them
    if (error.code === "FST_ERR_VALIDATION") {
      return error;
    }
    if (error instanceof z.ZodError) {
      return error;
    }
    // to catch Postgres errors
    if (
      error.code &&
      typeof error.code === "string" &&
      /^\d{5}$/.test(error.code)
    ) {
      switch (error.code) {
        case "23503":
          reply.code(404);
          break;
        case "23505	":
          reply.code(409);
          break;
        default:
          reply.code(500);
      }
      return error;
    }
    if (error instanceof CustomError) {
      reply.code(error.code);
      return {
        subject: error.subject,
        message: error.message,
        statusCode: error.code,
      };
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
      const event = await repo.createEvent(req.body);
      return { event_id: event.event_id, message: "created" };
    },
  );

  web_server.get<{ Params: Id }>(
    "/events/:id",
    { schema: { params: ZId } },
    async (req) => {
      return await repo.readEventById(req.params);
    },
  );

  web_server.get("/events", async () => {
    return await repo.readAllEvents();
  });

  web_server.get<{ Params: Id }>(
    "/event_with_activities/:id",
    { schema: { params: ZId } },
    async (req) => {
      return await repo.getEventWithActivitiesByEventId(req.params);
    },
  );

  web_server.put<{ Params: Id; Body: PartialEventWithoutId }>(
    "/events/:id",
    { schema: { params: ZId, body: ZPartialEventWithoutId } },
    async (req) => {
      const event = await repo.updateEventById(req.params, req.body);
      return { event_id: event.event_id, message: "edited" };
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
