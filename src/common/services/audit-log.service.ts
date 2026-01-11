/**
 * Audit Log Service
 * 
 * Tracks all admin/security-related actions for compliance and debugging
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Request } from 'express';

export interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log an action with request context
   */
  async log(entry: AuditLogEntry, request?: Request): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          userEmail: entry.userEmail,
          userRole: entry.userRole,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: entry.details as any,
          ipAddress: request ? this.getClientIp(request) : undefined,
          userAgent: request?.headers['user-agent'],
          success: entry.success ?? true,
          errorMessage: entry.errorMessage,
        },
      });
    } catch (error) {
      // Log to console if DB write fails - never throw
      this.logger.error(`Failed to write audit log: ${error.message}`, {
        entry,
        error: error.message,
      });
    }
  }

  /**
   * Log a user action (simplified interface)
   */
  async logUserAction(
    user: { id?: string; email?: string; role?: string },
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    request?: Request,
  ): Promise<void> {
    return this.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action,
      resource,
      resourceId,
      details,
      success: true,
    }, request);
  }

  /**
   * Log a failed action
   */
  async logFailure(
    user: { id?: string; email?: string; role?: string } | null,
    action: string,
    resource: string,
    errorMessage: string,
    request?: Request,
    resourceId?: string,
  ): Promise<void> {
    return this.log({
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      action,
      resource,
      resourceId,
      success: false,
      errorMessage,
    }, request);
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'TWO_FACTOR',
    email: string,
    success: boolean,
    request?: Request,
    details?: Record<string, any>,
  ): Promise<void> {
    return this.log({
      userEmail: email,
      action,
      resource: 'auth',
      success,
      details,
    }, request);
  }

  /**
   * Query audit logs with filters
   */
  async query(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50, startDate, endDate, ...where } = filters;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const queryWhere: any = { ...where };
    if (Object.keys(dateFilter).length > 0) {
      queryWhere.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: queryWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: queryWhere }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get client IP from request
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}

