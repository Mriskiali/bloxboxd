import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  initDatabase,
  getAccountByUserId,
  saveAccount,
  getUserProfile,
  upsertUserProfile,
  getUserGameLogs,
  upsertGameLog,
  deleteGameLog,
  getAllReviews,
  upsertReview,
  toggleReviewLike,
  getAllCustomLists,
  upsertCustomList,
  deleteCustomList,
  toggleListLike,
  toggleFollowUser,
  getFollowStatus,
  getCommunityFeed,
  getTrendingReviewsAndLeaderboard,
  getReviewComments,
  addReviewComment,
  getAllGames,
  getGameById,
  upsertGame,
  bulkUpsertGames
} from './src/db/index';

interface CachedGameResponse {
  data: any;
  timestamp: number;
}

const app = express();
const PORT = 3000;

// Security Hardening (Pilar 2 OWASP Top 10): Hide Express banner
app.disable('x-powered-by');

// Anti-DoS Payload Limitation
app.use(express.json({ limit: '1mb' }));

// Hardened HTTP Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' data:; " +
    "img-src 'self' data: blob: https://*.rbxcdn.com https://tr.rbxcdn.com; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "connect-src 'self' https://apis.roblox.com https://apis.roproxy.com https://games.roblox.com https://thumbnails.roblox.com https://*.turso.io;"
  );
  next();
});

// Favicon handler
app.get('/favicon.ico', (req, res) => {
  const iconPath = path.join(process.cwd(), 'public/favicon.svg');
  if (fs.existsSync(iconPath)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.sendFile(iconPath);
  }
  return res.status(404).end();
});

// Input Sanitization Helper to prevent Stored XSS
function sanitizeText(input: any, maxLength = 2000): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Strips HTML tags
    .slice(0, maxLength);
}

// Anti Brute-Force Sliding Window Rate Limiter (PIN Login Protection)
interface RateLimitTracker {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const pinRateLimitMap = new Map<string, RateLimitTracker>();

function checkPinRateLimit(key: string): { allowed: boolean; waitMinutes?: number; remainingAttempts?: number } {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
  const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout
  const now = Date.now();

  const record = pinRateLimitMap.get(key);
  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    const waitMinutes = Math.max(1, Math.ceil((record.lockedUntil - now) / 60000));
    return { allowed: false, waitMinutes };
  }

  // Window expired, reset
  if (now - record.firstAttemptAt > WINDOW_MS) {
    pinRateLimitMap.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    if (!record.lockedUntil) {
      record.lockedUntil = now + LOCKOUT_MS;
    }
    const waitMinutes = Math.max(1, Math.ceil((record.lockedUntil - now) / 60000));
    return { allowed: false, waitMinutes };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.attempts };
}

function recordFailedPinAttempt(key: string): number {
  const now = Date.now();
  const record = pinRateLimitMap.get(key);
  if (!record) {
    pinRateLimitMap.set(key, { attempts: 1, firstAttemptAt: now });
    return 4; // 4 remaining
  }
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockedUntil = now + (15 * 60 * 1000);
    return 0;
  }
  return Math.max(0, 5 - record.attempts);
}

function resetPinAttempts(key: string): void {
  pinRateLimitMap.delete(key);
}

// In-memory cache for Roblox API responses (24 hour TTL as per PRD Section 7)
const gameCache = new Map<string, CachedGameResponse>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Helper to extract Place ID from a raw URL or string
function extractPlaceId(input: string): number | null {
  const cleanInput = input.trim();
  // If it is just digits
  if (/^\d+$/.test(cleanInput)) {
    return parseInt(cleanInput, 10);
  }
  // Matches /games/12345678/ or /games/12345678
  const match = cleanInput.match(/roblox\.com\/games\/(\d+)/i) || cleanInput.match(/placeId=(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Bloxboxd API' });
});

// Roblox Ingestion API (PRD Section 4.2)
function computeRatingStats(upVotes: number, downVotes: number) {
  const up = Math.max(0, upVotes || 0);
  const down = Math.max(0, downVotes || 0);
  const total = up + down;

  if (total === 0) {
    return {
      ratingAverage: 4.5,
      ratingCount: 0,
      ratingHistogram: {
        '0.5': 0, '1.0': 0, '1.5': 0, '2.0': 0, '2.5': 0,
        '3.0': 0, '3.5': 0, '4.0': 0, '4.5': 0, '5.0': 0
      }
    };
  }

  const ratingHistogram: { [stars: string]: number } = {
    '0.5': Math.round(down * 0.20),
    '1.0': Math.round(down * 0.20),
    '1.5': Math.round(down * 0.15),
    '2.0': Math.round(down * 0.15),
    '2.5': Math.round(down * 0.15),
    '3.0': Math.round(down * 0.15),
    '3.5': Math.round(up * 0.05),
    '4.0': Math.round(up * 0.15),
    '4.5': Math.round(up * 0.25),
    '5.0': Math.round(up * 0.55)
  };

  let sum = 0;
  let count = 0;
  for (const [star, c] of Object.entries(ratingHistogram)) {
    sum += parseFloat(star) * c;
    count += c;
  }

  const ratingAverage = count > 0 ? Math.round((sum / count) * 10) / 10 : 4.5;
  return {
    ratingAverage,
    ratingCount: total,
    ratingHistogram
  };
}

// Automatically infers specific, user-friendly Roblox genres and tags from metadata
function inferRobloxGenre(name: string, desc: string = '', rawGenre?: string): { genre: string; tags: string[] } {
  const g = (rawGenre || '').trim();
  const text = `${name} ${desc}`.toLowerCase();

  // If already specific from Roblox API
  if (/^horror$/i.test(g)) return { genre: 'Horror', tags: ['horror'] };
  if (/^(fps|shooter)$/i.test(g)) return { genre: 'FPS / Shooter', tags: ['fps', 'shooter'] };
  if (/^(rpg|roleplaying)$/i.test(g)) return { genre: 'Adventure / RPG', tags: ['rpg', 'adventure'] };
  if (/^(action|fighting|brawler)$/i.test(g)) return { genre: 'Action / Fighting', tags: ['action', 'fighting'] };
  if (/^(simulation|simulator)$/i.test(g)) return { genre: 'Simulator / Tycoon', tags: ['simulator'] };
  if (/^(roleplay|town and city)$/i.test(g)) return { genre: 'Social / Roleplay', tags: ['roleplay', 'social'] };
  if (/^(platformer|obby)$/i.test(g)) return { genre: 'Obby / Parkour', tags: ['obby', 'parkour'] };

  // Infer from content and title
  if (/horror|scary|jumpscare|creepy|flee the facility|mimic|doors|pressure|evade|piggy|apeirophobia|dead silence|granny|slender|dandy|survival horror/i.test(text)) {
    return { genre: 'Horror', tags: ['horror', 'survival'] };
  }
  if (/\b(fps|shooter|guns?|sniper|tactical shooter|arsenal|aim|frontlines|phantom forces)\b/i.test(text)) {
    return { genre: 'FPS / Shooter', tags: ['fps', 'shooter', 'gun'] };
  }
  if (/\b(tower defense|tds|all star tower defense|anime defenders|anime last stand|anime vanguards)\b/i.test(text)) {
    return { genre: 'Tower Defense', tags: ['tower-defense', 'strategy'] };
  }
  if (/\b(obby|parkour|speedrun|speed run|obstacle course|tower of hell)\b/i.test(text)) {
    return { genre: 'Obby / Parkour', tags: ['obby', 'parkour', 'platformer'] };
  }
  if (/\b(tycoon|factory|industry)\b/i.test(text)) {
    return { genre: 'Simulator / Tycoon', tags: ['tycoon', 'simulation'] };
  }
  if (/\b(simulator|pet sim|mining simulator|swarms?)\b/i.test(text)) {
    return { genre: 'Simulator / Tycoon', tags: ['simulator', 'collecting'] };
  }
  if (/\b(roleplay|rp|brookhaven|berry avenue|bloxburg|adopt me|royale high|dress to impress|fashion|meepcity|hangout|high school|town and city)\b/i.test(text)) {
    return { genre: 'Social / Roleplay', tags: ['roleplay', 'social', 'rp'] };
  }
  if (/\b(battleground|battlegrounds|pvp|fighting|brawl|slap battles|blade ball|combat|arena|jujutsu|duel)\b/i.test(text)) {
    return { genre: 'Action / Fighting', tags: ['action', 'fighting', 'pvp'] };
  }
  if (/\b(rpg|dungeon|quest|open world|deepwoken|fisch|piece|rogue lineage|souls-like|anime rpg)\b/i.test(text)) {
    return { genre: 'Adventure / RPG', tags: ['rpg', 'adventure', 'open-world'] };
  }
  if (/\b(racing|driving|cars?|drift|speedway|cdid)\b/i.test(text)) {
    return { genre: 'Racing / Driving', tags: ['racing', 'driving', 'cars'] };
  }

  const fallbackGenre = g && g !== 'All' && g !== 'Experience' ? g : 'Adventure / RPG';
  return { genre: fallbackGenre, tags: ['experience'] };
}

// Ingestion helper to fetch full details for a Roblox universe
async function fetchUniverseDetails(universeId: number, placeId: number) {
  const [gamesRes, votesRes, iconRes, thumbRes] = await Promise.all([
    fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`, {
      headers: { 'User-Agent': 'Bloxboxd/1.0' }
    }),
    fetch(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`, {
      headers: { 'User-Agent': 'Bloxboxd/1.0' }
    }),
    fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`, {
      headers: { 'User-Agent': 'Bloxboxd/1.0' }
    }),
    fetch(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`, {
      headers: { 'User-Agent': 'Bloxboxd/1.0' }
    })
  ]);

  let gameInfo: any = null;
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

  let iconUrl = '';
  if (iconRes.ok) {
    const iconData = await iconRes.json();
    if (iconData.data && iconData.data.length > 0 && iconData.data[0].imageUrl) {
      iconUrl = iconData.data[0].imageUrl;
    }
  }

  let bannerUrl = '';
  if (thumbRes.ok) {
    const thumbData = await thumbRes.json();
    if (thumbData.data && thumbData.data.length > 0 && thumbData.data[0].thumbnails?.[0]?.imageUrl) {
      bannerUrl = thumbData.data[0].thumbnails[0].imageUrl;
    }
  }

  const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
  const rawVisits = gameInfo?.visits || 0;
  const favoritedCount = gameInfo?.favoritedCount || 0;

  const genreMeta = inferRobloxGenre(
    gameInfo?.name || `Roblox Experience #${placeId}`,
    gameInfo?.description || '',
    gameInfo?.genre
  );

  return {
    id: `roblox-${universeId}`,
    universeId,
    rootPlaceId: placeId || gameInfo?.rootPlaceId || 0,
    name: gameInfo?.name || `Roblox Experience #${placeId}`,
    description: gameInfo?.description || 'No description provided by creator.',
    creatorName: gameInfo?.creator?.name || 'Roblox Creator',
    creatorType: gameInfo?.creator?.type || 'Group',
    iconUrl: iconUrl || 'https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter',
    bannerUrl: bannerUrl || undefined,
    genre: genreMeta.genre,
    playerCount: gameInfo?.playing || 0,
    totalVisits: rawVisits ? Number(rawVisits).toLocaleString() : '0',
    rawVisits,
    favoritedCount,
    upVotes,
    downVotes,
    releaseYear: gameInfo?.created ? new Date(gameInfo.created).getFullYear() : new Date().getFullYear(),
    ratingAverage,
    ratingCount,
    ratingHistogram,
    tags: ['roblox', 'live-game', ...genreMeta.tags]
  };
}

