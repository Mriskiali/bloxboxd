import { createClient, Client } from '@libsql/client';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Game } from '../types';

dotenv.config();

const cleanEnv = (val?: string) => val ? val.trim().replace(/^["']|["']$/g, '') : undefined;
const tursoUrl = cleanEnv(process.env.TURSO_DATABASE_URL);
const tursoToken = cleanEnv(process.env.TURSO_AUTH_TOKEN);

// Dual-mode: Turso Cloud if URL is provided (libsql:// or https://), otherwise fallback to local SQLite file
const isTursoCloud = Boolean(
  tursoUrl && (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://'))
);
const localDbPath = process.env.VERCEL
  ? path.join('/tmp', 'bloxboxd.db')
  : path.join(process.cwd(), 'bloxboxd.db');

export const db: Client = createClient({
  url: isTursoCloud ? tursoUrl! : `file:${localDbPath}`,
  authToken: isTursoCloud ? tursoToken : undefined,
});

console.log(
  isTursoCloud
    ? `[Database] Connected to Turso Cloud at ${tursoUrl}`
    : `[Database] Connected to Local SQLite database at ${localDbPath}`
);

/**
 * Initializes all database tables and performs legacy JSON migrations
 */
export async function initDatabase(): Promise<void> {
  // 1. Accounts table (Roblox verified credentials & PIN hash)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      user_id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      verified_at TEXT NOT NULL
    )
  `);

  // 1b. Sessions table (server-side session tokens for write auth)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )
  `);

  // Cleanup legacy pre-OAuth tables if present
  await db.execute(`DROP TABLE IF EXISTS challenges`);
  await db.execute(`DROP TABLE IF EXISTS login_attempts`);

  // 1e. Login audit trail (for the owner: who signed in, from where)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS login_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      event TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // 2. User Profiles table
  await db.execute(`
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
    )
  `);

  // 3. Game Logs table (user's played/playing/backlog status & ratings)
  await db.execute(`
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
    )
  `);

  // 4. Community Reviews table
  await db.execute(`
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
    )
  `);

  // 5. Custom Lists table
  await db.execute(`
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
    )
  `);

  // 6. Review likes tracking
  await db.execute(`
    CREATE TABLE IF NOT EXISTS review_likes (
      user_id TEXT NOT NULL,
      review_id TEXT NOT NULL,
      PRIMARY KEY(user_id, review_id)
    )
  `);

  // 7. List likes tracking
  await db.execute(`
    CREATE TABLE IF NOT EXISTS list_likes (
      user_id TEXT NOT NULL,
      list_id TEXT NOT NULL,
      PRIMARY KEY(user_id, list_id)
    )
  `);

  // 8. Follows table (Friend & social tracking)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(follower_id, following_id)
    )
  `);

  // 9. Review comments table (Community discussions)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS review_comments (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      user_avatar TEXT,
      comment_text TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // 10. Games table (Centralized Persistent Catalog & Cache)
  await db.execute(`
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
      player_count INTEGER DEFAULT 0,
      total_visits TEXT,
      raw_visits INTEGER DEFAULT 0,
      favorited_count INTEGER DEFAULT 0,
      up_votes INTEGER DEFAULT 0,
      down_votes INTEGER DEFAULT 0,
      release_year INTEGER,
      rating_average REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      rating_histogram TEXT DEFAULT '{}',
      tags TEXT DEFAULT '[]',
      updated_at INTEGER
    )
  `);

  // Relational B-Tree Indexes (Pilar 4: Query Optimization & Zero-Trust Architecture)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_games_universe_id ON games(universe_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_games_root_place_id ON games(root_place_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_game_logs_user_date ON game_logs(user_id, logged_date DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_game_logs_game_id ON game_logs(game_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_game_created ON reviews(game_id, created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_trending ON reviews(likes_count DESC, created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_custom_lists_public_created ON custom_lists(is_public, created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON custom_lists(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_list_likes_list_id ON list_likes(list_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_review_comments_review_created ON review_comments(review_id, created_at ASC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username)`);

  // Normalise legacy userId shapes ("123" -> "user-roblox-123") once. Reads keep
  // accepting both shapes via userIdVariants(), so rows that collide stay put.
  try {
    const targets: Array<[string, string]> = [
      ['game_logs', 'user_id'],
      ['reviews', 'user_id'],
      ['custom_lists', 'user_id'],
      ['review_comments', 'user_id'],
      ['review_likes', 'user_id'],
      ['list_likes', 'user_id'],
      ['follows', 'follower_id'],
      ['follows', 'following_id']
    ];
    for (const [table, col] of targets) {
      await db.execute(
        `UPDATE OR IGNORE ${table} SET ${col} = 'user-roblox-' || ${col} WHERE ${col} NOT LIKE 'user-roblox-%' AND ${col} GLOB '[0-9]*'`
      );
    }
  } catch (err) {
    console.warn('[Database] userId normalisation skipped:', err);
  }
}

