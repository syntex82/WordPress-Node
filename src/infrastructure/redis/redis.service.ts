/**
 * Redis Service
 * Core Redis connection and operations
 */

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  Logger,
  Optional,
} from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private readonly redisEnabled: boolean;

  constructor(@Optional() @Inject('REDIS_OPTIONS') private readonly options: RedisOptions | null) {
    // Check if Redis is actually configured (has a real host)
    this.redisEnabled =
      !!(options?.host && options.host !== 'localhost' && options.host !== '127.0.0.1') ||
      !!process.env.REDIS_HOST;
  }

  async onModuleInit() {
    // Skip connection if Redis is not configured
    if (!this.redisEnabled || !this.options) {
      this.logger.log('⏭️ Redis not configured - caching disabled (set REDIS_HOST to enable)');
      return;
    }

    try {
      this.client = new Redis({
        ...this.options,
        maxRetriesPerRequest: null, // Required by BullMQ
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed after 3 attempts, giving up');
            return null; // Stop retrying
          }
          return Math.min(times * 200, 1000);
        },
        reconnectOnError: () => false, // Don't auto-reconnect on errors
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('✅ Redis connected');
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          this.logger.warn(`Redis connection error: ${err.message}`);
        }
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      await this.client.ping();
    } catch (error) {
      this.logger.warn(`Redis not available, caching disabled: ${error.message}`);
      if (this.client) {
        this.client.disconnect();
      }
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('👋 Redis disconnected');
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      return await this.client!.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch {
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await this.client!.del(key);
      return true;
    } catch {
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;
    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        return await this.client!.del(...keys);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.isAvailable()) return 0;
    try {
      return await this.client!.incr(key);
    } catch {
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await this.client!.expire(key, seconds);
      return true;
    } catch {
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) return -1;
    try {
      return await this.client!.ttl(key);
    } catch {
      return -1;
    }
  }
}
