import argon2 from "argon2";
import postgres from "postgres";
import type { UserAuth, Event } from "./models.js";

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

  // ----- Event -----

  async createEvent(
    newEvent: Omit<Event, "event_id">,
  ) {
    return await this.sql`
      INSERT INTO event
      (event_name, event_description, start_at, end_at, ref_user_profile_id)
      VALUES
      (${newEvent.event_name},
       ${newEvent.event_description},
       ${newEvent.start_at},
       ${newEvent.end_at},
       ${newEvent.ref_user_profile_id})
      RETURNING event_id, event_name, event_description, start_at, end_at, ref_user_profile_id`;
  }

  async readAllEvents() {
    return await this.sql`
      SELECT *
      FROM event`;
  }

  async readEventById(id: number) {
    return await this.sql`
      SELECT *
      FROM event
      WHERE event_id = ${id}`;
  }

  async updateEventById(
    id: number,
    partialEvent: Partial<Omit<Event, "event_id">>
  ) {
    const name = partialEvent.event_name ?? null;
    const description = partialEvent.event_description ?? null;
    const start = partialEvent.start_at ?? null;
    const end = partialEvent.end_at ?? null;
    const ref = partialEvent.ref_user_profile_id ?? null;
    return await this.sql`
      UPDATE event
      SET
      event_name = COALESCE(${name}, event_name),
      event_description = COALESCE(${description}, event_description),
      start_at = COALESCE(${start}, start_at),
      end_at = COALESCE(${end}, end_at),
      ref_user_profile_id = COALESCE(${ref}, ref_user_profile_id)
      WHERE event_id = ${id}
      RETURNING event_id, event_name, event_description, start_at, end_at, ref_user_profile_id`;
  }

  async deleteEventById(id: number) {
    return await this.sql`
      DELETE FROM event
      WHERE event_id = ${id}
      RETURNING event_id, event_name, event_description, start_at, end_at, ref_user_profile_id`;
  }

  async end() {
    return this.sql.end();
  }
}
