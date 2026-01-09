import { Test, TestingModule } from '@nestjs/testing';
import { SystemEmailService } from './system-email.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from './email.service';

describe('SystemEmailService', () => {
  let service: SystemEmailService;
  let prismaService: jest.Mocked<PrismaService>;
  let emailService: jest.Mocked<EmailService>;

  const mockSiteContext = {
    site: {
      name: 'Test Site',
      url: 'https://test.com',
      supportEmail: 'support@test.com',
    },
    adminUrl: 'https://admin.test.com',
    supportEmail: 'support@test.com',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      emailTemplate: {
        findUnique: jest.fn(),
      },
    };

    const mockEmailService = {
      send: jest.fn().mockResolvedValue({ success: true }),
      renderTemplate: jest.fn((content, vars) => content),
      getSiteContext: jest.fn().mockResolvedValue(mockSiteContext),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemEmailService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<SystemEmailService>(SystemEmailService);
    prismaService = module.get(PrismaService);
    emailService = module.get(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    const baseData = {
      to: 'user@test.com',
      toName: 'Test User',
      userId: 'user-123',
      firstName: 'Test',
      resetUrl: 'https://test.com/reset?token=abc',
      expiresIn: '1 hour',
      supportUrl: 'https://test.com/support',
      supportEmail: 'support@test.com',
    };

    it('should use database template when available', async () => {
      const dbTemplate = {
        id: 'template-1',
        slug: 'password-reset',
        subject: 'Reset your {{site.name}} password',
        htmlContent: '<h1>Reset Password for {{user.firstName}}</h1>',
        isActive: true,
      };
      (prismaService.emailTemplate.findUnique as jest.Mock).mockResolvedValue(dbTemplate);
      emailService.renderTemplate.mockImplementation((content) =>
        content.replace('{{user.firstName}}', 'Test'),
      );

      await service.sendPasswordResetEmail(baseData);

      expect(prismaService.emailTemplate.findUnique).toHaveBeenCalledWith({
        where: { slug: 'password-reset' },
      });
      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          toName: 'Test User',
          recipientId: 'user-123',
          metadata: { type: 'password_reset' },
        }),
      );
    });

    it('should use fallback template when database template not found', async () => {
      (prismaService.emailTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      await service.sendPasswordResetEmail(baseData);

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Reset Your Password',
        }),
      );
    });

    it('should use fallback template when database template is inactive', async () => {
      const dbTemplate = {
        id: 'template-1',
        slug: 'password-reset',
        subject: 'Reset password',
        htmlContent: '<h1>Reset</h1>',
        isActive: false,
      };
      (prismaService.emailTemplate.findUnique as jest.Mock).mockResolvedValue(dbTemplate);

      await service.sendPasswordResetEmail(baseData);

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Reset Your Password',
        }),
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    const baseData = {
      to: 'user@test.com',
      toName: 'Test User',
      userId: 'user-123',
      firstName: 'Test',
      loginUrl: 'https://test.com/login',
    };

    it('should send welcome email with correct metadata', async () => {
      (prismaService.emailTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      await service.sendWelcomeEmail(baseData);

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          recipientId: 'user-123',
          metadata: { type: 'welcome' },
        }),
      );
    });
  });

  describe('sendCourseEnrollmentEmail', () => {
    const baseData = {
      to: 'user@test.com',
      toName: 'Test User',
      userId: 'user-123',
      firstName: 'Test',
      course: { title: 'JavaScript Basics', description: 'Learn JS', lessons: 10 },
      courseUrl: 'https://test.com/courses/js-basics',
    };

    it('should send course enrollment email with correct metadata', async () => {
      (prismaService.emailTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      await service.sendCourseEnrollmentEmail(baseData);

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          recipientId: 'user-123',
          metadata: { type: 'course_enrollment', courseTitle: 'JavaScript Basics' },
        }),
      );
    });
  });

  describe('sendOrderConfirmationEmail', () => {
    const baseData = {
      to: 'user@test.com',
      toName: 'Test User',
      userId: 'user-123',
      firstName: 'Test',
      order: {
        number: 'ORD-12345',
        date: 'January 5, 2026',
        items: [{ name: 'Product 1', quantity: 1, total: '19.99' }],
        subtotal: '19.99',
        total: '19.99',
      },
      orderUrl: 'https://test.com/orders/ORD-12345',
    };

    it('should send order confirmation email with correct metadata', async () => {
      (prismaService.emailTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      await service.sendOrderConfirmationEmail(baseData);

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          recipientId: 'user-123',
          metadata: { type: 'order_confirmation', orderNumber: 'ORD-12345' },
        }),
      );
    });

    it('should use database template when available', async () => {
      const dbTemplate = {
        id: 'template-1',
        slug: 'order-confirmation',
        subject: 'Order #{{order.number}} confirmed',
        htmlContent: '<h1>Order {{order.number}}</h1>',
        isActive: true,
      };
      (prismaService.emailTemplate.findUnique as jest.Mock).mockResolvedValue(dbTemplate);

      await service.sendOrderConfirmationEmail(baseData);

      expect(prismaService.emailTemplate.findUnique).toHaveBeenCalledWith({
        where: { slug: 'order-confirmation' },
      });
      expect(emailService.renderTemplate).toHaveBeenCalled();
    });
  });
});
