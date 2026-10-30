// server.ts
import express from "express";
import path2 from "path";
import fs from "fs";

// src/db/index.ts
import { createClient } from "@libsql/client";
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
var cleanEnv = (val) => val ? val.trim().replace(/^["']|["']$/g, "") : void 0;
var tursoUrl = cleanEnv(process.env.TURSO_DATABASE_URL);
var tursoToken = cleanEnv(process.env.TURSO_AUTH_TOKEN);
var isTursoCloud = Boolean(
  tursoUrl && (tursoUrl.startsWith("libsql://") || tursoUrl.startsWith("https://"))
);
var localDbPath = process.env.VERCEL ? path.join("/tmp", "bloxboxd.db") : path.join(process.cwd(), "bloxboxd.db");
var db = createClient({
  url: isTursoCloud ? tursoUrl : `file:${localDbPath}`,
  authToken: isTursoCloud ? tursoToken : void 0
});
console.log(
  isTursoCloud ? `[Database] Connected to Turso Cloud at ${tursoUrl}` : `[Database] Connected to Local SQLite database at ${localDbPath}`
);
async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      user_id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      verified_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )
  `);
  await db.execute(`DROP TABLE IF EXISTS challenges`);
  await db.execute(`DROP TABLE IF EXISTS login_attempts`);
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
  await db.execute(`
    CREATE TABLE IF NOT EXISTS review_likes (
      user_id TEXT NOT NULL,
      review_id TEXT NOT NULL,
      PRIMARY KEY(user_id, review_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS list_likes (
      user_id TEXT NOT NULL,
      list_id TEXT NOT NULL,
      PRIMARY KEY(user_id, list_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(follower_id, following_id)
    )
  `);
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
  try {
    const targets = [
      ["game_logs", "user_id"],
      ["reviews", "user_id"],
      ["custom_lists", "user_id"],
      ["review_comments", "user_id"],
      ["review_likes", "user_id"],
      ["list_likes", "user_id"],
      ["follows", "follower_id"],
      ["follows", "following_id"]
    ];
    for (const [table, col] of targets) {
      await db.execute(
        `UPDATE OR IGNORE ${table} SET ${col} = 'user-roblox-' || ${col} WHERE ${col} NOT LIKE 'user-roblox-%' AND ${col} GLOB '[0-9]*'`
      );
    }
  } catch (err) {
    console.warn("[Database] userId normalisation skipped:", err);
  }
}
async function getAccountByUserId(userId) {
  const result = await db.execute({
    sql: "SELECT user_id as userId, username, pin_hash as pinHash, salt, verified_at as verifiedAt FROM accounts WHERE user_id = ?",
    args: [userId]
  });
  if (result.rows.length === 0) return null;
  return result.rows[0];
}
async function saveAccount(data) {
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
    args: [data.userId, data.username, data.pinHash || "oauth", data.salt || "oauth", data.verifiedAt]
  });
}
var SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
function canonicalUserId(id) {
  const raw = String(id).trim();
  const num = raw.replace(/^user-roblox-/, "");
  return `user-roblox-${num}`;
}
async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = /* @__PURE__ */ new Date();
  await db.execute({
    sql: `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
    args: [token, canonicalUserId(userId), now.toISOString(), new Date(now.getTime() + SESSION_TTL_MS).toISOString()]
  });
  return token;
}
async function resolveSessionUser(token) {
  if (!token) return null;
  const result = await db.execute({
    sql: `SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?`,
    args: [token, (/* @__PURE__ */ new Date()).toISOString()]
  });
  const row = result.rows[0];
  return row?.user_id ?? null;
}
async function deleteSession(token) {
  await db.execute({ sql: `DELETE FROM sessions WHERE token = ?`, args: [token] });
}
async function deleteAllSessions(userId) {
  const result = await db.execute({
    sql: `DELETE FROM sessions WHERE user_id = ?`,
    args: [canonicalUserId(userId)]
  });
  return result.rowsAffected;
}
async function recordLoginEvent(ev) {
  try {
    await db.execute({
      sql: `INSERT INTO login_events (user_id, event, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [
        ev.userId ? canonicalUserId(ev.userId) : null,
        ev.event,
        ev.ip ? String(ev.ip).slice(0, 64) : null,
        ev.userAgent ? String(ev.userAgent).slice(0, 240) : null,
        (/* @__PURE__ */ new Date()).toISOString()
      ]
    });
  } catch (err) {
    console.warn("[Database] login event not recorded:", err);
  }
}
function userIdVariants(id) {
  const raw = String(id).trim();
  const num = raw.replace(/^user-roblox-/, "");
  const canonical = `user-roblox-${num}`;
  const variants = /* @__PURE__ */ new Set([canonical, num]);
  if (raw) variants.add(raw);
  return [...variants];
}
async function getUserProfile(userId) {
  const result = await db.execute({
    sql: `SELECT * FROM user_profiles WHERE id = ? OR roblox_user_id = ?`,
    args: [userId, isNaN(Number(userId)) ? -1 : Number(userId)]
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
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
async function upsertUserProfile(profile) {
  const profileId = profile.id ? canonicalUserId(profile.id) : profile.id;
  const robloxUserId = profile.robloxUserId || profile.robloxUserId === 0 ? profile.robloxUserId : profileId ? Number(String(profileId).replace("user-roblox-", "")) : null;
  const favJson = Array.isArray(profile.favoriteGameIds) ? JSON.stringify(profile.favoriteGameIds) : null;
  const username = profile.username || "RobloxPlayer";
  const handle = profile.handle || `@${username.replace(/^@+/, "")}`;
  const bio = typeof profile.bio === "string" ? profile.bio : null;
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
      profile.joinedDate || (/* @__PURE__ */ new Date()).toISOString(),
      profile.robloxJoinedDate || "",
      profile.friendsCount ?? profile.robloxFriendsCount ?? 0,
      favJson
    ]
  });
}
async function searchUserProfiles(query, limit = 8) {
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
  return result.rows.map((row) => ({
    id: row.id,
    robloxUserId: row.roblox_user_id,
    username: row.username,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    avatarBustUrl: row.avatar_bust_url,
    bio: row.bio || "",
    joinedDate: row.joined_date,
    friendsCount: row.friends_count || 0
  }));
}
async function getUserGameLogs(userId) {
  const variants = userIdVariants(userId);
  const where = variants.map(() => "user_id = ?").join(" OR ");
  const result = await db.execute({
    sql: `SELECT * FROM game_logs WHERE ${where} ORDER BY logged_date DESC, updated_at DESC`,
    args: variants
  });
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    gameId: row.game_id,
    status: row.status,
    rating: row.rating !== null ? Number(row.rating) : void 0,
    reviewText: row.review_text || void 0,
    hasSpoilers: Boolean(row.has_spoilers),
    isFavorite: Boolean(row.is_favorite),
    isLiked: Boolean(row.is_liked),
    loggedDate: row.logged_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}
async function upsertGameLog(log) {
  const canonicalId = canonicalUserId(log.userId);
  const logId = log.id && !log.id.startsWith("log-") ? log.id : `log-${canonicalId}-${log.gameId}`;
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
      log.loggedDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      log.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      log.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    ]
  });
}
async function deleteGameLog(userId, logId) {
  const variants = userIdVariants(userId);
  const where = variants.map(() => "user_id = ?").join(" OR ");
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
    }).catch(() => {
    });
  }
  return result.rowsAffected > 0;
}
async function getAllReviews(gameId) {
  const sql = gameId ? `SELECT r.*, 
         COALESCE(p.display_name, p.username, r.username) as live_username,
         COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
         (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count 
       FROM reviews r 
       LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
       WHERE r.game_id = ? 
       ORDER BY r.created_at DESC LIMIT 100` : `SELECT r.*, 
         COALESCE(p.display_name, p.username, r.username) as live_username,
         COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
         (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count 
       FROM reviews r 
       LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
       ORDER BY r.created_at DESC LIMIT 100`;
  const args = gameId ? [gameId] : [];
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.live_username || row.username,
    userAvatar: row.live_avatar || row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : void 0,
    reviewText: row.review_text,
    hasSpoilers: Boolean(row.has_spoilers),
    isLiked: Boolean(row.is_liked),
    likesCount: Number(row.likes_count) || 0,
    commentsCount: Number(row.comments_count) || 0,
    loggedDate: row.logged_date,
    createdAt: row.created_at
  }));
}
async function getUserReviews(userId) {
  const cleanId = (userId || "").trim();
  const rawNumId = cleanId.replace("user-roblox-", "");
  const prefixedId = cleanId.startsWith("user-roblox-") ? cleanId : `user-roblox-${cleanId}`;
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
  return result.rows.map((row) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.live_username || row.username,
    userAvatar: row.live_avatar || row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : void 0,
    reviewText: row.review_text,
    hasSpoilers: Boolean(row.has_spoilers),
    isLiked: Boolean(row.is_liked),
    likesCount: Number(row.likes_count) || 0,
    commentsCount: Number(row.comments_count) || 0,
    loggedDate: row.logged_date,
    createdAt: row.created_at
  }));
}
async function upsertReview(rev) {
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
      rev.gameTitle || "",
      rev.gameIcon || "",
      canonicalId,
      rev.username,
      rev.userAvatar || "",
      rev.rating ?? null,
      rev.reviewText,
      rev.hasSpoilers ? 1 : 0,
      rev.isLiked ? 1 : 0,
      rev.likesCount || 0,
      rev.loggedDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      rev.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    ]
  });
}
async function toggleReviewLike(userId, reviewId) {
  const uid = canonicalUserId(userId);
  const ins = await db.execute({
    sql: `INSERT INTO review_likes (user_id, review_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
    args: [uid, reviewId]
  });
  if (ins.rowsAffected > 0) {
    await db.batch([
      { sql: `UPDATE reviews SET likes_count = likes_count + 1 WHERE id = ?`, args: [reviewId] }
    ], "write");
    const rev2 = await db.execute({ sql: `SELECT likes_count FROM reviews WHERE id = ?`, args: [reviewId] });
    return { liked: true, likesCount: Number(rev2.rows[0]?.likes_count || 1) };
  }
  await db.batch([
    { sql: `DELETE FROM review_likes WHERE user_id = ? AND review_id = ?`, args: [uid, reviewId] },
    { sql: `UPDATE reviews SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`, args: [reviewId] }
  ], "write");
  const rev = await db.execute({ sql: `SELECT likes_count FROM reviews WHERE id = ?`, args: [reviewId] });
  return { liked: false, likesCount: Number(rev.rows[0]?.likes_count || 0) };
}
async function getAllCustomLists(currentUserId) {
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
  return result.rows.map((row) => ({
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
async function upsertCustomList(list) {
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
      list.userAvatar || "",
      list.title,
      list.description || "",
      list.isRanked ? 1 : 0,
      list.isPublic !== false ? 1 : 0,
      itemsJson,
      list.likesCount || 0,
      list.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    ]
  });
}
async function deleteCustomList(userId, listId) {
  const result = await db.execute({
    sql: `DELETE FROM custom_lists WHERE id = ? AND user_id = ?`,
    args: [listId, canonicalUserId(userId)]
  });
  return result.rowsAffected > 0;
}
async function toggleListLike(userId, listId) {
  const uid = canonicalUserId(userId);
  const ins = await db.execute({
    sql: `INSERT INTO list_likes (user_id, list_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
    args: [uid, listId]
  });
  if (ins.rowsAffected > 0) {
    await db.batch([
      { sql: `UPDATE custom_lists SET likes_count = likes_count + 1 WHERE id = ?`, args: [listId] }
    ], "write");
    const item2 = await db.execute({ sql: `SELECT likes_count FROM custom_lists WHERE id = ?`, args: [listId] });
    return { liked: true, likesCount: Number(item2.rows[0]?.likes_count || 1) };
  }
  await db.batch([
    { sql: `DELETE FROM list_likes WHERE user_id = ? AND list_id = ?`, args: [uid, listId] },
    { sql: `UPDATE custom_lists SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`, args: [listId] }
  ], "write");
  const item = await db.execute({ sql: `SELECT likes_count FROM custom_lists WHERE id = ?`, args: [listId] });
  return { liked: false, likesCount: Number(item.rows[0]?.likes_count || 0) };
}
async function toggleFollowUser(followerId, followingId) {
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
      args: [followerId, followingId, (/* @__PURE__ */ new Date()).toISOString()]
    });
  }
  return getFollowStatus(followerId, followingId);
}
async function getFollowStatus(currentUserId, targetUserId) {
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
async function getCommunityFeed(userId) {
  const canonicalId = userId ? canonicalUserId(userId) : null;
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
  const activities = [];
  for (const r of reviewsRes.rows) {
    activities.push({
      id: `act-rev-${r.id}`,
      type: "review",
      userId: r.user_id,
      username: r.username,
      userAvatar: r.user_avatar,
      gameId: r.game_id,
      gameTitle: r.game_title,
      gameIcon: r.game_icon,
      rating: r.rating !== null ? Number(r.rating) : void 0,
      text: r.review_text,
      likesCount: Number(r.likes_count) || 0,
      createdAt: r.created_at
    });
  }
  for (const l of listsRes.rows) {
    const items = l.items ? JSON.parse(l.items) : [];
    activities.push({
      id: `act-list-${l.id}`,
      type: "list",
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
async function getTrendingReviewsAndLeaderboard() {
  const trendingRes = await db.execute(`
    SELECT r.*,
           COALESCE(p.display_name, p.username, r.username) as live_username,
           COALESCE(p.avatar_url, r.user_avatar) as live_avatar,
           (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comments_count
    FROM reviews r
    LEFT JOIN user_profiles p ON (p.id = r.user_id OR p.roblox_user_id = r.user_id)
    ORDER BY r.likes_count DESC, r.created_at DESC LIMIT 8
  `);
  const trendingReviews = trendingRes.rows.map((row) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.live_username || row.username,
    userAvatar: row.live_avatar || row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : void 0,
    reviewText: row.review_text,
    likesCount: Number(row.likes_count) || 0,
    commentsCount: Number(row.comments_count) || 0,
    loggedDate: row.logged_date,
    createdAt: row.created_at
  }));
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
  const leaderboard = leadRes.rows.map((row, idx) => ({
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
async function getReviewComments(reviewId) {
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
  return result.rows.map((r) => ({
    id: r.id,
    reviewId: r.review_id,
    userId: r.user_id,
    username: r.live_username || r.username,
    userAvatar: r.live_avatar || r.user_avatar,
    commentText: r.comment_text,
    createdAt: r.created_at
  }));
}
async function addReviewComment(comment) {
  const id = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute({
    sql: `
      INSERT INTO review_comments (id, review_id, user_id, username, user_avatar, comment_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [id, comment.reviewId, canonicalUserId(comment.userId), comment.username, comment.userAvatar || "", comment.commentText, now]
  });
  return {
    id,
    reviewId: comment.reviewId,
    userId: comment.userId,
    username: comment.username,
    userAvatar: comment.userAvatar || "",
    commentText: comment.commentText,
    createdAt: now
  };
}
async function deleteReviewComment(userId, commentId) {
  const result = await db.execute({
    sql: `DELETE FROM review_comments WHERE id = ? AND user_id = ?`,
    args: [commentId, canonicalUserId(userId)]
  });
  return result.rowsAffected > 0;
}
function mapRowToGame(row) {
  let ratingHistogram = {};
  if (row.rating_histogram) {
    try {
      ratingHistogram = typeof row.rating_histogram === "string" ? JSON.parse(row.rating_histogram) : row.rating_histogram;
    } catch (e) {
      ratingHistogram = {};
    }
  }
  let tags = [];
  if (row.tags) {
    try {
      tags = typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags;
    } catch (e) {
      tags = [];
    }
  }
  return {
    id: row.id,
    universeId: Number(row.universe_id) || 0,
    rootPlaceId: Number(row.root_place_id) || 0,
    name: row.name,
    description: row.description || "",
    creatorName: row.creator_name || "Roblox Creator",
    creatorType: row.creator_type || "Group",
    iconUrl: row.icon_url || "",
    bannerUrl: row.banner_url || void 0,
    genre: row.genre || "Adventure",
    playerCount: Number(row.player_count) || 0,
    totalVisits: row.total_visits || "0",
    rawVisits: Number(row.raw_visits) || 0,
    favoritedCount: Number(row.favorited_count) || 0,
    upVotes: Number(row.up_votes) || 0,
    downVotes: Number(row.down_votes) || 0,
    releaseYear: Number(row.release_year) || (/* @__PURE__ */ new Date()).getFullYear(),
    ratingAverage: Number(row.rating_average) || 4.5,
    ratingCount: Number(row.rating_count) || 0,
    ratingHistogram,
    tags: Array.isArray(tags) ? tags : []
  };
}
async function getAllGames(limit = 2e3) {
  const result = await db.execute({
    sql: "SELECT * FROM games ORDER BY player_count DESC, updated_at DESC LIMIT ?",
    args: [limit]
  });
  return result.rows.map(mapRowToGame);
}
async function getGameById(id) {
  const numId = isNaN(Number(id)) ? -1 : Number(id);
  const result = await db.execute({
    sql: "SELECT * FROM games WHERE id = ? OR universe_id = ? OR root_place_id = ? LIMIT 1",
    args: [id, numId, numId]
  });
  if (result.rows.length === 0) return null;
  return mapRowToGame(result.rows[0]);
}
async function upsertGame(g) {
  if (!g || !g.id) return;
  try {
    const existing = await db.execute({
      sql: "SELECT 1 FROM games WHERE id = ? LIMIT 1",
      args: [g.id]
    });
    if (existing.rows.length > 0) {
      return;
    }
  } catch (e) {
  }
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
      g.description || "",
      g.creatorName || "Roblox Creator",
      g.creatorType || "Group",
      g.iconUrl || "",
      g.bannerUrl || null,
      g.genre || "Adventure",
      g.playerCount || 0,
      g.totalVisits || "0",
      g.rawVisits || 0,
      g.favoritedCount || 0,
      g.upVotes || 0,
      g.downVotes || 0,
      g.releaseYear || (/* @__PURE__ */ new Date()).getFullYear(),
      g.ratingAverage || 0,
      g.ratingCount || 0,
      ratingHistJson,
      tagsJson,
      now
    ]
  });
}
async function bulkUpsertGames(games) {
  if (!games || games.length === 0) return;
  const validGames = games.filter((g) => g && g.id);
  if (validGames.length === 0) return;
  const ids = validGames.map((g) => g.id);
  const existingIds = /* @__PURE__ */ new Set();
  const CHECK_BATCH = 50;
  for (let i = 0; i < ids.length; i += CHECK_BATCH) {
    const chunkIds = ids.slice(i, i + CHECK_BATCH);
    const placeholders = chunkIds.map(() => "?").join(",");
    try {
      const res = await db.execute({
        sql: `SELECT id FROM games WHERE id IN (${placeholders})`,
        args: chunkIds
      });
      for (const r of res.rows) {
        if (r?.id) existingIds.add(String(r.id));
      }
    } catch (err) {
      console.warn("[Database] Pre-insert check error:", err);
    }
  }
  const newGames = validGames.filter((g) => !existingIds.has(g.id));
  if (newGames.length === 0) {
    return;
  }
  const BATCH_SIZE = 25;
  const now = Date.now();
  for (let i = 0; i < newGames.length; i += BATCH_SIZE) {
    const chunk = newGames.slice(i, i + BATCH_SIZE);
    const statements = chunk.map((g) => ({
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
        g.description || "",
        g.creatorName || "Roblox Creator",
        g.creatorType || "Group",
        g.iconUrl || "",
        g.bannerUrl || null,
        g.genre || "Adventure",
        g.playerCount || 0,
        g.totalVisits || "0",
        g.rawVisits || 0,
        g.favoritedCount || 0,
        g.upVotes || 0,
        g.downVotes || 0,
        g.releaseYear || (/* @__PURE__ */ new Date()).getFullYear(),
        g.ratingAverage || 0,
        g.ratingCount || 0,
        JSON.stringify(g.ratingHistogram || {}),
        JSON.stringify(g.tags || []),
        now
      ]
    }));
    try {
      await db.batch(statements, "write");
    } catch (e) {
      console.warn("[Database] batch insert chunk error, falling back to sequential:", e);
      for (const stmt of statements) {
        try {
          await db.execute(stmt);
        } catch (singleErr) {
          console.warn("[Database] Failed to insert single game:", singleErr);
        }
      }
    }
  }
}

// src/lib/roblox.ts
import crypto2 from "crypto";
var gameCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
function extractPlaceId(input) {
  const cleanInput = input.trim();
  if (/^\d+$/.test(cleanInput)) {
    return parseInt(cleanInput, 10);
  }
  const match = cleanInput.match(/roblox\.com\/games\/(\d+)/i) || cleanInput.match(/placeId=(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}
function computeRatingStats(upVotes, downVotes) {
  const up = Math.max(0, upVotes || 0);
  const down = Math.max(0, downVotes || 0);
  const total = up + down;
  if (total === 0) {
    return {
      ratingAverage: 4.5,
      ratingCount: 0,
      ratingHistogram: {
        "0.5": 0,
        "1.0": 0,
        "1.5": 0,
        "2.0": 0,
        "2.5": 0,
        "3.0": 0,
        "3.5": 0,
        "4.0": 0,
        "4.5": 0,
        "5.0": 0
      }
    };
  }
  const ratingHistogram = {
    "0.5": Math.round(down * 0.2),
    "1.0": Math.round(down * 0.2),
    "1.5": Math.round(down * 0.15),
    "2.0": Math.round(down * 0.15),
    "2.5": Math.round(down * 0.15),
    "3.0": Math.round(down * 0.15),
    "3.5": Math.round(up * 0.05),
    "4.0": Math.round(up * 0.15),
    "4.5": Math.round(up * 0.25),
    "5.0": Math.round(up * 0.55)
  };
  let sum = 0;
  let count = 0;
  for (const [star, c] of Object.entries(ratingHistogram)) {
    sum += parseFloat(star) * c;
    count += c;
  }
  const ratingAverage = count > 0 ? Math.round(sum / count * 10) / 10 : 4.5;
  return {
    ratingAverage,
    ratingCount: total,
    ratingHistogram
  };
}
function extractRobloxGenreMetadata(rawGenre, genreL1, genreL2) {
  const l1 = (genreL1 || "").trim();
  const l2 = (genreL2 || "").trim();
  const legacy = (rawGenre || "").trim();
  let primaryGenre = l1;
  if (!primaryGenre && legacy && legacy.toLowerCase() !== "all") {
    primaryGenre = legacy;
  }
  if (!primaryGenre) {
    primaryGenre = "Variety";
  }
  let subgenre = l2 || void 0;
  if (!subgenre && legacy && legacy.toLowerCase() !== "all" && legacy.toLowerCase() !== primaryGenre.toLowerCase()) {
    subgenre = legacy;
  }
  const tags = ["roblox"];
  if (primaryGenre && primaryGenre !== "Variety") tags.push(primaryGenre.toLowerCase());
  if (subgenre) tags.push(subgenre.toLowerCase());
  if (legacy && legacy !== "All" && !tags.includes(legacy.toLowerCase())) tags.push(legacy.toLowerCase());
  return {
    genre: primaryGenre,
    subgenre,
    genre_l1: l1 || void 0,
    genre_l2: l2 || void 0,
    tags
  };
}
async function fetchUniverseDetails(universeId, placeId) {
  const [gamesRes, votesRes, iconRes, thumbRes] = await Promise.all([
    fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`, {
      headers: { "User-Agent": "Bloxboxd/1.0" }
    }),
    fetch(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`, {
      headers: { "User-Agent": "Bloxboxd/1.0" }
    }),
    fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`, {
      headers: { "User-Agent": "Bloxboxd/1.0" }
    }),
    fetch(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`, {
      headers: { "User-Agent": "Bloxboxd/1.0" }
    })
  ]);
  let gameInfo = null;
  if (gamesRes.ok) {
    const gamesData = await gamesRes.json();
    if (gamesData.data && gamesData.data.length > 0) {
      gameInfo = gamesData.data[0];
    }
  }
  let upVotes = 0;
  let downVotes = 0;
  if (votesRes.ok) {
    const votesData = await votesRes.json();
    if (votesData.data && votesData.data.length > 0) {
      upVotes = votesData.data[0].upVotes || 0;
      downVotes = votesData.data[0].downVotes || 0;
    }
  }
  let iconUrl = "";
  if (iconRes.ok) {
    const iconData = await iconRes.json();
    if (iconData.data && iconData.data.length > 0 && iconData.data[0].imageUrl) {
      iconUrl = iconData.data[0].imageUrl;
    }
  }
  let bannerUrl = "";
  if (thumbRes.ok) {
    const thumbData = await thumbRes.json();
    if (thumbData.data && thumbData.data.length > 0 && thumbData.data[0].thumbnails?.[0]?.imageUrl) {
      bannerUrl = thumbData.data[0].thumbnails[0].imageUrl;
    }
  }
  const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
  const rawVisits = gameInfo?.visits || 0;
  const favoritedCount = gameInfo?.favoritedCount || 0;
  const genreMeta = extractRobloxGenreMetadata(
    gameInfo?.genre,
    gameInfo?.genre_l1,
    gameInfo?.genre_l2
  );
  return {
    id: `roblox-${universeId}`,
    universeId,
    rootPlaceId: placeId || gameInfo?.rootPlaceId || 0,
    name: gameInfo?.name || `Roblox Experience #${placeId}`,
    description: gameInfo?.description || "No description provided by creator.",
    creatorName: gameInfo?.creator?.name || "Roblox Creator",
    creatorType: gameInfo?.creator?.type || "Group",
    iconUrl: iconUrl || "https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter",
    bannerUrl: bannerUrl || void 0,
    genre: genreMeta.genre,
    subgenre: genreMeta.subgenre,
    genre_l1: genreMeta.genre_l1,
    genre_l2: genreMeta.genre_l2,
    playerCount: gameInfo?.playing || 0,
    totalVisits: rawVisits ? Number(rawVisits).toLocaleString() : "0",
    rawVisits,
    favoritedCount,
    upVotes,
    downVotes,
    releaseYear: gameInfo?.created ? new Date(gameInfo.created).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear(),
    ratingAverage,
    ratingCount,
    ratingHistogram,
    tags: ["roblox", "live-game", ...genreMeta.tags]
  };
}
var cachedDbCatalog = [];
var lastDbCatalogFetchTime = 0;
var DB_CATALOG_CACHE_TTL = 5 * 60 * 1e3;
async function getCachedDbCatalog() {
  const now = Date.now();
  if (cachedDbCatalog.length > 0 && now - lastDbCatalogFetchTime < DB_CATALOG_CACHE_TTL) {
    return cachedDbCatalog;
  }
  try {
    cachedDbCatalog = await getAllGames(500);
    lastDbCatalogFetchTime = now;
  } catch (e) {
    console.error("Failed to refresh db catalog cache:", e);
  }
  return cachedDbCatalog;
}
var onlineSearchCache = /* @__PURE__ */ new Map();
var SEARCH_CACHE_TTL = 10 * 60 * 1e3;
var universeDetailsCache = /* @__PURE__ */ new Map();
var UNIVERSE_DETAILS_CACHE_TTL = 30 * 60 * 1e3;
async function fetchBatchUniverseDetails(universeIds) {
  const resultMap = /* @__PURE__ */ new Map();
  if (!universeIds || universeIds.length === 0) return resultMap;
  const missingIds = [];
  const now = Date.now();
  for (const uid of universeIds) {
    if (!uid) continue;
    const cached = universeDetailsCache.get(uid);
    if (cached && now - cached.timestamp < UNIVERSE_DETAILS_CACHE_TTL) {
      resultMap.set(uid, cached.data);
    } else {
      missingIds.push(uid);
    }
  }
  if (missingIds.length === 0) {
    return resultMap;
  }
  const uniqueMissing = Array.from(new Set(missingIds));
  const CHUNK_SIZE = 40;
  await Promise.all(
    Array.from({ length: Math.ceil(uniqueMissing.length / CHUNK_SIZE) }, async (_, idx) => {
      const chunk = uniqueMissing.slice(idx * CHUNK_SIZE, (idx + 1) * CHUNK_SIZE);
      const endpoints = [
        `https://games.roproxy.com/v1/games?universeIds=${chunk.join(",")}`,
        `https://games.roblox.com/v1/games?universeIds=${chunk.join(",")}`
      ];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            headers: { "User-Agent": "Bloxboxd/1.0" }
          });
          if (res.ok) {
            const data = await res.json();
            for (const item of data.data || []) {
              if (item.id) {
                resultMap.set(item.id, item);
                universeDetailsCache.set(item.id, { data: item, timestamp: Date.now() });
              }
            }
            if (data.data && data.data.length > 0) break;
          }
        } catch (e) {
        }
      }
    })
  );
  return resultMap;
}
async function fetchBatchIcons(universeIds) {
  const iconMap = /* @__PURE__ */ new Map();
  if (!universeIds || universeIds.length === 0) return iconMap;
  const uniqueIds = Array.from(new Set(universeIds.filter(Boolean)));
  const CHUNK_SIZE = 50;
  await Promise.all(
    Array.from({ length: Math.ceil(uniqueIds.length / CHUNK_SIZE) }, async (_, idx) => {
      const chunk = uniqueIds.slice(idx * CHUNK_SIZE, (idx + 1) * CHUNK_SIZE);
      const iconEndpoints = [
        `https://thumbnails.roproxy.com/v1/games/icons?universeIds=${chunk.join(",")}&size=512x512&format=Png&isCircular=false`,
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${chunk.join(",")}&size=512x512&format=Png&isCircular=false`
      ];
      for (const ep of iconEndpoints) {
        try {
          const iconRes = await fetch(ep, { headers: { "User-Agent": "Bloxboxd/1.0" } });
          if (iconRes.ok) {
            const iconData = await iconRes.json();
            for (const ic of iconData.data || []) {
              if (ic.targetId && ic.imageUrl) {
                iconMap.set(ic.targetId, ic.imageUrl);
              }
            }
            if (iconMap.size > 0) break;
          }
        } catch (e) {
        }
      }
    })
  );
  return iconMap;
}
async function searchRobloxLiveOnline(rawQuery) {
  const query = rawQuery.trim();
  if (!query) return [];
  const cacheKey = query.toLowerCase();
  const cached = onlineSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    return cached.results;
  }
  const sessionId = crypto2.randomUUID();
  const searchEndpoints = [
    `https://apis.roproxy.com/search-api/omni-search?searchQuery=${encodeURIComponent(query)}&sessionId=${sessionId}`,
    `https://apis.roblox.com/search-api/omni-search?searchQuery=${encodeURIComponent(query)}&sessionId=${sessionId}`
  ];
  const rawGames = [];
  for (const ep of searchEndpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Referer": `https://www.roblox.com/discover/?Keyword=${encodeURIComponent(query)}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        for (const group of data.searchResults || []) {
          if (Array.isArray(group.contents)) {
            for (const item of group.contents) {
              if (item.universeId && item.name) {
                rawGames.push(item);
              }
            }
          }
        }
        if (rawGames.length > 0) break;
      } else if (res.status === 429) {
        console.warn(`[Roblox Search API] Rate limited (429) on ${ep}`);
      }
    } catch (err) {
      console.warn(`Search endpoint ${ep} failed:`, err);
    }
  }
  if (rawGames.length === 0) return [];
  const topGames = rawGames.slice(0, 40);
  const universeIds = topGames.map((g) => g.universeId);
  const [iconMap, universeDetailsMap] = await Promise.all([
    fetchBatchIcons(universeIds),
    fetchBatchUniverseDetails(universeIds)
  ]);
  const formattedResults = topGames.map((item) => {
    const details = universeDetailsMap.get(item.universeId);
    const upVotes = details?.favoritedCount || item.totalUpVotes || 0;
    const downVotes = item.totalDownVotes || 0;
    const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
    const iconUrl = iconMap.get(item.universeId) || "https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter";
    const rawVisits = details?.visits ?? ((item.playerCount || 0) * 18 || 1e4);
    const rawGenre = details?.genre || item.genre;
    const genreL1 = details?.genre_l1 || item.genreL1 || item.genre_l1;
    const genreL2 = details?.genre_l2 || item.genreL2 || item.genre_l2;
    const genreMeta = extractRobloxGenreMetadata(rawGenre, genreL1, genreL2);
    return {
      id: `roblox-${item.universeId}`,
      universeId: item.universeId,
      rootPlaceId: details?.rootPlaceId || item.rootPlaceId || 0,
      name: details?.name || item.name,
      description: details?.description || item.description || "",
      creatorName: details?.creator?.name || item.creatorName || "Roblox Creator",
      creatorType: details?.creator?.hasVerifiedBadge || item.creatorHasVerifiedBadge ? "Verified" : "Group",
      iconUrl,
      genre: genreMeta.genre,
      subgenre: genreMeta.subgenre,
      genre_l1: genreMeta.genre_l1,
      genre_l2: genreMeta.genre_l2,
      playerCount: details?.playing ?? (item.playerCount || 0),
      totalVisits: rawVisits ? Number(rawVisits).toLocaleString() : "10,000+",
      rawVisits,
      favoritedCount: upVotes,
      upVotes,
      downVotes,
      releaseYear: details?.created ? new Date(details.created).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear(),
      ratingAverage,
      ratingCount,
      ratingHistogram,
      tags: ["roblox", "live-search", ...genreMeta.tags].filter(Boolean)
    };
  });
  if (formattedResults.length > 0) {
    onlineSearchCache.set(cacheKey, { results: formattedResults, timestamp: Date.now() });
  }
  return formattedResults;
}
var cachedDiscoverGames = [];
var lastDiscoverFetchTime = 0;
var DISCOVER_CACHE_TTL = 10 * 60 * 1e3;
async function fetchLiveDiscoverGames() {
  if (cachedDiscoverGames.length > 50 && Date.now() - lastDiscoverFetchTime < DISCOVER_CACHE_TTL) {
    return cachedDiscoverGames;
  }
  const sessionId = crypto2.randomUUID();
  const sorts = ["CCU_Based_V1", "Top_Trending_V6", "Up_And_Coming_V6", "Fun_With_Friends_V4", "Top_Revisited_Existing_Users_V4"];
  const gameMap = /* @__PURE__ */ new Map();
  for (const sortId of sorts) {
    try {
      const res = await fetch(`https://apis.roproxy.com/explore-api/v1/get-sort-content?sessionId=${sessionId}&sortId=${sortId}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (res.ok) {
        const data = await res.json();
        for (const g of data.games || []) {
          if (g.universeId && !gameMap.has(g.universeId)) {
            gameMap.set(g.universeId, g);
          }
        }
      }
    } catch (e) {
    }
  }
  const allGames = Array.from(gameMap.values());
  if (allGames.length > 0) {
    cachedDiscoverGames = allGames;
    lastDiscoverFetchTime = Date.now();
  }
  return cachedDiscoverGames;
}
var omniSearchCache = /* @__PURE__ */ new Map();
var OMNI_SEARCH_CACHE_TTL = 10 * 60 * 1e3;
async function fetchRobloxOmniSearchPage(query, pageToken) {
  const cacheKey = `${query.toLowerCase().trim()}::${pageToken || ""}`;
  const cached = omniSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < OMNI_SEARCH_CACHE_TTL) {
    return cached.data;
  }
  const sessionId = crypto2.randomUUID();
  let url = `https://apis.roproxy.com/search-api/omni-search?searchQuery=${encodeURIComponent(query)}&sessionId=${sessionId}`;
  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }
  const endpoints = [
    url,
    url.replace("apis.roproxy.com", "apis.roblox.com")
  ];
  let searchData = null;
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*"
        }
      });
      if (res.ok) {
        searchData = await res.json();
        if (searchData?.searchResults) break;
      } else if (res.status === 429) {
        console.warn(`[Roblox Omni-Search] Rate limited (429) on ${ep}`);
      }
    } catch (e) {
    }
  }
  if (!searchData || !searchData.searchResults) {
    return { games: [] };
  }
  const rawGames = [];
  for (const group of searchData.searchResults) {
    if (Array.isArray(group.contents)) {
      for (const item of group.contents) {
        if (item.universeId && item.name) {
          rawGames.push(item);
        }
      }
    }
  }
  const result = {
    games: rawGames,
    nextPageToken: searchData.nextPageToken || void 0
  };
  if (rawGames.length > 0) {
    omniSearchCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }
  return result;
}
function installRobloxFetchFailover() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function(input, init) {
    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input?.url || "";
    if (urlStr.includes(".roblox.com")) {
      try {
        const res = await originalFetch(input, init);
        if (res.ok || res.status !== 403 && res.status !== 429) {
          return res;
        }
      } catch (e) {
      }
      const proxyUrl = urlStr.replace("https://games.roblox.com", "https://games.roproxy.com").replace("https://thumbnails.roblox.com", "https://thumbnails.roproxy.com").replace("https://users.roblox.com", "https://users.roproxy.com").replace("https://apis.roblox.com", "https://apis.roproxy.com").replace("https://friends.roblox.com", "https://friends.roproxy.com");
      return originalFetch(proxyUrl, init);
    }
    return originalFetch(input, init);
  };
}

