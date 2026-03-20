import type { FastifyRequest } from "fastify/types/request.js";
import { describe, expect, test } from "vitest";
import { CustomError } from "./custom_error.js";
import { requireRoles, sameId, TokenManager } from "./token_manager.js";

describe("TokenManager", () => {
  test("generate and verify", async () => {
    const jwt = new TokenManager();
    const token = await jwt.encode({ sub: 1, role: "admin" }, true);
    const now = Math.floor(Date.now() / 1000);
    expect(await jwt.verify(token)).toEqual({
      sub: 1,
      role: "admin",
      iat: now,
      exp: now + 60,
    });
  });

  test("verify with another token manager", async () => {
    const jwt1 = new TokenManager();
    const jwt2 = new TokenManager("abc");
    const token = await jwt1.encode({ sub: 1, role: "admin" }, true);
    const now = Math.floor(Date.now() / 1000);
    expect(await jwt1.verify(token)).toEqual({
      sub: 1,
      role: "admin",
      iat: now,
      exp: now + 60,
    });
    await expect(jwt2.verify(token)).rejects.toMatchObject({
      name: expect.stringMatching(/JWSSignatureVerificationFailed|signature/i),
    });
  });

  test("encodes different roles", async () => {
    const jwt = new TokenManager();
    for (const role of ["admin", "staff", "speaker", "guest"] as const) {
      const token = await jwt.encode({ sub: 5, role }, true);
      const claims = await jwt.verify(token);
      expect(claims.sub).toBe(5);
      expect(claims.role).toBe(role);
    }
  });

  test("rejects tampered token", async () => {
    const jwt = new TokenManager();
    const token = await jwt.encode({ sub: 1, role: "admin" }, true);
    const tampered = `${token.slice(0, -4)}XXXX`;
    await expect(jwt.verify(tampered)).rejects.toThrow();
  });

  test("rejects garbage string", async () => {
    const jwt = new TokenManager();
    await expect(jwt.verify("not.a.jwt")).rejects.toThrow();
  });

  test("accepts Uint8Array secret", async () => {
    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);
    const jwt = new TokenManager(secret);
    const token = await jwt.encode({ sub: 1, role: "guest" }, true);
    const claims = await jwt.verify(token);
    expect(claims.sub).toBe(1);
    expect(claims.role).toBe("guest");
  });
});

describe("requireRoles", () => {
  function fakeRequest(claims?: { sub: number; role: string }): FastifyRequest {
    return { claims } as unknown as FastifyRequest;
  }

  test("allows matching role", async () => {
    const guard = requireRoles(["admin", "staff"]);
    await expect(
      guard(fakeRequest({ sub: 1, role: "admin" })),
    ).resolves.toBeUndefined();
  });

  test("rejects non-matching role", async () => {
    const guard = requireRoles(["admin"]);
    try {
      await guard(fakeRequest({ sub: 1, role: "guest" }));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CustomError);
      expect((err as CustomError).status).toBe(403);
    }
  });

  test("rejects missing claims", async () => {
    const guard = requireRoles(["admin"]);
    try {
      await guard(fakeRequest());
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CustomError);
      expect((err as CustomError).status).toBe(401);
    }
  });
});

