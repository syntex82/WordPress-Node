/**
 * Demo Verification Service
 * 
 * Handles email verification flow for demo access requests:
 * 1. User requests demo with business email
 * 2. System sends verification email with unique token
 * 3. User clicks verification link
 * 4. System creates demo and sends credentials
 * 
 * SECURITY: Prevents unauthorized demo access and spam requests
 */

import { Injectable, BadRequestException, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { EmailValidationService } from './email-validation.service';
import { DemoNotificationService } from '../demo-notification.service';
import { DemoService } from '../demo.service';
import * as crypto from 'crypto';

// Verification token expiration (24 hours)
const TOKEN_EXPIRATION_HOURS = 24;
// Maximum verification attempts before blocking
const MAX_VERIFICATION_ATTEMPTS = 5;
// Rate limit: max emails per hour
const MAX_EMAILS_PER_HOUR = 3;
// Rate limit window in milliseconds
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export interface DemoRequestDto {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  preferredSubdomain?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  demoCredentials?: {
    subdomain: string;
    accessUrl: string;
    adminEmail: string;
    adminPassword: string;
    expiresAt: Date;
  };
}

@Injectable()
export class DemoVerificationService {
  private readonly logger = new Logger(DemoVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly emailValidation: EmailValidationService,
    private readonly demoNotification: DemoNotificationService,
    private readonly demoService: DemoService,
  ) {}

  /**
   * Request a demo - Step 1: Validate email and send verification
   */
  async requestDemoVerification(
    dto: DemoRequestDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string; requiresVerification: boolean }> {
    const email = dto.email.toLowerCase().trim();

    // 1. Validate business email
    const emailValidation = await this.emailValidation.validateBusinessEmail(email);
    if (!emailValidation.valid) {
      throw new BadRequestException({
        message: emailValidation.reason,
        code: 'INVALID_EMAIL_DOMAIN',
        isBusinessEmail: false,
      });
    }

    // 2. Check if user already has an active demo
    const existingDemo = await this.prisma.demoInstance.findFirst({
      where: {
        email,
        status: { in: ['PENDING', 'PROVISIONING', 'RUNNING'] },
      },
    });

    if (existingDemo) {
      const baseUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
      const demoUrl = `${baseUrl}/demo/${existingDemo.subdomain}`;
      const expiresAt = existingDemo.expiresAt;
      const hoursRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));

      throw new ConflictException({
        message: `You already have an active demo that expires in ${hoursRemaining} hours.`,
        code: 'ACTIVE_DEMO_EXISTS',
        demoUrl,
        subdomain: existingDemo.subdomain,
        expiresAt,
        hoursRemaining,
      });
    }

    // 3. Check for pending verification
    const existingVerification = await this.prisma.demoVerification.findFirst({
      where: {
        email,
        status: 'PENDING',
        tokenExpiresAt: { gt: new Date() },
      },
    });

    if (existingVerification) {
      // Check rate limit for resending
      const canResend = await this.canResendVerificationEmail(existingVerification);
      if (!canResend) {
        throw new BadRequestException({
          message: 'Please wait before requesting another verification email. Check your inbox and spam folder.',
          code: 'RATE_LIMITED',
        });
      }

      // Resend verification email
      await this.resendVerificationEmail(existingVerification.id);
      return {
        success: true,
        message: 'A new verification email has been sent. Please check your inbox.',
        requiresVerification: true,
      };
    }

    // 4. Create new verification request
    const token = this.generateSecureToken();
    const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

    const verification = await this.prisma.demoVerification.create({
      data: {
        email,
        name: dto.name,
        company: dto.company,
        phone: dto.phone,
        preferredSubdomain: dto.preferredSubdomain,
        token,
        tokenExpiresAt,
        ipAddress,
        userAgent,
        status: 'PENDING',
      },
    });

    // 5. Send verification email
    await this.sendVerificationEmail(verification.id);

    this.logger.log(`Demo verification requested for ${email} (ID: ${verification.id})`);

    return {
      success: true,
      message: 'Please check your email to verify your address. Demo credentials will be sent after verification.',
      requiresVerification: true,
    };
  }

  /**
   * Verify email - Step 2: Validate token and create demo
   */
  async verifyEmailAndCreateDemo(token: string): Promise<VerificationResult> {
    // 1. Find verification by token
    const verification = await this.prisma.demoVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      throw new NotFoundException({
        message: 'Invalid verification link. Please request a new demo.',
        code: 'INVALID_TOKEN',
      });
    }

    // 2. Check if already verified or expired
    if (verification.status === 'COMPLETED') {
      return {
        success: true,
        message: 'Your email has already been verified and demo was created. Check your email for credentials.',
      };
    }

    if (verification.status === 'BLOCKED') {
      throw new BadRequestException({
        message: 'This verification has been blocked due to too many failed attempts. Please contact support.',
        code: 'VERIFICATION_BLOCKED',
      });
    }

    if (verification.status === 'EXPIRED' || verification.tokenExpiresAt < new Date()) {
      await this.prisma.demoVerification.update({
        where: { id: verification.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException({
        message: 'This verification link has expired. Please request a new demo.',
        code: 'TOKEN_EXPIRED',
      });
    }

    // 3. Increment attempt count and check for abuse
    const newAttemptCount = verification.verificationAttempts + 1;
    if (newAttemptCount > MAX_VERIFICATION_ATTEMPTS) {
      await this.prisma.demoVerification.update({
        where: { id: verification.id },
        data: { status: 'BLOCKED', verificationAttempts: newAttemptCount, lastAttemptAt: new Date() },
      });
      throw new BadRequestException({
        message: 'Too many verification attempts. Please contact support.',
        code: 'TOO_MANY_ATTEMPTS',
      });
    }

    // 4. Mark as verified
    await this.prisma.demoVerification.update({
      where: { id: verification.id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationAttempts: newAttemptCount,
        lastAttemptAt: new Date(),
      },
    });

    this.logger.log(`Email verified for ${verification.email} (ID: ${verification.id})`);

    // 5. Create the demo instance
    try {
      const demo = await this.demoService.createDemo({
        name: verification.name,
        email: verification.email,
        company: verification.company || undefined,
        phone: verification.phone || undefined,
        preferredSubdomain: verification.preferredSubdomain || undefined,
      });

      // 6. Update verification with demo instance ID
      await this.prisma.demoVerification.update({
        where: { id: verification.id },
        data: {
          status: 'COMPLETED',
          demoInstanceId: demo.id,
        },
      });

      this.logger.log(`Demo created for verified email ${verification.email} (Demo ID: ${demo.id})`);

      return {
        success: true,
        message: 'Email verified successfully! Your demo is being provisioned. Check your email for login credentials.',
        demoCredentials: {
          subdomain: demo.subdomain,
          accessUrl: demo.accessUrl,
          adminEmail: demo.adminEmail,
          adminPassword: demo.adminPassword,
          expiresAt: demo.expiresAt,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to create demo after verification: ${error.message}`);
      throw new BadRequestException({
        message: 'Failed to create demo. Please try again or contact support.',
        code: 'DEMO_CREATION_FAILED',
      });
    }
  }

  /**
   * Check if we can resend verification email (rate limiting)
   */
  private async canResendVerificationEmail(verification: any): Promise<boolean> {
    const timeSinceLastEmail = Date.now() - new Date(verification.lastEmailSentAt).getTime();
    if (timeSinceLastEmail < RATE_LIMIT_WINDOW_MS && verification.emailSentCount >= MAX_EMAILS_PER_HOUR) {
      return false;
    }
    return true;
  }

  /**
   * Resend verification email
   */
  private async resendVerificationEmail(verificationId: string): Promise<void> {
    const verification = await this.prisma.demoVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) return;

    // Update email count
    await this.prisma.demoVerification.update({
      where: { id: verificationId },
      data: {
        emailSentCount: { increment: 1 },
        lastEmailSentAt: new Date(),
      },
    });

    await this.sendVerificationEmail(verificationId);
  }

  /**
   * Send verification email
   */
  private async sendVerificationEmail(verificationId: string): Promise<void> {
    const verification = await this.prisma.demoVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) return;

    const verificationUrl = this.getVerificationUrl(verification.token);
    const expiresInHours = TOKEN_EXPIRATION_HOURS;

    // Use demoNotification service to send email
    await this.demoNotification.sendVerificationEmail({
      to: verification.email,
      name: verification.name,
      verificationUrl,
      expiresInHours,
    });

    this.logger.log(`Verification email sent to ${verification.email}`);
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get verification URL
   */
  private getVerificationUrl(token: string): string {
    const baseUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    return `${baseUrl}/api/demos/verify/${token}`;
  }

  /**
   * Cleanup expired verifications (called by scheduler)
   */
  async cleanupExpiredVerifications(): Promise<number> {
    const result = await this.prisma.demoVerification.updateMany({
      where: {
        status: 'PENDING',
        tokenExpiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} expired verifications`);
    }

    return result.count;
  }
}