// src/lib/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
var upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
var upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
var isConfigured = Boolean(upstashUrl && upstashToken);
var redis = null;
if (isConfigured) {
  try {
    redis = new Redis({ url: upstashUrl, token: upstashToken });
  } catch (err) {
    console.warn("[RateLimit] Upstash Redis init failed; limiter disabled:", err);
  }
}
var ipLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, "60 s"),
  prefix: "bloxboxd:ip:global",
  analytics: true
}) : null;
var strictIPLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  prefix: "bloxboxd:ip:roblox",
  analytics: true
}) : null;
var userLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, "60 s"),
  prefix: "bloxboxd:user:write",
  analytics: true
}) : null;
function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff) return xff.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}
function rateLimitHeaders(res, remaining, reset) {
  res.setHeader("RateLimit-Remaining", String(remaining));
  res.setHeader("RateLimit-Reset", String(reset));
}
async function checkLimit(limiter, identifier, res) {
  if (!limiter) return true;
  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    rateLimitHeaders(res, remaining, reset);
    if (!success) {
      res.status(429).json({
        error: "Too many requests. Please slow down.",
        code: "RATE_LIMITED",
        reset
      });
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[RateLimit] limiter error, failing open:", err);
    return true;
  }
}
async function globalIpRateLimit(req, res, next) {
  if (await checkLimit(ipLimiter, clientIp(req), res)) next();
}
async function strictRobloxRateLimit(req, res, next) {
  if (await checkLimit(strictIPLimiter, `roblox:${clientIp(req)}`, res)) next();
}
async function userWriteRateLimit(userId, res) {
  return checkLimit(userLimiter, userId, res);
}

