/**
 * IP Block Service
 * Manages IP-based access control
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventType } from '@prisma/client';
import { BlockIpDto } from '../dto/security.dto';

@Injectable()
export class IpBlockService {
  constructor(
    private prisma: PrismaService,
    private securityEvents: SecurityEventsService,
  ) {}

  /**
   * Check if an IP is blocked
   */
  async isBlocked(ip: string): Promise<boolean> {
    const block = await this.prisma.blockedIP.findUnique({
      where: { ip },
    });

    if (!block) return false;

    // Check if block has expired
    if (block.expiresAt && block.expiresAt < new Date()) {
      await this.unblockIp(ip);
      return false;
    }

    return true;
  }

  /**
   * Block an IP address
   */
  async blockIp(data: BlockIpDto, userId?: string) {
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

    const blocked = await this.prisma.blockedIP.upsert({
      where: { ip: data.ip },
      create: {
        ip: data.ip,
        reason: data.reason,
        expiresAt,
      },
      update: {
        reason: data.reason,
        expiresAt,
      },
    });

    // Log the event
    await this.securityEvents.createEvent({
      userId,
      type: SecurityEventType.IP_BLOCKED,
      ip: data.ip,
      metadata: {
        reason: data.reason,
        expiresAt: data.expiresAt,
      },
    });

    return blocked;
  }

  /**
   * Unblock an IP address
   */
  async unblockIp(ip: string, userId?: string) {
    const deleted = await this.prisma.blockedIP.delete({
      where: { ip },
    });

    // Log the event
    await this.securityEvents.createEvent({
      userId,
      type: SecurityEventType.IP_UNBLOCKED,
      ip,
    });

    return deleted;
  }

  /**
   * Get all blocked IPs
   */
  async getBlockedIps() {
    const blocks = await this.prisma.blockedIP.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Filter out expired blocks
    const now = new Date();
    return blocks.filter((block) => !block.expiresAt || block.expiresAt > now);
  }

  /**
   * Clean up expired IP blocks
   */
  async cleanupExpiredBlocks() {
    const deleted = await this.prisma.blockedIP.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    return deleted.count;
  }
}
