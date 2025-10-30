import argon2 from "argon2";
import postgres from "postgres";
import type { UserAuth, UserProfile } from "./models.js";

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

  // ----- UserAuth -----

  async createUserAuth(newUserAuth: Omit<UserAuth, "user_auth_id">) {
    const hash = await argon2.hash(newUserAuth.user_auth_password, ARGON2OPTS);
    return await this.sql`
    INSERT INTO user_auth
    (user_auth_login, user_auth_password)
    VALUES
    (${newUserAuth.user_auth_login}, ${hash})
    RETURNING user_auth_id, user_auth_login`;
  }

  async readAllUserAuth() {
    return await this.sql`
      SELECT user_auth_id, user_auth_login
      FROM user_auth`;
  }

  async readUserAuthById(id: number) {
    return await this.sql`
      SELECT user_auth_id, user_auth_login
      FROM user_auth
      WHERE user_auth_id = ${id}`;
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
    return await this.sql`
      UPDATE user_auth
      SET
      user_auth_login = COALESCE(${login}, user_auth_login),
      user_auth_password = COALESCE(${hash}, user_auth_password)
      WHERE user_auth_id = ${id}
      RETURNING user_auth_id, user_auth_login`;
  }

  async deleteUserAuthById(id: number) {
    return await this.sql`
      DELETE FROM user_auth
      WHERE user_auth_id = ${id}
      RETURNING user_auth_id, user_auth_login`;
  }

  async loginUserAuth(user: Omit<UserAuth, "user_auth_id">) {
    const rows = await this.sql`
      SELECT user_auth_password
      FROM user_auth
      WHERE user_auth_login = ${user.user_auth_login}
    `;
    if (!rows || rows.length === 0) {
      return false;
    }
    const storedHash = rows[0].user_auth_password as string;
    return await argon2.verify(storedHash, user.user_auth_password);
  }

  // ----- UserProfile -----

  async createUserProfile(
    newUserProfile: Omit<UserProfile, "user_profile_id">,
  ) {
    return await this.sql`
      INSERT INTO user_profile
      (user_profile_name, user_profile_role, ref_user_auth_id)
      VALUES
      (${newUserProfile.user_profile_name},
      ${newUserProfile.user_profile_role},
      ${newUserProfile.ref_user_auth_id})
      RETURNING user_profile_id, user_profile_name, user_profile_role, ref_user_auth_id`;
  }

  async readAllUserProfile() {
    return await this.sql`
      SELECT *
      FROM user_profile`;
  }

  async readUserProfileById(id: number) {
    return await this.sql`
      SELECT *
      FROM user_profile
      WHERE user_profile_id = ${id}`;
  }

  async updateUserProfileById(
    id: number,
    partialUserProfile: Partial<Omit<UserProfile, "user_profile_id">>,
  ) {
    const name = partialUserProfile.user_profile_name ?? null;
    const role = partialUserProfile.user_profile_role ?? null;
    const ref = partialUserProfile.ref_user_auth_id ?? null;
    return await this.sql`
      UPDATE user_profile
      SET
      user_profile_name = COALESCE(${name}, user_profile_name),
      user_profile_role = COALESCE(${role}, user_profile_role),
      ref_user_auth_id = COALESCE(${ref}, ref_user_auth_id)
      WHERE user_profile_id = ${id}
      RETURNING user_profile_id, user_profile_name, user_profile_role, ref_user_auth_id
      `;
  }

  async deleteUserProfileById(id: number) {
    return await this.sql`
      DELETE FROM user_profile
      WHERE user_profile_id = ${id}
      RETURNING user_profile_id, user_profile_name, user_profile_role, ref_user_auth_id`;
  }

  async end() {
    return this.sql.end();
  }
}
