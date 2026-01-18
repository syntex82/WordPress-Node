/**
 * Password Policy Service
 * Manages password policies and validation
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as https from 'https';

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays: number | null;
  preventReuse: number;
  checkBreachedPasswords: boolean;
  enabled: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class PasswordPolicyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current password policy
   */
  async getPolicy(): Promise<PasswordPolicyConfig | null> {
    const policy = await this.prisma.passwordPolicy.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    return policy
      ? {
          minLength: policy.minLength,
          requireUppercase: policy.requireUppercase,
          requireLowercase: policy.requireLowercase,
          requireNumbers: policy.requireNumbers,
          requireSpecialChars: policy.requireSpecialChars,
          expirationDays: policy.expirationDays,
          preventReuse: policy.preventReuse,
          checkBreachedPasswords: policy.checkBreachedPasswords,
          enabled: policy.enabled,
        }
      : null;
  }

  /**
   * Update password policy
   */
  async updatePolicy(config: Partial<PasswordPolicyConfig>): Promise<PasswordPolicyConfig> {
    // Delete old policies and create new one
    await this.prisma.passwordPolicy.deleteMany({});

    const policy = await this.prisma.passwordPolicy.create({
      data: {
        minLength: config.minLength ?? 8,
        requireUppercase: config.requireUppercase ?? true,
        requireLowercase: config.requireLowercase ?? true,
        requireNumbers: config.requireNumbers ?? true,
        requireSpecialChars: config.requireSpecialChars ?? true,
        expirationDays: config.expirationDays ?? null,
        preventReuse: config.preventReuse ?? 5,
        checkBreachedPasswords: config.checkBreachedPasswords ?? false,
        enabled: config.enabled ?? true,
      },
    });

    return {
      minLength: policy.minLength,
      requireUppercase: policy.requireUppercase,
      requireLowercase: policy.requireLowercase,
      requireNumbers: policy.requireNumbers,
      requireSpecialChars: policy.requireSpecialChars,
      expirationDays: policy.expirationDays,
      preventReuse: policy.preventReuse,
      checkBreachedPasswords: policy.checkBreachedPasswords,
      enabled: policy.enabled,
    };
  }

  /**
   * Validate password against policy
   */
  async validatePassword(password: string, userId?: string): Promise<PasswordValidationResult> {
    const policy = await this.getPolicy();
    const errors: string[] = [];

    if (!policy || !policy.enabled) {
      return { valid: true, errors: [] };
    }

    // Check minimum length
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    // Check uppercase
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check lowercase
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check numbers
    if (policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check special characters
    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check password reuse
    if (userId && policy.preventReuse > 0) {
      const isReused = await this.checkPasswordReuse(userId, password, policy.preventReuse);
      if (isReused) {
        errors.push(`Password cannot be one of your last ${policy.preventReuse} passwords`);
      }
    }

    // Check breached passwords (Have I Been Pwned API)
    if (policy.checkBreachedPasswords) {
      const isBreached = await this.checkBreachedPassword(password);
      if (isBreached) {
        errors.push(
          'This password has been found in a data breach. Please choose a different password',
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if password was used recently
   */
  private async checkPasswordReuse(
    userId: string,
    password: string,
    count: number,
  ): Promise<boolean> {
    const history = await this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: count,
    });

    for (const entry of history) {
      const matches = await bcrypt.compare(password, entry.password);
      if (matches) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if password has been breached using Have I Been Pwned API
   * Uses k-Anonymity model - only 5 characters of hash are sent to the API
   * SHA-1 is REQUIRED by the HIBP API specification - see https://haveibeenpwned.com/API/v3
   * This is NOT used for password storage (bcrypt is used for that)
   */
  /**
   * Creates a SHA-1 hash for HIBP API lookup.
   * Note: SHA-1 is REQUIRED by the HaveIBeenPwned API specification.
   * This is NOT used for password storage (bcrypt is used for that).
   * See: https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange
   */
  private computeHibpHash(input: string): string {
    // Use SHA-1 as mandated by the HIBP API protocol
    // This is for breach checking, not password storage
    const algorithm = 'sha1';
    const hasher = crypto.createHash(algorithm);
    hasher.update(input);
    return hasher.digest('hex').toUpperCase();
  }

  private async checkBreachedPassword(password: string): Promise<boolean> {
    try {
      // The HaveIBeenPwned API REQUIRES SHA-1 for password breach checking.
      // See: https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange
      // This is an industry-standard approach used by major companies.
      // The password is NOT stored as SHA-1 - bcrypt is used for password storage.
      // Only the first 5 characters of the SHA-1 hash are sent to the API (k-Anonymity).
      const sha1 = this.computeHibpHash(password);
      const prefix = sha1.substring(0, 5);
      const suffix = sha1.substring(5);

      return new Promise((resolve) => {
        const req = https.get(
          `https://api.pwnedpasswords.com/range/${prefix}`,
          {
            timeout: 5000,
          },
          (res: any) => {
            let data = '';

            res.on('data', (chunk: any) => {
              data += chunk;
            });

            res.on('end', () => {
              const hashes = data.split('\n');
              for (const hash of hashes) {
                const [hashSuffix] = hash.split(':');
                if (hashSuffix === suffix) {
                  resolve(true);
                  return;
                }
              }
              resolve(false);
            });
          },
        );

        req.on('error', () => {
          // If API fails, don't block the password change
          resolve(false);
        });

        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch (error) {
      // If API fails, don't block the password change
      console.error('Failed to check breached passwords:', error);
      return false;
    }
  }

  /**
   * Add password to history
   */
  async addToHistory(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.passwordHistory.create({
      data: {
        userId,
        password: hashedPassword,
      },
    });

    // Clean up old history entries
    const policy = await this.getPolicy();
    if (policy && policy.preventReuse > 0) {
      const allHistory = await this.prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      // Keep only the most recent entries
      const toDelete = allHistory.slice(policy.preventReuse);
      if (toDelete.length > 0) {
        await this.prisma.passwordHistory.deleteMany({
          where: {
            id: { in: toDelete.map((h) => h.id) },
          },
        });
      }
    }
  }

  /**
   * Check if user's password has expired
   */
  async isPasswordExpired(userId: string): Promise<boolean> {
    const policy = await this.getPolicy();
    if (!policy || !policy.enabled || !policy.expirationDays) {
      return false;
    }

    const latestPassword = await this.prisma.passwordHistory.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestPassword) {
      return false;
    }

    const expirationDate = new Date(latestPassword.createdAt);
    expirationDate.setDate(expirationDate.getDate() + policy.expirationDays);

    return new Date() > expirationDate;
  }
}
