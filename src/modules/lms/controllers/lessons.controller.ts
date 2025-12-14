/**
 * Lessons Controller for LMS Module
 * Handles admin lesson management with video upload support
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LessonsService } from '../services/lessons.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonsDto,
  CreateVideoAssetDto,
} from '../dto/lesson.dto';

@Controller('api/lms/admin/courses/:courseId/lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  async create(@Param('courseId') courseId: string, @Body() dto: CreateLessonDto) {
    return this.lessonsService.create(courseId, dto);
  }

  @Get()
  async findByCourse(@Param('courseId') courseId: string) {
    return this.lessonsService.findByCourse(courseId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.lessonsService.delete(id);
  }

  @Put('reorder')
  async reorder(@Param('courseId') courseId: string, @Body() dto: ReorderLessonsDto) {
    return this.lessonsService.reorder(courseId, dto.lessonIds);
  }

  // Video asset endpoints
  @Post('video-assets')
  async createVideoAsset(@Body() dto: CreateVideoAssetDto) {
    return this.lessonsService.createVideoAsset(dto);
  }

  @Get('video-assets/:id')
  async getVideoAsset(@Param('id') id: string) {
    return this.lessonsService.getVideoAsset(id);
  }

  @Delete('video-assets/:id')
  async deleteVideoAsset(@Param('id') id: string) {
    return this.lessonsService.deleteVideoAsset(id);
  }

  // Video upload endpoint
  @Post(':id/upload-video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(new Error('Only video files are allowed'), false);
        }
      },
    }),
  )
  async uploadVideo(
    @Param('courseId') courseId: string,
    @Param('id') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.lessonsService.uploadVideo(courseId, lessonId, file, req.user.id);
  }

  // Attach external video (YouTube, Vimeo, etc.)
  @Post(':id/attach-video')
  async attachExternalVideo(
    @Param('id') lessonId: string,
    @Body() dto: { provider: string; url: string; playbackId?: string; durationSeconds?: number },
  ) {
    return this.lessonsService.attachExternalVideo(lessonId, dto);
  }
}
