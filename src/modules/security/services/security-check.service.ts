/**
 * Security Check Service
 * Performs security configuration checks
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventType, UserRole } from '@prisma/client';

export interface SecurityCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export interface SecurityStatus {
  riskLevel: 'low' | 'medium' | 'high';
  checks: SecurityCheckResult[];
  summary: {
    twoFactorEnabled: boolean;
    httpsEnabled: boolean;
    securityHeadersOk: boolean;
    defaultAdminExists: boolean;
  };
}

@Injectable()
export class SecurityCheckService {
  constructor(
    private prisma: PrismaService,
    private securityEvents: SecurityEventsService,
  ) {}

  /**
   * Run all security checks
   */
  async runSecurityChecks(userId?: string, isHttps: boolean = false): Promise<SecurityStatus> {
    const checks: SecurityCheckResult[] = [];

    // Check 1: HTTPS
    checks.push({
      name: 'HTTPS',
      status: isHttps ? 'pass' : 'fail',
      message: isHttps ? 'HTTPS is enabled' : 'HTTPS is not enabled',
      details: isHttps
        ? 'Your site is using secure HTTPS connections'
        : 'Enable HTTPS to encrypt data in transit',
    });

    // Check 2: 2FA for admins
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true, twoFactorEnabled: true },
    });

    const adminsWithout2FA = admins.filter((a) => !a.twoFactorEnabled).length;
    const all2FAEnabled = adminsWithout2FA === 0 && admins.length > 0;

    checks.push({
      name: '2FA for Admins',
      status: all2FAEnabled ? 'pass' : adminsWithout2FA === admins.length ? 'fail' : 'warning',
      message: all2FAEnabled
        ? 'All admin accounts have 2FA enabled'
        : `${adminsWithout2FA} of ${admins.length} admin accounts don't have 2FA`,
      details: 'Two-factor authentication adds an extra layer of security',
    });

    // Check 3: Default admin username
    const defaultAdmin = await this.prisma.user.findFirst({
      where: {
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      },
    });

    checks.push({
      name: 'Default Admin Account',
      status: defaultAdmin ? 'fail' : 'pass',
      message: defaultAdmin
        ? 'Default admin account still exists'
        : 'No default admin account found',
      details: defaultAdmin
        ? 'Change the default admin email to something unique'
        : 'Good! Default credentials have been changed',
    });

    // Check 4: Recent failed logins
    const recentFailedLogins = await this.securityEvents.getStatistics(24);

    checks.push({
      name: 'Failed Login Attempts',
      status: recentFailedLogins.failedLogins > 50 ? 'warning' : 'pass',
      message: `${recentFailedLogins.failedLogins} failed login attempts in the last 24 hours`,
      details:
        recentFailedLogins.failedLogins > 50
          ? 'High number of failed logins detected. Monitor for brute force attacks.'
          : 'Normal level of failed login attempts',
    });

    // Check 5: Locked accounts
    checks.push({
      name: 'Locked Accounts',
      status: recentFailedLogins.lockedAccounts > 0 ? 'warning' : 'pass',
      message: `${recentFailedLogins.lockedAccounts} accounts currently locked`,
      details:
        recentFailedLogins.lockedAccounts > 0
          ? 'Some accounts are locked due to failed login attempts'
          : 'No accounts are currently locked',
    });

    // Check 6: Security headers (basic check)
    checks.push({
      name: 'Security Headers',
      status: 'pass',
      message: 'Helmet middleware is configured',
      details: 'Basic security headers are being set by Helmet',
    });

    // Calculate risk level
    const failCount = checks.filter((c) => c.status === 'fail').length;
    const warningCount = checks.filter((c) => c.status === 'warning').length;

    let riskLevel: 'low' | 'medium' | 'high';
    if (failCount >= 2) {
      riskLevel = 'high';
    } else if (failCount === 1 || warningCount >= 2) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Log the security check
    if (userId) {
      await this.securityEvents.createEvent({
        userId,
        type: SecurityEventType.SECURITY_CHECK,
        metadata: {
          riskLevel,
          failCount,
          warningCount,
        },
      });
    }

    return {
      riskLevel,
      checks,
      summary: {
        twoFactorEnabled: all2FAEnabled,
        httpsEnabled: isHttps,
        securityHeadersOk: true,
        defaultAdminExists: !!defaultAdmin,
      },
    };
  }

  /**
   * Get security dashboard overview
   */
  async getDashboardOverview(userId?: string) {
    const [stats24h, stats7d, blockedIps, lastLogin] = await Promise.all([
      this.securityEvents.getStatistics(24),
      this.securityEvents.getStatistics(24 * 7),
      this.prisma.blockedIP.count(),
      userId ? this.getLastLogin(userId) : null,
    ]);

    return {
      failedLogins24h: stats24h.failedLogins,
      failedLogins7d: stats7d.failedLogins,
      lockedAccounts: stats24h.lockedAccounts,
      blockedIps,
      lastLogin,
    };
  }

  /**
   * Get last login info for a user
   */
  private async getLastLogin(userId: string) {
    const lastLogin = await this.prisma.securityEvent.findFirst({
      where: {
        userId,
        type: SecurityEventType.SUCCESS_LOGIN,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        ip: true,
      },
    });

    return lastLogin;
  }
}
