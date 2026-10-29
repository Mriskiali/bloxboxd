import crypto from 'crypto';
import type { Express } from 'express';
import {
  getAccountByUserId,
  saveAccount,
  getUserProfile,
  upsertUserProfile,
  saveChallenge,
  getChallenge,
  deleteChallenge,
  purgeExpiredChallenges,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  createSession,
  type StoredChallenge
} from '../db/index';
import { hashPin, verifyPin, needsPinRehash } from '../lib/security';

/** Roblox account ownership verification, PIN login and PIN reset. */
export function registerAccountRoutes(app: Express): void {
// 250+ standard English dictionary words that are 100% immune to Roblox safe chat / bio filters
const ROBLOX_FILTER_SAFE_WORDS = [
  'silver', 'golden', 'dragon', 'falcon', 'rabbit', 'apple', 'banana', 'orange',
  'star', 'moon', 'river', 'cloud', 'castle', 'island', 'crystal', 'guitar',
  'sunny', 'brave', 'swift', 'green', 'blue', 'winter', 'summer', 'panda',
  'diamond', 'ocean', 'forest', 'knight', 'spark', 'breeze', 'planet', 'beacon',
  'timber', 'feather', 'glacier', 'whisper', 'shadow', 'meadow', 'harbor', 'amber',
  'copper', 'valley', 'canyon', 'stream', 'pebble', 'marble', 'galaxy', 'meteor',
  'compass', 'anchor', 'canvas', 'velvet', 'lantern', 'candle', 'shield', 'banner',
  'tower', 'bridge', 'garden', 'blossom', 'clover', 'tulip', 'spruce', 'willow',
  'cedar', 'branch', 'autumn', 'spring', 'sunrise', 'sunset', 'horizon', 'zenith',
  'echo', 'riddle', 'fable', 'legend', 'voyage', 'journey', 'passage', 'harbor',
  'summit', 'peak', 'crag', 'cliff', 'aurora', 'comet', 'stellar', 'lunar',
  'solar', 'marine', 'coral', 'lagoon', 'tide', 'wave', 'drift', 'current',
  'frost', 'ember', 'blaze', 'torch', 'hearth', 'quiver', 'arrow',
  'saber', 'armor', 'helm', 'crown', 'scepter', 'throne', 'palace', 'spire',
  'portal', 'haven', 'sanctuary', 'oasis', 'temple', 'shrine', 'cairn', 'grove',
  'thicket', 'orchard', 'prairie', 'tundra', 'steppe', 'savanna', 'dune', 'delta',
  'badger', 'otter', 'beaver', 'walrus', 'dolphin', 'whale', 'eagle', 'hawk',
  'heron', 'crane', 'sparrow', 'finch', 'robin', 'raven', 'parrot', 'canary'
];

// Check if a Roblox account is already registered & PIN-protected
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
        hasPin: Boolean(account.pinHash),
        username: account.username,
        verifiedAt: account.verifiedAt
      });
    }

    return res.json({
      registered: false,
      hasPin: false
    });
  } catch (err) {
    console.error('Error fetching account status:', err);
    return res.status(500).json({ error: 'Gagal memeriksa status akun' });
  }
});

