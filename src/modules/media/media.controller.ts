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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload file
   * POST /api/media/upload
   */
  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
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
  @Roles(UserRole.ADMIN)
  getAllStorageStats() {
    return this.mediaService.getAllUsersStorageStats();
  }

  /**
   * Get storage stats for current user
   * GET /api/media/storage/me
   */
  @Get('storage/me')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  getMyStorageStats(@CurrentUser() user: any) {
    return this.mediaService.getUserStorageStats(user.id);
  }

  /**
   * Get all media - users see their own, admins can see all or filter by user
   * GET /api/media
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('mimeType') mimeType?: string,
    @Query('userId') userId?: string,
    @Query('showAll') showAll?: string,
    @CurrentUser() user?: any,
  ) {
    // Determine which user's media to show
    let filterUserId: string | undefined;

    if (user?.role === UserRole.ADMIN && showAll === 'true') {
      // Admin viewing all media - no user filter
      filterUserId = userId || undefined;
    } else if (user?.role === UserRole.ADMIN && userId) {
      // Admin viewing specific user's media
      filterUserId = userId;
    } else {
      // Non-admin or admin without showAll - show only own media
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
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  findOne(@Param('id') id: string) {
    return this.mediaService.findById(id);
  }

  /**
   * Update media metadata
   * PATCH /api/media/:id
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  update(@Param('id') id: string, @Body() updateData: { alt?: string; caption?: string }) {
    return this.mediaService.update(id, updateData.alt, updateData.caption);
  }

  /**
   * Delete media
   * DELETE /api/media/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
