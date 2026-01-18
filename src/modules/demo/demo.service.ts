import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { CreateDemoDto, ExtendDemoDto } from './dto/create-demo.dto';
import { DemoStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { SampleDataSeederService } from './sample-data-seeder.service';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  // Configuration defaults
  private readonly DEFAULT_DEMO_HOURS = 24;
  private readonly MAX_DEMO_HOURS = 72;
  private readonly BASE_PORT = 4000;
  private readonly MAX_CONCURRENT_DEMOS = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sampleDataSeeder: SampleDataSeederService,
  ) {}

  /**
   * Create a new demo instance
   */
  async createDemo(dto: CreateDemoDto) {
    // Check if email already has an active demo
    const existingDemo = await this.prisma.demoInstance.findFirst({
      where: {
        email: dto.email,
        status: { in: ['PENDING', 'PROVISIONING', 'RUNNING'] },
      },
    });

    if (existingDemo) {
      throw new ConflictException(
        'You already have an active demo. Please wait for it to expire or contact support.',
      );
    }

    // Check concurrent demo limit
    const activeCount = await this.prisma.demoInstance.count({
      where: { status: { in: ['PENDING', 'PROVISIONING', 'RUNNING'] } },
    });

    if (activeCount >= this.MAX_CONCURRENT_DEMOS) {
      throw new BadRequestException(
        'Demo system is at capacity. Please try again later.',
      );
    }

    // Generate unique subdomain
    const subdomain = await this.generateSubdomain(dto.preferredSubdomain, dto.name);
    
    // Find available port
    const port = await this.findAvailablePort();
    
    // Generate credentials
    const adminPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const accessToken = randomBytes(32).toString('hex');

    // Calculate expiration
    const demoHours = await this.getConfigValue('demo_hours', this.DEFAULT_DEMO_HOURS);
    const expiresAt = new Date(Date.now() + demoHours * 60 * 60 * 1000);

    // Create demo instance record
    const demo = await this.prisma.demoInstance.create({
      data: {
        subdomain,
        name: dto.name,
        email: dto.email,
        company: dto.company,
        phone: dto.phone,
        databaseName: `demo_${subdomain.replace(/-/g, '_')}`,
        port,
        adminEmail: dto.email,
        adminPassword: hashedPassword,
        accessToken,
        expiresAt,
        status: 'PENDING',
      },
    });

    // Trigger async provisioning
    this.provisionDemo(demo.id).catch((err) => {
      this.logger.error(`Failed to provision demo ${demo.id}:`, err);
    });

    return {
      id: demo.id,
      subdomain: demo.subdomain,
      accessToken,
      adminEmail: dto.email,
      adminPassword, // Only returned on creation
      expiresAt: demo.expiresAt,
      status: demo.status,
      accessUrl: this.getDemoUrl(subdomain),
      message: 'Demo is being provisioned. You will receive an email when ready.',
    };
  }

  /**
   * Get demo instance by access token
   */
  async getDemoByToken(accessToken: string) {
    const demo = await this.prisma.demoInstance.findUnique({
      where: { accessToken },
    });

    if (!demo) {
      throw new NotFoundException('Demo not found');
    }

    return this.formatDemoResponse(demo);
  }

  /**
   * Get demo instance by ID (admin)
   */
  async getDemoById(id: string) {
    const demo = await this.prisma.demoInstance.findUnique({
      where: { id },
      include: {
        accessLogs: { take: 100, orderBy: { createdAt: 'desc' } },
        featureUsage: { take: 100, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!demo) {
      throw new NotFoundException('Demo not found');
    }

    return demo;
  }

  /**
   * List all demos with filtering
   */
  async listDemos(options: {
    status?: DemoStatus;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { status, page = 1, limit = 20, search } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [demos, total] = await Promise.all([
      this.prisma.demoInstance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.demoInstance.count({ where }),
    ]);

    return {
      demos: demos.map((d) => this.formatDemoResponse(d)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Extend demo expiration
   */
  async extendDemo(id: string, dto: ExtendDemoDto) {
    const demo = await this.prisma.demoInstance.findUnique({ where: { id } });
    if (!demo) throw new NotFoundException('Demo not found');

    const hoursToAdd = Math.min(dto.hours || 24, this.MAX_DEMO_HOURS);
    const newExpiry = new Date(demo.expiresAt.getTime() + hoursToAdd * 60 * 60 * 1000);

    const updated = await this.prisma.demoInstance.update({
      where: { id },
      data: { expiresAt: newExpiry },
    });

    return this.formatDemoResponse(updated);
  }

  /**
   * Terminate a demo instance
   */
  async terminateDemo(id: string) {
    const demo = await this.prisma.demoInstance.findUnique({ where: { id } });
    if (!demo) throw new NotFoundException('Demo not found');

    await this.cleanupDemoResources(demo);

    await this.prisma.demoInstance.update({
      where: { id },
      data: { status: 'TERMINATED' },
    });

    return { success: true, message: 'Demo terminated successfully' };
  }

  /**
   * Record feature usage
   */
  async recordFeatureUsage(demoId: string, feature: string, action: string, metadata?: any) {
    await this.prisma.demoFeatureUsage.create({
      data: { demoInstanceId: demoId, feature, action, metadata },
    });

    // Update demo stats
    await this.prisma.demoInstance.update({
      where: { id: demoId },
      data: {
        lastAccessedAt: new Date(),
        requestCount: { increment: 1 },
      },
    });
  }

  /**
   * Record access log
   */
  async recordAccessLog(demoId: string, data: {
    ipAddress?: string;
    userAgent?: string;
    path: string;
    method: string;
    statusCode?: number;
    responseTime?: number;
  }) {
    await this.prisma.demoAccessLog.create({
      data: { demoInstanceId: demoId, ...data },
    });
  }

  /**
   * Get demo analytics
   */
  async getDemoAnalytics() {
    const [
      totalDemos,
      activeDemos,
      expiredDemos,
      upgradeRequests,
      featureStats,
    ] = await Promise.all([
      this.prisma.demoInstance.count(),
      this.prisma.demoInstance.count({ where: { status: 'RUNNING' } }),
      this.prisma.demoInstance.count({ where: { status: 'EXPIRED' } }),
      this.prisma.demoInstance.count({ where: { upgradeRequested: true } }),
      this.prisma.demoFeatureUsage.groupBy({
        by: ['feature'],
        _count: { feature: true },
        orderBy: { _count: { feature: 'desc' } },
        take: 10,
      }),
    ]);

    // Get demos created per day (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDemos = await this.prisma.demoInstance.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });

    const demosByDay = recentDemos.reduce((acc: Record<string, number>, d) => {
      const day = d.createdAt.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: { totalDemos, activeDemos, expiredDemos, upgradeRequests },
      topFeatures: featureStats.map((f) => ({ feature: f.feature, count: f._count.feature })),
      demosByDay,
      conversionRate: totalDemos > 0 ? (upgradeRequests / totalDemos) * 100 : 0,
    };
  }

  /**
   * Request upgrade from demo
   */
  async requestUpgrade(accessToken: string, notes?: string) {
    const demo = await this.prisma.demoInstance.findUnique({ where: { accessToken } });
    if (!demo) throw new NotFoundException('Demo not found');

    await this.prisma.demoInstance.update({
      where: { id: demo.id },
      data: {
        upgradeRequested: true,
        upgradeRequestedAt: new Date(),
        notes: notes || demo.notes,
      },
    });

    // TODO: Send notification email to sales team

    return { success: true, message: 'Upgrade request submitted. Our team will contact you shortly.' };
  }

  // ==================== PROVISIONING ====================

  /**
   * Provision demo instance (async)
   *
   * SIMULATED DEMO MODE:
   * - Seeds isolated sample data tagged with demoInstanceId
   * - Demo users can only see/modify their own demo data
   * - Real data (demoInstanceId = null) is never accessible to demos
   */
  private async provisionDemo(demoId: string) {
    const demo = await this.prisma.demoInstance.findUnique({ where: { id: demoId } });
    if (!demo) return;

    try {
      await this.prisma.demoInstance.update({
        where: { id: demoId },
        data: { status: 'PROVISIONING' },
      });

      this.logger.log(`Provisioning demo: ${demo.subdomain}`);

      // Seed isolated sample data for this demo
      // All data is tagged with demoInstanceId for security isolation
      const { adminUserId } = await this.sampleDataSeeder.seedAll(
        demoId, // demoInstanceId - CRITICAL for isolation
        demo.adminEmail,
        demo.adminPassword, // Already hashed
      );

      this.logger.log(`Demo data seeded for: ${demo.subdomain}, admin: ${adminUserId}`);

      // Mark as running
      await this.prisma.demoInstance.update({
        where: { id: demoId },
        data: { status: 'RUNNING', startedAt: new Date() },
      });

      // TODO: Send welcome email with access details

      this.logger.log(`Demo provisioned: ${demo.subdomain}`);
    } catch (error) {
      this.logger.error(`Provisioning failed for ${demo.subdomain}:`, error);
      await this.prisma.demoInstance.update({
        where: { id: demoId },
        data: { status: 'ERROR' },
      });
    }
  }

  /**
   * Cleanup demo resources
   * Deletes all data tagged with the demo's ID
   */
  private async cleanupDemoResources(demo: any) {
    this.logger.log(`Cleaning up demo: ${demo.subdomain}`);

    try {
      // Delete all seeded demo data (uses cascade delete via demoInstanceId)
      await this.sampleDataSeeder.cleanupDemoData(demo.id);
      this.logger.log(`Demo data cleaned up for: ${demo.subdomain}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup demo data for ${demo.subdomain}:`, error);
    }
  }

  // ==================== SCHEDULED TASKS ====================

  /**
   * Cleanup expired demos every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredDemos() {
    const expiredDemos = await this.prisma.demoInstance.findMany({
      where: {
        status: 'RUNNING',
        expiresAt: { lt: new Date() },
      },
    });

    this.logger.log(`Found ${expiredDemos.length} expired demos to cleanup`);

    for (const demo of expiredDemos) {
      try {
        await this.cleanupDemoResources(demo);
        await this.prisma.demoInstance.update({
          where: { id: demo.id },
          data: { status: 'EXPIRED' },
        });
        this.logger.log(`Expired demo cleaned up: ${demo.subdomain}`);
      } catch (error) {
        this.logger.error(`Failed to cleanup demo ${demo.subdomain}:`, error);
      }
    }
  }

  // ==================== HELPER METHODS ====================

  private async generateSubdomain(preferred?: string, name?: string): Promise<string> {
    // Sanitize both preferred and name to prevent URL injection
    const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20);
    let base = (preferred ? sanitize(preferred) : null) || (name ? sanitize(name) : null) || 'demo';
    // Ensure base is not empty after sanitization
    if (!base || base.length === 0) {
      base = 'demo';
    }
    let subdomain = base;
    let counter = 1;

    while (await this.prisma.demoInstance.findUnique({ where: { subdomain } })) {
      subdomain = `${base}-${counter++}`;
    }

    return subdomain;
  }

  private async findAvailablePort(): Promise<number> {
    const usedPorts = await this.prisma.demoInstance.findMany({
      where: { status: { in: ['PENDING', 'PROVISIONING', 'RUNNING'] } },
      select: { port: true },
    });

    const usedPortSet = new Set(usedPorts.map((p) => p.port));

    for (let port = this.BASE_PORT; port < this.BASE_PORT + 1000; port++) {
      if (!usedPortSet.has(port)) return port;
    }

    throw new BadRequestException('No available ports');
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const bytes = randomBytes(12);
    return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
  }

  private async getConfigValue(key: string, defaultValue: number): Promise<number> {
    const config = await this.prisma.demoConfig.findUnique({ where: { key } });
    return config ? parseInt(config.value, 10) : defaultValue;
  }

  private getDemoUrl(subdomain: string): string {
    // Use path-based demo URLs: /demo/{subdomain}
    const siteUrl = process.env.SITE_URL || process.env.FRONTEND_URL || 'https://nodepress.co.uk';
    return `${siteUrl}/demo/${subdomain}`;
  }

  private formatDemoResponse(demo: any) {
    return {
      id: demo.id,
      subdomain: demo.subdomain,
      name: demo.name,
      email: demo.email,
      company: demo.company,
      status: demo.status,
      accessUrl: this.getDemoUrl(demo.subdomain),
      adminUrl: `${this.getDemoUrl(demo.subdomain)}/admin`,
      expiresAt: demo.expiresAt,
      createdAt: demo.createdAt,
      startedAt: demo.startedAt,
      lastAccessedAt: demo.lastAccessedAt,
      requestCount: demo.requestCount,
      upgradeRequested: demo.upgradeRequested,
    };
  }
}

