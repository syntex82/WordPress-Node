/**
 * Email Service
 * Handles sending emails via SMTP/Nodemailer
 * Uses database configuration with .env fallback for development
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../../database/prisma.service';
import { EmailStatus } from '@prisma/client';
import { SystemConfigService, SmtpConfig } from '../settings/system-config.service';

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  templateId?: string;
  recipientId?: string;
  metadata?: Record<string, any>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  logId?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private defaultFrom: string = '';
  private defaultFromName: string = 'NodePress CMS';
  private smtpConfig: SmtpConfig | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private systemConfig: SystemConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeTransporter();
  }

  /**
   * Initialize or reinitialize the SMTP transporter
   */
  async initializeTransporter(): Promise<void> {
    try {
      // Try to get config from database first
      this.smtpConfig = await this.systemConfig.getSmtpConfig();
      this.logger.log(
        `SMTP config loaded from DB: host=${this.smtpConfig.host}, user=${this.smtpConfig.user}, hasPass=${!!this.smtpConfig.pass}`,
      );
    } catch (error) {
      // Database not ready yet, use env config
      this.logger.warn(`Failed to load SMTP config from DB: ${error}`);
      this.smtpConfig = {
        host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
        port: parseInt(this.configService.get<string>('SMTP_PORT', '587'), 10),
        secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
        user: this.configService.get<string>('SMTP_USER', ''),
        pass: this.configService.get<string>('SMTP_PASS', ''),
        fromEmail: this.configService.get<string>('SMTP_FROM', ''),
        fromName: this.configService.get<string>('SMTP_FROM_NAME', 'NodePress CMS'),
      };
    }

    this.defaultFrom = this.smtpConfig.fromEmail || this.smtpConfig.user;
    this.defaultFromName = this.smtpConfig.fromName;

    if (!this.smtpConfig.user || !this.smtpConfig.pass) {
      this.logger.warn(
        `SMTP credentials not configured: user="${this.smtpConfig.user}", hasPass=${!!this.smtpConfig.pass}`,
      );
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure,
      auth: { user: this.smtpConfig.user, pass: this.smtpConfig.pass },
    });

    this.logger.log(
      `Email transporter initialized: ${this.smtpConfig.host}:${this.smtpConfig.port} (user: ${this.smtpConfig.user})`,
    );
  }

  /**
   * Reload SMTP configuration from database
   */
  async reloadConfig(): Promise<void> {
    this.logger.log('Reloading SMTP configuration...');
    await this.initializeTransporter();
    this.logger.log(`Reload complete. Transporter active: ${!!this.transporter}`);
  }

  /**
   * Send an email and log it
   */
  async send(options: EmailOptions): Promise<SendResult> {
    const fromEmail = options.from || this.defaultFrom;
    const fromName = options.fromName || this.defaultFromName;

    // Create email log entry
    const emailLog = await this.prisma.emailLog.create({
      data: {
        templateId: options.templateId,
        recipientId: options.recipientId,
        toEmail: options.to,
        toName: options.toName,
        fromEmail,
        fromName,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        status: EmailStatus.PENDING,
        metadata: options.metadata,
      },
    });

    if (!this.transporter) {
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.FAILED,
          failedAt: new Date(),
          errorMessage: 'SMTP transporter not configured',
        },
      });
      return { success: false, error: 'SMTP not configured', logId: emailLog.id };
    }

    try {
      const result = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      });

      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          providerMessageId: result.messageId,
          providerResponse: result as any,
        },
      });

      this.logger.log(`Email sent to ${options.to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId, logId: emailLog.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.FAILED,
          failedAt: new Date(),
          errorMessage,
        },
      });
      this.logger.error(`Failed to send email to ${options.to}: ${errorMessage}`);
      return { success: false, error: errorMessage, logId: emailLog.id };
    }
  }

  /**
   * Render a template with variables
   */
  renderTemplate(template: string, variables: Record<string, any>): string {
    const compiled = Handlebars.compile(template);
    return compiled(variables);
  }

  /**
   * Get site context for email templates (uses database config with env fallback)
   */
  async getSiteContext(): Promise<{
    site: { name: string; logo?: string; address?: string; url?: string };
    year: number;
    loginUrl: string;
    supportEmail: string;
    helpUrl: string;
    docsUrl: string;
    frontendUrl: string;
    adminUrl: string;
  }> {
    const domainConfig = await this.systemConfig.getDomainConfig();

    // Get email settings from database
    const emailSettings = await this.getEmailSettings();

    return {
      site: {
        name: emailSettings.siteName || domainConfig.siteName || 'NodePress CMS',
        logo: emailSettings.logoUrl || undefined,
        address: emailSettings.companyAddress || undefined,
        url: domainConfig.frontendUrl,
      },
      year: new Date().getFullYear(),
      loginUrl: `${domainConfig.adminUrl}/login`,
      supportEmail: emailSettings.supportEmail || domainConfig.supportEmail || 'support@nodepress.co.uk',
      helpUrl: emailSettings.helpUrl || `${domainConfig.frontendUrl}/help`,
      docsUrl: emailSettings.docsUrl || `${domainConfig.frontendUrl}/docs`,
      frontendUrl: domainConfig.frontendUrl,
      adminUrl: domainConfig.adminUrl,
    };
  }

  /**
   * Get email settings from database
   */
  private async getEmailSettings(): Promise<{
    siteName?: string;
    logoUrl?: string;
    supportEmail?: string;
    companyAddress?: string;
    helpUrl?: string;
    docsUrl?: string;
  }> {
    try {
      const settings = await this.prisma.setting.findMany({
        where: {
          key: {
            in: [
              'email_site_name',
              'email_logo_url',
              'email_support_email',
              'email_company_address',
              'email_help_url',
              'email_docs_url',
            ],
          },
        },
      });

      const result: Record<string, string> = {};
      for (const setting of settings) {
        const key = setting.key.replace('email_', '').replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        result[key] = String(setting.value);
      }

      return {
        siteName: result['siteName'],
        logoUrl: result['logoUrl'],
        supportEmail: result['supportEmail'],
        companyAddress: result['companyAddress'],
        helpUrl: result['helpUrl'],
        docsUrl: result['docsUrl'],
      };
    } catch (error) {
      this.logger.warn('Failed to load email settings from database');
      return {};
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
