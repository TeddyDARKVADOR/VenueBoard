export class CustomError extends Error {
  constructor(
    public subject: "POSTGRES" | "REQUEST",
    public code: number,
    public message: string,
  ) {
    super(`[${subject}] Error: ${message}`);
  }
}