// ---------------------------------------------------------------------------
// Accounts & Profiles Helper Functions
// ---------------------------------------------------------------------------

export async function getAccountByUserId(userId: number): Promise<any | null> {
  const result = await db.execute({
    sql: 'SELECT user_id as userId, username, pin_hash as pinHash, salt, verified_at as verifiedAt FROM accounts WHERE user_id = ?',
    args: [userId]
  });
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function saveAccount(data: {
  userId: number;
  username: string;
  pinHash?: string;
  salt?: string;
  verifiedAt: string;
}): Promise<void> {
  await db.execute({
    sql: `
      INSERT INTO accounts (user_id, username, pin_hash, salt, verified_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        pin_hash = COALESCE(NULLIF(excluded.pin_hash, 'oauth'), accounts.pin_hash),
        salt = COALESCE(NULLIF(excluded.salt, 'oauth'), accounts.salt),
        verified_at = excluded.verified_at
    `,
    args: [data.userId, data.username, data.pinHash || 'oauth', data.salt || 'oauth', data.verifiedAt]
  });
}

// ---------------------------------------------------------------------------
// Sessions: server-side tokens issued on verify / PIN login. Every write
// endpoint must present a valid token bound to the acting userId.
// ---------------------------------------------------------------------------
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function canonicalUserId(id: string | number): string {
  const raw = String(id).trim();
  const num = raw.replace(/^user-roblox-/, '');
  return `user-roblox-${num}`;
}

export async function createSession(userId: string | number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  await db.execute({
    sql: `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
    args: [token, canonicalUserId(userId), now.toISOString(), new Date(now.getTime() + SESSION_TTL_MS).toISOString()]
  });
  return token;
}

export async function isValidSession(token: string | undefined, userId: string | number): Promise<boolean> {
  if (!token) return false;
  const result = await db.execute({
    sql: `SELECT 1 FROM sessions WHERE token = ? AND user_id = ? AND expires_at > ?`,
    args: [token, canonicalUserId(userId), new Date().toISOString()]
  });
  return result.rows.length > 0;
}

/**
 * RLS-style resolution: derive the acting userId from the session token
 * alone, ignoring any client-supplied userId claim. Returns the canonical
 * user_id (`user-roblox-<n>`) for a valid, unexpired session, else null.
 * This is the single source of truth for "who is making this request".
 */
export async function resolveSessionUser(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const result = await db.execute({
    sql: `SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?`,
    args: [token, new Date().toISOString()]
  });
  const row = result.rows[0] as { user_id?: string } | undefined;
  return row?.user_id ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  await db.execute({ sql: `DELETE FROM sessions WHERE token = ?`, args: [token] });
}

/** Revoke every session for a user (sign out everywhere). Returns rows removed. */
export async function deleteAllSessions(userId: string | number): Promise<number> {
  const result = await db.execute({
    sql: `DELETE FROM sessions WHERE user_id = ?`,
    args: [canonicalUserId(userId)]
  });
  return result.rowsAffected;
}

/**
 * Login audit trail. Kept append-only and pruned opportunistically so the
 * owner can answer "who signed in, when, from where" without a log service.
 */
export async function recordLoginEvent(ev: {
  userId?: string | number | null;
  event: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO login_events (user_id, event, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [
        ev.userId ? canonicalUserId(ev.userId) : null,
        ev.event,
        ev.ip ? String(ev.ip).slice(0, 64) : null,
        ev.userAgent ? String(ev.userAgent).slice(0, 240) : null,
        new Date().toISOString()
      ]
    });
  } catch (err) {
    console.warn('[Database] login event not recorded:', err);
  }
}

/** Keep the audit trail bounded (90 days). */
export async function purgeOldLoginEvents(days = 90): Promise<void> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  await db.execute({ sql: `DELETE FROM login_events WHERE created_at < ?`, args: [cutoff] });
}

// ---------------------------------------------------------------------------
export function userIdVariants(id: string | number): string[] {
  const raw = String(id).trim();
  const num = raw.replace(/^user-roblox-/, '');
  const canonical = `user-roblox-${num}`;
  const variants = new Set<string>([canonical, num]);
  if (raw) variants.add(raw);
  return [...variants];
}

export async function getUserProfile(userId: string): Promise<any | null> {
  const result = await db.execute({
    sql: `SELECT * FROM user_profiles WHERE id = ? OR roblox_user_id = ?`,
    args: [userId, isNaN(Number(userId)) ? -1 : Number(userId)]
  });
  if (result.rows.length === 0) return null;
  const row: any = result.rows[0];
  return {
    id: row.id,
    robloxUserId: row.roblox_user_id,
    username: row.username,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    avatarBustUrl: row.avatar_bust_url,
    bio: row.bio,
    joinedDate: row.joined_date,
    robloxJoinedDate: row.roblox_joined_date,
    friendsCount: row.friends_count,
    favoriteGameIds: row.favorite_game_ids ? JSON.parse(row.favorite_game_ids) : []
  };
}

export async function upsertUserProfile(profile: any): Promise<void> {
  // Canonicalise id so legacy numeric / raw ids never collide on the PK.
  const profileId = profile.id ? canonicalUserId(profile.id) : profile.id;
  const robloxUserId = profile.robloxUserId || profile.robloxUserId === 0
    ? profile.robloxUserId
    : profileId ? Number(String(profileId).replace('user-roblox-', '')) : null;

  // If favoriteGameIds is provided as an array, serialize it; if undefined/null, pass null so COALESCE preserves existing
  const favJson = Array.isArray(profile.favoriteGameIds)
    ? JSON.stringify(profile.favoriteGameIds)
    : null;

  const username = profile.username || 'RobloxPlayer';
  const handle = profile.handle || `@${username.replace(/^@+/, '')}`;
  const bio = typeof profile.bio === 'string' ? profile.bio : null;
  const displayName = profile.displayName || profile.robloxDisplayName || profile.username || null;
  const avatarUrl = profile.avatarUrl || null;
  const avatarBustUrl = profile.avatarBustUrl || null;

  await db.execute({
    sql: `
      INSERT INTO user_profiles (
        id, roblox_user_id, username, handle, display_name, avatar_url,
        avatar_bust_url, bio, joined_date, roblox_joined_date, friends_count, favorite_game_ids
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        roblox_user_id = COALESCE(excluded.roblox_user_id, user_profiles.roblox_user_id),
        username = CASE WHEN excluded.username != 'RobloxPlayer' THEN excluded.username ELSE user_profiles.username END,
        handle = CASE WHEN excluded.handle != '@RobloxPlayer' THEN excluded.handle ELSE user_profiles.handle END,
        display_name = COALESCE(excluded.display_name, user_profiles.display_name),
        avatar_url = COALESCE(NULLIF(excluded.avatar_url, ''), user_profiles.avatar_url),
        avatar_bust_url = COALESCE(NULLIF(excluded.avatar_bust_url, ''), user_profiles.avatar_bust_url),
        bio = COALESCE(excluded.bio, user_profiles.bio),
        joined_date = COALESCE(user_profiles.joined_date, excluded.joined_date),
        roblox_joined_date = COALESCE(user_profiles.roblox_joined_date, excluded.roblox_joined_date),
        friends_count = COALESCE(excluded.friends_count, user_profiles.friends_count),
        favorite_game_ids = CASE WHEN excluded.favorite_game_ids IS NOT NULL THEN excluded.favorite_game_ids ELSE user_profiles.favorite_game_ids END
    `,
    args: [
      profileId,
      robloxUserId ? Number(robloxUserId) : null,
      username,
      handle,
      displayName,
      avatarUrl,
      avatarBustUrl,
      bio,
      profile.joinedDate || new Date().toISOString(),
      profile.robloxJoinedDate || '',
      profile.friendsCount ?? profile.robloxFriendsCount ?? 0,
      favJson
    ]
  });
}

export async function searchUserProfiles(query: string, limit: number = 8): Promise<any[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];
  const pattern = `%${cleanQ}%`;
  const result = await db.execute({
    sql: `
      SELECT id, roblox_user_id, username, handle, display_name, avatar_url, avatar_bust_url, bio, joined_date, friends_count
      FROM user_profiles
      WHERE LOWER(username) LIKE ? OR LOWER(handle) LIKE ? OR LOWER(display_name) LIKE ?
      LIMIT ?
    `,
    args: [pattern, pattern, pattern, limit]
  });

  return result.rows.map((row: any) => ({
    id: row.id,
    robloxUserId: row.roblox_user_id,
    username: row.username,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    avatarBustUrl: row.avatar_bust_url,
    bio: row.bio || '',
    joinedDate: row.joined_date,
    friendsCount: row.friends_count || 0
  }));
}

// ---------------------------------------------------------------------------
// Game Logs Helper Functions
// ---------------------------------------------------------------------------

export async function getUserGameLogs(userId: string): Promise<any[]> {
  const variants = userIdVariants(userId);
  const where = variants.map(() => 'user_id = ?').join(' OR ');

  const result = await db.execute({
    sql: `SELECT * FROM game_logs WHERE ${where} ORDER BY logged_date DESC, updated_at DESC`,
    args: variants
  });
  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    gameId: row.game_id,
    status: row.status,
    rating: row.rating !== null ? Number(row.rating) : undefined,
    reviewText: row.review_text || undefined,
    hasSpoilers: Boolean(row.has_spoilers),
    isFavorite: Boolean(row.is_favorite),
    isLiked: Boolean(row.is_liked),
    loggedDate: row.logged_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function upsertGameLog(log: any): Promise<void> {
  const canonicalId = canonicalUserId(log.userId);
  // Deterministic unique log ID bound to user and game to prevent any ID collisions in fast loops
  const logId = log.id && !log.id.startsWith('log-')
    ? log.id
    : `log-${canonicalId}-${log.gameId}`;

  await db.execute({
    sql: `
      INSERT INTO game_logs (
        id, user_id, game_id, status, rating, review_text, has_spoilers,
        is_favorite, is_liked, logged_date, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, game_id) DO UPDATE SET
        status = excluded.status,
        rating = excluded.rating,
        review_text = excluded.review_text,
        has_spoilers = excluded.has_spoilers,
        is_favorite = excluded.is_favorite,
        is_liked = excluded.is_liked,
        logged_date = excluded.logged_date,
        updated_at = excluded.updated_at
    `,
    args: [
      logId,
      canonicalId,
      log.gameId,
      log.status,
      log.rating ?? null,
      log.reviewText ?? null,
      log.hasSpoilers ? 1 : 0,
      log.isFavorite ? 1 : 0,
      log.isLiked ? 1 : 0,
      log.loggedDate || new Date().toISOString().split('T')[0],
      log.createdAt || new Date().toISOString(),
      log.updatedAt || new Date().toISOString()
    ]
  });
}

export async function deleteGameLog(userId: string, logId: string): Promise<boolean> {
  const variants = userIdVariants(userId);
  const where = variants.map(() => 'user_id = ?').join(' OR ');

  // Fetch the log first to also delete associated review if any
  const logRow = await db.execute({
    sql: `SELECT game_id FROM game_logs WHERE id = ? AND (${where})`,
    args: [logId, ...variants]
  });

  const result = await db.execute({
    sql: `DELETE FROM game_logs WHERE id = ? AND (${where})`,
    args: [logId, ...variants]
  });

  if (logRow.rows.length > 0 && logRow.rows[0].game_id) {
    const gameId = String(logRow.rows[0].game_id);
    await db.execute({
      sql: `DELETE FROM reviews WHERE game_id = ? AND (${where})`,
      args: [gameId, ...variants]
    }).catch(() => {});
  }

  return result.rowsAffected > 0;
}

// ---------------------------------------------------------------------------
// Community Reviews Helper Functions
// ---------------------------------------------------------------------------

export async function getAllReviews(gameId?: string): Promise<any[]> {
  const sql = gameId
    ? `SELECT r.*, 
         COALESCE(p.display_name, p.username, r.username) as live_username,
         COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
         (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count 
       FROM reviews r 
       LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
       WHERE r.game_id = ? 
       ORDER BY r.created_at DESC LIMIT 100`
    : `SELECT r.*, 
         COALESCE(p.display_name, p.username, r.username) as live_username,
         COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
         (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count 
       FROM reviews r 
       LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
       ORDER BY r.created_at DESC LIMIT 100`;
  const args = gameId ? [gameId] : [];
  const result = await db.execute({ sql, args });

  return result.rows.map((row: any) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.live_username || row.username,
    userAvatar: row.live_avatar || row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : undefined,
    reviewText: row.review_text,
    hasSpoilers: Boolean(row.has_spoilers),
    isLiked: Boolean(row.is_liked),
    likesCount: Number(row.likes_count) || 0,
    commentsCount: Number(row.comments_count) || 0,
    loggedDate: row.logged_date,
    createdAt: row.created_at
  }));
}

export async function getUserReviews(userId: string): Promise<any[]> {
  const cleanId = (userId || '').trim();
  const rawNumId = cleanId.replace('user-roblox-', '');
  const prefixedId = cleanId.startsWith('user-roblox-') ? cleanId : `user-roblox-${cleanId}`;

  const result = await db.execute({
    sql: `SELECT r.*, 
            COALESCE(p.display_name, p.username, r.username) as live_username,
            COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
            (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count 
          FROM reviews r 
          LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
          WHERE r.user_id = ? OR r.user_id = ? OR r.user_id = ? 
          ORDER BY r.created_at DESC LIMIT 100`,
    args: [cleanId, rawNumId, prefixedId]
  });

  return result.rows.map((row: any) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.live_username || row.username,
    userAvatar: row.live_avatar || row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : undefined,
    reviewText: row.review_text,
    hasSpoilers: Boolean(row.has_spoilers),
    isLiked: Boolean(row.is_liked),
    likesCount: Number(row.likes_count) || 0,
    commentsCount: Number(row.comments_count) || 0,
    loggedDate: row.logged_date,
    createdAt: row.created_at
  }));
}

export async function upsertReview(rev: any): Promise<void> {
  const canonicalId = canonicalUserId(rev.userId);
  const revId = rev.id || `rev-${canonicalId}-${rev.gameId}`;

  await db.execute({
    sql: `
      INSERT INTO reviews (
        id, game_id, game_title, game_icon, user_id, username,
        user_avatar, rating, review_text, has_spoilers, is_liked,
        likes_count, logged_date, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        rating = excluded.rating,
        review_text = excluded.review_text,
        has_spoilers = excluded.has_spoilers,
        is_liked = excluded.is_liked,
        logged_date = excluded.logged_date
      WHERE reviews.user_id = excluded.user_id
    `,
    args: [
      revId,
      rev.gameId,
      rev.gameTitle || '',
      rev.gameIcon || '',
      canonicalId,
      rev.username,
      rev.userAvatar || '',
      rev.rating ?? null,
      rev.reviewText,
      rev.hasSpoilers ? 1 : 0,
      rev.isLiked ? 1 : 0,
      rev.likesCount || 0,
      rev.loggedDate || new Date().toISOString().split('T')[0],
      rev.createdAt || new Date().toISOString()
    ]
  });
}

export async function toggleReviewLike(userId: string, reviewId: string): Promise<{ liked: boolean; likesCount: number }> {
  const uid = canonicalUserId(userId);
  // L2: atomic toggle — INSERT ON CONFLICT DO NOTHING serialises on the PK so
  // two concurrent "like" requests cannot create a duplicate or desync the
  // counter. The count mutation runs in a write transaction with the mutation.
  const ins = await db.execute({
    sql: `INSERT INTO review_likes (user_id, review_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
    args: [uid, reviewId]
  });

  if (ins.rowsAffected > 0) {
    await db.batch([
      { sql: `UPDATE reviews SET likes_count = likes_count + 1 WHERE id = ?`, args: [reviewId] }
    ], 'write');
    const rev = await db.execute({ sql: `SELECT likes_count FROM reviews WHERE id = ?`, args: [reviewId] });
    return { liked: true, likesCount: Number(rev.rows[0]?.likes_count || 1) };
  }

  await db.batch([
    { sql: `DELETE FROM review_likes WHERE user_id = ? AND review_id = ?`, args: [uid, reviewId] },
    { sql: `UPDATE reviews SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`, args: [reviewId] }
  ], 'write');
  const rev = await db.execute({ sql: `SELECT likes_count FROM reviews WHERE id = ?`, args: [reviewId] });
  return { liked: false, likesCount: Number(rev.rows[0]?.likes_count || 0) };
}

// ---------------------------------------------------------------------------
// Custom Lists Helper Functions
// ---------------------------------------------------------------------------

export async function getAllCustomLists(currentUserId?: string): Promise<any[]> {
  const canonicalId = currentUserId ? canonicalUserId(currentUserId) : null;
  const result = await db.execute({
    sql: `
      SELECT l.*,
             COALESCE(p.display_name, p.username, l.user_name) as live_username,
             COALESCE(p.avatar_url, l.user_avatar) as live_avatar,
             CASE WHEN ? IS NOT NULL THEN (SELECT 1 FROM list_likes ll WHERE ll.list_id = l.id AND ll.user_id = ?) ELSE 0 END as is_liked
      FROM custom_lists l
      LEFT JOIN user_profiles p ON (p.id = l.user_id OR p.roblox_user_id = l.user_id)
      WHERE l.is_public = 1 
      ORDER BY l.created_at DESC LIMIT 100
    `,
    args: [canonicalId, canonicalId]
  });
  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.live_username || row.user_name,
    userAvatar: row.live_avatar || row.user_avatar,
    title: row.title,
    description: row.description,
    isRanked: Boolean(row.is_ranked),
    isPublic: Boolean(row.is_public),
    likesCount: Number(row.likes_count) || 0,
    isLiked: Boolean(row.is_liked),
    items: row.items ? JSON.parse(row.items) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function upsertCustomList(list: any): Promise<void> {
  const itemsJson = JSON.stringify(list.items || []);
  await db.execute({
    sql: `
      INSERT INTO custom_lists (
        id, user_id, user_name, user_avatar, title, description,
        is_ranked, is_public, items, likes_count, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        is_ranked = excluded.is_ranked,
        is_public = excluded.is_public,
        items = excluded.items
      WHERE custom_lists.user_id = excluded.user_id
    `,
    args: [
      list.id || `list-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      canonicalUserId(list.userId),
      list.userName,
      list.userAvatar || '',
      list.title,
      list.description || '',
      list.isRanked ? 1 : 0,
      list.isPublic !== false ? 1 : 0,
      itemsJson,
      list.likesCount || 0,
      list.createdAt || new Date().toISOString()
    ]
  });
}

export async function deleteCustomList(userId: string, listId: string): Promise<boolean> {
  // L4: canonicalise userId so numeric/raw client ids match stored rows.
  const result = await db.execute({
    sql: `DELETE FROM custom_lists WHERE id = ? AND user_id = ?`,
    args: [listId, canonicalUserId(userId)]
  });
  return result.rowsAffected > 0;
}

export async function toggleListLike(userId: string, listId: string): Promise<{ liked: boolean; likesCount: number }> {
  const uid = canonicalUserId(userId);
  // L2: atomic toggle, same pattern as toggleReviewLike.
  const ins = await db.execute({
    sql: `INSERT INTO list_likes (user_id, list_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
    args: [uid, listId]
  });

  if (ins.rowsAffected > 0) {
    await db.batch([
      { sql: `UPDATE custom_lists SET likes_count = likes_count + 1 WHERE id = ?`, args: [listId] }
    ], 'write');
    const item = await db.execute({ sql: `SELECT likes_count FROM custom_lists WHERE id = ?`, args: [listId] });
    return { liked: true, likesCount: Number(item.rows[0]?.likes_count || 1) };
  }

  await db.batch([
    { sql: `DELETE FROM list_likes WHERE user_id = ? AND list_id = ?`, args: [uid, listId] },
    { sql: `UPDATE custom_lists SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`, args: [listId] }
  ], 'write');
  const item = await db.execute({ sql: `SELECT likes_count FROM custom_lists WHERE id = ?`, args: [listId] });
  return { liked: false, likesCount: Number(item.rows[0]?.likes_count || 0) };
}

// ---------------------------------------------------------------------------
// Social Features: Follows, Feed, Comments, Trending & Leaderboard
// ---------------------------------------------------------------------------

export async function toggleFollowUser(followerId: string, followingId: string): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number }> {
  followerId = canonicalUserId(followerId);
  followingId = canonicalUserId(followingId);
  const existing = await db.execute({
    sql: `SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?`,
    args: [followerId, followingId]
  });

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`,
      args: [followerId, followingId]
    });
  } else {
    await db.execute({
      sql: `INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)`,
      args: [followerId, followingId, new Date().toISOString()]
    });
  }

  return getFollowStatus(followerId, followingId);
}

export async function getFollowStatus(currentUserId: string, targetUserId: string): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number }> {
  const isFollowingRes = currentUserId ? await db.execute({
    sql: `SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?`,
    args: [currentUserId, targetUserId]
  }) : { rows: [] };

  const followersRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM follows WHERE following_id = ?`,
    args: [targetUserId]
  });

  const followingRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM follows WHERE follower_id = ?`,
    args: [targetUserId]
  });

  return {
    isFollowing: isFollowingRes.rows.length > 0,
    followersCount: Number(followersRes.rows[0]?.count || 0),
    followingCount: Number(followingRes.rows[0]?.count || 0)
  };
}

export async function getCommunityFeed(userId?: string): Promise<any[]> {
  const canonicalId = userId ? canonicalUserId(userId) : null;

  // Activity feed: friends' activities prioritized first, followed by global community
  const reviewsRes = await db.execute({
    sql: `
      SELECT r.id, r.game_id, r.game_title, r.game_icon, r.user_id,
             COALESCE(p.display_name, p.username, r.username) as username,
             COALESCE(p.avatar_url, r.user_avatar) as user_avatar,
             r.rating, r.review_text, r.likes_count, r.created_at,
             'review' as activity_type,
             CASE WHEN ? IS NOT NULL AND r.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) THEN 1 ELSE 0 END as is_friend
      FROM reviews r
      LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.id = 'user-roblox-' || r.user_id)
      ORDER BY is_friend DESC, r.created_at DESC LIMIT 35
    `,
    args: [canonicalId, canonicalId]
  });

  const listsRes = await db.execute({
    sql: `
      SELECT l.id, l.user_id,
             COALESCE(p.display_name, p.username, l.user_name) as username,
             COALESCE(p.avatar_url, l.user_avatar) as user_avatar,
             l.title, l.description, l.items, l.likes_count, l.created_at,
             'list' as activity_type,
             CASE WHEN ? IS NOT NULL AND l.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) THEN 1 ELSE 0 END as is_friend
      FROM custom_lists l
      LEFT JOIN user_profiles p ON (p.id = l.user_id OR p.id = 'user-roblox-' || l.user_id)
      WHERE l.is_public = 1
      ORDER BY is_friend DESC, l.created_at DESC LIMIT 25
    `,
    args: [canonicalId, canonicalId]
  });

  const activities: any[] = [];
  for (const r of reviewsRes.rows as any[]) {
    activities.push({
      id: `act-rev-${r.id}`,
      type: 'review',
      userId: r.user_id,
      username: r.username,
      userAvatar: r.user_avatar,
      gameId: r.game_id,
      gameTitle: r.game_title,
      gameIcon: r.game_icon,
      rating: r.rating !== null ? Number(r.rating) : undefined,
      text: r.review_text,
      likesCount: Number(r.likes_count) || 0,
      createdAt: r.created_at
    });
  }

  for (const l of listsRes.rows as any[]) {
    const items = l.items ? JSON.parse(l.items) : [];
    activities.push({
      id: `act-list-${l.id}`,
      type: 'list',
      userId: l.user_id,
      username: l.username,
      userAvatar: l.user_avatar,
      listId: l.id,
      title: l.title,
      description: l.description,
      itemCount: items.length,
      likesCount: Number(l.likes_count) || 0,
      createdAt: l.created_at
    });
  }

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return activities.slice(0, 40);
}

export async function getTrendingReviewsAndLeaderboard(): Promise<{ trendingReviews: any[]; leaderboard: any[] }> {
  // Trending reviews: highest likes count
  const trendingRes = await db.execute(`
    SELECT r.*,
           COALESCE(p.display_name, p.username, r.username) as live_username,
           COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
           (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count
    FROM reviews r
    LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
    ORDER BY r.likes_count DESC, r.created_at DESC LIMIT 8
  `);
  const trendingReviews = trendingRes.rows.map((row: any) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.live_username || row.username,
    userAvatar: row.live_avatar || row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : undefined,
    reviewText: row.review_text,
    likesCount: Number(row.likes_count) || 0,
    commentsCount: Number(row.comments_count) || 0,
    loggedDate: row.logged_date,
    createdAt: row.created_at
  }));

  // Leaderboard: top active users by count of logs + reviews
  const leadRes = await db.execute(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
           COUNT(DISTINCT l.id) as logs_count,
           COUNT(DISTINCT r.id) as reviews_count
    FROM user_profiles u
    LEFT JOIN game_logs l ON l.user_id = u.id
    LEFT JOIN reviews r ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY (COUNT(DISTINCT l.id) + COUNT(DISTINCT r.id) * 2) DESC
    LIMIT 10
  `);

  const leaderboard = leadRes.rows.map((row: any, idx: number) => ({
    rank: idx + 1,
    id: row.id,
    username: row.display_name || row.username,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    logsCount: Number(row.logs_count) || 0,
    reviewsCount: Number(row.reviews_count) || 0,
    score: (Number(row.logs_count) || 0) + (Number(row.reviews_count) || 0) * 2
  }));

  return { trendingReviews, leaderboard };
}

export async function getReviewComments(reviewId: string): Promise<any[]> {
  const result = await db.execute({
    sql: `SELECT rc.*,
            COALESCE(p.display_name, p.username, rc.username) as live_username,
            COALESCE(p.avatar_url, rc.user_avatar) as live_avatar
          FROM review_comments rc
          LEFT JOIN user_profiles p ON (p.id = rc.user_id OR p.roblox_user_id = rc.user_id)
          WHERE rc.review_id = ? 
          ORDER BY rc.created_at ASC`,
    args: [reviewId]
  });
  return result.rows.map((r: any) => ({
    id: r.id,
    reviewId: r.review_id,
    userId: r.user_id,
    username: r.live_username || r.username,
    userAvatar: r.live_avatar || r.user_avatar,
    commentText: r.comment_text,
    createdAt: r.created_at
  }));
}

export async function addReviewComment(comment: {
  reviewId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  commentText: string;
}): Promise<any> {
  const id = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  await db.execute({
    sql: `
      INSERT INTO review_comments (id, review_id, user_id, username, user_avatar, comment_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [id, comment.reviewId, canonicalUserId(comment.userId), comment.username, comment.userAvatar || '', comment.commentText, now]
  });
  return {
    id,
    reviewId: comment.reviewId,
    userId: comment.userId,
    username: comment.username,
    userAvatar: comment.userAvatar || '',
    commentText: comment.commentText,
    createdAt: now
  };
}

export async function deleteReviewComment(userId: string, commentId: string): Promise<boolean> {
  const result = await db.execute({
    sql: `DELETE FROM review_comments WHERE id = ? AND user_id = ?`,
    args: [commentId, canonicalUserId(userId)]
  });
  return result.rowsAffected > 0;
}

// ---------------------------------------------------------------------------
// Game Catalog Helper Functions (Persistent Centralized Store)
// ---------------------------------------------------------------------------

function mapRowToGame(row: any): Game {
  let ratingHistogram: Record<string, number> = {};
  if (row.rating_histogram) {
    try {
      ratingHistogram = typeof row.rating_histogram === 'string' ? JSON.parse(row.rating_histogram) : row.rating_histogram;
    } catch (e) {
      ratingHistogram = {};
    }
  }

  let tags: string[] = [];
  if (row.tags) {
    try {
      tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
    } catch (e) {
      tags = [];
    }
  }

  return {
    id: row.id,
    universeId: Number(row.universe_id) || 0,
    rootPlaceId: Number(row.root_place_id) || 0,
    name: row.name,
    description: row.description || '',
    creatorName: row.creator_name || 'Roblox Creator',
    creatorType: (row.creator_type as 'User' | 'Group') || 'Group',
    iconUrl: row.icon_url || '',
    bannerUrl: row.banner_url || undefined,
    genre: row.genre || 'Adventure',
    playerCount: Number(row.player_count) || 0,
    totalVisits: row.total_visits || '0',
    rawVisits: Number(row.raw_visits) || 0,
    favoritedCount: Number(row.favorited_count) || 0,
    upVotes: Number(row.up_votes) || 0,
    downVotes: Number(row.down_votes) || 0,
    releaseYear: Number(row.release_year) || new Date().getFullYear(),
    ratingAverage: Number(row.rating_average) || 4.5,
    ratingCount: Number(row.rating_count) || 0,
    ratingHistogram,
    tags: Array.isArray(tags) ? tags : []
  };
}

export async function getAllGames(limit: number = 2000): Promise<Game[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM games ORDER BY player_count DESC, updated_at DESC LIMIT ?',
    args: [limit]
  });
  return result.rows.map(mapRowToGame);
}

export async function getGameById(id: string): Promise<Game | null> {
  const numId = isNaN(Number(id)) ? -1 : Number(id);
  const result = await db.execute({
    sql: 'SELECT * FROM games WHERE id = ? OR universe_id = ? OR root_place_id = ? LIMIT 1',
    args: [id, numId, numId]
  });
  if (result.rows.length === 0) return null;
  return mapRowToGame(result.rows[0]);
}

export async function upsertGame(g: Game): Promise<void> {
  if (!g || !g.id) return;

  // Check if game already exists in Turso DB (avoid redundant writes)
  try {
    const existing = await db.execute({
      sql: 'SELECT 1 FROM games WHERE id = ? LIMIT 1',
      args: [g.id]
    });
    if (existing.rows.length > 0) {
      return; // Already cached in Turso
    }
  } catch (e) {}

  const ratingHistJson = JSON.stringify(g.ratingHistogram || {});
  const tagsJson = JSON.stringify(g.tags || []);
  const now = Date.now();

  await db.execute({
    sql: `
      INSERT INTO games (
        id, universe_id, root_place_id, name, description, creator_name, creator_type,
        icon_url, banner_url, genre, player_count, total_visits, raw_visits,
        favorited_count, up_votes, down_votes, release_year, rating_average,
        rating_count, rating_histogram, tags, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `,
    args: [
      g.id,
      g.universeId || null,
      g.rootPlaceId || null,
      g.name,
      g.description || '',
      g.creatorName || 'Roblox Creator',
      g.creatorType || 'Group',
      g.iconUrl || '',
      g.bannerUrl || null,
      g.genre || 'Adventure',
      g.playerCount || 0,
      g.totalVisits || '0',
      g.rawVisits || 0,
      g.favoritedCount || 0,
      g.upVotes || 0,
      g.downVotes || 0,
      g.releaseYear || new Date().getFullYear(),
      g.ratingAverage || 0,
      g.ratingCount || 0,
      ratingHistJson,
      tagsJson,
      now
    ]
  });
}

export async function bulkUpsertGames(games: Game[]): Promise<void> {
  if (!games || games.length === 0) return;

  const validGames = games.filter(g => g && g.id);
  if (validGames.length === 0) return;

  // 1. Check which game IDs already exist in Turso DB
  const ids = validGames.map(g => g.id);
  const existingIds = new Set<string>();
  const CHECK_BATCH = 50;

  for (let i = 0; i < ids.length; i += CHECK_BATCH) {
    const chunkIds = ids.slice(i, i + CHECK_BATCH);
    const placeholders = chunkIds.map(() => '?').join(',');
    try {
      const res = await db.execute({
        sql: `SELECT id FROM games WHERE id IN (${placeholders})`,
        args: chunkIds
      });
      for (const r of res.rows as any[]) {
        if (r?.id) existingIds.add(String(r.id));
      }
    } catch (err) {
      console.warn('[Database] Pre-insert check error:', err);
    }
  }

  // 2. Filter: only insert games that do NOT exist in Turso yet!
  const newGames = validGames.filter(g => !existingIds.has(g.id));
  if (newGames.length === 0) {
    // All games already present in Turso — zero unnecessary writes!
    return;
  }

  const BATCH_SIZE = 25;
  const now = Date.now();

  for (let i = 0; i < newGames.length; i += BATCH_SIZE) {
    const chunk = newGames.slice(i, i + BATCH_SIZE);
    const statements = chunk.map(g => ({
      sql: `
        INSERT INTO games (
          id, universe_id, root_place_id, name, description, creator_name, creator_type,
          icon_url, banner_url, genre, player_count, total_visits, raw_visits,
          favorited_count, up_votes, down_votes, release_year, rating_average,
          rating_count, rating_histogram, tags, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `,
      args: [
        g.id,
        g.universeId || null,
        g.rootPlaceId || null,
        g.name,
        g.description || '',
        g.creatorName || 'Roblox Creator',
        g.creatorType || 'Group',
        g.iconUrl || '',
        g.bannerUrl || null,
        g.genre || 'Adventure',
        g.playerCount || 0,
        g.totalVisits || '0',
        g.rawVisits || 0,
        g.favoritedCount || 0,
        g.upVotes || 0,
        g.downVotes || 0,
        g.releaseYear || new Date().getFullYear(),
        g.ratingAverage || 0,
        g.ratingCount || 0,
        JSON.stringify(g.ratingHistogram || {}),
        JSON.stringify(g.tags || []),
        now
      ]
    }));

    try {
      await db.batch(statements, 'write');
    } catch (e) {
      console.warn('[Database] batch insert chunk error, falling back to sequential:', e);
      for (const stmt of statements) {
        try {
          await db.execute(stmt);
        } catch (singleErr) {
          console.warn('[Database] Failed to insert single game:', singleErr);
        }
      }
    }
  }
}

