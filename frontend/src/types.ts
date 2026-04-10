export interface Event {
  event_id: number;
  event_name: string;
  event_description: string;
  event_start: string;
  event_end: string;
  user_profile_id: number;
}

export interface Activity {
  activity_id: number;
  activity_name: string;
  activity_description: string;
  activity_start: string;
  activity_end: string;
  activity_real_start: string | null;
  activity_real_end: string | null;
  event_id: number;
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
  is_checked_in?: boolean;
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

export interface Participant {
  user_profile_id: number;
  activity_id: number;
  is_checked_in: boolean;
  user_profile_name: string;
}

export type Category = "all" | "conference" | "atelier" | "networking";
export type Role = "admin" | "staff" | "speaker" | "guest";