// src/routes/roblox.ts
function registerRobloxRoutes(app2) {
  app2.get("/api/roblox/resolve", async (req, res) => {
    try {
      const query = (req.query.query || req.query.placeId || "").trim();
      if (!query) {
        return res.status(400).json({ error: "Query or placeId parameter is required" });
      }
      const placeId = extractPlaceId(query);
      if (!placeId) {
        try {
          const dbGames = await getCachedDbCatalog();
          const qLower = query.toLowerCase();
          const dbMatch = dbGames.find((g) => {
            const nameMatch = g.name.toLowerCase().includes(qLower);
            const creatorMatch = (g.creatorName || "").toLowerCase().includes(qLower);
            const tagMatch = Array.isArray(g.tags) && g.tags.some((t) => t.toLowerCase() === qLower);
            return nameMatch || creatorMatch || tagMatch;
          });
          if (dbMatch) {
            return res.json({ source: "database", ...dbMatch });
          }
        } catch (e) {
          console.warn("DB check in resolve error:", e);
        }
        const onlineResults = await searchRobloxLiveOnline(query);
        if (onlineResults.length > 0) {
          const bestMatch = onlineResults[0];
          await upsertGame(bestMatch).catch((e) => console.warn("[Database] Failed to upsert search result:", e));
          return res.json({ source: "roblox-online-search", ...bestMatch });
        }
        return res.status(404).json({ error: `Game "${query}" not found on Roblox. Coba masukkan Place ID atau link Roblox jika namanya spesifik.` });
      }
      const cacheKey = `place_${placeId}`;
      const cached = gameCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return res.json({ source: "cache", ...cached.data });
      }
      const universeRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, {
        headers: { "User-Agent": "Bloxboxd/1.0" }
      });
      if (!universeRes.ok) {
        return res.status(universeRes.status).json({
          error: `Failed to resolve Place ID ${placeId} on Roblox.`,
          status: universeRes.status
        });
      }
      const universeData = await universeRes.json();
      const universeId = universeData.universeId;
      if (!universeId) {
        return res.status(404).json({ error: "Universe ID not found for this Place" });
      }
      const resolvedGame = await fetchUniverseDetails(universeId, placeId);
      gameCache.set(cacheKey, { data: resolvedGame, timestamp: Date.now() });
      await upsertGame(resolvedGame).catch((e) => console.warn("[Database] Failed to upsert resolved game:", e));
      return res.json({ source: "roblox_api", ...resolvedGame });
    } catch (error) {
      console.error("Error resolving Roblox experience:", error);
      return res.status(500).json({ error: "Internal server error while contacting Roblox services" });
    }
  });
  app2.get("/api/roblox/batch", async (req, res) => {
    try {
      const universeIds = req.query.universeIds?.trim();
      if (!universeIds) {
        return res.status(400).json({ error: "universeIds parameter is required" });
      }
      const ids = universeIds.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length === 0) {
        return res.json({ data: [] });
      }
      const CHUNK_SIZE = 30;
      const chunks = [];
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        chunks.push(ids.slice(i, i + CHUNK_SIZE));
      }
      const allResults = [];
      await Promise.all(
        chunks.map(async (chunkIds) => {
          try {
            const [gamesRes, votesRes, iconRes, thumbRes] = await Promise.all([
              fetch(`https://games.roblox.com/v1/games?universeIds=${chunkIds.join(",")}`, {
                headers: { "User-Agent": "Bloxboxd/1.0" }
              }),
              fetch(`https://games.roblox.com/v1/games/votes?universeIds=${chunkIds.join(",")}`, {
                headers: { "User-Agent": "Bloxboxd/1.0" }
              }),
              fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${chunkIds.join(",")}&size=512x512&format=Png&isCircular=false`, {
                headers: { "User-Agent": "Bloxboxd/1.0" }
              }),
              fetch(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${chunkIds.join(",")}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`, {
                headers: { "User-Agent": "Bloxboxd/1.0" }
              })
            ]);
            const gamesData = gamesRes.ok ? await gamesRes.json() : { data: [] };
            const votesData = votesRes.ok ? await votesRes.json() : { data: [] };
            const iconData = iconRes.ok ? await iconRes.json() : { data: [] };
            const thumbData = thumbRes.ok ? await thumbRes.json() : { data: [] };
            for (const g of gamesData.data || []) {
              const icon = iconData.data?.find((i) => i.targetId === g.id)?.imageUrl || null;
              const banner = thumbData.data?.find((t) => t.universeId === g.id)?.thumbnails?.[0]?.imageUrl || null;
              const vote = votesData.data?.find((v) => v.id === g.id);
              const upVotes = vote?.upVotes || 0;
              const downVotes = vote?.downVotes || 0;
              const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
              const genreMeta = extractRobloxGenreMetadata(g.genre, g.genre_l1, g.genre_l2);
              allResults.push({
                universeId: g.id,
                rootPlaceId: g.rootPlaceId,
                name: g.name,
                description: g.description,
                creatorName: g.creator?.name,
                playerCount: g.playing || 0,
                totalVisits: g.visits ? Number(g.visits).toLocaleString() : "0",
                rawVisits: g.visits || 0,
                favoritedCount: g.favoritedCount || 0,
                upVotes,
                downVotes,
                genre: genreMeta.genre,
                subgenre: genreMeta.subgenre,
                genre_l1: genreMeta.genre_l1,
                genre_l2: genreMeta.genre_l2,
                tags: genreMeta.tags,
                ratingAverage,
                ratingCount,
                ratingHistogram,
                iconUrl: icon,
                bannerUrl: banner,
                updatedAt: Date.now()
              });
            }
          } catch (chunkErr) {
            console.error("Error fetching batch chunk:", chunkErr);
          }
        })
      );
      return res.json({ data: allResults, count: allResults.length, timestamp: Date.now() });
    } catch (err) {
      console.error("Error fetching batch roblox data:", err);
      return res.status(500).json({ error: "Failed to fetch batch data" });
    }
  });
  const MULTI_PAGE_QUERIES = {
    "All": [
      "popular top multiplayer games",
      "trending experiences",
      "anime action fighting battleground",
      "survival horror escape scary",
      "tycoon simulator business idle",
      "tactical shooter fps deathmatch",
      "open world adventure rpg quest",
      "obby parkour platformer tower",
      "tower defense strategy tactical",
      "roleplay life town city hangout",
      "racing driving vehicle simulator",
      "sports football basketball soccer",
      "simulator pet collecting clicking",
      "dungeon crawler fantasy mmorpg",
      "puzzle escape room mystery",
      "battle royale survival island",
      "stealth heist cops robbers",
      "war military army combat",
      "flight plane aviation simulator",
      "space sci-fi galaxy exploration",
      "zombie apocalypse defense",
      "magic wizard spell combat",
      "fashion dress up beauty salon",
      "restaurant cooking cafe culinary",
      "horror backrooms liminal entity",
      "superhero powers marvel dc",
      "naval pirate sea sailing ship",
      "underrated hidden gem indie",
      "classic roblox retro nostalgic",
      "cooperative story campaign quest"
    ],
    "Action": ["action fighting battleground", "anime combat duel", "boss fighting martial arts", "sword fight arena"],
    "Action / Fighting": ["action fighting battleground", "anime combat duel", "boss fighting martial arts", "sword fight arena"],
    "RPG": ["rpg adventure story quest", "dungeon crawler fantasy mmorpg", "open world exploration rpg", "class leveling rpg"],
    "Adventure / RPG": ["rpg adventure story quest", "dungeon crawler fantasy mmorpg", "open world exploration rpg", "class leveling rpg"],
    "Shooter": ["shooter fps deathmatch", "tactical gun combat sniper", "pvp war arena shooter", "team deathmatch gunfight"],
    "Shooter / FPS": ["shooter fps deathmatch", "tactical gun combat sniper", "pvp war arena shooter", "team deathmatch gunfight"],
    "Survival": ["survival escape horror", "apocalypse disaster survive", "wilderness base building survival", "island survival craft"],
    "Horror": ["horror scary creepy", "doors pressure psychological horror", "escape killer mystery haunted", "backrooms anomaly entity"],
    "Roleplay & Avatar Sim": ["roleplay life dress up avatar", "town city hangout club", "school family social life", "fashion show runway"],
    "Social / Roleplay": ["roleplay life dress up avatar", "town city hangout club", "school family social life", "fashion show runway"],
    "Simulation": ["simulation tycoon simulator", "business factory idle empire", "pet training collector sim", "farm trading market"],
    "Simulator / Tycoon": ["simulation tycoon simulator", "business factory idle empire", "pet training collector sim", "farm trading market"],
    "Strategy": ["strategy tower defense", "tactical army conquer base", "tds unit defense battle", "war tactics hex grid"],
    "Tower Defense": ["tower defense strategy", "tds defense tactical", "anime defenders tower", "survival tower defense"],
    "Obby & Platformer": ["obby platformer parkour", "tower of hell difficulty chart", "speed run jump obstacle", "impossible obby course"],
    "Obby / Parkour": ["obby platformer parkour", "tower of hell difficulty chart", "speed run jump obstacle", "impossible obby course"],
    "Party & Casual": ["party minigames casual", "board game funny physics", "trivia hide and seek party", "arcade party games"]
  };
  app2.get("/api/roblox/discover", async (req, res) => {
    try {
      const genre = (req.query.genre || "All").trim();
      const pageToken = (req.query.pageToken || "").trim();
      const page = Math.max(1, parseInt(req.query.page || "1", 10));
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "30", 10)));
      let rawGames = [];
      let nextPageToken = void 0;
      const queryList = MULTI_PAGE_QUERIES[genre] || MULTI_PAGE_QUERIES["All"];
      let queryIndex = 0;
      let actualRobloxToken = void 0;
      if (pageToken) {
        const colonIdx = pageToken.indexOf(":");
        if (colonIdx >= 0) {
          const parsedIdx = parseInt(pageToken.slice(0, colonIdx), 10);
          if (!isNaN(parsedIdx)) {
            queryIndex = parsedIdx;
            actualRobloxToken = pageToken.slice(colonIdx + 1).trim() || void 0;
          }
        } else {
          actualRobloxToken = pageToken;
        }
      }
      let activeQueryIdx = queryIndex % queryList.length;
      if (!pageToken && genre === "All") {
        const [exploreGames, omniRes] = await Promise.all([
          fetchLiveDiscoverGames(),
          fetchRobloxOmniSearchPage(queryList[0])
        ]);
        const combinedMap = /* @__PURE__ */ new Map();
        for (const g of exploreGames) {
          if (g.universeId) combinedMap.set(g.universeId, g);
        }
        for (const g of omniRes.games) {
          if (g.universeId && !combinedMap.has(g.universeId)) {
            combinedMap.set(g.universeId, g);
          }
        }
        rawGames = Array.from(combinedMap.values()).slice(0, limit);
        if (omniRes.nextPageToken) {
          nextPageToken = `0:${omniRes.nextPageToken}`;
        } else {
          nextPageToken = `1:`;
        }
      } else {
        let searchRes = await fetchRobloxOmniSearchPage(queryList[activeQueryIdx], actualRobloxToken);
        rawGames = searchRes.games;
        if (searchRes.nextPageToken) {
          nextPageToken = `${activeQueryIdx}:${searchRes.nextPageToken}`;
        } else {
          nextPageToken = `${(activeQueryIdx + 1) % queryList.length}:`;
        }
        if (rawGames.length === 0) {
          activeQueryIdx = (activeQueryIdx + 1) % queryList.length;
          searchRes = await fetchRobloxOmniSearchPage(queryList[activeQueryIdx]);
          rawGames = searchRes.games;
          if (searchRes.nextPageToken) {
            nextPageToken = `${activeQueryIdx}:${searchRes.nextPageToken}`;
          } else {
            nextPageToken = `${(activeQueryIdx + 1) % queryList.length}:`;
          }
        }
      }
      if (rawGames.length === 0) {
        const fallbackGames = await fetchLiveDiscoverGames();
        const offset = (page - 1) * limit;
        rawGames = fallbackGames.slice(offset, offset + limit);
      }
      if (rawGames.length === 0) {
        try {
          const dbGames = await getCachedDbCatalog();
          const filtered = genre !== "All" ? dbGames.filter((g) => (g.genre || "").toLowerCase().includes(genre.toLowerCase()) || (g.tags || []).some((t) => t.toLowerCase().includes(genre.toLowerCase()))) : dbGames;
          if (filtered.length > 0) {
            const isCursorPagination = Boolean(pageToken);
            const offset = isCursorPagination ? 0 : (page - 1) * limit;
            const slice = filtered.slice(offset, offset + limit);
            return res.json({
              games: slice,
              page,
              total: filtered.length,
              hasMore: isCursorPagination ? false : offset + limit < filtered.length,
              nextPageToken: void 0,
              source: "database-resilience-fallback"
            });
          }
        } catch (dbErr) {
          console.warn("Database fallback error in discover:", dbErr);
        }
        return res.json({ games: [], page, total: 0, hasMore: false, nextPageToken: void 0 });
      }
      const universeIds = rawGames.map((g) => g.universeId);
      const [iconMap, universeDetailsMap] = await Promise.all([
        fetchBatchIcons(universeIds),
        fetchBatchUniverseDetails(universeIds)
      ]);
      const formattedGames = rawGames.map((item) => {
        const details = universeDetailsMap.get(item.universeId);
        const upVotes = details?.favoritedCount || item.totalUpVotes || 0;
        const downVotes = item.totalDownVotes || 0;
        const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
        const iconUrl = iconMap.get(item.universeId) || "https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter";
        const rawVisits = details?.visits ?? ((item.playerCount || 0) * 20 || 1e4);
        const rawGenre = details?.genre || item.genre;
        const genreL1 = details?.genre_l1 || item.genreL1 || item.genre_l1;
        const genreL2 = details?.genre_l2 || item.genreL2 || item.genre_l2;
        const genreMeta = extractRobloxGenreMetadata(rawGenre, genreL1, genreL2);
        if (genre && genre !== "All" && (genreMeta.genre === "Variety" || !genreMeta.genre)) {
          genreMeta.genre = genre;
          if (!genreMeta.subgenre) genreMeta.subgenre = genre;
          if (!genreMeta.tags.includes(genre.toLowerCase())) {
            genreMeta.tags.push(genre.toLowerCase());
          }
        }
        return {
          id: `roblox-${item.universeId}`,
          universeId: item.universeId,
          rootPlaceId: details?.rootPlaceId || item.rootPlaceId || 0,
          name: details?.name || item.name,
          description: details?.description || item.description || `Popular Roblox experience with over ${(details?.playing || item.playerCount || 0).toLocaleString()} active players.`,
          creatorName: details?.creator?.name || item.creatorName || "Roblox Creator",
          creatorType: details?.creator?.hasVerifiedBadge || item.creatorHasVerifiedBadge ? "Verified" : "Group",
          iconUrl,
          genre: genreMeta.genre,
          subgenre: genreMeta.subgenre,
          genre_l1: genreMeta.genre_l1,
          genre_l2: genreMeta.genre_l2,
          playerCount: details?.playing ?? (item.playerCount || 0),
          totalVisits: rawVisits ? Number(rawVisits).toLocaleString() : "10,000+",
          rawVisits,
          favoritedCount: upVotes,
          upVotes,
          downVotes,
          releaseYear: details?.created ? new Date(details.created).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear(),
          ratingAverage,
          ratingCount,
          ratingHistogram,
          tags: ["roblox", "live-feed", ...genreMeta.tags]
        };
      });
      if (formattedGames.length > 0) {
        await bulkUpsertGames(formattedGames).catch((e) => console.warn("[Database] Failed to upsert discovered games:", e));
      }
      return res.json({
        games: formattedGames,
        page,
        total: formattedGames.length,
        hasMore: Boolean(nextPageToken) || formattedGames.length >= 10,
        nextPageToken
      });
    } catch (err) {
      console.error("Error in /api/roblox/discover:", err);
      return res.status(500).json({ error: "Failed to discover Roblox games" });
    }
  });
  app2.get("/api/roblox/search", async (req, res) => {
    try {
      const rawQuery = (req.query.q || req.query.query || "").trim();
      if (!rawQuery) {
        return res.json({ results: [], total: 0 });
      }
      const placeId = extractPlaceId(rawQuery);
      let catalog = [];
      try {
        catalog = await getCachedDbCatalog();
      } catch (e) {
        console.error("Failed to fetch catalog from database cache:", e);
      }
      if (placeId) {
        const existing = catalog.find((g) => g.rootPlaceId === placeId || g.universeId === placeId);
        if (existing) {
          return res.json({ results: [existing], total: 1 });
        }
        try {
          const uRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, {
            headers: { "User-Agent": "Bloxboxd/1.0" }
          });
          if (uRes.ok) {
            const uData = await uRes.json();
            if (uData.universeId) {
              const liveGame = await fetchUniverseDetails(uData.universeId, placeId);
              await upsertGame(liveGame).catch((e) => console.warn("[Database] Failed to upsert resolved liveGame:", e));
              return res.json({ results: [liveGame], total: 1 });
            }
          }
        } catch (err) {
        }
      }
      const qLower = rawQuery.toLowerCase();
      const queryTokens = qLower.split(/\s+/).filter(Boolean);
      const matches = [];
      const seenUniverses = /* @__PURE__ */ new Set();
      try {
        const liveResults = await searchRobloxLiveOnline(rawQuery);
        if (liveResults.length > 0) {
          await bulkUpsertGames(liveResults).catch((e) => console.warn("[Database] Failed to upsert search liveResults:", e));
        }
        for (const lr of liveResults) {
          if (!seenUniverses.has(lr.universeId)) {
            seenUniverses.add(lr.universeId);
            matches.push(lr);
          }
        }
      } catch (e) {
        console.error("Error fetching live online results during search:", e);
      }
      for (const g of catalog) {
        if (seenUniverses.has(g.universeId)) continue;
        const gName = g.name.toLowerCase();
        const gCreator = (g.creatorName || "").toLowerCase();
        const gGenre = (g.genre || "").toLowerCase();
        const gTags = Array.isArray(g.tags) ? g.tags.join(" ").toLowerCase() : "";
        const gPlace = (g.rootPlaceId || "").toString();
        if (gName.includes(qLower) || gCreator.includes(qLower) || gGenre.includes(qLower) || gTags.includes(qLower) || gPlace.includes(rawQuery)) {
          seenUniverses.add(g.universeId);
          matches.push(g);
        } else if (queryTokens.every((tok) => gName.includes(tok) || gCreator.includes(tok) || gGenre.includes(tok) || gTags.includes(tok))) {
          seenUniverses.add(g.universeId);
          matches.push(g);
        }
      }
      matches.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aExact = aName === qLower ? 4 : aName.startsWith(qLower) ? 3 : aName.includes(qLower) ? 2 : 1;
        const bExact = bName === qLower ? 4 : bName.startsWith(qLower) ? 3 : bName.includes(qLower) ? 2 : 1;
        if (aExact !== bExact) return bExact - aExact;
        return (b.playerCount || 0) - (a.playerCount || 0);
      });
      return res.json({ results: matches.slice(0, 40), total: matches.length });
    } catch (error) {
      console.error("Error in /api/roblox/search:", error);
      return res.status(500).json({ error: "Search failed" });
    }
  });
  app2.get("/api/roblox/user/lookup", async (req, res) => {
    try {
      const rawQuery = (req.query.q || req.query.username || "").trim();
      if (!rawQuery) {
        return res.status(400).json({ error: "Username, User ID, or profile URL is required" });
      }
      let userId = null;
      let fallbackUsername = rawQuery;
      const urlMatch = rawQuery.match(/roblox\.com\/users\/(\d+)/i);
      if (urlMatch && urlMatch[1]) {
        userId = parseInt(urlMatch[1], 10);
      } else if (/^\d+$/.test(rawQuery)) {
        userId = parseInt(rawQuery, 10);
      } else {
        const lookupRes = await fetch("https://users.roblox.com/v1/usernames/users", {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": "Bloxboxd/1.0" },
          body: JSON.stringify({ usernames: [rawQuery], excludeBannedUsers: false })
        });
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          if (lookupData.data && lookupData.data.length > 0) {
            userId = lookupData.data[0].id;
            fallbackUsername = lookupData.data[0].name;
          }
        }
      }
      if (!userId) {
        return res.status(404).json({ error: `Akun Roblox "${rawQuery}" tidak ditemukan. Pastikan username atau ID sudah benar.` });
      }
      const [userRes, headshotRes, bustRes, friendsRes] = await Promise.all([
        fetch(`https://users.roblox.com/v1/users/${userId}`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        }),
        fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        }),
        fetch(`https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${userId}&size=420x420&format=Png&isCircular=false`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        }),
        fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        })
      ]);
      const uData = userRes.ok ? await userRes.json() : {};
      const hData = headshotRes.ok ? await headshotRes.json() : {};
      const bData = bustRes.ok ? await bustRes.json() : {};
      const fData = friendsRes.ok ? await friendsRes.json() : {};
      const username = uData.name || fallbackUsername;
      const displayName = uData.displayName || username;
      const hasVerifiedBadge = !!uData.hasVerifiedBadge;
      const description = uData.description || "";
      const created = uData.created || "";
      const friendsCount = fData.count || 0;
      const headshotUrl = hData.data?.[0]?.imageUrl || "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-310966282D3529E36976BF6B07B1DC90-Png/420/420/AvatarHeadshot/Png/noFilter";
      const bustUrl = bData.data?.[0]?.imageUrl || headshotUrl;
      return res.json({
        success: true,
        user: {
          userId,
          username,
          displayName,
          hasVerifiedBadge,
          description,
          created,
          joinedYear: created ? new Date(created).getFullYear() : void 0,
          friendsCount,
          avatarHeadshotUrl: headshotUrl,
          avatarBustUrl: bustUrl
        }
      });
    } catch (err) {
      console.error("Error looking up Roblox user:", err);
      return res.status(500).json({ error: "Gagal mengambil data akun Roblox." });
    }
  });
  app2.get("/api/roblox/avatar", async (req, res) => {
    try {
      const username = req.query.username?.trim();
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }
      const userLookupRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
      });
      if (userLookupRes.ok) {
        const lookupData = await userLookupRes.json();
        if (lookupData.data && lookupData.data.length > 0) {
          const userId = lookupData.data[0].id;
          const displayName = lookupData.data[0].displayName;
          const thumbRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
          );
          if (thumbRes.ok) {
            const thumbData = await thumbRes.json();
            if (thumbData.data && thumbData.data[0]?.imageUrl) {
              return res.json({
                userId,
                displayName,
                avatarUrl: thumbData.data[0].imageUrl
              });
            }
          }
          return res.json({ userId, displayName, avatarUrl: null });
        }
      }
      return res.json({ avatarUrl: null });
    } catch (err) {
      return res.status(500).json({ error: "Failed to lookup avatar" });
    }
  });
  app2.get("/api/roblox/games/:universeId/badges", async (req, res) => {
    try {
      const universeId = parseInt(req.params.universeId, 10);
      if (!universeId || isNaN(universeId)) {
        return res.status(400).json({ error: "Valid universeId is required" });
      }
      const badgeRes = await fetch(`https://badges.roblox.com/v1/universes/${universeId}/badges?limit=10&sortOrder=Asc`, {
        headers: { "User-Agent": "Bloxboxd/1.0" }
      });
      if (!badgeRes.ok) {
        return res.json({ badges: [] });
      }
      const badgeData = await badgeRes.json();
      const rawBadges = Array.isArray(badgeData.data) ? badgeData.data : [];
      if (rawBadges.length === 0) {
        return res.json({ badges: [] });
      }
      const badgeIds = rawBadges.map((b) => b.id);
      const iconRes = await fetch(
        `https://thumbnails.roblox.com/v1/badges/icons?badgeIds=${badgeIds.join(",")}&size=150x150&format=Png`,
        { headers: { "User-Agent": "Bloxboxd/1.0" } }
      );
      const iconData = iconRes.ok ? await iconRes.json() : { data: [] };
      const iconMap = /* @__PURE__ */ new Map();
      for (const item of iconData.data || []) {
        if (item.targetId && item.imageUrl) {
          iconMap.set(item.targetId, item.imageUrl);
        }
      }
      const badges = rawBadges.map((b) => ({
        id: b.id,
        name: b.displayName || b.name,
        description: b.displayDescription || b.description || "",
        iconUrl: iconMap.get(b.id) || "",
        awardedCount: b.statistics?.awardedCount || 0,
        pastDayAwardedCount: b.statistics?.pastDayAwardedCount || 0,
        winRatePercentage: b.statistics?.winRatePercentage || 0
      }));
      return res.json({ badges });
    } catch (err) {
      console.warn("Error fetching badges:", err);
      return res.json({ badges: [] });
    }
  });
  app2.get("/api/roblox/games/:universeId/screenshots", async (req, res) => {
    try {
      const universeId = parseInt(req.params.universeId, 10);
      if (!universeId || isNaN(universeId)) {
        return res.status(400).json({ error: "Valid universeId is required" });
      }
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=6&size=768x432&format=Png&isCircular=false`,
        { headers: { "User-Agent": "Bloxboxd/1.0" } }
      );
      if (!thumbRes.ok) {
        return res.json({ screenshots: [] });
      }
      const thumbData = await thumbRes.json();
      const rawThumbs = thumbData.data?.[0]?.thumbnails || [];
      const screenshots = rawThumbs.map((t) => t.imageUrl).filter((url) => Boolean(url));
      return res.json({ screenshots });
    } catch (err) {
      console.warn("Error fetching screenshots:", err);
      return res.json({ screenshots: [] });
    }
  });
  app2.get("/api/roblox/user/:userId/favorites", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: "Valid userId is required" });
      }
      const favRes = await fetch(
        `https://games.roblox.com/v2/users/${userId}/favorite/games?limit=50&sortOrder=Desc`,
        { headers: { "User-Agent": "Bloxboxd/1.0" } }
      );
      if (!favRes.ok) {
        return res.json({ games: [] });
      }
      const favData = await favRes.json();
      const rawGames = Array.isArray(favData.data) ? favData.data : [];
      if (rawGames.length === 0) {
        return res.json({ games: [] });
      }
      const universeIds = rawGames.map((g) => g.id).filter(Boolean);
      const [iconMap, detailsMap] = await Promise.all([
        fetchBatchIcons(universeIds),
        fetchBatchUniverseDetails(universeIds)
      ]);
      const formattedGames = rawGames.map((item) => {
        const details = detailsMap.get(item.id);
        const iconUrl = iconMap.get(item.id) || "https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter";
        const rootPlaceId = details?.rootPlaceId || item.rootPlace?.id || 0;
        const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(details?.favoritedCount || 0, 0);
        return {
          id: `roblox-${item.id}`,
          universeId: item.id,
          rootPlaceId,
          name: details?.name || item.name,
          description: details?.description || item.description || "",
          creatorName: details?.creator?.name || item.creator?.name || "Roblox Creator",
          creatorType: details?.creator?.type || item.creator?.type || "Group",
          iconUrl,
          bannerUrl: void 0,
          genre: details?.genre || "Adventure",
          playerCount: details?.playing || 0,
          totalVisits: details?.visits ? Number(details.visits).toLocaleString() : "0",
          rawVisits: details?.visits || 0,
          favoritedCount: details?.favoritedCount || 0,
          upVotes: 0,
          downVotes: 0,
          releaseYear: details?.created ? new Date(details.created).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear(),
          ratingAverage: ratingAverage || 4.5,
          ratingCount: ratingCount || 0,
          ratingHistogram: ratingHistogram || {},
          tags: ["favorite", "roblox"]
        };
      });
      await bulkUpsertGames(formattedGames).catch(() => {
      });
      return res.json({ games: formattedGames });
    } catch (err) {
      console.error("Error fetching user favorite games:", err);
      return res.status(500).json({ error: "Failed to fetch user favorite games" });
    }
  });
}

