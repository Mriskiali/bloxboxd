import assert from 'node:assert/strict';
import { canonicalUserId, upsertGameLog } from '../src/db/index';
import { isSameOrigin, parseCookies } from '../src/lib/auth';
import { sanitizeText, escapeHtml } from '../src/lib/security';
import { checkLimit } from '../src/lib/rateLimit';

console.log('[Audit Test] Running verification suite...');

// 1. canonicalUserId consistency
assert.equal(canonicalUserId('12345'), 'user-roblox-12345');
assert.equal(canonicalUserId('user-roblox-12345'), 'user-roblox-12345');
assert.equal(canonicalUserId(12345), 'user-roblox-12345');

// 2. Cookie parser
const cookies = parseCookies('bb_session=secret_token_123; other=value');
assert.equal(cookies['bb_session'], 'secret_token_123');
assert.equal(cookies['other'], 'value');

// 3. CSRF origin check
const validReq: any = {
  headers: {
    origin: 'https://bloxboxd.vercel.app',
    host: 'bloxboxd.vercel.app'
  }
};
assert.equal(isSameOrigin(validReq), true);

const spoofedReq: any = {
  headers: {
    origin: 'https://attacker.evil',
    host: 'bloxboxd.vercel.app'
  }
};
assert.equal(isSameOrigin(spoofedReq), false);

// Origin absent but same-origin sec-fetch-site
const secFetchReq: any = {
  headers: {
    'sec-fetch-site': 'same-origin',
    host: 'bloxboxd.vercel.app'
  }
};
assert.equal(isSameOrigin(secFetchReq), true);

// Cross-site fetch without origin rejected
const crossSiteReq: any = {
  headers: {
    'sec-fetch-site': 'cross-site',
    host: 'bloxboxd.vercel.app'
  }
};
assert.equal(isSameOrigin(crossSiteReq), false);

// 4. Input sanitization
assert.equal(sanitizeText('<script>alert(1)</script>hello'), 'scriptalert(1)/scripthello');
assert.equal(escapeHtml('<div class="x">&'), '&lt;div class=&quot;x&quot;&gt;&amp;');

// 5. Rate limiter fallback (no Redis configured -> allows)
const mockRes: any = {
  setHeader: () => {},
  status: () => ({ json: () => {} })
};
checkLimit(null, 'test-id', mockRes).then(async (allowed) => {
  assert.equal(allowed, true);

  // 6. Test rapid loop log insertion (proving UNIQUE constraint on game_logs.id cannot happen)
  const batch = [];
  for (let i = 0; i < 15; i++) {
    batch.push(upsertGameLog({
      userId: 'test-user-audit',
      gameId: `test-game-${i}`,
      status: 'played',
      isFavorite: true,
      loggedDate: '2026-03-30'
    }));
  }
  await Promise.all(batch);

  console.log('[Audit Test] All assertions and concurrent DB writes passed successfully.');
});