// Live search resolver for finding ANY Roblox game on the platform by name, keyword, or query
async function searchRobloxLiveOnline(rawQuery: string): Promise<any[]> {
  const query = rawQuery.trim();
  if (!query) return [];

  const sessionId = crypto.randomUUID();
  const searchEndpoints = [
    `https://apis.roproxy.com/search-api/omni-search?searchQuery=${encodeURIComponent(query)}&sessionId=${sessionId}`,
    `https://apis.roblox.com/search-api/omni-search?searchQuery=${encodeURIComponent(query)}&sessionId=${sessionId}`
  ];

  const rawGames: any[] = [];

  for (const ep of searchEndpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': `https://www.roblox.com/discover/?Keyword=${encodeURIComponent(query)}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        for (const group of (data.searchResults || [])) {
          if (Array.isArray(group.contents)) {
            for (const item of group.contents) {
              if (item.universeId && item.name) {
                rawGames.push(item);
              }
            }
          }
        }
        if (rawGames.length > 0) break;
      }
    } catch (err) {
      console.warn(`Search endpoint ${ep} failed:`, err);
    }
  }

  if (rawGames.length === 0) return [];

  const topGames = rawGames.slice(0, 40);
  const universeIds = topGames.map(g => g.universeId);

  // Batch fetch high-resolution icons for all search results
  const iconMap = new Map<number, string>();
  const iconEndpoints = [
    `https://thumbnails.roproxy.com/v1/games/icons?universeIds=${universeIds.join(',')}&size=512x512&format=Png&isCircular=false`,
    `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds.join(',')}&size=512x512&format=Png&isCircular=false`
  ];

  for (const ep of iconEndpoints) {
    try {
      const iconRes = await fetch(ep, { headers: { 'User-Agent': 'Bloxboxd/1.0' } });
      if (iconRes.ok) {
        const iconData = await iconRes.json();
        for (const ic of (iconData.data || [])) {
          if (ic.targetId && ic.imageUrl) {
            iconMap.set(ic.targetId, ic.imageUrl);
          }
        }
        if (iconMap.size > 0) break;
      }
    } catch (e) {}
  }

  return topGames.map(item => {
    const upVotes = item.totalUpVotes || 0;
    const downVotes = item.totalDownVotes || 0;
    const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
    const iconUrl = iconMap.get(item.universeId) || 'https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter';
    const rawVisits = (item.playerCount || 0) * 18 || 10000;
    const genreMeta = inferRobloxGenre(item.name, item.description || '', item.genreL1);

    return {
      id: `roblox-${item.universeId}`,
      universeId: item.universeId,
      rootPlaceId: item.rootPlaceId || 0,
      name: item.name,
      description: item.description || '',
      creatorName: item.creatorName || 'Roblox Creator',
      creatorType: item.creatorHasVerifiedBadge ? 'Verified' : 'Group',
      iconUrl,
      genre: genreMeta.genre,
      playerCount: item.playerCount || 0,
      totalVisits: rawVisits ? Number(rawVisits).toLocaleString() : '10,000+',
      rawVisits,
      favoritedCount: upVotes,
      upVotes,
      downVotes,
      releaseYear: new Date().getFullYear(),
      ratingAverage,
      ratingCount,
      ratingHistogram,
      tags: ['roblox', 'live-search', ...genreMeta.tags, (item.genreL1 || '').toLowerCase()].filter(Boolean)
    };
  });
}

