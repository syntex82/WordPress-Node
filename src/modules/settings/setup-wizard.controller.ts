/**
 * Setup Wizard Controller
 * Handles first-time installation setup
 * These endpoints are only available when setup is not complete
 */

import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService, SmtpConfig, DomainConfig } from './system-config.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

interface SetupAdminDto {
  email: string;
  name: string;
  password: string;
}

interface SetupCompleteDto {
  admin: SetupAdminDto;
  smtp?: SmtpConfig;
  domain?: DomainConfig;
}

@Controller('api/setup')
export class SetupWizardController {
  constructor(
    private prisma: PrismaService,
    private systemConfig: SystemConfigService,
  ) {}

  /**
   * Check if setup is required
   * GET /api/setup/status
   */
  @Get('status')
  async getSetupStatus() {
    const status = await this.systemConfig.getSetupStatus();
    const adminExists = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    return {
      setupRequired: !status.setupComplete,
      adminCreated: !!adminExists,
      smtpConfigured: status.smtpConfigured,
      domainConfigured: status.domainConfigured,
    };
  }

  /**
   * Create admin account during setup
   * POST /api/setup/admin
   */
  @Post('admin')
  async createAdmin(@Body() dto: SetupAdminDto) {
    await this.ensureSetupNotComplete();
    
    // Validate input
    if (!dto.email || !dto.password || !dto.name) {
      throw new HttpException('Email, name, and password are required', HttpStatus.BAD_REQUEST);
    }

    // Check password strength
    if (dto.password.length < 8) {
      throw new HttpException('Password must be at least 8 characters', HttpStatus.BAD_REQUEST);
    }

    // Check if admin already exists
    const existingAdmin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) {
      throw new HttpException('Admin account already exists', HttpStatus.CONFLICT);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // Update setup status
    await this.prisma.setupStatus.upsert({
      where: { id: 'setup' },
      update: { adminCreated: true },
      create: { id: 'setup', adminCreated: true },
    });

    return { success: true, message: 'Admin account created', adminId: admin.id };
  }

  /**
   * Configure SMTP during setup
   * POST /api/setup/smtp
   */
  @Post('smtp')
  async configureSmtp(@Body() config: SmtpConfig) {
    await this.ensureSetupNotComplete();
    
    // Test SMTP connection first
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.pass },
      });
      await transporter.verify();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(`SMTP connection failed: ${msg}`, HttpStatus.BAD_REQUEST);
    }

    // Save SMTP config
    await this.systemConfig.saveSmtpConfig(config);

    // Update setup status
    await this.prisma.setupStatus.upsert({
      where: { id: 'setup' },
      update: { smtpConfigured: true },
      create: { id: 'setup', smtpConfigured: true },
    });

    return { success: true, message: 'SMTP configured successfully' };
  }

  /**
   * Complete setup wizard
   * POST /api/setup/complete
   */
  @Post('complete')
  async completeSetup(@Body() dto: SetupCompleteDto) {
    await this.ensureSetupNotComplete();
    
    // Create admin if provided
    if (dto.admin) {
      const existingAdmin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(dto.admin.password, 12);
        await this.prisma.user.create({
          data: {
            email: dto.admin.email,
            name: dto.admin.name,
            password: hashedPassword,
            role: 'ADMIN',
          },
        });
      }
    }

    // Save SMTP config if provided
    if (dto.smtp) {
      await this.systemConfig.saveSmtpConfig(dto.smtp);
    }

    // Save domain config if provided
    if (dto.domain) {
      await this.systemConfig.saveDomainConfig(dto.domain);
    }

    // Mark setup as complete
    await this.systemConfig.markSetupComplete();

    return { success: true, message: 'Setup completed successfully' };
  }

  private async ensureSetupNotComplete() {
    const isComplete = await this.systemConfig.isSetupComplete();
    if (isComplete) {
      throw new HttpException('Setup already completed', HttpStatus.FORBIDDEN);
    }
  }
}

