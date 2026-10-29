import express from 'express';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './src/db/index';
import { installRobloxFetchFailover } from './src/lib/roblox';
import { registerRobloxRoutes } from './src/routes/roblox';
import { registerAccountRoutes } from './src/routes/account';
import { registerOAuthRoutes } from './src/routes/oauth';
import { registerCatalogRoutes } from './src/routes/catalog';
import { registerUserRoutes } from './src/routes/user';
import { registerSocialRoutes } from './src/routes/social';

/**
 * Composition root: middleware, static hosting and route registration.
 * Route handlers live in src/routes/*, shared helpers in src/lib/*.
 */

const app = express();
const PORT = 3000;

installRobloxFetchFailover();

// Security Hardening (Pilar 2 OWASP Top 10): Hide Express banner
app.disable('x-powered-by');

// Anti-DoS Payload Limitation
app.use(express.json({ limit: '1mb' }));

// Hardened HTTP Security Headers — dev/local fallback only.
// In production Vercel applies the authoritative set from vercel.json at the
// edge; setting a second, different CSP here would only confuse browsers.
if (!process.env.VERCEL) {
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.roblox.com https://*.rbxcdn.com; " +
      "connect-src 'self' https://apis.roblox.com https://apis.roproxy.com https://avatar.roblox.com https://friends.roblox.com https://friends.roproxy.com https://games.roblox.com https://games.roproxy.com https://thumbnails.roblox.com https://thumbnails.roproxy.com https://users.roblox.com https://users.roproxy.com https://www.roblox.com https://*.rbxcdn.com https://*.roproxy.com; " +
      "media-src 'self' https:; worker-src 'self' blob:; manifest-src 'self'; frame-src 'none'; upgrade-insecure-requests"
    );
    next();
  });
}

// Auto-initialize DB on first request & preserve URL path in Vercel serverless rewrites
let isDbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

app.use(async (req, res, next) => {
  // In Vercel serverless rewrites, ensure req.url preserves the actual requested API path
  const rawUrl = req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'] || (req as any).originalUrl;
  if (typeof rawUrl === 'string' && rawUrl.startsWith('/api')) {
    req.url = rawUrl;
  }

  if (!isDbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDatabase()
        .then(() => {
          isDbInitialized = true;
        })
        .catch(err => {
          console.error('[Database Init Error]:', err);
          isDbInitialized = true;
        });
    }
    await dbInitPromise;
  }
  next();
});


// Favicon handler
app.get('/favicon.ico', (req, res) => {
  const iconPath = path.join(process.cwd(), 'public/favicon.svg');
  if (fs.existsSync(iconPath)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.sendFile(iconPath);
  }
  return res.status(404).end();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Bloxboxd API' });
});

registerRobloxRoutes(app);
registerOAuthRoutes(app);
registerAccountRoutes(app);
registerCatalogRoutes(app);
registerUserRoutes(app);
registerSocialRoutes(app);

async function startServer() {
  try {
    await initDatabase();
  } catch (err) {
    console.error('Database initialization failed:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Caching Strategy (Pilar 1): Vite-hashed bundle assets are cached 1 year (immutable)
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));
    app.use(express.static(distPath, {
      maxAge: '1h',
    }));
    app.get('*', (req, res) => {
      // index.html must revalidate to always serve the latest bundle
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bloxboxd server listening on port ${PORT}`);
  });
}

// Start HTTP listener only when running as standalone server (not in Vercel serverless environment)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
