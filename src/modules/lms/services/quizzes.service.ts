/**
 * Quizzes Service for LMS Module
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  SubmitQuizDto,
} from '../dto/quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async create(courseId: string, dto: CreateQuizDto) {
    const { questions, ...quizData } = dto;

    const quiz = await this.prisma.quiz.create({
      data: {
        ...quizData,
        courseId,
      },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    if (questions && questions.length > 0) {
      await this.prisma.question.createMany({
        data: questions.map((q, index) => ({
          ...q,
          quizId: quiz.id,
          orderIndex: q.orderIndex ?? index,
        })),
      });
      return this.findOne(quiz.id);
    }

    return quiz;
  }

  async findByCourse(courseId: string) {
    return this.prisma.quiz.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, passingScorePercent: true } },
        questions: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { attempts: true } },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async update(id: string, dto: UpdateQuizDto) {
    const { questions, ...quizData } = dto;
    await this.findOne(id);

    return this.prisma.quiz.update({
      where: { id },
      data: quizData,
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.quiz.delete({ where: { id } });
    return { message: 'Quiz deleted successfully' };
  }

  // Question management
  async addQuestion(quizId: string, dto: CreateQuestionDto) {
    const quiz = await this.findOne(quizId);
    const maxOrder =
      quiz.questions.length > 0 ? Math.max(...quiz.questions.map((q) => q.orderIndex)) + 1 : 0;

    return this.prisma.question.create({
      data: {
        ...dto,
        quizId,
        orderIndex: dto.orderIndex ?? maxOrder,
      },
    });
  }

  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');

    return this.prisma.question.update({
      where: { id: questionId },
      data: dto,
    });
  }

  async deleteQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');

    await this.prisma.question.delete({ where: { id: questionId } });
    return { message: 'Question deleted successfully' };
  }

  async reorderQuestions(quizId: string, questionIds: string[]) {
    const updates = questionIds.map((id, index) =>
      this.prisma.question.update({
        where: { id },
        data: { orderIndex: index },
      }),
    );
    await this.prisma.$transaction(updates);
    return this.findOne(quizId);
  }

  // Quiz attempt methods
  async startAttempt(quizId: string, userId: string, courseId: string) {
    const quiz = await this.findOne(quizId);

    // Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (!enrollment) throw new ForbiddenException('You must be enrolled to take this quiz');

    // Check attempt limit
    if (quiz.attemptsAllowed) {
      const attemptCount = await this.prisma.quizAttempt.count({
        where: { quizId, userId },
      });
      if (attemptCount >= quiz.attemptsAllowed) {
        throw new BadRequestException(`Maximum attempts (${quiz.attemptsAllowed}) reached`);
      }
    }

    // Get attempt number
    const lastAttempt = await this.prisma.quizAttempt.findFirst({
      where: { quizId, userId },
      orderBy: { attemptNumber: 'desc' },
    });

    // Prepare questions (shuffle if enabled)
    let questions = quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      optionsJson: q.optionsJson,
      points: q.points,
    }));
    if (quiz.shuffleQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: { quizId, courseId, userId, attemptNumber: (lastAttempt?.attemptNumber ?? 0) + 1 },
    });

    return {
      attempt,
      questions,
      timeLimitSeconds: quiz.timeLimitSeconds,
      attemptsRemaining: quiz.attemptsAllowed
        ? quiz.attemptsAllowed - (lastAttempt?.attemptNumber ?? 0) - 1
        : null,
    };
  }

  async submitAttempt(attemptId: string, dto: SubmitQuizDto, userId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
            course: { select: { passingScorePercent: true } },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Quiz attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not authorized');
    if (attempt.submittedAt) throw new BadRequestException('Quiz already submitted');

    // Check time limit
    if (attempt.quiz.timeLimitSeconds) {
      const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000;
      if (elapsed > attempt.quiz.timeLimitSeconds + 30) {
        // 30s grace period
        throw new BadRequestException('Time limit exceeded');
      }
    }

    // Score the quiz
    const { scorePercent, scorePoints, maxPoints, results } = this.scoreQuiz(
      attempt.quiz.questions,
      dto.answers,
    );

    const passingScore =
      attempt.quiz.passingScorePercent ?? attempt.quiz.course.passingScorePercent;
    const passed = scorePercent >= passingScore;
    const timeSpent = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        scorePercent,
        scorePoints,
        maxPoints,
        passed,
        answersJson: JSON.parse(JSON.stringify(dto.answers)),
        timeSpentSeconds: timeSpent,
      },
    });

    return {
      attempt: updatedAttempt,
      scorePercent,
      scorePoints,
      maxPoints,
      passed,
      passingScore,
      results, // Per-question results with explanations
    };
  }

  private scoreQuiz(questions: any[], answers: { questionId: string; answer: any }[]) {
    let scorePoints = 0;
    let maxPoints = 0;
    const results: any[] = [];

    for (const question of questions) {
      maxPoints += question.points;
      const userAnswer = answers.find((a) => a.questionId === question.id);
      const isCorrect = this.checkAnswer(question, userAnswer?.answer);

      if (isCorrect) scorePoints += question.points;

      results.push({
        questionId: question.id,
        correct: isCorrect,
        userAnswer: userAnswer?.answer,
        correctAnswer: question.correctAnswerJson,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0,
      });
    }

    const scorePercent = maxPoints > 0 ? Math.round((scorePoints / maxPoints) * 100) : 0;
    return { scorePercent, scorePoints, maxPoints, results };
  }

  private checkAnswer(question: any, userAnswer: any): boolean {
    if (!userAnswer) return false;
    const correct = question.correctAnswerJson;

    switch (question.type) {
      case 'MCQ':
      case 'SHORT_ANSWER':
        return String(userAnswer).toLowerCase().trim() === String(correct).toLowerCase().trim();
      case 'TRUE_FALSE':
        return Boolean(userAnswer) === Boolean(correct);
      case 'MCQ_MULTI':
        if (!Array.isArray(userAnswer) || !Array.isArray(correct)) return false;
        const sortedUser = [...userAnswer].sort();
        const sortedCorrect = [...correct].sort();
        return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
      case 'ESSAY':
        return true; // Essays need manual grading
      default:
        return false;
    }
  }

  async getAttemptHistory(quizId: string, userId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { attemptNumber: 'desc' },
    });
  }

  async getQuizForStudent(quizId: string, userId: string) {
    const quiz = await this.findOne(quizId);

    // Strip correct answers for students
    const questions = quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      optionsJson: q.optionsJson,
      points: q.points,
    }));

    const attempts = await this.getAttemptHistory(quizId, userId);

    return {
      ...quiz,
      questions,
      attempts,
      attemptsUsed: attempts.length,
      attemptsRemaining: quiz.attemptsAllowed ? quiz.attemptsAllowed - attempts.length : null,
    };
  }
}
