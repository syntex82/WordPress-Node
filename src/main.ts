/**
 * Main application entry point
 * Bootstraps the NestJS application with all necessary middleware and configuration
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development; configure properly in production
  }));

  // Cookie parser for session management
  app.use(cookieParser());

  // Session middleware for admin panel
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Vite default port
    credentials: true,
  });

  // Serve static files (uploads, admin build, themes)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useStaticAssets(join(__dirname, '..', 'admin', 'dist'), {
    prefix: '/admin/',
  });

  app.useStaticAssets(join(__dirname, '..', 'themes'), {
    prefix: '/themes/',
  });

  // Set view engine for theme rendering
  app.setBaseViewsDir(join(__dirname, '..', 'themes'));
  app.setViewEngine('hbs');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
    🚀 WordPress Node CMS is running!
    
    📍 Application: http://localhost:${port}
    📍 Admin Panel: http://localhost:${port}/admin
    📍 API: http://localhost:${port}/api
    
    Environment: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();

