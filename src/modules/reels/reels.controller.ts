/**
 * Reels Controller
 * API endpoints for short-form video content (TikTok/Instagram-style reels)
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ReelsService } from './reels.service';
import { CreateReelDto, UpdateReelDto, CreateCommentDto, TrackViewDto } from './dto/create-reel.dto';

// Configure storage for video uploads
const uploadDir = join(process.cwd(), 'public', 'uploads', 'reels');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage = diskStorage({
  destination: uploadDir,
  filename: (req, file, callback) => {
    const userId = (req as any).user?.id || 'anonymous';
    const timestamp = Date.now();
    const ext = extname(file.originalname);
    const prefix = file.fieldname === 'thumbnail' ? '-thumb' : '';
    callback(null, `${userId}-${timestamp}${prefix}${ext}`);
  },
});

@Controller('api/reels')
export class ReelsController {
  constructor(private readonly reelsService: ReelsService) {}

  /**
   * Get reels feed
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getReels(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    return this.reelsService.getReels(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      userId,
      req.user?.id,
    );
  }

  /**
   * Get single reel
   */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getReel(@Param('id') id: string, @Request() req) {
    return this.reelsService.getReel(id, req.user?.id);
  }

  /**
   * Create a new reel
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createReel(@Request() req, @Body() dto: CreateReelDto) {
    return this.reelsService.createReel(req.user.id, dto);
  }

  /**
   * Upload video and thumbnail
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        storage,
        limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
        fileFilter: (req, file, callback) => {
          if (file.fieldname === 'video') {
            const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
            if (!allowed.includes(file.mimetype)) {
              return callback(new BadRequestException('Invalid video format'), false);
            }
          }
          callback(null, true);
        },
      },
    ),
  )
  async uploadVideo(
    @UploadedFiles() files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    if (!files.video || files.video.length === 0) {
      throw new BadRequestException('No video file provided');
    }

    const video = files.video[0];
    const thumbnail = files.thumbnail?.[0];

    return {
      videoUrl: `/uploads/reels/${video.filename}`,
      thumbnailUrl: thumbnail ? `/uploads/reels/${thumbnail.filename}` : undefined,
      fileSize: video.size,
      mimeType: video.mimetype,
    };
  }

  /**
   * Update a reel
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateReel(@Param('id') id: string, @Request() req, @Body() dto: UpdateReelDto) {
    return this.reelsService.updateReel(id, req.user.id, dto);
  }

  /**
   * Delete a reel
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteReel(@Param('id') id: string, @Request() req) {
    return this.reelsService.deleteReel(id, req.user.id);
  }

  /**
   * Like a reel
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likeReel(@Param('id') id: string, @Request() req) {
    return this.reelsService.likeReel(id, req.user.id);
  }

  /**
   * Unlike a reel
   */
  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  async unlikeReel(@Param('id') id: string, @Request() req) {
    return this.reelsService.unlikeReel(id, req.user.id);
  }

  /**
   * Get comments for a reel
   */
  @Get(':id/comments')
  async getComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reelsService.getComments(id, parseInt(page || '1'), parseInt(limit || '20'));
  }

  /**
   * Create a comment
   */
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(@Param('id') id: string, @Request() req, @Body() dto: CreateCommentDto) {
    return this.reelsService.createComment(id, req.user.id, dto);
  }

  /**
   * Track a view
   */
  @Post(':id/view')
  @UseGuards(OptionalJwtAuthGuard)
  async trackView(@Param('id') id: string, @Request() req, @Body() dto: TrackViewDto) {
    const ipAddress =
      req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || 'unknown';
    return this.reelsService.trackView(id, req.user?.id || null, ipAddress, dto);
  }
}

