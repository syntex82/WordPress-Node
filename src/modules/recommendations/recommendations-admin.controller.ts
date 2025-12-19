/**
 * Recommendations Admin Controller
 * Admin API endpoints for managing recommendation rules and settings
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RecommendationsService } from './recommendations.service';
import { RecommendationAnalyticsService } from './recommendation-analytics.service';
import {
  CreateRecommendationRuleDto,
  UpdateRecommendationRuleDto,
  AddManualRecommendationDto,
  UpdateRecommendationSettingsDto,
} from './dto';

@Controller('api/admin/recommendations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RecommendationsAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recommendationsService: RecommendationsService,
    private readonly analyticsService: RecommendationAnalyticsService,
  ) {}

  // ============================================
  // Recommendation Rules
  // ============================================

  /**
   * List all recommendation rules
   * GET /api/admin/recommendations/rules
   */
  @Get('rules')
  async listRules(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    const pageNum = parseInt(page || '1');
    const limitNum = parseInt(limit || '20');
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [rules, total] = await Promise.all([
      this.prisma.recommendationRule.findMany({
        where,
        include: { manualItems: true },
        orderBy: { priority: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.recommendationRule.count({ where }),
    ]);

    return {
      rules,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get a single rule
   * GET /api/admin/recommendations/rules/:id
   */
  @Get('rules/:id')
  async getRule(@Param('id') id: string) {
    return this.prisma.recommendationRule.findUnique({
      where: { id },
      include: { manualItems: true },
    });
  }

  /**
   * Create a recommendation rule
   * POST /api/admin/recommendations/rules
   */
  @Post('rules')
  async createRule(@Body() dto: CreateRecommendationRuleDto) {
    return this.prisma.recommendationRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        targetType: dto.targetType,
        algorithm: dto.algorithm,
        settings: dto.settings || {},
        priority: dto.priority || 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Update a recommendation rule
   * PUT /api/admin/recommendations/rules/:id
   */
  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() dto: UpdateRecommendationRuleDto) {
    return this.prisma.recommendationRule.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete a recommendation rule
   * DELETE /api/admin/recommendations/rules/:id
   */
  @Delete('rules/:id')
  async deleteRule(@Param('id') id: string) {
    await this.prisma.recommendationRule.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Add manual recommendation to a rule
   * POST /api/admin/recommendations/rules/:ruleId/items
   */
  @Post('rules/:ruleId/items')
  async addManualItem(
    @Param('ruleId') ruleId: string,
    @Body() dto: AddManualRecommendationDto,
  ) {
    return this.prisma.manualRecommendation.create({
      data: {
        ruleId,
        contentType: dto.contentType,
        contentId: dto.contentId,
        position: dto.position || 0,
      },
    });
  }

  /**
   * Remove manual recommendation from a rule
   * DELETE /api/admin/recommendations/rules/:ruleId/items/:itemId
   */
  @Delete('rules/:ruleId/items/:itemId')
  async removeManualItem(@Param('itemId') itemId: string) {
    await this.prisma.manualRecommendation.delete({ where: { id: itemId } });
    return { success: true };
  }

  // ============================================
  // Settings
  // ============================================

  /**
   * Get recommendation settings
   * GET /api/admin/recommendations/settings
   */
  @Get('settings')
  async getSettings() {
    const settings = await this.prisma.recommendationSettings.findMany();
    const settingsMap: Record<string, any> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    return settingsMap;
  }

  /**
   * Update recommendation settings
   * PUT /api/admin/recommendations/settings
   */
  @Put('settings')
  async updateSettings(@Body() dto: UpdateRecommendationSettingsDto) {
    const updates = Object.entries(dto).filter(([_, v]) => v !== undefined);

    for (const [key, value] of updates) {
      await this.prisma.recommendationSettings.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      });
    }

    return this.getSettings();
  }

  // ============================================
  // Analytics
  // ============================================

  /**
   * Get recommendation analytics
   * GET /api/admin/recommendations/analytics
   */
  @Get('analytics')
  async getAnalytics(
    @Query('period') period?: string,
    @Query('contentType') contentType?: string,
  ) {
    return this.analyticsService.getAnalytics(period || 'week', contentType);
  }

  /**
   * Get click-through rates
   * GET /api/admin/recommendations/analytics/ctr
   */
  @Get('analytics/ctr')
  async getClickThroughRates(@Query('period') period?: string) {
    return this.analyticsService.getClickThroughRates(period || 'week');
  }

  /**
   * Get top performing recommendations
   * GET /api/admin/recommendations/analytics/top
   */
  @Get('analytics/top')
  async getTopPerforming(
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopPerforming(
      period || 'week',
      parseInt(limit || '10'),
    );
  }

  // ============================================
  // Cache Management
  // ============================================

  /**
   * Clear recommendation cache
   * POST /api/admin/recommendations/cache/clear
   */
  @Post('cache/clear')
  async clearCache(
    @Query('sourceType') sourceType?: string,
    @Query('sourceId') sourceId?: string,
  ) {
    const count = await this.recommendationsService.clearCache(sourceType, sourceId);
    return { success: true, cleared: count };
  }

  /**
   * Clear expired cache entries
   * POST /api/admin/recommendations/cache/cleanup
   */
  @Post('cache/cleanup')
  async cleanupCache() {
    const count = await this.recommendationsService.clearExpiredCache();
    return { success: true, cleared: count };
  }
}

