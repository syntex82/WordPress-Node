/**
 * Lessons Service for LMS Module
 * Enhanced with video upload and external video support
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateLessonDto, UpdateLessonDto, CreateVideoAssetDto } from '../dto/lesson.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LessonsService {
  private videoUploadDir = path.join(process.cwd(), 'uploads', 'videos');

  constructor(private prisma: PrismaService) {
    this.ensureVideoDir();
  }

  private async ensureVideoDir() {
    try {
      await fs.access(this.videoUploadDir);
    } catch {
      await fs.mkdir(this.videoUploadDir, { recursive: true });
    }
  }

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
      }),
    );
    await this.prisma.$transaction(updates);
    return this.findByCourse(courseId);
  }

  // Video Asset Management
  async createVideoAsset(dto: CreateVideoAssetDto) {
    return this.prisma.videoAsset.create({
      data: {
        provider: (dto.provider as any) || 'UPLOAD',
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

  // Upload video file for a lesson
  async uploadVideo(courseId: string, lessonId: string, file: Express.Multer.File, userId: string) {
    const lesson = await this.findOne(lessonId);

    // Verify course ownership
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        throw new ForbiddenException('Not authorized to upload videos to this course');
      }
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${courseId}-${lessonId}-${Date.now()}${ext}`;
    const filepath = path.join(this.videoUploadDir, filename);

    // Save file
    await fs.writeFile(filepath, file.buffer);

    // Create video asset
    const videoAsset = await this.prisma.videoAsset.create({
      data: {
        provider: 'UPLOAD',
        url: `/uploads/videos/${filename}`,
        filePath: filepath,
        isProtected: true,
      },
    });

    // Attach to lesson
    const updatedLesson = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { videoAssetId: videoAsset.id },
      include: { videoAsset: true },
    });

    return updatedLesson;
  }

  // Attach external video (YouTube, Vimeo, Wistia, etc.)
  async attachExternalVideo(
    lessonId: string,
    dto: { provider: string; url: string; playbackId?: string; durationSeconds?: number },
  ) {
    await this.findOne(lessonId);

    // Create video asset for external video
    const videoAsset = await this.prisma.videoAsset.create({
      data: {
        provider: dto.provider.toUpperCase() as any,
        url: dto.url,
        playbackId: dto.playbackId,
        durationSeconds: dto.durationSeconds,
        isProtected: false, // External videos handle their own protection
      },
    });

    // Attach to lesson
    const updatedLesson = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { videoAssetId: videoAsset.id, type: 'VIDEO' },
      include: { videoAsset: true },
    });

    return updatedLesson;
  }

  // Remove video from lesson
  async removeVideo(lessonId: string) {
    const lesson = await this.findOne(lessonId);

    if (lesson.videoAsset) {
      // Delete file if it's an upload
      if (lesson.videoAsset.filePath) {
        try {
          await fs.unlink(lesson.videoAsset.filePath);
        } catch (e) {
          console.error('Failed to delete video file:', e);
        }
      }

      // Delete video asset
      await this.prisma.videoAsset.delete({ where: { id: lesson.videoAsset.id } });
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { videoAssetId: null },
    });
  }
}
