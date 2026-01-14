/**
 * Rate Limiting Service
 * Manages rate limiting configuration and violations
 * Supports both in-memory (single instance) and Redis (multi-instance) storage
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SecurityEventsService } from './security-events.service';
import { IpBlockService } from './ip-block.service';
import { BlockIpDto } from '../dto/security.dto';
import { RedisService } from '../../../infrastructure/redis/redis.service';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  // In-memory fallback store for rate limiting (IP -> endpoint -> requests[])
  private requestStore = new Map<string, Map<string, number[]>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private securityEvents: SecurityEventsService,
    private ipBlock: IpBlockService,
    @Optional() private redis?: RedisService,
  ) {
    // Clean up old requests every minute (only needed for in-memory store)
    this.cleanupInterval = setInterval(() => this.cleanupOldRequests(), 60000);
  }

  /**
   * Check if request should be rate limited
   * Uses Redis if available, falls back to in-memory store
   */
  async checkRateLimit(
    ip: string,
    endpoint: string,
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    // Get rate limit config for this endpoint
    const config = await this.getConfig(endpoint);
    if (!config || !config.enabled) {
      return { allowed: true };
    }

    // Use Redis if available for distributed rate limiting
    if (this.redis?.isAvailable()) {
      return this.checkRateLimitRedis(ip, endpoint, config);
    }

    // Fall back to in-memory store
    return this.checkRateLimitMemory(ip, endpoint, config);
  }

  /**
   * Redis-based rate limiting using sliding window
   */
  private async checkRateLimitRedis(
    ip: string,
    endpoint: string,
    config: { windowMs: number; maxRequests: number; blockDuration?: number | null },
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `ratelimit:${ip}:${endpoint}`;
    const windowSeconds = Math.ceil(config.windowMs / 1000);

    try {
      const count = await this.redis!.incr(key);

      // Set expiry on first request
      if (count === 1) {
        await this.redis!.expire(key, windowSeconds);
      }

      if (count > config.maxRequests) {
        // Log violation
        await this.logViolation(ip, endpoint, count, config.maxRequests);

        // NOTE: Auto-blocking disabled - too aggressive for normal use
        // Admins can still manually block IPs via the security panel
        // if (config.blockDuration) {
        //   const blockData: BlockIpDto = {
        //     ip,
        //     reason: `Rate limit exceeded on ${endpoint}`,
        //     expiresAt: new Date(Date.now() + config.blockDuration * 60000).toISOString(),
        //   };
        //   await this.ipBlock.blockIp(blockData);
        // }

        const ttl = await this.redis!.ttl(key);
        return { allowed: false, retryAfter: ttl > 0 ? ttl : windowSeconds };
      }

      return { allowed: true };
    } catch (error) {
      this.logger.warn(`Redis rate limit check failed, falling back to memory: ${error.message}`);
      return this.checkRateLimitMemory(ip, endpoint, config);
    }
  }

  /**
   * In-memory rate limiting (single instance only)
   */
  private async checkRateLimitMemory(
    ip: string,
    endpoint: string,
    config: { windowMs: number; maxRequests: number; blockDuration?: number | null },
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    // Get or create request history for this IP and endpoint
    if (!this.requestStore.has(ip)) {
      this.requestStore.set(ip, new Map());
    }
    const ipStore = this.requestStore.get(ip)!;

    if (!ipStore.has(endpoint)) {
      ipStore.set(endpoint, []);
    }
    const requests = ipStore.get(endpoint)!;

    // Add current request timestamp
    const now = Date.now();
    requests.push(now);

    // Remove requests outside the time window
    const windowStart = now - config.windowMs;
    const recentRequests = requests.filter((time) => time > windowStart);
    ipStore.set(endpoint, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length > config.maxRequests) {
      // Log violation
      await this.logViolation(ip, endpoint, recentRequests.length, config.maxRequests);

      // NOTE: Auto-blocking disabled - too aggressive for normal use
      // Admins can still manually block IPs via the security panel
      // if (config.blockDuration) {
      //   const blockData: BlockIpDto = {
      //     ip,
      //     reason: `Rate limit exceeded on ${endpoint}`,
      //     expiresAt: new Date(Date.now() + config.blockDuration * 60000).toISOString(),
      //   };
      //   await this.ipBlock.blockIp(blockData);
      // }

      const retryAfter = Math.ceil(config.windowMs / 1000);
      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  }

  /**
   * Get rate limit configuration for endpoint
   */
  async getConfig(endpoint: string) {
    // Try to get specific endpoint config
    let config = await this.prisma.rateLimitConfig.findUnique({
      where: { endpoint },
    });

    // Fall back to global config
    if (!config) {
      config = await this.prisma.rateLimitConfig.findUnique({
        where: { endpoint: 'global' },
      });
    }

    return config;
  }

  /**
   * Get all rate limit configurations
   */
  async getAllConfigs() {
    return this.prisma.rateLimitConfig.findMany({
      orderBy: { endpoint: 'asc' },
    });
  }

  /**
   * Create or update rate limit config
   */
  async upsertConfig(data: {
    endpoint: string;
    windowMs: number;
    maxRequests: number;
    enabled: boolean;
    blockDuration?: number;
  }) {
    return this.prisma.rateLimitConfig.upsert({
      where: { endpoint: data.endpoint },
      create: data,
      update: data,
    });
  }

  /**
   * Delete rate limit config
   */
  async deleteConfig(endpoint: string) {
    return this.prisma.rateLimitConfig.delete({
      where: { endpoint },
    });
  }

  /**
   * Get recent violations
   */
  async getViolations(limit = 100) {
    return this.prisma.rateLimitViolation.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Log rate limit violation
   */
  private async logViolation(ip: string, endpoint: string, requests: number, limit: number) {
    await this.prisma.rateLimitViolation.create({
      data: {
        ip,
        endpoint,
        requests,
        limit,
      },
    });
  }

  /**
   * Clean up old request timestamps from memory
   */
  private cleanupOldRequests() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [ip, ipStore] of this.requestStore.entries()) {
      for (const [endpoint, requests] of ipStore.entries()) {
        const recentRequests = requests.filter((time) => now - time < maxAge);
        if (recentRequests.length === 0) {
          ipStore.delete(endpoint);
        } else {
          ipStore.set(endpoint, recentRequests);
        }
      }
      if (ipStore.size === 0) {
        this.requestStore.delete(ip);
      }
    }
  }
}
