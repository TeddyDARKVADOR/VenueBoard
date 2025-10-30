import z from "zod";

export const ZUserAuth = z.object({
  user_auth_id: z.coerce.number().positive().int(),
  user_auth_login: z.string(),
  user_auth_password: z.string(),
});

export type UserAuth = z.infer<typeof ZUserAuth>;

export const ZUserProfile = z.object({
  user_profile_id: z.coerce.number().positive().int(),
  user_profile_name: z.string(),
  user_profile_role: z.enum(["admin", "staff", "speaker", "guest"]),
  user_auth_id: z.coerce.number().positive().int(),
});

export type UserProfile = z.infer<typeof ZUserProfile>;

export const ZRegister = z.object({
  register_id: z.coerce.number().positive().int(),
  user_profile_id: z.coerce.number().positive().int(),
  activity_id: z.coerce.number().positive().int(),
});

export type Register = z.infer<typeof ZRegister>;

export const ZEvent = z.object({
  event_id: z.coerce.number().positive().int(),
  event_name: z.string(),
  event_description: z.string(),
  event_start: z.coerce.date(),
  event_end: z.coerce.date(),
  user_profile_id: z.coerce.number().positive().int(),
});

export type Event = z.infer<typeof ZEvent>;

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

export type Activity = z.infer<typeof ZActivity>;

export const ZRoom = z.object({
  room_id: z.coerce.number().positive().int(),
  room_name: z.string(),
  room_location: z.string(),
  room_capacity: z.coerce.number().positive().int(),
});

export type Room = z.infer<typeof ZRoom>;

export const ZRun = z.object({
  run_id: z.coerce.number().positive().int(),
  ref_user_profile_id: z.coerce.number().positive().int(),
  ref_activity_id: z.coerce.number().positive().int(),
});

export type Run = z.infer<typeof ZRun>;

export const ZEventWithActivities = z.object({
  event: z.object(ZEvent),
  activities: z.object(ZActivity[]),
});

export type EventWithActivities = z.infer<typeof ZEventWithActivities>;
