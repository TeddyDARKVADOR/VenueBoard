import type { HttpStatus } from "./models.js";

export class CustomError extends Error {
  constructor(
    public subject: "POSTGRES" | "REQUEST" | "LOGIC" | "TOKEN",
    public status: HttpStatus,
    public message: string,
    public table?:
      | "event"
      | "activity"
      | "user_auth"
      | "user_profile"
      | "room"
      | "register"
      | "run"
      | "favorite"
      | "queue",
  ) {
    super(`[${subject}] Error: ${message}`);
  }
}
