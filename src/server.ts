import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { addHours } from "date-fns";
import dotenv from "dotenv";
import Fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { CustomError } from "./custom_error.js";
import { Repository } from "./db.js";
import {
  type ActivityWithoutId,
  type EventWithoutId,
  HttpStatus,
  type JwtClaims,
  type ObjectId,
  type PartialActivityWithoutId,
  type PartialEventWithoutId,
  type PartialUserAuthWithoutId,
  type PartialUserProfileWithoutId,
  type UserAuthLogin,
  type UserAuthWithoutId,
  type UserProfileWithoutId,
  ZActivityWithoutId,
  ZEventWithoutId,
  ZObjectId,
  ZPartialActivityWithoutId,
  ZPartialEventWithoutId,
  ZPartialUserAuthWithoutId,
  ZPartialUserProfileWithoutId,
  ZUserAuthLogin,
  ZUserAuthWithoutId,
  ZUserProfileWithoutId,
} from "./models.js";
import { requireRoles, sameId, TokenManager } from "./token_manager.js";

dotenv.config();

declare module "fastify" {
  interface FastifyRequest {
    claims: JwtClaims | null;
  }
}

function start_web_server() {
  const web_server = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();
  web_server.setValidatorCompiler(validatorCompiler);
  web_server.setSerializerCompiler(serializerCompiler);
  web_server.register(fastifyCookie, {});
  web_server.register(cors, {
    origin: "http://localhost:1234",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // ----- Error Handler -----

  web_server.setErrorHandler(async (error, _req, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      reply.code(400);
      return { message: error.message };
    }
    // to catch JWT errors
    if (
      error.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED" ||
      error.code === "ERR_JWT_EXPIRED" ||
      error.code === "ERR_JWS_INVALID" ||
      error.code === "ERR_JWT_INVALID" ||
      error.code === "ERR_JWT_CLAIM_VALIDATION_FAILED" ||
      error.code === "ERR_JWKS_NO_MATCHING_KEY" ||
      error.code === "ERR_JWKS_TIMEOUT"
    ) {
      reply.code(401);
      return error.message;
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
      reply.code(error.status);
      if (error.table) {
        return {
          table: error.table,
          message: error.message,
        };
      }
      return {
        message: error.message,
      };
    }
    console.error("Unexpected error: ", error);
    reply.code(500);
    return { message: "Unexpected server error" };
  });

  // ----- Set Repo -----

  const repo = new Repository();
  const tokenManager = new TokenManager();

  // ----- Hooks -----

  web_server.addHook("preHandler", async (req) => {
    if (req.method === "PUT" || req.method === "POST") {
      if (!req.body) {
        throw new CustomError(
          "REQUEST",
          HttpStatus.BAD_REQUEST,
          "Missing body",
        );
      }
    }
    if (
      req.originalUrl === "/login" ||
      (req.method === "POST" &&
        (req.originalUrl === "/user_auths" ||
          req.originalUrl === "/user_profiles")) ||
      req.originalUrl === "/token"
    ) {
      req.claims = null;
      return;
    }
    req.claims = req.cookies.access_token
      ? await tokenManager.verify(req.cookies.access_token)
      : null;
  });

  // ----- Token -----

  web_server.get("/token", async (_req, res) => {
    const tok = await tokenManager.encode(
      {
        sub: 1,
        role: "guest",
      },
      false,
    );
    res.setCookie("access_token", tok, {
      secure: true,
      sameSite: false,
      expires: addHours(new Date(), 1),
    });
    res.status(204);
  });

  web_server.get("/claims", async (req) => {
    return req.claims;
  });

  // ----- Event routes -----

  web_server.post<{ Body: EventWithoutId }>(
    "/events",
    { schema: { body: ZEventWithoutId }, preHandler: requireRoles(["staff"]) },
    async (req) => {
      const event = await repo.createEvent(req.body);
      return { event_id: event.event_id, message: "created" };
    },
  );

  web_server.get<{ Params: ObjectId }>(
    "/events/:id",
    { schema: { params: ZObjectId } },
    async (req) => {
      return await repo.readEventById(req.params);
    },
  );

  web_server.get("/events", async () => {
    return await repo.readAllEvents();
  });

  web_server.get<{ Params: ObjectId }>(
    "/event_with_activities/:id",
    { schema: { params: ZObjectId } },
    async (req) => {
      return await repo.readEventWithActivitiesByEventId(req.params);
    },
  );

  web_server.put<{ Params: ObjectId; Body: PartialEventWithoutId }>(
    "/events/:id",
    {
      schema: { params: ZObjectId, body: ZPartialEventWithoutId },
      preHandler: requireRoles(["staff"]),
    },
    async (req) => {
      const event = await repo.updateEventById(req.params, req.body);
      return { event_id: event.event_id, message: "updated" };
    },
  );

  web_server.delete<{ Params: ObjectId }>(
    "/events/:id",
    { schema: { params: ZObjectId }, preHandler: requireRoles(["staff"]) },
    async (req) => {
      await repo.deleteEventById(req.params);
      return { message: "deleted" };
    },
  );

  // ----- Activity Routes -----

  web_server.post<{ Body: ActivityWithoutId }>(
    "/activities",
    {
      schema: { body: ZActivityWithoutId },
      preHandler: requireRoles(["staff"]),
    },
    async (req) => {
      const activity = await repo.createActivity(req.body);
      return { activity_id: activity.activity_id, message: "created" };
    },
  );

  web_server.get("/activities", async () => {
    return await repo.readAllActivities();
  });

  web_server.get<{ Params: ObjectId }>(
    "/activities/:id",
    { schema: { params: ZObjectId } },
    async (req) => {
      return await repo.readActivityById(req.params);
    },
  );

  web_server.get<{ Params: ObjectId }>(
    "/activity_with_event/:id",
    { schema: { params: ZObjectId } },
    async (req) => {
      return await repo.readActivityWithEventByActivityId(req.params);
    },
  );

  web_server.put<{ Params: ObjectId; Body: PartialActivityWithoutId }>(
    "/activities/:id",
    {
      schema: { params: ZObjectId, body: ZPartialActivityWithoutId },
      preHandler: requireRoles(["staff"]),
    },
    async (req) => {
      const activity = await repo.updateActivityById(req.params, req.body);
      return { activity_id: activity.activity_id, message: "updated" };
    },
  );

  web_server.delete<{ Params: ObjectId }>(
    "/activities/:id",
    { schema: { params: ZObjectId }, preHandler: requireRoles(["staff"]) },
    async (req) => {
      await repo.deleteActivityById(req.params);
      return { message: "deleted" };
    },
  );

  // ----- UserProfile routes -----

  web_server.post<{ Body: UserProfileWithoutId }>(
    "/user_profiles",
    { schema: { body: ZUserProfileWithoutId } },
    async (req) => {
      const user_profile = await repo.createUserProfile(req.body);
      return {
        user_profile_id: user_profile.user_profile_id,
        message: "created",
      };
    },
  );

  web_server.get<{ Params: ObjectId }>(
    "/user_profiles/:id",
    { schema: { params: ZObjectId } },
    async (req) => {
      return await repo.readUserProfileById(req.params);
    },
  );

  web_server.get("/user_profiles", async () => {
    return await repo.readAllUserProfile();
  });

  web_server.put<{ Params: ObjectId; Body: PartialUserProfileWithoutId }>(
    "/user_profiles/:id",
    {
      schema: { params: ZObjectId, body: ZPartialUserProfileWithoutId },
      preHandler: [
        requireRoles(["guest", "speaker", "staff"]),
        sameId("/user_profiles/"),
      ],
    },
    async (req) => {
      const user_profile = await repo.updateUserProfileById(
        req.params,
        req.body,
      );
      return {
        user_profile_id: user_profile.user_profile_id,
        message: "updated",
      };
    },
  );

  web_server.delete<{ Params: ObjectId }>(
    "/user_profiles/:id",
    {
      schema: { params: ZObjectId },
      preHandler: [
        requireRoles(["guest", "speaker", "staff"]),
        sameId("/user_profiles/"),
      ],
    },
    async (req) => {
      await repo.deleteUserProfileById(req.params);
      return { message: "deleted" };
    },
  );

  // ----- UserAuth routes -----

  web_server.post<{ Body: UserAuthLogin }>(
    "/login",
    { schema: { body: ZUserAuthLogin } },
    async (req, res) => {
      const user_profile_id = await repo.loginUserAuth(req.body);
      if (!user_profile_id) {
        throw new CustomError(
          "LOGIC",
          HttpStatus.UNAUTHORIZED,
          "wrong login or password",
        );
      }
      const user_profile_role = (
        await repo.readUserProfileById({
          id: user_profile_id,
        })
      ).user_profile_role;
      const token = await tokenManager.encode(
        {
          sub: user_profile_id,
          role: user_profile_role,
        },
        false,
      );
      res.setCookie("access_token", token, {
        secure: true,
        sameSite: false,
        expires: addHours(new Date(), 1),
      });
      res.status(204);
    },
  );

  web_server.post<{ Body: UserAuthWithoutId }>(
    "/user_auths",
    { schema: { body: ZUserAuthWithoutId } },
    async (req) => {
      const user_auth = await repo.createUserAuth(req.body);
      return { user_auth_id: user_auth.user_auth_id, message: "created" };
    },
  );

  web_server.get("/user_auths", { preHandler: requireRoles([]) }, async () => {
    return await repo.readAllUserAuth();
  });

  web_server.get<{ Params: ObjectId }>(
    "/user_auths/:id",
    {
      schema: { params: ZObjectId },
      preHandler: [
        requireRoles(["guest", "speaker", "staff"]),
        sameId("/user_auths/"),
      ],
    },
    async (req) => {
      return await repo.readUserAuthById(req.params);
    },
  );

  web_server.put<{ Params: ObjectId; Body: PartialUserAuthWithoutId }>(
    "/user_auths/:id",
    {
      schema: { params: ZObjectId, body: ZPartialUserAuthWithoutId },
      preHandler: [
        requireRoles(["guest", "speaker", "staff"]),
        sameId("/user_auths/"),
      ],
    },
    async (req) => {
      const user_auth = await repo.updateUserAuthById(req.params, req.body);
      return { user_auth_id: user_auth.user_auth_id, message: "updated" };
    },
  );

  web_server.delete<{ Params: ObjectId }>(
    "/user_auths/:id",
    {
      schema: { params: ZObjectId },
      preHandler: [
        requireRoles(["guest", "speaker", "staff"]),
        sameId("/user_auths/"),
      ],
    },
    async (req) => {
      await repo.deleteUserAuthById(req.params);
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
