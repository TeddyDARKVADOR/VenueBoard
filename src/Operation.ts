import type { KindAndOperands, Operation } from "./models.js";

export class OpeRepo {
  operations: Operation[] = [];
  private nextId = 1;

  private operate(operation: KindAndOperands) {
    switch (operation.kind) {
      case "ADD":
        return operation.lhs + operation.rhs;
      case "DIV":
        return operation.lhs / operation.rhs;
      case "MOD":
        return operation.lhs % operation.rhs;
      case "SUB":
        return operation.lhs - operation.rhs;
      case "MUL":
        return operation.lhs * operation.rhs;
    }
  }

  createOperation(operation: KindAndOperands) {
    this.operations.push({
      id: this.nextId,
      ...operation,
      res: this.operate(operation),
    });
    this.nextId += 1;
    return this.nextId - 1;
  }

  readAllOperation() {
    return this.operations;
  }

  readOperationById(id: number) {
    return this.operations.find((curr) => curr.id === id);
  }
}
