import Fastify from "fastify";
import type { KindAndOperands } from "./models.js";
import { OpeRepo } from "./Operation.js";

function start_web_server() {
  const web_server = Fastify({ logger: true });
  const ope = new OpeRepo();

  web_server.post<{ Body: KindAndOperands }>(
    "/operations",
    async (req, res) => {
      const id = ope.createOperation(req.body);
      res.code(201);
      return { id, message: "created" };
    },
  );

  web_server.get("/operations", async () => {
    return ope.readAllOperation();
  });

  web_server.get<{ Params: { id: number } }>(
    "/operations/:id",
    async (req, res) => {
      const operation = ope.readOperationById(Number(req.params.id));
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
