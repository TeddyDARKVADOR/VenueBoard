import z from "zod";

export const ZId = z.object({
  id: z.coerce.number().positive().int(),
});

export type Id = z.infer<typeof ZId>;

export const ZUserAuth = z.object({
  user_auth_id: z.coerce.number().positive().int(),
  user_auth_login: z.string(),
  user_auth_password: z.string(),
  user_profile_id: z.coerce.number().positive().int(),
});
export const ZUserAuthWithoutId = ZUserAuth.omit({ user_auth_id: true });
export const ZUserAuthWithoutPassword = ZUserAuth.omit({
  user_auth_password: true,
});
export const ZPartialUserAuthWithoutId = ZUserAuthWithoutId.partial();

export type UserAuth = z.infer<typeof ZUserAuth>;
export type UserAuthWithoutId = z.infer<typeof ZUserAuthWithoutId>;
export type PartialUserAuthWithoutId = z.infer<
  typeof ZPartialUserAuthWithoutId
>;
export type UserAuthWithoutPassword = z.infer<typeof ZUserAuthWithoutPassword>;

export const ZUserProfile = z.object({
  user_profile_id: z.coerce.number().positive().int(),
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
  register_id: z.coerce.number().positive().int(),
  user_profile_id: z.coerce.number().positive().int(),
  activity_id: z.coerce.number().positive().int(),
});
export const ZRegisterWithoutId = ZRegister.omit({ register_id: true });
export const ZPartialRegisterWithoutId = ZRegisterWithoutId.partial();

export type Register = z.infer<typeof ZRegister>;
export type RegisterWithoutId = z.infer<typeof ZRegisterWithoutId>;
export type PartialRegisterWithoutId = z.infer<
  typeof ZPartialRegisterWithoutId
>;

export const ZEvent = z.object({
  event_id: z.coerce.number().positive().int(),
  event_name: z.string(),
  event_description: z.string(),
  event_start: z.coerce.date(),
  event_end: z.coerce.date(),
  user_profile_id: z.coerce.number().positive().int(),
});
export const ZEventWithoutId = ZEvent.omit({ event_id: true });
export const ZPartialEventWithoutId = ZEventWithoutId.partial();

export type Event = z.infer<typeof ZEvent>;
export type EventWithoutId = z.infer<typeof ZEventWithoutId>;
export type PartialEventWithoutId = z.infer<typeof ZPartialEventWithoutId>;

export const ZActivity = z.object({
  activity_id: z.coerce.number().positive().int(),
  activity_name: z.string(),
  activity_description: z.string(),
  activity_start: z.coerce.date(),
  activity_end: z.coerce.date(),
  activity_real_start: z.coerce.date().nullable(),
  activity_real_end: z.coerce.date().nullable(),
  event_id: z.coerce.number().positive().int(),
  room_id: z.coerce.number().positive().int(),
});
export const ZActivityWithoutId = ZActivity.omit({ activity_id: true });
export const ZPartialActivityWithoutId = ZActivityWithoutId.partial();

export type Activity = z.infer<typeof ZActivity>;
export type ActivityWithoutId = z.infer<typeof ZActivityWithoutId>;
export type PartialActivityWithoutId = z.infer<
  typeof ZPartialActivityWithoutId
>;

export const ZRoom = z.object({
  room_id: z.coerce.number().positive().int(),
  room_name: z.string(),
  room_location: z.string(),
  room_capacity: z.coerce.number().positive().int(),
});
export const ZRoomWithoutId = ZRoom.omit({ room_id: true });
export const ZPartialRoomWithoutId = ZRoomWithoutId.partial();

export type Room = z.infer<typeof ZRoom>;
export type RoomWithoutId = z.infer<typeof ZRoomWithoutId>;
export type PartialRoomWithoutId = z.infer<typeof ZPartialRoomWithoutId>;

export const ZRun = z.object({
  run_id: z.coerce.number().positive().int(),
  ref_user_profile_id: z.coerce.number().positive().int(),
  ref_activity_id: z.coerce.number().positive().int(),
});
export const ZRunWithoutId = ZRun.omit({ run_id: true });
export const ZPartialRunWithoutId = ZRunWithoutId.partial();

export type Run = z.infer<typeof ZRun>;
export type RunWithoutId = z.infer<typeof ZRunWithoutId>;
export type PartialRunWithoutId = z.infer<typeof ZPartialRunWithoutId>;

export const ZEventWithActivities = ZEvent.extend({
  activities: ZActivity.array(),
});

export type EventWithActivities = z.infer<typeof ZEventWithActivities>;
