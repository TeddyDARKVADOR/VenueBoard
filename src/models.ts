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
