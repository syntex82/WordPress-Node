/**
 * Redis Module
 * Provides Redis connection for caching, sessions, and job queues
 * Gracefully disabled when REDIS_HOST is not configured
 */

import { Global, Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';

const logger = new Logger('RedisModule');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_OPTIONS',
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');

        // If REDIS_HOST is not set, return null to disable Redis
        if (!host) {
          return null;
        }

        logger.log(`🔴 Redis configured: ${host}:${configService.get<number>('REDIS_PORT', 6379)}`);

        return {
          host,
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
          keyPrefix: configService.get<string>('REDIS_PREFIX', 'wpnode:'),
          maxRetriesPerRequest: null, // Required by BullMQ
          lazyConnect: true,
          enableReadyCheck: true,
        };
      },
      inject: [ConfigService],
    },
    RedisService,
    CacheService,
  ],
  exports: [RedisService, CacheService, 'REDIS_OPTIONS'],
})
export class RedisModule {}