// src/lib/auth.ts
var SESSION_COOKIE = "bb_session";
var SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}
function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S * 1e3
  });
}
function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
function extractSessionToken(req) {
  const fromCookie = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (fromCookie) return fromCookie;
  const header = req.headers["authorization"] || "";
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  const alt = req.headers["x-session-token"];
  return typeof alt === "string" && alt.trim() ? alt.trim() : void 0;
}
function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (origin) {
    try {
      const o = new URL(origin);
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      return Boolean(host) && o.host === String(host);
    } catch {
      return false;
    }
  }
  const fetchSite = req.headers["sec-fetch-site"];
  if (typeof fetchSite === "string") {
    return fetchSite === "same-origin";
  }
  return false;
}
async function requireAuth(req, res) {
  if (!isSameOrigin(req)) {
    res.status(403).json({ error: "Cross-origin request rejected.", code: "BAD_ORIGIN" });
    return null;
  }
  const token = extractSessionToken(req);
  const actorId = await resolveSessionUser(token);
  if (!actorId) {
    res.status(401).json({ error: "Authentication required. Please log in again.", code: "SESSION_INVALID" });
    return null;
  }
  if (!await userWriteRateLimit(actorId, res)) return null;
  return actorId;
}

// src/routes/account.ts
function registerAccountRoutes(app2) {
  app2.get("/api/roblox/account/status", async (req, res) => {
    const userIdStr = req.query.userId?.toString();
    if (!userIdStr) {
      return res.status(400).json({ error: "userId is required" });
    }
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    const actorId = await requireAuth(req, res);
    if (!actorId) return;
    if (canonicalUserId(userId) !== actorId) {
      return res.status(403).json({ error: "Can only query your own account status.", code: "FORBIDDEN" });
    }
    try {
      const account = await getAccountByUserId(userId);
      if (account) {
        return res.json({
          registered: true,
          username: account.username,
          verifiedAt: account.verifiedAt
        });
      }
      return res.json({
        registered: false
      });
    } catch (err) {
      console.error("Error fetching account status:", err);
      return res.status(500).json({ error: "Gagal memeriksa status akun" });
    }
  });
  app2.post("/api/roblox/account/logout", async (req, res) => {
    try {
      const token = extractSessionToken(req);
      if (token) {
        await deleteSession(token);
      }
      clearSessionCookie(res);
      return res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
      console.error("Logout error:", err);
      clearSessionCookie(res);
      return res.json({ success: true });
    }
  });
  app2.post("/api/roblox/account/logout-all", async (req, res) => {
    try {
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      await deleteAllSessions(actorId);
      clearSessionCookie(res);
      void recordLoginEvent({
        userId: actorId,
        event: "logout_all_sessions",
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"]
      });
      return res.json({ success: true, message: "Semua sesi berhasil dikeluarkan." });
    } catch (err) {
      console.error("Logout all error:", err);
      return res.status(500).json({ error: "Gagal keluar dari semua sesi" });
    }
  });
}

