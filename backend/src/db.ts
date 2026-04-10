import * as argon2 from "argon2";
import postgres from "postgres";
import { ARGON2OPTS } from "./argon2_config.js";
import { CustomError } from "./custom_error.js";
import type * as model from "./models.js";
import { HttpStatus } from "./models.js";

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

  async createUserAuth(newUserAuth: model.UserAuthWithoutId) {
    const password = this.normalizePassword(newUserAuth.user_auth_password);
    const hash = await argon2.hash(password, ARGON2OPTS);
    const rows = (await this.sql`
    INSERT INTO user_auth
    (user_auth_login, user_auth_password, user_profile_id)
    VALUES
    (${newUserAuth.user_auth_login}, ${hash}, ${newUserAuth.user_profile_id})
    RETURNING user_auth_id, user_auth_login`) as model.UserAuthWithoutPassword[];
    return rows[0];
  }

  async readAllUserAuth() {
    const rows = (await this.sql`
      SELECT user_auth_id, user_auth_login
      FROM user_auth`) as model.UserAuthWithoutPassword[];
    return rows;
  }

  async readUserAuthById({ id }: model.ObjectId) {
    const rows = (await this.sql`
      SELECT user_auth_id, user_auth_login
      FROM user_auth
      WHERE user_auth_id = ${id}`) as model.UserAuthWithoutPassword[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "user_auth",
      );
    }
    return rows[0];
  }

  async updateUserAuthById(
    { id }: model.ObjectId,
    partialUserAuth: model.PartialUserAuthWithoutId,
  ) {
    const login = partialUserAuth.user_auth_login ?? null;
    const ref = partialUserAuth.user_profile_id ?? null;
    let hash = null;
    if (partialUserAuth.user_auth_password) {
      const password = this.normalizePassword(
        partialUserAuth.user_auth_password,
      );
      hash = await argon2.hash(password, ARGON2OPTS);
    }
    const rows = (await this.sql`
      UPDATE user_auth
      SET
      user_auth_login = COALESCE(${login}, user_auth_login),
      user_auth_password = COALESCE(${hash}, user_auth_password),
      user_profile_id = COALESCE(${ref}, user_profile_id)
      WHERE user_auth_id = ${id}
      RETURNING user_auth_id, user_auth_login`) as model.UserAuthWithoutPassword[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "user_auth",
      );
    }
    return rows[0];
  }

  async deleteUserAuthById({ id }: model.ObjectId) {
    const rows = (await this.sql`
      DELETE FROM user_auth
      WHERE user_auth_id = ${id}
      RETURNING user_auth_id, user_auth_login`) as model.UserAuthWithoutPassword[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "user_auth",
      );
    }
    return rows[0];
  }

  async loginUserAuth(user: model.UserAuthLogin) {
    const rows = (await this.sql`
      SELECT user_auth_password, user_profile_id
      FROM user_auth
      WHERE user_auth_login = ${user.user_auth_login}
    `) as { user_auth_password: string; user_profile_id: number }[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "user_auth",
      );
    }
    const password = this.normalizePassword(user.user_auth_password);
    if (await argon2.verify(rows[0].user_auth_password, password)) {
      return rows[0].user_profile_id;
    }
    return null;
  }

  private normalizePassword(password: string) {
    const normalized = password.normalize("NFKC");
    if (normalized.length < 1 || normalized.length > 1024) {
      throw new CustomError(
        "LOGIC",
        HttpStatus.CONFLICT,
        "invalid password length",
      );
    }
    return normalized;
  }

  // ----- UserProfile -----

  async createUserProfile(
    newUserProfile: model.UserProfileWithoutId,
    role: model.UserProfile["user_profile_role"] | undefined,
  ) {
    if (newUserProfile.user_profile_role !== "guest") {
      if (!role) {
        throw new CustomError("TOKEN", HttpStatus.UNAUTHORIZED, "unauthorized");
      }
      if (role !== "admin") {
        throw new CustomError(
          "TOKEN",
          HttpStatus.FORBIDDEN,
          "forbidden, only an admin can create un user profile with another role than guest",
        );
      }
    }
    const rows = (await this.sql`
      INSERT INTO user_profile
      (user_profile_name, user_profile_role)
      VALUES
      (${newUserProfile.user_profile_name},
      ${newUserProfile.user_profile_role})
      RETURNING *`) as model.UserProfile[];
    return rows[0];
  }

  async readAllUserProfile() {
    const rows = (await this.sql`
      SELECT *
      FROM user_profile`) as model.UserProfile[];
    return rows;
  }

  async readUserProfileById({ id }: model.ObjectId) {
    const rows = (await this.sql`
      SELECT *
      FROM user_profile
      WHERE user_profile_id = ${id}`) as model.UserProfile[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "user_profile",
      );
    }
    return rows[0];
  }

  async updateUserProfileById(
    { id }: model.ObjectId,
    partialUserProfile: model.PartialUserProfileWithoutId,
    role: model.UserProfile["user_profile_role"] | undefined,
  ) {
    if (!role) {
      throw new CustomError("TOKEN", HttpStatus.UNAUTHORIZED, "unauthorized");
    }
    const name = partialUserProfile.user_profile_name ?? null;
    const newRole = partialUserProfile.user_profile_role ?? null;
    if (newRole) {
      if (role !== "admin") {
        throw new CustomError(
          "TOKEN",
          HttpStatus.FORBIDDEN,
          "forbidden, only a admin can update a role",
        );
      }
    }
    const rows = (await this.sql`
      UPDATE user_profile
      SET
      user_profile_name = COALESCE(${name}, user_profile_name),
      user_profile_role = COALESCE(${newRole}, user_profile_role)
      WHERE user_profile_id = ${id}
      RETURNING *`) as model.UserProfile[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "user_profile",
      );
    }
    return rows[0];
  }

  async deleteUserProfileById({ id }: model.ObjectId) {
    const rows = await this.sql`
      DELETE FROM user_profile
      WHERE user_profile_id = ${id}
      RETURNING *`;
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "user_profile",
      );
    }
    return rows[0];
  }

  //----- Register -----

  async createRegister(register: model.Register) {
    if (
      (await this.remainingSeatsInActivityById({ id: register.activity_id })) <=
      0
    ) {
      throw new CustomError("LOGIC", HttpStatus.CONFLICT, "no remaining seats");
    }
    await this.canRegister(register);
    const rows = (await this.sql`
    INSERT INTO register
    (user_profile_id, activity_id)
    VALUES
    (${register.user_profile_id} , ${register.activity_id})
    RETURNING *`) as model.Register[];
    return rows[0];
  }

  private async canRegister(register: model.Register) {
    const activity = await this.readActivityById({ id: register.activity_id });
    const act_start = activity.activity_real_start ?? activity.activity_start;
    if (act_start < new Date()) {
      throw new CustomError(
        "LOGIC",
        HttpStatus.CONFLICT,
        "cannot register to an activity that have already started",
      );
    }
    const registered_activities =
      await this.readAllRegisteredActivitiesByUserProfileId({
        id: register.user_profile_id,
      });
    const act_end = activity.activity_real_end ?? activity.activity_end;
    for (const curr of registered_activities) {
      const curr_start = curr.activity_real_start ?? curr.activity_start;
      const curr_end = curr.activity_real_end ?? curr.activity_end;
      if (act_start < curr_end && act_end > curr_start) {
        throw new CustomError(
          "LOGIC",
          HttpStatus.CONFLICT,
          `this activity overlap your already registered activity: '${curr.activity_name}'`,
        );
      }
    }
  }

  async readAllRegister() {
    const rows = (await this.sql`
    SELECT *
    FROM register`) as model.RegisterWithCheckin[];
    return rows;
  }

  async deleteRegister(register: model.Register) {
    const rows = (await this.sql`
    DELETE FROM register
    WHERE user_profile_id = ${register.user_profile_id}
    AND activity_id = ${register.activity_id}
    RETURNING *`) as model.Register[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "register",
      );
    }
    return rows[0];
  }

  // ----- Event -----

  async createEvent(newEvent: model.EventWithoutId) {
    if (newEvent.event_start >= newEvent.event_end) {
      throw new CustomError(
        "LOGIC",
        HttpStatus.CONFLICT,
        "Event end needs to be older than its start",
        "event",
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
      RETURNING *`) as model.Event[];
    return rows[0];
  }

  async readAllEvents() {
    const rows = (await this.sql`
      SELECT *
      FROM event`) as model.Event[];
    return rows;
  }

  async readEventById({ id }: model.ObjectId) {
    const rows = (await this.sql`
      SELECT *
      FROM event
      WHERE event_id = ${id}`) as model.Event[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "event",
      );
    }
    return rows[0];
  }

  async updateEventById(
    { id }: model.ObjectId,
    partialEvent: model.PartialEventWithoutId,
  ) {
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
      HttpStatus.CONFLICT,
      "Event end needs to be older than its start",
      "event",
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
      RETURNING *`) as model.Event[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "event",
      );
    }
    return rows[0];
  }

  async deleteEventById({ id }: model.ObjectId) {
    const rows = (await this.sql`
      DELETE FROM event
      WHERE event_id = ${id}
      RETURNING *`) as model.Event[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "event",
      );
    }
    return rows[0];
  }

  // ----- Activity -----

  async createActivity(newActivity: model.ActivityWithoutId) {
    if (newActivity.activity_start >= newActivity.activity_end) {
      throw new CustomError(
        "LOGIC",
        HttpStatus.CONFLICT,
        "Activity end needs to be older than its start",
        "activity",
      );
    }
    if (
      newActivity.activity_real_start &&
      newActivity.activity_real_end &&
      newActivity.activity_real_start >= newActivity.activity_real_end
    ) {
      throw new CustomError(
        "LOGIC",
        HttpStatus.CONFLICT,
        "Activity real end needs to be older than its real start",
        "activity",
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
        HttpStatus.CONFLICT,
        "Activity's end and start needs to be between his event's dates",
        "activity",
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
      RETURNING *`) as model.Activity[];
    return rows[0];
  }

  async readAllActivities() {
    const rows = (await this.sql`
      SELECT *
      FROM activity`) as model.Activity[];
    return rows;
  }

  async readActivityById({ id }: model.ObjectId) {
    const rows = (await this.sql`
      SELECT *
      FROM activity
      WHERE activity_id = ${id}`) as model.Activity[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "activity",
      );
    }
    return rows[0];
  }

  async updateActivityById(
    { id }: model.ObjectId,
    partialActivity: model.PartialActivityWithoutId,
    role: model.UserProfile["user_profile_role"] | undefined,
  ) {
    if (!role) {
      throw new CustomError("LOGIC", HttpStatus.UNAUTHORIZED, "unauthorized");
    }
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
    if (
      role === "speaker" &&
      (name || description || start || end || eventId || roomId)
    ) {
      throw new CustomError(
        "LOGIC",
        HttpStatus.FORBIDDEN,
        "forbidden, a speaker can only update real start and real end",
      );
    }

    if (start && end && start >= end) {
      throw new CustomError(
        "LOGIC",
        HttpStatus.CONFLICT,
        "Activity end needs to be older than its start",
        "activity",
      );
    }
    if (realStart && realEnd && realStart >= realEnd) {
      throw new CustomError(
        "LOGIC",
        HttpStatus.CONFLICT,
        "Activity real end needs to be older than its real start",
        "activity",
      );
    }
    const activity = await this.readActivityById({ id });
    if (
      (start && !end && start >= activity.activity_end) ||
      (end && !start && activity.activity_start >= end)
    ) {
      throw new CustomError(
        "LOGIC",
        HttpStatus.CONFLICT,
        `Activity's ${start ? "start" : "end"} needs to be ${start ? "before activity end" : "after activity start"}`,
        "activity",
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
        HttpStatus.CONFLICT,
        `Activity's real ${realStart ? "start" : "end"} needs to be ${realStart ? "before activity real end" : "after activity  real start"}`,
        "activity",
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
        HttpStatus.CONFLICT,
        "Activity's end and start needs to be between his event's dates",
        "activity",
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
      RETURNING *`) as model.Activity[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "activity",
      );
    }
    return rows[0];
  }

  async deleteActivityById({ id }: model.ObjectId) {
    const rows = (await this.sql`
      DELETE FROM activity
      WHERE activity_id = ${id}
      RETURNING *`) as model.Activity[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "activity",
      );
    }
    return rows[0];
  }

  // ----- Room -----

  async createRoom(newRoom: model.RoomWithoutId) {
    const rows = (await this.sql`
    INSERT INTO room
    (room_name, room_location, room_capacity)
    VALUES
    (${newRoom.room_name}, ${newRoom.room_location}, ${newRoom.room_capacity})
    RETURNING *`) as model.Room[];
    return rows[0];
  }

  async readAllRooms() {
    const rows = (await this.sql`
    SELECT * FROM room`) as model.Room[];
    return rows;
  }

  async readRoomById({ id }: model.ObjectId) {
    const rows = (await this.sql`
    SELECT * FROM room
    WHERE room_id = ${id}`) as model.Room[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "room",
      );
    }
    return rows[0];
  }

  async updateRoomById(
    { id }: model.ObjectId,
    partialRoom: model.PartialRoomWithoutId,
  ) {
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
    RETURNING *`) as model.Room[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "room",
      );
    }
    return rows[0];
  }

  async deleteRoomById({ id }: model.ObjectId) {
    const rows = (await this.sql`
    DELETE FROM room
    WHERE room_id = ${id}
    RETURNING *`) as model.Room[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "room",
      );
    }
    return rows[0];
  }

  // ----- Run -----

  async createRun(newRun: model.Run) {
    const rows = (await this.sql`
    INSERT INTO Run
    (user_profile_id, activity_id)
    VALUES
    (${newRun.user_profile_id}, ${newRun.activity_id})
    RETURNING *`) as model.Run[];
    return rows[0];
  }

  async readAllRuns() {
    const rows = (await this.sql`
    SELECT * FROM run`) as model.Run[];
    return rows;
  }

  async deleteRun(run: model.Run) {
    const rows = (await this.sql`
    DELETE FROM run
    WHERE user_profile_id = ${run.user_profile_id}
    AND activity_id = ${run.activity_id}
    RETURNING *`) as model.Run[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "run",
      );
    }
    return rows[0];
  }

  // ----- Favorite -----

  async createFavorite(favorite: model.Favorite) {
    const rows = (await this.sql`
      INSERT INTO favorite
      (user_profile_id, activity_id)
      VALUES
      (${favorite.user_profile_id}, ${favorite.activity_id})
      RETURNING *`) as model.Favorite[];
    return rows[0];
  }

  async readAllFavorites() {
    const rows = (await this.sql`
      SELECT *
      FROM favorite`) as model.Favorite[];
    return rows;
  }

  async deleteFavorite(favorite: model.Favorite) {
    const rows = (await this.sql`
      DELETE FROM favorite
      WHERE user_profile_id = ${favorite.user_profile_id}
      AND activity_id = ${favorite.activity_id}
      RETURNING *`) as model.Favorite[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "favorite",
      );
    }
    return rows[0];
  }

  // ----- Queue -----

  async createQueue(queue: model.QueueWithoutPos) {
    await this.canRegister(queue as model.Register);
    const position = await this.getNextPositionForActivityId({
      id: queue.activity_id,
    });
    const rows = (await this.sql`
      INSERT INTO queue
      (position, user_profile_id, activity_id)
      VALUES
      (${position} ,${queue.user_profile_id}, ${queue.activity_id})
      RETURNING *`) as model.Queue[];
    return rows[0];
  }

  async readAllQueues() {
    const rows = (await this.sql`
      SELECT *
      FROM queue`) as model.Queue[];
    return rows;
  }

  async deleteQueue(queue: model.QueueWithoutPos) {
    const rows = (await this.sql`
      DELETE FROM queue
      WHERE user_profile_id = ${queue.user_profile_id}
      AND activity_id = ${queue.activity_id}
      RETURNING *`) as model.Queue[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "queue",
      );
    }
    return rows[0];
  }

  async queueToRegister() {
    const activity_ids = (await this.sql`
      SELECT activity_id
      FROM queue`) as { activity_id: number }[];
    const activities_and_seats: {
      activity_id: number;
      seats_available: number;
    }[] = [];

    for (const act_id of activity_ids) {
      activities_and_seats.push({
        activity_id: act_id.activity_id,
        seats_available: await this.remainingSeatsInActivityById({
          id: act_id.activity_id,
        }),
      });
    }

    for (const curr of activities_and_seats) {
      if (curr.seats_available <= 0) continue;
      const user_profile_ids = await this.readNUserProfileIdInQueueByActivityId(
        curr.seats_available,
        { id: curr.activity_id },
      );
      for (const id of user_profile_ids) {
        try {
          await this.createRegister({
            user_profile_id: id,
            activity_id: curr.activity_id,
          });
        } catch (error) {
          const err = error as CustomError;
          console.log(
            `queue to register: user with id: '${id}' could not register: ${err.message}`,
          );
        }
        await this.sql`
            DELETE FROM queue
            WHERE user_profile_id = ${id} AND activity_id = ${curr.activity_id}`;
      }
    }
  }

  async cleanPosition() {
    const activity_ids = (
      await this.sql`
      SELECT activity_id
      FROM queue`
    ).map((curr) => curr.activity_id) as number[];
    for (const activity_id of activity_ids) {
      const user_profile_ids = (
        await this.sql`
        SELECT user_profile_id
        FROM queue
        WHERE activity_id = ${activity_id}`
      ).map((curr) => curr.user_profile_id) as number[];
      let pos = 1;
      for (const user_profile_id of user_profile_ids) {
        await this.sql`
        UPDATE queue
        SET position = ${pos}
        WHERE user_profile_id = ${user_profile_id}`;
        pos += 1;
      }
    }
  }

  async checkInParticipant(register: model.Register) {
    const rows = (await this.sql`
      UPDATE register
      SET is_checked_in = TRUE
      WHERE user_profile_id = ${register.user_profile_id}
      AND activity_id = ${register.activity_id}
      RETURNING *`) as model.RegisterWithCheckin[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "register",
      );
    }
    return rows[0];
  }

  async readParticipantsByActivityId({ id }: model.ObjectId) {
    const rows = (await this.sql`
      SELECT r.user_profile_id, r.activity_id, r.is_checked_in,
             up.user_profile_name
      FROM register r
      JOIN user_profile up ON r.user_profile_id = up.user_profile_id
      WHERE r.activity_id = ${id}
      ORDER BY up.user_profile_name`) as model.Participant[];
    return rows;
  }

  // ----- Complex requests ------

  async readEventWithActivitiesByEventId({ id }: model.ObjectId) {
    const rows = (await this.sql`
    SELECT
      event.*,
      json_agg(activity.*) AS activities
    FROM event
    LEFT JOIN activity ON activity.event_id = event.event_id
    WHERE event.event_id = ${id}
    GROUP BY event.event_id`) as model.EventWithActivities[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "event",
      );
    }
    return rows[0];
  }

  async readActivityWithEventByActivityId({ id }: model.ObjectId) {
    const rows = (await this.sql`
     SELECT
  activity.*,
  row_to_json(event) AS event
FROM activity
LEFT JOIN event ON activity.event_id = event.event_id
WHERE activity.activity_id = ${id}`) as model.ActivityWithEvent[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "event",
      );
    }
    return rows[0];
  }

  async remainingSeatsInActivityById({ id }: model.ObjectId) {
    const rows = (await this.sql`
       SELECT
        room.room_capacity - COUNT(register.activity_id) AS remaining_seats
      FROM room
      JOIN activity ON activity.room_id = room.room_id
      LEFT JOIN register ON register.activity_id = activity.activity_id
      WHERE activity.activity_id = ${id}
      GROUP BY room.room_capacity;
      `) as { remaining_seats: number }[];
    if (rows.length === 0) {
      throw new CustomError(
        "POSTGRES",
        HttpStatus.NOT_FOUND,
        "Not found",
        "activity",
      );
    }
    return rows[0].remaining_seats;
  }

  async readAllRegisteredActivitiesByUserProfileId({ id }: model.ObjectId) {
    const rows = (await this.sql`
    SELECT activity.*
    FROM activity
    JOIN register on activity.activity_id = register.activity_id
    WHERE register.user_profile_id = ${id};
      `) as model.Activity[];
    return rows;
  }

  async readNUserProfileIdInQueueByActivityId(
    n: number,
    { id }: model.ObjectId,
  ) {
    const rows = (await this.sql`
      SELECT user_profile_id
      FROM queue
      WHERE activity_id = ${id}
      ORDER BY position
      LIMIT ${n};`) as { user_profile_id: number }[];
    return rows.map((curr) => curr.user_profile_id);
  }

  async getNextPositionForActivityId({ id }: model.ObjectId) {
    const rows = (await this.sql`
      SELECT position
      FROM queue
      WHERE activity_id = ${id}
      ORDER BY position DESC
      LIMIT 1;`) as { position: number }[];
    if (rows.length === 0) {
      return 1;
    }
    return rows[0].position + 1;
  }

  async end() {
    return this.sql.end();
  }
}
