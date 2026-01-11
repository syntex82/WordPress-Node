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
} from '@nestjs/common';
import { DemoService } from './demo.service';
import { CreateDemoDto, DemoAccessDto, ExtendDemoDto } from './dto/create-demo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DemoStatus } from '@prisma/client';

@Controller('api/demos')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  // ==================== PUBLIC ROUTES ====================

  /**
   * Request a new demo instance
   * POST /api/demos/request
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async requestDemo(@Body() dto: CreateDemoDto) {
    return this.demoService.createDemo(dto);
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

