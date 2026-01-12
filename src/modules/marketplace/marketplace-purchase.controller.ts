/**
 * Marketplace Purchase Controller
 * REST API endpoints for plugin and theme purchases
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MarketplacePurchaseService } from './marketplace-purchase.service';

@Controller('api/marketplace/purchases')
export class MarketplacePurchaseController {
  constructor(private purchaseService: MarketplacePurchaseService) {}

  // ==================== USER ENDPOINTS ====================

  /**
   * Purchase a plugin
   * POST /api/marketplace/purchases/plugins/:pluginId
   */
  @Post('plugins/:pluginId')
  @UseGuards(JwtAuthGuard)
  async purchasePlugin(
    @Req() req: any,
    @Param('pluginId') pluginId: string,
    @Body('orderId') orderId?: string,
  ) {
    return this.purchaseService.purchasePlugin(req.user.id, pluginId, orderId);
  }

  /**
   * Purchase a theme
   * POST /api/marketplace/purchases/themes/:themeId
   */
  @Post('themes/:themeId')
  @UseGuards(JwtAuthGuard)
  async purchaseTheme(
    @Req() req: any,
    @Param('themeId') themeId: string,
    @Body('orderId') orderId?: string,
  ) {
    return this.purchaseService.purchaseTheme(req.user.id, themeId, orderId);
  }

  /**
   * Get my purchased plugins
   * GET /api/marketplace/purchases/plugins
   */
  @Get('plugins')
  @UseGuards(JwtAuthGuard)
  async getMyPlugins(@Req() req: any) {
    return this.purchaseService.getUserPlugins(req.user.id);
  }

  /**
   * Get my purchased themes
   * GET /api/marketplace/purchases/themes
   */
  @Get('themes')
  @UseGuards(JwtAuthGuard)
  async getMyThemes(@Req() req: any) {
    return this.purchaseService.getUserThemes(req.user.id);
  }

  /**
   * Check plugin access
   * GET /api/marketplace/purchases/plugins/:pluginId/access
   */
  @Get('plugins/:pluginId/access')
  @UseGuards(JwtAuthGuard)
  async checkPluginAccess(@Req() req: any, @Param('pluginId') pluginId: string) {
    const hasAccess = await this.purchaseService.hasPluginAccess(req.user.id, pluginId);
    return { hasAccess };
  }

  /**
   * Check theme access
   * GET /api/marketplace/purchases/themes/:themeId/access
   */
  @Get('themes/:themeId/access')
  @UseGuards(JwtAuthGuard)
  async checkThemeAccess(@Req() req: any, @Param('themeId') themeId: string) {
    const hasAccess = await this.purchaseService.hasThemeAccess(req.user.id, themeId);
    return { hasAccess };
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get purchase statistics (admin)
   * GET /api/marketplace/purchases/admin/stats
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getPurchaseStats() {
    return this.purchaseService.getPurchaseStats();
  }
}

