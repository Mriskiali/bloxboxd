import type { Express } from 'express';
import {
  getAccountByUserId,
  getUserProfile,
  resolveSessionUser,
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
  // Canonical auth-status endpoint: resolves the caller's identity from the
  // httpOnly session cookie so the client can seed `user` from the server
  // instead of trusting localStorage. Never 401s — anonymous callers get null.
  app.get('/api/me', async (req, res) => {
    try {
      const token = extractSessionToken(req);
      const actorId = token ? await resolveSessionUser(token) : null;
      if (!actorId) return res.json({ user: null });
      const profile = await getUserProfile(actorId);
      return res.json({ user: profile });
    } catch (err) {
      console.error('/api/me error:', err);
      return res.json({ user: null });
    }
  });

  // Check if the authenticated Roblox account is registered.
  // Subject is derived SOLELY from the session cookie principal — no
  // client-supplied userId param is accepted, so the caller can only ever
  // read their own status (no enumeration / no IDOR surface).
  app.get('/api/roblox/account/status', async (req, res) => {
    const actorId = await requireAuth(req, res);
    if (!actorId) return;

    const robloxNum = Number(String(actorId).replace(/^user-roblox-/, ''));

    try {
      const account = await getAccountByUserId(robloxNum);
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
      const actorId = await requireAuth(req, res);
      if (!actorId) return;

      await deleteAllSessions(actorId);
      clearSessionCookie(res);
      void recordLoginEvent({
        userId: actorId,
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
