/**
 * Demo Isolation Interceptor
 *
 * CRITICAL SECURITY: Ensures demo users CANNOT access real admin data.
 *
 * This interceptor runs BEFORE every request and:
 * 1. Attaches demo context to the request object for services to use
 * 2. Tracks demo user activity for analytics
 *
 * SECURITY NOTE: Demo isolation is enforced at the SERVICE LAYER, not here.
 * Services must read demoContext from the request and apply appropriate filters.
 * This interceptor only sets up the context - it does NOT modify PrismaService state
 * to avoid race conditions in concurrent requests.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, finalize } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DemoIsolationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DemoIsolationInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if this is a demo user
    // SECURITY: Multiple indicators are checked to ensure we catch all demo users
    const isDemo = user?.isDemo === true || !!user?.demoId || !!user?.demoInstanceId;
    const demoInstanceId = user?.demoId || user?.demoInstanceId || null;

    if (isDemo && demoInstanceId) {
      this.logger.debug(`Demo isolation active for demoId: ${demoInstanceId}`);

      // SECURITY: Attach demo context to request for services to use
      // Services MUST read this context and apply appropriate filters
      // DO NOT store on shared PrismaService - causes race conditions!
      request.demoContext = {
        isDemo: true,
        demoInstanceId,
        // Add timestamp for debugging
        contextSetAt: Date.now(),
      };

      // Track demo activity asynchronously (don't block the request)
      const startTime = Date.now();

      return next.handle().pipe(
        tap(() => {
          // Track activity after response
          this.trackDemoActivity(demoInstanceId, request, startTime).catch((err) => {
            this.logger.debug(`Failed to track demo activity: ${err.message}`);
          });
        }),
      );
    } else {
      // Real user - ensure they only see non-demo data
      // SECURITY: Explicitly set isDemo to false to prevent bypass
      request.demoContext = {
        isDemo: false,
        demoInstanceId: null,
        contextSetAt: Date.now(),
      };
    }

    return next.handle();
  }

  /**
   * Track demo user activity for analytics
   */
  private async trackDemoActivity(demoId: string, request: any, startTime: number) {
    const responseTime = Date.now() - startTime;
    const path = request.path || request.url;
    const method = request.method;

    // Only track API requests (skip static files, etc)
    if (!path.startsWith('/api/')) {
      return;
    }

    // Log access
    await this.prisma.demoAccessLog.create({
      data: {
        demoInstanceId: demoId,
        path,
        method,
        responseTime,
        ipAddress: request.ip || request.socket?.remoteAddress || null,
        userAgent: request.headers?.['user-agent'] || null,
        statusCode: 200, // Assumes success since we're in tap (after response)
      },
    });

    // Update session activity
    const ipAddress = request.ip || request.socket?.remoteAddress || 'unknown';
    const recentSession = await this.prisma.demoSession.findFirst({
      where: {
        demoInstanceId: demoId,
        ipAddress,
        isActive: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (recentSession) {
      await this.prisma.demoSession.update({
        where: { id: recentSession.id },
        data: {
          pagesViewed: { increment: 1 },
          actionsCount: { increment: 1 },
        },
      });
    }

    // Update demo instance last accessed
    await this.prisma.demoInstance.update({
      where: { id: demoId },
      data: {
        lastAccessedAt: new Date(),
        requestCount: { increment: 1 },
      },
    });
  }
}

