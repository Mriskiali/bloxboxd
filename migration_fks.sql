-- migration_fks.sql — dev-only foreign key migration
-- Run against a FRESH local SQLite DB (bloxboxd.db) after `rm bloxboxd.db`.
-- SQLite cannot ALTER TABLE ... ADD CONSTRAINT, so this rebuilds the FK
-- referencing tables from the canonical schema_export.sql.
--
-- Apply order:
--   1. rm bloxboxd.db (or turso db reset)
--   2. sqlite3 bloxboxd.db < schema_export.sql       -- build base schema (no FKs)
--   3. sqlite3 bloxboxd.db < migration_fks.sql         -- rebuild tables WITH fks + enable pragma
--
-- NOTE: Turso Cloud does NOT support `PRAGMA foreign_keys = ON` at runtime
-- (it is connection-scoped). FKs here are declared for local-integrity
-- documentation & local dev enforcement only.

PRAGMA foreign_keys = OFF;        -- we rebuild by table, re-enable at the end
BEGIN;

-- sessions.user_id -> user_profiles.id  (profile may be created after OAuth)
DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- game_logs.user_id  -> user_profiles.id
-- game_logs.game_id  -> games.id
DROP TABLE IF EXISTS game_logs;
CREATE TABLE game_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  rating REAL,
  review_text TEXT,
  has_spoilers INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  is_liked INTEGER DEFAULT 0,
  logged_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, game_id)
);

-- reviews.user_id -> user_profiles.id
-- reviews.game_id -> games.id
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  game_title TEXT NOT NULL,
  game_icon TEXT,
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_avatar TEXT,
  rating REAL,
  review_text TEXT NOT NULL,
  has_spoilers INTEGER DEFAULT 0,
  is_liked INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  logged_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- custom_lists.user_id -> user_profiles.id
DROP TABLE IF EXISTS custom_lists;
CREATE TABLE custom_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  title TEXT NOT NULL,
  description TEXT,
  is_ranked INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  items TEXT NOT NULL DEFAULT '[]',
  likes_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- review_likes -> reviews.id / user_profiles.id
DROP TABLE IF EXISTS review_likes;
CREATE TABLE review_likes (
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, review_id)
);

-- list_likes -> custom_lists.id / user_profiles.id
DROP TABLE IF EXISTS list_likes;
CREATE TABLE list_likes (
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  list_id TEXT NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, list_id)
);

-- follows -> user_profiles.id (both directions)
DROP TABLE IF EXISTS follows;
CREATE TABLE follows (
  follower_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY(follower_id, following_id)
);

-- review_comments -> reviews.id / user_profiles.id
DROP TABLE IF EXISTS review_comments;
CREATE TABLE review_comments (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_avatar TEXT,
  comment_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- custom_list_items -> custom_lists.id / games.id
DROP TABLE IF EXISTS custom_list_items;
CREATE TABLE custom_list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  notes TEXT,
  UNIQUE(list_id, game_id)
);

COMMIT;
PRAGMA foreign_keys = ON;
