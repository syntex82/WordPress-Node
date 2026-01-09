/**
 * Demo Conversion Service
 * Handles conversion tracking, analytics, and follow-up email scheduling
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import {
  ConversionEmailData,
  getDemoExpiredEmail,
  getFollowUp24HourEmail,
  getFollowUp3DayEmail,
} from './templates/conversion-followup.template';

export interface ConversionEvent {
  demoId: string;
  email?: string;
  eventType: 'page_view' | 'cta_click' | 'form_submit' | 'hostinger_click' | 'calendly_click';
  eventData?: Record<string, any>;
  timestamp: Date;
}

export interface UpgradeInquiry {
  demoId?: string;
  name: string;
  email: string;
  company?: string;
  service: string;
  message?: string;
  source: string;
}

@Injectable()
export class DemoConversionService {
  private readonly logger = new Logger(DemoConversionService.name);
  private readonly baseUrl = process.env.APP_URL || 'https://nodepress.co.uk';

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Track a conversion-related event
   */
  async trackConversionEvent(event: ConversionEvent): Promise<void> {
    try {
      // Store in database for analytics
      await this.prisma.setting.upsert({
        where: { key: `conversion_event_${event.demoId}_${Date.now()}` },
        create: {
          key: `conversion_event_${event.demoId}_${Date.now()}`,
          value: JSON.stringify(event) as any,
          type: 'json',
          group: 'analytics',
        },
        update: {
          value: JSON.stringify(event) as any,
        },
      });

      this.logger.log(`Tracked conversion event: ${event.eventType} for demo ${event.demoId}`);
    } catch (error) {
      this.logger.error('Failed to track conversion event:', error);
    }
  }

  /**
   * Handle upgrade inquiry form submission
   */
  async handleUpgradeInquiry(inquiry: UpgradeInquiry): Promise<{ success: boolean; message: string }> {
    try {
      // Store inquiry
      await this.prisma.setting.create({
        data: {
          key: `upgrade_inquiry_${Date.now()}`,
          value: JSON.stringify({
            ...inquiry,
            submittedAt: new Date().toISOString(),
          }) as any,
          type: 'json',
          group: 'leads',
        },
      });

      // Send notification to admin
      await this.emailService.send({
        to: process.env.ADMIN_EMAIL || 'support@nodepress.co.uk',
        subject: `🎯 New Upgrade Inquiry: ${inquiry.service}`,
        html: this.getAdminNotificationHtml(inquiry),
      });

      // Send confirmation to user
      await this.emailService.send({
        to: inquiry.email,
        subject: 'Thanks for your interest in NodePress!',
        html: this.getUserConfirmationHtml(inquiry),
      });

      // Track as conversion event
      await this.trackConversionEvent({
        demoId: inquiry.demoId || 'direct',
        email: inquiry.email,
        eventType: 'form_submit',
        eventData: { service: inquiry.service },
        timestamp: new Date(),
      });

      return { success: true, message: 'Inquiry submitted successfully' };
    } catch (error) {
      this.logger.error('Failed to handle upgrade inquiry:', error);
      return { success: false, message: 'Failed to submit inquiry' };
    }
  }

  /**
   * Schedule follow-up emails for a demo that just expired
   */
  async scheduleFollowUpEmails(demoId: string): Promise<void> {
    try {
      // Get demo details - using setting as fallback since demoInstance may not exist
      const demoData = await this.prisma.setting.findFirst({
        where: { key: { startsWith: `demo_${demoId}` } },
      });

      if (!demoData) {
        this.logger.warn(`Demo ${demoId} not found for follow-up scheduling`);
        return;
      }

      const demo = JSON.parse(demoData.value as string);
      const emailData: ConversionEmailData = {
        name: demo.name || 'there',
        email: demo.email,
        demoId: demoId,
        demoSubdomain: demo.subdomain || demoId,
        hoursUsed: demo.hoursUsed || 24,
        featuresUsed: demo.featuresUsed || ['posts', 'pages', 'themes'],
        upgradeUrl: `${this.baseUrl}/demo/upgrade?ref=${demoId}`,
        unsubscribeUrl: `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(demo.email)}&type=demo`,
      };

      // Send immediate expiration email
      const expiredEmail = getDemoExpiredEmail(emailData);
      await this.emailService.send({
        to: emailData.email,
        subject: expiredEmail.subject,
        html: expiredEmail.html,
      });

      // Schedule 24-hour follow-up
      await this.scheduleEmail(emailData, 'followup_24h', 24 * 60 * 60 * 1000);

      // Schedule 3-day follow-up
      await this.scheduleEmail(emailData, 'followup_3d', 3 * 24 * 60 * 60 * 1000);

      this.logger.log(`Scheduled follow-up emails for demo ${demoId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule follow-up emails for ${demoId}:`, error);
    }
  }

  private async scheduleEmail(data: ConversionEmailData, type: string, delayMs: number): Promise<void> {
    const sendAt = new Date(Date.now() + delayMs);
    
    await this.prisma.setting.create({
      data: {
        key: `scheduled_email_${data.demoId}_${type}`,
        value: JSON.stringify({
          type,
          data,
          sendAt: sendAt.toISOString(),
          sent: false,
        }) as any,
        type: 'json',
        group: 'scheduled_emails',
      },
    });
  }

  private getAdminNotificationHtml(inquiry: UpgradeInquiry): string {
    return `
      <h2>New Upgrade Inquiry</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${inquiry.name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${inquiry.email}">${inquiry.email}</a></td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Company</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${inquiry.company || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Service</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${inquiry.service}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Message</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${inquiry.message || 'No message'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Source</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${inquiry.source}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Demo ID</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${inquiry.demoId || 'Direct'}</td></tr>
      </table>
    `;
  }

  private getUserConfirmationHtml(inquiry: UpgradeInquiry): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Thanks for Reaching Out!</h2>
        <p>Hi ${inquiry.name},</p>
        <p>We've received your inquiry about <strong>${inquiry.service}</strong> and will get back to you within 24 hours.</p>
        <p>In the meantime, feel free to:</p>
        <ul>
          <li>Check out our <a href="${this.baseUrl}/docs">documentation</a></li>
          <li>Browse our <a href="${this.baseUrl}/themes">theme gallery</a></li>
          <li>Reply to this email if you have any questions</li>
        </ul>
        <p>Best regards,<br>The NodePress Team</p>
      </div>
    `;
  }

  /**
   * Get conversion analytics for admin dashboard
   */
  async getConversionAnalytics(): Promise<any> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Get all conversion events
      const events = await this.prisma.setting.findMany({
        where: {
          key: { startsWith: 'conversion_event_' },
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Get all inquiries
      const inquiries = await this.prisma.setting.findMany({
        where: {
          key: { startsWith: 'upgrade_inquiry_' },
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Parse and aggregate
      const parsedEvents = events.map(e => JSON.parse(e.value as string));
      const parsedInquiries = inquiries.map(i => JSON.parse(i.value as string));

      return {
        totalPageViews: parsedEvents.filter(e => e.eventType === 'page_view').length,
        totalCtaClicks: parsedEvents.filter(e => e.eventType === 'cta_click').length,
        hostingerClicks: parsedEvents.filter(e => e.eventType === 'hostinger_click').length,
        calendlyClicks: parsedEvents.filter(e => e.eventType === 'calendly_click').length,
        formSubmissions: parsedInquiries.length,
        inquiriesByService: this.groupBy(parsedInquiries, 'service'),
        conversionRate: events.length > 0 
          ? ((parsedInquiries.length / parsedEvents.filter(e => e.eventType === 'page_view').length) * 100).toFixed(2)
          : 0,
      };
    } catch (error) {
      this.logger.error('Failed to get conversion analytics:', error);
      return {};
    }
  }

  private groupBy(arr: any[], key: string): Record<string, number> {
    return arr.reduce((acc, item) => {
      const k = item[key] || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }
}

