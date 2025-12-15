/**
 * Security Controller
 * Handles all security-related endpoints
 */

import { Controller, Get, Post, Delete, Body, Query, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { SecurityEventsService } from './services/security-events.service';
import { IpBlockService } from './services/ip-block.service';
import { TwoFactorService } from './services/two-factor.service';
import { FileIntegrityService } from './services/file-integrity.service';
import { SecurityCheckService } from './services/security-check.service';
import { RateLimitService } from './services/rate-limit.service';
import { SessionService } from './services/session.service';
import { PasswordPolicyService } from './services/password-policy.service';

import {
  BlockIpDto,
  Enable2FADto,
  Verify2FADto,
  Disable2FADto,
  SecurityEventFiltersDto,
} from './dto/security.dto';

@Controller('api/security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
  constructor(
    private securityEvents: SecurityEventsService,
    private ipBlock: IpBlockService,
    private twoFactor: TwoFactorService,
    private fileIntegrity: FileIntegrityService,
    private securityCheck: SecurityCheckService,
    private rateLimit: RateLimitService,
    private session: SessionService,
    private passwordPolicy: PasswordPolicyService,
  ) {}

  /**
   * Get security dashboard overview
   */
  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  async getDashboard(@CurrentUser() user: any, @Req() req: Request) {
    const isHttps = req.protocol === 'https';
    const [overview, securityStatus] = await Promise.all([
      this.securityCheck.getDashboardOverview(user.id),
      this.securityCheck.runSecurityChecks(user.id, isHttps),
    ]);

    return {
      ...overview,
      securityStatus,
    };
  }

  /**
   * Run security checks
   */
  @Post('check')
  @Roles(UserRole.ADMIN)
  async runSecurityCheck(@CurrentUser() user: any, @Req() req: Request) {
    const isHttps = req.protocol === 'https';
    return this.securityCheck.runSecurityChecks(user.id, isHttps);
  }

  /**
   * Get security events (audit log)
   */
  @Get('events')
  @Roles(UserRole.ADMIN)
  async getEvents(@Query() filters: SecurityEventFiltersDto) {
    const parsedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      limit: filters.limit ? Number(filters.limit) : undefined,
      offset: filters.offset ? Number(filters.offset) : undefined,
    };

    return this.securityEvents.getEvents(parsedFilters);
  }

  /**
   * Get blocked IPs
   */
  @Get('blocked-ips')
  @Roles(UserRole.ADMIN)
  async getBlockedIps() {
    return this.ipBlock.getBlockedIps();
  }

  /**
   * Block an IP address
   */
  @Post('blocked-ips')
  @Roles(UserRole.ADMIN)
  async blockIp(@Body() dto: BlockIpDto, @CurrentUser() user: any) {
    return this.ipBlock.blockIp(dto, user.id);
  }

  /**
   * Unblock an IP address
   */
  @Delete('blocked-ips/:ip')
  @Roles(UserRole.ADMIN)
  async unblockIp(@Param('ip') ip: string, @CurrentUser() user: any) {
    return this.ipBlock.unblockIp(ip, user.id);
  }

  /**
   * Generate 2FA secret
   */
  @Post('2fa/generate')
  async generate2FASecret(@CurrentUser() user: any) {
    return this.twoFactor.generateSecret(user.id);
  }

  /**
   * Enable 2FA
   */
  @Post('2fa/enable')
  async enable2FA(@Body() dto: Enable2FADto, @CurrentUser() user: any, @Req() req: Request) {
    const ip = req.ip;
    return this.twoFactor.enable2FA(user.id, dto.secret, dto.token, ip);
  }

  /**
   * Disable 2FA
   */
  @Post('2fa/disable')
  async disable2FA(@Body() dto: Disable2FADto, @CurrentUser() user: any, @Req() req: Request) {
    const ip = req.ip;
    return this.twoFactor.disable2FA(user.id, dto.password, ip);
  }

  /**
   * Verify 2FA token
   */
  @Post('2fa/verify')
  async verify2FA(@Body() dto: Verify2FADto, @CurrentUser() user: any) {
    const isValid = await this.twoFactor.verifyToken(user.id, dto.token);
    return { valid: isValid };
  }

  /**
   * Generate file integrity baseline
   */
  @Post('integrity/baseline')
  @Roles(UserRole.ADMIN)
  async generateBaseline(@CurrentUser() user: any) {
    const hashes = await this.fileIntegrity.generateBaseline(user.id);
    return {
      success: true,
      fileCount: hashes.length,
      message: 'Baseline generated successfully',
    };
  }

  /**
   * Scan for file changes
   */
  @Post('integrity/scan')
  @Roles(UserRole.ADMIN)
  async scanIntegrity(@CurrentUser() user: any) {
    return this.fileIntegrity.scanForChanges(user.id);
  }

  // ==================== Rate Limiting ====================

  /**
   * Get all rate limit configurations
   */
  @Get('rate-limits')
  @Roles(UserRole.ADMIN)
  async getRateLimits() {
    return this.rateLimit.getAllConfigs();
  }

  /**
   * Create or update rate limit config
   */
  @Post('rate-limits')
  @Roles(UserRole.ADMIN)
  async upsertRateLimit(
    @Body()
    data: {
      endpoint: string;
      windowMs: number;
      maxRequests: number;
      enabled: boolean;
      blockDuration?: number;
    },
  ) {
    return this.rateLimit.upsertConfig(data);
  }

  /**
   * Delete rate limit config
   */
  @Delete('rate-limits/:endpoint')
  @Roles(UserRole.ADMIN)
  async deleteRateLimit(@Param('endpoint') endpoint: string) {
    return this.rateLimit.deleteConfig(decodeURIComponent(endpoint));
  }

  /**
   * Get rate limit violations
   */
  @Get('rate-limits/violations')
  @Roles(UserRole.ADMIN)
  async getRateLimitViolations(@Query('limit') limit?: string) {
    return this.rateLimit.getViolations(limit ? parseInt(limit) : 100);
  }

  // ==================== Session Management ====================

  /**
   * Get all active sessions
   */
  @Get('sessions')
  @Roles(UserRole.ADMIN)
  async getAllSessions(@Query('userId') userId?: string) {
    return this.session.getAllSessions(userId);
  }

  /**
   * Get sessions for current user
   */
  @Get('sessions/me')
  async getMySession(@CurrentUser() user: any) {
    return this.session.getUserSessions(user.id);
  }

  /**
   * Force logout a specific session
   */
  @Delete('sessions/:sessionId')
  @Roles(UserRole.ADMIN)
  async forceLogout(@Param('sessionId') sessionId: string, @CurrentUser() user: any) {
    return this.session.forceLogout(sessionId, user.id);
  }

  /**
   * Force logout all sessions for a user
   */
  @Delete('sessions/user/:userId')
  @Roles(UserRole.ADMIN)
  async forceLogoutAll(@Param('userId') userId: string, @CurrentUser() user: any) {
    return this.session.forceLogoutAll(userId, user.id);
  }

  /**
   * Clean up expired sessions
   */
  @Post('sessions/cleanup')
  @Roles(UserRole.ADMIN)
  async cleanupSessions() {
    return this.session.cleanupExpiredSessions();
  }

  // ==================== Password Policy ====================

  /**
   * Get password policy configuration
   */
  @Get('password-policy')
  @Roles(UserRole.ADMIN)
  async getPasswordPolicy() {
    return this.passwordPolicy.getPolicy();
  }

  /**
   * Update password policy configuration
   */
  @Post('password-policy')
  @Roles(UserRole.ADMIN)
  async updatePasswordPolicy(@Body() config: any) {
    return this.passwordPolicy.updatePolicy(config);
  }

  /**
   * Validate a password against current policy
   */
  @Post('password-policy/validate')
  async validatePassword(@Body() data: { password: string; userId?: string }) {
    return this.passwordPolicy.validatePassword(data.password, data.userId);
  }

  /**
   * Check if user's password has expired
   */
  @Get('password-policy/expired/:userId')
  @Roles(UserRole.ADMIN)
  async checkPasswordExpired(@Param('userId') userId: string) {
    const expired = await this.passwordPolicy.isPasswordExpired(userId);
    return { expired };
  }
}
