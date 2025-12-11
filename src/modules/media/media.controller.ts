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
    return this.mediaService.upload(file, user.id);
  }

  /**
   * Get all media
   * GET /api/media
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('mimeType') mimeType?: string,
  ) {
    return this.mediaService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      mimeType,
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
  update(
    @Param('id') id: string,
    @Body() updateData: { alt?: string; caption?: string },
  ) {
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

