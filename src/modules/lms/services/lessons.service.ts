/**
 * Lessons Service for LMS Module
 * Enhanced with video upload and external video support
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  /**
   * Validate that a file path is within the video upload directory (prevent path traversal)
   */
  private validateVideoPath(filePath: string): boolean {
    const videoBase = path.resolve(this.videoUploadDir);
    const resolvedPath = path.resolve(filePath);
    return resolvedPath.startsWith(videoBase);
  }

  /**
   * Sanitize a filename to only allow safe characters
   */
  private sanitizeFileName(filename: string): string {
    let safe = '';
    const truncated = String(filename || '').substring(0, 255);
    for (const char of truncated) {
      if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') ||
          (char >= '0' && char <= '9') || char === '-' || char === '_' || char === '.') {
        safe += char;
      }
    }
    // Prevent hidden files and directory traversal
    safe = safe.replace(/^\.+/, '').replace(/\.+$/, '').replace(/\.{2,}/g, '.');
    return safe || 'file';
  }

  /**
   * Create a safe file path within the video directory
   */
  private createSafeVideoPath(filename: string): string {
    const safeFilename = this.sanitizeFileName(filename);
    const filepath = path.join(this.videoUploadDir, safeFilename);
    const resolved = path.resolve(filepath);
    const resolvedDir = path.resolve(this.videoUploadDir);
    if (!resolved.startsWith(resolvedDir + path.sep)) {
      throw new ForbiddenException('Invalid file path');
    }
    return filepath;
  }

  async create(courseId: string, dto: CreateLessonDto) {
    // Get the max order index for existing lessons
    const maxOrder = await this.prisma.lesson.aggregate({
      where: { courseId },
      _max: { orderIndex: true },
    });

    const orderIndex = dto.orderIndex ?? (maxOrder._max.orderIndex ?? -1) + 1;

    const lesson = await this.prisma.lesson.create({
      data: {
        ...dto,
        courseId,
        orderIndex,
      },
      include: {
        videoAsset: true,
        quiz: true,
      },
    });

    // Auto-create quiz for QUIZ type lessons
    if (dto.type === 'QUIZ' && !lesson.quiz) {
      const quiz = await this.prisma.quiz.create({
        data: {
          courseId,
          lessonId: lesson.id,
          title: dto.title,
          description: dto.content || '',
          isRequired: dto.isRequired ?? true,
        },
      });
      return { ...lesson, quiz };
    }

    return lesson;
  }

  async findByCourse(courseId: string) {
    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        videoAsset: true,
        quiz: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
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
    // Verify lesson exists
    await this.findOne(lessonId);

    // Verify course ownership
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        throw new ForbiddenException('Not authorized to upload videos to this course');
      }
    }

    // Sanitize IDs for filename (only alphanumeric and hyphens)
    const safeCourseId = this.sanitizeFileName(courseId);
    const safeLessonId = this.sanitizeFileName(lessonId);

    // Sanitize extension (only allow video extensions)
    const origExt = path.extname(file.originalname).toLowerCase();
    let ext = '.mp4';
    if (['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(origExt)) {
      ext = origExt;
    }

    // Generate safe filename
    const safeFilename = `${safeCourseId}-${safeLessonId}-${Date.now()}${ext}`;
    const filepath = this.createSafeVideoPath(safeFilename);

    // Save file
    await fs.writeFile(filepath, file.buffer);

    // Create video asset
    const videoAsset = await this.prisma.videoAsset.create({
      data: {
        provider: 'UPLOAD',
        url: `/uploads/videos/${safeFilename}`,
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
      // Delete file if it's an upload (with path traversal protection)
      if (lesson.videoAsset.filePath && this.validateVideoPath(lesson.videoAsset.filePath)) {
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