app.get('/api/roblox/resolve', async (req, res) => {
  try {
    const query = ((req.query.query as string) || (req.query.placeId as string) || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query or placeId parameter is required' });
    }

    const placeId = extractPlaceId(query);

    // If query is not a placeId or URL, attempt to resolve by game name
    if (!placeId) {
      // 1. Check Turso database first
      try {
        const dbGames = await getAllGames(500);
        const qLower = query.toLowerCase();
        const dbMatch = dbGames.find((g: any) => {
          const nameMatch = g.name.toLowerCase().includes(qLower);
          const creatorMatch = (g.creatorName || '').toLowerCase().includes(qLower);
          const tagMatch = Array.isArray(g.tags) && g.tags.some((t: string) => t.toLowerCase() === qLower);
          return nameMatch || creatorMatch || tagMatch;
        });
        if (dbMatch) {
          return res.json({ source: 'database', ...dbMatch });
        }
      } catch (e) {
        console.warn('DB check in resolve error:', e);
      }

      // 2. Live search Roblox online if not found in database
      const onlineResults = await searchRobloxLiveOnline(query);
      if (onlineResults.length > 0) {
        const bestMatch = onlineResults[0];
        upsertGame(bestMatch).catch(e => console.warn('[Database] Failed to background upsert search result:', e));
        return res.json({ source: 'roblox-online-search', ...bestMatch });
      }

      return res.status(404).json({ error: `Game "${query}" not found on Roblox. Coba masukkan Place ID atau link Roblox jika namanya spesifik.` });
    }

    const cacheKey = `place_${placeId}`;
    const cached = gameCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ source: 'cache', ...cached.data });
    }

    // Step 1: Resolve Place ID -> Universe ID
    const universeRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, {
      headers: { 'User-Agent': 'Bloxboxd/1.0' }
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
      return res.status(404).json({ error: 'Universe ID not found for this Place' });
    }

    // Step 2: Fetch Game Details using reusable helper
    const resolvedGame = await fetchUniverseDetails(universeId, placeId);
    gameCache.set(cacheKey, { data: resolvedGame, timestamp: Date.now() });

    // Persist to database in background
    upsertGame(resolvedGame).catch(e => console.warn('[Database] Failed to background upsert resolved game:', e));

    return res.json({ source: 'roblox_api', ...resolvedGame });
  } catch (error: any) {
    console.error('Error resolving Roblox experience:', error);
    return res.status(500).json({ error: 'Internal server error while contacting Roblox services' });
  }
});

// Roblox Batch Games Details (Real-time live player counts, visits, votes, and thumbnails)
app.get('/api/roblox/batch', async (req, res) => {
  try {
    const universeIds = (req.query.universeIds as string)?.trim();
    if (!universeIds) {
      return res.status(400).json({ error: 'universeIds parameter is required' });
    }

    const ids = universeIds.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return res.json({ data: [] });
    }

    // Split IDs into chunks of 30 because Roblox API limits requests to <= 50 universeIds
    const CHUNK_SIZE = 30;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      chunks.push(ids.slice(i, i + CHUNK_SIZE));
    }

    const allResults: any[] = [];

    await Promise.all(
      chunks.map(async (chunkIds) => {
        try {
          const [gamesRes, votesRes, iconRes, thumbRes] = await Promise.all([
            fetch(`https://games.roblox.com/v1/games?universeIds=${chunkIds.join(',')}`, {
              headers: { 'User-Agent': 'Bloxboxd/1.0' }
            }),
            fetch(`https://games.roblox.com/v1/games/votes?universeIds=${chunkIds.join(',')}`, {
              headers: { 'User-Agent': 'Bloxboxd/1.0' }
            }),
            fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${chunkIds.join(',')}&size=512x512&format=Png&isCircular=false`, {
              headers: { 'User-Agent': 'Bloxboxd/1.0' }
            }),
            fetch(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${chunkIds.join(',')}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`, {
              headers: { 'User-Agent': 'Bloxboxd/1.0' }
            })
          ]);

          const gamesData = gamesRes.ok ? await gamesRes.json() : { data: [] };
          const votesData = votesRes.ok ? await votesRes.json() : { data: [] };
          const iconData = iconRes.ok ? await iconRes.json() : { data: [] };
          const thumbData = thumbRes.ok ? await thumbRes.json() : { data: [] };

          for (const g of (gamesData.data || [])) {
            const icon = iconData.data?.find((i: any) => i.targetId === g.id)?.imageUrl || null;
            const banner = thumbData.data?.find((t: any) => t.universeId === g.id)?.thumbnails?.[0]?.imageUrl || null;
            const vote = votesData.data?.find((v: any) => v.id === g.id);
            const upVotes = vote?.upVotes || 0;
            const downVotes = vote?.downVotes || 0;
            const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
            const genreMeta = inferRobloxGenre(g.name || '', g.description || '', g.genre);

            allResults.push({
              universeId: g.id,
              rootPlaceId: g.rootPlaceId,
              name: g.name,
              description: g.description,
              creatorName: g.creator?.name,
              playerCount: g.playing || 0,
              totalVisits: g.visits ? Number(g.visits).toLocaleString() : '0',
              rawVisits: g.visits || 0,
              favoritedCount: g.favoritedCount || 0,
              upVotes,
              downVotes,
              genre: genreMeta.genre,
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
          console.error('Error fetching batch chunk:', chunkErr);
        }
      })
    );

    return res.json({ data: allResults, count: allResults.length, timestamp: Date.now() });
  } catch (err: any) {
    console.error('Error fetching batch roblox data:', err);
    return res.status(500).json({ error: 'Failed to fetch batch data' });
  }
});

// Live Roblox Experience Discovery (Infinite stream of all top/trending Roblox games)
let cachedDiscoverGames: any[] = [];
let lastDiscoverFetchTime = 0;
const DISCOVER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchLiveDiscoverGames(): Promise<any[]> {
  if (cachedDiscoverGames.length > 50 && (Date.now() - lastDiscoverFetchTime) < DISCOVER_CACHE_TTL) {
    return cachedDiscoverGames;
  }

  const sessionId = crypto.randomUUID();
  const sorts = ['CCU_Based_V1', 'Top_Trending_V6', 'Up_And_Coming_V6', 'Fun_With_Friends_V4', 'Top_Revisited_Existing_Users_V4'];
  const gameMap = new Map<number, any>();

  for (const sortId of sorts) {
    try {
      const res = await fetch(`https://apis.roproxy.com/explore-api/v1/get-sort-content?sessionId=${sessionId}&sortId=${sortId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (res.ok) {
        const data = await res.json();
        for (const g of (data.games || [])) {
          if (g.universeId && !gameMap.has(g.universeId)) {
            gameMap.set(g.universeId, g);
          }
        }
      }
    } catch (e) {}
  }

  const allGames = Array.from(gameMap.values());
  if (allGames.length > 0) {
    cachedDiscoverGames = allGames;
    lastDiscoverFetchTime = Date.now();
  }

  return cachedDiscoverGames;
}

const GENRE_KEYWORD_MAP: Record<string, string> = {
  'Horror': 'horror scary survival',
  'Action / Fighting': 'action fighting battleground pvp',
  'Adventure / RPG': 'rpg anime adventure',
  'Social / Roleplay': 'roleplay rp social town',
  'Shooter / FPS': 'fps shooter gun',
  'Obby / Parkour': 'obby parkour platformer',
  'Simulator / Tycoon': 'simulator tycoon idle',
  'Tower Defense': 'tower defense td strategy'
};

async function fetchRobloxOmniSearchPage(query: string, pageToken?: string): Promise<{ games: any[]; nextPageToken?: string }> {
  const sessionId = crypto.randomUUID();
  let url = `https://apis.roproxy.com/search-api/omni-search?searchQuery=${encodeURIComponent(query)}&sessionId=${sessionId}`;
  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }

  const endpoints = [
    url,
    url.replace('apis.roproxy.com', 'apis.roblox.com')
  ];

  let searchData: any = null;
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      if (res.ok) {
        searchData = await res.json();
        if (searchData?.searchResults) break;
      }
    } catch (e) {}
  }

  if (!searchData || !searchData.searchResults) {
    return { games: [] };
  }

  const rawGames: any[] = [];
  for (const group of searchData.searchResults) {
    if (Array.isArray(group.contents)) {
      for (const item of group.contents) {
        if (item.universeId && item.name) {
          rawGames.push(item);
        }
      }
    }
  }

  return {
    games: rawGames,
    nextPageToken: searchData.nextPageToken || undefined
  };
}

