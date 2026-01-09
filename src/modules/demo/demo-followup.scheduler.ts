/**
 * Demo Follow-up Email Scheduler
 * Sends scheduled follow-up emails to demo users who haven't converted
 * Runs as a cron job to check for pending emails
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import {
  ConversionEmailData,
  getFollowUp24HourEmail,
  getFollowUp3DayEmail,
} from './templates/conversion-followup.template';

@Injectable()
export class DemoFollowupScheduler {
  private readonly logger = new Logger(DemoFollowupScheduler.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    // Start the scheduler
    this.startScheduler();
  }

  /**
   * Start the email scheduler (runs every 15 minutes)
   */
  private startScheduler(): void {
    // Run every 15 minutes
    setInterval(() => this.processScheduledEmails(), 15 * 60 * 1000);
    
    // Also run on startup after a delay
    setTimeout(() => this.processScheduledEmails(), 30 * 1000);
    
    this.logger.log('Demo follow-up email scheduler started');
  }

  /**
   * Process all pending scheduled emails
   */
  async processScheduledEmails(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Scheduler already running, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();
      
      // Find all scheduled emails that are due
      const pendingEmails = await this.prisma.setting.findMany({
        where: {
          key: { startsWith: 'scheduled_email_' },
          group: 'scheduled_emails',
        },
      });

      for (const emailSetting of pendingEmails) {
        try {
          const emailData = JSON.parse(emailSetting.value as string);
          
          // Skip if already sent
          if (emailData.sent) continue;
          
          // Check if it's time to send
          const sendAt = new Date(emailData.sendAt);
          if (sendAt > now) continue;

          // Check if user has unsubscribed
          const unsubscribed = await this.checkUnsubscribed(emailData.data?.email);
          if (unsubscribed) {
            await this.markAsSent(emailSetting.key, 'unsubscribed');
            continue;
          }

          // Check if user has already converted
          const converted = await this.checkConverted(emailData.data?.demoId);
          if (converted) {
            await this.markAsSent(emailSetting.key, 'converted');
            continue;
          }

          // Send the email based on type
          await this.sendFollowUpEmail(emailData.type, emailData.data);
          
          // Mark as sent
          await this.markAsSent(emailSetting.key, 'sent');
          
          this.logger.log(`Sent ${emailData.type} follow-up to ${emailData.data?.email}`);
        } catch (error) {
          this.logger.error(`Error processing email ${emailSetting.key}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in email scheduler:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Send a follow-up email based on type
   */
  private async sendFollowUpEmail(type: string, data: ConversionEmailData): Promise<void> {
    let email: { subject: string; html: string };

    switch (type) {
      case 'followup_24h':
        email = getFollowUp24HourEmail(data);
        break;
      case 'followup_3d':
        email = getFollowUp3DayEmail(data);
        break;
      default:
        this.logger.warn(`Unknown email type: ${type}`);
        return;
    }

    await this.emailService.send({
      to: data.email,
      subject: email.subject,
      html: email.html,
    });
  }

  /**
   * Check if user has unsubscribed from demo emails
   */
  private async checkUnsubscribed(email: string): Promise<boolean> {
    if (!email) return false;
    
    const unsubscribe = await this.prisma.setting.findFirst({
      where: {
        key: `unsubscribe_demo_${email}`,
      },
    });
    
    return !!unsubscribe;
  }

  /**
   * Check if user has already converted (submitted inquiry)
   */
  private async checkConverted(demoId: string): Promise<boolean> {
    if (!demoId) return false;

    // Check if there's an upgrade inquiry that contains this demoId
    const inquiries = await this.prisma.setting.findMany({
      where: {
        key: { startsWith: `upgrade_inquiry_` },
      },
    });

    // Check if any inquiry contains the demoId
    return inquiries.some(inq => {
      try {
        const data = JSON.parse(inq.value as string);
        return data.demoId === demoId;
      } catch {
        return false;
      }
    });
  }

  /**
   * Mark an email as sent (or skipped)
   */
  private async markAsSent(key: string, status: string): Promise<void> {
    const existing = await this.prisma.setting.findUnique({ where: { key } });
    if (!existing) return;

    const data = JSON.parse(existing.value as string);
    data.sent = true;
    data.status = status;
    data.processedAt = new Date().toISOString();

    await this.prisma.setting.update({
      where: { key },
      data: { value: JSON.stringify(data) as any },
    });
  }

  /**
   * Schedule follow-up emails for a demo
   */
  async scheduleFollowUps(demoId: string, email: string, name: string): Promise<void> {
    const baseUrl = process.env.APP_URL || 'https://nodepress.co.uk';

    const emailData: ConversionEmailData = {
      name: name || 'there',
      email,
      demoId,
      demoSubdomain: demoId,
      hoursUsed: 24,
      featuresUsed: ['posts', 'pages', 'themes'],
      upgradeUrl: `${baseUrl}/demo/upgrade?ref=${demoId}`,
      unsubscribeUrl: `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&type=demo`,
    };

    // Schedule 24-hour follow-up
    await this.prisma.setting.create({
      data: {
        key: `scheduled_email_${demoId}_followup_24h`,
        value: JSON.stringify({
          type: 'followup_24h',
          data: emailData,
          sendAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          sent: false,
        }) as any,
        type: 'json',
        group: 'scheduled_emails',
      },
    });

    // Schedule 3-day follow-up
    await this.prisma.setting.create({
      data: {
        key: `scheduled_email_${demoId}_followup_3d`,
        value: JSON.stringify({
          type: 'followup_3d',
          data: emailData,
          sendAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          sent: false,
        }) as any,
        type: 'json',
        group: 'scheduled_emails',
      },
    });

    this.logger.log(`Scheduled follow-up emails for demo ${demoId}`);
  }
}

