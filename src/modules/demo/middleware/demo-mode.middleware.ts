import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Demo Mode Middleware
 *
 * Applies restrictions when running in demo mode (either via env var or cookie):
 * - Blocks real email sending
 * - Blocks external payment processing
 * - Blocks certain dangerous operations (delete, settings changes)
 * - Adds demo mode headers for frontend
 *
 * Demo mode is active when:
 * 1. DEMO_MODE=true environment variable is set (global demo)
 * 2. demo_mode cookie is present (simulated demo for individual users)
 */
@Injectable()
export class DemoModeMiddleware implements NestMiddleware {
  // Completely blocked endpoints - never allowed in demo
  private readonly BLOCKED_ENDPOINTS = [
    // Email endpoints that send real emails
    { method: 'POST', path: '/api/email/send' },
    { method: 'POST', path: '/api/email/bulk' },
    { method: 'POST', path: '/api/email/test' },

    // Payment endpoints
    { method: 'POST', path: '/api/shop/checkout/create-payment-intent' },
    { method: 'POST', path: '/api/subscriptions/create' },
    { method: 'POST', path: '/api/marketplace/payments' },

    // System-level operations
    { method: 'POST', path: '/api/updates/apply' },
    { method: 'POST', path: '/api/backups/restore' },
    { method: 'DELETE', path: '/api/users' },

    // Delete operations (demo users shouldn't delete real data)
    { method: 'DELETE', path: '/api/posts' },
    { method: 'DELETE', path: '/api/pages' },
    { method: 'DELETE', path: '/api/products' },
    { method: 'DELETE', path: '/api/courses' },
    { method: 'DELETE', path: '/api/media' },
  ];

  // Paths where POST/PUT/DELETE are restricted
  private readonly DEMO_RESTRICTED_PATHS = [
    '/api/settings/smtp',
    '/api/settings/stripe',
    '/api/settings/ai',
    '/api/settings/site',
    '/api/auth/change-password',
    '/api/users/password',
    '/api/webhooks',
    '/api/api-keys',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // Check if in demo mode (env var or cookie)
    const isEnvDemo = process.env.DEMO_MODE === 'true';
    const demoCookie = req.cookies?.demo_mode;
    const isDemoMode = isEnvDemo || !!demoCookie;

    if (!isDemoMode) {
      return next();
    }

    // Note: user is attached by auth middleware, may not be available yet
    const user = (req as any).user;

    // Check if this is a demo user (has isDemo flag or demoId)
    const isDemoUser = user?.isDemo || user?.demoId || demoCookie;

    // REAL SUPER_ADMIN/ADMIN (not demo users) bypass demo restrictions
    // Demo users with ADMIN role should NOT bypass - they're still demo users
    if ((user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && !isDemoUser) {
      return next();
    }

    // Parse demo info from cookie if present
    let demoInfo: any = null;
    if (demoCookie) {
      try {
        demoInfo = JSON.parse(demoCookie);
      } catch {
        // Invalid cookie, ignore
      }
    }

    const { method, path } = req;

    // Check if endpoint is completely blocked
    const isBlocked = this.BLOCKED_ENDPOINTS.some(
      (e) => e.method === method && path.startsWith(e.path),
    );

    if (isBlocked) {
      throw new ForbiddenException({
        message: 'This action is disabled in demo mode',
        code: 'DEMO_RESTRICTED',
        action: this.getActionFromPath(method, path),
        suggestion: 'Upgrade to a full license to access this feature',
      });
    }

    // Check restricted paths (allow GET but block POST/PUT/DELETE)
    if (method !== 'GET') {
      const isRestricted = this.DEMO_RESTRICTED_PATHS.some((p) => path.startsWith(p));
      if (isRestricted) {
        throw new ForbiddenException({
          message: 'Configuration changes are disabled in demo mode',
          code: 'DEMO_CONFIG_RESTRICTED',
          action: this.getActionFromPath(method, path),
          suggestion: 'Upgrade to unlock all features',
        });
      }
    }

    // Add demo mode headers for frontend
    res.setHeader('X-Demo-Mode', 'true');

    if (demoInfo) {
      // Sanitize header values to prevent header injection
      const safeId = String(demoInfo.id || '').replace(/[\r\n]/g, '');
      const safeSubdomain = String(demoInfo.subdomain || '').replace(/[\r\n]/g, '');
      res.setHeader('X-Demo-Id', safeId);
      res.setHeader('X-Demo-Subdomain', safeSubdomain);
      if (demoInfo.expiresAt) {
        const remaining = new Date(demoInfo.expiresAt).getTime() - Date.now();
        res.setHeader('X-Demo-Remaining-Ms', Math.max(0, remaining).toString());
      }
    } else {
      res.setHeader('X-Demo-Subdomain', process.env.DEMO_SUBDOMAIN || 'demo');
      const expiresAt = process.env.DEMO_EXPIRES_AT;
      if (expiresAt) {
        const remaining = new Date(expiresAt).getTime() - Date.now();
        res.setHeader('X-Demo-Remaining-Ms', Math.max(0, remaining).toString());
      }
    }

    next();
  }

  /**
   * Map path to a human-readable action name for frontend
   */
  private getActionFromPath(method: string, path: string): string {
    if (method === 'DELETE') {
      if (path.includes('/users')) return 'delete_user';
      if (path.includes('/posts')) return 'delete_post';
      if (path.includes('/pages')) return 'delete_page';
      if (path.includes('/products')) return 'delete_product';
      if (path.includes('/courses')) return 'delete_course';
      if (path.includes('/media')) return 'delete_media';
    }
    if (path.includes('/settings/smtp') || path.includes('/email')) return 'update_email_settings';
    if (path.includes('/settings/stripe') || path.includes('/payment')) return 'update_payment_settings';
    if (path.includes('/settings')) return 'update_site_settings';
    if (path.includes('/password')) return 'change_password';
    if (path.includes('/api-keys')) return 'manage_api_keys';
    if (path.includes('/webhooks')) return 'manage_webhooks';
    if (path.includes('/export')) return 'export_data';
    if (path.includes('/import')) return 'import_data';
    return 'restricted_action';
  }
}

/**
 * Demo Mode Guard for specific routes
 */
import { Injectable as InjectableGuard, CanActivate, ExecutionContext } from '@nestjs/common';

@InjectableGuard()
export class DemoModeGuard implements CanActivate {
  private readonly allowedInDemo: string[];

