/**
 * Authentication Service
 * Handles login, token generation, and password validation
 * Enhanced with security features: rate limiting, account lockout, 2FA
 */

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../../database/prisma.service';
import { SecurityEventType } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { getPasswordResetTemplate } from '../email/templates/password-reset-template';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;
  private readonly PASSWORD_RESET_EXPIRY_HOURS = 1;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Remove password from returned user object
    const { password: _password, ...result } = user;
    void _password; // Intentionally unused
    return result;
  }

  /**
   * Login user and generate JWT token
   * Enhanced with security tracking, account lockout, and 2FA
   */
  async login(loginDto: LoginDto, ip?: string, userAgent?: string) {
    // Find user first (before validation)
    const user = await this.usersService.findByEmail(loginDto.email);

    // Check if account is locked
    if (user && user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      await this.logSecurityEvent(user.id, SecurityEventType.LOCKOUT_TRIGGERED, ip, userAgent);
      const minutesLeft = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Account is locked due to too many failed login attempts. Try again in ${minutesLeft} minutes.`,
      );
    }

    // Validate credentials
    const validatedUser = await this.validateUser(loginDto.email, loginDto.password);

    if (!validatedUser) {
      // Handle failed login
      if (user) {
        await this.handleFailedLogin(user.id, ip, userAgent);
      } else {
        // Log failed attempt even if user doesn't exist (for security monitoring)
        await this.logSecurityEvent(null, SecurityEventType.FAILED_LOGIN, ip, userAgent, {
          email: loginDto.email,
        });
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (validatedUser.twoFactorEnabled) {
      // Return a temporary token indicating 2FA is required
      return {
        requires2FA: true,
        tempToken: this.jwtService.sign(
          { email: validatedUser.email, sub: validatedUser.id, temp: true },
          { expiresIn: '5m' },
        ),
        user: {
          id: validatedUser.id,
          email: validatedUser.email,
          name: validatedUser.name,
        },
      };
    }

    // Successful login - reset failed attempts and update last login
    await this.handleSuccessfulLogin(validatedUser.id, ip);

    const payload = { email: validatedUser.email, sub: validatedUser.id, role: validatedUser.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: validatedUser.id,
        email: validatedUser.email,
        name: validatedUser.name,
        role: validatedUser.role,
        twoFactorEnabled: validatedUser.twoFactorEnabled,
      },
    };
  }

  /**
   * Register new user
   */
  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Password is already excluded by the create method's select clause
    return user;
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (_error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Complete 2FA login
   */
  async verify2FAAndLogin(
    tempToken: string,
    twoFactorCode: string,
    ip?: string,
    userAgent?: string,
  ) {
    // Verify temp token
    let payload: any;
    try {
      payload = this.jwtService.verify(tempToken);
      if (!payload.temp) {
        throw new Error('Invalid token');
      }
    } catch (_error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA not configured');
    }

    // Verify 2FA code using speakeasy
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2,
    });

    if (!isValid) {
      // Check recovery codes
      let recoveryCodeValid = false;
      if (user.recoveryCodes && Array.isArray(user.recoveryCodes)) {
        for (const hashedCode of user.recoveryCodes as string[]) {
          const matches = await bcrypt.compare(twoFactorCode, hashedCode);
          if (matches) {
            recoveryCodeValid = true;
            // Remove used recovery code
            const updatedCodes = (user.recoveryCodes as string[]).filter(
              (code) => code !== hashedCode,
            );
            await this.prisma.user.update({
              where: { id: user.id },
              data: { recoveryCodes: updatedCodes },
            });
            break;
          }
        }
      }

      if (!recoveryCodeValid) {
        await this.logSecurityEvent(user.id, SecurityEventType.FAILED_2FA, ip, userAgent);
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Successful 2FA - complete login
    await this.handleSuccessfulLogin(user.id, ip);

    const finalPayload = { email: user.email, sub: user.id, role: user.role };

    return {
      access_token: this.jwtService.sign(finalPayload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(userId: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const failedAttempts = user.failedLoginAttempts + 1;
    const updateData: any = {
      failedLoginAttempts: failedAttempts,
      lastFailedLogin: new Date(),
    };

    // Lock account if too many failed attempts
    if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      updateData.accountLockedUntil = lockoutUntil;

      await this.logSecurityEvent(userId, SecurityEventType.LOCKOUT_TRIGGERED, ip, userAgent, {
        failedAttempts,
        lockoutUntil,
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await this.logSecurityEvent(userId, SecurityEventType.FAILED_LOGIN, ip, userAgent);
  }

  /**
   * Handle successful login
   */
  private async handleSuccessfulLogin(userId: string, ip?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    await this.logSecurityEvent(userId, SecurityEventType.SUCCESS_LOGIN, ip);
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    userId: string | null,
    type: SecurityEventType,
    ip?: string,
    userAgent?: string,
    metadata?: any,
  ) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId,
          type,
          ip,
          userAgent,
          metadata: metadata || {},
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Request password reset - generates token and sends email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success message to prevent email enumeration
    const successMessage = { message: 'If an account with that email exists, a password reset link has been sent.' };

    if (!user) {
      return successMessage;
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + this.PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    // Save hashed token to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      },
    });

    // Build reset URL using dynamic site context from database
    const siteContext = await this.emailService.getSiteContext();
    const resetUrl = `${siteContext.adminUrl}/reset-password?token=${resetToken}`;
    const supportUrl = `mailto:${siteContext.supportEmail}`;

    // Get email template
    const emailHtml = getPasswordResetTemplate({
      user: { firstName: user.name.split(' ')[0] || user.name },
      resetUrl,
      expiresIn: `${this.PASSWORD_RESET_EXPIRY_HOURS} hour`,
      supportUrl,
    });

    // Send email
    try {
      await this.emailService.send({
        to: user.email,
        toName: user.name,
        subject: 'Reset Your Password',
        html: emailHtml,
        recipientId: user.id,
        metadata: { type: 'password_reset' },
      });

      // Log security event
      await this.logSecurityEvent(
        user.id,
        SecurityEventType.PASSWORD_RESET_REQUESTED,
        undefined,
        undefined,
        { email: user.email },
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Still return success to prevent email enumeration
    }

    return successMessage;
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Validate password strength
    this.validatePasswordStrength(newPassword);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    });

    // Add to password history
    await this.prisma.passwordHistory.create({
      data: {
        userId: user.id,
        password: hashedPassword,
      },
    });

    // Log security event
    await this.logSecurityEvent(
      user.id,
      SecurityEventType.PASSWORD_CHANGE,
      undefined,
      undefined,
      { method: 'reset_token' },
    );

    return { message: 'Password has been reset successfully. You can now log in with your new password.' };
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};\':"|,.<>\/?`~]/.test(password);

    const errors: string[] = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumber) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecial) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('. '));
    }
  }
}
