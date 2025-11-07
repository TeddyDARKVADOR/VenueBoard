export class CustomError extends Error {
  constructor(
    public subject: "POSTGRES" | "REQUEST" | "LOGIC",
    public code: number,
    public message: string,
    public table?:
      | "event"
      | "activity"
      | "user_auth"
      | "user_profile"
      | "room"
      | "register"
      | "run",
  ) {
    super(`[${subject}] Error: ${message}`);
  }
}
