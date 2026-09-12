import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Game } from '../types';
import { INITIAL_GAMES } from '../data/initialGames';

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

  // Auto-seed initial catalog into database if table is empty
  try {
    const gameCountRes = await db.execute('SELECT COUNT(*) as count FROM games');
    const gameCount = Number(gameCountRes.rows[0]?.count || 0);
    if (gameCount === 0 && INITIAL_GAMES.length > 0) {
      console.log(`[Database] Seeding ${INITIAL_GAMES.length} initial games into database...`);
      await bulkUpsertGames(INITIAL_GAMES);
      console.log(`[Database] Seeded initial games successfully.`);
    }
  } catch (err) {
    console.warn('[Database] Failed to check/seed initial games:', err);
  }

  // Auto-migrate legacy registeredAccounts.json if exists
  const legacyAccountsFile = path.join(process.cwd(), 'src/data/registeredAccounts.json');
  if (fs.existsSync(legacyAccountsFile)) {
    try {
      const legacyData: Record<string, any> = JSON.parse(fs.readFileSync(legacyAccountsFile, 'utf8'));
      for (const [key, val] of Object.entries(legacyData)) {
        if (val && val.userId && val.pinHash) {
          await db.execute({
            sql: `
              INSERT OR IGNORE INTO accounts (user_id, username, pin_hash, salt, verified_at)
              VALUES (?, ?, ?, ?, ?)
            `,
            args: [val.userId, val.username || 'RobloxPlayer', val.pinHash, val.salt || '', val.verifiedAt || new Date().toISOString()]
          });
        }
      }
      console.log('[Database] Legacy registeredAccounts.json migrated to database.');
    } catch (err) {
      console.warn('[Database] Failed to migrate legacy accounts:', err);
    }
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
  pinHash: string;
  salt: string;
  verifiedAt: string;
}): Promise<void> {
  await db.execute({
    sql: `
      INSERT INTO accounts (user_id, username, pin_hash, salt, verified_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        pin_hash = excluded.pin_hash,
        salt = excluded.salt,
        verified_at = excluded.verified_at
    `,
    args: [data.userId, data.username, data.pinHash, data.salt, data.verifiedAt]
  });
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
  const favJson = JSON.stringify(profile.favoriteGameIds || []);
  await db.execute({
    sql: `
      INSERT INTO user_profiles (
        id, roblox_user_id, username, handle, display_name, avatar_url,
        avatar_bust_url, bio, joined_date, roblox_joined_date, friends_count, favorite_game_ids
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        handle = excluded.handle,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        avatar_bust_url = excluded.avatar_bust_url,
        bio = excluded.bio,
        friends_count = excluded.friends_count,
        favorite_game_ids = excluded.favorite_game_ids
    `,
    args: [
      profile.id,
      profile.robloxUserId || null,
      profile.username,
      profile.handle || `@${profile.username}`,
      profile.robloxDisplayName || profile.displayName || profile.username,
      profile.avatarUrl || '',
      profile.avatarBustUrl || '',
      profile.bio || '',
      profile.joinedDate || new Date().toISOString(),
      profile.robloxJoinedDate || '',
      profile.robloxFriendsCount ?? profile.friendsCount ?? 0,
      favJson
    ]
  });
}

// ---------------------------------------------------------------------------
// Game Logs Helper Functions
// ---------------------------------------------------------------------------

