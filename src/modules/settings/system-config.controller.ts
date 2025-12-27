/**
 * System Configuration Controller
 * Handles HTTP requests for system configuration management
 * Includes SMTP settings, domain settings, and test email functionality
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  SystemConfigService,
  SmtpConfig,
  DomainConfig,
  MarketplaceConfig,
} from './system-config.service';
import Stripe from 'stripe';
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
  async saveEmailConfig(@Body() config: SmtpConfig & { password?: string }) {
    // Support both 'pass' and 'password' field names from frontend
    const pass = config.pass || config.password;

    // Validate required fields
    if (!config.host || !config.user) {
      throw new HttpException('Host and user are required', HttpStatus.BAD_REQUEST);
    }

    // Build the config to save, only including password if provided
    const configToSave: SmtpConfig = {
      ...config,
      pass: pass || '',
    };

    await this.systemConfig.saveSmtpConfig(configToSave);
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

  /**
   * Get marketplace configuration
   * GET /api/system-config/marketplace
   */
  @Get('marketplace')
  async getMarketplaceConfig() {
    return this.systemConfig.getMarketplaceConfig();
  }

  /**
   * Save marketplace configuration
   * PUT /api/system-config/marketplace
   */
  @Put('marketplace')
  async saveMarketplaceConfig(@Body() config: MarketplaceConfig) {
    // Validate fee percentage
    if (config.platformFeePercent < 0 || config.platformFeePercent > 50) {
      throw new HttpException('Platform fee must be between 0% and 50%', HttpStatus.BAD_REQUEST);
    }
    if (config.minPayoutAmount < 1) {
      throw new HttpException('Minimum payout must be at least $1', HttpStatus.BAD_REQUEST);
    }
    await this.systemConfig.saveMarketplaceConfig(config);
    return { success: true, message: 'Marketplace settings saved successfully' };
  }

  /**
   * Get Stripe/Payment configuration (keys masked)
   * GET /api/system-config/payment
   */
  @Get('payment')
  async getPaymentConfig() {
    const config = await this.systemConfig.getStripeConfig();

    // Mask sensitive keys - show only last 4 characters
    const maskKey = (key: string) => {
      if (!key || key.length < 8) return key ? '****' : '';
      return `${key.substring(0, 7)}...${key.slice(-4)}`;
    };

    return {
      publishableKey: maskKey(config.publishableKey),
      secretKey: maskKey(config.secretKey),
      webhookSecret: maskKey(config.webhookSecret),
      isLiveMode: config.isLiveMode,
      isConfigured: config.isConfigured,
      provider: 'stripe',
    };
  }

  /**
   * Save Stripe/Payment configuration
   * PUT /api/system-config/payment
   */
  @Put('payment')
  async savePaymentConfig(
    @Body() body: { publishableKey?: string; secretKey?: string; webhookSecret?: string },
  ) {
    // Trim whitespace from keys (common issue when copying/pasting)
    const publishableKey = body.publishableKey?.trim() || '';
    const secretKey = body.secretKey?.trim() || '';
    const webhookSecret = body.webhookSecret?.trim() || '';

    // Validate key formats if provided
    if (publishableKey && !publishableKey.startsWith('pk_')) {
      throw new HttpException(
        'Invalid publishable key format. Must start with pk_test_ or pk_live_',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (secretKey && !secretKey.startsWith('sk_')) {
      throw new HttpException(
        'Invalid secret key format. Must start with sk_test_ or sk_live_',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
      throw new HttpException(
        'Invalid webhook secret format. Must start with whsec_',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check for mode mismatch (mixing test and live keys)
    if (publishableKey && secretKey) {
      const pubIsLive = publishableKey.startsWith('pk_live_');
      const secIsLive = secretKey.startsWith('sk_live_');
      if (pubIsLive !== secIsLive) {
        throw new HttpException(
          'Key mode mismatch: Cannot mix test and live keys',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    await this.systemConfig.saveStripeConfig({
      publishableKey,
      secretKey,
      webhookSecret,
    });

    return { success: true, message: 'Payment settings saved successfully' };
  }

  /**
   * Test Stripe connection
   * POST /api/system-config/payment/test
   */
  @Post('payment/test')
  async testPaymentConfig() {
    const config = await this.systemConfig.getStripeConfig();

    if (!config.secretKey) {
      throw new HttpException('Stripe secret key is not configured', HttpStatus.BAD_REQUEST);
    }

    try {
      // Create a Stripe instance and test the connection
      const stripe = new Stripe(config.secretKey);

      // Try to retrieve account info to verify the key works
      const account = await stripe.accounts.retrieve();

      return {
        success: true,
        message: 'Stripe connection successful',
        accountId: account.id,
        isLiveMode: config.isLiveMode,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(`Stripe connection failed: ${message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
