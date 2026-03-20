import { describe, expect, test } from "vitest";
import {
  HttpStatus,
  ZActivityWithEvent,
  ZActivityWithoutId,
  ZEventWithActivities,
  ZEventWithoutId,
  ZFavorite,
  ZId,
  ZJwtClaims,
  ZObjectId,
  ZPartialActivityWithoutId,
  ZPartialEventWithoutId,
  ZPartialRoomWithoutId,
  ZPartialUserAuthWithoutId,
  ZPartialUserProfileWithoutId,
  ZQueue,
  ZQueueWithoutPos,
  ZRegister,
  ZRoomWithoutId,
  ZRun,
  ZUserAuth,
  ZUserAuthLogin,
  ZUserAuthWithoutId,
  ZUserAuthWithoutPassword,
  ZUserProfile,
  ZUserProfileWithoutId,
} from "./models.js";

describe("ZId", () => {
  test("accepts positive integer", () => {
    expect(ZId.parse(1)).toBe(1);
    expect(ZId.parse("42")).toBe(42);
  });

  test("rejects zero", () => {
    expect(() => ZId.parse(0)).toThrow();
  });

  test("rejects negative", () => {
    expect(() => ZId.parse(-1)).toThrow();
  });

  test("rejects non-integer", () => {
    expect(() => ZId.parse(1.5)).toThrow();
  });

  test("coerces string to number", () => {
    expect(ZId.parse("10")).toBe(10);
  });
});

describe("ZObjectId", () => {
  test("accepts valid object", () => {
    expect(ZObjectId.parse({ id: 1 })).toEqual({ id: 1 });
  });

  test("coerces string id", () => {
    expect(ZObjectId.parse({ id: "5" })).toEqual({ id: 5 });
  });

  test("rejects missing id", () => {
    expect(() => ZObjectId.parse({})).toThrow();
  });
});

describe("ZUserAuthWithoutId", () => {
  test("accepts valid auth", () => {
    const data = {
      user_auth_login: "alice",
      user_auth_password: "pass123",
      user_profile_id: 1,
    };
    expect(ZUserAuthWithoutId.parse(data)).toEqual(data);
  });

  test("rejects missing login", () => {
    expect(() =>
      ZUserAuthWithoutId.parse({
        user_auth_password: "pass",
        user_profile_id: 1,
      }),
    ).toThrow();
  });

  test("rejects missing password", () => {
    expect(() =>
      ZUserAuthWithoutId.parse({
        user_auth_login: "alice",
        user_profile_id: 1,
      }),
    ).toThrow();
  });
});

describe("ZUserAuthLogin", () => {
  test("accepts login + password", () => {
    const data = { user_auth_login: "alice", user_auth_password: "pass123" };
    expect(ZUserAuthLogin.parse(data)).toEqual(data);
  });

  test("rejects extra user_profile_id (stripped by omit)", () => {
    const result = ZUserAuthLogin.parse({
      user_auth_login: "alice",
      user_auth_password: "pass",
      user_profile_id: 1,
    });
    expect(result).not.toHaveProperty("user_profile_id");
  });
});

describe("ZPartialUserAuthWithoutId", () => {
  test("accepts partial data", () => {
    expect(ZPartialUserAuthWithoutId.parse({ user_auth_login: "bob" })).toEqual({
      user_auth_login: "bob",
    });
  });

  test("accepts empty object", () => {
    expect(ZPartialUserAuthWithoutId.parse({})).toEqual({});
  });
});

describe("ZUserProfileWithoutId", () => {
  test("accepts valid profile", () => {
    const data = { user_profile_name: "Alice", user_profile_role: "admin" };
    expect(ZUserProfileWithoutId.parse(data)).toEqual(data);
  });

  test("rejects invalid role", () => {
    expect(() =>
      ZUserProfileWithoutId.parse({
        user_profile_name: "Alice",
        user_profile_role: "superadmin",
      }),
    ).toThrow();
  });

  test("accepts all valid roles", () => {
    for (const role of ["admin", "staff", "speaker", "guest"]) {
      expect(
        ZUserProfileWithoutId.parse({ user_profile_name: "X", user_profile_role: role }),
      ).toHaveProperty("user_profile_role", role);
    }
  });
});

describe("ZPartialUserProfileWithoutId", () => {
  test("accepts partial name only", () => {
    expect(ZPartialUserProfileWithoutId.parse({ user_profile_name: "Bob" })).toEqual({
      user_profile_name: "Bob",
    });
  });
});

