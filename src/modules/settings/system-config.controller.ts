/**
 * System Configuration Controller
 * Handles HTTP requests for system configuration management
 * Includes SMTP settings, domain settings, and test email functionality
 */

import { Controller, Get, Post, Put, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { SystemConfigService, SmtpConfig, DomainConfig } from './system-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import * as nodemailer from 'nodemailer';

@Controller('api/system-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SystemConfigController {
  constructor(private readonly systemConfig: SystemConfigService) {}

  /**
   * Get SMTP configuration (passwords masked)
   * GET /api/system-config/email
   */
  @Get('email')
  async getEmailConfig() {
    const config = await this.systemConfig.getSmtpConfig();
    return {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      pass: config.pass ? '********' : '', // Mask password
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      isConfigured: !!(config.host && config.user && config.pass),
    };
  }

  /**
   * Save SMTP configuration
   * PUT /api/system-config/email
   */
  @Put('email')
  async saveEmailConfig(@Body() config: SmtpConfig) {
    // Validate required fields
    if (!config.host || !config.user || !config.pass) {
      throw new HttpException('Host, user, and password are required', HttpStatus.BAD_REQUEST);
    }
    await this.systemConfig.saveSmtpConfig(config);
    return { success: true, message: 'Email settings saved successfully' };
  }

  /**
   * Test SMTP connection
   * POST /api/system-config/email/test
   */
  @Post('email/test')
  async testEmailConfig(@Body() body: { testEmail: string }) {
    if (!body.testEmail) {
      throw new HttpException('Test email address is required', HttpStatus.BAD_REQUEST);
    }

    const config = await this.systemConfig.getSmtpConfig();
    
    if (!config.host || !config.user || !config.pass) {
      throw new HttpException('SMTP not configured', HttpStatus.BAD_REQUEST);
    }

    try {
      // Create a temporary transporter
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.pass },
      });

      // Verify connection
      await transporter.verify();

      // Send test email
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail || config.user}>`,
        to: body.testEmail,
        subject: 'WordPress Node CMS - Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">🎉 Email Configuration Successful!</h2>
            <p>Your SMTP settings are working correctly.</p>
            <p><strong>Server:</strong> ${config.host}:${config.port}</p>
            <p><strong>From:</strong> ${config.fromName} &lt;${config.fromEmail || config.user}&gt;</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              This is a test email from WordPress Node CMS.
            </p>
          </div>
        `,
      });

      return { success: true, message: `Test email sent to ${body.testEmail}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(`Failed to send test email: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get domain configuration
   * GET /api/system-config/domain
   */
  @Get('domain')
  async getDomainConfig() {
    return this.systemConfig.getDomainConfig();
  }

  /**
   * Save domain configuration
   * PUT /api/system-config/domain
   */
  @Put('domain')
  async saveDomainConfig(@Body() config: DomainConfig) {
    await this.systemConfig.saveDomainConfig(config);
    return { success: true, message: 'Domain settings saved successfully' };
  }

  /**
   * Get setup status
   * GET /api/system-config/setup-status
   */
  @Get('setup-status')
  async getSetupStatus() {
    return this.systemConfig.getSetupStatus();
  }
}

