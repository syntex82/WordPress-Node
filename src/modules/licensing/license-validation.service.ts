/**
 * License Validation Service
 * Validates and checks license status for NodePress installations
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LicenseKeyGenerator } from './license-key-generator.service';

export interface ValidationResult {
  valid: boolean;
  tier?: string;
  features?: string[];
  expiresAt?: Date | null;
  maxSites?: number;
  activeSites?: number;
  error?: string;
  requiresUpgrade?: boolean;
}

@Injectable()
export class LicenseValidationService {
  private readonly logger = new Logger(LicenseValidationService.name);

  constructor(
    private prisma: PrismaService,
    private keyGenerator: LicenseKeyGenerator,
  ) {}

  /**
   * Validate a license key and check activation status
   */
  async validateLicense(licenseKey: string, domain?: string): Promise<ValidationResult> {
    try {
      // First, decode the key cryptographically
      const decoded = this.keyGenerator.decodeKey(licenseKey);
      if (!decoded.valid) {
        return { valid: false, error: decoded.error };
      }

      // Find license in database
      const license = await this.prisma.license.findUnique({
        where: { licenseKey },
        include: {
          activations: { where: { isActive: true } },
        },
      });

      if (!license) {
        return { valid: false, error: 'License not found in database' };
      }

      // Check license status
      if (license.status !== 'ACTIVE') {
        return { 
          valid: false, 
          error: `License is ${license.status.toLowerCase()}`,
          requiresUpgrade: license.status === 'EXPIRED',
        };
      }

      // Check expiration
      if (license.expiresAt && license.expiresAt < new Date()) {
        // Update status in database
        await this.prisma.license.update({
          where: { id: license.id },
          data: { status: 'EXPIRED' },
        });
        return { 
          valid: false, 
          error: 'License has expired',
          requiresUpgrade: true,
        };
      }

      // Check domain activation if provided
      if (domain) {
        const isActivated = license.activations.some(
          a => a.domain.toLowerCase() === domain.toLowerCase()
        );
        
        if (!isActivated) {
          // Check if we can activate more sites
          const activeSites = license.activations.length;
          if (license.maxSites !== -1 && activeSites >= license.maxSites) {
            return {
              valid: false,
              error: `Maximum site limit (${license.maxSites}) reached`,
              activeSites,
              maxSites: license.maxSites,
              requiresUpgrade: true,
            };
          }
        }
      }

      // Update last validated timestamp
      await this.prisma.license.update({
        where: { id: license.id },
        data: { lastValidated: new Date() },
      });

      return {
        valid: true,
        tier: license.tier,
        features: license.features as string[],
        expiresAt: license.expiresAt,
        maxSites: license.maxSites,
        activeSites: license.activations.length,
      };
    } catch (error) {
      this.logger.error('License validation error:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }

  /**
   * Check if a license has a specific feature
   */
  async hasFeature(licenseKey: string, feature: string): Promise<boolean> {
    const result = await this.validateLicense(licenseKey);
    if (!result.valid || !result.features) return false;
    return result.features.includes(feature);
  }

  /**
   * Get license statistics
   */
  async getLicenseStats() {
    const [total, active, expired, byTier] = await Promise.all([
      this.prisma.license.count(),
      this.prisma.license.count({ where: { status: 'ACTIVE' } }),
      this.prisma.license.count({ where: { status: 'EXPIRED' } }),
      this.prisma.license.groupBy({
        by: ['tier'],
        _count: { id: true },
      }),
    ]);

    return {
      total,
      active,
      expired,
      byTier: byTier.reduce((acc, item) => {
        acc[item.tier] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

