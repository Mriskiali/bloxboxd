import type { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Distributed rate limiting backed by Upstash Redis.
 *
 * Vercel serverless spins up many instances, so an in-memory limiter is
 * useless across the fleet. Upstash gives us a shared, serverless-friendly
 * store. When the env vars are absent (local dev / not yet configured) we
 * fall back to an always-allow no-op so the app keeps working.
 */

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isConfigured = Boolean(upstashUrl && upstashToken);

let redis: Redis | null = null;
if (isConfigured) {
  try {
    redis = new Redis({ url: upstashUrl!, token: upstashToken! });
  } catch (err) {
    console.warn('[RateLimit] Upstash Redis init failed; limiter disabled:', err);
  }
}

/** Global per-IP limiter: generous ceiling that only catches abuse. */
const ipLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, '60 s'),
      prefix: 'bloxboxd:ip:global',
      analytics: true
    })
  : null;

/** Strict limiter for expensive Roblox-proxy routes (amplification defence). */
const strictIPLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '60 s'),
      prefix: 'bloxboxd:ip:roblox',
      analytics: true
    })
  : null;

/** Per-user limiter for authenticated writes. */
const userLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, '60 s'),
      prefix: 'bloxboxd:user:write',
      analytics: true
    })
  : null;

/** Best-effort client IP across proxies (Vercel sets x-forwarded-for). */
function clientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function rateLimitHeaders(res: Response, remaining: number, reset: number): void {
  res.setHeader('RateLimit-Remaining', String(remaining));
  res.setHeader('RateLimit-Reset', String(reset));
}

/**
 * Apply a limiter to an identifier. Sends 429 on block. Returns true when
 * allowed (or when limiting is disabled), false when blocked.
 */
export async function checkLimit(
  limiter: Ratelimit | null,
  identifier: string,
  res: Response
): Promise<boolean> {
  if (!limiter) return true; // disabled (no Upstash configured)
  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    rateLimitHeaders(res, remaining, reset);
    if (!success) {
      res.status(429).json({
        error: 'Too many requests. Please slow down.',
        code: 'RATE_LIMITED',
        reset
      });
      return false;
    }
    return true;
  } catch (err) {
    // If Upstash is down, fail open (don't take the app down with it).
    console.warn('[RateLimit] limiter error, failing open:', err);
    return true;
  }
}

/** Global per-IP middleware applied to every request. */
export async function globalIpRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (await checkLimit(ipLimiter, clientIp(req), res)) next();
}

/** Stricter per-IP limit for expensive Roblox ingestion/proxy routes. */
export async function strictRobloxRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (await checkLimit(strictIPLimiter, `roblox:${clientIp(req)}`, res)) next();
}

/** Per-user limit for authenticated writes. Pass the canonical userId. */
export async function userWriteRateLimit(userId: string, res: Response): Promise<boolean> {
  return checkLimit(userLimiter, userId, res);
}

export const rateLimitConfigured = isConfigured;
