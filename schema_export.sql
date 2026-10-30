-- bloxboxd schema (source-of-truth: src/db/index.ts)
-- Exported from CREATE TABLE IF NOT EXISTS statements + indexes.
-- Foreign keys declared inline; enable with:  PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  user_id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  verified_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  event TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  roblox_user_id INTEGER UNIQUE,
  username TEXT NOT NULL,
  handle TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  avatar_bust_url TEXT,
  bio TEXT,
  joined_date TEXT,
  roblox_joined_date TEXT,
  friends_count INTEGER DEFAULT 0,
  favorite_game_ids TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS game_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  game_title TEXT NOT NULL,
  game_icon TEXT,
  user_id TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS custom_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS review_likes (
  user_id TEXT NOT NULL,
  review_id TEXT NOT NULL,
  PRIMARY KEY(user_id, review_id)
);

CREATE TABLE IF NOT EXISTS list_likes (
  user_id TEXT NOT NULL,
  list_id TEXT NOT NULL,
  PRIMARY KEY(user_id, list_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS review_comments (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  user_avatar TEXT,
  comment_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  universe_id INTEGER,
  root_place_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  creator_name TEXT,
  creator_type TEXT,
  icon_url TEXT,
  banner_url TEXT,
  genre TEXT,
  subgenre TEXT,
  genre_l1 TEXT,
  genre_l2 TEXT,
  player_count INTEGER,
  total_visits TEXT,
  raw_visits INTEGER,
  favorited_count INTEGER,
  up_votes INTEGER,
  down_votes INTEGER,
  release_year INTEGER,
  rating_average REAL,
  rating_count INTEGER,
  rating_histogram TEXT,
  tags TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_games_universe_id ON games(universe_id);
CREATE INDEX IF NOT EXISTS idx_games_root_place_id ON games(root_place_id);
CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);
CREATE INDEX IF NOT EXISTS idx_game_logs_user_date ON game_logs(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_game_logs_game_id ON game_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_reviews_game_created ON reviews(game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_trending ON reviews(likes_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_lists_public_created ON custom_lists(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON custom_lists(user_id);
