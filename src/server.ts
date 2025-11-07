import fastifyCookie from "@fastify/cookie";
import dotenv from "dotenv";
import Fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import z from "zod";
import { CustomError } from "./custom_error.js";
import { Repository } from "./db.js";
import {
  type ActivityWithoutId,
  type EventWithoutId,
  type Id,
  type PartialActivityWithoutId,
  type PartialEventWithoutId,
  type UserProfile,
  ZActivityWithoutId,
  ZEventWithoutId,
  ZId,
  ZPartialEventWithoutId,
} from "./models.js";
import { TokenManager } from "./token_manager.js";

dotenv.config();

function start_web_server() {
  const web_server = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();
  web_server.setValidatorCompiler(validatorCompiler);
  web_server.setSerializerCompiler(serializerCompiler);
  web_server.register(fastifyCookie, {});

  // ----- Error Handler -----

  web_server.setErrorHandler(async (error, _, reply) => {
    // to catch zod validation errors if fastify format them
    if (error.code === "FST_ERR_VALIDATION") {
      return error;
    }
    if (error instanceof z.ZodError) {
      return error;
    }
    // to catch JWT errors
    if (
      error instanceof Error &&
      (/signature/i.test(error.name) ||
        /expired/i.test(error.name) ||
        /signature/i.test(error.message) ||
        /expired/i.test(error.message) ||
        error.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED" ||
        error.code === "ERR_JWT_EXPIRED")
    ) {
      reply.code(401);
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
      if (error.table) {
        return {
          subject: error.subject,
          table: error.table,
          message: error.message,
          statusCode: error.code,
        };
      }
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
  const tokenManager = new TokenManager();

  // ----- Token -----

  web_server.get("/token", async (_req, res) => {
    const tok = await tokenManager.encode(
      {
        sub: "example",
        roles: ["admin"],
      },
      false,
    );
    res.setCookie("access_token", tok, {
      secure: true,
      sameSite: false,
      //expires: addMinutes(new Date(), 1),
    });
    res.status(204);
  });

  web_server.get<{
    Params: { role_allowed: UserProfile["user_profile_role"] };
  }>(
    "/token_check/:role_allowed",
    {
      schema: {
        params: z.object({
          role_allowed: z.enum(["admin", "staff", "speaker", "guest"]),
        }),
      },
    },
    async (req) => {
      const payload = await tokenManager.verify(req.cookies.access_token, [
        req.params.role_allowed,
      ]);
      return { payload };
    },
  );

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
    "/events/:id/activities",
    { schema: { params: ZId } },
    async (req) => {
      return await repo.readEventWithActivitiesByEventId(req.params);
    },
  );

  web_server.put<{ Params: Id; Body: PartialEventWithoutId }>(
    "/events/:id",
    { schema: { params: ZId, body: ZPartialEventWithoutId } },
    async (req) => {
      if (!req.body) {
        throw new CustomError("REQUEST", 400, "Missing body", "event");
      }
      const event = await repo.updateEventById(req.params, req.body);
      return { event_id: event.event_id, message: "updated" };
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

  // ----- Activity Routes -----

  web_server.post<{ Body: ActivityWithoutId }>(
    "/activities",
    { schema: { body: ZActivityWithoutId } },
    async (req) => {
      const activity = await repo.createActivity(req.body);
      return { activity_id: activity.activity_id, message: "created" };
    },
  );

  web_server.get("/activities", async () => {
    return await repo.readAllActivities();
  });

  web_server.get<{ Params: Id }>(
    "/activities/:id",
    { schema: { params: ZId } },
    async (req) => {
      return await repo.readActivityById(req.params);
    },
  );

  web_server.put<{ Params: Id; Body: PartialActivityWithoutId }>(
    "/activities/:id",
    async (req) => {
      if (!req.body) {
        throw new CustomError("REQUEST", 400, "Missing body", "activity");
      }
      const activity = await repo.updateActivityById(req.params, req.body);
      return { activity_id: activity.activity_id, message: "updated" };
    },
  );

  web_server.delete<{ Params: Id }>("/activities/:id", async (req) => {
    await repo.deleteActivityById(req.params);
    return { message: "deleted" };
  });

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
