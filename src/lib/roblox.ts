import crypto from 'crypto';
import { getAllGames, bulkUpsertGames, upsertGame, getGameById } from '../db/index';

/**
 * Roblox ingestion helpers: API caches, batch fetchers, genre mapping and the
 * RoProxy failover used when roblox.com blocks the serverless egress IP.
 */

interface CachedGameResponse {
  data: any;
  timestamp: number;
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


// Extracts genuine Roblox API genre and subgenre taxonomy
function extractRobloxGenreMetadata(rawGenre?: string, genreL1?: string, genreL2?: string): {
  genre: string;
  subgenre?: string;
  genre_l1?: string;
  genre_l2?: string;
  tags: string[];
} {
  const l1 = (genreL1 || '').trim();
  const l2 = (genreL2 || '').trim();
  const legacy = (rawGenre || '').trim();

  // Primary Genre: Prioritize official Roblox modern genre_l1; fallback to legacy genre if not 'All'; default to 'Variety'
  let primaryGenre = l1;
  if (!primaryGenre && legacy && legacy.toLowerCase() !== 'all') {
    primaryGenre = legacy;
  }
  if (!primaryGenre) {
    primaryGenre = 'Variety';
  }

  // Subgenre: Prioritize official Roblox modern genre_l2
  let subgenre: string | undefined = l2 || undefined;
  if (!subgenre && legacy && legacy.toLowerCase() !== 'all' && legacy.toLowerCase() !== primaryGenre.toLowerCase()) {
    subgenre = legacy;
  }

  const tags: string[] = ['roblox'];
  if (primaryGenre && primaryGenre !== 'Variety') tags.push(primaryGenre.toLowerCase());
  if (subgenre) tags.push(subgenre.toLowerCase());
  if (legacy && legacy !== 'All' && !tags.includes(legacy.toLowerCase())) tags.push(legacy.toLowerCase());

  return {
    genre: primaryGenre,
    subgenre,
    genre_l1: l1 || undefined,
    genre_l2: l2 || undefined,
    tags
  };
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
    description: gameInfo?.description || 'No description provided by creator.',
    creatorName: gameInfo?.creator?.name || 'Roblox Creator',
    creatorType: gameInfo?.creator?.type || 'Group',
    iconUrl: iconUrl || 'https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter',
    bannerUrl: bannerUrl || undefined,
    genre: genreMeta.genre,
    subgenre: genreMeta.subgenre,
    genre_l1: genreMeta.genre_l1,
    genre_l2: genreMeta.genre_l2,
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

// In-memory caching layer for Turso database catalog to avoid 500-row table scans on every search/resolve

let cachedDbCatalog: any[] = [];
let lastDbCatalogFetchTime = 0;
const DB_CATALOG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedDbCatalog(): Promise<any[]> {
  const now = Date.now();
  if (cachedDbCatalog.length > 0 && (now - lastDbCatalogFetchTime) < DB_CATALOG_CACHE_TTL) {
    return cachedDbCatalog;
  }
  try {
    cachedDbCatalog = await getAllGames(500);
    lastDbCatalogFetchTime = now;
  } catch (e) {
    console.error('Failed to refresh db catalog cache:', e);
  }
  return cachedDbCatalog;
}

// In-memory cache for live Roblox online searches (10 minutes)
const onlineSearchCache = new Map<string, { results: any[]; timestamp: number }>();
const SEARCH_CACHE_TTL = 10 * 60 * 1000;

// In-memory cache for batch universe details (30 minutes)
const universeDetailsCache = new Map<number, { data: any; timestamp: number }>();
const UNIVERSE_DETAILS_CACHE_TTL = 30 * 60 * 1000;

// Batch fetch universe details (genre_l1, genre_l2, visits, creator, description, etc.)
async function fetchBatchUniverseDetails(universeIds: number[]): Promise<Map<number, any>> {
  const resultMap = new Map<number, any>();
  if (!universeIds || universeIds.length === 0) return resultMap;

  const missingIds: number[] = [];
  const now = Date.now();

  for (const uid of universeIds) {
    if (!uid) continue;
    const cached = universeDetailsCache.get(uid);
    if (cached && (now - cached.timestamp) < UNIVERSE_DETAILS_CACHE_TTL) {
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
        `https://games.roproxy.com/v1/games?universeIds=${chunk.join(',')}`,
        `https://games.roblox.com/v1/games?universeIds=${chunk.join(',')}`
      ];

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            headers: { 'User-Agent': 'Bloxboxd/1.0' }
          });
          if (res.ok) {
            const data = await res.json();
            for (const item of (data.data || [])) {
              if (item.id) {
                resultMap.set(item.id, item);
                universeDetailsCache.set(item.id, { data: item, timestamp: Date.now() });
              }
            }
            if (data.data && data.data.length > 0) break;
          }
        } catch (e) {}
      }
    })
  );

  return resultMap;
}