// Start a new secure time-limited verification challenge session (Anti-spoofing)
app.post('/api/roblox/account/challenge/start', async (req, res) => {
  try {
    const { userId, type = 'bio' } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 1. Fetch user data from Roblox API
    const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}?_t=${Date.now()}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!userRes.ok) {
      return res.status(404).json({ error: 'Akun Roblox tidak ditemukan di server resmi Roblox.' });
    }
    const userData = await userRes.json();
    const currentBio = (userData.description || '').toLowerCase();

    // Opportunistic housekeeping: drop abandoned challenges
    void purgeExpiredChallenges().catch(() => {});

    const challengeId = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 4 * 60 * 1000; // 4 minutes expiry

    if (type === 'avatar') {
      // Official free Roblox hats created by Roblox (0 Robux)
      const officialFreeItems = [
        {
          id: 417457461,
          name: "ROBLOX 'R' Baseball Cap",
          catalogUrl: "https://www.roblox.com/catalog/417457461/ROBLOX-R-Baseball-Cap"
        },
        {
          id: 607702162,
          name: "Roblox Baseball Cap",
          catalogUrl: "https://www.roblox.com/catalog/607702162/Roblox-Baseball-Cap"
        }
      ];

      // Helper to fetch live worn assets from Roblox avatar endpoint (higher rate limit & reliability)
      let assetIds: number[] = [];
      try {
        const avatarRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar?_t=${Date.now()}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (avatarRes.ok) {
          const aData = await avatarRes.json();
          if (Array.isArray(aData.assets)) {
            assetIds = aData.assets.map((a: any) => Number(a.id)).filter((id: number) => !isNaN(id));
          }
        }
      } catch (e) {
        console.warn('Failed to fetch avatar endpoint, falling back to wearing endpoint', e);
      }

      if (assetIds.length === 0) {
        try {
          const wearingRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing?_t=${Date.now()}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          if (wearingRes.ok) {
            const wData = await wearingRes.json();
            if (Array.isArray(wData.assetIds)) {
              assetIds = wData.assetIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
            }
          }
        } catch (e) {
          console.warn('Failed to fetch currently-wearing endpoint', e);
        }
      }

      const preferredId = Number(req.body.preferredItemId);
      const selectedItem = officialFreeItems.find(i => i.id === preferredId) || officialFreeItems[0];
      const targetAssetId = selectedItem.id;
      const targetAssetName = selectedItem.name;
      const isCurrentlyWearing = assetIds.includes(targetAssetId);
      const expectedWearing = !isCurrentlyWearing;

      const challenge: StoredChallenge = {
        id: challengeId,
        userId: Number(userId),
        username: userData.name,
        type: 'avatar',
        assetId: targetAssetId,
        assetName: targetAssetName,
        expectedWearing,
        createdAt: Date.now(),
        expiresAt
      };
      await saveChallenge(challenge);

      return res.json({
        success: true,
        challengeId,
        type: 'avatar',
        assetId: targetAssetId,
        assetName: targetAssetName,
        catalogUrl: selectedItem.catalogUrl,
        avatarEditorUrl: 'https://www.roblox.com/my/avatar',
        availableItems: officialFreeItems,
        action: expectedWearing ? 'equip' : 'unequip',
        actionInstruction: expectedWearing 
          ? `Buka Avatar Editor di roblox.com/my/avatar. Pakai topi resmi gratis "${targetAssetName}" (0 Robux di Catalog), lalu klik tombol verifikasi di bawah.`
          : `Buka Avatar Editor di roblox.com/my/avatar. Lepaskan sementara topi "${targetAssetName}", lalu klik tombol verifikasi di bawah.`,
        expiresInSeconds: 240
      });
    }

    // Default: 'bio'
    // Pick 4 completely random words that are GUARANTEED NOT in the user's current bio
    const shuffled = [...ROBLOX_FILTER_SAFE_WORDS].sort(() => 0.5 - Math.random());
    const selectedWords: string[] = [];
    for (const word of shuffled) {
      if (!currentBio.includes(word.toLowerCase())) {
        selectedWords.push(word);
        if (selectedWords.length === 4) break;
      }
    }

    const phrase = selectedWords.join(' ');
    const challenge: StoredChallenge = {
      id: challengeId,
      userId: Number(userId),
      username: userData.name,
      type: 'bio',
      words: selectedWords,
      phrase,
      createdAt: Date.now(),
      expiresAt
    };
    await saveChallenge(challenge);

    return res.json({
      success: true,
      challengeId,
      type: 'bio',
      phrase,
      words: selectedWords,
      expiresInSeconds: 240
    });
  } catch (err) {
    console.error('Start challenge error:', err);
    return res.status(500).json({ error: 'Gagal membuat sesi verifikasi aman.' });
  }
});

