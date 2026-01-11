/**
 * Demo Data Isolation Guard
 *
 * CRITICAL SECURITY: Prevents demo users from accessing real admin data.
 *
 * This guard blocks demo users from accessing admin APIs that could expose
 * real user data, posts, pages, settings, etc. Demo users are only allowed
 * to access demo-specific endpoints and their own isolated demo data.
 *
 * Applied globally to protect the entire application.
 *
 * SECURITY NOTES:
 * - Demo users with ADMIN role are still demo users and should be blocked
 * - Only REAL SUPER_ADMIN/ADMIN (non-demo) can bypass these restrictions
 * - Default behavior is BLOCK for unknown paths (fail-closed)
 * - Service layer must also validate demoInstanceId for proper isolation
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

// Decorator to allow specific routes for demo users
export const ALLOW_DEMO_KEY = 'allowDemo';
export const AllowDemo = () => (target: any, key?: string, descriptor?: any) => {
  if (descriptor) {
    Reflect.defineMetadata(ALLOW_DEMO_KEY, true, descriptor.value);
    return descriptor;
  }
  Reflect.defineMetadata(ALLOW_DEMO_KEY, true, target);
  return target;
};

@Injectable()
export class DemoDataIsolationGuard implements CanActivate {
  private readonly logger = new Logger(DemoDataIsolationGuard.name);

  // Admin API paths that demo users should NEVER access
  // These could expose real customer/admin data
  // SECURITY: This list must be kept up-to-date as new endpoints are added
  private readonly BLOCKED_FOR_DEMO = [
    '/api/users',           // Real users list - could expose all user data
    '/api/backup',          // Backup/export could expose all data
    '/api/analytics',       // Real analytics data
    '/api/security',        // Security logs, sessions - sensitive security data
    '/api/settings/smtp',   // Email config - could expose credentials
    '/api/settings/stripe', // Payment config - could expose API keys
    '/api/settings/ai',     // AI/API keys - could expose API keys
    '/api/settings/api',    // API settings - could expose secrets
    '/api/settings/webhook',// Webhook config - sensitive endpoints
    '/api/demos',           // Demo management (admin only) - except track/upgrade
    '/api/subscriptions',   // Real subscriptions - financial data
    '/api/marketplace',     // Marketplace data - financial/user data
    '/api/messages',        // Private messages - user privacy
    '/api/notifications',   // Real notifications - user data
    '/api/groups',          // Group chats - could contain private messages
    '/api/conversations',   // Direct messages - user privacy
    '/api/developers',      // Developer portal - sensitive marketplace data
    '/api/projects',        // Client projects - business data
    '/api/hiring',          // Hiring requests - business data
    '/api/update',          // System updates - dangerous in demo
    '/api/plugins/install', // Plugin installation - security risk
    '/api/plugins/upload',  // Plugin upload - security risk
    '/api/themes/install',  // Theme installation - security risk
    '/api/themes/upload',   // Theme upload - security risk
    '/api/system',          // System info - could expose server details
    '/api/audit',           // Audit logs - security data
  ];

  // Paths that ARE allowed for demo users (demo-isolated or read-only demo content)
  // SECURITY: All these paths MUST have service-layer demoInstanceId filtering
  private readonly ALLOWED_FOR_DEMO = [
    '/api/auth/me',         // Current user profile (their own only)
    '/api/auth/logout',     // Logout (their own session)
    '/api/auth/profile',    // Profile update (their own only)
    '/api/posts',           // Posts (filtered by demoInstanceId in service)
    '/api/pages',           // Pages (filtered by demoInstanceId in service)
    '/api/media',           // Media (filtered by demoInstanceId in service)
    '/api/themes',          // Theme browsing (read-only)
    '/api/content',         // Content (filtered by demoInstanceId in service)
    '/api/menus',           // Menus (demo-specific)
    '/api/public',          // Public API (intentionally public)
    '/api/shop/products',   // Demo products (filtered by demoInstanceId)
    '/api/shop/cart',       // Demo cart (session-based)
    '/api/shop/orders',     // Demo orders (filtered by userId)
    '/api/lms',             // Demo courses (filtered by demoInstanceId)
    '/api/seo',             // SEO settings (demo-safe, read-only)
    '/api/settings/site',   // Site settings (read only for demo)
    '/api/demos/track',     // Demo feature tracking (their own demo)
    '/api/demos/upgrade',   // Request upgrade (their own demo)
    '/api/timeline',        // Social timeline (filtered by demoInstanceId)
    '/api/profile',         // Public profiles (limited data)
    '/api/feed',            // Activity feed (filtered by demoInstanceId)
  ];

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const path = request.path;
    const method = request.method;

    // SECURITY: Check multiple indicators for demo user status
    // - isDemo flag on user object
    // - demoId on user object (from JWT)
    // - demoInstanceId on user object
    // - demoContext set by interceptor
    // - demo_mode cookie (legacy support)
    const demoContext = request.demoContext;
    const isDemoUser =
      user?.isDemo === true ||
      !!user?.demoId ||
      !!user?.demoInstanceId ||
      demoContext?.isDemo === true ||
      request.cookies?.demo_mode === 'true';

    // SECURITY: REAL SUPER_ADMIN/ADMIN (not demo users) bypass all demo restrictions
    // Demo users with ADMIN role should NOT bypass - they're still demo users
    if ((user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && !isDemoUser) {
      return true;
    }

    // Not a demo user - allow everything
    if (!isDemoUser) {
      return true;
    }

    // Check if route is explicitly allowed for demo via decorator
    const allowDemo = this.reflector.getAllAndOverride<boolean>(ALLOW_DEMO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowDemo) {
      return true;
    }

    // SECURITY: Check if path is in blocked list FIRST (fail-closed approach)
    const isBlocked = this.BLOCKED_FOR_DEMO.some(blocked =>
      path.startsWith(blocked)
    );

    if (isBlocked) {
      this.logger.warn(`Demo user blocked from accessing: ${method} ${path}`);
      throw new ForbiddenException({
        message: 'This feature is not available in demo mode',
        code: 'DEMO_DATA_BLOCKED',
        suggestion: 'Upgrade to a full license to access all features and your own data',
      });
    }

    // Check if path is in allowed list
    const isAllowed = this.ALLOWED_FOR_DEMO.some(allowed =>
      path.startsWith(allowed)
    );

    // If explicitly allowed, permit access
    if (isAllowed) {
      // SECURITY: For write operations, log for audit purposes
      if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        this.logger.debug(`Demo user write operation: ${method} ${path}`);
      }
      return true;
    }

    // Non-API paths are allowed (static files, public pages, etc)
    if (!path.startsWith('/api/')) {
      return true;
    }

    // SECURITY: Unknown API path for demo user - block by default (fail-closed)
    this.logger.warn(`Demo user blocked from unknown API path: ${method} ${path}`);
    throw new ForbiddenException({
      message: 'This API endpoint is not available in demo mode',
      code: 'DEMO_API_BLOCKED',
      path: path,
      suggestion: 'This feature requires a full license',
    });
  }
}

