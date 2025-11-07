export class CustomError extends Error {
  constructor(
    public subject: "POSTGRES" | "REQUEST" | "LOGIC",
    public table:
      | "event"
      | "activity"
      | "user_auth"
      | "user_profile"
      | "room"
      | "register"
      | "run",
    public code: number,
    public message: string,
  ) {
    super(`[${subject}] Error: ${message}`);
  }
}