// Batch fetch 512x512 high-resolution game icons
async function fetchBatchIcons(universeIds: number[]): Promise<Map<number, string>> {
  const iconMap = new Map<number, string>();
  if (!universeIds || universeIds.length === 0) return iconMap;

  const uniqueIds = Array.from(new Set(universeIds.filter(Boolean)));
  const CHUNK_SIZE = 50;

  await Promise.all(
    Array.from({ length: Math.ceil(uniqueIds.length / CHUNK_SIZE) }, async (_, idx) => {
      const chunk = uniqueIds.slice(idx * CHUNK_SIZE, (idx + 1) * CHUNK_SIZE);
      const iconEndpoints = [
        `https://thumbnails.roproxy.com/v1/games/icons?universeIds=${chunk.join(',')}&size=512x512&format=Png&isCircular=false`,
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${chunk.join(',')}&size=512x512&format=Png&isCircular=false`
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
    })
  );

  return iconMap;
}

// Live search resolver for finding ANY Roblox game on the platform by name, keyword, or query
async function searchRobloxLiveOnline(rawQuery: string): Promise<any[]> {
  const query = rawQuery.trim();
  if (!query) return [];

  const cacheKey = query.toLowerCase();
  const cached = onlineSearchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < SEARCH_CACHE_TTL) {
    return cached.results;
  }

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
      } else if (res.status === 429) {
        console.warn(`[Roblox Search API] Rate limited (429) on ${ep}`);
      }
    } catch (err) {
      console.warn(`Search endpoint ${ep} failed:`, err);
    }
  }

  if (rawGames.length === 0) return [];

  const topGames = rawGames.slice(0, 40);
  const universeIds = topGames.map(g => g.universeId);

  // Batch fetch icons & genuine universe metadata concurrently
  const [iconMap, universeDetailsMap] = await Promise.all([
    fetchBatchIcons(universeIds),
    fetchBatchUniverseDetails(universeIds)
  ]);

  const formattedResults = topGames.map(item => {
    const details = universeDetailsMap.get(item.universeId);
    const upVotes = details?.favoritedCount || item.totalUpVotes || 0;
    const downVotes = item.totalDownVotes || 0;
    const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
    const iconUrl = iconMap.get(item.universeId) || 'https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter';
    const rawVisits = details?.visits ?? ((item.playerCount || 0) * 18 || 10000);
    const rawGenre = details?.genre || item.genre;
    const genreL1 = details?.genre_l1 || item.genreL1 || item.genre_l1;
    const genreL2 = details?.genre_l2 || item.genreL2 || item.genre_l2;
    const genreMeta = extractRobloxGenreMetadata(rawGenre, genreL1, genreL2);

    return {
      id: `roblox-${item.universeId}`,
      universeId: item.universeId,
      rootPlaceId: details?.rootPlaceId || item.rootPlaceId || 0,
      name: details?.name || item.name,
      description: details?.description || item.description || '',
      creatorName: details?.creator?.name || item.creatorName || 'Roblox Creator',
      creatorType: details?.creator?.hasVerifiedBadge || item.creatorHasVerifiedBadge ? 'Verified' : 'Group',
      iconUrl,
      genre: genreMeta.genre,
      subgenre: genreMeta.subgenre,
      genre_l1: genreMeta.genre_l1,
      genre_l2: genreMeta.genre_l2,
      playerCount: details?.playing ?? (item.playerCount || 0),
      totalVisits: rawVisits ? Number(rawVisits).toLocaleString() : '10,000+',
      rawVisits,
      favoritedCount: upVotes,
      upVotes,
      downVotes,
      releaseYear: details?.created ? new Date(details.created).getFullYear() : new Date().getFullYear(),
      ratingAverage,
      ratingCount,
      ratingHistogram,
      tags: ['roblox', 'live-search', ...genreMeta.tags].filter(Boolean)
    };
  });

  if (formattedResults.length > 0) {
    onlineSearchCache.set(cacheKey, { results: formattedResults, timestamp: Date.now() });
  }

  return formattedResults;
}

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
  'Action': 'action fighting battleground',
  'RPG': 'rpg action-rpg adventure',
  'Shooter': 'shooter fps deathmatch',
  'Survival': 'survival escape horror',
  'Roleplay & Avatar Sim': 'roleplay life dress up avatar',
  'Simulation': 'simulation tycoon simulator',
  'Strategy': 'strategy tower defense',
  'Obby & Platformer': 'obby platformer parkour',
  'Party & Casual': 'party minigames casual',
  'Horror': 'horror scary survival',
  'Action / Fighting': 'action fighting battleground',
  'Adventure / RPG': 'rpg adventure',
  'Social / Roleplay': 'roleplay avatar life',
  'Shooter / FPS': 'shooter fps',
  'Obby / Parkour': 'obby parkour',
  'Simulator / Tycoon': 'simulation tycoon',
  'Tower Defense': 'tower defense strategy'
};


// In-memory cache for Roblox omni-search pages (10 minutes)
const omniSearchCache = new Map<string, { data: { games: any[]; nextPageToken?: string }; timestamp: number }>();
const OMNI_SEARCH_CACHE_TTL = 10 * 60 * 1000;

async function fetchRobloxOmniSearchPage(query: string, pageToken?: string): Promise<{ games: any[]; nextPageToken?: string }> {
  const cacheKey = `${query.toLowerCase().trim()}::${pageToken || ''}`;
  const cached = omniSearchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < OMNI_SEARCH_CACHE_TTL) {
    return cached.data;
  }

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
      } else if (res.status === 429) {
        console.warn(`[Roblox Omni-Search] Rate limited (429) on ${ep}`);
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

  const result = {
    games: rawGames,
    nextPageToken: searchData.nextPageToken || undefined
  };

  if (rawGames.length > 0) {
    omniSearchCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }

  return result;
}

/**
 * Installs a global fetch wrapper: direct roblox.com calls that get blocked
 * (403/429) are retried through the roproxy.com mirror.
 */

/**
 * Installs a global fetch wrapper: direct roblox.com calls that get blocked
 * (403/429) are retried through the roproxy.com mirror.
 */
export function installRobloxFetchFailover(): void {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function (input: any, init?: any) {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input?.url || '';
    if (urlStr.includes('.roblox.com')) {
      try {
        const res = await originalFetch(input, init);
        // If direct connection succeeds and not blocked, return immediately
        if (res.ok || (res.status !== 403 && res.status !== 429)) {
          return res;
        }
      } catch (e) {}

      // Fallback to roproxy gateway
      const proxyUrl = urlStr
        .replace('https://games.roblox.com', 'https://games.roproxy.com')
        .replace('https://thumbnails.roblox.com', 'https://thumbnails.roproxy.com')
        .replace('https://users.roblox.com', 'https://users.roproxy.com')
        .replace('https://apis.roblox.com', 'https://apis.roproxy.com')
        .replace('https://friends.roblox.com', 'https://friends.roproxy.com');

      return originalFetch(proxyUrl, init);
    }
    return originalFetch(input, init);
  };
}

export {
  gameCache,
  CACHE_TTL_MS,
  extractPlaceId,
  computeRatingStats,
  extractRobloxGenreMetadata,
  fetchUniverseDetails,
  getCachedDbCatalog,
  fetchBatchUniverseDetails,
  fetchBatchIcons,
  searchRobloxLiveOnline,
  fetchLiveDiscoverGames,
  GENRE_KEYWORD_MAP,
  fetchRobloxOmniSearchPage
};
