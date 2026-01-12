/**
 * Licensing Service
 * Core service for license management in NodePress
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LicenseKeyGenerator } from './license-key-generator.service';
import { CreateLicenseDto, LicenseTier, LICENSE_TIER_CONFIG, ActivateLicenseDto } from './dto';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class LicensingService {
  private readonly logger = new Logger(LicensingService.name);

  constructor(
    private prisma: PrismaService,
    private keyGenerator: LicenseKeyGenerator,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a secure download token
   */
  private generateDownloadToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

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
   * Send license email to customer with download link
   */
  private async sendLicenseEmail(license: any) {
    const tierConfig = LICENSE_TIER_CONFIG[license.tier as LicenseTier];
    const customerName = license.customerName || 'Customer';
    const maxSites = license.maxSites === -1 ? 'Unlimited' : license.maxSites;
    const expiresAt = license.expiresAt ? license.expiresAt.toDateString() : 'Never (Lifetime)';
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Generate download token and store it
    const downloadToken = this.generateDownloadToken();
    const tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.systemConfig.upsert({
      where: { key: `license_download_${license.id}` },
      create: {
        key: `license_download_${license.id}`,
        value: JSON.stringify({
          token: downloadToken,
          licenseId: license.id,
          email: license.email,
          tier: license.tier,
          expiresAt: tokenExpiry.toISOString(),
          downloadCount: 0,
        }),
        group: 'license_downloads',
        description: `Download token for license ${license.id}`,
      },
      update: {
        value: JSON.stringify({
          token: downloadToken,
          licenseId: license.id,
          email: license.email,
          tier: license.tier,
          expiresAt: tokenExpiry.toISOString(),
          downloadCount: 0,
        }),
      },
    });

    const downloadUrl = `${baseUrl}/api/licensing/download/${downloadToken}`;
    const documentationUrl = `${baseUrl}/docs`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .license-key { background: #1f2937; color: #10b981; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px; word-break: break-all; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
          .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Thank You for Your Purchase!</h1>
            <p>NodePress ${tierConfig.name} License</p>
          </div>
          <div class="content">
            <p>Hello ${customerName},</p>
            <p>Thank you for purchasing NodePress ${tierConfig.name}! Your license is ready to use.</p>

            <h3>📥 Download NodePress</h3>
            <p>Click the button below to download the NodePress source code:</p>
            <p><a href="${downloadUrl}" class="button">Download NodePress</a></p>
            <p style="font-size: 12px; color: #6b7280;">This download link is valid for 30 days.</p>

            <h3>🔑 Your License Key</h3>
            <div class="license-key">${license.licenseKey}</div>

            <div class="info-box">
              <p><strong>License Details:</strong></p>
              <p>• Tier: ${tierConfig.name}</p>
              <p>• Max Sites: ${maxSites}</p>
              <p>• Updates Until: ${expiresAt}</p>
            </div>

            <h3>🚀 Getting Started</h3>
            <ol>
              <li>Download and extract NodePress</li>
              <li>Run <code>npm install</code></li>
              <li>Configure your <code>.env</code> file with your license key</li>
              <li>Run <code>npm run dev</code> to start</li>
            </ol>

            <p><a href="${documentationUrl}">📚 Read the Documentation</a></p>
          </div>
          <div class="footer">
            <p>Need help? Contact support@nodepress.co.uk</p>
            <p>© ${new Date().getFullYear()} NodePress. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.emailService.send({
      to: license.email,
      toName: customerName,
      subject: `🎉 Your NodePress ${tierConfig.name} License & Download`,
      html,
    });
  }

  /**
   * Get all licenses (admin)
   */
  async getAllLicenses() {
    return this.prisma.license.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get license stats (admin)
   */
  async getLicenseStats() {
    const licenses = await this.prisma.license.findMany();

    const now = new Date();
    const activeLicenses = licenses.filter(l =>
      l.status === 'ACTIVE' && (!l.expiresAt || l.expiresAt > now)
    );

    const byTier: Record<string, number> = {};
    let revenue = 0;

    for (const license of licenses) {
      byTier[license.tier] = (byTier[license.tier] || 0) + 1;
      const tierConfig = LICENSE_TIER_CONFIG[license.tier as LicenseTier];
      if (tierConfig) {
        revenue += tierConfig.price;
      }
    }

    return {
      totalLicenses: licenses.length,
      activeLicenses: activeLicenses.length,
      revenue,
      byTier,
    };
  }

  /**
   * Revoke license by ID (admin)
   */
  async revokeLicenseById(id: string) {
    const license = await this.prisma.license.findUnique({ where: { id } });
    if (!license) {
      throw new NotFoundException('License not found');
    }
    return this.revokeLicense(license.licenseKey, 'Revoked by admin');
  }

  /**
   * Find download token by token string
   */
  async findDownloadToken(token: string) {
    // Search all license download records for matching token
    const records = await this.prisma.systemConfig.findMany({
      where: {
        group: 'license_downloads',
      },
    });

    for (const record of records) {
      try {
        const data = JSON.parse(record.value);
        if (data.token === token) {
          return record;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Increment download count for a token
   */
  async incrementDownloadCount(key: string) {
    const record = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (record) {
      const data = JSON.parse(record.value);
      data.downloadCount = (data.downloadCount || 0) + 1;
      await this.prisma.systemConfig.update({
        where: { key },
        data: { value: JSON.stringify(data) },
      });
    }
  }
}

