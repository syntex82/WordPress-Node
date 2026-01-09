/**
 * Email Templates Seeder Service
 * Seeds default email templates on application startup
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailTemplateType } from '@prisma/client';
import {
  getWelcomeTemplate,
  getPasswordResetTemplate,
  getOrderConfirmationTemplate,
  getCourseEnrollmentTemplate,
  getNewsletterTemplate,
} from './templates';

@Injectable()
export class EmailTemplatesSeederService implements OnModuleInit {
  private readonly logger = new Logger(EmailTemplatesSeederService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedTemplates();
  }

  async seedTemplates() {
    const templates = [
      {
        slug: 'welcome-email',
        name: 'Welcome Email',
        type: EmailTemplateType.WELCOME,
        subject: 'Welcome to {{site.name}}! 🎉',
        htmlContent: getWelcomeTemplate(),
        variables: [
          { name: 'user.name', description: 'User full name' },
          { name: 'user.firstName', description: 'User first name' },
          { name: 'user.email', description: 'User email' },
          { name: 'site.name', description: 'Site name' },
          { name: 'site.url', description: 'Site URL' },
          { name: 'loginUrl', description: 'Login URL' },
        ],
        isSystem: true,
      },
      {
        slug: 'password-reset',
        name: 'Password Reset',
        type: EmailTemplateType.PASSWORD_RESET,
        subject: 'Reset Your Password - {{site.name}}',
        htmlContent: getPasswordResetTemplate({
          user: { firstName: '{{user.firstName}}' },
          resetUrl: '{{resetUrl}}',
          expiresIn: '{{expiresIn}}',
          supportUrl: '{{supportUrl}}',
          supportEmail: '{{supportEmail}}',
        }),
        variables: [
          { name: 'user.firstName', description: 'User first name' },
          { name: 'resetUrl', description: 'Password reset URL' },
          { name: 'expiresIn', description: 'Link expiration time' },
          { name: 'supportUrl', description: 'Support page URL' },
          { name: 'supportEmail', description: 'Support email address' },
          { name: 'site.name', description: 'Site name' },
        ],
        isSystem: true,
      },
      {
        slug: 'order-confirmation',
        name: 'Order Confirmation',
        type: EmailTemplateType.ORDER_CONFIRMATION,
        subject: 'Order Confirmed #{{order.number}} - {{site.name}}',
        htmlContent: getOrderConfirmationTemplate(),
        variables: [
          { name: 'user.name', description: 'Customer name' },
          { name: 'order.number', description: 'Order number' },
          { name: 'order.total', description: 'Order total' },
          { name: 'order.items', description: 'Order items array' },
          { name: 'order.shippingAddress', description: 'Shipping address' },
          { name: 'site.name', description: 'Site name' },
        ],
        isSystem: true,
      },
      {
        slug: 'course-enrollment',
        name: 'Course Enrollment',
        type: EmailTemplateType.COURSE_ENROLLMENT,
        subject: "You're Enrolled! 📚 {{course.title}}",
        htmlContent: getCourseEnrollmentTemplate(),
        variables: [
          { name: 'user.name', description: 'Student name' },
          { name: 'course.title', description: 'Course title' },
          { name: 'course.description', description: 'Course description' },
          { name: 'course.thumbnail', description: 'Course thumbnail URL' },
          { name: 'courseUrl', description: 'Course URL' },
          { name: 'site.name', description: 'Site name' },
        ],
        isSystem: true,
      },
      {
        slug: 'newsletter',
        name: 'Newsletter',
        type: EmailTemplateType.NEWSLETTER,
        subject: '{{subject}} - {{site.name}}',
        htmlContent: getNewsletterTemplate(),
        variables: [
          { name: 'user.name', description: 'Recipient name' },
          { name: 'subject', description: 'Email subject' },
          { name: 'content', description: 'Newsletter content (HTML)' },
          { name: 'site.name', description: 'Site name' },
          { name: 'unsubscribeUrl', description: 'Unsubscribe URL' },
        ],
        isSystem: true,
      },
    ];

    for (const template of templates) {
      const existing = await this.prisma.emailTemplate.findUnique({
        where: { slug: template.slug },
      });

      if (!existing) {
        await this.prisma.emailTemplate.create({
          data: {
            ...template,
            isActive: true,
          },
        });
        this.logger.log(`Created email template: ${template.name}`);
      }
    }

    this.logger.log('Email templates seeding complete');
  }
}
