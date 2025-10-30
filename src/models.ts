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
