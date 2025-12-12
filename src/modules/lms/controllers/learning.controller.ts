/**
 * Learning Controller for LMS Module
 * Handles student learning experience
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { CoursesService } from '../services/courses.service';
import { LessonsService } from '../services/lessons.service';
import { QuizzesService } from '../services/quizzes.service';
import { ProgressService } from '../services/progress.service';
import { CertificatesService } from '../services/certificates.service';
import { CourseQueryDto } from '../dto/course.dto';
import { UpdateProgressDto } from '../dto/lesson.dto';
import { SubmitQuizDto } from '../dto/quiz.dto';

@Controller('api/lms')
export class LearningController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly lessonsService: LessonsService,
    private readonly quizzesService: QuizzesService,
    private readonly progressService: ProgressService,
    private readonly certificatesService: CertificatesService,
  ) {}

  // Public course catalog
  @Get('courses')
  @UseGuards(OptionalJwtAuthGuard)
  async getCourses(@Query() query: CourseQueryDto) {
    return this.coursesService.findPublished(query);
  }

  @Get('courses/categories')
  async getCategories() {
    return this.coursesService.getCategories();
  }

  @Get('courses/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async getCourse(@Param('slug') slug: string) {
    return this.coursesService.findBySlug(slug);
  }

  // Protected learning endpoints
  @Get('learn/:courseId')
  @UseGuards(JwtAuthGuard)
  async getCourseForLearning(@Param('courseId') courseId: string, @Request() req) {
    const [course, progress] = await Promise.all([
      this.coursesService.findOne(courseId),
      this.progressService.getCourseProgress(courseId, req.user.id),
    ]);
    return { course, progress };
  }

  @Get('learn/:courseId/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  async getLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req,
  ) {
    return this.lessonsService.getLessonForLearning(lessonId, req.user.id);
  }

  @Put('learn/:courseId/lessons/:lessonId/progress')
  @UseGuards(JwtAuthGuard)
  async updateProgress(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateProgressDto,
    @Request() req,
  ) {
    const progress = await this.progressService.updateProgress(lessonId, req.user.id, dto);
    
    // Check for certificate issuance
    await this.certificatesService.checkAndIssueCertificate(courseId, req.user.id);
    
    return progress;
  }

  @Post('learn/:courseId/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  async markLessonComplete(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req,
  ) {
    const progress = await this.progressService.markComplete(lessonId, req.user.id);
    
    // Check for certificate issuance
    await this.certificatesService.checkAndIssueCertificate(courseId, req.user.id);
    
    return progress;
  }

  // Quiz endpoints
  @Get('learn/:courseId/quizzes/:quizId')
  @UseGuards(JwtAuthGuard)
  async getQuiz(
    @Param('quizId') quizId: string,
    @Request() req,
  ) {
    return this.quizzesService.getQuizForStudent(quizId, req.user.id);
  }

  @Post('learn/:courseId/quizzes/:quizId/start')
  @UseGuards(JwtAuthGuard)
  async startQuiz(
    @Param('courseId') courseId: string,
    @Param('quizId') quizId: string,
    @Request() req,
  ) {
    return this.quizzesService.startAttempt(quizId, req.user.id, courseId);
  }

  @Post('learn/:courseId/quizzes/:quizId/attempts/:attemptId/submit')
  @UseGuards(JwtAuthGuard)
  async submitQuiz(
    @Param('courseId') courseId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitQuizDto,
    @Request() req,
  ) {
    const result = await this.quizzesService.submitAttempt(attemptId, dto, req.user.id);
    
    // Check for certificate issuance
    await this.certificatesService.checkAndIssueCertificate(courseId, req.user.id);
    
    return result;
  }

  // Student dashboard
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Request() req) {
    return this.progressService.getUserDashboard(req.user.id);
  }
}

