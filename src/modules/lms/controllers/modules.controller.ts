/**
 * Course Modules Controller for LMS Curriculum
 * API endpoints for managing course sections/modules
 * Course creators can edit their own courses, admins/editors can edit any course
 */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CourseOwnershipGuard } from '../guards/course-ownership.guard';
import { ModulesService } from '../services/modules.service';
import {
  CreateModuleDto,
  UpdateModuleDto,
  ReorderModulesDto,
  MoveLesonToModuleDto,
} from '../dto/module.dto';

@Controller('api/lms/admin/courses/:courseId/modules')
@UseGuards(JwtAuthGuard, CourseOwnershipGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  async create(@Param('courseId') courseId: string, @Body() dto: CreateModuleDto) {
    return this.modulesService.create(courseId, dto);
  }

  @Get()
  async findAll(@Param('courseId') courseId: string) {
    return this.modulesService.findByCourse(courseId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.modulesService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.modulesService.delete(id);
  }

  @Put('reorder')
  async reorder(@Param('courseId') courseId: string, @Body() dto: ReorderModulesDto) {
    return this.modulesService.reorder(courseId, dto.moduleIds);
  }

  @Put('lessons/move')
  async moveLesson(@Body() dto: MoveLesonToModuleDto) {
    return this.modulesService.moveLessonToModule(
      dto.lessonId,
      dto.moduleId ?? null,
      dto.orderIndex,
    );
  }
}
