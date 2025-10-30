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
