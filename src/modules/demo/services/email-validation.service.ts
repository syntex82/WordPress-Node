/**
 * Email Validation Service for Demo Access
 * 
 * Validates email addresses for demo requests:
 * - Blocks free email providers (gmail, yahoo, etc.)
 * - Validates business email domains
 * - Checks for disposable email domains
 * 
 * SECURITY: Prevents spam demo requests and ensures business legitimacy
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

@Injectable()
export class EmailValidationService {
  private readonly logger = new Logger(EmailValidationService.name);

  // Free email providers that should be blocked for demo access
  // These are personal email domains, not business emails
  private readonly FREE_EMAIL_PROVIDERS = new Set([
    // Major free providers
    'gmail.com', 'googlemail.com',
    'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de', 'yahoo.it', 'yahoo.es',
    'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.it',
    'outlook.com', 'outlook.co.uk', 'outlook.fr', 'outlook.de',
    'live.com', 'live.co.uk', 'live.fr', 'live.de',
    'msn.com',
    'aol.com', 'aol.co.uk',
    'icloud.com', 'me.com', 'mac.com',
    'protonmail.com', 'protonmail.ch', 'proton.me', 'pm.me',
    'zoho.com', 'zohomail.com',
    'mail.com', 'email.com',
    'gmx.com', 'gmx.net', 'gmx.de',
    'yandex.com', 'yandex.ru',
    'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru',
    'qq.com', '163.com', '126.com', 'sina.com',
    'naver.com', 'daum.net',
    // Disposable email services
    'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'guerrillamail.org',
    'mailinator.com', 'mailnesia.com', 'throwaway.email', 'fakeinbox.com',
    'trashmail.com', 'trashmail.net', '10minutemail.com', 'minutemail.com',
    'dispostable.com', 'maildrop.cc', 'getnada.com', 'mohmal.com',
    'yopmail.com', 'yopmail.fr', 'sharklasers.com', 'grr.la', 'guerrillamailblock.com',
    'emailondeck.com', 'tempmailaddress.com', 'tempail.com', 'fakemailgenerator.com',
  ]);

  // Known disposable email domain patterns
  private readonly DISPOSABLE_PATTERNS = [
    /^temp/i, /temp$/i, /^fake/i, /fake$/i, /^trash/i, /trash$/i,
    /^throwaway/i, /throwaway$/i, /^disposable/i, /disposable$/i,
    /^10minute/i, /minute$/i, /^guerrilla/i, /^mailinator/i,
  ];

  /**
   * Validate an email address for demo access
   * Returns validation result with details
   */
  async validateBusinessEmail(email: string): Promise<{
    valid: boolean;
    reason?: string;
    domain: string;
    isBusinessEmail: boolean;
  }> {
    const emailLower = email.toLowerCase().trim();
    const domain = this.extractDomain(emailLower);

    // Check if it's a free email provider
    if (this.FREE_EMAIL_PROVIDERS.has(domain)) {
      return {
        valid: false,
        reason: `Free email providers like ${domain} are not accepted. Please use your business email address.`,
        domain,
        isBusinessEmail: false,
      };
    }

    // Check for disposable email patterns
    if (this.isDisposableEmail(domain)) {
      return {
        valid: false,
        reason: 'Disposable email addresses are not accepted. Please use your business email address.',
        domain,
        isBusinessEmail: false,
      };
    }

    // Verify the domain has valid MX records (can receive email)
    const hasMxRecords = await this.verifyMxRecords(domain);
    if (!hasMxRecords) {
      return {
        valid: false,
        reason: 'This email domain does not appear to be able to receive emails. Please use a valid business email.',
        domain,
        isBusinessEmail: false,
      };
    }

    return {
      valid: true,
      domain,
      isBusinessEmail: true,
    };
  }

  /**
   * Quick check if email is from a free provider (no MX verification)
   */
  isFreeEmailProvider(email: string): boolean {
    const domain = this.extractDomain(email.toLowerCase().trim());
    return this.FREE_EMAIL_PROVIDERS.has(domain) || this.isDisposableEmail(domain);
  }

  /**
   * Extract domain from email address
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length > 1 ? parts[1] : '';
  }

  /**
   * Check if domain matches disposable email patterns
   */
  private isDisposableEmail(domain: string): boolean {
    return this.DISPOSABLE_PATTERNS.some(pattern => pattern.test(domain));
  }

  /**
   * Verify domain has MX records (can receive email)
   */
  private async verifyMxRecords(domain: string): Promise<boolean> {
    try {
      const records = await resolveMx(domain);
      return records && records.length > 0;
    } catch (error: any) {
      // ENOTFOUND or ENODATA means no MX records
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return false;
      }
      // Other errors (network issues) - give benefit of doubt
      this.logger.warn(`MX lookup failed for ${domain}: ${error.message}`);
      return true;
    }
  }
}

