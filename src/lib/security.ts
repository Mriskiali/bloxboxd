import crypto from 'crypto';

/**
 * PIN hashing and text sanitization.
 *
 * PIN format history:
 *   v1 (legacy)  -> plain hex, pbkdf2-sha256 with 1_000 iterations
 *   v2 (current) -> "pbkdf2$600000$<hex>", OWASP-recommended iteration count
 *
 * verifyPin() accepts both so existing accounts keep working; the login
 * handler rehashes to v2 on the first successful login.
 */

const PIN_ITERATIONS = 600_000;
const PIN_KEY_LEN = 32;
const PIN_DIGEST = 'sha256';

export function hashPin(pin: string, salt: string): string {
  const derived = crypto.pbkdf2Sync(pin, salt, PIN_ITERATIONS, PIN_KEY_LEN, PIN_DIGEST);
  return `pbkdf2$${PIN_ITERATIONS}$${derived.toString('hex')}`;
}

export function verifyPin(pin: string, stored: string, salt: string): boolean {
  if (!stored || !salt) return false;

  try {
    if (stored.startsWith('pbkdf2$')) {
      const [, iterStr, hex] = stored.split('$');
      const iterations = Number(iterStr);
      if (!iterations || !hex) return false;
      const expected = Buffer.from(hex, 'hex');
      const actual = crypto.pbkdf2Sync(pin, salt, iterations, expected.length, PIN_DIGEST);
      return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    }

    // Legacy v1: bare hex, 1000 iterations
    const expected = Buffer.from(stored, 'hex');
    if (expected.length === 0) return false;
    const actual = crypto.pbkdf2Sync(pin, salt, 1_000, expected.length, PIN_DIGEST);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** True when the stored hash uses the legacy scheme and should be upgraded. */
export function needsPinRehash(stored: string): boolean {
  return Boolean(stored) && !stored.startsWith('pbkdf2$');
}

/**
 * Strips angle brackets so stored text can never break out of markup.
 * React escapes on render; this is defence in depth for stored content.
 */
export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, maxLength);
}
