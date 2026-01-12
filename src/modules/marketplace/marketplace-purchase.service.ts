/**
 * Marketplace Purchase Service
 * Handles plugin and theme purchases
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LicenseKeyGenerator } from '../licensing/license-key-generator.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class MarketplacePurchaseService {
  private readonly logger = new Logger(MarketplacePurchaseService.name);

  constructor(
    private prisma: PrismaService,
    private keyGenerator: LicenseKeyGenerator,
    private emailService: EmailService,
  ) {}

  /**
   * Purchase a plugin
   */
  async purchasePlugin(userId: string, pluginId: string, orderId?: string) {
    const plugin = await this.prisma.marketplacePlugin.findUnique({
      where: { id: pluginId },
    });

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    // Check if already purchased
    const existing = await this.prisma.pluginPurchase.findUnique({
      where: { userId_pluginId: { userId, pluginId } },
    });

    if (existing) {
      return existing;
    }

    // Generate license key for premium plugins
    const licenseKey = plugin.isPremium 
      ? this.keyGenerator.generateKey({
          email: '', // Will be filled from user
          tier: 'PLUGIN',
          maxSites: 1,
          features: ['plugin-' + plugin.slug],
        })
      : null;

    const purchase = await this.prisma.pluginPurchase.create({
      data: {
        userId,
        pluginId,
        orderId,
        licenseKey,
        status: 'active',
      },
      include: {
        plugin: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Update plugin download count
    await this.prisma.marketplacePlugin.update({
      where: { id: pluginId },
      data: { downloads: { increment: 1 } },
    });

    this.logger.log(`Plugin purchased: ${plugin.name} by user ${userId}`);

    // Send purchase confirmation
    try {
      await this.sendPurchaseConfirmation(purchase, 'plugin');
    } catch (error) {
      this.logger.warn('Failed to send purchase confirmation:', error.message);
    }

    return purchase;
  }

  /**
   * Purchase a theme
   */
  async purchaseTheme(userId: string, themeId: string, orderId?: string) {
    const theme = await this.prisma.marketplaceTheme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    // Check if already purchased
    const existing = await this.prisma.themePurchase.findUnique({
      where: { userId_themeId: { userId, themeId } },
    });

    if (existing) {
      return existing;
    }

    // Generate license key for premium themes
    const licenseKey = theme.isPremium 
      ? this.keyGenerator.generateKey({
          email: '',
          tier: 'THEME',
          maxSites: 1,
          features: ['theme-' + theme.slug],
        })
      : null;

    const purchase = await this.prisma.themePurchase.create({
      data: {
        userId,
        themeId,
        orderId,
        licenseKey,
        status: 'active',
      },
      include: {
        theme: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Update theme download count
    await this.prisma.marketplaceTheme.update({
      where: { id: themeId },
      data: { downloads: { increment: 1 } },
    });

    this.logger.log(`Theme purchased: ${theme.name} by user ${userId}`);

    try {
      await this.sendPurchaseConfirmation(purchase, 'theme');
    } catch (error) {
      this.logger.warn('Failed to send purchase confirmation:', error.message);
    }

    return purchase;
  }

  /**
   * Get user's purchased plugins
   */
  async getUserPlugins(userId: string) {
    return this.prisma.pluginPurchase.findMany({
      where: { userId, status: 'active' },
      include: { plugin: true },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  /**
   * Get user's purchased themes
   */
  async getUserThemes(userId: string) {
    return this.prisma.themePurchase.findMany({
      where: { userId, status: 'active' },
      include: { theme: true },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  /**
   * Check if user has purchased a plugin
   */
  async hasPluginAccess(userId: string, pluginId: string): Promise<boolean> {
    const purchase = await this.prisma.pluginPurchase.findUnique({
      where: { userId_pluginId: { userId, pluginId } },
    });
    return !!purchase && purchase.status === 'active';
  }

  /**
   * Check if user has purchased a theme
   */
  async hasThemeAccess(userId: string, themeId: string): Promise<boolean> {
    const purchase = await this.prisma.themePurchase.findUnique({
      where: { userId_themeId: { userId, themeId } },
    });
    return !!purchase && purchase.status === 'active';
  }

  /**
   * Get purchase statistics (admin)
   */
  async getPurchaseStats() {
    const [pluginPurchases, themePurchases, recentPlugins, recentThemes] = await Promise.all([
      this.prisma.pluginPurchase.count({ where: { status: 'active' } }),
      this.prisma.themePurchase.count({ where: { status: 'active' } }),
      this.prisma.pluginPurchase.count({
        where: {
          purchaseDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.themePurchase.count({
        where: {
          purchaseDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      totalPluginPurchases: pluginPurchases,
      totalThemePurchases: themePurchases,
      recentPluginPurchases: recentPlugins,
      recentThemePurchases: recentThemes,
    };
  }

  private async sendPurchaseConfirmation(purchase: any, type: 'plugin' | 'theme') {
    const item = type === 'plugin' ? purchase.plugin : purchase.theme;
    const licenseInfo = purchase.licenseKey
      ? `<p><strong>License Key:</strong> ${purchase.licenseKey}</p>`
      : '';
    const downloadInfo = item.downloadUrl
      ? `<p><a href="${item.downloadUrl}">Download ${item.name}</a></p>`
      : '';

    const html = `
      <h1>Purchase Confirmation</h1>
      <p>Hello ${purchase.user.name},</p>
      <p>Thank you for purchasing <strong>${item.name}</strong> (${type})!</p>
      ${licenseInfo}
      ${downloadInfo}
      <p>If you have any questions, please contact our support team.</p>
    `;

    await this.emailService.send({
      to: purchase.user.email,
      toName: purchase.user.name,
      subject: `Purchase Confirmation: ${item.name}`,
      html,
    });
  }
}

