BEGIN;

INSERT INTO user_auth (user_auth_id, user_auth_login, user_auth_password) VALUES
  (1, 'alice.manager', 'password_alice_hash'),
  (2, 'bob.speaker', 'password_bob_hash'),
  (3, 'carol.display', 'password_carol_hash'),
  (4, 'dave.speaker', 'password_dave_hash');

INSERT INTO user_profile (user_profile_id, user_profile_name, user_profile_role, ref_user_auth_id) VALUES
  (1, 'Alice Martin', 'manager', 1),
  (2, 'Bob Finch', 'speaker', 2),
  (3, 'Carol Dupont', 'display_operator', 3),
  (4, 'Dave Leroy', 'speaker', 4);

INSERT INTO event (event_id, event_name, event_description, start_at, end_at, ref_user_profile_id) VALUES
  (1, 'Paris Tech Con 2026', 'Technology fair with public talks and workshops', '2026-05-14 09:00:00+02', '2026-05-16 18:00:00+02', 1),
  (2, 'University Open Day', 'Open day with lab tours and live demos', '2026-06-03 10:00:00+02', '2026-06-03 17:00:00+02', 1);

INSERT INTO room (room_id, room_name, room_location, room_capacity) VALUES
  (1, 'Main Hall', 'Building A - Ground floor', 800),
  (2, 'Room 101', 'Building B - 1st floor', 120),
  (3, 'Demo Area', 'Building A - North Hall', 200);

INSERT INTO activity (activity_id, activity_name, activity_description, activity_start, activity_end, activity_real_start, activity_real_end, ref_event_id, ref_room_id) VALUES
  (1, 'Keynote AI Futures', 'Opening keynote on AI trends', '2026-05-14 10:00:00+02', '2026-05-14 11:00:00+02', NULL, NULL, 1, 1),
  (2, 'Rust Workshop for Beginners', 'Hands-on introduction to Rust', '2026-05-14 11:30:00+02', '2026-05-14 13:00:00+02', NULL, NULL, 1, 2),
  (3, 'Author Signing', 'Book signing session with queue', '2026-05-15 14:00:00+02', '2026-05-15 15:30:00+02', NULL, NULL, 1, 3),
  (4, 'Lab Guided Tour', 'Small group tours and demos', '2026-06-03 10:30:00+02', '2026-06-03 12:00:00+02', NULL, NULL, 2, 3);

ALTER TABLE activity ADD COLUMN IF NOT EXISTS capacity INT;
UPDATE activity SET capacity = 500 WHERE activity_id = 1;
UPDATE activity SET capacity = 20 WHERE activity_id = 2;
UPDATE activity SET capacity = 50 WHERE activity_id = 3;
UPDATE activity SET capacity = 15 WHERE activity_id = 4;

UPDATE activity SET activity_real_start = '2026-05-14 10:05:00+02', activity_real_end = '2026-05-14 11:02:00+02' WHERE activity_id = 1;
UPDATE activity SET activity_real_start = '2026-05-14 11:35:00+02' WHERE activity_id = 2;

INSERT INTO run (ref_user_profile_id, ref_activity_id) VALUES
  (2, 1),
  (4, 2),
  (2, 3);

INSERT INTO register (ref_user_profile_id, ref_activity_id) VALUES
  (1, 2),
  (3, 3),
  (1, 4);

INSERT INTO event (event_id, event_name, event_description, start_at, end_at, ref_user_profile_id) VALUES
  (3, 'Mini Games Fair', 'Games area with demos and tournaments', '2026-07-01 09:00:00+02', '2026-07-01 18:00:00+02', 1);

INSERT INTO room (room_id, room_name, room_location, room_capacity) VALUES
  (4, 'Games Zone', 'Building C - Basement', 300);

INSERT INTO activity (activity_id, activity_name, activity_description, activity_start, activity_end, ref_event_id, ref_room_id, capacity) VALUES
  (5, 'Retro Tournament', 'Elimination tournament of retro games', '2026-07-01 10:00:00+02', '2026-07-01 16:00:00+02', 3, 4, 64);

COMMIT;
