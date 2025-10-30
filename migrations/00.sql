CREATE TABLE IF NOT EXISTS user_auth (
  user_auth_id SERIAL PRIMARY KEY,
  user_auth_login TEXT NOT NULL UNIQUE,
  user_auth_password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profile (
  user_profile_id SERIAL PRIMARY KEY,
  user_profile_name TEXT NOT NULL,
  user_profile_role TEXT NOT NULL,
  user_auth_id INT NOT NULL REFERENCES user_auth(user_auth_id)
);

CREATE TABLE IF NOT EXISTS event (
  event_id SERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_description TEXT NOT NULL,
  event_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  event_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_profile_id INT NOT NULL REFERENCES user_profile(user_profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS room (
  room_id SERIAL PRIMARY KEY,
  room_name TEXT NOT NULL,
  room_location TEXT NOT NULL,
  room_capacity INT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  activity_id SERIAL PRIMARY KEY,
  activity_name TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  activity_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activity_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activity_real_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  activity_real_end TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  event_id INT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
  room_id INT NOT NULL REFERENCES room(room_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS run (
  run_id SERIAL PRIMARY KEY,
  user_profile_id INT NOT NULL REFERENCES user_profile(user_profile_id) ON DELETE CASCADE,
  activity_id INT NOT NULL REFERENCES activity(activity_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS register (
  register_id SERIAL PRIMARY KEY,
  user_profile_id INT NOT NULL REFERENCES user_profile(user_profile_id) ON DELETE CASCADE,
  activity_id INT NOT NULL REFERENCES activity(activity_id) ON DELETE CASCADE
);
