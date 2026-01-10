/**
 * Languages Controller
 * CRUD operations for language management
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
import { I18nService } from './i18n.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language.dto';

@Controller('api/i18n/languages')
export class LanguagesController {
  constructor(private readonly i18nService: I18nService) {}

  /**
   * Get all languages
   * GET /api/i18n/languages
   */
  @Get()
  async getLanguages(@Query('includeInactive') includeInactive?: string) {
    return this.i18nService.getLanguages(includeInactive === 'true');
  }

  /**
   * Get the default language
   * GET /api/i18n/languages/default
   */
  @Get('default')
  async getDefaultLanguage() {
    return this.i18nService.getDefaultLanguage();
  }

  /**
   * Get a language by code
   * GET /api/i18n/languages/:code
   */
  @Get(':code')
  async getLanguageByCode(@Param('code') code: string) {
    return this.i18nService.getLanguageByCode(code);
  }

  /**
   * Create a new language (Admin only)
   * POST /api/i18n/languages
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createLanguage(@Body() dto: CreateLanguageDto) {
    return this.i18nService.createLanguage(dto);
  }

  /**
   * Update a language (Admin only)
   * PUT /api/i18n/languages/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateLanguage(@Param('id') id: string, @Body() dto: UpdateLanguageDto) {
    return this.i18nService.updateLanguage(id, dto);
  }

  /**
   * Delete a language (Admin only)
   * DELETE /api/i18n/languages/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteLanguage(@Param('id') id: string) {
    return this.i18nService.deleteLanguage(id);
  }
}

