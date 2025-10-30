import { z } from "zod";

export const ZOperation = z.object({
  id: z.coerce.number().positive().int(),
  kind: z.enum(["ADD", "SUB", "MUL", "DIV", "MOD"]),
  rhs: z.coerce.number(),
  lhs: z.coerce.number(),
  res: z.number(),
});

export const ZKindAndOperands = ZOperation.omit({ id: true, res: true });
export const ZOperationId = ZOperation.pick({ id: true });

export type Operation = z.infer<typeof ZOperation>;
export type KindAndOperands = z.infer<typeof ZKindAndOperands>;
export type OperationId = z.infer<typeof ZOperationId>;
