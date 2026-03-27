export interface Activity {
  activity_id: number;
  activity_name: string;
  activity_description: string;
  activity_start: string;
  activity_end: string;
  room_id: number;
}

export interface Room {
  room_id: number;
  room_name: string;
  room_location?: string;
  room_capacity: number;
}

export interface Run {
  user_profile_id: number;
  activity_id: number;
}

export interface UserProfile {
  user_profile_id: number;
  user_profile_name: string;
  user_profile_role: string;
}

export interface Register {
  user_profile_id: number;
  activity_id: number;
}

export interface Queue {
  position: number;
  user_profile_id: number;
  activity_id: number;
}

export interface Favorite {
  user_profile_id: number;
  activity_id: number;
}

export type Category = "all" | "conference" | "atelier" | "networking";
