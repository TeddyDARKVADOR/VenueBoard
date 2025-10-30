import Fastify from "fastify";
import {
  type OperationId,
  ZKindAndOperands,
  ZOperationId,
  type KindAndOperands,
} from "./models.js";
import { OpeRepo } from "./Operation.js";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

function start_web_server() {
  const web_server = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();
  web_server.setValidatorCompiler(validatorCompiler);
  web_server.setSerializerCompiler(serializerCompiler);

  const ope = new OpeRepo();

  web_server.post<{ Body: KindAndOperands }>(
    "/operations",
    { schema: { body: ZKindAndOperands } },
    async (req, res) => {
      const id = ope.createOperation(req.body);
      res.code(201);
      return { id, message: "created" };
    },
  );

  web_server.get("/operations", async () => {
    return ope.readAllOperation();
  });

  web_server.get<{ Params: OperationId }>(
    "/operations/:id",
    { schema: { params: ZOperationId } },
    async (req, res) => {
      const operation = ope.readOperationById(req.params.id);
      if (!operation) {
        res.code(404);
        return { message: "Not found" };
      }
      return operation;
    },
  );

  web_server.listen({ port: 1234, host: "0.0.0.0" }, (err, address) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`listening on ${address}`);
    }
  });
}

start_web_server();