export async function getUserGameLogs(userId: string): Promise<any[]> {
  const result = await db.execute({
    sql: `SELECT * FROM game_logs WHERE user_id = ? ORDER BY logged_date DESC, updated_at DESC`,
    args: [userId]
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
      log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      log.userId,
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

export async function deleteGameLog(userId: string, logId: string): Promise<void> {
  await db.execute({
    sql: `DELETE FROM game_logs WHERE id = ? AND user_id = ?`,
    args: [logId, userId]
  });
}

// ---------------------------------------------------------------------------
// Community Reviews Helper Functions
// ---------------------------------------------------------------------------

export async function getAllReviews(gameId?: string): Promise<any[]> {
  const sql = gameId
    ? `SELECT * FROM reviews WHERE game_id = ? ORDER BY created_at DESC LIMIT 100`
    : `SELECT * FROM reviews ORDER BY created_at DESC LIMIT 100`;
  const args = gameId ? [gameId] : [];
  const result = await db.execute({ sql, args });

  return result.rows.map((row: any) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.username,
    userAvatar: row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : undefined,
    reviewText: row.review_text,
    hasSpoilers: Boolean(row.has_spoilers),
    isLiked: Boolean(row.is_liked),
    likesCount: Number(row.likes_count) || 0,
    loggedDate: row.logged_date,
    createdAt: row.created_at
  }));
}

export async function upsertReview(rev: any): Promise<void> {
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
      rev.id || `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rev.gameId,
      rev.gameTitle || '',
      rev.gameIcon || '',
      rev.userId,
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
  const existing = await db.execute({
    sql: `SELECT 1 FROM review_likes WHERE user_id = ? AND review_id = ?`,
    args: [userId, reviewId]
  });

  if (existing.rows.length > 0) {
    // Already liked -> remove like
    await db.execute({
      sql: `DELETE FROM review_likes WHERE user_id = ? AND review_id = ?`,
      args: [userId, reviewId]
    });
    await db.execute({
      sql: `UPDATE reviews SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`,
      args: [reviewId]
    });
    const rev = await db.execute({ sql: `SELECT likes_count FROM reviews WHERE id = ?`, args: [reviewId] });
    return { liked: false, likesCount: Number(rev.rows[0]?.likes_count || 0) };
  } else {
    // Not liked yet -> add like
    await db.execute({
      sql: `INSERT INTO review_likes (user_id, review_id) VALUES (?, ?)`,
      args: [userId, reviewId]
    });
    await db.execute({
      sql: `UPDATE reviews SET likes_count = likes_count + 1 WHERE id = ?`,
      args: [reviewId]
    });
    const rev = await db.execute({ sql: `SELECT likes_count FROM reviews WHERE id = ?`, args: [reviewId] });
    return { liked: true, likesCount: Number(rev.rows[0]?.likes_count || 1) };
  }
}

// ---------------------------------------------------------------------------
// Custom Lists Helper Functions
// ---------------------------------------------------------------------------

export async function getAllCustomLists(): Promise<any[]> {
  const result = await db.execute(`
    SELECT * FROM custom_lists WHERE is_public = 1 ORDER BY created_at DESC LIMIT 100
  `);
  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    title: row.title,
    description: row.description || '',
    isRanked: Boolean(row.is_ranked),
    isPublic: Boolean(row.is_public),
    items: row.items ? JSON.parse(row.items) : [],
    likesCount: Number(row.likes_count) || 0,
    createdAt: row.created_at
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
      list.userId,
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

export async function deleteCustomList(userId: string, listId: string): Promise<void> {
  await db.execute({
    sql: `DELETE FROM custom_lists WHERE id = ? AND user_id = ?`,
    args: [listId, userId]
  });
}

export async function toggleListLike(userId: string, listId: string): Promise<{ liked: boolean; likesCount: number }> {
  const existing = await db.execute({
    sql: `SELECT 1 FROM list_likes WHERE user_id = ? AND list_id = ?`,
    args: [userId, listId]
  });

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `DELETE FROM list_likes WHERE user_id = ? AND list_id = ?`,
      args: [userId, listId]
    });
    await db.execute({
      sql: `UPDATE custom_lists SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`,
      args: [listId]
    });
    const item = await db.execute({ sql: `SELECT likes_count FROM custom_lists WHERE id = ?`, args: [listId] });
    return { liked: false, likesCount: Number(item.rows[0]?.likes_count || 0) };
  } else {
    await db.execute({
      sql: `INSERT INTO list_likes (user_id, list_id) VALUES (?, ?)`,
      args: [userId, listId]
    });
    await db.execute({
      sql: `UPDATE custom_lists SET likes_count = likes_count + 1 WHERE id = ?`,
      args: [listId]
    });
    const item = await db.execute({ sql: `SELECT likes_count FROM custom_lists WHERE id = ?`, args: [listId] });
    return { liked: true, likesCount: Number(item.rows[0]?.likes_count || 1) };
  }
}

// ---------------------------------------------------------------------------
// Social Features: Follows, Feed, Comments, Trending & Leaderboard
// ---------------------------------------------------------------------------

export async function toggleFollowUser(followerId: string, followingId: string): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number }> {
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
  // Activity feed: combining latest reviews, high ratings, and created custom lists
  const reviewsRes = await db.execute(`
    SELECT r.id, r.game_id, r.game_title, r.game_icon, r.user_id, r.username,
           r.user_avatar, r.rating, r.review_text, r.likes_count, r.created_at,
           'review' as activity_type
    FROM reviews r
    ORDER BY r.created_at DESC LIMIT 30
  `);

  const listsRes = await db.execute(`
    SELECT l.id, l.user_id, l.user_name as username, l.user_avatar, l.title,
           l.description, l.items, l.likes_count, l.created_at,
           'list' as activity_type
    FROM custom_lists l
    WHERE l.is_public = 1
    ORDER BY l.created_at DESC LIMIT 20
  `);

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
    SELECT * FROM reviews ORDER BY likes_count DESC, created_at DESC LIMIT 8
  `);
  const trendingReviews = trendingRes.rows.map((row: any) => ({
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game_title,
    gameIcon: row.game_icon,
    userId: row.user_id,
    username: row.username,
    userAvatar: row.user_avatar,
    rating: row.rating !== null ? Number(row.rating) : undefined,
    reviewText: row.review_text,
    likesCount: Number(row.likes_count) || 0,
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
    sql: `SELECT * FROM review_comments WHERE review_id = ? ORDER BY created_at ASC`,
    args: [reviewId]
  });
  return result.rows.map((r: any) => ({
    id: r.id,
    reviewId: r.review_id,
    userId: r.user_id,
    username: r.username,
    userAvatar: r.user_avatar,
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
    args: [id, comment.reviewId, comment.userId, comment.username, comment.userAvatar || '', comment.commentText, now]
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

export async function getAllGames(limit: number = 500): Promise<Game[]> {
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
      ON CONFLICT(id) DO UPDATE SET
        universe_id = COALESCE(excluded.universe_id, games.universe_id),
        root_place_id = COALESCE(excluded.root_place_id, games.root_place_id),
        name = excluded.name,
        description = excluded.description,
        creator_name = excluded.creator_name,
        creator_type = excluded.creator_type,
        icon_url = excluded.icon_url,
        banner_url = COALESCE(excluded.banner_url, games.banner_url),
        genre = excluded.genre,
        player_count = excluded.player_count,
        total_visits = excluded.total_visits,
        raw_visits = excluded.raw_visits,
        favorited_count = excluded.favorited_count,
        up_votes = excluded.up_votes,
        down_votes = excluded.down_votes,
        release_year = excluded.release_year,
        rating_average = excluded.rating_average,
        rating_count = excluded.rating_count,
        rating_histogram = excluded.rating_histogram,
        tags = excluded.tags,
        updated_at = excluded.updated_at
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

  const BATCH_SIZE = 25;
  const now = Date.now();

  for (let i = 0; i < games.length; i += BATCH_SIZE) {
    const chunk = games.slice(i, i + BATCH_SIZE);
    const statements = chunk.map(g => ({
      sql: `
        INSERT INTO games (
          id, universe_id, root_place_id, name, description, creator_name, creator_type,
          icon_url, banner_url, genre, player_count, total_visits, raw_visits,
          favorited_count, up_votes, down_votes, release_year, rating_average,
          rating_count, rating_histogram, tags, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          universe_id = COALESCE(excluded.universe_id, games.universe_id),
          root_place_id = COALESCE(excluded.root_place_id, games.root_place_id),
          name = excluded.name,
          description = excluded.description,
          creator_name = excluded.creator_name,
          creator_type = excluded.creator_type,
          icon_url = excluded.icon_url,
          banner_url = COALESCE(excluded.banner_url, games.banner_url),
          genre = excluded.genre,
          player_count = excluded.player_count,
          total_visits = excluded.total_visits,
          raw_visits = excluded.raw_visits,
          favorited_count = excluded.favorited_count,
          up_votes = excluded.up_votes,
          down_votes = excluded.down_votes,
          release_year = excluded.release_year,
          rating_average = excluded.rating_average,
          rating_count = excluded.rating_count,
          rating_histogram = excluded.rating_histogram,
          tags = excluded.tags,
          updated_at = excluded.updated_at
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
      console.warn('[Database] batch upsert chunk error, falling back to sequential:', e);
      for (const stmt of statements) {
        try {
          await db.execute(stmt);
        } catch (singleErr) {
          console.warn('[Database] Failed to upsert single game:', singleErr);
        }
      }
    }
  }
}