// Verify active challenge and register account with PIN
app.post('/api/roblox/account/challenge/verify', async (req, res) => {
  try {
    const { challengeId, userId, pin } = req.body;
    if (!challengeId || !userId) {
      return res.status(400).json({ error: 'challengeId dan userId diperlukan.' });
    }

    if (!pin || pin.toString().trim().length < 4) {
      return res.status(400).json({ error: 'PIN Keamanan minimal 4 angka untuk melindungi akun kamu.' });
    }

    const challenge = await getChallenge(challengeId);
    if (!challenge || challenge.userId !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Sesi verifikasi tidak valid atau telah kedaluwarsa. Silakan mulai sesi verifikasi baru.'
      });
    }

    if (Date.now() > challenge.expiresAt) {
      await deleteChallenge(challengeId);
      return res.status(403).json({
        success: false,
        error: 'Waktu sesi verifikasi (4 menit) telah habis. Silakan klik buat sesi baru.'
      });
    }

    if (challenge.type === 'avatar') {
      let currentAssetIds: number[] = [];
      try {
        const avatarRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/avatar?_t=${Date.now()}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (avatarRes.ok) {
          const aData = await avatarRes.json();
          if (Array.isArray(aData.assets)) {
            currentAssetIds = aData.assets.map((a: any) => Number(a.id)).filter((id: number) => !isNaN(id));
          }
        }
      } catch (e) {
        console.warn('Avatar verify fetch error:', e);
      }

      if (currentAssetIds.length === 0) {
        try {
          const wearingRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing?_t=${Date.now()}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          if (wearingRes.ok) {
            const wData = await wearingRes.json();
            if (Array.isArray(wData.assetIds)) {
              currentAssetIds = wData.assetIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
            }
          }
        } catch (e) {
          console.warn('Currently-wearing verify fetch error:', e);
        }
      }

      const isNowWearing = currentAssetIds.includes(challenge.assetId!);

      if (isNowWearing !== challenge.expectedWearing) {
        const actionMsg = challenge.expectedWearing
          ? `Topi "${challenge.assetName}" (ID: ${challenge.assetId}) belum terpasang di avatar kamu. Silakan pakai di Avatar Editor roblox.com/my/avatar, simpan perubahan, lalu klik tombol verifikasi lagi.`
          : `Topi "${challenge.assetName}" (ID: ${challenge.assetId}) masih terpasang di avatar kamu. Silakan lepas di Avatar Editor roblox.com/my/avatar, simpan perubahan, lalu klik tombol verifikasi lagi.`;
        return res.status(400).json({
          success: false,
          verified: false,
          message: actionMsg,
          error: actionMsg
        });
      }
    } else {
      // Check live bio directly from official Roblox API
      const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}?_t=${Date.now()}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!userRes.ok) {
        return res.status(500).json({ error: 'Gagal menghubungi server Roblox untuk memeriksa profil.' });
      }
      const uData = await userRes.json();
      const liveBio = (uData.description || '').toLowerCase();

      // Ensure every word from the session challenge is present in liveBio
      const allWordsPresent = challenge.words!.every(w => liveBio.includes(w.toLowerCase()));
      if (!allWordsPresent) {
        return res.status(403).json({
          success: false,
          verified: false,
          message: `Frasa unik "${challenge.phrase}" belum ditemukan di kolom About / Bio akun Roblox kamu. Pastikan sudah disimpan di profil Roblox.`
        });
      }
    }

    // SUCCESS! Destroy challenge immediately (Single-use, anti-replay)
    await deleteChallenge(challengeId);

    // Save security PIN with salt + PBKDF2 hash
    const salt = crypto.randomBytes(16).toString('hex');
    const pinHash = hashPin(pin.toString().trim(), salt);
    const sessionToken = await createSession(userId);
    const finalUsername = challenge.username || 'RobloxPlayer';

    await saveAccount({
      userId: Number(userId),
      username: finalUsername,
      pinHash,
      salt,
      verifiedAt: new Date().toISOString()
    });

    // Ensure user profile row exists
    const existingProfile = await getUserProfile(`user-roblox-${userId}`);
    if (!existingProfile) {
      await upsertUserProfile({
        id: `user-roblox-${userId}`,
        robloxUserId: Number(userId),
        username: finalUsername,
        handle: `@${finalUsername}`,
        joinedDate: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      verified: true,
      sessionToken,
      message: 'Akun Roblox berhasil diverifikasi dan dilindungi dengan PIN Keamanan! Orang lain tidak akan bisa masuk tanpa PIN kamu.'
    });
  } catch (err) {
    console.error('Challenge verify error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat memverifikasi akun.' });
  }
});

