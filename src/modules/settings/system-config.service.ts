/**
 * System Configuration Service
 * Manages encrypted system configuration stored in the database
 * Provides runtime configuration for SMTP, domains, and other sensitive settings
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { EncryptionService } from './encryption.service';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

export interface DomainConfig {
  frontendUrl: string;
  adminUrl: string;
  supportEmail: string;
  siteName: string;
}

export interface MarketplaceConfig {
  platformFeePercent: number;
  minPayoutAmount: number;
  maxEscrowDays: number;
  autoReleaseDays: number;
  enabled: boolean;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  isLiveMode: boolean;
  isConfigured: boolean;
}

// Keys that should be encrypted
const ENCRYPTED_KEYS = [
  'smtp_pass',
  'api_key',
  'webhook_secret',
  'stripe_secret_key',
  'stripe_webhook_secret',
];

@Injectable()
export class SystemConfigService implements OnModuleInit {
  private readonly logger = new Logger(SystemConfigService.name);
  private configCache: Map<string, string> = new Map();

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.loadConfigCache();
  }

  /**
   * Load all config values into memory cache
   */
  private async loadConfigCache() {
    try {
      const configs = await this.prisma.systemConfig.findMany();
      for (const config of configs) {
        const value = config.isEncrypted ? this.encryption.decrypt(config.value) : config.value;
        this.configCache.set(config.key, value);
      }
      this.logger.log(`Loaded ${configs.length} system config values`);
    } catch (_error) {
      this.logger.warn('Failed to load system config cache (table may not exist yet)');
    }
  }

  /**
   * Get a config value (from cache, DB, or env fallback)
   */
  async get(key: string, defaultValue?: string): Promise<string> {
    // Check cache first
    if (this.configCache.has(key)) {
      return this.configCache.get(key)!;
    }

    // Try database
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (config) {
      const value = config.isEncrypted ? this.encryption.decrypt(config.value) : config.value;
      this.configCache.set(key, value);
      return value;
    }

    // Fall back to env variable
    const envKey = key.toUpperCase();
    const envValue = this.configService.get<string>(envKey);
    if (envValue) return envValue;

    return defaultValue || '';
  }

  /**
   * Set a config value (encrypts if sensitive)
   */
  async set(key: string, value: string, group: string, description?: string): Promise<void> {
    const shouldEncrypt = ENCRYPTED_KEYS.includes(key);
    const storedValue = shouldEncrypt ? this.encryption.encrypt(value) : value;

    await this.prisma.systemConfig.upsert({
      where: { key },
      update: { value: storedValue, isEncrypted: shouldEncrypt, group, description },
      create: { key, value: storedValue, isEncrypted: shouldEncrypt, group, description },
    });

    // Update cache with decrypted value
    this.configCache.set(key, value);
    this.logger.log(`Config updated: ${key} (group: ${group})`);
  }

  /**
   * Delete a config value
   */
  async delete(key: string): Promise<void> {
    await this.prisma.systemConfig.delete({ where: { key } }).catch(() => {});
    this.configCache.delete(key);
  }

  /**
   * Get all config values for a group (decrypted)
   */
  async getGroup(group: string): Promise<Record<string, string>> {
    const configs = await this.prisma.systemConfig.findMany({ where: { group } });
    const result: Record<string, string> = {};

    for (const config of configs) {
      result[config.key] = config.isEncrypted
        ? this.encryption.decrypt(config.value)
        : config.value;
    }
    return result;
  }

  /**
   * Get SMTP configuration
   */
  async getSmtpConfig(): Promise<SmtpConfig> {
    return {
      host: await this.get('smtp_host', this.configService.get('SMTP_HOST', 'smtp.gmail.com')),
      port: parseInt(await this.get('smtp_port', this.configService.get('SMTP_PORT', '587')), 10),
      secure: (await this.get('smtp_secure', 'false')) === 'true',
      user: await this.get('smtp_user', this.configService.get('SMTP_USER', '')),
      pass: await this.get('smtp_pass', this.configService.get('SMTP_PASS', '')),
      fromEmail: await this.get('smtp_from', this.configService.get('SMTP_FROM', '')),
      fromName: await this.get(
        'smtp_from_name',
        this.configService.get('SMTP_FROM_NAME', 'NodePress CMS'),
      ),
    };
  }

  /**
   * Save SMTP configuration
   */
  async saveSmtpConfig(config: SmtpConfig): Promise<void> {
    // Trim all string values to prevent whitespace issues
    const host = config.host?.trim() || '';
    const user = config.user?.trim() || '';
    const pass = config.pass?.trim() || '';
    const fromEmail = config.fromEmail?.trim() || '';
    const fromName = config.fromName?.trim() || '';

    await this.set('smtp_host', host, 'email', 'SMTP server hostname');
    await this.set('smtp_port', config.port.toString(), 'email', 'SMTP server port');
    await this.set('smtp_secure', config.secure.toString(), 'email', 'Use TLS/SSL');
    await this.set('smtp_user', user, 'email', 'SMTP username');

    // Only update password if provided (not empty) - allows keeping existing password
    if (pass) {
      await this.set('smtp_pass', pass, 'email', 'SMTP password (encrypted)');
    }

    await this.set('smtp_from', fromEmail || user, 'email', 'Default from email');
    await this.set('smtp_from_name', fromName || 'NodePress CMS', 'email', 'Default from name');
  }

  /**
   * Get Domain configuration
   */
  async getDomainConfig(): Promise<DomainConfig> {
    return {
      frontendUrl: await this.get(
        'frontend_url',
        this.configService.get('FRONTEND_URL', 'http://localhost:3000'),
      ),
      adminUrl: await this.get(
        'admin_url',
        this.configService.get('ADMIN_URL', 'http://localhost:3000/admin'),
      ),
      supportEmail: await this.get('support_email', this.configService.get('SUPPORT_EMAIL', '')),
      siteName: await this.get(
        'site_name',
        this.configService.get('SITE_NAME', 'NodePress CMS'),
      ),
    };
  }

  /**
   * Save Domain configuration
   */
  async saveDomainConfig(config: DomainConfig): Promise<void> {
    await this.set('frontend_url', config.frontendUrl, 'domain', 'Frontend URL');
    await this.set('admin_url', config.adminUrl, 'domain', 'Admin panel URL');
    await this.set('support_email', config.supportEmail, 'domain', 'Support email address');
    await this.set('site_name', config.siteName, 'domain', 'Site name');
  }

  /**
   * Get Marketplace configuration
   */
  async getMarketplaceConfig(): Promise<MarketplaceConfig> {
    return {
      platformFeePercent: parseFloat(await this.get('marketplace_fee_percent', '10')),
      minPayoutAmount: parseFloat(await this.get('marketplace_min_payout', '10')),
      maxEscrowDays: parseInt(await this.get('marketplace_max_escrow_days', '90'), 10),
      autoReleaseDays: parseInt(await this.get('marketplace_auto_release_days', '14'), 10),
      enabled: (await this.get('marketplace_enabled', 'true')) === 'true',
    };
  }

  /**
   * Save Marketplace configuration
   */
  async saveMarketplaceConfig(config: MarketplaceConfig): Promise<void> {
    await this.set(
      'marketplace_fee_percent',
      config.platformFeePercent.toString(),
      'marketplace',
      'Platform fee percentage',
    );
    await this.set(
      'marketplace_min_payout',
      config.minPayoutAmount.toString(),
      'marketplace',
      'Minimum payout amount',
    );
    await this.set(
      'marketplace_max_escrow_days',
      config.maxEscrowDays.toString(),
      'marketplace',
      'Maximum escrow days',
    );
    await this.set(
      'marketplace_auto_release_days',
      config.autoReleaseDays.toString(),
      'marketplace',
      'Auto-release days after completion',
    );
    await this.set(
      'marketplace_enabled',
      config.enabled.toString(),
      'marketplace',
      'Marketplace enabled',
    );
  }

  /**
   * Get platform fee percentage (convenience method)
   */
  async getPlatformFeePercent(): Promise<number> {
    return parseFloat(await this.get('marketplace_fee_percent', '10'));
  }

  /**
   * Get Stripe configuration
   */
  async getStripeConfig(): Promise<StripeConfig> {
    const publishableKey = await this.get(
      'stripe_publishable_key',
      this.configService.get('STRIPE_PUBLISHABLE_KEY', ''),
    );
    const secretKey = await this.get(
      'stripe_secret_key',
      this.configService.get('STRIPE_SECRET_KEY', ''),
    );
    const webhookSecret = await this.get(
      'stripe_webhook_secret',
      this.configService.get('STRIPE_WEBHOOK_SECRET', ''),
    );

    // Determine if live mode based on key prefix
    const isLiveMode = publishableKey.startsWith('pk_live_') || secretKey.startsWith('sk_live_');
    const isConfigured = !!(publishableKey && secretKey);

    return {
      publishableKey,
      secretKey,
      webhookSecret,
      isLiveMode,
      isConfigured,
    };
  }

  /**
   * Save Stripe configuration
   */
  async saveStripeConfig(config: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  }): Promise<void> {
    if (config.publishableKey) {
      await this.set(
        'stripe_publishable_key',
        config.publishableKey,
        'payment',
        'Stripe publishable key',
      );
    }
    if (config.secretKey) {
      await this.set(
        'stripe_secret_key',
        config.secretKey,
        'payment',
        'Stripe secret key (encrypted)',
      );
    }
    if (config.webhookSecret) {
      await this.set(
        'stripe_webhook_secret',
        config.webhookSecret,
        'payment',
        'Stripe webhook secret (encrypted)',
      );
    }
  }

  /**
   * Check if system is configured (has admin and SMTP)
   */
  async isSetupComplete(): Promise<boolean> {
    try {
      const status = await this.prisma.setupStatus.findFirst();
      return status?.setupComplete ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Mark setup as complete
   */
  async markSetupComplete(): Promise<void> {
    await this.prisma.setupStatus.upsert({
      where: { id: 'setup' },
      update: { setupComplete: true, completedAt: new Date() },
      create: {
        id: 'setup',
        setupComplete: true,
        adminCreated: true,
        smtpConfigured: true,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Get or create setup status
   */
  async getSetupStatus() {
    let status = await this.prisma.setupStatus.findFirst();
    if (!status) {
      // Check if there's already an admin user
      const adminExists = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
      status = await this.prisma.setupStatus.create({
        data: {
          id: 'setup',
          adminCreated: !!adminExists,
          setupComplete: false,
        },
      });
    }
    return status;
  }

  /**
   * Invalidate config cache (force reload)
   */
  async invalidateCache(): Promise<void> {
    this.configCache.clear();
    await this.loadConfigCache();
  }
}
