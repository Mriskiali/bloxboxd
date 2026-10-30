import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import {
  saveAccount,
  getUserProfile,
  upsertUserProfile,
  createSession,
  recordLoginEvent
} from '../db/index';
import { setSessionCookie, parseCookies } from '../lib/auth';
import { escapeHtml, safeJsonForScript } from '../lib/security';

const OAUTH_COOKIE = 'roblox_oauth_state';

function getRedirectUri(req: Request): string {
  if (process.env.ROBLOX_REDIRECT_URI) {
    return process.env.ROBLOX_REDIRECT_URI;
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || (host.toString().includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}/api/auth/roblox/callback`;
}

export function registerOAuthRoutes(app: Express): void {
  // Check if Roblox OAuth is configured
  app.get('/api/auth/roblox/status', (req, res) => {
    const configured = Boolean(process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET);
    res.json({ configured });
  });

  // Start Roblox OAuth 2.0 PKCE flow
  app.get('/api/auth/roblox/login', (req, res) => {
    const clientId = process.env.ROBLOX_CLIENT_ID;
    if (!clientId) {
      return res.status(500).send(`
        <html>
          <body style="background:#14181c;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
            <h2>Roblox OAuth 2.0 Belum Dikonfigurasi</h2>
            <p style="color:#9ab;">Harap tambahkan environment variable <code>ROBLOX_CLIENT_ID</code> dan <code>ROBLOX_CLIENT_SECRET</code> di .env atau dashboard hosting.</p>
            <p><a href="/" style="color:#00e054;">Kembali ke Bloxboxd</a></p>
          </body>
        </html>
      `);
    }

    const state = crypto.randomBytes(16).toString('hex');
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const redirectUri = getRedirectUri(req);

    // Save state + verifier in short-lived httpOnly cookie (10 mins)
    const cookiePayload = JSON.stringify({ state, verifier, redirectUri });
    res.cookie(OAUTH_COOKIE, Buffer.from(cookiePayload).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000
    });

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });

    res.redirect(`https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`);
  });

  // Handle Roblox OAuth 2.0 callback
  app.get('/api/auth/roblox/callback', async (req: Request, res: Response) => {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.status(400).send(`
        <html>
          <body style="background:#14181c;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
            <h2>Login Roblox Dibatalkan atau Gagal</h2>
            <p style="color:#ff6b6b;">${escapeHtml(error_description || error)}</p>
            <p><a href="/" style="color:#00e054;">Kembali ke Beranda</a></p>
          </body>
        </html>
      `);
    }

    if (!code || !state) {
      return res.status(400).send('Parameter code atau state tidak ditemukan.');
    }

    // Retrieve state & verifier from cookie
    const cookies = parseCookies(req.headers.cookie);
    const rawStateCookie = cookies[OAUTH_COOKIE];
    if (!rawStateCookie) {
      return res.status(400).send('Sesi otentikasi telah kedaluwarsa. Silakan coba login kembali.');
    }

    let storedState: string;
    let storedVerifier: string;
    let storedRedirectUri: string;
    try {
      const parsed = JSON.parse(Buffer.from(rawStateCookie, 'base64').toString('utf-8'));
      storedState = parsed.state;
      storedVerifier = parsed.verifier;
      storedRedirectUri = parsed.redirectUri;
    } catch {
      return res.status(400).send('Format sesi OAuth tidak valid.');
    }

    if (storedState !== state) {
      return res.status(403).send('Validasi anti-CSRF state gagal.');
    }

    const clientId = process.env.ROBLOX_CLIENT_ID;
    const clientSecret = process.env.ROBLOX_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).send('Server OAuth credentials missing.');
    }

    try {
      // 1. Exchange code for access token via HTTP Basic Auth
      const tokenBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        code_verifier: storedVerifier,
        redirect_uri: storedRedirectUri || getRedirectUri(req)
      });

      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const tokenRes = await fetch('https://apis.roblox.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`
        },
        body: tokenBody.toString()
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error('[OAuth] Token exchange failed:', errText);
        return res.status(502).send('Gagal menukarkan token dengan server Roblox: ' + escapeHtml(errText));
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // 2. Fetch Roblox Userinfo
      const userInfoRes = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!userInfoRes.ok) {
        return res.status(502).send('Gagal memuat profil user dari Roblox API.');
      }

      const userInfo = await userInfoRes.json();
      const userId = Number(userInfo.sub);
      const username = userInfo.preferred_username || userInfo.name || `User_${userId}`;
      const displayName = userInfo.nickname || userInfo.name || username;
      const avatarUrl = userInfo.picture || '';

      // 3. Save account & profile in DB
      await saveAccount({
        userId,
        username,
        verifiedAt: new Date().toISOString()
      });

      const profileId = `user-roblox-${userId}`;
      const existingProfile = await getUserProfile(profileId);
      if (!existingProfile) {
        await upsertUserProfile({
          id: profileId,
          robloxUserId: userId,
          username,
          handle: `@${username}`,
          displayName,
          avatarUrl,
          joinedDate: new Date().toISOString()
        });
      } else if (avatarUrl && !existingProfile.avatarUrl) {
        await upsertUserProfile({
          ...existingProfile,
          avatarUrl,
          displayName: displayName || existingProfile.displayName
        });
      }

      // 4. Create session & cookie
      const sessionToken = await createSession(userId);
      setSessionCookie(res, sessionToken);
      res.clearCookie(OAUTH_COOKIE, { path: '/' });

      void recordLoginEvent({
        userId,
        event: 'roblox_oauth_success',
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      const clientUserData = {
        id: profileId,
        robloxUserId: userId,
        robloxUsername: username,
        username,
        displayName,
        handle: `@${username}`,
        avatarUrl,
        isRobloxVerified: true,
        sessionToken
      };

      // 5. Send lightweight HTML to set localStorage and broadcast auth success
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Login Berhasil - Bloxboxd</title>
          <style>
            body { 
              background: #14181c; 
              color: #fff; 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              text-align: center;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background: #1c2228;
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 6px;
              padding: 28px 24px;
              max-width: 380px;
              width: 100%;
              box-shadow: 0 12px 32px rgba(0,0,0,0.6);
            }
            .spinner { 
              border: 3px solid rgba(255,255,255,0.1); 
              border-top-color: #00e054; 
              border-radius: 50%; 
              width: 32px; 
              height: 32px; 
              animation: spin 0.8s linear infinite; 
              margin: 0 auto 16px; 
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            h3 { margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #fff; }
            p { margin: 0 0 16px; font-size: 13px; color: #9ab; line-height: 1.4; }
            button {
              display: none;
              background: #00e054;
              color: #000;
              border: none;
              border-radius: 4px;
              padding: 10px 20px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
            }
            button:hover { background: #00c94b; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner" id="spinner"></div>
            <h3 id="title">Login Berhasil!</h3>
            <p id="msg">Menghubungkan akun Roblox kamu ke Bloxboxd...</p>
            <button id="closeBtn" onclick="window.close(); window.location.href='/';">Tutup Jendela</button>
          </div>
          <script>
            const user = ${safeJsonForScript(clientUserData)};
            
            // 1. Sync directly to localStorage
            try {
              localStorage.setItem('bloxboxd_user', JSON.stringify(user));
              localStorage.setItem('bloxboxd_oauth_event', JSON.stringify({ user, t: Date.now() }));
            } catch (e) {
              console.error(e);
            }

            // 2. Broadcast via BroadcastChannel (works across all tabs/windows on domain)
            try {
              if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('bloxboxd_auth');
                bc.postMessage({ type: 'BLOXBOXD_AUTH_SUCCESS', user: user });
                bc.close();
              }
            } catch (e) {
              console.error(e);
            }

            // 3. Post message to window.opener if accessible
            try {
              if (window.opener && window.opener !== window) {
                window.opener.postMessage({ type: 'BLOXBOXD_AUTH_SUCCESS', user: user }, '*');
              }
            } catch (e) {
              console.error(e);
            }

            // 4. Close popup
            try {
              window.close();
            } catch (e) {}

            // 5. Fallback if browser prevents auto-close
            setTimeout(function() {
              if (!window.closed) {
                if (window.opener || window.outerWidth < 800) {
                  document.getElementById('spinner').style.display = 'none';
                  document.getElementById('msg').innerText = 'Autentikasi selesai. Kamu bisa menutup jendela ini.';
                  document.getElementById('closeBtn').style.display = 'inline-block';
                } else {
                  window.location.href = '/';
                }
              }
            }, 350);
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error('[OAuth Callback Error]:', err);
      return res.status(500).send('Terjadi kesalahan internal saat memproses autentikasi.');
    }
  });
}
