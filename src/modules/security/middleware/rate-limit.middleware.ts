/**
 * Rate Limiting Middleware
 * Applies rate limiting to API endpoints
 */

import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private rateLimitService: RateLimitService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract IP address
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.ip ||
      'unknown';

    // Get endpoint path
    const endpoint = req.path;

    // Check rate limit
    const result = await this.rateLimitService.checkRateLimit(ip, endpoint);

    if (!result.allowed) {
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', '0');
      res.setHeader('X-RateLimit-Remaining', '0');
      if (result.retryAfter) {
        res.setHeader('Retry-After', result.retryAfter.toString());
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          retryAfter: result.retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
