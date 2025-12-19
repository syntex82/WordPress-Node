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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CoursesService } from '../services/courses.service';
import { CoursePlaceholderService } from '../services/course-placeholder.service';
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto } from '../dto/course.dto';
import * as path from 'path';
import * as fs from 'fs';

@Controller('api/lms/admin/courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly placeholderService: CoursePlaceholderService,
  ) {}

  // Static routes MUST come before parameterized routes
  @Get('categories/list')
  async getCategories() {
    return this.coursesService.getCategories();
  }

  @Get('dashboard/stats')
  async getDashboardStats(@Request() req) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.coursesService.getAdminDashboardStats(isAdmin ? undefined : req.user.id);
  }

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

  // Parameterized routes come AFTER static routes
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @Request() req) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.coursesService.update(id, dto, req.user.id, isAdmin);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.coursesService.delete(id, req.user.id, isAdmin);
  }

  @Post('placeholder/regenerate')
  async regeneratePlaceholder() {
    const url = await this.placeholderService.regeneratePlaceholder();
    return { url };
  }
}

/**
 * Public Courses Controller - No Auth Required
 * Serves course placeholder images
 */
@Controller('api/lms/courses')
export class PublicCoursesController {
  constructor(private readonly placeholderService: CoursePlaceholderService) {}

  @Get('placeholder-image')
  async getPlaceholderImage(@Res() res: Response) {
    const url = await this.placeholderService.getCoursePlaceholder();
    const filePath = path.join(process.cwd(), url);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      fs.createReadStream(filePath).pipe(res);
    } else {
      // Fallback to redirect if file doesn't exist yet
      res.redirect(url);
    }
  }
}
