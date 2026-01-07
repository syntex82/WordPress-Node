/**
 * Stripe Service Tests
 * Tests for Stripe payment integration including webhook handling and order confirmation emails
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { PrismaService } from '../../../database/prisma.service';
import { SystemConfigService } from '../../settings/system-config.service';
import { SystemEmailService } from '../../email/system-email.service';
import { EmailService } from '../../email/email.service';

describe('StripeService', () => {
  let service: StripeService;
  let prismaService: jest.Mocked<PrismaService>;
  let systemEmailService: jest.Mocked<SystemEmailService>;
  let emailService: jest.Mocked<EmailService>;

  const mockSiteContext = {
    site: { name: 'Test Site', logo: undefined, address: undefined },
    year: 2026,
    loginUrl: 'https://test.com/login',
    supportEmail: 'support@test.com',
    helpUrl: 'https://test.com/help',
    frontendUrl: 'https://test.com',
    adminUrl: 'https://admin.test.com',
  };

  const mockOrder = {
    id: 'order-123',
    orderNumber: 'ORD-2501-ABC123',
    userId: 'user-456',
    email: 'customer@test.com',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    subtotal: 99.99,
    tax: 8.0,
    shipping: 5.0,
    discount: 0,
    total: 112.99,
    currency: 'USD',
    billingAddress: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'NYC',
      state: 'NY',
      zip: '10001',
      country: 'US',
    },
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'NYC',
      state: 'NY',
      zip: '10001',
      country: 'US',
    },
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date(),
    items: [
      {
        id: 'item-1',
        orderId: 'order-123',
        productId: 'prod-1',
        name: 'Test Product',
        sku: 'SKU-001',
        price: 99.99,
        quantity: 1,
        total: 99.99,
        product: {
          name: 'Test Product',
          images: ['https://example.com/image.jpg'],
          sku: 'SKU-001',
        },
        course: null,
      },
    ],
  };

  const mockPayment = {
    id: 'payment-789',
    orderId: 'order-123',
    amount: 112.99,
    currency: 'USD',
    status: 'UNPAID',
    stripePaymentIntentId: 'pi_test123',
  };

  const mockUser = {
    id: 'user-456',
    name: 'John Doe',
    email: 'john@test.com',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      payment: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      enrollment: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockSystemConfig = {
      getStripeConfig: jest.fn().mockResolvedValue({
        secretKey: '',
        publishableKey: '',
        webhookSecret: '',
        isLiveMode: false,
      }),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(''),
    };

    const mockSystemEmailService = {
      sendOrderConfirmationEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    const mockEmailService = {
      getSiteContext: jest.fn().mockResolvedValue(mockSiteContext),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SystemConfigService, useValue: mockSystemConfig },
        { provide: SystemEmailService, useValue: mockSystemEmailService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    prismaService = module.get(PrismaService);
    systemEmailService = module.get(SystemEmailService);
    emailService = module.get(EmailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isConfigured', () => {
    it('should return false when stripe is not initialized', () => {
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('handlePaymentSuccess (via handleWebhook)', () => {
    // Access private method for testing
    const callHandlePaymentSuccess = async (paymentIntent: any) => {
      return (service as any).handlePaymentSuccess(paymentIntent);
    };

    it('should send order confirmation email on successful payment', async () => {
      (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prismaService.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'PAID',
      });
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prismaService.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await callHandlePaymentSuccess({ id: 'pi_test123', latest_charge: 'ch_test123' });

      expect(systemEmailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@test.com',
          toName: 'John Doe',
          userId: 'user-456',
          firstName: 'John',
          order: expect.objectContaining({
            number: 'ORD-2501-ABC123',
            items: expect.arrayContaining([
              expect.objectContaining({
                name: 'Test Product',
                quantity: 1,
              }),
            ]),
          }),
          orderUrl: 'https://test.com/account/orders/order-123',
        }),
      );
    });

    it('should use order email when user not found', async () => {
      const orderWithoutUser = { ...mockOrder, userId: null };
      (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prismaService.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'PAID',
      });
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(orderWithoutUser);
      (prismaService.order.update as jest.Mock).mockResolvedValue({
        ...orderWithoutUser,
        status: 'CONFIRMED',
      });

      await callHandlePaymentSuccess({ id: 'pi_test123', latest_charge: 'ch_test123' });

      expect(systemEmailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@test.com',
        }),
      );
    });

    it('should not fail payment processing if email sending fails', async () => {
      (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prismaService.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'PAID',
      });
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prismaService.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (systemEmailService.sendOrderConfirmationEmail as jest.Mock).mockRejectedValue(
        new Error('Email failed'),
      );

      // Should not throw
      await expect(
        callHandlePaymentSuccess({ id: 'pi_test123', latest_charge: 'ch_test123' }),
      ).resolves.not.toThrow();

      // Payment should still be updated
      expect(prismaService.payment.update).toHaveBeenCalled();
      expect(prismaService.order.update).toHaveBeenCalled();
    });

    it('should skip email if payment not found', async () => {
      (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(null);

      await callHandlePaymentSuccess({ id: 'pi_nonexistent', latest_charge: 'ch_test123' });

      expect(systemEmailService.sendOrderConfirmationEmail).not.toHaveBeenCalled();
    });

    it('should skip email if order not found', async () => {
      (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prismaService.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'PAID',
      });
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(null);

      await callHandlePaymentSuccess({ id: 'pi_test123', latest_charge: 'ch_test123' });

      expect(systemEmailService.sendOrderConfirmationEmail).not.toHaveBeenCalled();
    });

    it('should include shipping address when available', async () => {
      (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prismaService.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'PAID',
      });
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prismaService.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await callHandlePaymentSuccess({ id: 'pi_test123', latest_charge: 'ch_test123' });

      expect(systemEmailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.objectContaining({
            shippingAddress: expect.objectContaining({
              street: '123 Main St',
              city: 'NYC',
              state: 'NY',
              zip: '10001',
            }),
          }),
        }),
      );
    });

    it('should handle order without shipping address (digital products)', async () => {
      const digitalOrder = { ...mockOrder, shippingAddress: null, shipping: 0 };
      (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prismaService.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'PAID',
      });
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(digitalOrder);
      (prismaService.order.update as jest.Mock).mockResolvedValue({
        ...digitalOrder,
        status: 'CONFIRMED',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await callHandlePaymentSuccess({ id: 'pi_test123', latest_charge: 'ch_test123' });

      expect(systemEmailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.objectContaining({
            shippingAddress: undefined,
          }),
        }),
      );
    });

    it('should enroll user in courses after successful payment', async () => {
      const courseOrder = {
        ...mockOrder,
        items: [
          {
            id: 'item-1',
            orderId: 'order-123',
            courseId: 'course-1',
            name: 'JavaScript Course',
            price: 99.99,
            quantity: 1,
            total: 99.99,
            product: null,
            course: { title: 'JavaScript Course', featuredImage: null },
          },
        ],
      };
      (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prismaService.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'PAID',
      });
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(courseOrder);
      (prismaService.order.update as jest.Mock).mockResolvedValue({
        ...courseOrder,
        status: 'CONFIRMED',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.enrollment.create as jest.Mock).mockResolvedValue({ id: 'enroll-1' });

      await callHandlePaymentSuccess({ id: 'pi_test123', latest_charge: 'ch_test123' });

      expect(prismaService.enrollment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          courseId: 'course-1',
          userId: 'user-456',
          status: 'ACTIVE',
        }),
      });
    });

    it('should not create duplicate enrollment', async () => {
      const courseOrder = {
        ...mockOrder,
        items: [
          {
            id: 'item-1',
            courseId: 'course-1',
            name: 'JavaScript Course',
            price: 99.99,
            quantity: 1,
            total: 99.99,
            product: null,
            course: { title: 'JavaScript Course', featuredImage: null },
          },
        ],
      };
      (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      (prismaService.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'PAID',
      });
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(courseOrder);
      (prismaService.order.update as jest.Mock).mockResolvedValue({
        ...courseOrder,
        status: 'CONFIRMED',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.enrollment.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-enroll',
      });

      await callHandlePaymentSuccess({ id: 'pi_test123', latest_charge: 'ch_test123' });

      expect(prismaService.enrollment.create).not.toHaveBeenCalled();
    });
  });
});
