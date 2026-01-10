/**
 * Main i18n Controller
 * Handles general i18n operations
 */

import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

@Controller('api/i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  /**
   * Detect language from request headers
   * GET /api/i18n/detect
   */
  @Get('detect')
  detectLanguage(@Req() req: Request) {
    const acceptLanguage = req.headers['accept-language'];
    const detectedCode = this.i18nService.detectLanguageFromHeader(acceptLanguage);
    return {
      detected: detectedCode,
      acceptLanguage: acceptLanguage || null,
    };
  }

  /**
   * Get current language from request context
   * GET /api/i18n/current
   */
  @Get('current')
  getCurrentLanguage(@Req() req: Request) {
    return {
      language: (req as any).language || 'en',
      languageData: (req as any).languageData || null,
    };
  }

  /**
   * Seed default languages (Admin only)
   * POST /api/i18n/seed
   */
  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async seedLanguages() {
    return this.i18nService.seedDefaultLanguages();
  }
}

