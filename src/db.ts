import argon2 from "argon2";
import postgres from "postgres";
import type { Room, Run, UserAuth } from "./models.js";

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

  // ----- Room -----

  async createRoom(newRoom: Omit<Room, "room_id">) {
    return await this.sql`
    INSERT INTO room
    (room_name, room_location, room_capacity)
    VALUES
    (${newRoom.room_name}, ${newRoom.room_location}, ${newRoom.room_capacity})
    RETURNING *`;
  }

  async readRoom() {
    return await this.sql`
    SELECT * FROM room`;
  }

  async readRoomById(id: number) {
    return await this.sql`
    SELECT * FROM room
    WHERE room_id = ${id}`;
  }

  async updateRoomById(
    id: number,
    partialRoom: Partial<Omit<Room, "room_id">>,
  ) {
    const name = partialRoom.room_name ?? null;
    const location = partialRoom.room_location ?? null;
    const capacity = partialRoom.room_capacity ?? null;
    return await this.sql`
    UPDATE room
    SET
    room_name = COALESCE(${name}, room_name),
    room_location = COALESCE(${location}, room_location),
    room_capacity = COALESCE(${capacity}, room_capacity)
    WHERE room_id = ${id}
    RETURNING *`;
  }

  async deleteRoomById(id: number) {
    return await this.sql`
    DELETE FROM room
    WHERE room_id = ${id}
    RETURNING *`;
  }

  // ----- Run -----

  async createRun(newRun: Omit<Run, "run_id">) {
    return await this.sql`
    INSERT INTO Run
    (ref_user_profile_id, ref_activity_id)
    VALUES
    (${newRun.ref_user_profile_id}, ${newRun.ref_activity_id})
    RETURNING *`;
  }

  async readRun() {
    return this.sql`
    SELECT * FROM run`;
  }

  async readRunById(id: number) {
    return this.sql`
    SELECT * FROM run
    WHERE run_id = ${id}`;
  }

  async updateRunById(id: number, partialRun: Partial<Omit<Run, "run_id">>) {
    const ref_user_profile_id = partialRun.ref_user_profile_id ?? null;
    const ref_activity_id = partialRun.ref_activity_id ?? null;
    return await this.sql`
    UPDATE run
    SET
    ref_user_profile_id = COALESCE(${ref_user_profile_id}, ref_user_profile_id)
    ref_activity_id = COALESCE(${ref_activity_id}, ref_activity_id)
    WHERE run_id = ${id}
    RETURNING *`;
  }

  async deleteRunById(id: number) {
    return await this.sql`
    DELETE FROM run
    WHERE run_id = ${id}
    RETURNING *`;
  }

  async end() {
    return this.sql.end();
  }
}
