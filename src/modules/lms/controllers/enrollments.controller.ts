/**
 * Enrollments Controller for LMS Module
 * Handles enrollment management
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
import { EnrollmentsService } from '../services/enrollments.service';
import { EnrollCourseDto, UpdateEnrollmentDto } from '../dto/enrollment.dto';

@Controller('api/lms')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  // Student endpoints
  @Post('courses/:courseId/enroll')
  async enroll(@Param('courseId') courseId: string, @Body() dto: EnrollCourseDto, @Request() req) {
    return this.enrollmentsService.enroll(courseId, req.user.id, dto);
  }

  @Get('my-enrollments')
  async getMyEnrollments(@Request() req) {
    return this.enrollmentsService.findUserEnrollments(req.user.id);
  }

  @Get('courses/:courseId/enrollment')
  async getMyEnrollment(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.findOne(courseId, req.user.id);
  }

  @Delete('courses/:courseId/enrollment')
  async cancelEnrollment(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.cancel(courseId, req.user.id);
  }

  // Admin endpoints
  @Get('admin/courses/:courseId/enrollments')
  async getCourseEnrollments(@Param('courseId') courseId: string) {
    return this.enrollmentsService.findCourseEnrollments(courseId);
  }

  @Get('admin/courses/:courseId/enrollments/stats')
  async getEnrollmentStats(@Param('courseId') courseId: string) {
    return this.enrollmentsService.getEnrollmentStats(courseId);
  }

  @Put('admin/courses/:courseId/enrollments/:userId')
  async updateEnrollment(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(courseId, userId, dto);
  }
}
