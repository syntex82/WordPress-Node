/**
 * Certificates Service for LMS Module
 */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ProgressService } from './progress.service';
import { CertificateGeneratorService } from './certificate-generator.service';
import * as crypto from 'crypto';

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService,
    private certificateGenerator: CertificateGeneratorService,
  ) {}

  private generateCertificateNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `CERT-${timestamp}-${random}`;
  }

  private generateVerificationHash(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async issueCertificate(courseId: string, userId: string) {
    // Check if course has certificates enabled
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: { select: { name: true } } },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (!course.certificateEnabled) {
      throw new BadRequestException('This course does not offer certificates');
    }

    // Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    // Check if certificate already exists
    const existing = await this.prisma.certificate.findFirst({
      where: { courseId, userId, revokedAt: null },
      include: {
        course: { select: { title: true, instructor: { select: { name: true } } } },
        user: { select: { name: true } },
      },
    });
    if (existing) return existing;

    // Verify course completion
    const progress = await this.progressService.getCourseProgress(courseId, userId);
    if (!progress.isComplete) {
      throw new BadRequestException('Course not completed yet');
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const certificateNumber = this.generateCertificateNumber();
    const verificationHash = this.generateVerificationHash();

    // Generate PDF certificate
    const { pdfUrl } = await this.certificateGenerator.generateCertificatePDF({
      certificateNumber,
      studentName: user?.name || 'Student',
      courseName: course.title,
      instructorName: course.instructor.name || 'Instructor',
      issuedAt: new Date(),
      verificationHash,
    });

    // Create certificate record
    const certificate = await this.prisma.certificate.create({
      data: {
        certificateNumber,
        courseId,
        userId,
        verificationHash,
        pdfUrl,
        metadata: {
          courseTitleAtIssue: course.title,
          instructorName: course.instructor.name,
          studentName: user?.name,
          issuedDate: new Date().toISOString(),
        },
      },
      include: {
        course: { select: { title: true, instructor: { select: { name: true } } } },
        user: { select: { name: true } },
      },
    });

    // Mark enrollment as completed
    await this.prisma.enrollment.update({
      where: { courseId_userId: { courseId, userId } },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    return certificate;
  }

  async findByUser(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId, revokedAt: null },
      include: {
        course: { select: { title: true, slug: true, featuredImage: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
      include: {
        course: { select: { title: true, instructor: { select: { name: true } } } },
        user: { select: { name: true } },
      },
    });
    if (!certificate) throw new NotFoundException('Certificate not found');
    return certificate;
  }

  async verify(hash: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verificationHash: hash },
      include: {
        course: { select: { title: true } },
        user: { select: { name: true } },
      },
    });

    if (!certificate) {
      return { valid: false, message: 'Certificate not found' };
    }

    if (certificate.revokedAt) {
      return {
        valid: false,
        message: 'This certificate has been revoked',
        revokedAt: certificate.revokedAt,
        revokedReason: certificate.revokedReason,
      };
    }

    return {
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        courseName: certificate.course.title,
        studentName: certificate.user.name,
        issuedAt: certificate.issuedAt,
      },
    };
  }

  async revoke(id: string, reason: string) {
    const certificate = await this.findOne(id);
    if (certificate.revokedAt) {
      throw new BadRequestException('Certificate already revoked');
    }

    return this.prisma.certificate.update({
      where: { id },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  async checkAndIssueCertificate(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course?.certificateEnabled) return null;

    const progress = await this.progressService.getCourseProgress(courseId, userId);
    if (!progress.isComplete) return null;

    const existing = await this.prisma.certificate.findFirst({
      where: { courseId, userId, revokedAt: null },
    });
    if (existing) return existing;

    return this.issueCertificate(courseId, userId);
  }
}