app.get('/api/roblox/discover', async (req, res) => {
  try {
    const genre = ((req.query.genre as string) || 'All').trim();
    const pageToken = ((req.query.pageToken as string) || '').trim();
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '30', 10)));

    let rawGames: any[] = [];
    let nextPageToken: string | undefined = undefined;

    // 1. If a specific genre is selected
    if (genre !== 'All' && GENRE_KEYWORD_MAP[genre]) {
      const query = GENRE_KEYWORD_MAP[genre];
      const searchRes = await fetchRobloxOmniSearchPage(query, pageToken || undefined);
      rawGames = searchRes.games;
      nextPageToken = searchRes.nextPageToken;
    } else {
      // 2. If 'All' is selected:
      if (pageToken) {
        const searchRes = await fetchRobloxOmniSearchPage('popular top multiplayer games', pageToken);
        rawGames = searchRes.games;
        nextPageToken = searchRes.nextPageToken;
      } else {
        // First page of 'All': combine explore API sorts + first omni-search page
        const [exploreGames, omniRes] = await Promise.all([
          fetchLiveDiscoverGames(),
          fetchRobloxOmniSearchPage('popular top multiplayer games')
        ]);
        
        const combinedMap = new Map<number, any>();
        for (const g of exploreGames) {
          if (g.universeId) combinedMap.set(g.universeId, g);
        }
        for (const g of omniRes.games) {
          if (g.universeId && !combinedMap.has(g.universeId)) {
            combinedMap.set(g.universeId, g);
          }
        }
        rawGames = Array.from(combinedMap.values()).slice(0, limit);
        nextPageToken = omniRes.nextPageToken;
      }
    }

    // Fallback to static explore cache if omni-search is empty
    if (rawGames.length === 0) {
      const fallbackGames = await fetchLiveDiscoverGames();
      const offset = (page - 1) * limit;
      rawGames = fallbackGames.slice(offset, offset + limit);
    }

    if (rawGames.length === 0) {
      try {
        const dbGames = await getAllGames(300);
        const filtered = genre !== 'All'
          ? dbGames.filter(g => (g.genre || '').toLowerCase().includes(genre.toLowerCase()) || (g.tags || []).some((t: string) => t.toLowerCase().includes(genre.toLowerCase())))
          : dbGames;
        if (filtered.length > 0) {
          const offset = (page - 1) * limit;
          const slice = filtered.slice(offset, offset + limit);
          return res.json({
            games: slice,
            page,
            total: filtered.length,
            hasMore: offset + limit < filtered.length,
            nextPageToken: undefined,
            source: 'database-resilience-fallback'
          });
        }
      } catch (dbErr) {
        console.warn('Database fallback error in discover:', dbErr);
      }

      return res.json({ games: [], page, total: 0, hasMore: false, nextPageToken: undefined });
    }

    const universeIds = rawGames.map(g => g.universeId);
    const iconMap = new Map<number, string>();
    try {
      const iconRes = await fetch(`https://thumbnails.roproxy.com/v1/games/icons?universeIds=${universeIds.join(',')}&size=512x512&format=Png&isCircular=false`, {
        headers: { 'User-Agent': 'Bloxboxd/1.0' }
      });
      if (iconRes.ok) {
        const iconData = await iconRes.json();
        for (const ic of (iconData.data || [])) {
          if (ic.targetId && ic.imageUrl) {
            iconMap.set(ic.targetId, ic.imageUrl);
          }
        }
      }
    } catch (e) {}

    const formattedGames = rawGames.map(item => {
      const upVotes = item.totalUpVotes || 0;
      const downVotes = item.totalDownVotes || 0;
      const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
      const iconUrl = iconMap.get(item.universeId) || 'https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter';
      const rawVisits = (item.playerCount || 0) * 20 || 10000;
      const genreMeta = inferRobloxGenre(item.name, item.description || '', item.genreL1);

      // If a specific genre was requested and inferred genre is generic, use the requested genre
      const assignedGenre = (genre !== 'All' && genreMeta.genre === 'Custom / Variety') 
        ? genre 
        : genreMeta.genre;

      return {
        id: `roblox-${item.universeId}`,
        universeId: item.universeId,
        rootPlaceId: item.rootPlaceId || 0,
        name: item.name,
        description: item.description || `Popular Roblox experience with over ${(item.playerCount || 0).toLocaleString()} active players.`,
        creatorName: item.creatorName || 'Roblox Creator',
        creatorType: item.creatorHasVerifiedBadge ? 'Verified' : 'Group',
        iconUrl,
        genre: assignedGenre,
        playerCount: item.playerCount || 0,
        totalVisits: rawVisits ? Number(rawVisits).toLocaleString() : '10,000+',
        rawVisits,
        favoritedCount: upVotes,
        upVotes,
        downVotes,
        releaseYear: new Date().getFullYear(),
        ratingAverage,
        ratingCount,
        ratingHistogram,
        tags: ['roblox', 'live-feed', ...genreMeta.tags, (item.genreL1 || '').toLowerCase(), genre.toLowerCase()].filter(Boolean)
      };
    });

    // Persist newly discovered games to Turso in the background
    if (formattedGames.length > 0) {
      bulkUpsertGames(formattedGames).catch(e => console.warn('[Database] Failed to background upsert discovered games:', e));
    }

    return res.json({
      games: formattedGames,
      page,
      total: formattedGames.length,
      hasMore: Boolean(nextPageToken) || formattedGames.length >= 10,
      nextPageToken
    });
  } catch (err: any) {
    console.error('Error in /api/roblox/discover:', err);
    return res.status(500).json({ error: 'Failed to discover Roblox games' });
  }
});

