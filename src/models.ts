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

export type Event = {
  event_id: number;
  event_name: string;
  event_description: string;
  event_start: Date;
  event_end: Date;
  user_profile_id: number;
};

export type Activity = {
  activity_id: number;
  activity_name: string;
  activity_description: string;
  activity_start: Date;
  activity_end: Date;
  activity_real_start: Date | null;
  activity_real_end: Date | null;
  event_id: number;
  room_id: number;
};

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