describe("sameId", () => {
  function fakeRequest(
    originalUrl: string,
    claims?: { sub: number; role: string },
  ): FastifyRequest {
    return { originalUrl, claims } as unknown as FastifyRequest;
  }

  test("allows when id matches", async () => {
    const guard = sameId("/user_profiles/");
    await expect(
      guard(fakeRequest("/user_profiles/42", { sub: 42, role: "guest" })),
    ).resolves.toBeUndefined();
  });

  test("admin bypasses id check", async () => {
    const guard = sameId("/user_profiles/");
    await expect(
      guard(fakeRequest("/user_profiles/99", { sub: 1, role: "admin" })),
    ).resolves.toBeUndefined();
  });

  test("rejects mismatched id for non-admin", async () => {
    const guard = sameId("/user_profiles/");
    try {
      await guard(fakeRequest("/user_profiles/99", { sub: 42, role: "guest" }));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CustomError);
      expect((err as CustomError).status).toBe(409);
    }
  });

  test("rejects missing claims", async () => {
    const guard = sameId("/user_profiles/");
    try {
      await guard(fakeRequest("/user_profiles/1"));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CustomError);
      expect((err as CustomError).status).toBe(401);
    }
  });

  test("works with /user_auths/ prefix", async () => {
    const guard = sameId("/user_auths/");
    await expect(
      guard(fakeRequest("/user_auths/10", { sub: 10, role: "guest" })),
    ).resolves.toBeUndefined();
  });

  test("admin bypasses on /user_auths/ too", async () => {
    const guard = sameId("/user_auths/");
    await expect(
      guard(fakeRequest("/user_auths/999", { sub: 1, role: "admin" })),
    ).resolves.toBeUndefined();
  });

  test("staff cannot access another user's profile", async () => {
    const guard = sameId("/user_profiles/");
    try {
      await guard(
        fakeRequest("/user_profiles/5", { sub: 10, role: "staff" }),
      );
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CustomError);
      expect((err as CustomError).status).toBe(409);
    }
  });

  test("speaker cannot access another user's auth", async () => {
    const guard = sameId("/user_auths/");
    try {
      await guard(
        fakeRequest("/user_auths/7", { sub: 3, role: "speaker" }),
      );
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CustomError);
    }
  });
});

// ===== Extended edge-case tests =====

describe("TokenManager - encode options", () => {
  test("testing=true produces 60s expiration", async () => {
    const jwt = new TokenManager();
    const token = await jwt.encode({ sub: 1, role: "guest" }, true);
    const claims = await jwt.verify(token);
    expect(claims.exp - claims.iat).toBe(60);
  });

  test("testing=false produces ~1h expiration", async () => {
    const jwt = new TokenManager();
    const token = await jwt.encode({ sub: 1, role: "guest" }, false);
    const claims = await jwt.verify(token);
    const diff = claims.exp - claims.iat;
    expect(diff).toBeGreaterThanOrEqual(3599);
    expect(diff).toBeLessThanOrEqual(3601);
  });

  test("sub is preserved as number", async () => {
    const jwt = new TokenManager();
    const token = await jwt.encode({ sub: 999, role: "admin" }, true);
    const claims = await jwt.verify(token);
    expect(claims.sub).toBe(999);
    expect(typeof claims.sub).toBe("number");
  });
});

describe("requireRoles - all role combinations", () => {
  function fakeRequest(claims?: { sub: number; role: string }): FastifyRequest {
    return { claims } as unknown as FastifyRequest;
  }

  const allRoles = ["admin", "staff", "speaker", "guest"] as const;

  test("single role array allows only that role", async () => {
    for (const allowed of allRoles) {
      const guard = requireRoles([allowed]);
      for (const tryRole of allRoles) {
        if (tryRole === allowed) {
          await expect(
            guard(fakeRequest({ sub: 1, role: tryRole })),
          ).resolves.toBeUndefined();
        } else {
          await expect(
            guard(fakeRequest({ sub: 1, role: tryRole })),
          ).rejects.toThrow();
        }
      }
    }
  });

  test("all roles allowed lets everyone through", async () => {
    const guard = requireRoles(["admin", "staff", "speaker", "guest"]);
    for (const role of allRoles) {
      await expect(
        guard(fakeRequest({ sub: 1, role })),
      ).resolves.toBeUndefined();
    }
  });

  test("null claims always rejected", async () => {
    const guard = requireRoles(["admin", "staff", "speaker", "guest"]);
    try {
      await guard(fakeRequest());
      expect.unreachable("should have thrown");
    } catch (err) {
      expect((err as CustomError).status).toBe(401);
    }
  });
});
