import type { Request, Response } from 'express';
import { resolveSessionUser } from '../db/index';
import { userWriteRateLimit } from './rateLimit';

/**
 * Session transport.
 *
 * The token lives in an httpOnly cookie (`bb_session`) so page scripts — and
 * therefore any XSS payload — cannot read it. A Bearer header is still
 * accepted for tooling and for the first request after login, but the cookie
 * is the primary channel.
 */
export const SESSION_COOKIE = 'bb_session';
const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_S * 1000
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

/** Cookie first, then Authorization / x-session-token (tooling + legacy). */
export function extractSessionToken(req: Request): string | undefined {
  const fromCookie = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (fromCookie) return fromCookie;

  const header = req.headers['authorization'] || '';
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  const alt = req.headers['x-session-token'];
  return typeof alt === 'string' && alt.trim() ? alt.trim() : undefined;
}

export function isSameOrigin(req: Request): boolean {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = req.headers.origin;
  if (origin) {
    try {
      const o = new URL(origin);
      return Boolean(host) && o.host === String(host);
    } catch {
      return false;
    }
  }

  const referer = req.headers.referer;
  if (referer) {
    try {
      const r = new URL(referer);
      return Boolean(host) && r.host === String(host);
    } catch {
      return false;
    }
  }

  const fetchSite = req.headers['sec-fetch-site'];
  if (typeof fetchSite === 'string') {
    return fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none';
  }

  // Same-origin fallback for requests originating on the same host (e.g. DELETE/GET without Origin header)
  return true;
}

export async function requireAuth(req: Request, res: Response): Promise<string | null> {
  if (!isSameOrigin(req)) {
    res.status(403).json({ error: 'Cross-origin request rejected.', code: 'BAD_ORIGIN' });
    return null;
  }

  const token = extractSessionToken(req);
  const actorId = await resolveSessionUser(token);
  if (!actorId) {
    res.status(401).json({ error: 'Authentication required. Please log in again.', code: 'SESSION_INVALID' });
    return null;
  }

  if (!(await userWriteRateLimit(actorId, res))) return null;

  return actorId;
}
