/**
 * IP Block Middleware
 * Blocks requests from blacklisted IP addresses
 */

import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IpBlockService } from '../services/ip-block.service';
import { SecurityEventsService } from '../services/security-events.service';
import { SecurityEventType } from '@prisma/client';

@Injectable()
export class IpBlockMiddleware implements NestMiddleware {
  constructor(
    private ipBlockService: IpBlockService,
    private securityEvents: SecurityEventsService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = this.getClientIp(req);

    if (!ip) {
      return next();
    }

    const isBlocked = await this.ipBlockService.isBlocked(ip);

    if (isBlocked) {
      // Log the blocked request
      await this.securityEvents.createEvent({
        type: SecurityEventType.BLOCKED_REQUEST,
        ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          path: req.path,
          method: req.method,
        },
      });

      throw new ForbiddenException('Access denied. Your IP address has been blocked.');
    }

    next();
  }

  /**
   * Extract client IP from request
   */
  private getClientIp(req: Request): string | undefined {
    // Check X-Forwarded-For header (for proxies/load balancers)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }

    // Check X-Real-IP header
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return realIp as string;
    }

    // Fall back to req.ip
    return req.ip;
  }
}

