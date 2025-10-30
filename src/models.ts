import z from "zod";

export type UserAuth = {
  user_auth_id: number;
  user_auth_login: string;
  user_auth_password: string;
};

export type UserProfile = {
  user_profile_id: number;
  user_profile_name: string;
  user_profile_role: string;
  user_auth_id: number;
};

export type Register = {
  register_id: number;
  user_profile_id: number;
  activity_id: number;
};

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

export type Room = {
  room_id: number;
  room_name: string;
  room_location: string;
  room_capacity: number;
};

export type Run = {
  run_id: number;
  ref_user_profile_id: number;
  ref_activity_id: number;
};

export type EventWithActivities = {
  event: Event;
  activities: Activity[];
};
