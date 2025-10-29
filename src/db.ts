import argon2 from "argon2";
import postgres from "postgres";
import type { UserAuth } from "./models.js";

export class Repository {
  sql: postgres.Sql;

  constructor() {
    this.sql = postgres({
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    });
  }

  async createUserAuth(newUserAuth: Omit<UserAuth, "user_auth_id">) {
    const opts = {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
      hashLength: 32,
    };

    const hash = await argon2.hash(newUserAuth.user_auth_password, opts);
    const result = await this.sql`
    insert into user_auth
    (user_auth_login, user_auth_password)
    values
    (${newUserAuth.user_auth_login}, ${hash})
    returning user_auth_login, user_auth_password`;
    return result;
  }

  async end() {
    return this.sql.end();
  }
}
