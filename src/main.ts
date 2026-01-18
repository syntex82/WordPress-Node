/**
 * Main application entry point
 * Bootstraps the NestJS application with all necessary middleware and configuration
 * Optimized for horizontal scaling and production deployments
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import Redis from 'ioredis';

// connect-redis exports differently in different versions
const RedisStore = (connectRedis as any).default || connectRedis;
import * as jwt from 'jsonwebtoken';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Validate required environment variables
 * Returns warnings for missing optional variables
 */
function validateEnvironment(logger: Logger): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Required in all environments
  const requiredVars = ['DATABASE_URL'];
  const missingRequired: string[] = [];

  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      missingRequired.push(envVar);
    }
  }

  if (missingRequired.length > 0) {
    logger.error(`Missing required environment variables: ${missingRequired.join(', ')}`);
    logger.error('Please configure these variables in your .env file or environment');
    process.exit(1);
  }

  // Required in production
  if (isProduction) {
    const productionRequired = ['JWT_SECRET', 'ENCRYPTION_KEY', 'SESSION_SECRET'];
    const missingProduction: string[] = [];

    for (const envVar of productionRequired) {
      if (
        !process.env[envVar] ||
        process.env[envVar] === 'default-secret' ||
        process.env[envVar] === 'default-secret-change-in-production'
      ) {
        missingProduction.push(envVar);
      }
    }

    if (missingProduction.length > 0) {
      logger.error(`Production requires secure values for: ${missingProduction.join(', ')}`);
      logger.error(
        "Generate secure secrets with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
      process.exit(1);
    }
  }

  // Warnings for optional but recommended variables
  const recommendedVars = [
    { name: 'JWT_SECRET', default: 'your-super-secret-jwt-key' },
    { name: 'ENCRYPTION_KEY', default: 'default-encryption-key-32chars!!' },
    { name: 'SESSION_SECRET', default: 'default-secret-change-in-production' },
  ];

  for (const { name, default: defaultVal } of recommendedVars) {
    if (!process.env[name] || process.env[name] === defaultVal) {
      logger.warn(`⚠️ ${name} is using default value - configure a secure value for production`);
    }
  }

  // SMTP configuration check
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.warn(
      '⚠️ SMTP not configured in .env - email features will be limited until configured via admin panel',
    );
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate environment before starting
  validateEnvironment(logger);

  const isProduction = process.env.NODE_ENV === 'production';
  const instanceId = process.env.INSTANCE_ID || `instance-${process.pid}`;

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProduction ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug'],
    rawBody: true, // Required for Stripe webhook signature verification
  });

  // Enable trust proxy for load balancer setups (required for rate limiting, IP detection)
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' || 1);

  // Response compression (gzip/brotli)
  if (process.env.ENABLE_COMPRESSION !== 'false') {
    app.use(
      compression({
        threshold: 1024, // Only compress responses > 1KB
        level: 6, // Compression level (1-9, 6 is balanced)
        filter: (req, res) => {
          // Don't compress if client doesn't support it
          if (req.headers['x-no-compression']) return false;
          return compression.filter(req, res);
        },
      }),
    );
  }

  // Security middleware with Helmet
  // Note: 'unsafe-inline' is required for Stripe and theme customization
  // 'unsafe-eval' is needed for Tailwind CDN in dev mode
  const cspDirectives = {
    defaultSrc: ["'self'"],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for inline styles and Tailwind
      'https://fonts.googleapis.com',
      'https://cdn.tailwindcss.com',
    ],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Stripe.js integration
      'https://js.stripe.com',
      'https://cdn.tailwindcss.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://googleads.g.doubleclick.net',
      'https://www.googleadservices.com',
      // Development: allow eval for hot module replacement
      ...(isProduction ? [] : ["'unsafe-eval'"]),
    ],
    scriptSrcAttr: ["'unsafe-inline'"], // Required for inline event handlers
    connectSrc: [
      "'self'",
      'https://api.stripe.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://js.stripe.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://www.google.com',
      'https://google.com',
      'https://stats.g.doubleclick.net',
      'wss:',
      'ws:',
    ],
    frameSrc: [
      "'self'",
      'https://js.stripe.com',
      'https://www.youtube.com',
      'https://youtube.com',
      'https://www.youtube-nocookie.com',
      'https://www.googletagmanager.com',
      'https://player.vimeo.com',
      'https://www.openstreetmap.org',
      'https://maps.google.com',
      'https://www.google.com',
    ],
    mediaSrc: ["'self'", 'https:', 'blob:'],
    objectSrc: ["'none'"],          // Block plugins like Flash
    baseUri: ["'self'"],            // Restrict base tag
    formAction: ["'self'"],         // Restrict form submissions
    ...(isProduction ? { upgradeInsecureRequests: [] } : {}), // Only upgrade in production
  };

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: cspDirectives,
      },
      // frameguard is enabled with SAMEORIGIN - handled by custom middleware for more control
      frameguard: { action: 'sameorigin' },
      // HSTS enabled in all environments for security (short duration in dev)
      hsts: {
        maxAge: isProduction ? 31536000 : 86400, // 1 year in prod, 1 day in dev
        includeSubDomains: true,
        preload: isProduction,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // COEP set to require-corp with reporting for debugging
      crossOriginEmbedderPolicy: { policy: 'credentialless' as any },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: { allow: false }, // Disable DNS prefetching for privacy
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      xssFilter: true,
    }),
  );

  // Permissions Policy for camera and microphone access (required for video calls)
  app.use((req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(self), microphone=(self), geolocation=(self), fullscreen=*',
    );
    next();
  });

  // Secure iframe embedding for Theme Customizer
  const jwtSecret = process.env.JWT_SECRET || 'default-secret';
  app.use((req, res, next) => {
    const previewToken = req.query._preview_token as string;

    if (previewToken) {
      try {
        const decoded = jwt.verify(previewToken, jwtSecret) as jwt.JwtPayload;
        if (decoded && decoded.preview === true) {
          const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            process.env.APP_URL,
          ].filter(Boolean);
          res.setHeader(
            'Content-Security-Policy',
            `frame-ancestors 'self' ${allowedOrigins.join(' ')}`,
          );
          return next();
        }
      } catch (_e) {
        // Invalid token - fall through
      }
    }
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // Add instance ID header for debugging in multi-instance setups
  app.use((req, res, next) => {
    res.setHeader('X-Instance-ID', instanceId);
    next();
  });

  // Cookie parser for session management
  app.use(cookieParser());

  // Session middleware - uses Redis for production-ready session storage
  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'NodePress.sid',
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
    },
  };

  // Configure Redis session store if Redis is available
  if (process.env.REDIS_HOST) {
    try {
      const redisClient = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
      });

      // Test Redis connection with ping
      await redisClient.ping();
      logger.log('🔴 Redis session store connected successfully');

      sessionConfig.store = new RedisStore({
        client: redisClient,
        prefix: 'NodePress:session:',
        ttl: 60 * 60 * 24 * 7, // 7 days in seconds
      });
    } catch (error) {
      logger.warn('⚠️  Redis connection failed, falling back to MemoryStore');
      logger.warn('   For production use, please configure Redis properly');
      logger.warn(`   Error: ${error.message}`);
    }
  } else {
    logger.warn('⚠️  REDIS_HOST not configured, using MemoryStore for sessions');
    logger.warn('   This is not recommended for production or multi-instance deployments');
    logger.warn('   Please configure Redis in your .env file');
  }

  app.use(session(sessionConfig));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Ensure required directories exist
  const requiredDirs = [
    join(process.cwd(), 'uploads'),
    join(process.cwd(), 'uploads', 'messages'),
    join(process.cwd(), 'uploads', 'media'),
    join(process.cwd(), 'uploads', 'groups'),
    join(process.cwd(), 'uploads', 'responsive'), // For optimized responsive images
    join(process.cwd(), 'public'),
  ];
  for (const dir of requiredDirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.log(`📁 Created directory: ${dir}`);
    }
  }

  // Serve static files with caching headers (1 year for immutable assets)
  const staticOptions = isProduction
    ? { maxAge: '1y', etag: true, lastModified: true, immutable: true }
    : {};

  // Serve public folder at root (for PWA files: manifest.json, sw.js, offline.html)
  app.useStaticAssets(join(process.cwd(), 'public'), {
    ...staticOptions,
    maxAge: '1d', // PWA files should refresh more often
    immutable: false,
  });

  // Uploads with long cache (images are immutable once uploaded)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    ...staticOptions,
    setHeaders: (res) => {
      res.setHeader('Vary', 'Accept'); // For WebP content negotiation
    },
  });

  app.useStaticAssets(join(process.cwd(), 'admin', 'dist'), {
    prefix: '/admin/',
    ...staticOptions,
    index: false, // Don't serve index.html automatically
  });

  app.useStaticAssets(join(process.cwd(), 'themes'), {
    prefix: '/themes/',
    ...staticOptions,
  });

  // Serve plugin static files (e.g., analytics tracker.js)
  app.useStaticAssets(join(process.cwd(), 'plugins'), {
    prefix: '/api/plugins/',
    ...staticOptions,
  });

  // Set view engine
  app.setBaseViewsDir(join(process.cwd(), 'themes'));
  app.setViewEngine('hbs');

  // Register plugin routes with Express app
  try {
    const { PluginLoaderService } = await import('./modules/plugins/plugin-loader.service');
    const pluginLoader = app.get(PluginLoaderService);
    pluginLoader.setExpressApp(app.getHttpAdapter().getInstance());
    logger.log('✅ Plugin routes registered with Express');
  } catch (error) {
    logger.warn('⚠️ Could not register plugin routes:', error);
  }

  // Built-in PWA routes (under /api/ so nginx proxies them)
  const expressApp = app.getHttpAdapter().getInstance();

  // Helper function to generate PWA manifest
  // Note: Camera/microphone permissions are handled via Permissions-Policy HTTP header
  // and must be requested at runtime via navigator.mediaDevices.getUserMedia()
  // The permissions_policy field is informational for Android WebView / TWA apps
  const generateManifest = (_req: any) => ({
    id: '/',
    name: 'NodePress',
    short_name: 'NodePress',
    description:
      'Modern CMS platform with courses, e-commerce, messaging, and real-time collaboration',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    theme_color: '#4f46e5',
    background_color: '#0f172a',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/api/pwa/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/api/pwa/icons/icon-192-maskable.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/api/pwa/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/api/pwa/icons/icon-512-maskable.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    prefer_related_applications: false,
    shortcuts: [
      {
        name: 'Courses',
        short_name: 'Courses',
        url: '/courses',
        icons: [{ src: '/api/pwa/icons/icon-96.svg', sizes: '96x96' }],
      },
      {
        name: 'Messages',
        short_name: 'Messages',
        url: '/admin/messages',
        icons: [{ src: '/api/pwa/icons/icon-96.svg', sizes: '96x96' }],
      },
    ],
  });

  // Helper function to generate service worker code
  // v4: Minimal interception - only cache static assets, never intercept navigation
  const generateServiceWorker = () => `
const CACHE = 'wp-node-v4';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (e.request.mode === 'navigate') return;
  if (url.pathname.startsWith('/admin')) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.includes('/socket.io')) return;
  if (url.pathname.includes('/messages')) return;
  if (url.pathname.includes('/lms')) return;
  if (url.pathname.includes('/courses')) return;
  if (url.pathname.includes('/shop')) return;
  if (url.origin !== self.location.origin) return;
  const isStatic = url.pathname.match(/\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/);
  if (!isStatic) return;
  e.respondWith(fetch(e.request).then(r => { if (r.status === 200) { const c = r.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});
`;

  // Helper function to generate offline page
  const generateOfflinePage = () =>
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1e293b;font-family:system-ui;color:#f1f5f9;text-align:center}h1{margin-bottom:1rem}button{background:#4f46e5;color:white;border:none;padding:.75rem 1.5rem;border-radius:8px;cursor:pointer}</style></head><body><div><h1>You're Offline</h1><p>Check your connection and try again.</p><br><button onclick="location.reload()">Retry</button></div></body></html>`;

  // PWA routes under /api/pwa/ (guaranteed to be proxied by nginx)
  expressApp.get('/api/pwa/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.json(generateManifest(req));
  });

  expressApp.get('/api/pwa/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.send(generateServiceWorker());
  });

  expressApp.get('/api/pwa/offline', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateOfflinePage());
  });

  // Also serve at root level (for servers that don't have nginx interference)
  expressApp.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.json(generateManifest(req));
  });

  expressApp.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.send(generateServiceWorker());
  });

  expressApp.get('/offline', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateOfflinePage());
  });

  // PWA Icons - serve from public/pwa/icons folder
  expressApp.get('/api/pwa/icons/:filename', (req, res) => {
    const filename = req.params.filename;
    const iconPath = join(process.cwd(), 'public', 'pwa', 'icons', filename);
    if (existsSync(iconPath)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(iconPath);
    } else {
      // Fallback to generated icon
      const match = filename.match(/(\d+)/);
      const size = match ? parseInt(match[1]) : 192;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#1a2332" rx="${Math.round(size * 0.15)}"/><polygon points="${size / 2},${size * 0.15} ${size * 0.78},${size * 0.3} ${size * 0.78},${size * 0.7} ${size / 2},${size * 0.85} ${size * 0.22},${size * 0.7} ${size * 0.22},${size * 0.3}" fill="none" stroke="#2dd4bf" stroke-width="${Math.round(size * 0.02)}"/><text x="50%" y="45%" dominant-baseline="central" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="${Math.round(size * 0.15)}">WP</text><text x="50%" y="62%" dominant-baseline="central" text-anchor="middle" fill="#2dd4bf" font-family="Arial" font-weight="bold" font-size="${Math.round(size * 0.1)}">NODE</text></svg>`,
      );
    }
  });

  // Favicon
  expressApp.get('/api/pwa/favicon.svg', (req, res) => {
    const faviconPath = join(process.cwd(), 'public', 'favicon.svg');
    if (existsSync(faviconPath)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(faviconPath);
    } else {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a2332"/><polygon points="16,5 26,10 26,22 16,27 6,22 6,10" fill="none" stroke="#2dd4bf" stroke-width="1.5"/><text x="16" y="18" font-family="Arial" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">WP</text></svg>`,
      );
    }
  });

  // Also serve icons at old path for backward compatibility
  expressApp.get('/pwa/icons/:filename', (req, res) => {
    const filename = req.params.filename;
    const iconPath = join(process.cwd(), 'public', 'pwa', 'icons', filename);
    if (existsSync(iconPath)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.sendFile(iconPath);
    } else {
      const match = filename.match(/(\d+)/);
      const size = match ? parseInt(match[1]) : 192;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#1a2332" rx="${Math.round(size * 0.15)}"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#2dd4bf" font-family="Arial" font-weight="bold" font-size="${Math.round(size * 0.3)}">WP</text></svg>`,
      );
    }
  });

  logger.log('✅ Built-in PWA routes registered');

  // SEO routes at root level (preferred by search engines)
  // Import SeoService dynamically
  let seoService: any = null;
  try {
    const { SeoService } = await import('./modules/seo/seo.service');
    seoService = app.get(SeoService);
    logger.log('✅ SeoService loaded for root SEO routes');
  } catch (e) {
    logger.warn('⚠️ SeoService not available for root SEO routes');
  }

  // robots.txt - generates dynamically from SEO settings
  expressApp.get('/robots.txt', async (req, res) => {
    const baseUrl = process.env.SITE_URL || `http://localhost:${port}`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    if (seoService) {
      try {
        const robotsTxt = await seoService.generateRobotsTxt(baseUrl);
        return res.send(robotsTxt);
      } catch (e) {
        logger.warn('robots.txt generation failed:', e);
      }
    }

    // Fallback
    res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: ${baseUrl}/sitemap.xml`);
  });

  // sitemap.xml - generates dynamically from content
  expressApp.get('/sitemap.xml', async (req, res) => {
    const baseUrl = process.env.SITE_URL || `http://localhost:${port}`;
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    if (seoService) {
      try {
        const sitemapXml = await seoService.generateSitemap(baseUrl);
        return res.send(sitemapXml);
      } catch (error) {
        logger.warn('Sitemap generation failed:', error);
      }
    }

    // Fallback minimal sitemap
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}</loc><priority>1.0</priority></url>
</urlset>`);
  });

  logger.log('✅ SEO routes registered (robots.txt, sitemap.xml)');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);
    await app.close();
    logger.log('Application closed gracefully');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  logger.log(`
    🚀 NodePress CMS is running!

    📍 Application: http://localhost:${port}
    📍 Admin Panel: http://localhost:${port}/admin
    📍 API: http://localhost:${port}/api
    📍 Health: http://localhost:${port}/health

    🏷️  Instance: ${instanceId}
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    💾 Storage: ${process.env.STORAGE_PROVIDER || 'local'}
    📦 Compression: ${process.env.ENABLE_COMPRESSION !== 'false' ? 'enabled' : 'disabled'}
  `);
}

bootstrap();
