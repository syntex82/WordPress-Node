import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Demo Mode Middleware
 * 
 * Applies restrictions when running in demo mode:
 * - Blocks real email sending
 * - Blocks external payment processing
 * - Blocks certain dangerous operations
 * - Adds demo banner/watermark
 */
@Injectable()
export class DemoModeMiddleware implements NestMiddleware {
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
    { method: 'DELETE', path: '/api/users' }, // Bulk user deletion
  ];

  private readonly DEMO_RESTRICTED_PATHS = [
    '/api/settings/smtp', // SMTP configuration
    '/api/settings/stripe', // Stripe configuration
    '/api/settings/ai', // AI API keys
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // Only apply in demo mode
    if (process.env.DEMO_MODE !== 'true') {
      return next();
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
          suggestion: 'Contact sales to upgrade your demo',
        });
      }
    }

    // Add demo mode headers
    res.setHeader('X-Demo-Mode', 'true');
    res.setHeader('X-Demo-Subdomain', process.env.DEMO_SUBDOMAIN || 'demo');
    
    // Calculate remaining demo time
    const expiresAt = process.env.DEMO_EXPIRES_AT;
    if (expiresAt) {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      res.setHeader('X-Demo-Remaining-Ms', Math.max(0, remaining).toString());
    }

    next();
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

    // Simulate successful payment
    const transactionId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

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

