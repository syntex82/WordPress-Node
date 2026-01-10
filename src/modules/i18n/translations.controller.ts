/**
 * Translations Controller
 * Handles UI translations and content translation operations
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { I18nService } from './i18n.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  SetUITranslationDto,
  BulkUITranslationsDto,
  PostTranslationDto,
  PageTranslationDto,
  ProductTranslationDto,
  CourseTranslationDto,
} from './dto/translation.dto';

@Controller('api/i18n/translations')
export class TranslationsController {
  constructor(private readonly i18nService: I18nService) {}

  // ==================== UI TRANSLATIONS ====================

  /**
   * Get UI translations for a language
   * GET /api/i18n/translations/ui/:languageCode
   */
  @Get('ui/:languageCode')
  async getUITranslations(
    @Param('languageCode') languageCode: string,
    @Query('namespace') namespace?: string,
  ) {
    return this.i18nService.getUITranslations(languageCode, namespace);
  }

  /**
   * Set a UI translation (Admin only)
   * POST /api/i18n/translations/ui/:languageCode
   */
  @Post('ui/:languageCode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async setUITranslation(
    @Param('languageCode') languageCode: string,
    @Body() dto: SetUITranslationDto,
  ) {
    return this.i18nService.setUITranslation(languageCode, dto.namespace, dto.key, dto.value);
  }

  /**
   * Bulk set UI translations (Admin only)
   * POST /api/i18n/translations/ui/:languageCode/bulk
   */
  @Post('ui/:languageCode/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async bulkSetUITranslations(
    @Param('languageCode') languageCode: string,
    @Body() dto: BulkUITranslationsDto,
  ) {
    return this.i18nService.bulkSetUITranslations(languageCode, dto.translations);
  }

  // ==================== POST TRANSLATIONS ====================

  /**
   * Get all translations for a post
   * GET /api/i18n/translations/posts/:postId
   */
  @Get('posts/:postId')
  async getPostTranslations(@Param('postId') postId: string) {
    return this.i18nService.getPostTranslations(postId);
  }

  /**
   * Get a specific translation for a post
   * GET /api/i18n/translations/posts/:postId/:languageCode
   */
  @Get('posts/:postId/:languageCode')
  async getPostTranslation(
    @Param('postId') postId: string,
    @Param('languageCode') languageCode: string,
  ) {
    return this.i18nService.getPostTranslation(postId, languageCode);
  }

  /**
   * Create or update a post translation
   * PUT /api/i18n/translations/posts/:postId/:languageCode
   */
  @Put('posts/:postId/:languageCode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async setPostTranslation(
    @Param('postId') postId: string,
    @Param('languageCode') languageCode: string,
    @Body() dto: PostTranslationDto,
  ) {
    return this.i18nService.createOrUpdatePostTranslation(postId, languageCode, dto);
  }

  // ==================== PAGE TRANSLATIONS ====================

  /**
   * Get a specific translation for a page
   * GET /api/i18n/translations/pages/:pageId/:languageCode
   */
  @Get('pages/:pageId/:languageCode')
  async getPageTranslation(
    @Param('pageId') pageId: string,
    @Param('languageCode') languageCode: string,
  ) {
    return this.i18nService.getPageTranslation(pageId, languageCode);
  }

  /**
   * Create or update a page translation
   * PUT /api/i18n/translations/pages/:pageId/:languageCode
   */
  @Put('pages/:pageId/:languageCode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async setPageTranslation(
    @Param('pageId') pageId: string,
    @Param('languageCode') languageCode: string,
    @Body() dto: PageTranslationDto,
  ) {
    return this.i18nService.createOrUpdatePageTranslation(pageId, languageCode, dto);
  }

  // ==================== PRODUCT TRANSLATIONS ====================

  /**
   * Get a specific translation for a product
   * GET /api/i18n/translations/products/:productId/:languageCode
   */
  @Get('products/:productId/:languageCode')
  async getProductTranslation(
    @Param('productId') productId: string,
    @Param('languageCode') languageCode: string,
  ) {
    return this.i18nService.getProductTranslation(productId, languageCode);
  }

  /**
   * Create or update a product translation
   * PUT /api/i18n/translations/products/:productId/:languageCode
   */
  @Put('products/:productId/:languageCode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async setProductTranslation(
    @Param('productId') productId: string,
    @Param('languageCode') languageCode: string,
    @Body() dto: ProductTranslationDto,
  ) {
    return this.i18nService.createOrUpdateProductTranslation(productId, languageCode, dto);
  }

  // ==================== COURSE TRANSLATIONS ====================

  /**
   * Get a specific translation for a course
   * GET /api/i18n/translations/courses/:courseId/:languageCode
   */
  @Get('courses/:courseId/:languageCode')
  async getCourseTranslation(
    @Param('courseId') courseId: string,
    @Param('languageCode') languageCode: string,
  ) {
    return this.i18nService.getCourseTranslation(courseId, languageCode);
  }

  /**
   * Create or update a course translation
   * PUT /api/i18n/translations/courses/:courseId/:languageCode
   */
  @Put('courses/:courseId/:languageCode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  async setCourseTranslation(
    @Param('courseId') courseId: string,
    @Param('languageCode') languageCode: string,
    @Body() dto: CourseTranslationDto,
  ) {
    return this.i18nService.createOrUpdateCourseTranslation(courseId, languageCode, dto);
  }
}

