export type Operation = {
  id: number;
  kind: "ADD" | "SUB" | "MUL" | "DIV" | "MOD";
  rhs: number;
  lhs: number;
  res: number;
};

export type KindAndOperands = Omit<Omit<Operation, "id">, "res">;
