/**
 * Developers Controller
 * API endpoints for developer profiles
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DevelopersService } from '../services/developers.service';
import { CreateDeveloperDto, UpdateDeveloperDto, DeveloperStatus } from '../dto';
import { DeveloperCategory as PrismaDeveloperCategory } from '@prisma/client';

@Controller('api/marketplace/developers')
export class DevelopersController {
  constructor(private developersService: DevelopersService) {}

  /**
   * Create developer application
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() dto: CreateDeveloperDto) {
    return this.developersService.create(req.user.id, dto);
  }

  /**
   * Get current user's developer profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req) {
    return this.developersService.findByUserId(req.user.id);
  }

  /**
   * Update current user's developer profile
   */
  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(@Request() req, @Body() dto: UpdateDeveloperDto) {
    const developer = await this.developersService.findByUserId(req.user.id);
    if (!developer) {
      return { error: 'Developer profile not found' };
    }
    return this.developersService.update(developer.id, req.user.id, dto);
  }

  /**
   * List all developers (public, only active)
   */
  @Get()
  async findAll(
    @Query('category') category?: PrismaDeveloperCategory,
    @Query('skills') skills?: string,
    @Query('minRate') minRate?: string,
    @Query('maxRate') maxRate?: string,
    @Query('minRating') minRating?: string,
    @Query('availability') availability?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.developersService.findAll({
      status: DeveloperStatus.ACTIVE,
      category: category as PrismaDeveloperCategory,
      skills: skills ? skills.split(',') : undefined,
      minRate: minRate ? parseFloat(minRate) : undefined,
      maxRate: maxRate ? parseFloat(maxRate) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      availability,
      search,
      sortBy,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
    });
  }

  /**
   * Get developer by slug (public profile)
   */
  @Get('profile/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.developersService.findBySlug(slug);
  }

  /**
   * Match developers for requirements
   */
  @Post('match')
  @UseGuards(JwtAuthGuard)
  async matchDevelopers(
    @Body()
    requirements: {
      category?: PrismaDeveloperCategory;
      skills?: string[];
      budget?: number;
      budgetType?: string;
    },
  ) {
    return this.developersService.matchDevelopers({
      ...requirements,
      category: requirements.category as PrismaDeveloperCategory,
    });
  }

  // ============ ADMIN ENDPOINTS ============
  // NOTE: Admin routes MUST come before :id routes to avoid matching issues

  /**
   * List all developers (admin - all statuses)
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminFindAll(
    @Query('status') status?: DeveloperStatus,
    @Query('category') category?: PrismaDeveloperCategory,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.developersService.findAll({
      status,
      category: category as PrismaDeveloperCategory,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /**
   * Get developer statistics (admin)
   */
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getStatistics() {
    return this.developersService.getStatistics();
  }

  /**
   * Admin: Get users who don't have developer profiles
   */
  @Get('admin/available-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAvailableUsers(@Query('search') search?: string, @Query('limit') limit?: string) {
    return this.developersService.getAvailableUsersForDeveloper(
      search,
      limit ? parseInt(limit) : 20,
    );
  }

  /**
   * Admin: Create developer profile directly for a user
   */
  @Post('admin/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminCreateDeveloper(
    @Body()
    dto: {
      userId: string;
      displayName: string;
      headline?: string;
      bio?: string;
      category?: string;
      skills?: string[];
      languages?: string[];
      frameworks?: string[];
      hourlyRate: number;
      minimumBudget?: number;
      yearsOfExperience?: number;
      websiteUrl?: string;
      githubUrl?: string;
      linkedinUrl?: string;
      status?: string;
      isVerified?: boolean;
    },
  ) {
    return this.developersService.adminCreateDeveloper(dto as any);
  }

  // ============ PARAMETERIZED ROUTES ============
  // NOTE: These MUST come after all static routes to avoid matching issues

  /**
   * Approve developer (admin)
   */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approve(@Param('id') id: string) {
    return this.developersService.approve(id);
  }

  /**
   * Get developer by ID - MUST be after all admin/* routes
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.developersService.findById(id);
  }

  /**
   * Reject developer (admin)
   */
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.developersService.reject(id, reason);
  }

  /**
   * Suspend developer (admin)
   */
  @Patch(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async suspend(@Param('id') id: string, @Body('reason') reason: string) {
    return this.developersService.suspend(id, reason);
  }

  /**
   * Reactivate developer (admin)
   */
  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async reactivate(@Param('id') id: string) {
    return this.developersService.reactivate(id);
  }

  /**
   * Set featured status (admin)
   */
  @Patch(':id/featured')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async setFeatured(@Param('id') id: string, @Body() body: { featured: boolean; days?: number }) {
    return this.developersService.setFeatured(id, body.featured, body.days);
  }

  /**
   * Update developer (admin)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Request() req, @Body() dto: UpdateDeveloperDto) {
    return this.developersService.update(id, req.user.id, dto, true);
  }
}
