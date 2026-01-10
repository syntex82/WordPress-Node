/**
 * License Email Service
 * Sends beautifully designed license purchase confirmation emails
 * with download links, documentation, and getting started guides
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../settings/system-config.service';

export interface LicenseEmailData {
  email: string;
  sessionId: string;
  amount: number;
  currency: string;
}

@Injectable()
export class LicenseEmailService {
  private readonly logger = new Logger(LicenseEmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private systemConfig: SystemConfigService,
  ) {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      const smtpConfig = await this.systemConfig.getSmtpConfig();
      if (smtpConfig?.user && smtpConfig?.pass) {
        this.transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          auth: { user: smtpConfig.user, pass: smtpConfig.pass },
        });
        this.logger.log('License email transporter initialized');
      }
    } catch {
      // Fallback to env config
      const host = this.config.get<string>('SMTP_HOST');
      const user = this.config.get<string>('SMTP_USER');
      const pass = this.config.get<string>('SMTP_PASS');
      if (host && user && pass) {
        this.transporter = nodemailer.createTransport({
          host,
          port: this.config.get<number>('SMTP_PORT', 587),
          secure: this.config.get<string>('SMTP_SECURE') === 'true',
          auth: { user, pass },
        });
      }
    }
  }

  /**
   * Generate a secure download token
   */
  generateDownloadToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Store license purchase and generate download token
   */
  async createLicensePurchase(data: LicenseEmailData): Promise<string> {
    const downloadToken = this.generateDownloadToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Store in a simple way using SystemConfig or create a record
    await this.prisma.systemConfig.upsert({
      where: { key: `license_${downloadToken}` },
      create: {
        key: `license_${downloadToken}`,
        value: JSON.stringify({
          email: data.email,
          sessionId: data.sessionId,
          amount: data.amount,
          currency: data.currency,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          downloadCount: 0,
        }),
        group: 'licenses',
        description: `License purchase for ${data.email}`,
      },
      update: {
        value: JSON.stringify({
          email: data.email,
          sessionId: data.sessionId,
          amount: data.amount,
          currency: data.currency,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          downloadCount: 0,
        }),
      },
    });

    return downloadToken;
  }

  /**
   * Send license purchase confirmation email
   */
  async sendLicenseEmail(email: string, downloadToken: string): Promise<void> {
    const baseUrl = this.config.get<string>('FRONTEND_URL', 'https://nodepress.co.uk');
    const downloadUrl = `${baseUrl}/api/license/download/${downloadToken}`;
    
    const subject = '🎉 Your NodePress License - Download & Getting Started Guide';
    const html = this.getLicenseEmailTemplate(email, downloadUrl, baseUrl);

    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM', 'NodePress <hello@nodepress.co.uk>');

    if (!this.transporter) {
      await this.initializeTransporter();
    }

    if (!this.transporter) {
      this.logger.warn(`[LICENSE EMAIL] SMTP not configured. To: ${to}, Subject: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`License email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send license email to ${to}:`, error);
      throw error;
    }
  }

  // Template will be added in next edit due to size
  private getLicenseEmailTemplate(email: string, downloadUrl: string, baseUrl: string): string {
    return this.generateEmailTemplate(email, downloadUrl, baseUrl);
  }

  private generateEmailTemplate(email: string, downloadUrl: string, baseUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NodePress License - Getting Started</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <div style="max-width: 700px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">🎉 Welcome to NodePress!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 16px 0 0; font-size: 18px;">Your Developer License is Ready</p>
    </div>

    <!-- Main Content -->
    <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">

      <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
        Thank you for purchasing the NodePress Developer License! You now have full access to the source code,
        documentation, and all future updates.
      </p>

      <!-- Download Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 18px; box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);">
          📦 Download NodePress Source Code
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 12px;">Link expires in 30 days • Unlimited downloads</p>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

      <!-- Quick Start Section -->
      <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">🚀 Quick Start Guide</h2>

      <!-- Prerequisites -->
      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: #374151; margin: 0 0 16px; font-size: 18px;">📋 Prerequisites</h3>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
          <li style="margin-bottom: 8px;"><strong>Node.js 18+</strong> - <a href="https://nodejs.org/" style="color: #667eea;">Download here</a></li>
          <li style="margin-bottom: 8px;"><strong>PostgreSQL 14+</strong> - <a href="https://www.postgresql.org/download/" style="color: #667eea;">Download here</a></li>
          <li style="margin-bottom: 8px;"><strong>Git</strong> - <a href="https://git-scm.com/" style="color: #667eea;">Download here</a></li>
          <li><strong>Code Editor</strong> - We recommend <a href="https://code.visualstudio.com/" style="color: #667eea;">VS Code</a></li>
        </ul>
      </div>

      <!-- Local Development -->
      <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: white; margin: 0 0 16px; font-size: 18px;">💻 Local Development Setup</h3>
        <pre style="background: #111827; color: #10b981; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 14px; margin: 0;">
<span style="color: #6b7280;"># 1. Extract the ZIP and navigate to folder</span>
cd nodepress

<span style="color: #6b7280;"># 2. Install dependencies</span>
npm install
cd admin && npm install && cd ..

<span style="color: #6b7280;"># 3. Set up your environment</span>
cp .env.example .env

<span style="color: #6b7280;"># 4. Configure your database in .env</span>
DATABASE_URL="postgresql://user:pass@localhost:5432/nodepress"

<span style="color: #6b7280;"># 5. Run database migrations</span>
npx prisma migrate dev

<span style="color: #6b7280;"># 6. Start development server</span>
npm run dev
        </pre>
      </div>

      <!-- Production Deployment -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #86efac;">
        <h3 style="color: #166534; margin: 0 0 16px; font-size: 18px;">🌐 Production Deployment</h3>

        <h4 style="color: #15803d; margin: 16px 0 8px; font-size: 16px;">Option 1: Render.com (Recommended)</h4>
        <ol style="margin: 0 0 16px; padding-left: 20px; color: #166534;">
          <li>Push code to GitHub</li>
          <li>Connect Render to your repository</li>
          <li>Create PostgreSQL database on Render</li>
          <li>Add environment variables</li>
          <li>Deploy with one click!</li>
        </ol>

        <h4 style="color: #15803d; margin: 16px 0 8px; font-size: 16px;">Option 2: VPS/Docker</h4>
        <pre style="background: white; color: #166534; padding: 12px; border-radius: 6px; font-size: 13px; margin: 0;">
docker-compose up -d
        </pre>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

      <!-- Learning Resources -->
      <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">📚 Learning Resources</h2>

      <div style="display: grid; gap: 16px;">
        <!-- NestJS -->
        <a href="https://nestjs.com/" style="display: block; background: #f9fafb; border-radius: 12px; padding: 20px; text-decoration: none; border: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 28px; margin-right: 16px;">🦁</span>
            <div>
              <h4 style="color: #1f2937; margin: 0 0 4px; font-size: 16px;">NestJS Documentation</h4>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">Master the Node.js framework powering NodePress backend</p>
            </div>
          </div>
        </a>

        <!-- Prisma -->
        <a href="https://www.prisma.io/docs" style="display: block; background: #f9fafb; border-radius: 12px; padding: 20px; text-decoration: none; border: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 28px; margin-right: 16px;">💎</span>
            <div>
              <h4 style="color: #1f2937; margin: 0 0 4px; font-size: 16px;">Prisma ORM Guide</h4>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">Learn database modeling, migrations, and queries</p>
            </div>
          </div>
        </a>

        <!-- React -->
        <a href="https://react.dev/" style="display: block; background: #f9fafb; border-radius: 12px; padding: 20px; text-decoration: none; border: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 28px; margin-right: 16px;">⚛️</span>
            <div>
              <h4 style="color: #1f2937; margin: 0 0 4px; font-size: 16px;">React & Vite</h4>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">Build modern admin interfaces with React 18</p>
            </div>
          </div>
        </a>

        <!-- TailwindCSS -->
        <a href="https://tailwindcss.com/docs" style="display: block; background: #f9fafb; border-radius: 12px; padding: 20px; text-decoration: none; border: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 28px; margin-right: 16px;">🎨</span>
            <div>
              <h4 style="color: #1f2937; margin: 0 0 4px; font-size: 16px;">Tailwind CSS</h4>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">Customize styles with utility-first CSS</p>
            </div>
          </div>
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

      <!-- Recommended Courses -->
      <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">🎓 Recommended Courses</h2>

      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin-bottom: 16px; border: 1px solid #fbbf24;">
        <h4 style="color: #92400e; margin: 0 0 8px; font-size: 16px;">⭐ NodePress Academy</h4>
        <p style="color: #a16207; margin: 0 0 12px; font-size: 14px;">Official NodePress courses - from beginner to advanced. Learn to build, customize, and deploy your CMS.</p>
        <a href="https://nodepress.co.uk/courses" style="color: #92400e; font-weight: 600;">Browse Courses →</a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

      <!-- Community & Support -->
      <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">💬 Community & Support</h2>

      <div style="display: grid; gap: 12px;">
        <a href="https://github.com/syntex82/NodePress" style="display: flex; align-items: center; background: #24292e; color: white; padding: 16px 20px; border-radius: 8px; text-decoration: none;">
          <span style="margin-right: 12px;">⭐</span>
          <span style="font-weight: 600;">Star us on GitHub</span>
        </a>

        <a href="https://github.com/syntex82/NodePress/issues" style="display: flex; align-items: center; background: #667eea; color: white; padding: 16px 20px; border-radius: 8px; text-decoration: none;">
          <span style="margin-right: 12px;">🐛</span>
          <span style="font-weight: 600;">Report Issues & Get Help</span>
        </a>

        <a href="https://github.com/syntex82/NodePress/discussions" style="display: flex; align-items: center; background: #10b981; color: white; padding: 16px 20px; border-radius: 8px; text-decoration: none;">
          <span style="margin-right: 12px;">💬</span>
          <span style="font-weight: 600;">Join Community Discussions</span>
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

      <!-- Environment Variables Reference -->
      <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">⚙️ Key Environment Variables</h2>

      <div style="background: #1f2937; border-radius: 12px; padding: 20px; overflow-x: auto;">
        <pre style="color: #e5e7eb; font-size: 13px; margin: 0; white-space: pre-wrap;">
<span style="color: #6b7280;"># Database</span>
DATABASE_URL="postgresql://user:password@localhost:5432/nodepress"

<span style="color: #6b7280;"># JWT Secret (generate a secure random string)</span>
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

<span style="color: #6b7280;"># Stripe (for payments)</span>
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

<span style="color: #6b7280;"># Email (SMTP)</span>
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@email.com"
SMTP_PASS="your-app-password"

<span style="color: #6b7280;"># URLs</span>
FRONTEND_URL="https://yourdomain.com"
ADMIN_URL="https://yourdomain.com/admin"
        </pre>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

      <!-- License Info -->
      <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #c4b5fd;">
        <h3 style="color: #5b21b6; margin: 0 0 12px; font-size: 20px;">📜 Your License</h3>
        <p style="color: #6d28d9; margin: 0 0 8px; font-size: 14px;">Licensed to: <strong>${email}</strong></p>
        <p style="color: #7c3aed; margin: 0; font-size: 13px;">Developer License • Lifetime Updates • Commercial Use Allowed</p>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 32px 20px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">
        Made with ❤️ by the NodePress Team
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Questions? Reply to this email or visit <a href="${baseUrl}" style="color: #667eea;">${baseUrl}</a>
      </p>
    </div>

  </div>
</body>
</html>
    `;
  }
}

