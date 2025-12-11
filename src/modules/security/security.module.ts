/**
 * Security Module
 * Provides comprehensive security features for the CMS
 */

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UsersModule } from '../users/users.module';

import { SecurityController } from './security.controller';

import { SecurityEventsService } from './services/security-events.service';
import { IpBlockService } from './services/ip-block.service';
import { TwoFactorService } from './services/two-factor.service';
import { FileIntegrityService } from './services/file-integrity.service';
import { SecurityCheckService } from './services/security-check.service';
import { RateLimitService } from './services/rate-limit.service';
import { SessionService } from './services/session.service';
import { PasswordPolicyService } from './services/password-policy.service';

import { IpBlockMiddleware } from './middleware/ip-block.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [SecurityController],
  providers: [
    SecurityEventsService,
    IpBlockService,
    TwoFactorService,
    FileIntegrityService,
    SecurityCheckService,
    RateLimitService,
    SessionService,
    PasswordPolicyService,
  ],
  exports: [
    SecurityEventsService,
    IpBlockService,
    TwoFactorService,
    RateLimitService,
    SessionService,
    PasswordPolicyService,
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply IP blocking middleware to all API routes
    consumer
      .apply(IpBlockMiddleware)
      .forRoutes('api/*');

    // Apply rate limiting middleware to all API routes
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('api/*');
  }
}

