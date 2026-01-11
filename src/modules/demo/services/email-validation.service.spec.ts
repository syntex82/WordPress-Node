/**
 * Email Validation Service Tests
 * 
 * Tests the business email validation logic for demo access requests.
 * This prevents abuse by blocking free email providers and disposable emails.
 */

import { EmailValidationService } from './email-validation.service';

describe('EmailValidationService', () => {
  let service: EmailValidationService;

  beforeEach(() => {
    service = new EmailValidationService();
  });

  describe('isFreeEmailProvider', () => {
    describe('should block major free email providers', () => {
      const freeProviders = [
        'gmail.com',
        'googlemail.com',
        'yahoo.com',
        'yahoo.co.uk',
        'hotmail.com',
        'outlook.com',
        'live.com',
        'aol.com',
        'icloud.com',
        'me.com',
        'protonmail.com',
        'proton.me',
        'zoho.com',
        'mail.com',
        'gmx.com',
        'yandex.com',
        'mail.ru',
      ];

      test.each(freeProviders)('should block %s', (domain) => {
        expect(service.isFreeEmailProvider(`user@${domain}`)).toBe(true);
      });
    });

    describe('should block disposable email services', () => {
      const disposableProviders = [
        'mailinator.com',
        'tempmail.com',
        'guerrillamail.com',
        '10minutemail.com',
        'yopmail.com',
        'trashmail.com',
        'fakeinbox.com',
        'maildrop.cc',
      ];

      test.each(disposableProviders)('should block %s', (domain) => {
        expect(service.isFreeEmailProvider(`user@${domain}`)).toBe(true);
      });
    });

    describe('should allow business email domains', () => {
      const businessDomains = [
        'company.com',
        'startup.io',
        'enterprise.co.uk',
        'business.de',
        'agency.fr',
        'consulting.org',
        'tech-company.com',
      ];

      test.each(businessDomains)('should allow %s', (domain) => {
        expect(service.isFreeEmailProvider(`user@${domain}`)).toBe(false);
      });
    });
  });

  describe('validateBusinessEmail', () => {
    it('should reject Gmail addresses with descriptive message', async () => {
      const result = await service.validateBusinessEmail('john@gmail.com');
      
      expect(result.valid).toBe(false);
      expect(result.isBusinessEmail).toBe(false);
      expect(result.domain).toBe('gmail.com');
      expect(result.reason).toContain('gmail.com');
      expect(result.reason).toContain('business email');
    });

    it('should reject Hotmail addresses', async () => {
      const result = await service.validateBusinessEmail('john@hotmail.com');
      
      expect(result.valid).toBe(false);
      expect(result.isBusinessEmail).toBe(false);
    });

    it('should reject disposable email addresses', async () => {
      const result = await service.validateBusinessEmail('temp@mailinator.com');

      expect(result.valid).toBe(false);
      expect(result.isBusinessEmail).toBe(false);
      // mailinator.com is in the FREE_EMAIL_PROVIDERS list, so it gets the free provider message
      expect(result.reason).toContain('not accepted');
    });

    it('should accept valid business email (with mocked MX)', async () => {
      // For domains that pass free/disposable checks and have valid MX
      // This tests the logic flow - actual MX verification is tested separately
      const mockValidate = jest.spyOn(service as any, 'verifyMxRecords');
      mockValidate.mockResolvedValue(true);
      
      const result = await service.validateBusinessEmail('ceo@acme-corp.com');
      
      expect(result.valid).toBe(true);
      expect(result.isBusinessEmail).toBe(true);
      expect(result.domain).toBe('acme-corp.com');
      
      mockValidate.mockRestore();
    });

    it('should normalize email to lowercase', async () => {
      const mockValidate = jest.spyOn(service as any, 'verifyMxRecords');
      mockValidate.mockResolvedValue(true);
      
      const result = await service.validateBusinessEmail('John.Doe@COMPANY.COM');
      
      expect(result.domain).toBe('company.com');
      
      mockValidate.mockRestore();
    });

    it('should reject domains without MX records', async () => {
      const mockValidate = jest.spyOn(service as any, 'verifyMxRecords');
      mockValidate.mockResolvedValue(false);
      
      const result = await service.validateBusinessEmail('user@nonexistent-domain-xyz.com');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('receive emails');
      
      mockValidate.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle international free email providers', () => {
      expect(service.isFreeEmailProvider('user@qq.com')).toBe(true);
      expect(service.isFreeEmailProvider('user@163.com')).toBe(true);
      expect(service.isFreeEmailProvider('user@naver.com')).toBe(true);
    });

    it('should detect pattern-based disposable domains', () => {
      // These match patterns like /^temp/i, /throwaway$/i
      expect(service.isFreeEmailProvider('user@temp-email-service.com')).toBe(true);
      expect(service.isFreeEmailProvider('user@fake-mail-xyz.com')).toBe(true);
    });

    it('should handle emails with special characters', async () => {
      const mockValidate = jest.spyOn(service as any, 'verifyMxRecords');
      mockValidate.mockResolvedValue(true);
      
      const result = await service.validateBusinessEmail('john.doe+demo@business.com');
      
      expect(result.domain).toBe('business.com');
      
      mockValidate.mockRestore();
    });
  });
});