  constructor(allowedFeatures: string[] = []) {
    this.allowedInDemo = allowedFeatures;
  }

  canActivate(context: ExecutionContext): boolean {
    if (process.env.DEMO_MODE !== 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const feature = request.params.feature || request.query.feature;

    if (feature && !this.allowedInDemo.includes(feature)) {
      throw new ForbiddenException({
        message: `The "${feature}" feature is restricted in demo mode`,
        code: 'DEMO_FEATURE_RESTRICTED',
      });
    }

    return true;
  }
}

/**
 * Demo email interceptor - captures emails instead of sending
 */
export class DemoEmailInterceptor {
  static intercept(emailData: any): { captured: boolean; message: string } {
    if (process.env.DEMO_MODE !== 'true') {
      return { captured: false, message: '' };
    }

    // Log the email that would have been sent
    console.log('[DEMO MODE] Email captured:', {
      to: emailData.to,
      subject: emailData.subject,
      timestamp: new Date().toISOString(),
    });

    return {
      captured: true,
      message: 'Email captured in demo mode (not actually sent)',
    };
  }
}

/**
 * Demo payment interceptor - simulates payments
 */
export class DemoPaymentInterceptor {
  static simulatePayment(amount: number, currency: string): {
    success: boolean;
    transactionId: string;
    message: string;
  } {
    if (process.env.DEMO_MODE !== 'true') {
      return { success: false, transactionId: '', message: 'Not in demo mode' };
    }

    // Simulate successful payment (use crypto for secure random ID)
    const { randomBytes } = require('crypto');
    const transactionId = `demo_${Date.now()}_${randomBytes(6).toString('hex')}`;

    console.log('[DEMO MODE] Payment simulated:', {
      amount,
      currency,
      transactionId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      transactionId,
      message: `Demo payment of ${currency} ${amount} processed successfully`,
    };
  }
}