// src/routes/oauth.ts
import crypto3 from "crypto";

// src/lib/security.ts
function sanitizeText(input, maxLength = 2e3) {
  if (!input || typeof input !== "string") return "";
  return input.trim().replace(/[<>]/g, "").slice(0, maxLength);
}
function escapeHtml(input) {
  const amp = String.fromCharCode(38);
  return String(input ?? "").replace(/&/g, amp + "amp;").replace(/</g, amp + "lt;").replace(/>/g, amp + "gt;").replace(/["]/g, amp + "quot;").replace(/[']/g, amp + "#39;");
}
function safeJsonForScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

// src/routes/oauth.ts
var OAUTH_COOKIE = "roblox_oauth_state";
function getRedirectUri(req) {
  if (process.env.ROBLOX_REDIRECT_URI) {
    return process.env.ROBLOX_REDIRECT_URI;
  }
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  const proto = req.headers["x-forwarded-proto"] || (host.toString().includes("localhost") ? "http" : "https");
  return `${proto}://${host}/api/auth/roblox/callback`;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/auth/roblox/status", (req, res) => {
    const configured = Boolean(process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET);
    res.json({ configured });
  });
  app2.get("/api/auth/roblox/login", (req, res) => {
    const clientId = process.env.ROBLOX_CLIENT_ID;
    if (!clientId) {
      return res.status(500).send(`
        <html>
          <body style="background:#14181c;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
            <h2>Roblox OAuth 2.0 Belum Dikonfigurasi</h2>
            <p style="color:#9ab;">Harap tambahkan environment variable <code>ROBLOX_CLIENT_ID</code> dan <code>ROBLOX_CLIENT_SECRET</code> di .env atau dashboard hosting.</p>
            <p><a href="/" style="color:#00e054;">Kembali ke Bloxboxd</a></p>
          </body>
        </html>
      `);
    }
    const state = crypto3.randomBytes(16).toString("hex");
    const verifier = crypto3.randomBytes(32).toString("base64url");
    const challenge = crypto3.createHash("sha256").update(verifier).digest("base64url");
    const redirectUri = getRedirectUri(req);
    const cookiePayload = JSON.stringify({ state, verifier, redirectUri });
    res.cookie(OAUTH_COOKIE, Buffer.from(cookiePayload).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60 * 1e3
    });
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "openid profile",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256"
    });
    res.redirect(`https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`);
  });
  app2.get("/api/auth/roblox/callback", async (req, res) => {
    const { code, state, error, error_description } = req.query;
    if (error) {
      return res.status(400).send(`
        <html>
          <body style="background:#14181c;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
            <h2>Login Roblox Dibatalkan atau Gagal</h2>
            <p style="color:#ff6b6b;">${escapeHtml(error_description || error)}</p>
            <p><a href="/" style="color:#00e054;">Kembali ke Beranda</a></p>
          </body>
        </html>
      `);
    }
    if (!code || !state) {
      return res.status(400).send("Parameter code atau state tidak ditemukan.");
    }
    const cookies = parseCookies(req.headers.cookie);
    const rawStateCookie = cookies[OAUTH_COOKIE];
    if (!rawStateCookie) {
      return res.status(400).send("Sesi otentikasi telah kedaluwarsa. Silakan coba login kembali.");
    }
    let storedState;
    let storedVerifier;
    let storedRedirectUri;
    try {
      const parsed = JSON.parse(Buffer.from(rawStateCookie, "base64").toString("utf-8"));
      storedState = parsed.state;
      storedVerifier = parsed.verifier;
      storedRedirectUri = parsed.redirectUri;
    } catch {
      return res.status(400).send("Format sesi OAuth tidak valid.");
    }
    if (storedState !== state) {
      return res.status(403).send("Validasi anti-CSRF state gagal.");
    }
    const clientId = process.env.ROBLOX_CLIENT_ID;
    const clientSecret = process.env.ROBLOX_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).send("Server OAuth credentials missing.");
    }
    try {
      const tokenBody = new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        code_verifier: storedVerifier,
        redirect_uri: storedRedirectUri || getRedirectUri(req)
      });
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenRes = await fetch("https://apis.roblox.com/oauth/v1/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basicAuth}`
        },
        body: tokenBody.toString()
      });
      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("[OAuth] Token exchange failed:", errText);
        return res.status(502).send("Gagal menukarkan token dengan server Roblox: " + escapeHtml(errText));
      }
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      const userInfoRes = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (!userInfoRes.ok) {
        return res.status(502).send("Gagal memuat profil user dari Roblox API.");
      }
      const userInfo = await userInfoRes.json();
      const userId = Number(userInfo.sub);
      const username = userInfo.preferred_username || userInfo.name || `User_${userId}`;
      const displayName = userInfo.nickname || userInfo.name || username;
      const avatarUrl = userInfo.picture || "";
      await saveAccount({
        userId,
        username,
        verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      const profileId = `user-roblox-${userId}`;
      let profile = await getUserProfile(profileId);
      if (!profile) {
        await upsertUserProfile({
          id: profileId,
          robloxUserId: userId,
          username,
          handle: `@${username}`,
          displayName,
          avatarUrl,
          joinedDate: (/* @__PURE__ */ new Date()).toISOString(),
          favoriteGameIds: []
        });
        profile = await getUserProfile(profileId);
      } else if (avatarUrl && !profile.avatarUrl) {
        await upsertUserProfile({
          ...profile,
          avatarUrl,
          displayName: profile.displayName || displayName
        });
        profile = await getUserProfile(profileId);
      }
      const sessionToken = await createSession(userId);
      setSessionCookie(res, sessionToken);
      res.clearCookie(OAUTH_COOKIE, { path: "/" });
      void recordLoginEvent({
        userId,
        event: "roblox_oauth_success",
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"]
      });
      const clientUserData = {
        id: profileId,
        robloxUserId: userId,
        robloxUsername: username,
        username: profile?.username || username,
        displayName: profile?.displayName || displayName,
        handle: profile?.handle || `@${username}`,
        avatarUrl: profile?.avatarUrl || avatarUrl,
        avatarBustUrl: profile?.avatarBustUrl || "",
        bio: profile?.bio || "",
        joinedDate: profile?.joinedDate || (/* @__PURE__ */ new Date()).toISOString(),
        robloxJoinedDate: profile?.robloxJoinedDate || "",
        friendsCount: profile?.friendsCount || 0,
        favoriteGameIds: profile?.favoriteGameIds || [],
        isRobloxVerified: true
        // SECURITY: sessionToken is intentionally NOT sent to the client.
        // Auth rides entirely on the httpOnly `bb_session` cookie set above,
        // which the browser auto-attaches to same-origin requests.
      };
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Login Berhasil - Bloxboxd</title>
          <style>
            body { 
              background: #14181c; 
              color: #fff; 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              text-align: center;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background: #1c2228;
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 6px;
              padding: 28px 24px;
              max-width: 380px;
              width: 100%;
              box-shadow: 0 12px 32px rgba(0,0,0,0.6);
            }
            .spinner { 
              border: 3px solid rgba(255,255,255,0.1); 
              border-top-color: #00e054; 
              border-radius: 50%; 
              width: 32px; 
              height: 32px; 
              animation: spin 0.8s linear infinite; 
              margin: 0 auto 16px; 
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            h3 { margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #fff; }
            p { margin: 0 0 16px; font-size: 13px; color: #9ab; line-height: 1.4; }
            button {
              display: none;
              background: #00e054;
              color: #000;
              border: none;
              border-radius: 4px;
              padding: 10px 20px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
            }
            button:hover { background: #00c94b; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner" id="spinner"></div>
            <h3 id="title">Login Berhasil!</h3>
            <p id="msg">Menghubungkan akun Roblox kamu ke Bloxboxd...</p>
            <button id="closeBtn" onclick="window.close(); window.location.href='/';">Tutup Jendela</button>
          </div>
          <script>
            const user = ${safeJsonForScript(clientUserData)};
            
            // 1. Sync directly to localStorage
            try {
              localStorage.setItem('bloxboxd_user', JSON.stringify(user));
              localStorage.setItem('bloxboxd_oauth_event', JSON.stringify({ user, t: Date.now() }));
            } catch (e) {
              console.error(e);
            }

            // 2. Broadcast via BroadcastChannel (works across all tabs/windows on domain)
            try {
              if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('bloxboxd_auth');
                bc.postMessage({ type: 'BLOXBOXD_AUTH_SUCCESS', user: user });
                bc.close();
              }
            } catch (e) {
              console.error(e);
            }

            // 3. Post message to window.opener if accessible
            // SECURITY: restrict targetOrigin to our own origin so the user
            // object is never delivered to a cross-origin opener.
            try {
              if (window.opener && window.opener !== window) {
                window.opener.postMessage({ type: 'BLOXBOXD_AUTH_SUCCESS', user: user }, window.location.origin);
              }
            } catch (e) {
              console.error(e);
            }

            // 4. Close popup
            try {
              window.close();
            } catch (e) {}

            // 5. Fallback if browser prevents auto-close
            setTimeout(function() {
              if (!window.closed) {
                if (window.opener || window.outerWidth < 800) {
                  document.getElementById('spinner').style.display = 'none';
                  document.getElementById('msg').innerText = 'Autentikasi selesai. Kamu bisa menutup jendela ini.';
                  document.getElementById('closeBtn').style.display = 'inline-block';
                } else {
                  window.location.href = '/';
                }
              }
            }, 350);
          </script>
        </body>
        </html>
      `);
    } catch (err) {
      console.error("[OAuth Callback Error]:", err);
      return res.status(500).send("Terjadi kesalahan internal saat memproses autentikasi.");
    }
  });
}

// src/routes/catalog.ts
function registerCatalogRoutes(app2) {
  app2.get("/api/games", async (req, res) => {
    try {
      const limit = Math.max(1, Math.min(1e4, parseInt(req.query.limit || "2000", 10)));
      const games = await getAllGames(limit);
      return res.json({ games, count: games.length });
    } catch (err) {
      console.error("Error fetching games from database:", err);
      return res.status(500).json({ error: "Failed to fetch games" });
    }
  });
  app2.get("/api/games/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const game = await getGameById(id);
      if (!game) {
        return res.status(404).json({ error: "Game not found in database" });
      }
      return res.json({ game });
    } catch (err) {
      console.error("Error fetching game by id:", err);
      return res.status(500).json({ error: "Failed to fetch game" });
    }
  });
  app2.post("/api/games", async (req, res) => {
    try {
      const body = req.body;
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      if (Array.isArray(body)) {
        await bulkUpsertGames(body);
        return res.json({ success: true, count: body.length });
      } else if (body && (body.id || body.universeId)) {
        await upsertGame(body);
        return res.json({ success: true, game: body });
      }
      return res.status(400).json({ error: "Valid game object or array of games is required" });
    } catch (err) {
      console.error("Error upserting game:", err);
      return res.status(500).json({ error: "Failed to save game to database" });
    }
  });
}

// src/routes/user.ts
function registerUserRoutes(app2) {
  app2.get("/api/user/data", async (req, res) => {
    try {
      const userId = req.query.userId?.trim();
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const profile = await getUserProfile(userId);
      const logs = await getUserGameLogs(userId);
      const reviews = await getUserReviews(userId);
      return res.json({ profile, logs, reviews });
    } catch (err) {
      console.error("Error fetching user data:", err);
      return res.status(500).json({ error: "Failed to fetch user data" });
    }
  });
  app2.get("/api/users/search", async (req, res) => {
    try {
      const q = (req.query.q || "").trim();
      if (!q) {
        return res.json({ users: [] });
      }
      const users = await searchUserProfiles(q, 8);
      return res.json({ users });
    } catch (err) {
      console.error("Error searching users:", err);
      return res.status(500).json({ error: "Failed to search users" });
    }
  });
  app2.post("/api/user/profile", async (req, res) => {
    try {
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      const profile = req.body || {};
      profile.id = actorId;
      profile.robloxUserId = profile.robloxUserId || Number(String(actorId).replace("user-roblox-", ""));
      if (profile.bio !== void 0) profile.bio = sanitizeText(profile.bio, 500);
      if (profile.displayName !== void 0) profile.displayName = sanitizeText(profile.displayName, 80);
      if (profile.username !== void 0) profile.username = sanitizeText(profile.username, 50);
      await upsertUserProfile(profile);
      const updated = await getUserProfile(actorId);
      return res.json({ success: true, message: "Profile updated", profile: updated });
    } catch (err) {
      console.error("Error saving user profile:", err);
      return res.status(500).json({ error: "Failed to update user profile" });
    }
  });
  app2.post("/api/logs", async (req, res) => {
    try {
      const log = req.body;
      if (!log || !log.gameId) {
        return res.status(400).json({ error: "gameId is required" });
      }
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      log.userId = actorId;
      log.reviewText = sanitizeText(log.reviewText, 2500);
      await upsertGameLog(log);
      return res.json({ success: true, message: "Log saved" });
    } catch (err) {
      console.error("Error saving log:", err);
      return res.status(500).json({ error: "Failed to save log" });
    }
  });
  app2.delete("/api/logs/:id", async (req, res) => {
    try {
      const logId = req.params.id;
      if (!logId) {
        return res.status(400).json({ error: "logId is required" });
      }
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      const deleted = await deleteGameLog(actorId, logId);
      if (!deleted) {
        return res.status(404).json({ error: "Log not found" });
      }
      return res.json({ success: true, message: "Log deleted" });
    } catch (err) {
      console.error("Error deleting log:", err);
      return res.status(500).json({ error: "Failed to delete log" });
    }
  });
}

// src/routes/social.ts
function registerSocialRoutes(app2) {
  app2.get("/api/reviews", async (req, res) => {
    try {
      const gameId = req.query.gameId?.trim();
      const reviews = await getAllReviews(gameId);
      return res.json({ reviews });
    } catch (err) {
      console.error("Error fetching reviews:", err);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  app2.post("/api/reviews", async (req, res) => {
    try {
      const review = req.body;
      if (!review || !review.gameId || !review.reviewText?.trim()) {
        return res.status(400).json({ error: "Invalid review payload" });
      }
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      review.userId = actorId;
      review.reviewText = sanitizeText(review.reviewText, 3e3);
      review.username = sanitizeText(review.username, 50);
      await upsertReview(review);
      return res.json({ success: true, message: "Review saved" });
    } catch (err) {
      console.error("Error saving review:", err);
      return res.status(500).json({ error: "Failed to save review" });
    }
  });
  app2.post("/api/reviews/:id/like", async (req, res) => {
    try {
      const reviewId = req.params.id;
      if (!reviewId) {
        return res.status(400).json({ error: "reviewId is required" });
      }
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      const result = await toggleReviewLike(actorId, reviewId);
      return res.json({ success: true, ...result });
    } catch (err) {
      console.error("Error liking review:", err);
      return res.status(500).json({ error: "Failed to like review" });
    }
  });
  app2.get("/api/lists", async (req, res) => {
    try {
      const userId = req.query.userId?.trim();
      const lists = await getAllCustomLists(userId);
      return res.json({ lists });
    } catch (err) {
      console.error("Error fetching lists:", err);
      return res.status(500).json({ error: "Failed to fetch lists" });
    }
  });
  app2.post("/api/lists", async (req, res) => {
    try {
      const list = req.body;
      if (!list || !list.title?.trim()) {
        return res.status(400).json({ error: "title is required" });
      }
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      list.userId = actorId;
      list.title = sanitizeText(list.title, 120);
      list.description = sanitizeText(list.description, 1e3);
      list.userName = sanitizeText(list.userName, 50);
      await upsertCustomList(list);
      return res.json({ success: true, message: "List saved" });
    } catch (err) {
      console.error("Error saving list:", err);
      return res.status(500).json({ error: "Failed to save list" });
    }
  });
  app2.delete("/api/lists/:id", async (req, res) => {
    try {
      const listId = req.params.id;
      if (!listId) {
        return res.status(400).json({ error: "listId is required" });
      }
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      const deleted = await deleteCustomList(actorId, listId);
      if (!deleted) {
        return res.status(404).json({ error: "List not found" });
      }
      return res.json({ success: true, message: "List deleted" });
    } catch (err) {
      console.error("Error deleting list:", err);
      return res.status(500).json({ error: "Failed to delete list" });
    }
  });
  app2.post("/api/lists/:id/like", async (req, res) => {
    try {
      const listId = req.params.id;
      if (!listId) {
        return res.status(400).json({ error: "listId is required" });
      }
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      const result = await toggleListLike(actorId, listId);
      return res.json({ success: true, ...result });
    } catch (err) {
      console.error("Error liking list:", err);
      return res.status(500).json({ error: "Failed to like list" });
    }
  });
  app2.post("/api/users/:id/follow", async (req, res) => {
    try {
      const targetUserId = req.params.id;
      if (!targetUserId) {
        return res.status(400).json({ error: "targetUserId is required" });
      }
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      if (targetUserId === actorId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }
      const result = await toggleFollowUser(actorId, targetUserId);
      return res.json({ success: true, ...result });
    } catch (err) {
      console.error("Error toggling follow:", err);
      return res.status(500).json({ error: "Failed to toggle follow" });
    }
  });
  app2.get("/api/users/:id/follow-status", async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const currentUserId = req.query.currentUserId?.trim() || "";
      if (!targetUserId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const status = await getFollowStatus(currentUserId, targetUserId);
      return res.json(status);
    } catch (err) {
      console.error("Error fetching follow status:", err);
      return res.status(500).json({ error: "Failed to fetch follow status" });
    }
  });
  app2.get("/api/community/feed", async (req, res) => {
    try {
      const userId = req.query.userId?.trim();
      const feed = await getCommunityFeed(userId);
      return res.json({ feed });
    } catch (err) {
      console.error("Error fetching community feed:", err);
      return res.status(500).json({ error: "Failed to fetch community feed" });
    }
  });
  app2.get("/api/community/trending", async (req, res) => {
    try {
      const data = await getTrendingReviewsAndLeaderboard();
      return res.json(data);
    } catch (err) {
      console.error("Error fetching trending and leaderboard:", err);
      return res.status(500).json({ error: "Failed to fetch trending and leaderboard" });
    }
  });
  app2.get("/api/reviews/:id/comments", async (req, res) => {
    try {
      const reviewId = req.params.id;
      if (!reviewId) {
        return res.status(400).json({ error: "reviewId is required" });
      }
      const comments = await getReviewComments(reviewId);
      return res.json({ comments });
    } catch (err) {
      console.error("Error fetching review comments:", err);
      return res.status(500).json({ error: "Failed to fetch review comments" });
    }
  });
  app2.post("/api/reviews/:id/comments", async (req, res) => {
    try {
      const reviewId = req.params.id;
      const { username, userAvatar, commentText } = req.body;
      if (!reviewId || !commentText?.trim()) {
        return res.status(400).json({ error: "reviewId and non-empty commentText are required" });
      }
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      const cleanComment = sanitizeText(commentText, 600);
      const cleanUsername = sanitizeText(username, 50) || "RobloxPlayer";
      const comment = await addReviewComment({
        reviewId,
        userId: actorId,
        username: cleanUsername,
        userAvatar,
        commentText: cleanComment
      });
      return res.json({ success: true, comment });
    } catch (err) {
      console.error("Error adding review comment:", err);
      return res.status(500).json({ error: "Failed to add review comment" });
    }
  });
  app2.delete("/api/reviews/comments/:id", async (req, res) => {
    try {
      const commentId = req.params.id;
      if (!commentId) {
        return res.status(400).json({ error: "commentId is required" });
      }
      const actorId = await requireAuth(req, res);
      if (!actorId) return;
      const deleted = await deleteReviewComment(actorId, commentId);
      if (!deleted) {
        return res.status(404).json({ error: "Comment not found or unauthorized" });
      }
      return res.json({ success: true, message: "Comment deleted" });
    } catch (err) {
      console.error("Error deleting review comment:", err);
      return res.status(500).json({ error: "Failed to delete review comment" });
    }
  });
}

// server.ts
var app = express();
var PORT = 3e3;
installRobloxFetchFailover();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
if (!process.env.VERCEL) {
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.roblox.com https://*.rbxcdn.com; connect-src 'self' https://apis.roblox.com https://apis.roproxy.com https://avatar.roblox.com https://friends.roblox.com https://friends.roproxy.com https://games.roblox.com https://games.roproxy.com https://thumbnails.roblox.com https://thumbnails.roproxy.com https://users.roblox.com https://users.roproxy.com https://www.roblox.com https://*.rbxcdn.com https://*.roproxy.com; media-src 'self' https:; worker-src 'self' blob:; manifest-src 'self'; frame-src 'none'; upgrade-insecure-requests"
    );
    next();
  });
}
app.use(globalIpRateLimit);
app.use("/api/roblox", strictRobloxRateLimit);
var isDbInitialized = false;
var dbInitPromise = null;
app.use(async (req, res, next) => {
  const rawUrl = req.headers["x-matched-path"] || req.headers["x-vercel-matched-path"] || req.originalUrl;
  if (typeof rawUrl === "string" && rawUrl.startsWith("/api")) {
    req.url = rawUrl;
  }
  if (!isDbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDatabase().then(() => {
        isDbInitialized = true;
      }).catch((err) => {
        console.error("[Database Init Error]:", err);
        dbInitPromise = null;
      });
    }
    await dbInitPromise;
  }
  next();
});
app.get("/favicon.ico", (req, res) => {
  const iconPath = path2.join(process.cwd(), "public/favicon.svg");
  if (fs.existsSync(iconPath)) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.sendFile(iconPath);
  }
  return res.status(404).end();
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Bloxboxd API" });
});
registerRobloxRoutes(app);
registerOAuthRoutes(app);
registerAccountRoutes(app);
registerCatalogRoutes(app);
registerUserRoutes(app);
registerSocialRoutes(app);
async function startServer() {
  try {
    await initDatabase();
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use("/assets", express.static(path2.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true
    }));
    app.use(express.static(distPath, {
      maxAge: "1h"
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bloxboxd server listening on port ${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  server_default as default
};
