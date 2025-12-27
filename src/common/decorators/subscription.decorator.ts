/**
 * Subscription Decorators
 * Marks routes with required subscription features or plan tiers
 */

import { SetMetadata } from '@nestjs/common';

// Feature-based access control
export const REQUIRED_FEATURES_KEY = 'requiredFeatures';
export const RequiresFeature = (...features: string[]) =>
  SetMetadata(REQUIRED_FEATURES_KEY, features);

// Plan tier-based access control (minimum plan required)
export const REQUIRED_PLAN_KEY = 'requiredPlan';
export const RequiresPlan = (...planSlugs: string[]) => SetMetadata(REQUIRED_PLAN_KEY, planSlugs);

// Active subscription required (any paid plan)
export const REQUIRES_SUBSCRIPTION_KEY = 'requiresSubscription';
export const RequiresSubscription = () => SetMetadata(REQUIRES_SUBSCRIPTION_KEY, true);

// Feature list for reference (sync with subscription service)
export const SUBSCRIPTION_FEATURES = {
  BASIC_CMS: 'basic_cms',
  MEDIA_LIBRARY: 'media_library',
  VIDEO_CALLS: 'video_calls',
  LMS: 'lms',
  ECOMMERCE: 'ecommerce',
  ANALYTICS: 'analytics',
  API_ACCESS: 'api_access',
  PRIORITY_SUPPORT: 'priority_support',
  CUSTOM_DOMAIN: 'custom_domain',
  SLA: 'sla',
  DEDICATED_SUPPORT: 'dedicated_support',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
} as const;

// Plan slugs for reference
export const PLAN_SLUGS = {
  FREE: 'free',
  PRO: 'pro',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
} as const;
