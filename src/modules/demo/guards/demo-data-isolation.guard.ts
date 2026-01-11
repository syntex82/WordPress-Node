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
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

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
  // Admin API paths that demo users should NEVER access
  // These could expose real customer/admin data
  private readonly BLOCKED_FOR_DEMO = [
    '/api/users',           // Real users list
    '/api/backup',          // Backup/export could expose all data
    '/api/analytics',       // Real analytics data
    '/api/security',        // Security logs, sessions
    '/api/settings/smtp',   // Email config
    '/api/settings/stripe', // Payment config
    '/api/settings/ai',     // AI/API keys
    '/api/demos',           // Demo management (admin only)
    '/api/subscriptions',   // Real subscriptions
    '/api/marketplace',     // Marketplace data
    '/api/messages',        // Private messages
    '/api/notifications',   // Real notifications
  ];

  // Paths that ARE allowed for demo users (demo-isolated or read-only demo content)
  private readonly ALLOWED_FOR_DEMO = [
    '/api/auth/me',         // Current user profile
    '/api/auth/logout',     // Logout
    '/api/posts',           // Posts (filtered by demoInstanceId in service)
    '/api/pages',           // Pages (filtered by demoInstanceId in service)
    '/api/media',           // Media (filtered by demoInstanceId in service)
    '/api/themes',          // Theme browsing
    '/api/content',         // Content (filtered by demoInstanceId in service)
    '/api/menus',           // Menus
    '/api/public',          // Public API
    '/api/shop/products',   // Demo products
    '/api/lms',             // Demo courses
    '/api/seo',             // SEO settings (demo-safe)
    '/api/settings/site',   // Site settings (read only for demo)
    '/api/demos/track',     // Demo feature tracking
    '/api/demos/upgrade',   // Request upgrade
  ];

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const path = request.path;
    const method = request.method;

    // Not a demo user - allow everything
    if (!user?.isDemo && !user?.demoId && !request.cookies?.demo_mode) {
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

    // Check if path is in blocked list
    const isBlocked = this.BLOCKED_FOR_DEMO.some(blocked => 
      path.startsWith(blocked)
    );

    if (isBlocked) {
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
      // For non-GET requests on most paths, we should be more restrictive
      // but the service layer filtering should handle data isolation
      return true;
    }

    // Non-API paths are allowed (static files, public pages, etc)
    if (!path.startsWith('/api/')) {
      return true;
    }

    // Unknown API path for demo user - block by default for safety
    throw new ForbiddenException({
      message: 'This API endpoint is not available in demo mode',
      code: 'DEMO_API_BLOCKED',
      path: path,
      suggestion: 'This feature requires a full license',
    });
  }
}

