import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DemoService } from './demo.service';
import { DemoVerificationService } from './services/demo-verification.service';
import { CreateDemoDto, DemoAccessDto, ExtendDemoDto } from './dto/create-demo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DemoStatus } from '@prisma/client';

@Controller('api/demos')
export class DemoController {
  constructor(
    private readonly demoService: DemoService,
    private readonly demoVerificationService: DemoVerificationService,
  ) {}

  // ==================== PUBLIC ROUTES ====================

  /**
   * Request a new demo instance (now requires email verification)
   * POST /api/demos/request
   *
   * Flow:
   * 1. Validates business email (blocks free email providers)
   * 2. Sends verification email with unique token
   * 3. User clicks link to verify and create demo
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async requestDemo(@Body() dto: CreateDemoDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.demoVerificationService.requestDemoVerification(
      {
        name: dto.name,
        email: dto.email,
        company: dto.company,
        phone: dto.phone,
        preferredSubdomain: dto.preferredSubdomain,
      },
      ipAddress,
      userAgent,
    );
  }

  /**
   * Verify email and create demo
   * GET /api/demos/verify/:token
   *
   * User clicks this link from their email to verify and get demo access
   */
  @Get('verify/:token')
  async verifyEmailAndCreateDemo(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.demoVerificationService.verifyEmailAndCreateDemo(token);

      // Redirect directly to demo homepage
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      if (result.demoCredentials) {
        // Redirect to the demo homepage with the subdomain
        return res.redirect(
          `${baseUrl}/demo/${result.demoCredentials.subdomain}`
        );
      }
      // If already verified, redirect to try-demo page with message
      return res.redirect(`${baseUrl}/try-demo?message=already_verified`);
    } catch (error: any) {
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const errorCode = error.response?.code || 'VERIFICATION_FAILED';
      const errorMessage = error.response?.message || error.message || 'Verification failed';
      // Redirect to try-demo page with error
      return res.redirect(`${baseUrl}/try-demo?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  /**
   * API endpoint for email verification (JSON response)
   * POST /api/demos/verify
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmailApi(@Body() body: { token: string }) {
    return this.demoVerificationService.verifyEmailAndCreateDemo(body.token);
  }

  /**
   * Access demo by token
   * GET /api/demos/access/:token
   */
  @Get('access/:token')
  async accessDemo(@Param('token') token: string) {
    return this.demoService.getDemoByToken(token);
  }

  /**
   * Request upgrade from demo
   * POST /api/demos/upgrade
   */
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  async requestUpgrade(@Body() body: DemoAccessDto & { notes?: string }) {
    return this.demoService.requestUpgrade(body.accessToken, body.notes);
  }

  /**
   * Track feature usage within a demo
   * POST /api/demos/track
   */
  @Post('track')
  @HttpCode(HttpStatus.OK)
  async trackFeatureUsage(
    @Body() body: { accessToken: string; feature: string; action: string; metadata?: Record<string, any> },
  ) {
    return this.demoService.recordFeatureUsage(
      body.accessToken,
      body.feature,
      body.action,
      body.metadata,
    );
  }

  // ==================== ADMIN ROUTES ====================

  /**
   * List all demos (admin)
   * GET /api/demos
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async listDemos(
    @Query('status') status?: DemoStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.demoService.listDemos({ status, page, limit, search });
  }

  /**
   * Get demo analytics (admin)
   * GET /api/demos/analytics
   */
  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAnalytics() {
    return this.demoService.getDemoAnalytics();
  }

  /**
   * Get demo by ID (admin)
   * GET /api/demos/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getDemo(@Param('id') id: string) {
    return this.demoService.getDemoById(id);
  }

  /**
   * Extend demo expiration (admin)
   * POST /api/demos/:id/extend
   */
  @Post(':id/extend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async extendDemo(@Param('id') id: string, @Body() dto: ExtendDemoDto) {
    return this.demoService.extendDemo(id, dto);
  }

  /**
   * Terminate demo (admin)
   * DELETE /api/demos/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async terminateDemo(@Param('id') id: string) {
    return this.demoService.terminateDemo(id);
  }
}