describe("ZEventWithoutId", () => {
  const valid = {
    event_name: "Test",
    event_description: "A test event",
    event_start: "2026-01-01T10:00:00Z",
    event_end: "2026-01-02T10:00:00Z",
    user_profile_id: 1,
  };

  test("accepts valid event", () => {
    const result = ZEventWithoutId.parse(valid);
    expect(result.event_name).toBe("Test");
    expect(result.event_start).toBeInstanceOf(Date);
    expect(result.event_end).toBeInstanceOf(Date);
  });

  test("coerces date strings", () => {
    const result = ZEventWithoutId.parse(valid);
    expect(result.event_start.toISOString()).toBe("2026-01-01T10:00:00.000Z");
  });

  test("rejects missing fields", () => {
    expect(() => ZEventWithoutId.parse({ event_name: "Test" })).toThrow();
  });
});

describe("ZPartialEventWithoutId", () => {
  test("accepts partial event", () => {
    expect(ZPartialEventWithoutId.parse({ event_name: "Updated" })).toEqual({
      event_name: "Updated",
    });
  });
});

describe("ZActivityWithoutId", () => {
  const valid = {
    activity_name: "Keynote",
    activity_description: "Opening keynote",
    activity_start: "2026-01-01T10:00:00Z",
    activity_end: "2026-01-01T11:00:00Z",
    activity_real_start: null,
    activity_real_end: null,
    event_id: 1,
    room_id: 1,
  };

  test("accepts valid activity", () => {
    const result = ZActivityWithoutId.parse(valid);
    expect(result.activity_name).toBe("Keynote");
    expect(result.activity_real_start).toBeNull();
  });

  test("accepts real dates", () => {
    const result = ZActivityWithoutId.parse({
      ...valid,
      activity_real_start: "2026-01-01T10:05:00Z",
      activity_real_end: "2026-01-01T11:02:00Z",
    });
    expect(result.activity_real_start).toBeInstanceOf(Date);
    expect(result.activity_real_end).toBeInstanceOf(Date);
  });
});

describe("ZRoomWithoutId", () => {
  test("accepts valid room", () => {
    const data = { room_name: "Hall A", room_location: "Building A", room_capacity: 100 };
    expect(ZRoomWithoutId.parse(data)).toEqual(data);
  });

  test("rejects negative capacity", () => {
    expect(() =>
      ZRoomWithoutId.parse({ room_name: "X", room_location: "Y", room_capacity: -1 }),
    ).toThrow();
  });
});

describe("ZPartialRoomWithoutId", () => {
  test("accepts partial room", () => {
    expect(ZPartialRoomWithoutId.parse({ room_name: "Updated Room" })).toEqual({
      room_name: "Updated Room",
    });
  });
});

describe("ZRegister", () => {
  test("accepts valid register", () => {
    expect(ZRegister.parse({ user_profile_id: 1, activity_id: 2 })).toEqual({
      user_profile_id: 1,
      activity_id: 2,
    });
  });
});

describe("ZRun", () => {
  test("accepts valid run", () => {
    expect(ZRun.parse({ user_profile_id: 1, activity_id: 3 })).toEqual({
      user_profile_id: 1,
      activity_id: 3,
    });
  });
});

describe("ZFavorite", () => {
  test("accepts valid favorite", () => {
    expect(ZFavorite.parse({ user_profile_id: 2, activity_id: 4 })).toEqual({
      user_profile_id: 2,
      activity_id: 4,
    });
  });
});

describe("ZQueue", () => {
  test("accepts valid queue with position", () => {
    expect(ZQueue.parse({ position: 1, user_profile_id: 1, activity_id: 1 })).toEqual({
      position: 1,
      user_profile_id: 1,
      activity_id: 1,
    });
  });

  test("rejects non-positive position", () => {
    expect(() =>
      ZQueue.parse({ position: 0, user_profile_id: 1, activity_id: 1 }),
    ).toThrow();
  });
});

describe("ZQueueWithoutPos", () => {
  test("accepts queue without position", () => {
    expect(ZQueueWithoutPos.parse({ user_profile_id: 1, activity_id: 1 })).toEqual({
      user_profile_id: 1,
      activity_id: 1,
    });
  });
});

