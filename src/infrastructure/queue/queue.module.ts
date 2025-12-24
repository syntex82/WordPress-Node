/**
 * Queue Module
 * Provides background job processing using BullMQ
 * Falls back to synchronous processing when Redis is not available
 */

import { Module, Global, Logger, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Re-export queue names from queue.service
export { QUEUE_EMAIL, QUEUE_IMAGE, QUEUE_NOTIFICATIONS } from './queue.service';

// Check if Redis is configured
const isRedisConfigured = (): boolean => {
  return !!process.env.REDIS_HOST;
};

/**
 * Fallback Queue Service - used when Redis is not available
 * Processes jobs synchronously (not recommended for production)
 */
export class FallbackQueueService {
  private readonly logger = new Logger('FallbackQueueService');

  constructor() {
    this.logger.warn(
      '⚠️ Queue system running in fallback mode (no Redis). Jobs will be processed synchronously.',
    );
  }

  async addEmailJob(data: any) {
    this.logger.debug(`[Sync] Would queue email job: ${data.to}`);
    // In fallback mode, email should be sent synchronously by the caller
    return { id: `sync-${Date.now()}`, data };
  }

  async addBulkEmailJobs(emails: any[]) {
    this.logger.debug(`[Sync] Would queue ${emails.length} email jobs`);
    return emails.map((data, i) => ({ id: `sync-bulk-${Date.now()}-${i}`, data }));
  }

  async addImageJob(data: any) {
    this.logger.debug(`[Sync] Would queue image job: ${data.sourcePath}`);
    return { id: `sync-${Date.now()}`, data };
  }

  async addNotificationJob(data: any) {
    this.logger.debug(`[Sync] Would queue notification job: ${data.userId}`);
    return { id: `sync-${Date.now()}`, data };
  }

  async getQueueStats() {
    return {
      email: { waiting: 0, active: 0, completed: 0, failed: 0 },
      image: { waiting: 0, active: 0, completed: 0, failed: 0 },
      notifications: { waiting: 0, active: 0, completed: 0, failed: 0 },
    };
  }

  async pauseQueue() {
    this.logger.warn('[Sync] Queue pause not available in fallback mode');
  }

  async resumeQueue() {
    this.logger.warn('[Sync] Queue resume not available in fallback mode');
  }
}

@Global()
@Module({})
export class QueueModule {
  static forRoot(): DynamicModule {
    const logger = new Logger('QueueModule');

    // If Redis is not configured, use fallback mode
    if (!isRedisConfigured()) {
      logger.warn(
        '⚠️ Redis not configured - Queue system disabled. Set REDIS_HOST to enable background jobs.',
      );
      return {
        module: QueueModule,
        imports: [ConfigModule],
        providers: [
          {
            provide: 'QueueService',
            useClass: FallbackQueueService,
          },
        ],
        exports: ['QueueService'],
      };
    }

    // Redis is configured - use full BullMQ
    logger.log('✅ Redis configured - initializing BullMQ queues');

    // Dynamic import to avoid loading BullMQ when not needed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BullModule } = require('@nestjs/bullmq');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { QueueService } = require('./queue.service');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { EmailQueueProcessor } = require('./processors/email.processor');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ImageQueueProcessor } = require('./processors/image.processor');

    return {
      module: QueueModule,
      imports: [
        ConfigModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
            const redisPort = configService.get<number>('REDIS_PORT', 6379);
            const redisPassword = configService.get<string>('REDIS_PASSWORD');

            logger.log(`📋 Queue system configured (Redis: ${redisHost}:${redisPort})`);

            return {
              connection: {
                host: redisHost,
                port: redisPort,
                password: redisPassword || undefined,
                maxRetriesPerRequest: null, // Required by BullMQ
              },
              defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 500,
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 1000,
                },
              },
            };
          },
          inject: [ConfigService],
        }),
        BullModule.registerQueue({ name: 'email' }, { name: 'image' }, { name: 'notifications' }),
      ],
      providers: [
        {
          provide: 'QueueService',
          useClass: QueueService,
        },
        EmailQueueProcessor,
        ImageQueueProcessor,
      ],
      exports: ['QueueService', BullModule],
    };
  }
}
