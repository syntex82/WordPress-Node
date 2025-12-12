/**
 * Lessons Service for LMS Module
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateLessonDto, UpdateLessonDto, CreateVideoAssetDto } from '../dto/lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async create(courseId: string, dto: CreateLessonDto) {
    // Get the max order index for existing lessons
    const maxOrder = await this.prisma.lesson.aggregate({
      where: { courseId },
      _max: { orderIndex: true },
    });

    const orderIndex = dto.orderIndex ?? (maxOrder._max.orderIndex ?? -1) + 1;

    return this.prisma.lesson.create({
      data: {
        ...dto,
        courseId,
        orderIndex,
      },
      include: {
        videoAsset: true,
      },
    });
  }

  async findByCourse(courseId: string) {
    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        videoAsset: true,
        quiz: { select: { id: true, title: true } },
      },
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true, instructorId: true, status: true },
        },
        videoAsset: true,
        quiz: true,
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto) {
    await this.findOne(id);
    return this.prisma.lesson.update({
      where: { id },
      data: dto,
      include: {
        videoAsset: true,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.lesson.delete({ where: { id } });
    return { message: 'Lesson deleted successfully' };
  }

  async reorder(courseId: string, lessonIds: string[]) {
    const updates = lessonIds.map((id, index) =>
      this.prisma.lesson.update({
        where: { id },
        data: { orderIndex: index },
      })
    );
    await this.prisma.$transaction(updates);
    return this.findByCourse(courseId);
  }

  // Video Asset Management
  async createVideoAsset(dto: CreateVideoAssetDto) {
    return this.prisma.videoAsset.create({
      data: {
        provider: dto.provider as any || 'UPLOAD',
        url: dto.url,
        playbackId: dto.playbackId,
        filePath: dto.filePath,
        durationSeconds: dto.durationSeconds,
        isProtected: dto.isProtected ?? true,
        thumbnailUrl: dto.thumbnailUrl,
      },
    });
  }

  async getVideoAsset(id: string) {
    const asset = await this.prisma.videoAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Video asset not found');
    return asset;
  }

  async deleteVideoAsset(id: string) {
    await this.getVideoAsset(id);
    await this.prisma.videoAsset.delete({ where: { id } });
    return { message: 'Video asset deleted successfully' };
  }

  // Get lesson for learning (with access check)
  async getLessonForLearning(lessonId: string, userId: string) {
    const lesson = await this.findOne(lessonId);
    
    // Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: lesson.course.id,
          userId,
        },
      },
    });

    // Allow access if preview or enrolled
    if (!lesson.isPreview && !enrollment) {
      throw new ForbiddenException('You must be enrolled to access this lesson');
    }

    // Get progress
    const progress = await this.prisma.lessonProgress.findUnique({
      where: {
        courseId_lessonId_userId: {
          courseId: lesson.course.id,
          lessonId,
          userId,
        },
      },
    });

    return { lesson, progress, isEnrolled: !!enrollment };
  }
}

