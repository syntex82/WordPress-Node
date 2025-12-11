/**
 * Security Events Service
 * Tracks and manages all security-related events
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SecurityEventType } from '@prisma/client';

export interface CreateSecurityEventDto {
  userId?: string;
  type: SecurityEventType;
  ip?: string;
  userAgent?: string;
  metadata?: any;
}

export interface SecurityEventFilters {
  userId?: string;
  type?: SecurityEventType;
  ip?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class SecurityEventsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new security event
   */
  async createEvent(data: CreateSecurityEventDto) {
    return this.prisma.securityEvent.create({
      data: {
        userId: data.userId,
        type: data.type,
        ip: data.ip,
        userAgent: data.userAgent,
        metadata: data.metadata || {},
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get security events with filters
   */
  async getEvents(filters: SecurityEventFilters = {}) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type;
    if (filters.ip) where.ip = filters.ip;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.securityEvent.count({ where }),
    ]);

    return { events, total };
  }

  /**
   * Get failed login attempts for a user in the last N minutes
   */
  async getRecentFailedLogins(email: string, minutes: number = 15): Promise<number> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return 0;

    const since = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.prisma.securityEvent.count({
      where: {
        userId: user.id,
        type: SecurityEventType.FAILED_LOGIN,
        createdAt: { gte: since },
      },
    });
  }

  /**
   * Get failed login attempts by IP in the last N minutes
   */
  async getRecentFailedLoginsByIp(ip: string, minutes: number = 15): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.prisma.securityEvent.count({
      where: {
        ip,
        type: SecurityEventType.FAILED_LOGIN,
        createdAt: { gte: since },
      },
    });
  }

  /**
   * Get statistics for the security dashboard
   */
  async getStatistics(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [failedLogins, lockedAccounts, blockedRequests] = await Promise.all([
      this.prisma.securityEvent.count({
        where: {
          type: SecurityEventType.FAILED_LOGIN,
          createdAt: { gte: since },
        },
      }),
      this.prisma.user.count({
        where: {
          accountLockedUntil: { gt: new Date() },
        },
      }),
      this.prisma.securityEvent.count({
        where: {
          type: SecurityEventType.BLOCKED_REQUEST,
          createdAt: { gte: since },
        },
      }),
    ]);

    return {
      failedLogins,
      lockedAccounts,
      blockedRequests,
    };
  }
}

