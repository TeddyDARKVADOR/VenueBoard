import postgres from "postgres";
import argon2 from "argon2";
import type { PostgresError } from "postgres";
import type { UserAuth } from "./models.js";

const ARGON2OPTS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
};

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

  async sync() {
    try {
      await this.sql`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN
          SELECT table_schema, table_name, column_name
          FROM information_schema.columns
          WHERE column_default LIKE 'nextval(%'
        LOOP
          EXECUTE format(
            'SELECT setval(pg_get_serial_sequence(%L, %L), (SELECT COALESCE(MAX(%I), 0) + 1 FROM %I.%I), false);',
            r.table_schema || '.' || r.table_name,
            r.column_name,
            r.column_name,
            r.table_schema,
            r.table_name
          );
        END LOOP;
      END$$;`;
    } catch (err) {
      const error = err as PostgresError;
      throw error;
    }
  }

  async createUserAuth(newUserAuth: Omit<UserAuth, "user_auth_id">) {
    const hash = await argon2.hash(newUserAuth.user_auth_password, ARGON2OPTS);
    try {
      const res = await this.sql`
    INSERT INTO user_auth
    (user_auth_login, user_auth_password)
    VALUES
    (${newUserAuth.user_auth_login}, ${hash})
    RETURNING user_auth_id, user_auth_login`;
      return res;
    } catch (err) {
      const error = err as PostgresError;
      throw error;
    }
  }

  async readAllUserAuth() {
    try {
      const res = await this.sql`
      SELECT user_auth_id, user_auth_login
      FROM user_auth`;
      return res;
    } catch (err) {
      const error = err as PostgresError;
      throw error;
    }
  }

  async readUserAuthById(id: number) {
    try {
      const res = await this.sql`
      SELECT user_auth_id, user_auth_login
      FROM user_auth
      WHERE user_auth_id = ${id}`;
      return res;
    } catch (err) {
      const error = err as PostgresError;
      throw error;
    }
  }

  async updateUserAuthById(
    id: number,
    partialUserAuth: Partial<Omit<UserAuth, "user_auth_id">>,
  ) {
    const login = partialUserAuth.user_auth_login ?? null;
    let hash = null;
    if (partialUserAuth.user_auth_password) {
      hash = await argon2.hash(partialUserAuth.user_auth_password, ARGON2OPTS);
    }
    try {
      const res = await this.sql`
      UPDATE user_auth
      SET
      user_auth_login = COALESCE(${login}, user_auth_login),
      user_auth_password = COALESCE(${hash}, user_auth_password)
      WHERE user_auth_id = ${id}
      RETURNING user_auth_id, user_auth_login`;
      return res;
    } catch (err) {
      const error = err as PostgresError;
      throw error;
    }
  }

  async deleteUserAuthById(id: number) {
    try {
      const res = await this.sql`
      DELETE FROM user_auth
      WHERE user_auth_id = ${id}
      RETURNING user_auth_id, user_auth_login`;
      return res;
    } catch (err) {
      const error = err as PostgresError;
      throw error;
    }
  }

  async loginUserAuth(user: Omit<UserAuth, "user_auth_id">) {
    try {
      const rows = await this.sql`
      SELECT user_auth_password
      FROM user_auth
      WHERE user_auth_login = ${user.user_auth_login}
    `;
      if (!rows || rows.length === 0) {
        throw new Error("loginUserAuth: user not found");
      }
      const storedHash = rows[0].user_auth_password as string;
      const res = await argon2.verify(storedHash, user.user_auth_password);
      return res;
    } catch (err: unknown) {
      const error = err as PostgresError;
      throw error;
    }
  }

  async end() {
    return this.sql.end();
  }
}
