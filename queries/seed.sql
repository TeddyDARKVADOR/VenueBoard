BEGIN;

INSERT INTO user_profile (user_profile_name, user_profile_role) VALUES
  ('Alice Martin', 'manager'),
  ('Bob Finch', 'speaker'),
  ('Carol Dupont', 'display_operator'),
  ('Dave Leroy', 'speaker');

INSERT INTO user_auth (user_auth_login, user_auth_password, user_profile_id) VALUES
  ('alice.manager', 'password_alice_hash', 1),
  ('bob.speaker', 'password_bob_hash', 2),
  ('carol.display', 'password_carol_hash', 3),
  ('dave.speaker', 'password_dave_hash', 4);

INSERT INTO event (event_name, event_description, event_start, event_end, user_profile_id) VALUES
  ('Paris Tech Con 2026', 'Technology fair with public talks and workshops', '2026-05-14 09:00:00+02', '2026-05-16 18:00:00+02', 1),
  ('University Open Day', 'Open day with lab tours and live demos', '2026-06-03 10:00:00+02', '2026-06-03 17:00:00+02', 1);

INSERT INTO room (room_name, room_location, room_capacity) VALUES
  ('Main Hall', 'Building A - Ground floor', 800),
  ('Room 101', 'Building B - 1st floor', 120),
  ('Demo Area', 'Building A - North Hall', 200);

INSERT INTO activity (activity_name, activity_description, activity_start, activity_end, activity_real_start, activity_real_end, event_id, room_id) VALUES
  ('Keynote AI Futures', 'Opening keynote on AI trends', '2026-05-14 10:00:00+02', '2026-05-14 11:00:00+02', NULL, NULL, 1, 1),
  ('Rust Workshop for Beginners', 'Hands-on introduction to Rust', '2026-05-14 11:30:00+02', '2026-05-14 13:00:00+02', NULL, NULL, 1, 2),
  ('Author Signing', 'Book signing session with queue', '2026-05-15 14:00:00+02', '2026-05-15 15:30:00+02', NULL, NULL, 1, 3),
  ('Lab Guided Tour', 'Small group tours and demos', '2026-06-03 10:30:00+02', '2026-06-03 12:00:00+02', NULL, NULL, 2, 3);

UPDATE activity SET activity_real_start = '2026-05-14 10:05:00+02', activity_real_end = '2026-05-14 11:02:00+02' WHERE activity_id = 1;
UPDATE activity SET activity_real_start = '2026-05-14 11:35:00+02' WHERE activity_id = 2;

INSERT INTO run (user_profile_id, activity_id) VALUES
  (2, 1),
  (4, 2),
  (2, 3);

INSERT INTO register (user_profile_id, activity_id) VALUES
  (1, 2),
  (3, 3),
  (1, 4);

INSERT INTO event (event_name, event_description, event_start, event_end, user_profile_id) VALUES
  ('Mini Games Fair', 'Games area with demos and tournaments', '2026-07-01 09:00:00+02', '2026-07-01 18:00:00+02', 1);

INSERT INTO room (room_name, room_location, room_capacity) VALUES
  ('Games Zone', 'Building C - Basement', 300);

INSERT INTO activity (activity_name, activity_description, activity_start, activity_end, event_id, room_id) VALUES
  ('Retro Tournament', 'Elimination tournament of retro games', '2026-07-01 10:00:00+02', '2026-07-01 16:00:00+02', 3, 4);

COMMIT;
