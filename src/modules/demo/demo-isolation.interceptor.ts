/**
 * Demo Isolation Interceptor
 * 
 * CRITICAL SECURITY: Ensures demo users CANNOT access real admin data.
 * 
 * This interceptor runs BEFORE every request and modifies the PrismaService
 * to automatically filter queries based on demoInstanceId.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DemoIsolationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DemoIsolationInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if this is a demo user
    const isDemo = user?.isDemo === true || user?.demoId || user?.demoInstanceId;
    const demoInstanceId = user?.demoId || user?.demoInstanceId || null;

    if (isDemo && demoInstanceId) {
      this.logger.debug(`Demo isolation active for demoId: ${demoInstanceId}`);
      
      // Attach demo context to request for services to use
      request.demoContext = {
        isDemo: true,
        demoInstanceId,
      };
      
      // Store the demoInstanceId on the PrismaService instance for this request
      // This will be read by the demo-aware query methods
      (this.prisma as any)._currentDemoId = demoInstanceId;
    } else {
      // Real user - ensure they only see non-demo data
      request.demoContext = {
        isDemo: false,
        demoInstanceId: null,
      };
      (this.prisma as any)._currentDemoId = null;
    }

    return next.handle();
  }
}

