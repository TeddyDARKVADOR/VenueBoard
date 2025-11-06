export class CustomError extends Error {
  constructor(
    public subject: "POSTGRES",
    public code: number,
    public message: string,
  ) {
    super(`[${subject}] Error: ${message}`);
  }
}
