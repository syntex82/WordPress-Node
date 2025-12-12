/**
 * Lessons Controller for LMS Module
 * Handles admin lesson management
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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LessonsService } from '../services/lessons.service';
import { CreateLessonDto, UpdateLessonDto, ReorderLessonsDto, CreateVideoAssetDto } from '../dto/lesson.dto';

@Controller('api/lms/admin/courses/:courseId/lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  async create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateLessonDto,
  ) {
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
  async reorder(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderLessonsDto,
  ) {
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
}

