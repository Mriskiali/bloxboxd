import type { Express } from 'express';
import {
  getAccountByUserId,
  deleteSession,
  deleteAllSessions,
  recordLoginEvent
} from '../db/index';
import { clearSessionCookie, extractSessionToken, requireAuth } from '../lib/auth';

/**
 * Account session lifecycle: status, logout, and revoke-all.
 * Authentication is handled by official Roblox OAuth 2.0 (src/routes/oauth.ts).
 */
export function registerAccountRoutes(app: Express): void {
  // Check if a Roblox account is registered
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
          username: account.username,
          verifiedAt: account.verifiedAt
        });
      }

      return res.json({
        registered: false
      });
    } catch (err) {
      console.error('Error fetching account status:', err);
      return res.status(500).json({ error: 'Gagal memeriksa status akun' });
    }
  });

  // Logout: revoke current session and clear cookie
  app.post('/api/roblox/account/logout', async (req, res) => {
    try {
      const token = extractSessionToken(req);
      if (token) {
        await deleteSession(token);
      }
      clearSessionCookie(res);
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      console.error('Logout error:', err);
      clearSessionCookie(res);
      return res.json({ success: true });
    }
  });

  // Logout all sessions (revoke everywhere)
  app.post('/api/roblox/account/logout-all', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const authed = await requireAuth(req, res, userId);
      if (!authed) return;

      await deleteAllSessions(userId);
      clearSessionCookie(res);
      void recordLoginEvent({
        userId,
        event: 'logout_all_sessions',
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
      return res.json({ success: true, message: 'Semua sesi berhasil dikeluarkan.' });
    } catch (err) {
      console.error('Logout all error:', err);
      return res.status(500).json({ error: 'Gagal keluar dari semua sesi' });
    }
  });
}
