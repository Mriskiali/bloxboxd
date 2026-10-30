import type { Express } from 'express';
import {
  getUserProfile,
  getUserGameLogs,
  getUserReviews,
  searchUserProfiles,
  upsertUserProfile,
  upsertGameLog,
  deleteGameLog
} from '../db/index';
import { requireAuth } from '../lib/auth';
import { sanitizeText } from '../lib/security';

/** Profile, diary logs and user search endpoints. */
export function registerUserRoutes(app: Express): void {
// Fetch user data: profile, logs, and user's lists
app.get('/api/user/data', async (req, res) => {
  try {
    const userId = (req.query.userId as string)?.trim();
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const profile = await getUserProfile(userId);
    const logs = await getUserGameLogs(userId);
    const reviews = await getUserReviews(userId);
    return res.json({ profile, logs, reviews });
  } catch (err) {
    console.error('Error fetching user data:', err);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Search Bloxboxd users by username, handle, or display name
app.get('/api/users/search', async (req, res) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q) {
      return res.json({ users: [] });
    }
    const users = await searchUserProfiles(q, 8);
    return res.json({ users });
  } catch (err) {
    console.error('Error searching users:', err);
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

// Update profile & top 4 favorites
app.post('/api/user/profile', async (req, res) => {
  try {
    const actorId = await requireAuth(req, res);
    if (!actorId) return;

    const profile = req.body || {};
    // RLS: server enforces that you can only edit your own profile
    profile.id = actorId;
    profile.robloxUserId = profile.robloxUserId || Number(String(actorId).replace('user-roblox-', ''));

    // Security: Sanitize profile fields (OWASP Input Sanitization)
    if (profile.bio !== undefined) profile.bio = sanitizeText(profile.bio, 500);
    if (profile.displayName !== undefined) profile.displayName = sanitizeText(profile.displayName, 80);
    if (profile.username !== undefined) profile.username = sanitizeText(profile.username, 50);

    await upsertUserProfile(profile);
    const updated = await getUserProfile(actorId);
    return res.json({ success: true, message: 'Profile updated', profile: updated });
  } catch (err) {
    console.error('Error saving user profile:', err);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Save or update a game log
app.post('/api/logs', async (req, res) => {
  try {
    const log = req.body;
    if (!log || !log.gameId) {
      return res.status(400).json({ error: 'gameId is required' });
    }
    const actorId = await requireAuth(req, res);
    if (!actorId) return;
    // RLS: userId is server-derived, never trusted from the client.
    log.userId = actorId;
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
    if (!logId) {
      return res.status(400).json({ error: 'logId is required' });
    }
    const actorId = await requireAuth(req, res);
    if (!actorId) return;
    // RLS: deleteGameLog only matches rows whose user_id === actorId.
    const deleted = await deleteGameLog(actorId, logId);
    if (!deleted) {
      return res.status(404).json({ error: 'Log not found' });
    }
    return res.json({ success: true, message: 'Log deleted' });
  } catch (err) {
    console.error('Error deleting log:', err);
    return res.status(500).json({ error: 'Failed to delete log' });
  }
});

}
