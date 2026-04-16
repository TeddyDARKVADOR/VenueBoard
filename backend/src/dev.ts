import { execSync } from "node:child_process";
import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

function friendlyError(message: string): never {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

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
      console.log("\n✔ PostgreSQL is ready");
      return;
    } catch {
      if (i === 0) process.stdout.write("Waiting for PostgreSQL...");
      else process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  console.log();
  friendlyError(
    "PostgreSQL n'a pas répondu après plusieurs tentatives.\n" +
    "  → Tu n'as pas PostgreSQL d'installé, ou le conteneur Docker n'a pas démarré correctement.\n" +
    "  → Vérifie que Docker Desktop est bien lancé et que le conteneur est en cours d'exécution."
  );
}

async function main() {
  console.log("▶ Starting Docker containers...");
  try {
    execSync("docker compose -f docker/docker-compose.yaml up -d", {
      stdio: "inherit",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/command not found|not recognized|ENOENT/i.test(msg)) {
      friendlyError(
        "Docker n'est pas installé sur cette machine.\n" +
        "  → Installe Docker Desktop : https://www.docker.com/products/docker-desktop"
      );
    }
    if (/Cannot connect to the Docker daemon|docker daemon is not running|pipe.*docker/i.test(msg)) {
      friendlyError(
        "Docker est installé mais n'est pas démarré.\n" +
        "  → Veuillez lancer Docker Desktop puis réessayer."
      );
    }
    friendlyError(
      `Erreur lors du lancement des conteneurs Docker : ${msg}\n` +
      "  → Vérifie que Docker Desktop est bien lancé et que le fichier docker/docker-compose.yaml est valide."
    );
  }

  await waitForPostgres();

  console.log("▶ Seeding database...");
  try {
    execSync("tsx src/seed.ts", { stdio: "inherit" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    friendlyError(`Erreur lors du seeding de la base de données : ${msg}`);
  }

  console.log("▶ Starting server...");
  try {
    execSync("tsx src/server.ts", { stdio: "inherit" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Ctrl+C returns a non-zero exit code — ignore it silently
    if (!/SIGINT|SIGTERM|status 130|status 2/i.test(msg)) {
      friendlyError(`Erreur lors du démarrage du serveur : ${msg}`);
    }
  }
}

main().catch((err) => {
  console.error(`\n❌ Erreur inattendue : ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
