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
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { DemoStatus } from '@prisma/client';

/**
 * Demo Router Controller
 *
 * Handles path-based demo routing: /demo/:demoId/*
 * Each demo gets its own isolated environment accessible via:
 *   - /demo/abc123          → Demo homepage
 *   - /demo/abc123/admin    → Demo admin panel (auto-login as demo user)
 *   - /demo/abc123/api/*    → Demo API endpoints
 *
 * SIMULATED DEMO MODE:
 * - Auto-logs users into the main admin panel as a demo user
 * - Sets demo_mode cookie to enable restrictions
 * - Demo users can explore but destructive actions are blocked
 */
@Controller('demo')
export class DemoRouterController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
   * Demo admin panel - auto-login and redirect to real admin
   * GET /demo/:demoId/admin
   *
   * This creates a demo user session and redirects to the main admin panel
   * with demo mode enabled (restrictions on destructive actions)
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

    // Get or create demo user for this session
    const demoUser = await this.getOrCreateDemoUser(demo);

    // Generate JWT token for demo user
    const payload = {
      email: demoUser.email,
      sub: demoUser.id,
      role: demoUser.role,
      isDemo: true,
      demoId: demo.id,
      demoSubdomain: demo.subdomain,
    };
    const token = this.jwtService.sign(payload, { expiresIn: '24h' });

    // Set auth cookie (same as regular login)
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    });

    // Set demo mode cookie with demo info (readable by frontend)
    const demoInfo = {
      id: demo.id,
      subdomain: demo.subdomain,
      name: demo.name,
      expiresAt: demo.expiresAt.toISOString(),
      remainingHours: this.getRemainingHours(demo.expiresAt),
    };
    res.cookie('demo_mode', JSON.stringify(demoInfo), {
      httpOnly: false, // Frontend needs to read this
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    // Update demo last accessed
    await this.prisma.demoInstance.update({
      where: { id: demo.id },
      data: { lastAccessedAt: new Date(), requestCount: { increment: 1 } },
    });

    // Redirect to real admin panel
    return res.redirect('/admin');
  }

  /**
   * Get or create a demo user for the simulated demo
   */
  private async getOrCreateDemoUser(demo: any) {
    // Find user WITH the correct demoInstanceId (security: must match demo)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: demo.adminEmail,
        demoInstanceId: demo.id, // SECURITY: Must be tagged to this demo
      },
    });

    if (existingUser) {
      return existingUser;
    }

    // The demo user should have been created by the seeder
    // If not found, the seeder may not have run - return error
    throw new NotFoundException({
      message: 'Demo user not found. The demo may not be fully provisioned.',
      code: 'DEMO_USER_NOT_FOUND',
      suggestion: 'Please wait a moment and try again, or request a new demo.',
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

