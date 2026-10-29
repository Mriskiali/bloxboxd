import type { Request, Response } from 'express';
import { isValidSession } from '../db/index';

/**
 * Session auth for mutating endpoints: a Bearer token must be present and
 * bound to the acting userId.
 */
export function extractSessionToken(req: Request): string | undefined {
  const header = req.headers['authorization'] || '';
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  const alt = req.headers['x-session-token'];
  return typeof alt === 'string' && alt.trim() ? alt.trim() : undefined;
}

export async function requireAuth(req: Request, res: Response, userId: unknown): Promise<boolean> {
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return false;
  }
  const token = extractSessionToken(req);
  const ok = await isValidSession(token, String(userId));
  if (!ok) {
    res.status(401).json({ error: 'Authentication required. Please log in again.', code: 'SESSION_INVALID' });
    return false;
  }
  return true;
}
