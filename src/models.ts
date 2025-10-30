export type UserAuth = {
  user_auth_id: number;
  user_auth_login: string;
  user_auth_password: string;
};

export type UserProfile = {
  user_profile_id: number;
  user_profile_name: string;
  user_profile_role: string;
  ref_suer_auth_id: number;
};

export type Event = {
  event_id: number;
  event_name: string;
  event_description: string;
  start_at: Date;
  end_at: Date;
  ref_user_profile_id: number;
}

export type Activity = {
  activity_id: number;
  activity_name: string;
  activity_description: string;
  activity_start: Date;
  activity_end: Date;
  activity_real_start: Date | null;
  activity_real_end: Date | null;
  ref_event_id: number;
  ref_room_id: number;
};
