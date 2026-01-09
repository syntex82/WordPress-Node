/**
 * Demo Notification Service
 * Handles email notifications for demo lifecycle events
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';

export interface DemoEmailData {
  to: string;
  name: string;
  subdomain: string;
  adminPassword?: string;
  accessToken?: string;
  expiresAt: Date;
  loginUrl: string;
}

@Injectable()
export class DemoNotificationService {
  private readonly logger = new Logger(DemoNotificationService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT', 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP not configured - demo emails will be logged only');
    }
  }

  /**
   * Send demo creation welcome email
   */
  async sendDemoCreatedEmail(data: DemoEmailData): Promise<void> {
    const subject = '🎉 Your NodePress Demo is Ready!';
    const html = this.getDemoCreatedTemplate(data);
    
    await this.sendEmail(data.to, subject, html);
  }

  /**
   * Send demo expiration warning email (sent 2 hours before expiry)
   */
  async sendExpirationWarningEmail(data: DemoEmailData): Promise<void> {
    const subject = '⏰ Your NodePress Demo Expires Soon';
    const html = this.getExpirationWarningTemplate(data);
    
    await this.sendEmail(data.to, subject, html);
  }

  /**
   * Send demo expired email with upgrade CTA
   */
  async sendDemoExpiredEmail(data: Omit<DemoEmailData, 'accessToken' | 'adminPassword'>): Promise<void> {
    const subject = 'Your NodePress Demo Has Expired';
    const html = this.getDemoExpiredTemplate(data);
    
    await this.sendEmail(data.to, subject, html);
  }

  /**
   * Cron job to send expiration warnings
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendExpirationWarnings(): Promise<void> {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const threeHoursFromNow = new Date(Date.now() + 3 * 60 * 60 * 1000);

    const expiringSoon = await this.prisma.demoInstance.findMany({
      where: {
        status: 'RUNNING',
        expiresAt: { gte: twoHoursFromNow, lt: threeHoursFromNow },
        expirationWarned: false,
      },
    });

    for (const demo of expiringSoon) {
      try {
        await this.sendExpirationWarningEmail({
          to: demo.email,
          name: demo.name,
          subdomain: demo.subdomain,
          expiresAt: demo.expiresAt,
          loginUrl: `https://${demo.subdomain}.${this.getBaseDomain()}/admin`,
        });

        await this.prisma.demoInstance.update({
          where: { id: demo.id },
          data: { expirationWarned: true },
        });

        this.logger.log(`Sent expiration warning to ${demo.email}`);
      } catch (error) {
        this.logger.error(`Failed to send warning to ${demo.email}:`, error);
      }
    }
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM', 'NodePress <noreply@nodepress.io>');

    if (!this.transporter) {
      this.logger.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
      this.logger.debug(`[EMAIL BODY]\n${html}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  private getBaseDomain(): string {
    return this.config.get<string>('DEMO_BASE_DOMAIN', 'demo.nodepress.io');
  }

  private getDemoCreatedTemplate(data: DemoEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h1 style="color: #18181b; margin: 0 0 24px;">Welcome to NodePress! 🎉</h1>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">Your demo instance is ready! Explore all the powerful features of NodePress.</p>
      <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #18181b;"><strong>Login URL:</strong> <a href="${data.loginUrl}" style="color: #3b82f6;">${data.loginUrl}</a></p>
        <p style="margin: 0 0 8px; color: #18181b;"><strong>Email:</strong> ${data.to}</p>
        <p style="margin: 0; color: #18181b;"><strong>Password:</strong> ${data.adminPassword}</p>
      </div>
      <p style="color: #f59e0b; font-size: 14px;">⏰ Your demo expires: ${data.expiresAt.toLocaleString()}</p>
      <a href="${data.loginUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Access Your Demo</a>
    </div>
  </div>
</body>
</html>`;
  }

  private getExpirationWarningTemplate(data: DemoEmailData): string {
    const baseUrl = this.getSiteUrl();
    const upgradeUrl = `${baseUrl}/demo/upgrade?ref=demo&subdomain=${data.subdomain}`;
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h1 style="color: #18181b; margin: 0 0 24px;">Your Demo Expires Soon ⏰</h1>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">Your NodePress demo at <strong>${data.subdomain}</strong> will expire in about 2 hours.</p>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">Don't lose your work! Upgrade now to keep your content and unlock all premium features.</p>
      <a href="${upgradeUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Upgrade Now</a>
      <p style="color: #71717a; font-size: 14px; margin-top: 24px;">Or <a href="${data.loginUrl}" style="color: #3b82f6;">continue exploring your demo</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  private getDemoExpiredTemplate(data: Omit<DemoEmailData, 'accessToken' | 'adminPassword'>): string {
    const baseUrl = this.getSiteUrl();
    const upgradeUrl = `${baseUrl}/demo/upgrade?ref=demo-expired&subdomain=${data.subdomain}`;
    const contactUrl = `${baseUrl}/contact`;
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h1 style="color: #18181b; margin: 0 0 24px;">Your Demo Has Expired</h1>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">Hi ${data.name},</p>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">Your NodePress demo has expired, but it's not too late to get started!</p>
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">Start your NodePress journey today with our special offer for demo users.</p>
      <a href="${upgradeUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Get Started - 20% Off</a>
      <p style="color: #71717a; font-size: 14px; margin-top: 24px;">Questions? Reply to this email or <a href="${contactUrl}" style="color: #3b82f6;">contact our team</a>.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Get the site URL from config with proper fallback
   */
  private getSiteUrl(): string {
    return this.config.get<string>('SITE_URL') ||
           this.config.get<string>('FRONTEND_URL') ||
           'https://nodepress.co.uk';
  }
}

