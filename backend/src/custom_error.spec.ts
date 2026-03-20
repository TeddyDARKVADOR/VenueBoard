import { describe, expect, test } from "vitest";
import { CustomError } from "./custom_error.js";
import { HttpStatus } from "./models.js";

describe("CustomError", () => {
  test("creates error with all fields", () => {
    const err = new CustomError(
      "POSTGRES",
      HttpStatus.NOT_FOUND,
      "Not found",
      "event",
    );
    expect(err).toBeInstanceOf(Error);
    expect(err.subject).toBe("POSTGRES");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.table).toBe("event");
  });

  test("creates error without table", () => {
    const err = new CustomError(
      "LOGIC",
      HttpStatus.CONFLICT,
      "invalid password length",
    );
    expect(err.subject).toBe("LOGIC");
    expect(err.status).toBe(409);
    expect(err.message).toBe("invalid password length");
    expect(err.table).toBeUndefined();
  });

  test("inherits from Error with formatted message", () => {
    const err = new CustomError(
      "TOKEN",
      HttpStatus.UNAUTHORIZED,
      "unauthorized",
    );
    expect(err instanceof Error).toBe(true);
    expect(err.message).toBe("unauthorized");
  });

  test("each subject type works", () => {
    const subjects = ["POSTGRES", "REQUEST", "LOGIC", "TOKEN"] as const;
    for (const subject of subjects) {
      const err = new CustomError(subject, HttpStatus.BAD_REQUEST, "test");
      expect(err.subject).toBe(subject);
    }
  });

  test("each table type works", () => {
    const tables = [
      "event",
      "activity",
      "user_auth",
      "user_profile",
      "room",
      "register",
      "run",
      "favorite",
      "queue",
    ] as const;
    for (const table of tables) {
      const err = new CustomError("POSTGRES", HttpStatus.NOT_FOUND, "test", table);
      expect(err.table).toBe(table);
    }
  });
});
