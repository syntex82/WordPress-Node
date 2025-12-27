import api from './api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  maxUsers: number | null;
  maxStorageMb: number | null;
  maxProjects: number | null;
  maxCourses: number | null;
  maxProducts: number | null;
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  badgeText: string | null;
  trialDays: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'PAUSED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED';
  billingCycle: 'MONTHLY' | 'YEARLY';
  stripeSubscriptionId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
}

// Get all active plans (public)
export const getPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await api.get('/subscriptions/plans');
  return response.data;
};

// Get a plan by slug (public)
export const getPlanBySlug = async (slug: string): Promise<SubscriptionPlan> => {
  const response = await api.get(`/subscriptions/plans/${slug}`);
  return response.data;
};

// Get current user's subscription
export const getCurrentSubscription = async (): Promise<Subscription | null> => {
  try {
    const response = await api.get('/subscriptions/current');
    return response.data;
  } catch {
    return null;
  }
};

// Create checkout session
export const createCheckout = async (planId: string, billingCycle: 'monthly' | 'yearly'): Promise<{ sessionId: string; url: string }> => {
  const response = await api.post('/subscriptions/checkout', { planId, billingCycle });
  return response.data;
};

// Get billing portal URL
export const getBillingPortal = async (): Promise<{ url: string }> => {
  const response = await api.post('/subscriptions/portal');
  return response.data;
};

// Cancel subscription
export const cancelSubscription = async (): Promise<Subscription> => {
  const response = await api.post('/subscriptions/cancel');
  return response.data;
};

// Check if user has feature
export const hasFeature = async (feature: string): Promise<boolean> => {
  try {
    const response = await api.get(`/subscriptions/has-feature/${feature}`);
    return response.data.hasAccess;
  } catch {
    return false;
  }
};

// ============ ADMIN ============

// Get all plans (including inactive)
export const getAdminPlans = async (includeInactive = true): Promise<SubscriptionPlan[]> => {
  const response = await api.get(`/subscriptions/admin/plans?includeInactive=${includeInactive}`);
  return response.data;
};

// Create plan
export const createPlan = async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
  const response = await api.post('/subscriptions/admin/plans', data);
  return response.data;
};

// Update plan
export const updatePlan = async (id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
  const response = await api.put(`/subscriptions/admin/plans/${id}`, data);
  return response.data;
};

// Delete plan
export const deletePlan = async (id: string): Promise<void> => {
  await api.delete(`/subscriptions/admin/plans/${id}`);
};

// Seed default plans
export const seedDefaultPlans = async (): Promise<{ message: string; count?: number }> => {
  const response = await api.post('/subscriptions/admin/seed-plans');
  return response.data;
};

