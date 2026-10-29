/**
 * Text sanitization.
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
