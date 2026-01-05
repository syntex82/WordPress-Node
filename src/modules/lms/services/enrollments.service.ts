/**
 * Enrollments Service for LMS Module
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SystemEmailService } from '../../email/system-email.service';
import { EmailService } from '../../email/email.service';
import { EnrollCourseDto, UpdateEnrollmentDto } from '../dto/enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private systemEmailService: SystemEmailService,
    private emailService: EmailService,
  ) {}

  async enroll(courseId: string, userId: string, dto: EnrollCourseDto) {
    // Check if course exists and is published
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { name: true } },
        _count: { select: { lessons: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'PUBLISHED')
      throw new BadRequestException('Course is not available for enrollment');

    // Check if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (existing) throw new BadRequestException('Already enrolled in this course');

    // Check payment for paid courses
    if (course.priceType === 'PAID' && !dto.paymentId) {
      throw new BadRequestException('Payment required for this course');
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        courseId,
        userId,
        status: 'ACTIVE',
        paymentId: dto.paymentId,
      },
      include: {
        course: { select: { id: true, title: true, slug: true, featuredImage: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Send course enrollment email (non-blocking)
    try {
      const siteContext = await this.emailService.getSiteContext();
      await this.systemEmailService.sendCourseEnrollmentEmail({
        to: enrollment.user.email,
        toName: enrollment.user.name,
        userId: enrollment.user.id,
        firstName: enrollment.user.name.split(' ')[0] || enrollment.user.name,
        course: {
          title: course.title,
          description: course.shortDescription || undefined,
          thumbnail: course.featuredImage || undefined,
          instructor: course.instructor?.name,
          lessons: course._count.lessons,
          duration: course.estimatedHours ? `${course.estimatedHours} hours` : undefined,
        },
        courseUrl: `${siteContext.frontendUrl}/courses/${course.slug}`,
      });
    } catch (error) {
      console.error('Failed to send course enrollment email:', error);
      // Don't fail enrollment if email fails
    }

    return enrollment;
  }

  async findUserEnrollments(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true,
            _count: { select: { lessons: true } },
          },
        },
      },
    });

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const [completedLessons, totalLessons] = await Promise.all([
          this.prisma.lessonProgress.count({
            where: { courseId: enrollment.courseId, userId, lessonCompleted: true },
          }),
          this.prisma.lesson.count({ where: { courseId: enrollment.courseId } }),
        ]);

        return {
          ...enrollment,
          progress: {
            completedLessons,
            totalLessons,
            percent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          },
        };
      }),
    );

    return enrollmentsWithProgress;
  }

  async findCourseEnrollments(courseId: string) {
    return this.prisma.enrollment.findMany({
      where: { courseId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  async findOne(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
      include: {
        course: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async isEnrolled(courseId: string, userId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    return !!enrollment && enrollment.status === 'ACTIVE';
  }

  async update(courseId: string, userId: string, dto: UpdateEnrollmentDto) {
    await this.findOne(courseId, userId);
    return this.prisma.enrollment.update({
      where: { courseId_userId: { courseId, userId } },
      data: dto,
    });
  }

  async cancel(courseId: string, userId: string) {
    const enrollment = await this.findOne(courseId, userId);
    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'CANCELLED' },
    });
  }

  async complete(courseId: string, userId: string) {
    const enrollment = await this.findOne(courseId, userId);
    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async getEnrollmentStats(courseId: string) {
    const [total, active, completed] = await Promise.all([
      this.prisma.enrollment.count({ where: { courseId } }),
      this.prisma.enrollment.count({ where: { courseId, status: 'ACTIVE' } }),
      this.prisma.enrollment.count({ where: { courseId, status: 'COMPLETED' } }),
    ]);
    return { total, active, completed };
  }
}
