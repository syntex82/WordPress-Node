/**
 * Email Queue Processor
 * Processes email sending jobs in the background
 */

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { QUEUE_EMAIL, EmailJobData } from '../queue.service';

@Processor(QUEUE_EMAIL)
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
      this.logger.log('📧 Email processor initialized');
    } else {
      this.logger.warn('📧 SMTP not configured - emails will be logged only');
    }
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    const { to, toName, subject, html, text } = job.data;

    this.logger.debug(`Processing email job ${job.id}: ${subject} -> ${to}`);

    if (!this.transporter) {
      this.logger.log(`[DRY RUN] Email to ${to}: ${subject}`);
      return { success: true, dryRun: true };
    }

    try {
      const fromEmail = this.configService.get<string>('SMTP_FROM');
      const fromName = this.configService.get<string>('SMTP_FROM_NAME', 'NodePress');

      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        html,
        text: text || this.htmlToText(html),
      });

      this.logger.log(`Email sent: ${info.messageId} -> ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Email job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Email job ${job.id} failed: ${error.message}`);
  }
}
