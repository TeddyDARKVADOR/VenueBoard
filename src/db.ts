import argon2 from "argon2";
import postgres from "postgres";
import { CustomError } from "./CustomError.js";
import type {
  Activity,
  ActivityWithoutId,
  Event,
  EventWithActivities,
  EventWithoutId,
  Id,
  PartialActivityWithoutId,
  PartialEventWithoutId,
  PartialRegisterWithoutId,
  PartialRoomWithoutId,
  PartialRunWithoutId,
  PartialUserAuthWithoutId,
  PartialUserProfileWithoutId,
  Register,
  RegisterWithoutId,
  Room,
  RoomWithoutId,
  Run,
  RunWithoutId,
  UserAuthWithoutId,
  UserAuthWithoutPassword,
  UserProfile,
  UserProfileWithoutId,
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
    console.log("\n", process.env.PGHOST, "\n");
    this.sql = postgres({
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    });
  }

  // ----- UserAuth -----

  async createUserAuth(newUserAuth: UserAuthWithoutId) {
    const hash = await argon2.hash(newUserAuth.user_auth_password, ARGON2OPTS);
    const rows = (await this.sql`
    INSERT INTO user_auth
    (user_auth_login, user_auth_password, user_profile_id)
    VALUES
    (${newUserAuth.user_auth_login}, ${hash}, ${newUserAuth.user_profile_id})
    RETURNING user_auth_id, user_auth_login`) as UserAuthWithoutPassword[];
    return rows[0];
  }

  async readAllUserAuth() {
    const rows = (await this.sql`
      SELECT user_auth_id, user_auth_login
      FROM user_auth`) as UserAuthWithoutPassword[];
    return rows;
  }

  async readUserAuthById({ id }: Id) {
    const rows = (await this.sql`
      SELECT user_auth_id, user_auth_login
      FROM user_auth
      WHERE user_auth_id = ${id}`) as UserAuthWithoutPassword[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "user_auth", 404, "Not found");
    }
    return rows[0];
  }

  async updateUserAuthById(
    { id }: Id,
    partialUserAuth: PartialUserAuthWithoutId,
  ) {
    const login = partialUserAuth.user_auth_login ?? null;
    const ref = partialUserAuth.user_profile_id ?? null;
    let hash = null;
    if (partialUserAuth.user_auth_password) {
      hash = await argon2.hash(partialUserAuth.user_auth_password, ARGON2OPTS);
    }
    const rows = (await this.sql`
      UPDATE user_auth
      SET
      user_auth_login = COALESCE(${login}, user_auth_login),
      user_auth_password = COALESCE(${hash}, user_auth_password),
      user_profil_id = COALESCE(${ref}, user_profile_id)
      WHERE user_auth_id = ${id}
      RETURNING user_auth_id, user_auth_login`) as UserAuthWithoutPassword[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "user_auth", 404, "Not found");
    }
    return rows[0];
  }

  async deleteUserAuthById({ id }: Id) {
    const rows = (await this.sql`
      DELETE FROM user_auth
      WHERE user_auth_id = ${id}
      RETURNING user_auth_id, user_auth_login`) as UserAuthWithoutPassword[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "user_auth", 404, "Not found");
    }
    return rows[0];
  }

  async loginUserAuth(user: UserAuthWithoutId) {
    const rows = (await this.sql`
      SELECT user_auth_password
      FROM user_auth
      WHERE user_auth_login = ${user.user_auth_login}
    `) as { user_auth_password: string }[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "user_auth", 404, "Not found");
    }
    const storedHash = rows[0].user_auth_password;
    return await argon2.verify(storedHash, user.user_auth_password);
  }

  // ----- UserProfile -----

  async createUserProfile(newUserProfile: UserProfileWithoutId) {
    const rows = (await this.sql`
      INSERT INTO user_profile
      (user_profile_name, user_profile_role)
      VALUES
      (${newUserProfile.user_profile_name},
      ${newUserProfile.user_profile_role},
      RETURNING *`) as UserProfile[];
    return rows[0];
  }

  async readAllUserProfile() {
    const rows = (await this.sql`
      SELECT *
      FROM user_profile`) as UserProfile[];
    return rows;
  }

  async readUserProfileById({ id }: Id) {
    const rows = (await this.sql`
      SELECT *
      FROM user_profile
      WHERE user_profile_id = ${id}`) as UserProfile[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "user_profile", 404, "Not found");
    }
    return rows[0];
  }

  async updateUserProfileById(
    { id }: Id,
    partialUserProfile: PartialUserProfileWithoutId,
  ) {
    const name = partialUserProfile.user_profile_name ?? null;
    const role = partialUserProfile.user_profile_role ?? null;
    const rows = (await this.sql`
      UPDATE user_profile
      SET
      user_profile_name = COALESCE(${name}, user_profile_name),
      user_profile_role = COALESCE(${role}, user_profile_role)
      WHERE user_profile_id = ${id}
      RETURNING *`) as UserProfile[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "user_profile", 404, "Not found");
    }
    return rows[0];
  }

  async deleteUserProfileById({ id }: Id) {
    const rows = await this.sql`
      DELETE FROM user_profile
      WHERE user_profile_id = ${id}
      RETURNING *`;
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "user_profile", 404, "Not found");
    }
    return rows[0];
  }

  //----- Register -----

  async createRegister(register: RegisterWithoutId) {
    const rows = (await this.sql`
    INSERT INTO register
    (user_profile_id, activity_id)
    VALUES
    (${register.user_profile_id} , ${register.activity_id})
    RETURNING *`) as Register[];
    return rows[0];
  }

  async readAllRegister() {
    const rows = (await this.sql`
    SELECT *
    FROM register`) as Register[];
    return rows;
  }

  async readRegisterById({ id }: Id) {
    const rows = (await this.sql`
    SELECT *
    FROM register
    WHERE register_id = ${id}`) as Register[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "register", 404, "Not found");
    }
    return rows[0];
  }

  async updateRegisterById({ id }: Id, update: PartialRegisterWithoutId) {
    const user_profile_id = update.user_profile_id ?? null;
    const activity_id = update.activity_id ?? null;
    const rows = (await this.sql`
    UPDATE register
    SET
    user_profile_id = COALESCE(${user_profile_id}, user_profile_id),
    activity_id = COALESCE(${activity_id}, activity_id)
    WHERE register_id = ${id}
    RETURNING *`) as Register[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "register", 404, "Not found");
    }
    return rows[0];
  }

  async deleteRegisterById({ id }: Id) {
    const rows = (await this.sql`
    DELETE FROM register
    WHERE register_id = ${id}
    RETURNING *`) as Register[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "register", 404, "Not found");
    }
    return rows[0];
  }

  // ----- Event -----

  async createEvent(newEvent: EventWithoutId) {
    if (newEvent.event_start >= newEvent.event_end) {
      throw new CustomError(
        "LOGIC",
        "event",
        409,
        "Event end needs to be older than its start",
      );
    }
    const rows = (await this.sql`
      INSERT INTO event
      (event_name, event_description, event_start, event_end, user_profile_id)
      VALUES
      (${newEvent.event_name},
       ${newEvent.event_description},
       ${newEvent.event_start},
       ${newEvent.event_end},
       ${newEvent.user_profile_id})
      RETURNING *`) as Event[];
    return rows[0];
  }

  async readAllEvents() {
    const rows = (await this.sql`
      SELECT *
      FROM event`) as Event[];
    return rows;
  }

  async readEventById({ id }: Id) {
    const rows = (await this.sql`
      SELECT *
      FROM event
      WHERE event_id = ${id}`) as Event[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "event", 404, "Not found");
    }
    return rows[0];
  }

  async updateEventById({ id }: Id, partialEvent: PartialEventWithoutId) {
    const name = partialEvent.event_name ?? null;
    const description = partialEvent.event_description ?? null;
    const start = partialEvent.event_start
      ? new Date(partialEvent.event_start)
      : null;
    const end = partialEvent.event_end
      ? new Date(partialEvent.event_end)
      : null;
    const ref = partialEvent.user_profile_id ?? null;

    const error = new CustomError(
      "LOGIC",
      "event",
      409,
      "Event end needs to be older than its start",
    );
    if (!start || !end) {
      if (start || end) {
        const event = await this.readEventById({ id });
        if (
          (start && start >= event.event_end) ||
          (end && event.event_start >= end)
        ) {
          throw error;
        }
      }
    } else {
      if (start >= end) {
        throw error;
      }
    }

    const rows = (await this.sql`
      UPDATE event
      SET
      event_name = COALESCE(${name}, event_name),
      event_description = COALESCE(${description}, event_description),
      event_start = COALESCE(${start}, event_start),
      event_end = COALESCE(${end}, event_end),
      user_profile_id = COALESCE(${ref}, user_profile_id)
      WHERE event_id = ${id}
      RETURNING *`) as Event[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "event", 404, "Not found");
    }
    return rows[0];
  }

  async deleteEventById({ id }: Id) {
    const rows = (await this.sql`
      DELETE FROM event
      WHERE event_id = ${id}
      RETURNING *`) as Event[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "event", 404, "Not found");
    }
    return rows[0];
  }

  // ----- Activity -----

  async createActivity(newActivity: ActivityWithoutId) {
    if (newActivity.activity_start >= newActivity.activity_end) {
      throw new CustomError(
        "LOGIC",
        "activity",
        409,
        "Activity end needs to be older than its start",
      );
    }
    if (
      newActivity.activity_real_start &&
      newActivity.activity_real_end &&
      newActivity.activity_real_start >= newActivity.activity_real_end
    ) {
      throw new CustomError(
        "LOGIC",
        "activity",
        409,
        "Activity real end needs to be older than its real start",
      );
    }
    const event = await this.readEventById({ id: newActivity.event_id });
    if (
      newActivity.activity_start < event.event_start ||
      newActivity.activity_start > event.event_end ||
      newActivity.activity_end < event.event_start ||
      newActivity.activity_end > event.event_end
    ) {
      throw new CustomError(
        "LOGIC",
        "activity",
        409,
        "Activity's end and start needs to be between his event's dates",
      );
    }

    const rows = (await this.sql`
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
      RETURNING *`) as Activity[];
    return rows[0];
  }

  async readAllActivities() {
    const rows = (await this.sql`
      SELECT *
      FROM activity`) as Activity[];
    return rows;
  }

  async readActivityById({ id }: Id) {
    const rows = (await this.sql`
      SELECT *
      FROM activity
      WHERE activity_id = ${id}`) as Activity[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "activity", 404, "Not found");
    }
    return rows[0];
  }

  async updateActivityById(
    { id }: Id,
    partialActivity: PartialActivityWithoutId,
  ) {
    const name = partialActivity.activity_name ?? null;
    const description = partialActivity.activity_description ?? null;
    const start = partialActivity.activity_start
      ? new Date(partialActivity.activity_start)
      : null;
    const end = partialActivity.activity_end
      ? new Date(partialActivity.activity_end)
      : null;
    const realStart = partialActivity.activity_real_start
      ? new Date(partialActivity.activity_real_start)
      : null;
    const realEnd = partialActivity.activity_real_end
      ? new Date(partialActivity.activity_real_end)
      : null;
    const eventId = partialActivity.event_id ?? null;
    const roomId = partialActivity.room_id ?? null;

    if (start && end && start >= end) {
      throw new CustomError(
        "LOGIC",
        "activity",
        409,
        "Activity end needs to be older than its start",
      );
    }
    if (realStart && realEnd && realStart >= realEnd) {
      throw new CustomError(
        "LOGIC",
        "activity",
        409,
        "Activity real end needs to be older than its real start",
      );
    }
    const activity = await this.readActivityById({ id });
    if (
      (start && !end && start >= activity.activity_end) ||
      (end && !start && activity.activity_start >= end)
    ) {
      throw new CustomError(
        "LOGIC",
        "activity",
        409,
        `Activity's ${start ? "start" : "end"} needs to be ${start ? "before activity end" : "after activity start"}`,
      );
    }
    if (
      (realStart &&
        !realEnd &&
        activity.activity_real_end &&
        realStart >= activity.activity_real_end) ||
      (realEnd &&
        !realStart &&
        activity.activity_real_start &&
        activity.activity_real_start >= realEnd)
    ) {
      throw new CustomError(
        "LOGIC",
        "activity",
        409,
        `Activity's real ${realStart ? "start" : "end"} needs to be ${realStart ? "before activity real end" : "after activity  real start"}`,
      );
    }
    const event = await this.readEventById({
      id: eventId ?? activity.event_id,
    });
    if (
      (start && (start < event.event_start || start > event.event_end)) ||
      (end && (end < event.event_start || end > event.event_end))
    ) {
      throw new CustomError(
        "LOGIC",
        "activity",
        409,
        "Activity's end and start needs to be between his event's dates",
      );
    }

    const rows = (await this.sql`
      UPDATE activity
      SET
      activity_name = COALESCE(${name}, activity_name),
      activity_description = COALESCE(${description}, activity_description),
      activity_start = COALESCE(${start}, activity_start),
      activity_end = COALESCE(${end}, activity_end),
      activity_real_start = COALESCE(${realStart}, activity_real_start),
      activity_real_end = COALESCE(${realEnd}, activity_real_end),
      event_id = COALESCE(${eventId}, event_id),
      room_id = COALESCE(${roomId}, room_id)
      WHERE activity_id = ${id}
      RETURNING *`) as Activity[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "activity", 404, "Not found");
    }
    return rows[0];
  }

  async deleteActivityById({ id }: Id) {
    const rows = (await this.sql`
      DELETE FROM activity
      WHERE activity_id = ${id}
      RETURNING *`) as Activity[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "activity", 404, "Not found");
    }
    return rows[0];
  }

  // ----- Room -----

  async createRoom(newRoom: RoomWithoutId) {
    const rows = (await this.sql`
    INSERT INTO room
    (room_name, room_location, room_capacity)
    VALUES
    (${newRoom.room_name}, ${newRoom.room_location}, ${newRoom.room_capacity})
    RETURNING *`) as Room[];
    return rows[0];
  }

  async readRoom() {
    const rows = (await this.sql`
    SELECT * FROM room`) as Room[];
    return rows;
  }

  async readRoomById({ id }: Id) {
    const rows = (await this.sql`
    SELECT * FROM room
    WHERE room_id = ${id}`) as Room[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "room", 404, "Not found");
    }
    return rows[0];
  }

  async updateRoomById({ id }: Id, partialRoom: PartialRoomWithoutId) {
    const name = partialRoom.room_name ?? null;
    const location = partialRoom.room_location ?? null;
    const capacity = partialRoom.room_capacity ?? null;
    const rows = (await this.sql`
    UPDATE room
    SET
    room_name = COALESCE(${name}, room_name),
    room_location = COALESCE(${location}, room_location),
    room_capacity = COALESCE(${capacity}, room_capacity)
    WHERE room_id = ${id}
    RETURNING *`) as Room[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "room", 404, "Not found");
    }
    return rows[0];
  }

  async deleteRoomById({ id }: Id) {
    const rows = (await this.sql`
    DELETE FROM room
    WHERE room_id = ${id}
    RETURNING *`) as Room[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "room", 404, "Not found");
    }
    return rows[0];
  }

  // ----- Run -----

  async createRun(newRun: RunWithoutId) {
    const rows = (await this.sql`
    INSERT INTO Run
    (ref_user_profile_id, ref_activity_id)
    VALUES
    (${newRun.ref_user_profile_id}, ${newRun.ref_activity_id})
    RETURNING *`) as Run[];
    return rows[0];
  }

  async readRun() {
    const rows = (await this.sql`
    SELECT * FROM run`) as Run[];
    return rows;
  }

  async readRunById({ id }: Id) {
    const rows = (await this.sql`
    SELECT * FROM run
    WHERE run_id = ${id}`) as Run[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "run", 404, "Not found");
    }
    return rows[0];
  }

  async updateRunById(id: number, partialRun: PartialRunWithoutId) {
    const ref_user_profile_id = partialRun.ref_user_profile_id ?? null;
    const ref_activity_id = partialRun.ref_activity_id ?? null;
    const rows = (await this.sql`
    UPDATE run
    SET
    ref_user_profile_id = COALESCE(${ref_user_profile_id}, ref_user_profile_id)
    ref_activity_id = COALESCE(${ref_activity_id}, ref_activity_id)
    WHERE run_id = ${id}
    RETURNING *`) as Run[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "run", 404, "Not found");
    }
    return rows[0];
  }

  async deleteRunById({ id }: Id) {
    const rows = (await this.sql`
    DELETE FROM run
    WHERE run_id = ${id}
    RETURNING *`) as Run[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "run", 404, "Not found");
    }
    return rows[0];
  }

  // ----- Complex requests ------

  async readEventWithActivitiesByEventId({ id }: Id) {
    const rows = (await this.sql`
    SELECT
      event.*,
      json_agg(activity.*) AS activities
    FROM event
    LEFT JOIN activity ON activity.event_id = event.event_id
    WHERE event.event_id = ${id}
    GROUP BY event.event_id`) as EventWithActivities[];
    if (rows.length === 0) {
      throw new CustomError("POSTGRES", "event", 404, "Not found");
    }
    return rows[0];
  }

  async end() {
    return this.sql.end();
  }
}
