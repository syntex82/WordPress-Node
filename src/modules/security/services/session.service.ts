/**
 * Session Management Service
 * Manages user sessions, tracking, and force logout
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventType } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private securityEvents: SecurityEventsService,
  ) {}

  /**
   * Get all active sessions
   */
  async getAllSessions(userId?: string) {
    const where = userId ? { userId } : {};
    
    const sessions = await this.prisma.session.findMany({
      where: {
        ...where,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      user: session.user,
      ip: session.ip,
      userAgent: session.userAgent,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  /**
   * Get sessions for a specific user
   */
  async getUserSessions(userId: string) {
    return this.getAllSessions(userId);
  }

  /**
   * Force logout a session
   */
  async forceLogout(sessionId: string, adminUserId?: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Delete the session
    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    // Log the event
    await this.securityEvents.createEvent({
      userId: session.userId,
      type: SecurityEventType.LOGOUT,
      ip: session.ip || undefined,
      metadata: {
        sessionId,
        forcedBy: adminUserId,
        reason: 'Force logout by administrator',
      },
    });

    return { success: true, message: 'Session terminated' };
  }

  /**
   * Force logout all sessions for a user
   */
  async forceLogoutAll(userId: string, adminUserId?: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
    });

    // Delete all sessions
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Log the event
    await this.securityEvents.createEvent({
      userId,
      type: SecurityEventType.LOGOUT,
      metadata: {
        forcedBy: adminUserId,
        reason: 'Force logout all sessions by administrator',
        sessionCount: sessions.length,
      },
    });

    return { 
      success: true, 
      message: `${sessions.length} session(s) terminated`,
      count: sessions.length,
    };
  }

  /**
   * Update session activity
   */
  async updateActivity(sessionId: string, ip?: string, userAgent?: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        lastActivity: new Date(),
        ip: ip || undefined,
        userAgent: userAgent || undefined,
      },
    });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return { deleted: result.count };
  }
}

