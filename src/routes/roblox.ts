import crypto from 'crypto';
import type { Express } from 'express';
import { getAllGames, bulkUpsertGames, upsertGame, getGameById } from '../db/index';
import {
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
} from '../lib/roblox';

/** Roblox ingestion + live discovery endpoints. */
export function registerRobloxRoutes(app: Express): void {
app.get('/api/roblox/resolve', async (req, res) => {
  try {
    const query = ((req.query.query as string) || (req.query.placeId as string) || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query or placeId parameter is required' });
    }

    const placeId = extractPlaceId(query);

    // If query is not a placeId or URL, attempt to resolve by game name
    if (!placeId) {
      // 1. Check Turso database first (cached in memory)
      try {
        const dbGames = await getCachedDbCatalog();
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
            const genreMeta = extractRobloxGenreMetadata(g.genre, g.genre_l1, g.genre_l2);

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
        const dbGames = await getCachedDbCatalog();
        const filtered = genre !== 'All'
          ? dbGames.filter(g => (g.genre || '').toLowerCase().includes(genre.toLowerCase()) || (g.tags || []).some((t: string) => t.toLowerCase().includes(genre.toLowerCase())))
          : dbGames;
        if (filtered.length > 0) {
          // Jika client meminta halaman lanjutan via pageToken dan Roblox rate-limited / habis,
          // jangan kirim hasMore: true tanpa token karena akan memicu looping request dari awal.
          const isCursorPagination = Boolean(pageToken);
          const offset = isCursorPagination ? 0 : (page - 1) * limit;
          const slice = filtered.slice(offset, offset + limit);
          return res.json({
            games: slice,
            page,
            total: filtered.length,
            hasMore: isCursorPagination ? false : offset + limit < filtered.length,
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

    // Concurrently fetch icons and genuine universe metadata (genre_l1, genre_l2, visits, etc.)
    const [iconMap, universeDetailsMap] = await Promise.all([
      fetchBatchIcons(universeIds),
      fetchBatchUniverseDetails(universeIds)
    ]);

    const formattedGames = rawGames.map(item => {
      const details = universeDetailsMap.get(item.universeId);
      const upVotes = details?.favoritedCount || item.totalUpVotes || 0;
      const downVotes = item.totalDownVotes || 0;
      const { ratingAverage, ratingCount, ratingHistogram } = computeRatingStats(upVotes, downVotes);
      const iconUrl = iconMap.get(item.universeId) || 'https://tr.rbxcdn.com/180DAY-beb40b4f9cda17a98616d85b2c242e68/512/512/Image/Png/noFilter';
      const rawVisits = details?.visits ?? ((item.playerCount || 0) * 20 || 10000);
      const rawGenre = details?.genre || item.genre;
      const genreL1 = details?.genre_l1 || item.genreL1 || item.genre_l1;
      const genreL2 = details?.genre_l2 || item.genreL2 || item.genre_l2;
      const genreMeta = extractRobloxGenreMetadata(rawGenre, genreL1, genreL2);

      // If user queried a specific genre in discover and genre is still empty or 'Variety',
      // tag/align with the requested genre so it correctly surfaces in the client's genre category
      if (genre && genre !== 'All' && (genreMeta.genre === 'Variety' || !genreMeta.genre)) {
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
        tags: ['roblox', 'live-feed', ...genreMeta.tags]
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
      catalog = await getCachedDbCatalog();
    } catch (e) {
      console.error('Failed to fetch catalog from database cache:', e);
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
}
