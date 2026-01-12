/**
 * Licensing Service
 * Core service for license management in NodePress
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LicenseKeyGenerator } from './license-key-generator.service';
import { CreateLicenseDto, LicenseTier, LICENSE_TIER_CONFIG, ActivateLicenseDto } from './dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class LicensingService {
  private readonly logger = new Logger(LicensingService.name);

  constructor(
    private prisma: PrismaService,
    private keyGenerator: LicenseKeyGenerator,
    private emailService: EmailService,
  ) {}

  /**
   * Create a new license after purchase
   */
  async createLicense(dto: CreateLicenseDto) {
    const tierConfig = LICENSE_TIER_CONFIG[dto.tier];
    if (!tierConfig) {
      throw new BadRequestException(`Invalid license tier: ${dto.tier}`);
    }

    // Calculate expiration
    const expiresAt = tierConfig.lifetime 
      ? null 
      : new Date(Date.now() + tierConfig.updatePeriodDays * 24 * 60 * 60 * 1000);

    // Generate license key
    const licenseKey = this.keyGenerator.generateKey({
      email: dto.email,
      tier: dto.tier,
      expiresAt: expiresAt || undefined,
      maxSites: tierConfig.maxSites,
      features: tierConfig.features,
    });

    // Create license in database
    const license = await this.prisma.license.create({
      data: {
        licenseKey,
        email: dto.email.toLowerCase(),
        tier: dto.tier,
        status: 'ACTIVE',
        maxSites: tierConfig.maxSites,
        features: tierConfig.features,
        expiresAt,
        customerName: dto.customerName,
        companyName: dto.companyName,
        purchaseOrderId: dto.orderId,
      },
    });

    // Send license email
    try {
      await this.sendLicenseEmail(license);
    } catch (error) {
      this.logger.warn('Failed to send license email:', error.message);
    }

    this.logger.log(`License created: ${license.id} (${dto.tier}) for ${dto.email}`);
    return license;
  }

  /**
   * Activate license on a domain
   */
  async activateLicense(dto: ActivateLicenseDto) {
    const license = await this.prisma.license.findUnique({
      where: { licenseKey: dto.licenseKey },
      include: { activations: { where: { isActive: true } } },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    if (license.status !== 'ACTIVE') {
      throw new BadRequestException(`License is ${license.status.toLowerCase()}`);
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      throw new BadRequestException('License has expired');
    }

    // Check if already activated on this domain
    const existingActivation = license.activations.find(
      a => a.domain.toLowerCase() === dto.domain.toLowerCase()
    );

    if (existingActivation) {
      // Update last seen
      await this.prisma.licenseActivation.update({
        where: { id: existingActivation.id },
        data: { lastSeenAt: new Date() },
      });
      return { success: true, message: 'License already activated', activation: existingActivation };
    }

    // Check site limit
    if (license.maxSites !== -1 && license.activations.length >= license.maxSites) {
      throw new BadRequestException(
        `Site limit reached (${license.maxSites}). Upgrade your license for more sites.`
      );
    }

    // Create activation
    const activation = await this.prisma.licenseActivation.create({
      data: {
        licenseId: license.id,
        domain: dto.domain.toLowerCase(),
        serverInfo: dto.serverInfo || {},
      },
    });

    this.logger.log(`License ${license.id} activated on ${dto.domain}`);

    return {
      success: true,
      message: 'License activated successfully',
      activation,
      license: {
        tier: license.tier,
        features: license.features,
        expiresAt: license.expiresAt,
        remainingSites: license.maxSites === -1 ? 'unlimited' : license.maxSites - license.activations.length - 1,
      },
    };
  }

  /**
   * Deactivate license from a domain
   */
  async deactivateLicense(licenseKey: string, domain: string) {
    const license = await this.prisma.license.findUnique({
      where: { licenseKey },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    await this.prisma.licenseActivation.updateMany({
      where: {
        licenseId: license.id,
        domain: domain.toLowerCase(),
      },
      data: { isActive: false },
    });

    return { success: true, message: 'License deactivated from domain' };
  }

  /**
   * Get license by key
   */
  async getLicenseByKey(licenseKey: string) {
    return this.prisma.license.findUnique({
      where: { licenseKey },
      include: { activations: true },
    });
  }

  /**
   * Get licenses by email
   */
  async getLicensesByEmail(email: string) {
    return this.prisma.license.findMany({
      where: { email: email.toLowerCase() },
      include: { activations: { where: { isActive: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Transfer license to new owner
   */
  async transferLicense(licenseKey: string, newEmail: string, newCustomerName?: string) {
    const license = await this.prisma.license.findUnique({
      where: { licenseKey },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    const updated = await this.prisma.license.update({
      where: { id: license.id },
      data: {
        email: newEmail.toLowerCase(),
        customerName: newCustomerName || license.customerName,
        metadata: {
          ...(license.metadata as object || {}),
          transferHistory: [
            ...((license.metadata as any)?.transferHistory || []),
            { from: license.email, to: newEmail, date: new Date().toISOString() },
          ],
        },
      },
    });

    return updated;
  }

  /**
   * Renew an expired license
   */
  async renewLicense(licenseKey: string, years: number = 1) {
    const license = await this.prisma.license.findUnique({
      where: { licenseKey },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    const tierConfig = LICENSE_TIER_CONFIG[license.tier as LicenseTier];
    if (tierConfig.lifetime) {
      throw new BadRequestException('Lifetime licenses do not need renewal');
    }

    const baseDate = license.expiresAt && license.expiresAt > new Date()
      ? license.expiresAt
      : new Date();

    const newExpiry = new Date(baseDate);
    newExpiry.setFullYear(newExpiry.getFullYear() + years);

    const updated = await this.prisma.license.update({
      where: { id: license.id },
      data: {
        status: 'ACTIVE',
        expiresAt: newExpiry,
      },
    });

    return updated;
  }

  /**
   * Revoke a license
   */
  async revokeLicense(licenseKey: string, reason?: string) {
    const license = await this.prisma.license.findUnique({
      where: { licenseKey },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    return this.prisma.license.update({
      where: { id: license.id },
      data: {
        status: 'REVOKED',
        metadata: {
          ...(license.metadata as object || {}),
          revokedReason: reason,
          revokedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * List all licenses (admin)
   */
  async listLicenses(params: {
    page?: number;
    limit?: number;
    tier?: LicenseTier;
    status?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, tier, status, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tier) where.tier = tier;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { licenseKey: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [licenses, total] = await Promise.all([
      this.prisma.license.findMany({
        where,
        include: { activations: { where: { isActive: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.license.count({ where }),
    ]);

    return {
      licenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Send license email to customer
   */
  private async sendLicenseEmail(license: any) {
    const tierConfig = LICENSE_TIER_CONFIG[license.tier as LicenseTier];
    const customerName = license.customerName || 'Customer';
    const maxSites = license.maxSites === -1 ? 'Unlimited' : license.maxSites;
    const expiresAt = license.expiresAt ? license.expiresAt.toDateString() : 'Never (Lifetime)';
    const downloadUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/downloads/nodepress`;
    const documentationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/docs`;

    const html = `
      <h1>Your NodePress ${tierConfig.name} License</h1>
      <p>Hello ${customerName},</p>
      <p>Thank you for purchasing NodePress ${tierConfig.name}!</p>
      <p><strong>License Key:</strong> ${license.licenseKey}</p>
      <p><strong>Max Sites:</strong> ${maxSites}</p>
      <p><strong>Expires:</strong> ${expiresAt}</p>
      <p><a href="${downloadUrl}">Download NodePress</a></p>
      <p><a href="${documentationUrl}">Documentation</a></p>
    `;

    await this.emailService.send({
      to: license.email,
      toName: customerName,
      subject: `Your NodePress ${tierConfig.name} License`,
      html,
    });
  }
}

