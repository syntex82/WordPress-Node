import {
  Controller,
  Get,
  Post,
  All,
  Req,
  Res,
  Param,
  Next,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { DemoStatus } from '@prisma/client';

/**
 * Demo Router Controller
 * 
 * Handles path-based demo routing: /demo/:demoId/*
 * Each demo gets its own isolated environment accessible via:
 *   - /demo/abc123          → Demo homepage
 *   - /demo/abc123/admin    → Demo admin panel
 *   - /demo/abc123/api/*    → Demo API endpoints
 */
@Controller('demo')
export class DemoRouterController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Demo access page - validates token and shows demo info
   * GET /demo/:demoId
   */
  @Get(':demoId')
  async getDemoHomepage(
    @Param('demoId') demoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const demo = await this.validateAndGetDemo(demoId);
    
    // Log access
    await this.logAccess(demo.id, req, '/');
    
    // Render demo homepage with demo context
    return res.render('demo-home', {
      demo: {
        id: demo.id,
        subdomain: demo.subdomain,
        name: demo.name,
        expiresAt: demo.expiresAt,
        remainingHours: this.getRemainingHours(demo.expiresAt),
      },
      demoBaseUrl: `/demo/${demo.subdomain}`,
      adminUrl: `/demo/${demo.subdomain}/admin`,
      hideDemoWidget: true, // Don't show floating widget on demo pages
      isDemoMode: true,
      layout: 'demo-layout',
    });
  }

  /**
   * Demo admin panel redirect
   * GET /demo/:demoId/admin
   */
  @Get(':demoId/admin')
  async getDemoAdmin(
    @Param('demoId') demoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const demo = await this.validateAndGetDemo(demoId);
    
    // Log access
    await this.logAccess(demo.id, req, '/admin');
    
    // Set demo context cookie for admin panel
    res.cookie('demo_context', demo.subdomain, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    });

    // Render admin with demo mode enabled
    return res.render('demo-admin', {
      demo: {
        id: demo.id,
        subdomain: demo.subdomain,
        name: demo.name,
        adminEmail: demo.adminEmail,
        expiresAt: demo.expiresAt,
        remainingHours: this.getRemainingHours(demo.expiresAt),
      },
      demoBaseUrl: `/demo/${demo.subdomain}`,
      isDemoMode: true,
      hideDemoWidget: true,
    });
  }

  /**
   * Demo login page
   * GET /demo/:demoId/login
   */
  @Get(':demoId/login')
  async getDemoLogin(
    @Param('demoId') demoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const demo = await this.validateAndGetDemo(demoId);
    
    return res.render('demo-login', {
      demo: {
        id: demo.id,
        subdomain: demo.subdomain,
        adminEmail: demo.adminEmail,
        expiresAt: demo.expiresAt,
        remainingHours: this.getRemainingHours(demo.expiresAt),
      },
      demoBaseUrl: `/demo/${demo.subdomain}`,
      isDemoMode: true,
      hideDemoWidget: true,
    });
  }

  // ==================== HELPER METHODS ====================

  private async validateAndGetDemo(demoId: string) {
    // Find demo by subdomain (which is the path ID)
    const demo = await this.prisma.demoInstance.findFirst({
      where: {
        OR: [
          { subdomain: demoId },
          { accessToken: demoId },
        ],
      },
    });

    if (!demo) {
      throw new NotFoundException({
        message: 'Demo not found',
        code: 'DEMO_NOT_FOUND',
        suggestion: 'This demo may have expired. Request a new demo at /try-demo',
      });
    }

    // Check if demo is running
    if (demo.status !== DemoStatus.RUNNING) {
      if (demo.status === DemoStatus.EXPIRED) {
        throw new ForbiddenException({
          message: 'This demo has expired',
          code: 'DEMO_EXPIRED',
          suggestion: 'Request a new demo at /try-demo',
          expiredAt: demo.expiresAt,
        });
      }
      throw new ForbiddenException({
        message: `Demo is ${demo.status.toLowerCase()}`,
        code: `DEMO_${demo.status}`,
      });
    }

    // Check if expired
    if (demo.expiresAt < new Date()) {
      throw new ForbiddenException({
        message: 'This demo has expired',
        code: 'DEMO_EXPIRED',
        suggestion: 'Request a new demo at /try-demo',
      });
    }

    return demo;
  }

  private getRemainingHours(expiresAt: Date): number {
    const remaining = expiresAt.getTime() - Date.now();
    return Math.max(0, Math.round(remaining / (1000 * 60 * 60)));
  }

  private async logAccess(demoId: string, req: Request, path: string) {
    try {
      await this.prisma.demoAccessLog.create({
        data: {
          demoInstanceId: demoId,
          ipAddress: req.ip || req.socket?.remoteAddress,
          userAgent: req.headers['user-agent'],
          path,
          method: req.method,
        },
      });
    } catch (e) {
      // Don't fail on logging errors
    }
  }
}

