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
    const profile = req.body;
    if (!profile || !profile.id) {
      return res.status(400).json({ error: 'Valid profile object is required' });
    }
    if (!await requireAuth(req, res, profile.id)) return;
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
    if (!await requireAuth(req, res, log.userId)) return;
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
    if (!await requireAuth(req, res, userId)) return;
    const deleted = await deleteGameLog(userId, logId);
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
