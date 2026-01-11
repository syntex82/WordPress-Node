/**
 * Media Controller
 * Handles HTTP requests for media library management
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Res,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import * as fs from 'fs';

@Controller('api/media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload file
   * POST /api/media/upload
   */
  @Post('upload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.buffer) {
      throw new BadRequestException('File buffer is empty - upload failed');
    }
    return this.mediaService.upload(file, user.id);
  }

  /**
   * Get storage stats for all users (admin only)
   * GET /api/media/storage/all
   */
  @Get('storage/all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getAllStorageStats() {
    return this.mediaService.getAllUsersStorageStats();
  }

  /**
   * Get storage stats for current user
   * GET /api/media/storage/me
   */
  @Get('storage/me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  getMyStorageStats(@CurrentUser() user: any) {
    return this.mediaService.getUserStorageStats(user.id);
  }

  /**
   * Get all media - users see their own, only SUPER_ADMIN/ADMIN can see all
   * GET /api/media
   *
   * Role-based access:
   * - SUPER_ADMIN/ADMIN: Can view all media or filter by user
   * - EDITOR/AUTHOR: Can only view their own media
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('mimeType') mimeType?: string,
    @Query('userId') userId?: string,
    @Query('showAll') showAll?: string,
    @CurrentUser() user?: any,
  ) {
    // Determine which user's media to show based on role
    let filterUserId: string | undefined;

    const isAdminOrSuper = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;

    if (isAdminOrSuper && showAll === 'true') {
      // Admin/Super viewing all media - no user filter (or specific user if provided)
      filterUserId = userId || undefined;
    } else if (isAdminOrSuper && userId) {
      // Admin/Super viewing specific user's media
      filterUserId = userId;
    } else {
      // Everyone else (including EDITOR and AUTHOR) sees only their own media
      filterUserId = user?.id;
    }

    return this.mediaService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      mimeType,
      filterUserId,
    );
  }

  /**
   * Get media by ID
   * GET /api/media/:id
   */
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  findOne(@Param('id') id: string) {
    return this.mediaService.findById(id);
  }

  /**
   * Update media metadata
   * PATCH /api/media/:id
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  update(@Param('id') id: string, @Body() updateData: { alt?: string; caption?: string }) {
    return this.mediaService.update(id, updateData.alt, updateData.caption);
  }

  /**
   * Delete media
   * DELETE /api/media/:id
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }

  /**
   * Optimize all media (convert images to WebP)
   * POST /api/media/optimize-all
   * Admins can optimize all media, other users only their own
   */
  @Post('optimize-all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  optimizeAll(@CurrentUser() user: any) {
    // Super admins and admins can optimize all, others only their own
    const isAdminOrSuper = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    const userId = isAdminOrSuper ? undefined : user.id;
    return this.mediaService.optimizeAllMedia(userId);
  }
}
