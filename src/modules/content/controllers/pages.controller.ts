/**
 * Pages Controller
 * Handles HTTP requests for page management
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PagesService } from '../services/pages.service';
import { CreatePageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole, PostStatus } from '@prisma/client';

@Controller('api/pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  /**
   * Create new page
   * POST /api/pages
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  create(@Body() createPageDto: CreatePageDto, @CurrentUser() user: any) {
    return this.pagesService.create(createPageDto, user.id);
  }

  /**
   * Get all pages with filters
   * GET /api/pages
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PostStatus,
  ) {
    return this.pagesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
    );
  }

  /**
   * Get page by ID
   * GET /api/pages/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagesService.findById(id);
  }

  /**
   * Get page by slug
   * GET /api/pages/slug/:slug
   */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  /**
   * Update page
   * PATCH /api/pages/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  update(@Param('id') id: string, @Body() updatePageDto: UpdatePageDto) {
    return this.pagesService.update(id, updatePageDto);
  }

  /**
   * Delete page
   * DELETE /api/pages/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  remove(@Param('id') id: string) {
    return this.pagesService.remove(id);
  }
}
