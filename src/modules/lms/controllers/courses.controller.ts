/**
 * Courses Controller for LMS Module
 * Handles admin course management
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
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CoursesService } from '../services/courses.service';
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto } from '../dto/course.dto';

@Controller('api/lms/admin/courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  async create(@Body() dto: CreateCourseDto, @Request() req) {
    return this.coursesService.create(dto, req.user.id);
  }

  @Get()
  async findAll(@Query() query: CourseQueryDto, @Request() req) {
    // Admins see all, instructors see their own
    const isAdmin = req.user.role === 'ADMIN';
    if (!isAdmin) {
      query.instructorId = req.user.id;
    }
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @Request() req,
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.coursesService.update(id, dto, req.user.id, isAdmin);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.coursesService.delete(id, req.user.id, isAdmin);
  }

  @Get('categories/list')
  async getCategories() {
    return this.coursesService.getCategories();
  }

  @Get('dashboard/stats')
  async getDashboardStats(@Request() req) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.coursesService.getAdminDashboardStats(isAdmin ? undefined : req.user.id);
  }
}

