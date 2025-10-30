import argon2 from "argon2";
import postgres from "postgres";
import type {
  Activity,
  Event,
  Register,
  Room,
  Run,
  UserAuth,
  UserProfile,
} from "./models.js";

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
      (user_profile_name, user_profile_role, user_auth_id)
      VALUES
      (${newUserProfile.user_profile_name},
      ${newUserProfile.user_profile_role},
      ${newUserProfile.user_auth_id})
      RETURNING *`;
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
    const ref = partialUserProfile.user_auth_id ?? null;
    return await this.sql`
      UPDATE user_profile
      SET
      user_profile_name = COALESCE(${name}, user_profile_name),
      user_profile_role = COALESCE(${role}, user_profile_role),
      user_auth_id = COALESCE(${ref}, user_auth_id)
      WHERE user_profile_id = ${id}
      RETURNING *`;
  }

  async deleteUserProfileById(id: number) {
    return await this.sql`
      DELETE FROM user_profile
      WHERE user_profile_id = ${id}
      RETURNING *`;
  }

  //----- Register -----

  async createRegister(register: Omit<Register, "register_id">) {
    return await this.sql`
    INSERT INTO register
    (user_profile_id, activity_id)
    VALUES
    (${register.user_profile_id} , ${register.activity_id})
    RETURNING *`;
  }

  async readAllRegister() {
    return await this.sql`
    SELECT *
    FROM register`;
  }

  async readRegisterById(id: number) {
    return await this.sql`
    SELECT *
    FROM register
    WHERE register_id = ${id}`;
  }

  async updateRegisterById(
    id: number,
    update: Partial<Omit<Register, "register_id">>,
  ) {
    const user_profile_id = update.user_profile_id ?? null;
    const activity_id = update.activity_id ?? null;
    return await this.sql`
    UPDATE register
    SET
    user_profile_id = COALESCE(${user_profile_id}, user_profile_id),
    activity_id = COALESCE(${activity_id}, activity_id)
    WHERE register_id = ${id}
    RETURNING *`;
  }

  async deleteRegisterById(id: number) {
    return await this.sql`
    DELETE FROM register
    WHERE register_id = ${id}
    RETURNING *`;
  }

  // ----- Event -----

  async createEvent(newEvent: Omit<Event, "event_id">) {
    return await this.sql`
      INSERT INTO event
      (event_name, event_description, event_start, event_end, user_profile_id)
      VALUES
      (${newEvent.event_name},
       ${newEvent.event_description},
       ${newEvent.event_start},
       ${newEvent.event_end},
       ${newEvent.user_profile_id})
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
    partialEvent: Partial<Omit<Event, "event_id">>,
  ) {
    const name = partialEvent.event_name ?? null;
    const description = partialEvent.event_description ?? null;
    const start = partialEvent.event_start ?? null;
    const end = partialEvent.event_end ?? null;
    const ref = partialEvent.user_profile_id ?? null;
    return await this.sql`
      UPDATE event
      SET
      event_name = COALESCE(${name}, event_name),
      event_description = COALESCE(${description}, event_description),
      event_start = COALESCE(${start}, event_start),
      event_end = COALESCE(${end}, event_end),
      user_profile_id = COALESCE(${ref}, user_profile_id)
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

  async createActivity(newActivity: Omit<Activity, "activity_id">) {
    return await this.sql`
      INSERT INTO activity
      (activity_name, activity_description, activity_start, activity_end, activity_real_start, activity_real_end, event_id, room_id)
      VALUES
      (${newActivity.activity_name},
       ${newActivity.activity_description},
       ${newActivity.activity_start},
       ${newActivity.activity_end},
       ${newActivity.activity_real_start},
       ${newActivity.activity_real_end},
       ${newActivity.event_id},
       ${newActivity.room_id})
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
    partialActivity: Partial<Omit<Activity, "activity_id">>,
  ) {
    const name = partialActivity.activity_name ?? null;
    const description = partialActivity.activity_description ?? null;
    const start = partialActivity.activity_start ?? null;
    const end = partialActivity.activity_end ?? null;
    const realStart = partialActivity.activity_real_start ?? null;
    const realEnd = partialActivity.activity_real_end ?? null;
    const refEvent = partialActivity.event_id ?? null;
    const refRoom = partialActivity.room_id ?? null;
    return await this.sql`
      UPDATE activity
      SET
      activity_name = COALESCE(${name}, activity_name),
      activity_description = COALESCE(${description}, activity_description),
      activity_start = COALESCE(${start}, activity_start),
      activity_end = COALESCE(${end}, activity_end),
      activity_real_start = COALESCE(${realStart}, activity_real_start),
      activity_real_end = COALESCE(${realEnd}, activity_real_end),
      event_id = COALESCE(${refEvent}, event_id),
      room_id = COALESCE(${refRoom}, room_id)
      WHERE activity_id = ${id}
      RETURNING *`;
  }

  async deleteActivityById(id: number) {
    return await this.sql`
      DELETE FROM activity
      WHERE activity_id = ${id}
      RETURNING *`;
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
