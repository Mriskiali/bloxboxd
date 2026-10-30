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

/**
 * HTML context escaping for server-rendered pages (OAuth callback screens).
 * Escapes the markup-breaking characters so reflected values stay text.
 */
export function escapeHtml(input: unknown): string {
  // '&' built via char code so no decoding layer between here and the
  // browser can ever turn these replacements back into raw markup.
  const amp = String.fromCharCode(38);
  return String(input ?? '')
    .replace(/&/g, amp + 'amp;')
    .replace(/</g, amp + 'lt;')
    .replace(/>/g, amp + 'gt;')
    .replace(/["]/g, amp + 'quot;')
    .replace(/[']/g, amp + '#39;');
}

/**
 * Safe embedding of a JSON value inside an inline <script> block:
 * escapes `<` so `</script>` (and friends) can never close the tag early.
 */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