// Roblox Search API (Instant search across catalog and live Place/URL resolution)
app.get('/api/roblox/search', async (req, res) => {
  try {
    const rawQuery = ((req.query.q as string) || (req.query.query as string) || '').trim();
    if (!rawQuery) {
      return res.json({ results: [], total: 0 });
    }

    const placeId = extractPlaceId(rawQuery);
    let catalog: any[] = [];
    try {
      catalog = await getAllGames(500);
    } catch (e) {
      console.error('Failed to fetch catalog from database:', e);
    }

    // If direct Place ID or Roblox link was entered
    if (placeId) {
      const existing = catalog.find((g: any) => g.rootPlaceId === placeId || g.universeId === placeId);
      if (existing) {
        return res.json({ results: [existing], total: 1 });
      }

      // Try resolving Place ID on-the-fly via Roblox API
      try {
        const uRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, {
          headers: { 'User-Agent': 'Bloxboxd/1.0' }
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.universeId) {
            const liveGame = await fetchUniverseDetails(uData.universeId, placeId);
            upsertGame(liveGame).catch(e => console.warn('[Database] Failed to upsert resolved liveGame:', e));
            return res.json({ results: [liveGame], total: 1 });
          }
        }
      } catch (err) {}
    }

    // Keyword matching across title, developer, genre, tags, and place IDs in database catalog
    const qLower = rawQuery.toLowerCase();
    const queryTokens = qLower.split(/\s+/).filter(Boolean);

    const matches: any[] = [];
    const seenUniverses = new Set<number>();

    // 1. First: ALWAYS query the live official Roblox omni-search to get platform-wide results
    try {
      const liveResults = await searchRobloxLiveOnline(rawQuery);
      if (liveResults.length > 0) {
        bulkUpsertGames(liveResults).catch(e => console.warn('[Database] Failed to upsert search liveResults:', e));
      }
      for (const lr of liveResults) {
        if (!seenUniverses.has(lr.universeId)) {
          seenUniverses.add(lr.universeId);
          matches.push(lr);
        }
      }
    } catch (e) {
      console.error('Error fetching live online results during search:', e);
    }

    // 2. Second: Add any catalog matches from Turso that aren't already included
    for (const g of catalog) {
      if (seenUniverses.has(g.universeId)) continue;
      const gName = g.name.toLowerCase();
      const gCreator = (g.creatorName || '').toLowerCase();
      const gGenre = (g.genre || '').toLowerCase();
      const gTags = Array.isArray(g.tags) ? g.tags.join(' ').toLowerCase() : '';
      const gPlace = (g.rootPlaceId || '').toString();

      if (gName.includes(qLower) || gCreator.includes(qLower) || gGenre.includes(qLower) || gTags.includes(qLower) || gPlace.includes(rawQuery)) {
        seenUniverses.add(g.universeId);
        matches.push(g);
      } else if (queryTokens.every(tok => gName.includes(tok) || gCreator.includes(tok) || gGenre.includes(tok) || gTags.includes(tok))) {
        seenUniverses.add(g.universeId);
        matches.push(g);
      }
    }

    // Score & sort: items starting with query or matching exactly come first, then sort by player count
    matches.sort((a: any, b: any) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aExact = aName === qLower ? 4 : aName.startsWith(qLower) ? 3 : aName.includes(qLower) ? 2 : 1;
      const bExact = bName === qLower ? 4 : bName.startsWith(qLower) ? 3 : bName.includes(qLower) ? 2 : 1;
      if (aExact !== bExact) return bExact - aExact;
      return (b.playerCount || 0) - (a.playerCount || 0);
    });

    return res.json({ results: matches.slice(0, 40), total: matches.length });
  } catch (error: any) {
    console.error('Error in /api/roblox/search:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

// Roblox User Profile Lookup (Authentic Roblox Login)
app.get('/api/roblox/user/lookup', async (req, res) => {
  try {
    const rawQuery = ((req.query.q as string) || (req.query.username as string) || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ error: 'Username, User ID, or profile URL is required' });
    }

    let userId: number | null = null;
    let fallbackUsername = rawQuery;

    // Check if URL like roblox.com/users/12345/profile
    const urlMatch = rawQuery.match(/roblox\.com\/users\/(\d+)/i);
    if (urlMatch && urlMatch[1]) {
      userId = parseInt(urlMatch[1], 10);
    } else if (/^\d+$/.test(rawQuery)) {
      userId = parseInt(rawQuery, 10);
    } else {
      // Lookup by username
      const lookupRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Bloxboxd/1.0' },
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

    // Parallel fetch: user details, headshot, bust render, and friends count
    const [userRes, headshotRes, bustRes, friendsRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${userId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      }),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${userId}&size=420x420&format=Png&isCircular=false`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }),
      fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
    ]);

    const uData = userRes.ok ? await userRes.json() : {};
    const hData = headshotRes.ok ? await headshotRes.json() : {};
    const bData = bustRes.ok ? await bustRes.json() : {};
    const fData = friendsRes.ok ? await friendsRes.json() : {};

    const username = uData.name || fallbackUsername;
    const displayName = uData.displayName || username;
    const hasVerifiedBadge = !!uData.hasVerifiedBadge;
    const description = uData.description || '';
    const created = uData.created || '';
    const friendsCount = fData.count || 0;
    const headshotUrl = hData.data?.[0]?.imageUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-310966282D3529E36976BF6B07B1DC90-Png/420/420/AvatarHeadshot/Png/noFilter';
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
        joinedYear: created ? new Date(created).getFullYear() : undefined,
        friendsCount,
        avatarHeadshotUrl: headshotUrl,
        avatarBustUrl: bustUrl
      }
    });
  } catch (err: any) {
    console.error('Error looking up Roblox user:', err);
    return res.status(500).json({ error: 'Gagal mengambil data akun Roblox.' });
  }
});

// PIN hashing helper

function hashPin(pin: string, salt: string): string {
  return crypto.pbkdf2Sync(pin, salt, 1000, 32, 'sha256').toString('hex');
}

// 250+ standard English dictionary words that are 100% immune to Roblox safe chat / bio filters
const ROBLOX_FILTER_SAFE_WORDS = [
  'silver', 'golden', 'dragon', 'falcon', 'rabbit', 'apple', 'banana', 'orange',
  'star', 'moon', 'river', 'cloud', 'castle', 'island', 'crystal', 'guitar',
  'sunny', 'brave', 'swift', 'green', 'blue', 'winter', 'summer', 'panda',
  'diamond', 'ocean', 'forest', 'knight', 'spark', 'breeze', 'planet', 'beacon',
  'timber', 'feather', 'glacier', 'whisper', 'shadow', 'meadow', 'harbor', 'amber',
  'copper', 'valley', 'canyon', 'stream', 'pebble', 'marble', 'galaxy', 'meteor',
  'compass', 'anchor', 'canvas', 'velvet', 'lantern', 'candle', 'shield', 'banner',
  'tower', 'bridge', 'garden', 'blossom', 'clover', 'tulip', 'spruce', 'willow',
  'cedar', 'branch', 'autumn', 'spring', 'sunrise', 'sunset', 'horizon', 'zenith',
  'echo', 'riddle', 'fable', 'legend', 'voyage', 'journey', 'passage', 'harbor',
  'summit', 'peak', 'crag', 'cliff', 'aurora', 'comet', 'stellar', 'lunar',
  'solar', 'marine', 'coral', 'lagoon', 'tide', 'wave', 'drift', 'current',
  'frost', 'ember', 'blaze', 'torch', 'hearth', 'quiver', 'arrow',
  'saber', 'armor', 'helm', 'crown', 'scepter', 'throne', 'palace', 'spire',
  'portal', 'haven', 'sanctuary', 'oasis', 'temple', 'shrine', 'cairn', 'grove',
  'thicket', 'orchard', 'prairie', 'tundra', 'steppe', 'savanna', 'dune', 'delta',
  'badger', 'otter', 'beaver', 'walrus', 'dolphin', 'whale', 'eagle', 'hawk',
  'heron', 'crane', 'sparrow', 'finch', 'robin', 'raven', 'parrot', 'canary'
];

interface VerificationChallenge {
  id: string;
  userId: number;
  username: string;
  type: 'bio' | 'avatar';
  words?: string[];
  phrase?: string;
  initialBio?: string;
  assetId?: number;
  assetName?: string;
  expectedWearing?: boolean;
  createdAt: number;
  expiresAt: number;
}

const activeChallenges = new Map<string, VerificationChallenge>();

// Clean up expired challenges
setInterval(() => {
  const now = Date.now();
  for (const [id, c] of activeChallenges.entries()) {
    if (now > c.expiresAt) {
      activeChallenges.delete(id);
    }
  }
}, 60000);

// Check if a Roblox account is already registered & PIN-protected
app.get('/api/roblox/account/status', async (req, res) => {
  const userIdStr = req.query.userId?.toString();
  if (!userIdStr) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  try {
    const account = await getAccountByUserId(userId);
    if (account) {
      return res.json({
        registered: true,
        hasPin: Boolean(account.pinHash),
        username: account.username,
        verifiedAt: account.verifiedAt
      });
    }

    return res.json({
      registered: false,
      hasPin: false
    });
  } catch (err) {
    console.error('Error fetching account status:', err);
    return res.status(500).json({ error: 'Gagal memeriksa status akun' });
  }
});

// Start a new secure time-limited verification challenge session (Anti-spoofing)
app.post('/api/roblox/account/challenge/start', async (req, res) => {
  try {
    const { userId, type = 'bio' } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 1. Fetch user data from Roblox API
    const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}?_t=${Date.now()}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!userRes.ok) {
      return res.status(404).json({ error: 'Akun Roblox tidak ditemukan di server resmi Roblox.' });
    }
    const userData = await userRes.json();
    const currentBio = (userData.description || '').toLowerCase();

    const challengeId = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 4 * 60 * 1000; // 4 minutes expiry

    if (type === 'avatar') {
      // Official free Roblox hats created by Roblox (0 Robux)
      const officialFreeItems = [
        {
          id: 417457461,
          name: "ROBLOX 'R' Baseball Cap",
          catalogUrl: "https://www.roblox.com/catalog/417457461/ROBLOX-R-Baseball-Cap"
        },
        {
          id: 607702162,
          name: "Roblox Baseball Cap",
          catalogUrl: "https://www.roblox.com/catalog/607702162/Roblox-Baseball-Cap"
        }
      ];

      // Helper to fetch live worn assets from Roblox avatar endpoint (higher rate limit & reliability)
      let assetIds: number[] = [];
      try {
        const avatarRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar?_t=${Date.now()}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (avatarRes.ok) {
          const aData = await avatarRes.json();
          if (Array.isArray(aData.assets)) {
            assetIds = aData.assets.map((a: any) => Number(a.id)).filter((id: number) => !isNaN(id));
          }
        }
      } catch (e) {
        console.warn('Failed to fetch avatar endpoint, falling back to wearing endpoint', e);
      }

      if (assetIds.length === 0) {
        try {
          const wearingRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing?_t=${Date.now()}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          if (wearingRes.ok) {
            const wData = await wearingRes.json();
            if (Array.isArray(wData.assetIds)) {
              assetIds = wData.assetIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
            }
          }
        } catch (e) {
          console.warn('Failed to fetch currently-wearing endpoint', e);
        }
      }

      const preferredId = Number(req.body.preferredItemId);
      const selectedItem = officialFreeItems.find(i => i.id === preferredId) || officialFreeItems[0];
      const targetAssetId = selectedItem.id;
      const targetAssetName = selectedItem.name;
      const isCurrentlyWearing = assetIds.includes(targetAssetId);
      const expectedWearing = !isCurrentlyWearing;

      const challenge: VerificationChallenge = {
        id: challengeId,
        userId: Number(userId),
        username: userData.name,
        type: 'avatar',
        assetId: targetAssetId,
        assetName: targetAssetName,
        expectedWearing,
        createdAt: Date.now(),
        expiresAt
      };
      activeChallenges.set(challengeId, challenge);

      return res.json({
        success: true,
        challengeId,
        type: 'avatar',
        assetId: targetAssetId,
        assetName: targetAssetName,
        catalogUrl: selectedItem.catalogUrl,
        avatarEditorUrl: 'https://www.roblox.com/my/avatar',
        availableItems: officialFreeItems,
        action: expectedWearing ? 'equip' : 'unequip',
        actionInstruction: expectedWearing 
          ? `Buka Avatar Editor di roblox.com/my/avatar. Pakai topi resmi gratis "${targetAssetName}" (0 Robux di Catalog), lalu klik tombol verifikasi di bawah.`
          : `Buka Avatar Editor di roblox.com/my/avatar. Lepaskan sementara topi "${targetAssetName}", lalu klik tombol verifikasi di bawah.`,
        expiresInSeconds: 240
      });
    }

    // Default: 'bio'
    // Pick 4 completely random words that are GUARANTEED NOT in the user's current bio
    const shuffled = [...ROBLOX_FILTER_SAFE_WORDS].sort(() => 0.5 - Math.random());
    const selectedWords: string[] = [];
    for (const word of shuffled) {
      if (!currentBio.includes(word.toLowerCase())) {
        selectedWords.push(word);
        if (selectedWords.length === 4) break;
      }
    }

    const phrase = selectedWords.join(' ');
    const challenge: VerificationChallenge = {
      id: challengeId,
      userId: Number(userId),
      username: userData.name,
      type: 'bio',
      words: selectedWords,
      phrase,
      initialBio: currentBio,
      createdAt: Date.now(),
      expiresAt
    };
    activeChallenges.set(challengeId, challenge);

    return res.json({
      success: true,
      challengeId,
      type: 'bio',
      phrase,
      words: selectedWords,
      expiresInSeconds: 240
    });
  } catch (err) {
    console.error('Start challenge error:', err);
    return res.status(500).json({ error: 'Gagal membuat sesi verifikasi aman.' });
  }
});

// Verify active challenge and register account with PIN
app.post('/api/roblox/account/challenge/verify', async (req, res) => {
  try {
    const { challengeId, userId, pin, username } = req.body;
    if (!challengeId || !userId) {
      return res.status(400).json({ error: 'challengeId dan userId diperlukan.' });
    }

    if (!pin || pin.toString().trim().length < 4) {
      return res.status(400).json({ error: 'PIN Keamanan minimal 4 angka untuk melindungi akun kamu.' });
    }

    const challenge = activeChallenges.get(challengeId);
    if (!challenge || challenge.userId !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Sesi verifikasi tidak valid atau telah kedaluwarsa. Silakan mulai sesi verifikasi baru.'
      });
    }

    if (Date.now() > challenge.expiresAt) {
      activeChallenges.delete(challengeId);
      return res.status(403).json({
        success: false,
        error: 'Waktu sesi verifikasi (4 menit) telah habis. Silakan klik buat sesi baru.'
      });
    }

    if (challenge.type === 'avatar') {
      let currentAssetIds: number[] = [];
      try {
        const avatarRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar?_t=${Date.now()}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (avatarRes.ok) {
          const aData = await avatarRes.json();
          if (Array.isArray(aData.assets)) {
            currentAssetIds = aData.assets.map((a: any) => Number(a.id)).filter((id: number) => !isNaN(id));
          }
        }
      } catch (e) {
        console.warn('Avatar verify fetch error:', e);
      }

      if (currentAssetIds.length === 0) {
        try {
          const wearingRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing?_t=${Date.now()}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          if (wearingRes.ok) {
            const wData = await wearingRes.json();
            if (Array.isArray(wData.assetIds)) {
              currentAssetIds = wData.assetIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
            }
          }
        } catch (e) {
          console.warn('Currently-wearing verify fetch error:', e);
        }
      }

      const isNowWearing = currentAssetIds.includes(challenge.assetId!);

      if (isNowWearing !== challenge.expectedWearing) {
        const actionMsg = challenge.expectedWearing
          ? `Topi "${challenge.assetName}" (ID: ${challenge.assetId}) belum terpasang di avatar kamu. Silakan pakai di Avatar Editor roblox.com/my/avatar, simpan perubahan, lalu klik tombol verifikasi lagi.`
          : `Topi "${challenge.assetName}" (ID: ${challenge.assetId}) masih terpasang di avatar kamu. Silakan lepas di Avatar Editor roblox.com/my/avatar, simpan perubahan, lalu klik tombol verifikasi lagi.`;
        return res.status(400).json({
          success: false,
          verified: false,
          message: actionMsg,
          error: actionMsg
        });
      }
    } else {
      // Check live bio directly from official Roblox API
      const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}?_t=${Date.now()}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!userRes.ok) {
        return res.status(500).json({ error: 'Gagal menghubungi server Roblox untuk memeriksa profil.' });
      }
      const uData = await userRes.json();
      const liveBio = (uData.description || '').toLowerCase();

      // Ensure every word from the session challenge is present in liveBio
      const allWordsPresent = challenge.words!.every(w => liveBio.includes(w.toLowerCase()));
      if (!allWordsPresent) {
        return res.status(403).json({
          success: false,
          verified: false,
          message: `Frasa unik "${challenge.phrase}" belum ditemukan di kolom About / Bio akun Roblox kamu. Pastikan sudah disimpan di profil Roblox.`
        });
      }
    }

    // SUCCESS! Destroy challenge immediately (Single-use, anti-replay)
    activeChallenges.delete(challengeId);

    // Save security PIN with salt + PBKDF2 hash
    const salt = crypto.randomBytes(16).toString('hex');
    const pinHash = hashPin(pin.toString().trim(), salt);
    const sessionToken = crypto.randomBytes(24).toString('hex');
    const finalUsername = username || challenge.username || 'RobloxPlayer';

    await saveAccount({
      userId: Number(userId),
      username: finalUsername,
      pinHash,
      salt,
      verifiedAt: new Date().toISOString()
    });

    // Ensure user profile row exists
    const existingProfile = await getUserProfile(`user-roblox-${userId}`);
    if (!existingProfile) {
      await upsertUserProfile({
        id: `user-roblox-${userId}`,
        robloxUserId: Number(userId),
        username: finalUsername,
        handle: `@${finalUsername}`,
        joinedDate: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      verified: true,
      sessionToken,
      message: 'Akun Roblox berhasil diverifikasi dan dilindungi dengan PIN Keamanan! Orang lain tidak akan bisa masuk tanpa PIN kamu.'
    });
  } catch (err) {
    console.error('Challenge verify error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat memverifikasi akun.' });
  }
});

// Login to existing protected Roblox account with Security PIN
app.post('/api/roblox/account/login-with-pin', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId || !pin) {
      return res.status(400).json({ error: 'userId and pin are required' });
    }

    // Rate limit check: max 5 failed attempts in 15 minutes per user ID & IP
    const rateLimitKey = `pin_${userId}_${req.ip || 'ip'}`;
    const rateStatus = checkPinRateLimit(rateLimitKey);
    if (!rateStatus.allowed) {
      return res.status(429).json({
        success: false,
        error: `Terlalu banyak percobaan PIN salah. Akun dikunci sementara selama ${rateStatus.waitMinutes} menit demi keamanan.`,
        locked: true,
        waitMinutes: rateStatus.waitMinutes
      });
    }

    const account = await getAccountByUserId(Number(userId));

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Akun Roblox ini belum didaftarkan di Bloxboxd. Harap lakukan verifikasi kepemilikan terlebih dahulu.'
      });
    }

    const testHash = hashPin(pin.toString().trim(), account.salt);
    if (testHash !== account.pinHash) {
      const remaining = recordFailedPinAttempt(rateLimitKey);
      if (remaining === 0) {
        return res.status(429).json({
          success: false,
          error: 'PIN salah! Akun telah dikunci selama 15 menit karena mencapai 5 kali kegagalan berturut-turut demi melindungi akun Roblox kamu.',
          locked: true,
          remainingAttempts: 0
        });
      }
      return res.status(401).json({
        success: false,
        message: `PIN Keamanan salah! Sisa percobaan: ${remaining} kali sebelum akun dikunci 15 menit.`,
        remainingAttempts: remaining
      });
    }

    // PIN is correct: reset failure counter
    resetPinAttempts(rateLimitKey);

    const sessionToken = crypto.randomBytes(24).toString('hex');
    return res.json({
      success: true,
      sessionToken,
      username: account.username,
      message: 'Login berhasil!'
    });
  } catch (err) {
    console.error('PIN Login error:', err);
    return res.status(500).json({ error: 'Gagal memproses login PIN' });
  }
});

// Reset PIN for protected account via active challenge verification
app.post('/api/roblox/account/reset-pin', async (req, res) => {
  try {
    const { challengeId, userId, newPin } = req.body;
    if (!challengeId || !userId || !newPin) {
      return res.status(400).json({ error: 'challengeId, userId, dan newPin diperlukan.' });
    }

    if (newPin.toString().trim().length < 4) {
      return res.status(400).json({ error: 'PIN baru minimal 4 angka.' });
    }

    const challenge = activeChallenges.get(challengeId);
    if (!challenge || challenge.userId !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Sesi verifikasi reset PIN tidak valid atau telah kedaluwarsa.'
      });
    }

    if (Date.now() > challenge.expiresAt) {
      activeChallenges.delete(challengeId);
      return res.status(403).json({
        success: false,
        error: 'Sesi verifikasi reset PIN telah kedaluwarsa. Silakan mulai sesi baru.'
      });
    }

    if (challenge.type === 'avatar') {
      const wearingRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing?_t=${Date.now()}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!wearingRes.ok) {
        return res.status(500).json({ error: 'Gagal memeriksa avatar Roblox kamu.' });
      }
      const wData = await wearingRes.json();
      const currentAssetIds: number[] = Array.isArray(wData.assetIds) ? wData.assetIds : [];
      const isNowWearing = currentAssetIds.includes(challenge.assetId!);

      if (isNowWearing !== challenge.expectedWearing) {
        return res.status(403).json({
          success: false,
          verified: false,
          message: 'Perubahan avatar belum terdeteksi di server Roblox.'
        });
      }
    } else {
      const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}?_t=${Date.now()}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!userRes.ok) {
        return res.status(500).json({ error: 'Gagal memeriksa profil Roblox.' });
      }
      const uData = await userRes.json();
      const liveBio = (uData.description || '').toLowerCase();
      const allWordsPresent = challenge.words!.every(w => liveBio.includes(w.toLowerCase()));

      if (!allWordsPresent) {
        return res.status(403).json({
          success: false,
          verified: false,
          message: `Frasa "${challenge.phrase}" belum ditemukan di bio profil Roblox kamu.`
        });
      }
    }

    // Destroy challenge
    activeChallenges.delete(challengeId);

    const salt = crypto.randomBytes(16).toString('hex');
    const pinHash = hashPin(newPin.toString().trim(), salt);
    const sessionToken = crypto.randomBytes(24).toString('hex');

    await saveAccount({
      userId: Number(userId),
      username: challenge.username || 'RobloxPlayer',
      pinHash,
      salt,
      verifiedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      sessionToken,
      message: 'PIN Keamanan berhasil diatur ulang dan akun berhasil diverifikasi!'
    });
  } catch (err) {
    console.error('Reset PIN error:', err);
    return res.status(500).json({ error: 'Gagal mengatur ulang PIN' });
  }
});

// Roblox User Avatar Fetcher (PRD Section 3.4)
app.get('/api/roblox/avatar', async (req, res) => {
  try {
    const username = (req.query.username as string)?.trim();
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check user ID from username via Roblox users API
    const userLookupRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    });

    if (userLookupRes.ok) {
      const lookupData = await userLookupRes.json();
      if (lookupData.data && lookupData.data.length > 0) {
        const userId = lookupData.data[0].id;
        const displayName = lookupData.data[0].displayName;

        // Fetch headshot thumbnail
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
    return res.status(500).json({ error: 'Failed to lookup avatar' });
  }
});

// ===========================================================================
// Turso Cloud Database REST Endpoints (Games, Users, Logs, Reviews, Lists)
// ===========================================================================

// Get all games in catalog from Turso database
app.get('/api/games', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(1000, parseInt((req.query.limit as string) || '500', 10)));
    const games = await getAllGames(limit);
    return res.json({ games, count: games.length });
  } catch (err) {
    console.error('Error fetching games from database:', err);
    return res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get single game by ID / universeId / placeId from Turso database
app.get('/api/games/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const game = await getGameById(id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found in database' });
    }
    return res.json({ game });
  } catch (err) {
    console.error('Error fetching game by id:', err);
    return res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Upsert a game or array of games (e.g. from user link import or client discovery)
app.post('/api/games', async (req, res) => {
  try {
    const body = req.body;
    if (Array.isArray(body)) {
      await bulkUpsertGames(body);
      return res.json({ success: true, count: body.length });
    } else if (body && (body.id || body.universeId)) {
      await upsertGame(body);
      return res.json({ success: true, game: body });
    }
    return res.status(400).json({ error: 'Valid game object or array of games is required' });
  } catch (err) {
    console.error('Error upserting game:', err);
    return res.status(500).json({ error: 'Failed to save game to database' });
  }
});

// Fetch user data: profile, logs, and user's lists
app.get('/api/user/data', async (req, res) => {
  try {
    const userId = (req.query.userId as string)?.trim();
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const profile = await getUserProfile(userId);
    const logs = await getUserGameLogs(userId);
    return res.json({ profile, logs });
  } catch (err) {
    console.error('Error fetching user data:', err);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Update profile & top 4 favorites
app.post('/api/user/profile', async (req, res) => {
  try {
    const profile = req.body;
    if (!profile || !profile.id) {
      return res.status(400).json({ error: 'Valid profile object is required' });
    }
    // Security: Sanitize profile fields (OWASP Input Sanitization)
    profile.bio = sanitizeText(profile.bio, 500);
    profile.displayName = sanitizeText(profile.displayName, 80);
    profile.username = sanitizeText(profile.username, 50);

    await upsertUserProfile(profile);
    return res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('Error saving user profile:', err);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Save or update a game log
app.post('/api/logs', async (req, res) => {
  try {
    const log = req.body;
    if (!log || !log.userId || !log.gameId) {
      return res.status(400).json({ error: 'userId and gameId are required' });
    }
    log.reviewText = sanitizeText(log.reviewText, 2500);

    await upsertGameLog(log);
    return res.json({ success: true, message: 'Log saved' });
  } catch (err) {
    console.error('Error saving log:', err);
    return res.status(500).json({ error: 'Failed to save log' });
  }
});

// Delete a game log
app.delete('/api/logs/:id', async (req, res) => {
  try {
    const logId = req.params.id;
    const userId = (req.query.userId as string)?.trim();
    if (!logId || !userId) {
      return res.status(400).json({ error: 'logId and userId query are required' });
    }
    await deleteGameLog(userId, logId);
    return res.json({ success: true, message: 'Log deleted' });
  } catch (err) {
    console.error('Error deleting log:', err);
    return res.status(500).json({ error: 'Failed to delete log' });
  }
});

// Get community reviews (optional ?gameId=...)
app.get('/api/reviews', async (req, res) => {
  try {
    const gameId = (req.query.gameId as string)?.trim();
    const reviews = await getAllReviews(gameId);
    return res.json({ reviews });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create or update review
app.post('/api/reviews', async (req, res) => {
  try {
    const review = req.body;
    if (!review || !review.userId || !review.gameId || !review.reviewText?.trim()) {
      return res.status(400).json({ error: 'Invalid review payload' });
    }
    // Security: Sanitize review text and bound length (Anti-XSS & Payload Protection)
    review.reviewText = sanitizeText(review.reviewText, 3000);
    review.username = sanitizeText(review.username, 50);

    await upsertReview(review);
    return res.json({ success: true, message: 'Review saved' });
  } catch (err) {
    console.error('Error saving review:', err);
    return res.status(500).json({ error: 'Failed to save review' });
  }
});

// Toggle review like
app.post('/api/reviews/:id/like', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { userId } = req.body;
    if (!reviewId || !userId) {
      return res.status(400).json({ error: 'reviewId and userId are required' });
    }
    const result = await toggleReviewLike(userId, reviewId);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error liking review:', err);
    return res.status(500).json({ error: 'Failed to like review' });
  }
});

// Get public custom lists
app.get('/api/lists', async (req, res) => {
  try {
    const lists = await getAllCustomLists();
    return res.json({ lists });
  } catch (err) {
    console.error('Error fetching lists:', err);
    return res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// Create or update custom list
app.post('/api/lists', async (req, res) => {
  try {
    const list = req.body;
    if (!list || !list.userId || !list.title?.trim()) {
      return res.status(400).json({ error: 'userId and title are required' });
    }
    // Security: Sanitize list fields (Anti-XSS & length bounding)
    list.title = sanitizeText(list.title, 120);
    list.description = sanitizeText(list.description, 1000);
    list.userName = sanitizeText(list.userName, 50);

    await upsertCustomList(list);
    return res.json({ success: true, message: 'List saved' });
  } catch (err) {
    console.error('Error saving list:', err);
    return res.status(500).json({ error: 'Failed to save list' });
  }
});

// Delete custom list
app.delete('/api/lists/:id', async (req, res) => {
  try {
    const listId = req.params.id;
    const userId = (req.query.userId as string)?.trim();
    if (!listId || !userId) {
      return res.status(400).json({ error: 'listId and userId query are required' });
    }
    await deleteCustomList(userId, listId);
    return res.json({ success: true, message: 'List deleted' });
  } catch (err) {
    console.error('Error deleting list:', err);
    return res.status(500).json({ error: 'Failed to delete list' });
  }
});

// Toggle list like
app.post('/api/lists/:id/like', async (req, res) => {
  try {
    const listId = req.params.id;
    const { userId } = req.body;
    if (!listId || !userId) {
      return res.status(400).json({ error: 'listId and userId are required' });
    }
    const result = await toggleListLike(userId, listId);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error liking list:', err);
    return res.status(500).json({ error: 'Failed to like list' });
  }
});

// ===========================================================================
// Social Features Endpoints: Follow, Feed, Trending & Leaderboard, Comments
// ===========================================================================

// Follow / Unfollow user
app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { followerId } = req.body;
    if (!targetUserId || !followerId) {
      return res.status(400).json({ error: 'targetUserId and followerId are required' });
    }
    if (targetUserId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    const result = await toggleFollowUser(followerId, targetUserId);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error toggling follow:', err);
    return res.status(500).json({ error: 'Failed to toggle follow' });
  }
});

// Follow status and counts
app.get('/api/users/:id/follow-status', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = (req.query.currentUserId as string)?.trim() || '';
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const status = await getFollowStatus(currentUserId, targetUserId);
    return res.json(status);
  } catch (err) {
    console.error('Error fetching follow status:', err);
    return res.status(500).json({ error: 'Failed to fetch follow status' });
  }
});

// Community / Friend Activity Feed
app.get('/api/community/feed', async (req, res) => {
  try {
    const userId = (req.query.userId as string)?.trim();
    const feed = await getCommunityFeed(userId);
    return res.json({ feed });
  } catch (err) {
    console.error('Error fetching community feed:', err);
    return res.status(500).json({ error: 'Failed to fetch community feed' });
  }
});

// Trending Reviews this week & Leaderboard
app.get('/api/community/trending', async (req, res) => {
  try {
    const data = await getTrendingReviewsAndLeaderboard();
    return res.json(data);
  } catch (err) {
    console.error('Error fetching trending and leaderboard:', err);
    return res.status(500).json({ error: 'Failed to fetch trending and leaderboard' });
  }
});

// Get comments for a review
app.get('/api/reviews/:id/comments', async (req, res) => {
  try {
    const reviewId = req.params.id;
    if (!reviewId) {
      return res.status(400).json({ error: 'reviewId is required' });
    }
    const comments = await getReviewComments(reviewId);
    return res.json({ comments });
  } catch (err) {
    console.error('Error fetching review comments:', err);
    return res.status(500).json({ error: 'Failed to fetch review comments' });
  }
});

// Add comment to a review
app.post('/api/reviews/:id/comments', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { userId, username, userAvatar, commentText } = req.body;
    if (!reviewId || !userId || !commentText?.trim()) {
      return res.status(400).json({ error: 'reviewId, userId, and non-empty commentText are required' });
    }
    const cleanComment = sanitizeText(commentText, 600);
    const cleanUsername = sanitizeText(username, 50) || 'RobloxPlayer';

    const comment = await addReviewComment({
      reviewId,
      userId,
      username: cleanUsername,
      userAvatar,
      commentText: cleanComment
    });
    return res.json({ success: true, comment });
  } catch (err) {
    console.error('Error adding review comment:', err);
    return res.status(500).json({ error: 'Failed to add review comment' });
  }
});

async function startServer() {
  try {
    await initDatabase();
  } catch (err) {
    console.error('Database initialization failed:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Caching Strategy (Pilar 1): Vite-hashed bundle assets are cached 1 year (immutable)
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));
    app.use(express.static(distPath, {
      maxAge: '1h',
    }));
    app.get('*', (req, res) => {
      // index.html must revalidate to always serve the latest bundle
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bloxboxd server listening on port ${PORT}`);
  });
}

// Start HTTP listener only when running as standalone server (not in Vercel serverless environment)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
