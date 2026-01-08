/**
 * Demo Mode Middleware Tests
 */

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DemoModeGuard, DemoEmailInterceptor, DemoPaymentInterceptor } from './demo-mode.middleware';

describe('DemoModeGuard', () => {
  let guard: DemoModeGuard;
  const originalEnv = process.env.DEMO_MODE;

  beforeEach(() => {
    guard = new DemoModeGuard(['allowed_feature']);
  });

  afterEach(() => {
    process.env.DEMO_MODE = originalEnv;
  });

  it('should allow requests when not in demo mode', () => {
    process.env.DEMO_MODE = 'false';

    const context = createMockExecutionContext('DELETE', '/api/users/1', { feature: 'restricted_feature' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow allowed features in demo mode', () => {
    process.env.DEMO_MODE = 'true';

    const context = createMockExecutionContext('GET', '/api/posts', { feature: 'allowed_feature' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should block restricted features in demo mode', () => {
    process.env.DEMO_MODE = 'true';

    const context = createMockExecutionContext('POST', '/api/settings', { feature: 'restricted_feature' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow requests without feature param in demo mode', () => {
    process.env.DEMO_MODE = 'true';

    const context = createMockExecutionContext('GET', '/api/posts', {});

    expect(guard.canActivate(context)).toBe(true);
  });
});

describe('DemoEmailInterceptor', () => {
  const originalEnv = process.env.DEMO_MODE;

  afterEach(() => {
    process.env.DEMO_MODE = originalEnv;
  });

  it('should pass through when not in demo mode', () => {
    process.env.DEMO_MODE = 'false';

    const emailData = { to: 'test@example.com', subject: 'Test' };
    const result = DemoEmailInterceptor.intercept(emailData);

    expect(result.captured).toBe(false);
  });

  it('should intercept and capture email in demo mode', () => {
    process.env.DEMO_MODE = 'true';

    const emailData = { to: 'test@example.com', subject: 'Test Subject' };
    const result = DemoEmailInterceptor.intercept(emailData);

    expect(result.captured).toBe(true);
    expect(result.message).toContain('captured');
    expect(result.message).toContain('demo mode');
  });
});

describe('DemoPaymentInterceptor', () => {
  const originalEnv = process.env.DEMO_MODE;

  afterEach(() => {
    process.env.DEMO_MODE = originalEnv;
  });

  it('should simulate successful payment in demo mode', () => {
    process.env.DEMO_MODE = 'true';

    const result = DemoPaymentInterceptor.simulatePayment(100, 'USD');

    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^demo_/);
    expect(result.message).toContain('100');
    expect(result.message).toContain('USD');
  });

  it('should not succeed when not in demo mode', () => {
    process.env.DEMO_MODE = 'false';

    const result = DemoPaymentInterceptor.simulatePayment(100, 'USD');

    expect(result.success).toBe(false);
  });

  it('should generate unique transaction IDs in demo mode', () => {
    process.env.DEMO_MODE = 'true';

    const result1 = DemoPaymentInterceptor.simulatePayment(50, 'EUR');
    const result2 = DemoPaymentInterceptor.simulatePayment(75, 'GBP');

    expect(result1.transactionId).not.toBe(result2.transactionId);
  });
});

// Helper to create mock execution context
function createMockExecutionContext(
  method: string,
  url: string,
  params: { feature?: string } = {}
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        url,
        path: url,
        params: { feature: params.feature },
        query: { feature: params.feature },
      }),
      getResponse: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
}

