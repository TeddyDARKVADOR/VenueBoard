import Fastify from "fastify";
import { describe, expect, test } from "vitest";
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { CustomError } from "./custom_error.js";
import { HttpStatus } from "./models.js";

function buildApp() {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler(async (error, _req, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      reply.code(400);
      return { message: error.message };
    }
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
      return { error: error.message };
    }
    if (
      error.code &&
      typeof error.code === "string" &&
      /^\d{5}$/.test(error.code)
    ) {
      switch (error.code) {
        case "23503":
          reply.code(404);
          break;
        case "23505":
          reply.code(409);
          break;
        default:
          reply.code(500);
      }
      return { message: error.message };
    }
    if (error instanceof CustomError) {
      reply.code(error.status);
      if (error.table) {
        return { table: error.table, message: error.message };
      }
      return { message: error.message };
    }
    reply.code(500);
    return { message: "Unexpected server error" };
  });

  return app;
}

describe("Error handler - Zod validation errors", () => {
  test("returns 400 for invalid body schema", async () => {
    const app = buildApp();
    app.post(
      "/test",
      { schema: { body: z.object({ name: z.string() }) } },
      async () => ({ ok: true }),
    );
    const res = await app.inject({
      method: "POST",
      url: "/test",
      payload: { name: 123 },
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toHaveProperty("message");
  });

  test("returns 400 for missing required field", async () => {
    const app = buildApp();
    app.post(
      "/test",
      { schema: { body: z.object({ name: z.string(), age: z.number() }) } },
      async () => ({ ok: true }),
    );
    const res = await app.inject({
      method: "POST",
      url: "/test",
      payload: { name: "test" },
    });
    expect(res.statusCode).toBe(400);
  });

  test("returns 400 for invalid query params", async () => {
    const app = buildApp();
    app.get(
      "/test",
      { schema: { querystring: z.object({ page: z.coerce.number().int().positive() }) } },
      async () => ({ ok: true }),
    );
    const res = await app.inject({
      method: "GET",
      url: "/test?page=-1",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("Error handler - JWT errors", () => {
  const jwtErrorCodes = [
    "ERR_JWS_SIGNATURE_VERIFICATION_FAILED",
    "ERR_JWT_EXPIRED",
    "ERR_JWS_INVALID",
    "ERR_JWT_INVALID",
    "ERR_JWT_CLAIM_VALIDATION_FAILED",
    "ERR_JWKS_NO_MATCHING_KEY",
    "ERR_JWKS_TIMEOUT",
  ];

  for (const code of jwtErrorCodes) {
    test(`returns 401 for ${code}`, async () => {
      const app = buildApp();
      app.get("/test", async () => {
        const err = new Error(`JWT error: ${code}`);
        (err as { code?: string }).code = code;
        throw err;
      });
      const res = await app.inject({ method: "GET", url: "/test" });
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body)).toHaveProperty("error");
    });
  }
});

describe("Error handler - Postgres errors", () => {
  test("returns 404 for foreign key violation (23503)", async () => {
    const app = buildApp();
    app.get("/test", async () => {
      const err = new Error("FK violation");
      (err as { code?: string }).code = "23503";
      throw err;
    });
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).message).toBe("FK violation");
  });

  test("returns 409 for unique constraint violation (23505)", async () => {
    const app = buildApp();
    app.get("/test", async () => {
      const err = new Error("Duplicate key");
      (err as { code?: string }).code = "23505";
      throw err;
    });
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).message).toBe("Duplicate key");
  });

  test("returns 500 for unknown postgres error code", async () => {
    const app = buildApp();
    app.get("/test", async () => {
      const err = new Error("PG internal error");
      (err as { code?: string }).code = "99999";
      throw err;
    });
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(500);
  });

  test("does not match non-5-digit codes", async () => {
    const app = buildApp();
    app.get("/test", async () => {
      const err = new Error("Not a PG error");
      (err as { code?: string }).code = "1234";
      throw err;
    });
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe("Unexpected server error");
  });
});

describe("Error handler - CustomError", () => {
  test("returns correct status and message", async () => {
    const app = buildApp();
    app.get("/test", async () => {
      throw new CustomError("LOGIC", HttpStatus.CONFLICT, "conflict happened");
    });
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).message).toContain("conflict happened");
  });

  test("returns table field when provided", async () => {
    const app = buildApp();
    app.get("/test", async () => {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "event",
      );
    });
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.table).toBe("event");
    expect(body.message).toContain("Not found");
  });

  test("omits table field when not provided", async () => {
    const app = buildApp();
    app.get("/test", async () => {
      throw new CustomError(
        "TOKEN",
        HttpStatus.UNAUTHORIZED,
        "unauthorized",
      );
    });
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body).not.toHaveProperty("table");
  });

  test("handles all HTTP status codes", async () => {
    const statuses = [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
      HttpStatus.CONFLICT,
      HttpStatus.INTERNAL_SERVER_ERROR,
    ];
    for (const status of statuses) {
      const app = buildApp();
      app.get("/test", async () => {
        throw new CustomError("LOGIC", status, "test");
      });
      const res = await app.inject({ method: "GET", url: "/test" });
      expect(res.statusCode).toBe(status);
    }
  });
});

describe("Error handler - unexpected errors", () => {
  test("returns 500 for generic Error", async () => {
    const app = buildApp();
    app.get("/test", async () => {
      throw new Error("something broke");
    });
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe("Unexpected server error");
  });

  test("returns 500 for thrown string", async () => {
    const app = buildApp();
    app.get("/test", async () => {
      throw "oops";
    });
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(500);
  });

  test("returns 500 for thrown object", async () => {
    const app = buildApp();
    app.get("/test", async () => {
      throw { weird: true };
    });
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(500);
  });
});
