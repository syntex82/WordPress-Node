/**
 * Main application entry point
 * Bootstraps the NestJS application with all necessary middleware and configuration
 * Optimized for horizontal scaling and production deployments
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
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
      if (!process.env[envVar] || process.env[envVar] === 'default-secret' ||
          process.env[envVar] === 'default-secret-change-in-production') {
        missingProduction.push(envVar);
      }
    }

    if (missingProduction.length > 0) {
      logger.error(`Production requires secure values for: ${missingProduction.join(', ')}`);
      logger.error('Generate secure secrets with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
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
    logger.warn('⚠️ SMTP not configured in .env - email features will be limited until configured via admin panel');
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

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              connectSrc: ["'self'", 'https://api.stripe.com'],
              frameSrc: [
                "'self'",
                'https://js.stripe.com',
                'https://www.youtube.com',
                'https://youtube.com',
                'https://www.youtube-nocookie.com',
                'https://player.vimeo.com',
                'https://www.openstreetmap.org',
                'https://maps.google.com',
                'https://www.google.com',
              ],
              mediaSrc: ["'self'", 'https:', 'blob:'],
            },
          }
        : false,
      frameguard: false, // Handled by custom middleware below
      hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );

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

  // Session middleware - uses in-memory store by default
  // For production with multiple instances, configure Redis session store
  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'wpnode.sid',
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
    },
  };

  // Note: For Redis session store, install connect-redis and configure:
  // if (process.env.REDIS_HOST) {
  //   const RedisStore = require('connect-redis').default;
  //   const Redis = require('ioredis');
  //   const redisClient = new Redis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT });
  //   sessionConfig.store = new RedisStore({ client: redisClient, prefix: 'session:' });
  // }

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

  // Serve static files with caching headers
  const staticOptions = isProduction ? { maxAge: '1y', etag: true, lastModified: true } : {};

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    ...staticOptions,
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

  // Built-in PWA routes (fallback if plugin not activated)
  const expressApp = app.getHttpAdapter().getInstance();

  // Manifest.json
  expressApp.get('/manifest.json', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.setHeader('Content-Type', 'application/manifest+json');
    res.json({
      name: 'WordPress Node',
      short_name: 'WP Node',
      description: 'Modern WordPress Node CMS',
      start_url: '/',
      display: 'standalone',
      orientation: 'any',
      theme_color: '#4f46e5',
      background_color: '#1e293b',
      icons: [
        { src: `${baseUrl}/pwa/icons/icon-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: `${baseUrl}/pwa/icons/icon-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    });
  });

  // Service Worker
  expressApp.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.send(`
      const CACHE = 'wp-node-v1';
      self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/offline'])).then(() => self.skipWaiting())));
      self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
      self.addEventListener('fetch', e => {
        if (e.request.method !== 'GET' || e.request.url.includes('/api/') || e.request.url.includes('/socket.io')) return;
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(c => c || caches.match('/offline'))));
      });
    `);
  });

  // Offline page
  expressApp.get('/offline', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1e293b;font-family:system-ui;color:#f1f5f9;text-align:center}h1{margin-bottom:1rem}button{background:#4f46e5;color:white;border:none;padding:.75rem 1.5rem;border-radius:8px;cursor:pointer}</style></head><body><div><h1>You're Offline</h1><p>Check your connection and try again.</p><br><button onclick="location.reload()">Retry</button></div></body></html>`);
  });

  // PWA Icons (SVG fallback)
  expressApp.get('/pwa/icons/:filename', (req, res) => {
    const match = req.params.filename.match(/(\d+)/);
    const size = match ? parseInt(match[1]) : 192;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#4f46e5" rx="${Math.round(size * 0.15)}"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-family="system-ui" font-weight="bold" font-size="${Math.round(size * 0.4)}">WN</text></svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  logger.log('✅ Built-in PWA routes registered');

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
    🚀 WordPress Node CMS is running!

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
