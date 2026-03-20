import z from "zod";

export const ZId = z.coerce.number().positive().int();

export const ZObjectId = z.object({
  id: ZId,
});

export type ObjectId = z.infer<typeof ZObjectId>;

export const ZUserAuth = z.object({
  user_auth_id: ZId,
  user_auth_login: z.string(),
  user_auth_password: z.string(),
  user_profile_id: ZId,
});
export const ZUserAuthWithoutId = ZUserAuth.omit({ user_auth_id: true });
export const ZUserAuthLogin = ZUserAuthWithoutId.omit({
  user_profile_id: true,
});
export const ZUserAuthWithoutPassword = ZUserAuth.omit({
  user_auth_password: true,
});
export const ZPartialUserAuthWithoutId = ZUserAuthWithoutId.partial();

export type UserAuth = z.infer<typeof ZUserAuth>;
export type UserAuthWithoutId = z.infer<typeof ZUserAuthWithoutId>;
export type UserAuthLogin = z.infer<typeof ZUserAuthLogin>;
export type PartialUserAuthWithoutId = z.infer<
  typeof ZPartialUserAuthWithoutId
>;
export type UserAuthWithoutPassword = z.infer<typeof ZUserAuthWithoutPassword>;

export const ZUserProfile = z.object({
  user_profile_id: ZId,
  user_profile_name: z.string(),
  user_profile_role: z.enum(["admin", "staff", "speaker", "guest"]),
});
export const ZUserProfileWithoutId = ZUserProfile.omit({
  user_profile_id: true,
});
export const ZPartialUserProfileWithoutId = ZUserProfileWithoutId.partial();

export type UserProfile = z.infer<typeof ZUserProfile>;
export type UserProfileWithoutId = z.infer<typeof ZUserProfileWithoutId>;
export type PartialUserProfileWithoutId = z.infer<
  typeof ZPartialUserProfileWithoutId
>;

export const ZRegister = z.object({
  user_profile_id: ZId,
  activity_id: ZId,
});

export type Register = z.infer<typeof ZRegister>;

export const ZEvent = z.object({
  event_id: ZId,
  event_name: z.string(),
  event_description: z.string(),
  event_start: z.coerce.date(),
  event_end: z.coerce.date(),
  user_profile_id: ZId,
});
export const ZEventWithoutId = ZEvent.omit({ event_id: true });
export const ZPartialEventWithoutId = ZEventWithoutId.partial();

export type Event = z.infer<typeof ZEvent>;
export type EventWithoutId = z.infer<typeof ZEventWithoutId>;
export type PartialEventWithoutId = z.infer<typeof ZPartialEventWithoutId>;

export const ZActivity = z.object({
  activity_id: ZId,
  activity_name: z.string(),
  activity_description: z.string(),
  activity_start: z.coerce.date(),
  activity_end: z.coerce.date(),
  activity_real_start: z.coerce.date().nullable(),
  activity_real_end: z.coerce.date().nullable(),
  event_id: ZId,
  room_id: ZId,
});
export const ZActivityWithoutId = ZActivity.omit({ activity_id: true });
export const ZPartialActivityWithoutId = ZActivityWithoutId.partial();

export type Activity = z.infer<typeof ZActivity>;
export type ActivityWithoutId = z.infer<typeof ZActivityWithoutId>;
export type PartialActivityWithoutId = z.infer<
  typeof ZPartialActivityWithoutId
>;

export const ZRoom = z.object({
  room_id: ZId,
  room_name: z.string(),
  room_location: z.string(),
  room_capacity: ZId,
});
export const ZRoomWithoutId = ZRoom.omit({ room_id: true });
export const ZPartialRoomWithoutId = ZRoomWithoutId.partial();

export type Room = z.infer<typeof ZRoom>;
export type RoomWithoutId = z.infer<typeof ZRoomWithoutId>;
export type PartialRoomWithoutId = z.infer<typeof ZPartialRoomWithoutId>;

export const ZRun = z.object({
  user_profile_id: ZId,
  activity_id: ZId,
});

export type Run = z.infer<typeof ZRun>;

export const ZQueue = z.object({
  position: z.coerce.number().int().positive(),
  user_profile_id: ZId,
  activity_id: ZId,
});
export const ZQueueWithoutPos = ZQueue.omit({ position: true });

export type Queue = z.infer<typeof ZQueue>;
export type QueueWihtoutPos = z.infer<typeof ZQueueWithoutPos>;

export const ZFavorite = z.object({
  user_profile_id: ZId,
  activity_id: ZId,
});

export type Favorite = z.infer<typeof ZFavorite>;

export const ZEventWithActivities = ZEvent.extend({
  activities: ZActivity.array(),
});

export type EventWithActivities = z.infer<typeof ZEventWithActivities>;

export const ZActivityWithEvent = ZActivity.extend({
  event: ZEvent,
});

export type ActivityWithEvent = z.infer<typeof ZActivityWithEvent>;

export const ZJwtClaims = z.object({
  sub: ZId,
  role: ZUserProfile.shape.user_profile_role,
  iat: z.number(),
  exp: z.number(),
});

export type JwtClaims = z.infer<typeof ZJwtClaims>;
export type CreateJwtOptions = Omit<JwtClaims, "iat" | "exp">;

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  /** invalid parameters or malformed syntax */
  BAD_REQUEST = 400,
  /** authentication required or invalid credentials */
  UNAUTHORIZED = 401,
  /** authenticated but lacking necessary permissions */
  FORBIDDEN = 403,
  /** Not found */
  NOT_FOUND = 404,
  /** conflit - logic error */
  CONFLICT = 409,
  /** Internal server error */
  INTERNAL_SERVER_ERROR = 500,
}
