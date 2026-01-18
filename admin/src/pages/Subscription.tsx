import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getCurrentSubscription,
  getPlans,
  getBillingPortal,
  cancelSubscription,
  seedDefaultPlans,
  activateAllPlans,
  Subscription as SubscriptionType,
  SubscriptionPlan,
} from '../services/subscriptionApi';
import { showToast } from '../utils/toast';
import { FaCreditCard, FaCalendar, FaExclamationTriangle, FaCheck, FaExternalLinkAlt, FaCrown, FaStar, FaDatabase } from 'react-icons/fa';

// Stripe Pricing Table Configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51RjyaDFzzHwoqssW7e8C8sFpNTIOMuZ8gDf783cQdgOAfTeHna4Bqt4qHL6vsH3SjTZ9xtAMR6o5KlFmihtOkOiJ00VkqHy520';
const PRICING_TABLES = {
  pro: {
    monthly: 'prctbl_1SlFs9FzzHwoqssW6FnSSRPp',
    yearly: 'prctbl_1SlFwxFzzHwoqssWGVxPpjJY',
  },
  business: {
    monthly: 'prctbl_1SlFv0FzzHwoqssWOMKoUr4r',
    yearly: 'prctbl_1SlFvzFzzHwoqssWaFG9da7G',
  },
};

// Stripe Pricing Table Component
function StripePricingTable({ pricingTableId }: { pricingTableId: string }) {
  useEffect(() => {
    // Load Stripe Pricing Table script if not already loaded
    if (!document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Validate pricing table ID format to prevent XSS
  const isValidId = /^prctbl_[a-zA-Z0-9]+$/.test(pricingTableId);
  if (!isValidId) {
    console.error('Invalid pricing table ID format');
    return null;
  }

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<stripe-pricing-table pricing-table-id="${pricingTableId}" publishable-key="${STRIPE_PUBLISHABLE_KEY}"></stripe-pricing-table>`,
      }}
    />
  );
}

export default function Subscription() {
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'business'>('pro');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // Check for success from Stripe redirect
    if (searchParams.get('session_id')) {
      showToast.success('Subscription successful! Your plan is now active.');
      navigate('/admin/subscription', { replace: true });
    }
  }, [searchParams, navigate]);

  const loadData = async () => {
    try {
      const [sub, plansList] = await Promise.all([getCurrentSubscription(), getPlans()]);
      setSubscription(sub);
      setPlans(plansList);
    } catch {
      showToast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading(true);
    try {
      const { url } = await getBillingPortal();
      if (url) window.location.href = url;
    } catch {
      showToast.error('Failed to open billing portal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will keep access until the end of your billing period.')) {
      return;
    }
    setActionLoading(true);
    try {
      await cancelSubscription();
      showToast.success('Subscription canceled. Access continues until end of billing period.');
      loadData();
    } catch {
      showToast.error('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedPlans = async () => {
    setActionLoading(true);
    try {
      const result = await seedDefaultPlans();
      showToast.success(result.message + (result.count ? ` (${result.count} plans created)` : ''));
      loadData();
    } catch {
      showToast.error('Failed to seed plans');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivatePlans = async () => {
    setActionLoading(true);
    try {
      const result = await activateAllPlans();
      showToast.success(result.message + (result.count ? ` (${result.count} plans activated)` : ''));
      loadData();
    } catch {
      showToast.error('Failed to activate plans');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'TRIALING': return 'bg-blue-100 text-blue-800';
      case 'PAST_DUE': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Subscription</h1>

      {subscription ? (
        <div className="space-y-6">
          {/* Current Plan Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FaCrown className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{subscription.plan.name}</h2>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${subscription.billingCycle === 'YEARLY' ? subscription.plan.yearlyPrice : subscription.plan.monthlyPrice}
                </p>
                <p className="text-gray-500">/{subscription.billingCycle.toLowerCase()}</p>
              </div>
            </div>

            {/* Billing Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FaCalendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Current Period</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaCreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Billing Cycle</p>
                  <p className="font-medium text-gray-900 dark:text-white">{subscription.billingCycle}</p>
                </div>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg mb-6">
                <FaExclamationTriangle className="h-5 w-5" />
                <p>Your subscription will cancel on {formatDate(subscription.currentPeriodEnd)}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleManageBilling}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              >
                <FaExternalLinkAlt className="h-4 w-4" />
                Manage Billing
              </button>
              {!subscription.cancelAtPeriodEnd && subscription.status === 'ACTIVE' && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Plan Includes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(subscription.plan.features as string[]).map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FaCheck className="h-5 w-5 text-green-500" />
                  <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* No Subscription - Show Upgrade Options with Stripe Pricing Tables */
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <FaStar className="h-8 w-8 text-yellow-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">You're on the Free Plan</h2>
                <p className="text-gray-600 dark:text-gray-400">Upgrade to unlock more features and remove limits.</p>
              </div>
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md font-medium transition ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Yearly <span className="text-green-500 text-sm">(Save ~17%)</span>
              </button>
            </div>
          </div>

          {/* Plan Selection Tabs */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setSelectedPlan('pro')}
              className={`px-8 py-3 rounded-lg font-semibold transition ${
                selectedPlan === 'pro'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              Pro Plan
              <span className="block text-sm font-normal">
                {billingCycle === 'monthly' ? '£29/month' : '£290/year'}
              </span>
            </button>
            <button
              onClick={() => setSelectedPlan('business')}
              className={`px-8 py-3 rounded-lg font-semibold transition ${
                selectedPlan === 'business'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              Business Plan
              <span className="block text-sm font-normal">
                {billingCycle === 'monthly' ? '£99/month' : '£990/year'}
              </span>
            </button>
          </div>

          {/* Stripe Pricing Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <StripePricingTable
              pricingTableId={PRICING_TABLES[selectedPlan][billingCycle]}
            />
          </div>

          {/* Admin Tools (only show if no plans exist) */}
          {plans.length === 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">Admin: Seed database plans for tracking</p>
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={handleSeedPlans}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 text-sm"
                >
                  <FaDatabase className="h-4 w-4" />
                  {actionLoading ? 'Creating...' : 'Create Plans'}
                </button>
                <button
                  onClick={handleActivatePlans}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 text-sm"
                >
                  <FaCheck className="h-4 w-4" />
                  {actionLoading ? 'Activating...' : 'Activate Plans'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
