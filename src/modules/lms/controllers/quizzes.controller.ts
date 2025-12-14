/**
 * Quizzes Controller for LMS Module
 * Handles admin quiz management
 */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { QuizzesService } from '../services/quizzes.service';
import {
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
} from '../dto/quiz.dto';

@Controller('api/lms/admin/courses/:courseId/quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  async create(@Param('courseId') courseId: string, @Body() dto: CreateQuizDto) {
    return this.quizzesService.create(courseId, dto);
  }

  @Get()
  async findByCourse(@Param('courseId') courseId: string) {
    return this.quizzesService.findByCourse(courseId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.quizzesService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.quizzesService.delete(id);
  }

  // Question management
  @Post(':quizId/questions')
  async addQuestion(@Param('quizId') quizId: string, @Body() dto: CreateQuestionDto) {
    return this.quizzesService.addQuestion(quizId, dto);
  }

  @Put('questions/:questionId')
  async updateQuestion(@Param('questionId') questionId: string, @Body() dto: UpdateQuestionDto) {
    return this.quizzesService.updateQuestion(questionId, dto);
  }

  @Delete('questions/:questionId')
  async deleteQuestion(@Param('questionId') questionId: string) {
    return this.quizzesService.deleteQuestion(questionId);
  }

  @Put(':quizId/questions/reorder')
  async reorderQuestions(@Param('quizId') quizId: string, @Body() body: { questionIds: string[] }) {
    return this.quizzesService.reorderQuestions(quizId, body.questionIds);
  }
}