// Login to existing protected Roblox account with Security PIN
app.post('/api/roblox/account/login-with-pin', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId || !pin) {
      return res.status(400).json({ error: 'userId and pin are required' });
    }

    // Rate limit: 5 failed attempts / 15 min per Roblox account. Keyed by
    // account only (not IP) so rotating proxies cannot multiply attempts.
    const rateLimitKey = `pin_${userId}`;
    const rateStatus = await checkLoginRateLimit(rateLimitKey);
    if (!rateStatus.allowed) {
      return res.status(429).json({
        success: false,
        error: `Terlalu banyak percobaan PIN salah. Akun dikunci sementara selama ${rateStatus.waitMinutes} menit demi keamanan.`,
        locked: true,
        waitMinutes: rateStatus.waitMinutes
      });
    }

    const account = await getAccountByUserId(Number(userId));

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Akun Roblox ini belum didaftarkan di Bloxboxd. Harap lakukan verifikasi kepemilikan terlebih dahulu.'
      });
    }

    if (!verifyPin(pin.toString().trim(), account.pinHash, account.salt)) {
      const remaining = await recordFailedLogin(rateLimitKey);
      if (remaining === 0) {
        return res.status(429).json({
          success: false,
          error: 'PIN salah! Akun telah dikunci selama 15 menit karena mencapai 5 kali kegagalan berturut-turut demi melindungi akun Roblox kamu.',
          locked: true,
          remainingAttempts: 0
        });
      }
      return res.status(401).json({
        success: false,
        message: `PIN Keamanan salah! Sisa percobaan: ${remaining} kali sebelum akun dikunci 15 menit.`,
        remainingAttempts: remaining
      });
    }

    // PIN is correct: reset failure counter
    await resetLoginAttempts(rateLimitKey);

    // Transparent upgrade of legacy v1 hashes (1k iterations -> 600k)
    if (needsPinRehash(account.pinHash)) {
      try {
        const salt = crypto.randomBytes(16).toString('hex');
        await saveAccount({
          userId: Number(userId),
          username: account.username,
          pinHash: hashPin(pin.toString().trim(), salt),
          salt,
          verifiedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[Auth] PIN rehash failed (non-fatal):', e);
      }
    }

    const sessionToken = await createSession(userId);
    return res.json({
      success: true,
      sessionToken,
      username: account.username,
      message: 'Login berhasil!'
    });
  } catch (err) {
    console.error('PIN Login error:', err);
    return res.status(500).json({ error: 'Gagal memproses login PIN' });
  }
});

// Reset PIN for protected account via active challenge verification
app.post('/api/roblox/account/reset-pin', async (req, res) => {
  try {
    const { challengeId, userId, newPin } = req.body;
    if (!challengeId || !userId || !newPin) {
      return res.status(400).json({ error: 'challengeId, userId, dan newPin diperlukan.' });
    }

    if (newPin.toString().trim().length < 4) {
      return res.status(400).json({ error: 'PIN baru minimal 4 angka.' });
    }

    const challenge = await getChallenge(challengeId);
    if (!challenge || challenge.userId !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Sesi verifikasi reset PIN tidak valid atau telah kedaluwarsa.'
      });
    }

    if (Date.now() > challenge.expiresAt) {
      await deleteChallenge(challengeId);
      return res.status(403).json({
        success: false,
        error: 'Sesi verifikasi reset PIN telah kedaluwarsa. Silakan mulai sesi baru.'
      });
    }

    if (challenge.type === 'avatar') {
      const wearingRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing?_t=${Date.now()}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!wearingRes.ok) {
        return res.status(500).json({ error: 'Gagal memeriksa avatar Roblox kamu.' });
      }
      const wData = await wearingRes.json();
      const currentAssetIds: number[] = Array.isArray(wData.assetIds) ? wData.assetIds : [];
      const isNowWearing = currentAssetIds.includes(challenge.assetId!);

      if (isNowWearing !== challenge.expectedWearing) {
        return res.status(403).json({
          success: false,
          verified: false,
          message: 'Perubahan avatar belum terdeteksi di server Roblox.'
        });
      }
    } else {
      const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}?_t=${Date.now()}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!userRes.ok) {
        return res.status(500).json({ error: 'Gagal memeriksa profil Roblox.' });
      }
      const uData = await userRes.json();
      const liveBio = (uData.description || '').toLowerCase();
      const allWordsPresent = challenge.words!.every(w => liveBio.includes(w.toLowerCase()));

      if (!allWordsPresent) {
        return res.status(403).json({
          success: false,
          verified: false,
          message: `Frasa "${challenge.phrase}" belum ditemukan di bio profil Roblox kamu.`
        });
      }
    }

    // Destroy challenge
    await deleteChallenge(challengeId);

    const salt = crypto.randomBytes(16).toString('hex');
    const pinHash = hashPin(newPin.toString().trim(), salt);
    const sessionToken = await createSession(userId);

    await saveAccount({
      userId: Number(userId),
      username: challenge.username || 'RobloxPlayer',
      pinHash,
      salt,
      verifiedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      sessionToken,
      message: 'PIN Keamanan berhasil diatur ulang dan akun berhasil diverifikasi!'
    });
  } catch (err) {
    console.error('Reset PIN error:', err);
    return res.status(500).json({ error: 'Gagal mengatur ulang PIN' });
  }
});

}
