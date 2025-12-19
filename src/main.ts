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

async function bootstrap() {
  const logger = new Logger('Bootstrap');
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
              frameSrc: ["'self'", 'https://js.stripe.com'],
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
