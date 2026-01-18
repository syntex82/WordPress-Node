import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { FaBolt, FaBuilding } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

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

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'business'>('pro');
  const { isAuthenticated } = useAuthStore();

  // Get current pricing table ID
  const currentPricingTableId = PRICING_TABLES[selectedPlan]?.[billingCycle];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back to Home Link */}
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Plan Selection Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg inline-flex">
            <button
              onClick={() => setSelectedPlan('pro')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                selectedPlan === 'pro'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <FaBolt className="h-4 w-4" />
              Pro - £29/mo
            </button>
            <button
              onClick={() => setSelectedPlan('business')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                selectedPlan === 'business'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <FaBuilding className="h-4 w-4" />
              Business - £99/mo
            </button>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Not logged in warning */}
        {!isAuthenticated && (
          <div className="max-w-2xl mx-auto mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
            <p className="text-yellow-800 dark:text-yellow-200">
              Please <a href="/admin/login" className="underline font-semibold">log in</a> or{' '}
              <a href="/admin/register" className="underline font-semibold">register</a> first,
              then return here to subscribe.
            </p>
          </div>
        )}

        {/* Stripe Pricing Table */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {selectedPlan} Plan - {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {selectedPlan === 'pro'
                ? 'Perfect for creators and small teams'
                : 'Best for growing businesses and agencies'}
            </p>
          </div>

          {currentPricingTableId && (
            <StripePricingTable key={currentPricingTableId} pricingTableId={currentPricingTableId} />
          )}
        </div>

        {/* Self-Hosted Licenses Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Self-Hosted Licenses
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              One-time purchase. Host NodePress on your own server.
            </p>
          </div>
          <LicensePricing />
        </div>
      </div>
    </div>
  );
}

// License tiers for self-hosted version (must match backend LicenseTier enum)
const LICENSE_TIERS = [
  {
    tier: 'PERSONAL',
    name: 'Personal',
    price: 49,
    maxSites: 1,
    features: ['1 Site License', '1 Year Updates', 'Community Support', 'Core Features'],
    popular: false,
  },
  {
    tier: 'PROFESSIONAL',
    name: 'Professional',
    price: 149,
    maxSites: 5,
    features: ['5 Site Licenses', '1 Year Updates', 'Priority Support', 'All Features'],
    popular: true,
  },
  {
    tier: 'AGENCY',
    name: 'Agency',
    price: 299,
    maxSites: -1,
    features: ['Unlimited Sites', 'Lifetime Updates', 'Premium Support', 'All Features', 'White Label'],
    lifetime: true,
    popular: false,
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: 999,
    maxSites: -1,
    features: ['Unlimited Sites', 'Lifetime Updates', 'Dedicated Support', 'All Features', 'White Label', 'Priority Support', 'Custom Development'],
    lifetime: true,
    popular: false,
  },
];

function LicensePricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const { user } = useAuthStore();

  const handlePurchase = async (tier: string) => {
    const purchaseEmail = user?.email || email;
    if (!purchaseEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(tier);
    try {
      const res = await api.post('/licensing/checkout', {
        tier,
        email: purchaseEmail,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {!user && (
        <div className="max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email for license delivery"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {LICENSE_TIERS.map((tier) => (
          <div
            key={tier.tier}
            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 ${
              tier.popular ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{tier.name}</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">${tier.price}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {tier.lifetime ? ' lifetime' : ' /year'}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {tier.maxSites === -1 ? 'Unlimited sites' : `${tier.maxSites} site${tier.maxSites > 1 ? 's' : ''}`}
            </p>
            <ul className="mt-6 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <FiCheck className="text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePurchase(tier.tier)}
              disabled={loading === tier.tier}
              className={`mt-6 w-full py-3 rounded-lg font-medium transition ${
                tier.popular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              {loading === tier.tier ? 'Processing...' : 'Buy License'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