describe("ZJwtClaims", () => {
  test("accepts valid claims", () => {
    const now = Math.floor(Date.now() / 1000);
    const data = { sub: 1, role: "admin", iat: now, exp: now + 3600 };
    expect(ZJwtClaims.parse(data)).toEqual(data);
  });

  test("rejects invalid role in claims", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(() =>
      ZJwtClaims.parse({ sub: 1, role: "superadmin", iat: now, exp: now + 3600 }),
    ).toThrow();
  });
});

describe("HttpStatus enum", () => {
  test("has correct values", () => {
    expect(HttpStatus.OK).toBe(200);
    expect(HttpStatus.CREATED).toBe(201);
    expect(HttpStatus.NO_CONTENT).toBe(204);
    expect(HttpStatus.BAD_REQUEST).toBe(400);
    expect(HttpStatus.UNAUTHORIZED).toBe(401);
    expect(HttpStatus.FORBIDDEN).toBe(403);
    expect(HttpStatus.NOT_FOUND).toBe(404);
    expect(HttpStatus.CONFLICT).toBe(409);
    expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
  });
});

// ===== Extended edge-case tests =====

describe("ZId - edge cases", () => {
  test("rejects NaN", () => {
    expect(() => ZId.parse(Number.NaN)).toThrow();
  });

  test("rejects Infinity", () => {
    expect(() => ZId.parse(Number.POSITIVE_INFINITY)).toThrow();
  });

  test("rejects empty string", () => {
    expect(() => ZId.parse("")).toThrow();
  });

  test("accepts very large integer", () => {
    expect(ZId.parse(999999999)).toBe(999999999);
  });

  test("coerces boolean true to 1", () => {
    expect(ZId.parse(true)).toBe(1);
  });
});

describe("ZUserAuth - full schema", () => {
  test("accepts valid full user auth", () => {
    const data = {
      user_auth_id: 1,
      user_auth_login: "alice",
      user_auth_password: "hashed",
      user_profile_id: 1,
    };
    expect(ZUserAuth.parse(data)).toEqual(data);
  });

  test("coerces string ids", () => {
    const data = {
      user_auth_id: "5",
      user_auth_login: "alice",
      user_auth_password: "hashed",
      user_profile_id: "3",
    };
    const result = ZUserAuth.parse(data);
    expect(result.user_auth_id).toBe(5);
    expect(result.user_profile_id).toBe(3);
  });
});

describe("ZUserAuthWithoutPassword", () => {
  test("accepts auth without password", () => {
    const data = {
      user_auth_id: 1,
      user_auth_login: "alice",
      user_profile_id: 2,
    };
    expect(ZUserAuthWithoutPassword.parse(data)).toEqual(data);
  });

  test("strips password if present", () => {
    const result = ZUserAuthWithoutPassword.parse({
      user_auth_id: 1,
      user_auth_login: "alice",
      user_profile_id: 2,
      user_auth_password: "secret",
    });
    expect(result).not.toHaveProperty("user_auth_password");
  });
});

describe("ZUserProfile - full schema", () => {
  test("accepts valid full profile", () => {
    const data = {
      user_profile_id: 1,
      user_profile_name: "Alice",
      user_profile_role: "admin",
    };
    expect(ZUserProfile.parse(data)).toEqual(data);
  });

  test("coerces string id", () => {
    const result = ZUserProfile.parse({
      user_profile_id: "10",
      user_profile_name: "Bob",
      user_profile_role: "guest",
    });
    expect(result.user_profile_id).toBe(10);
  });
});

describe("ZPartialActivityWithoutId", () => {
  test("accepts empty object", () => {
    expect(ZPartialActivityWithoutId.parse({})).toEqual({});
  });

  test("accepts just name", () => {
    const result = ZPartialActivityWithoutId.parse({
      activity_name: "Updated",
    });
    expect(result.activity_name).toBe("Updated");
  });

  test("accepts just dates", () => {
    const result = ZPartialActivityWithoutId.parse({
      activity_start: "2026-06-01T10:00:00Z",
      activity_end: "2026-06-01T11:00:00Z",
    });
    expect(result.activity_start).toBeInstanceOf(Date);
    expect(result.activity_end).toBeInstanceOf(Date);
  });
});

