/**
 * Two-Factor Authentication Service
 * Handles TOTP-based 2FA for user accounts
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventType } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private securityEvents: SecurityEventsService,
  ) {}

  /**
   * Generate a new 2FA secret for a user
   */
  async generateSecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `WordPress Node (${user.email})`,
      issuer: 'WordPress Node CMS',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  /**
   * Enable 2FA for a user
   */
  async enable2FA(userId: string, secret: string, token: string, ip?: string) {
    // Verify the token before enabling
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Generate recovery codes
    const recoveryCodes = this.generateRecoveryCodes(8);
    const hashedCodes = await Promise.all(recoveryCodes.map((code) => bcrypt.hash(code, 10)));

    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        recoveryCodes: hashedCodes,
      },
    });

    // Log the event
    await this.securityEvents.createEvent({
      userId,
      type: SecurityEventType.TWO_FA_ENABLED,
      ip,
    });

    return { recoveryCodes };
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string, password: string, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify password before disabling
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null as any,
        recoveryCodes: null as any,
      },
    });

    // Log the event
    await this.securityEvents.createEvent({
      userId,
      type: SecurityEventType.TWO_FA_DISABLED,
      ip,
    });

    return { success: true };
  }

  /**
   * Verify a 2FA token
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, recoveryCodes: true },
    });

    if (!user || !user.twoFactorSecret) {
      return false;
    }

    // Try TOTP verification first
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (isValid) return true;

    // Try recovery codes
    if (user.recoveryCodes && Array.isArray(user.recoveryCodes)) {
      for (const hashedCode of user.recoveryCodes as string[]) {
        const matches = await bcrypt.compare(token, hashedCode);
        if (matches) {
          // Remove used recovery code
          const updatedCodes = (user.recoveryCodes as string[]).filter(
            (code) => code !== hashedCode,
          );
          await this.prisma.user.update({
            where: { id: userId },
            data: { recoveryCodes: updatedCodes },
          });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate random recovery codes
   */
  private generateRecoveryCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code.match(/.{1,4}/g)!.join('-'));
    }
    return codes;
  }
}
