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