describe("ZEventWithActivities", () => {
  test("accepts event with activities array", () => {
    const data = {
      event_id: 1,
      event_name: "Conf 2026",
      event_description: "A conference",
      event_start: "2026-01-01T09:00:00Z",
      event_end: "2026-01-02T18:00:00Z",
      user_profile_id: 1,
      activities: [
        {
          activity_id: 1,
          activity_name: "Keynote",
          activity_description: "Opening",
          activity_start: "2026-01-01T09:00:00Z",
          activity_end: "2026-01-01T10:00:00Z",
          activity_real_start: null,
          activity_real_end: null,
          event_id: 1,
          room_id: 1,
        },
      ],
    };
    const result = ZEventWithActivities.parse(data);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].activity_name).toBe("Keynote");
  });

  test("accepts event with empty activities", () => {
    const data = {
      event_id: 1,
      event_name: "Empty",
      event_description: "No activities",
      event_start: "2026-01-01T09:00:00Z",
      event_end: "2026-01-02T18:00:00Z",
      user_profile_id: 1,
      activities: [],
    };
    const result = ZEventWithActivities.parse(data);
    expect(result.activities).toHaveLength(0);
  });
});

describe("ZActivityWithEvent", () => {
  test("accepts activity with nested event", () => {
    const data = {
      activity_id: 1,
      activity_name: "Keynote",
      activity_description: "Opening",
      activity_start: "2026-01-01T09:00:00Z",
      activity_end: "2026-01-01T10:00:00Z",
      activity_real_start: null,
      activity_real_end: null,
      event_id: 1,
      room_id: 1,
      event: {
        event_id: 1,
        event_name: "Conf",
        event_description: "A conf",
        event_start: "2026-01-01T09:00:00Z",
        event_end: "2026-01-02T18:00:00Z",
        user_profile_id: 1,
      },
    };
    const result = ZActivityWithEvent.parse(data);
    expect(result.event.event_name).toBe("Conf");
    expect(result.activity_name).toBe("Keynote");
  });
});

describe("ZQueue - edge cases", () => {
  test("rejects negative position", () => {
    expect(() =>
      ZQueue.parse({ position: -5, user_profile_id: 1, activity_id: 1 }),
    ).toThrow();
  });

  test("accepts large position", () => {
    const result = ZQueue.parse({
      position: 1000,
      user_profile_id: 1,
      activity_id: 1,
    });
    expect(result.position).toBe(1000);
  });

  test("coerces string position", () => {
    const result = ZQueue.parse({
      position: "5",
      user_profile_id: "1",
      activity_id: "2",
    });
    expect(result.position).toBe(5);
    expect(result.user_profile_id).toBe(1);
    expect(result.activity_id).toBe(2);
  });
});

describe("ZRegister - edge cases", () => {
  test("rejects missing user_profile_id", () => {
    expect(() => ZRegister.parse({ activity_id: 1 })).toThrow();
  });

  test("rejects missing activity_id", () => {
    expect(() => ZRegister.parse({ user_profile_id: 1 })).toThrow();
  });

  test("coerces string ids", () => {
    const result = ZRegister.parse({
      user_profile_id: "3",
      activity_id: "7",
    });
    expect(result.user_profile_id).toBe(3);
    expect(result.activity_id).toBe(7);
  });
});

describe("ZFavorite - edge cases", () => {
  test("rejects zero ids", () => {
    expect(() =>
      ZFavorite.parse({ user_profile_id: 0, activity_id: 1 }),
    ).toThrow();
    expect(() =>
      ZFavorite.parse({ user_profile_id: 1, activity_id: 0 }),
    ).toThrow();
  });
});

describe("ZRun - edge cases", () => {
  test("rejects null fields", () => {
    expect(() =>
      ZRun.parse({ user_profile_id: null, activity_id: 1 }),
    ).toThrow();
  });
});

describe("ZJwtClaims - edge cases", () => {
  test("coerces string sub", () => {
    const now = Math.floor(Date.now() / 1000);
    const result = ZJwtClaims.parse({
      sub: "42",
      role: "guest",
      iat: now,
      exp: now + 3600,
    });
    expect(result.sub).toBe(42);
  });

  test("accepts all four roles", () => {
    const now = Math.floor(Date.now() / 1000);
    for (const role of ["admin", "staff", "speaker", "guest"]) {
      const result = ZJwtClaims.parse({
        sub: 1,
        role,
        iat: now,
        exp: now + 3600,
      });
      expect(result.role).toBe(role);
    }
  });

  test("rejects missing exp", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(() =>
      ZJwtClaims.parse({ sub: 1, role: "admin", iat: now }),
    ).toThrow();
  });
});
