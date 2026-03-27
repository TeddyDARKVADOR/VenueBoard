import * as argon2 from "argon2";
import * as dotenv from "dotenv";
import postgres from "postgres";
import { ARGON2OPTS } from "./argon2_config.js";

dotenv.config();

async function seed() {
  const sql = postgres({
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });

  console.log("Seeding database...");

  // Hash passwords
  const passwords = {
    admin: await argon2.hash("admin123".normalize("NFKC"), ARGON2OPTS),
    staff: await argon2.hash("staff123".normalize("NFKC"), ARGON2OPTS),
    speaker1: await argon2.hash("speaker123".normalize("NFKC"), ARGON2OPTS),
    speaker2: await argon2.hash("speaker456".normalize("NFKC"), ARGON2OPTS),
    guest1: await argon2.hash("guest123".normalize("NFKC"), ARGON2OPTS),
    guest2: await argon2.hash("guest456".normalize("NFKC"), ARGON2OPTS),
    guest3: await argon2.hash("guest789".normalize("NFKC"), ARGON2OPTS),
  };

  // Clean existing data (reverse FK order)
  await sql`DELETE FROM queue`;
  await sql`DELETE FROM favorite`;
  await sql`DELETE FROM register`;
  await sql`DELETE FROM run`;
  await sql`DELETE FROM activity`;
  await sql`DELETE FROM event`;
  await sql`DELETE FROM room`;
  await sql`DELETE FROM user_auth`;
  await sql`DELETE FROM user_profile`;

  // Reset sequences
  await sql`ALTER SEQUENCE user_profile_user_profile_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE user_auth_user_auth_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE event_event_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE room_room_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE activity_activity_id_seq RESTART WITH 1`;

  // ===== User Profiles =====
  await sql`
    INSERT INTO user_profile (user_profile_name, user_profile_role) VALUES
      ('Alexandre Dupuis', 'admin'),
      ('Marie Laurent', 'staff'),
      ('Sarah Chen', 'speaker'),
      ('Marcus Johnson', 'speaker'),
      ('Dr. Amelia Torres', 'speaker'),
      ('James Lee', 'speaker'),
      ('Nina Patel', 'speaker'),
      ('Thomas Bernard', 'guest'),
      ('Sophie Martin', 'guest'),
      ('Lucas Moreau', 'guest')
  `;

  // ===== User Auths =====
  await sql`
    INSERT INTO user_auth (user_auth_login, user_auth_password, user_profile_id) VALUES
      ('admin', ${passwords.admin}, 1),
      ('staff', ${passwords.staff}, 2),
      ('sarah.chen', ${passwords.speaker1}, 3),
      ('marcus.j', ${passwords.speaker2}, 4),
      ('amelia.t', ${passwords.speaker1}, 5),
      ('james.lee', ${passwords.speaker2}, 6),
      ('nina.p', ${passwords.speaker1}, 7),
      ('thomas', ${passwords.guest1}, 8),
      ('sophie', ${passwords.guest2}, 9),
      ('lucas', ${passwords.guest3}, 10)
  `;

  // ===== Rooms =====
  await sql`
    INSERT INTO room (room_name, room_location, room_capacity) VALUES
      ('Salle 3A', 'Bâtiment A - 3ème étage', 50),
      ('Salle 1B', 'Bâtiment B - 1er étage', 30),
      ('Grand Amphithéâtre', 'Bâtiment Principal', 100),
      ('Salle Workshop', 'Bâtiment C - RDC', 25),
      ('Espace Networking', 'Hall Central', 200)
  `;

  // ===== Events =====
  await sql`
    INSERT INTO event (event_name, event_description, event_start, event_end, user_profile_id) VALUES
      ('Tech Conference 2026', 'Conférence annuelle sur les nouvelles technologies, le design et l''innovation.', '2026-03-20 09:00:00+01', '2026-03-20 18:00:00+01', 1),
      ('Workshop Week', 'Semaine dédiée aux ateliers pratiques et formations.', '2026-03-23 09:00:00+01', '2026-03-27 17:00:00+01', 1)
  `;

  // ===== Activities =====
  await sql`
    INSERT INTO activity (activity_name, activity_description, activity_start, activity_end, activity_real_start, activity_real_end, event_id, room_id) VALUES
      ('Design Systems at Scale', 'Découvrez comment construire et maintenir un design system à grande échelle. Sarah Chen, Lead Designer chez Figma, partage son expérience sur la création de systèmes de design cohérents pour des équipes distribuées.', '2026-03-20 09:00:00+01', '2026-03-20 10:30:00+01', NULL, NULL, 1, 1),
      ('UX Research Methods Workshop', 'Atelier pratique sur les méthodes de recherche UX modernes. Apprenez à conduire des interviews utilisateurs, des tests d''utilisabilité et à analyser les données qualitatives.', '2026-03-20 10:45:00+01', '2026-03-20 12:00:00+01', NULL, NULL, 1, 2),
      ('Networking Lunch', 'Session ouverte de networking autour d''un déjeuner. Rencontrez les speakers et les autres participants dans un cadre décontracté.', '2026-03-20 12:00:00+01', '2026-03-20 13:00:00+01', NULL, NULL, 1, 5),
      ('AI in Product Design', 'Comment l''intelligence artificielle transforme le design produit. Dr. Amelia Torres explore les nouvelles possibilités offertes par les outils IA pour les designers.', '2026-03-20 13:30:00+01', '2026-03-20 15:00:00+01', NULL, NULL, 1, 1),
      ('Accessibility Best Practices', 'Atelier sur les bonnes pratiques d''accessibilité web. James Lee présente les techniques essentielles pour créer des interfaces accessibles à tous.', '2026-03-20 15:15:00+01', '2026-03-20 16:30:00+01', NULL, NULL, 1, 2),
      ('Future of Mobile Interfaces', 'Conférence sur l''avenir des interfaces mobiles. Nina Patel partage sa vision des tendances émergentes et des nouvelles interactions.', '2026-03-20 16:45:00+01', '2026-03-20 18:00:00+01', NULL, NULL, 1, 1),
      ('React Advanced Patterns', 'Plongez dans les patterns avancés de React : render props, compound components, state machines et plus encore.', '2026-03-23 09:00:00+01', '2026-03-23 11:00:00+01', NULL, NULL, 2, 4),
      ('API Design Workshop', 'Atelier pratique sur la conception d''APIs RESTful robustes et bien documentées.', '2026-03-23 14:00:00+01', '2026-03-23 16:00:00+01', NULL, NULL, 2, 4)
  `;

  // ===== Runs (speakers assigned to activities) =====
  await sql`
    INSERT INTO run (user_profile_id, activity_id) VALUES
      (3, 1),
      (4, 2),
      (5, 4),
      (6, 5),
      (7, 6),
      (3, 7),
      (4, 8)
  `;

  // ===== Registers (guests registered to activities) =====
  await sql`
    INSERT INTO register (user_profile_id, activity_id) VALUES
      (8, 1), (9, 1), (10, 1),
      (8, 2), (9, 2), (10, 2),
      (8, 3), (9, 3), (10, 3),
      (8, 4), (9, 4), (10, 4),
      (8, 5), (9, 5), (10, 5),
      (8, 6), (10, 6),
      (1, 1), (1, 4), (2, 3)
  `;

  // ===== Favorites =====
  await sql`
    INSERT INTO favorite (user_profile_id, activity_id) VALUES
      (8, 1), (8, 2), (8, 4), (8, 5), (8, 6),
      (9, 1), (9, 3),
      (10, 2), (10, 4)
  `;

  // ===== Queues =====
  await sql`
    INSERT INTO queue (position, user_profile_id, activity_id) VALUES
      (1, 9, 6),
      (1, 8, 7), (2, 10, 7)
  `;

  console.log("Seed complete!");
  console.log("");
  console.log("Test accounts:");
  console.log("  admin    / admin123    (admin)");
  console.log("  thomas   / guest123    (guest)");
  console.log("  sophie   / guest456    (guest)");
  console.log("  lucas    / guest789    (guest)");
  console.log("  staff    / staff123    (staff)");
  console.log("  sarah.chen / speaker123 (speaker)");

  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
