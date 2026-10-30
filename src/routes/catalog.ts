import type { Express } from 'express';
import { getAllGames, getGameById, upsertGame, bulkUpsertGames } from '../db/index';
import { requireAuth } from '../lib/auth';

/** Game catalog endpoints (read open, writes require a session). */
export function registerCatalogRoutes(app: Express): void {
// ===========================================================================
// Turso Cloud Database REST Endpoints (Games, Users, Logs, Reviews, Lists)
// ===========================================================================

// Get all games in catalog from Turso database
app.get('/api/games', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(10000, parseInt((req.query.limit as string) || '2000', 10)));
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
    // Auth: catalog writes are user-contributed; block anonymous spam/overwrite.
    // RLS: actor derived from the session token.
    const actorId = await requireAuth(req, res);
    if (!actorId) return;
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

}
