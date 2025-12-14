/**
 * Rate Limiting Service
 * Manages rate limiting configuration and violations
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SecurityEventsService } from './security-events.service';
import { IpBlockService } from './ip-block.service';
import { BlockIpDto } from '../dto/security.dto';

@Injectable()
export class RateLimitService {
  // In-memory store for rate limiting (IP -> endpoint -> requests[])
  private requestStore = new Map<string, Map<string, number[]>>();

  constructor(
    private prisma: PrismaService,
    private securityEvents: SecurityEventsService,
    private ipBlock: IpBlockService,
  ) {
    // Clean up old requests every minute
    setInterval(() => this.cleanupOldRequests(), 60000);
  }

  /**
   * Check if request should be rate limited
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

      // Block IP if configured
      if (config.blockDuration) {
        const blockData: BlockIpDto = {
          ip,
          reason: `Rate limit exceeded on ${endpoint}`,
          expiresAt: new Date(Date.now() + config.blockDuration * 60000).toISOString(),
        };
        await this.ipBlock.blockIp(blockData);
      }

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
