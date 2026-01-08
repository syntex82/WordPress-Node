/**
 * System Email Service
 * Handles sending system emails using database templates with hardcoded fallbacks
 * This ensures emails always work even if database templates are missing
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from './email.service';
import { getPasswordResetTemplate } from './templates/password-reset-template';
import { getWelcomeTemplate } from './templates/welcome-template';
import { getCourseEnrollmentTemplate } from './templates/course-enrollment-template';
import { getOrderConfirmationTemplate } from './templates/order-confirmation-template';

@Injectable()
export class SystemEmailService {
  private readonly logger = new Logger(SystemEmailService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Send password reset email using database template or fallback
   */
  async sendPasswordResetEmail(data: {
    to: string;
    toName: string;
    userId: string;
    firstName: string;
    resetUrl: string;
    expiresIn: string;
    supportUrl: string;
  }) {
    const variables = {
      user: { firstName: data.firstName },
      resetUrl: data.resetUrl,
      expiresIn: data.expiresIn,
      supportUrl: data.supportUrl,
      site: await this.getSiteInfo(),
    };

    const { html, subject } = await this.getTemplateContent(
      'password-reset',
      variables,
      () =>
        getPasswordResetTemplate({
          user: { firstName: data.firstName },
          resetUrl: data.resetUrl,
          expiresIn: data.expiresIn,
          supportUrl: data.supportUrl,
        }),
      'Reset Your Password',
    );

    return this.emailService.send({
      to: data.to,
      toName: data.toName,
      subject,
      html,
      recipientId: data.userId,
      metadata: { type: 'password_reset' },
    });
  }

  /**
   * Send welcome email using database template or fallback
   */
  async sendWelcomeEmail(data: {
    to: string;
    toName: string;
    userId: string;
    firstName: string;
    loginUrl: string;
  }) {
    const siteContext = await this.emailService.getSiteContext();
    const variables = {
      user: { firstName: data.firstName, name: data.toName, email: data.to },
      loginUrl: data.loginUrl,
      joinDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      site: siteContext.site,
      docsUrl: siteContext.docsUrl,
      helpUrl: siteContext.helpUrl,
      supportEmail: siteContext.supportEmail,
      year: siteContext.year,
    };

    const { html, subject } = await this.getTemplateContent(
      'welcome-email',
      variables,
      () => getWelcomeTemplate(),
      `Welcome to ${siteContext.site.name}! 🎉`,
    );

    return this.emailService.send({
      to: data.to,
      toName: data.toName,
      subject,
      html,
      recipientId: data.userId,
      metadata: { type: 'welcome' },
    });
  }

  /**
   * Send course enrollment email using database template or fallback
   */
  async sendCourseEnrollmentEmail(data: {
    to: string;
    toName: string;
    userId: string;
    firstName: string;
    course: {
      title: string;
      description?: string;
      thumbnail?: string;
      instructor?: string;
      lessons?: number;
      duration?: string;
    };
    courseUrl: string;
  }) {
    const site = await this.getSiteInfo();
    const variables = {
      user: { firstName: data.firstName },
      course: data.course,
      courseUrl: data.courseUrl,
      site,
    };

    const { html, subject } = await this.getTemplateContent(
      'course-enrollment',
      variables,
      () => getCourseEnrollmentTemplate(),
      `You're Enrolled in ${data.course.title}! 📚`,
    );

    return this.emailService.send({
      to: data.to,
      toName: data.toName,
      subject,
      html,
      recipientId: data.userId,
      metadata: { type: 'course_enrollment', courseTitle: data.course.title },
    });
  }

  /**
   * Send order confirmation email using database template or fallback
   */
  async sendOrderConfirmationEmail(data: {
    to: string;
    toName: string;
    userId: string;
    firstName: string;
    order: {
      number: string;
      date: string;
      items: Array<{
        name: string;
        quantity: number;
        price?: string;
        total: string;
        image?: string;
        sku?: string;
        discount?: boolean;
      }>;
      subtotal: string;
      discount?: string;
      shipping?: string;
      tax?: string;
      total: string;
      shippingAddress?: {
        name: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
      billingAddress?: {
        name: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
    };
    orderUrl: string;
  }) {
    const site = await this.getSiteInfo();
    const variables = {
      user: { firstName: data.firstName },
      order: data.order,
      orderUrl: data.orderUrl,
      site,
    };

    const { html, subject } = await this.getTemplateContent(
      'order-confirmation',
      variables,
      () => getOrderConfirmationTemplate(),
      `Order Confirmed! #${data.order.number}`,
    );

    return this.emailService.send({
      to: data.to,
      toName: data.toName,
      subject,
      html,
      recipientId: data.userId,
      metadata: { type: 'order_confirmation', orderNumber: data.order.number },
    });
  }

  /**
   * Get template content from database or use fallback
   */
  private async getTemplateContent(
    slug: string,
    variables: Record<string, any>,
    fallbackFn: () => string,
    defaultSubject: string,
  ): Promise<{ html: string; subject: string }> {
    try {
      const template = await this.prisma.emailTemplate.findUnique({
        where: { slug },
      });

      if (template && template.isActive) {
        const html = this.emailService.renderTemplate(template.htmlContent, variables);
        const subject = this.emailService.renderTemplate(template.subject, variables);
        return { html, subject };
      }
    } catch (error) {
      this.logger.warn(`Failed to load template ${slug}, using fallback: ${error.message}`);
    }

    // Use fallback template
    return {
      html: fallbackFn(),
      subject: defaultSubject,
    };
  }

  /**
   * Get site info for email templates
   */
  private async getSiteInfo() {
    const siteContext = await this.emailService.getSiteContext();
    return siteContext.site;
  }
}
