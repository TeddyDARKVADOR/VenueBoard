import argon2 from "argon2";
import postgres from "postgres";
import type { UserAuth, Event, Activity } from "./models.js";

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
      RETURNING *`;
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
      RETURNING *`;
  }

  async deleteEventById(id: number) {
    return await this.sql`
      DELETE FROM event
      WHERE event_id = ${id}
      RETURNING *`;
  }

  // ----- Activity -----

  async createActivity(
    newActivity: Omit<Activity, "activity_id">,
  ) {
    return await this.sql`
      INSERT INTO activity
      (activity_name, activity_description, activity_start, activity_end, activity_real_start, activity_real_end, ref_event_id, ref_room_id)
      VALUES
      (${newActivity.activity_name},
       ${newActivity.activity_description},
       ${newActivity.activity_start},
       ${newActivity.activity_end},
       ${newActivity.activity_real_start},
       ${newActivity.activity_real_end},
       ${newActivity.ref_event_id},
       ${newActivity.ref_room_id})
      RETURNING *`;
  }

  async readAllActivities() {
    return await this.sql`
      SELECT *
      FROM activity`;
  }

  async readActivityById(id: number) {
    return await this.sql`
      SELECT *
      FROM activity
      WHERE activity_id = ${id}`;
  }

  async updateActivityById(
    id: number,
    partialActivity: Partial<Omit<Activity, "activity_id">>
  ) {
    const name = partialActivity.activity_name ?? null;
    const description = partialActivity.activity_description ?? null;
    const start = partialActivity.activity_start ?? null;
    const end = partialActivity.activity_end ?? null;
    const realStart = partialActivity.activity_real_start ?? null;
    const realEnd = partialActivity.activity_real_end ?? null;
    const refEvent = partialActivity.ref_event_id ?? null;
    const refRoom = partialActivity.ref_room_id ?? null;
    return await this.sql`
      UPDATE activity
      SET
      activity_name = COALESCE(${name}, activity_name),
      activity_description = COALESCE(${description}, activity_description),
      activity_start = COALESCE(${start}, activity_start),
      activity_end = COALESCE(${end}, activity_end),
      activity_real_start = COALESCE(${realStart}, activity_real_start),
      activity_real_end = COALESCE(${realEnd}, activity_real_end),
      ref_event_id = COALESCE(${refEvent}, ref_event_id),
      ref_room_id = COALESCE(${refRoom}, ref_room_id)
      WHERE activity_id = ${id}
      RETURNING *`;
  }

  async deleteActivityById(id: number) {
    return await this.sql`
      DELETE FROM activity
      WHERE activity_id = ${id}
      RETURNING *`;
  }

  async end() {
    return this.sql.end();
  }
}
