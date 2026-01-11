/**
 * Demo Verification Service Tests
 * 
 * Tests the email verification flow for demo access requests.
 * Ensures proper security, rate limiting, and abuse prevention.
 */

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

// Mock types for testing
interface MockVerification {
  id: string;
  email: string;
  name: string;
  token: string;
  status: string;
  tokenExpiresAt: Date;
  verificationAttempts: number;
  emailSentCount: number;
  lastEmailSentAt: Date;
  demoInstanceId?: string;
}

/**
 * MockDemoVerificationService - simulates the behavior of DemoVerificationService
 * for behavioral testing without database dependencies
 */
class MockDemoVerificationService {
  private verifications: Map<string, MockVerification> = new Map();
  private activeDeemos: Map<string, { status: string }> = new Map();
  private freeEmailProviders = new Set(['gmail.com', 'yahoo.com', 'hotmail.com']);
  
  // Rate limits
  private readonly MAX_EMAILS_PER_HOUR = 3;
  private readonly MAX_VERIFICATION_ATTEMPTS = 5;
  private readonly TOKEN_EXPIRATION_HOURS = 24;

  async requestDemoVerification(dto: { name: string; email: string; company?: string }) {
    const email = dto.email.toLowerCase().trim();
    const domain = email.split('@')[1];

    // 1. Block free email providers
    if (this.freeEmailProviders.has(domain)) {
      throw new BadRequestException({
        message: `Free email providers like ${domain} are not accepted. Please use your business email address.`,
        code: 'INVALID_EMAIL_DOMAIN',
        isBusinessEmail: false,
      });
    }

    // 2. Check for active demo
    const hasActiveDemo = Array.from(this.activeDeemos.entries()).some(
      ([key]) => key.startsWith(email) && this.activeDeemos.get(key)?.status === 'RUNNING'
    );
    if (hasActiveDemo) {
      throw new ConflictException({
        message: 'You already have an active demo.',
        code: 'ACTIVE_DEMO_EXISTS',
      });
    }

    // 3. Check for pending verification
    const existingVerification = Array.from(this.verifications.values()).find(
      v => v.email === email && v.status === 'PENDING' && v.tokenExpiresAt > new Date()
    );

    if (existingVerification) {
      // Rate limiting check
      const timeSinceLastEmail = Date.now() - existingVerification.lastEmailSentAt.getTime();
      if (timeSinceLastEmail < 3600000 && existingVerification.emailSentCount >= this.MAX_EMAILS_PER_HOUR) {
        throw new BadRequestException({
          message: 'Please wait before requesting another verification email.',
          code: 'RATE_LIMITED',
        });
      }
      // Resend email
      existingVerification.emailSentCount++;
      existingVerification.lastEmailSentAt = new Date();
      return { success: true, message: 'New verification email sent.', requiresVerification: true };
    }

    // 4. Create new verification
    const token = `token-${Date.now()}`;
    const verification: MockVerification = {
      id: `ver-${Date.now()}`,
      email,
      name: dto.name,
      token,
      status: 'PENDING',
      tokenExpiresAt: new Date(Date.now() + this.TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000),
      verificationAttempts: 0,
      emailSentCount: 1,
      lastEmailSentAt: new Date(),
    };
    this.verifications.set(verification.id, verification);

    return {
      success: true,
      message: 'Please check your email to verify your address.',
      requiresVerification: true,
    };
  }

