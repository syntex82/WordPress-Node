/**
 * Access Denied Component
 * Shown when a user tries to access a page they don't have permission for
 * Special handling for premium features (Shop, LMS) with upgrade prompts
 */

import { FiLock, FiArrowLeft, FiStar, FiShoppingBag, FiBook, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROLE_DESCRIPTIONS, requiresPremiumAccess, type UserRole } from '../config/permissions';

interface AccessDeniedProps {
  feature?: string;
  requiredRole?: string;
}

// Premium feature configurations
const PREMIUM_FEATURE_CONFIG: Record<string, {
  icon: typeof FiShoppingBag;
  title: string;
  description: string;
  benefits: string[];
  gradient: string;
  iconBg: string;
}> = {
  shop: {
    icon: FiShoppingBag,
    title: 'E-Commerce & Shop',
    description: 'Create and manage your online store with powerful e-commerce tools.',
    benefits: [
      'Create and manage products',
      'Process orders and payments',
      'Manage shipping options',
      'Track inventory and sales',
    ],
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-500/20',
  },
  lms: {
    icon: FiBook,
    title: 'Learning Management System',
    description: 'Build and sell online courses with our comprehensive LMS platform.',
    benefits: [
      'Create interactive courses',
      'Build lessons and quizzes',
      'Issue certificates',
      'Track student progress',
    ],
    gradient: 'from-purple-500 to-indigo-600',
    iconBg: 'bg-purple-500/20',
  },
};

export default function AccessDenied({ feature, requiredRole }: AccessDeniedProps) {
  const { user } = useAuthStore();
  const userRole = (user?.role || 'VIEWER') as UserRole;
  const roleInfo = ROLE_DESCRIPTIONS[userRole];

  // Check if this is a premium feature that requires upgrade
  const isPremiumFeature = feature && requiresPremiumAccess(userRole, feature);
  const premiumConfig = feature ? PREMIUM_FEATURE_CONFIG[feature] : null;

  // Premium Feature Upgrade UI
  if (isPremiumFeature && premiumConfig) {
    const FeatureIcon = premiumConfig.icon;

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          {/* Premium Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${premiumConfig.gradient} p-6 sm:p-8`}>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur">
                  <FeatureIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FiStar className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium text-white/90 uppercase tracking-wider">Premium Feature</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{premiumConfig.title}</h1>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              <p className="text-slate-300 text-lg mb-6">
                {premiumConfig.description}
              </p>

              {/* Benefits */}
              <div className="bg-slate-900/50 rounded-2xl p-5 mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <FiCheckCircle className="text-green-400" />
                  What you'll get:
                </h3>
                <ul className="space-y-3">
                  {premiumConfig.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-slate-300">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${premiumConfig.gradient}`} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Current Role Badge */}
              <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-slate-900/30 rounded-xl mb-6">
                <div>
                  <p className="text-slate-500 text-sm mb-1">Your current role</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${roleInfo.color}`}>
                    <FiLock size={14} />
                    {roleInfo.title}
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">Required access</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-amber-400 bg-amber-500/20">
                    <FiStar size={14} />
                    Administrator
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/subscription"
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r ${premiumConfig.gradient} text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
                >
                  <FiStar size={18} />
                  Upgrade Your Plan
                  <FiArrowRight size={18} />
                </Link>
                <Link
                  to="/"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
                >
                  <FiArrowLeft size={18} />
                  Back to Dashboard
                </Link>
              </div>

              <p className="text-center text-slate-500 text-sm mt-6">
                Contact your administrator to upgrade your account or change your role.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Access Denied UI
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
          <FiLock className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>

        <p className="text-slate-400 mb-4">
          {feature
            ? `You don't have permission to access ${feature}.`
            : "You don't have permission to access this page."
          }
        </p>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${roleInfo.color} mb-4`}>
          <FiLock size={14} />
          Your role: {roleInfo.title}
        </div>

        <p className="text-sm text-slate-500 mb-6">
          {roleInfo.description}
        </p>

        {requiredRole && (
          <p className="text-sm text-slate-500 mb-6">
            Required role: <span className="font-medium text-slate-300">{requiredRole}</span> or higher
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiArrowLeft size={16} />
            Go to Dashboard
          </Link>
        </div>

        <p className="text-xs text-slate-500 mt-8">
          If you believe you should have access, please contact your administrator.
        </p>
      </div>
    </div>
  );
}

