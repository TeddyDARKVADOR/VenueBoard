import { execSync } from "node:child_process";
import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

async function waitForPostgres(maxRetries = 30, delayMs = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const sql = postgres({
        host: process.env.PGHOST,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
        username: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
      });
      await sql`SELECT 1`;
      await sql.end();
      console.log("✔ PostgreSQL is ready");
      return;
    } catch {
      if (i === 0) process.stdout.write("Waiting for PostgreSQL...");
      else process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  console.log();
  throw new Error("PostgreSQL did not become ready in time");
}

async function main() {
  console.log("▶ Starting Docker containers...");
  execSync("docker compose -f docker/docker-compose.yaml up -d", {
    stdio: "inherit",
  });

  await waitForPostgres();

  console.log("▶ Seeding database...");
  execSync("tsx src/seed.ts", { stdio: "inherit" });

  console.log("▶ Starting server...");
  try {
    execSync("tsx src/server.ts", { stdio: "inherit" });
  } catch {
    // Server stopped (Ctrl+C)
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
