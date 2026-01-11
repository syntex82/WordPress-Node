/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse with configurable rate limits
 */

import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations by route prefix
const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  '/api/auth/login': { requests: 5, windowMs: 60000 },      // 5 per minute
  '/api/auth/register': { requests: 3, windowMs: 60000 },   // 3 per minute
  '/api/auth/forgot-password': { requests: 3, windowMs: 300000 }, // 3 per 5 minutes
  '/api/demo': { requests: 10, windowMs: 60000 },           // 10 per minute
  '/api/billing/subscribe': { requests: 5, windowMs: 60000 }, // 5 per minute
  '/api/upload': { requests: 20, windowMs: 60000 },         // 20 per minute
  'default': { requests: 100, windowMs: 60000 },            // 100 per minute default
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const clientKey = this.getClientKey(req);
    const routeKey = this.getRouteKey(req.path);
    const key = `${clientKey}:${routeKey}`;
    
    const config = this.getRateLimitConfig(req.path);
    const now = Date.now();
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.requests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.requests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    // Check if rate limit exceeded
    if (entry.count > config.requests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      this.logger.warn(
        `Rate limit exceeded for ${clientKey} on ${req.path} - ${entry.count}/${config.requests}`,
      );
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }

  /**
   * Get unique client identifier
   */
  private getClientKey(req: Request): string {
    // Use user ID if authenticated
    const user = (req as any).user;
    if (user?.id) {
      return `user:${user.id}`;
    }

    // Fall back to IP address
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return `ip:${forwarded.split(',')[0].trim()}`;
    }
    return `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
  }

  /**
   * Get route key for rate limit grouping
   */
  private getRouteKey(path: string): string {
    // Match specific routes first
    for (const route of Object.keys(RATE_LIMITS)) {
      if (route !== 'default' && path.startsWith(route)) {
        return route;
      }
    }
    return 'default';
  }

  /**
   * Get rate limit configuration for a path
   */
  private getRateLimitConfig(path: string): { requests: number; windowMs: number } {
    for (const [route, config] of Object.entries(RATE_LIMITS)) {
      if (route !== 'default' && path.startsWith(route)) {
        return config;
      }
    }
    return RATE_LIMITS.default;
  }
}

// Cleanup old entries periodically (run every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