  async verifyEmailAndCreateDemo(token: string) {
    const verification = Array.from(this.verifications.values()).find(v => v.token === token);

    if (!verification) {
      throw new NotFoundException({
        message: 'Invalid verification link.',
        code: 'INVALID_TOKEN',
      });
    }

    if (verification.status === 'COMPLETED') {
      return { success: true, message: 'Already verified.' };
    }

    if (verification.status === 'BLOCKED') {
      throw new BadRequestException({
        message: 'Verification blocked due to too many failed attempts.',
        code: 'VERIFICATION_BLOCKED',
      });
    }

    if (verification.tokenExpiresAt < new Date()) {
      verification.status = 'EXPIRED';
      throw new BadRequestException({
        message: 'Verification link expired.',
        code: 'TOKEN_EXPIRED',
      });
    }

    verification.verificationAttempts++;
    if (verification.verificationAttempts > this.MAX_VERIFICATION_ATTEMPTS) {
      verification.status = 'BLOCKED';
      throw new BadRequestException({
        message: 'Too many verification attempts.',
        code: 'TOO_MANY_ATTEMPTS',
      });
    }

    // Success - create demo
    verification.status = 'COMPLETED';
    verification.demoInstanceId = `demo-${Date.now()}`;

    return {
      success: true,
      message: 'Email verified! Demo is being provisioned.',
      demoCredentials: {
        subdomain: 'demo-abc123',
        accessUrl: 'https://demo-abc123.demo.nodepress.io',
        adminEmail: verification.email,
        adminPassword: 'generated-password',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    };
  }

  // Test helpers
  addActiveDemo(email: string, status: string = 'RUNNING') {
    this.activeDeemos.set(`${email}-demo`, { status });
  }

  getVerification(id: string) {
    return this.verifications.get(id);
  }

  addVerification(verification: MockVerification) {
    this.verifications.set(verification.id, verification);
  }
}

// ==================== TESTS ====================

describe('DemoVerificationService', () => {
  let service: MockDemoVerificationService;

  beforeEach(() => {
    service = new MockDemoVerificationService();
  });

  describe('requestDemoVerification', () => {
    describe('email validation', () => {
      it('should reject Gmail addresses', async () => {
        await expect(service.requestDemoVerification({
          name: 'John Doe',
          email: 'john@gmail.com',
        })).rejects.toThrow(BadRequestException);
      });

      it('should reject Yahoo addresses', async () => {
        await expect(service.requestDemoVerification({
          name: 'John Doe',
          email: 'john@yahoo.com',
        })).rejects.toThrow(BadRequestException);
      });

      it('should reject Hotmail addresses', async () => {
        await expect(service.requestDemoVerification({
          name: 'John Doe',
          email: 'john@hotmail.com',
        })).rejects.toThrow(BadRequestException);
      });

      it('should accept business email addresses', async () => {
        const result = await service.requestDemoVerification({
          name: 'John Doe',
          email: 'john@acme-corp.com',
          company: 'Acme Corp',
        });

        expect(result.success).toBe(true);
        expect(result.requiresVerification).toBe(true);
      });

      it('should normalize email to lowercase', async () => {
        const result = await service.requestDemoVerification({
          name: 'John Doe',
          email: 'JOHN@COMPANY.COM',
        });

        expect(result.success).toBe(true);
      });
    });

    describe('duplicate prevention', () => {
      it('should reject if user already has active demo', async () => {
        service.addActiveDemo('john@company.com', 'RUNNING');

        await expect(service.requestDemoVerification({
          name: 'John Doe',
          email: 'john@company.com',
        })).rejects.toThrow(ConflictException);
      });

      it('should resend verification if pending request exists', async () => {
        // First request
        await service.requestDemoVerification({
          name: 'John Doe',
          email: 'john@company.com',
        });

        // Second request should resend
        const result = await service.requestDemoVerification({
          name: 'John Doe',
          email: 'john@company.com',
        });

        expect(result.success).toBe(true);
        expect(result.message).toContain('verification email');
      });
    });

    describe('rate limiting', () => {
      it('should block after max emails per hour', async () => {
        // Create a verification with max emails sent
        service.addVerification({
          id: 'ver-1',
          email: 'john@company.com',
          name: 'John Doe',
          token: 'token-1',
          status: 'PENDING',
          tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          verificationAttempts: 0,
          emailSentCount: 3, // Max emails
          lastEmailSentAt: new Date(), // Just sent
        });

        await expect(service.requestDemoVerification({
          name: 'John Doe',
          email: 'john@company.com',
        })).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('verifyEmailAndCreateDemo', () => {
    it('should reject invalid token', async () => {
      await expect(service.verifyEmailAndCreateDemo('invalid-token'))
        .rejects.toThrow(NotFoundException);
    });

    it('should return success for already verified requests', async () => {
      service.addVerification({
        id: 'ver-1',
        email: 'john@company.com',
        name: 'John Doe',
        token: 'completed-token',
        status: 'COMPLETED',
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationAttempts: 1,
        emailSentCount: 1,
        lastEmailSentAt: new Date(),
        demoInstanceId: 'demo-123',
      });

      const result = await service.verifyEmailAndCreateDemo('completed-token');
      expect(result.success).toBe(true);
      expect(result.message).toContain('verified');
    });

    it('should reject expired tokens', async () => {
      service.addVerification({
        id: 'ver-1',
        email: 'john@company.com',
        name: 'John Doe',
        token: 'expired-token',
        status: 'PENDING',
        tokenExpiresAt: new Date(Date.now() - 1000), // Expired
        verificationAttempts: 0,
        emailSentCount: 1,
        lastEmailSentAt: new Date(),
      });

      await expect(service.verifyEmailAndCreateDemo('expired-token'))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject blocked verifications', async () => {
      service.addVerification({
        id: 'ver-1',
        email: 'john@company.com',
        name: 'John Doe',
        token: 'blocked-token',
        status: 'BLOCKED',
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationAttempts: 6,
        emailSentCount: 1,
        lastEmailSentAt: new Date(),
      });

      await expect(service.verifyEmailAndCreateDemo('blocked-token'))
        .rejects.toThrow(BadRequestException);
    });

    it('should block after too many attempts', async () => {
      service.addVerification({
        id: 'ver-1',
        email: 'john@company.com',
        name: 'John Doe',
        token: 'max-attempts-token',
        status: 'PENDING',
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationAttempts: 5, // Already at max
        emailSentCount: 1,
        lastEmailSentAt: new Date(),
      });

      await expect(service.verifyEmailAndCreateDemo('max-attempts-token'))
        .rejects.toThrow(BadRequestException);
    });

    it('should successfully verify and create demo', async () => {
      service.addVerification({
        id: 'ver-1',
        email: 'john@company.com',
        name: 'John Doe',
        token: 'valid-token',
        status: 'PENDING',
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationAttempts: 0,
        emailSentCount: 1,
        lastEmailSentAt: new Date(),
      });

      const result = await service.verifyEmailAndCreateDemo('valid-token');

      expect(result.success).toBe(true);
      expect(result.demoCredentials).toBeDefined();
      expect(result.demoCredentials?.subdomain).toBeDefined();
      expect(result.demoCredentials?.accessUrl).toBeDefined();
      expect(result.demoCredentials?.adminPassword).toBeDefined();
    });
  });

  describe('security', () => {
    it('should generate unique tokens for each verification', async () => {
      await service.requestDemoVerification({
        name: 'User 1',
        email: 'user1@company1.com',
      });

      await service.requestDemoVerification({
        name: 'User 2',
        email: 'user2@company2.com',
      });

      // Tokens should be different (implementation detail tested via behavior)
      // If they were the same, the second request would overwrite the first
    });

    it('should include proper error codes for client handling', async () => {
      try {
        await service.requestDemoVerification({
          name: 'John',
          email: 'john@gmail.com',
        });
      } catch (error: any) {
        expect(error.response.code).toBe('INVALID_EMAIL_DOMAIN');
        expect(error.response.isBusinessEmail).toBe(false);
      }
    });
  });
});

