/**
 * Progress Service for LMS Module
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateProgressDto } from '../dto/lesson.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  // Video watch completion threshold (percentage)
  private readonly VIDEO_COMPLETION_THRESHOLD = 90;

  async updateProgress(lessonId: string, userId: string, dto: UpdateProgressDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { videoAsset: true, course: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: lesson.courseId, userId } },
    });
    if (!enrollment) throw new ForbiddenException('You must be enrolled to track progress');

    // Determine if lesson should be auto-completed
    let lessonCompleted = dto.lessonCompleted;
    if (!lessonCompleted && dto.videoWatchedSeconds && lesson.videoAsset?.durationSeconds) {
      const watchedPercent = (dto.videoWatchedSeconds / lesson.videoAsset.durationSeconds) * 100;
      if (watchedPercent >= this.VIDEO_COMPLETION_THRESHOLD) {
        lessonCompleted = true;
      }
    }

    const progress = await this.prisma.lessonProgress.upsert({
      where: {
        courseId_lessonId_userId: {
          courseId: lesson.courseId,
          lessonId,
          userId,
        },
      },
      update: {
        videoWatchedSeconds: dto.videoWatchedSeconds ?? undefined,
        lessonCompleted: lessonCompleted ?? undefined,
        completedAt: lessonCompleted ? new Date() : undefined,
        lastAccessedAt: new Date(),
      },
      create: {
        courseId: lesson.courseId,
        lessonId,
        userId,
        videoWatchedSeconds: dto.videoWatchedSeconds ?? 0,
        lessonCompleted: lessonCompleted ?? false,
        completedAt: lessonCompleted ? new Date() : null,
      },
    });

    return progress;
  }

  async markComplete(lessonId: string, userId: string) {
    return this.updateProgress(lessonId, userId, { lessonCompleted: true });
  }

  async getCourseProgress(courseId: string, userId: string) {
    const [lessons, progressRecords, quizAttempts] = await Promise.all([
      this.prisma.lesson.findMany({
        where: { courseId },
        orderBy: { orderIndex: 'asc' },
        select: { id: true, title: true, type: true, isRequired: true },
      }),
      this.prisma.lessonProgress.findMany({
        where: { courseId, userId },
      }),
      this.prisma.quizAttempt.findMany({
        where: { courseId, userId, passed: true },
        distinct: ['quizId'],
        select: { quizId: true },
      }),
    ]);

    const progressMap = new Map(progressRecords.map((p) => [p.lessonId, p]));
    const passedQuizIds = new Set(quizAttempts.map((a) => a.quizId));

    const lessonProgress = lessons.map((lesson) => ({
      ...lesson,
      progress: progressMap.get(lesson.id) || null,
      completed: progressMap.get(lesson.id)?.lessonCompleted || false,
    }));

    const completedCount = lessonProgress.filter((l) => l.completed).length;
    const totalCount = lessons.length;

    // Find next incomplete lesson
    const nextLesson = lessonProgress.find((l) => !l.completed);

    // Get required quizzes
    const requiredQuizzes = await this.prisma.quiz.findMany({
      where: { courseId, isRequired: true },
      select: { id: true, title: true },
    });

    const allRequiredQuizzesPassed = requiredQuizzes.every((q) => passedQuizIds.has(q.id));

    return {
      lessons: lessonProgress,
      completedLessons: completedCount,
      totalLessons: totalCount,
      percentComplete: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      nextLesson,
      requiredQuizzes: requiredQuizzes.map((q) => ({
        ...q,
        passed: passedQuizIds.has(q.id),
      })),
      allRequiredQuizzesPassed,
      isComplete: completedCount === totalCount && allRequiredQuizzesPassed,
    };
  }

  async getNextLesson(courseId: string, userId: string) {
    const progress = await this.getCourseProgress(courseId, userId);
    return progress.nextLesson;
  }

  async getUserDashboard(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
      include: {
        course: {
          select: { id: true, title: true, slug: true, featuredImage: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await this.getCourseProgress(enrollment.courseId, userId);
        return {
          ...enrollment,
          progress,
        };
      }),
    );

    const certificates = await this.prisma.certificate.findMany({
      where: { userId, revokedAt: null },
      include: { course: { select: { title: true } } },
      orderBy: { issuedAt: 'desc' },
    });

    return {
      enrollments: coursesWithProgress,
      certificates,
      stats: {
        totalCourses: enrollments.length,
        completedCourses: enrollments.filter((e) => e.status === 'COMPLETED').length,
        totalCertificates: certificates.length,
      },
    };
  }
}
