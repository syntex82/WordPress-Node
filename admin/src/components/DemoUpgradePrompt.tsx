/**
 * Demo Upgrade Prompt Modal
 * Shows when user tries to perform a restricted action
 */

import { useDemoStore } from '../stores/demoStore';
import { FiShield, FiZap, FiCheckCircle, FiX } from 'react-icons/fi';

const UPGRADE_BENEFITS = [
  'Full admin access with no restrictions',
  'Unlimited users, posts, and products',
  'Custom domain support',
  'Priority email support',
  'Advanced analytics & reporting',
  'White-label options',
];

export function DemoUpgradePrompt() {
  const { showUpgradePrompt, restrictedActionAttempted, setRestrictedAction } = useDemoStore();

  const getActionMessage = (action: string | null) => {
    if (!action) return 'This action';

    const messages: Record<string, string> = {
      delete_user: 'Deleting users',
      delete_post: 'Deleting posts',
      delete_course: 'Deleting courses',
      delete_product: 'Deleting products',
      change_password: 'Changing passwords',
      update_email_settings: 'Configuring email settings',
      update_payment_settings: 'Setting up payments',
      update_site_settings: 'Modifying site settings',
      export_data: 'Exporting data',
      import_data: 'Importing data',
      manage_api_keys: 'Managing API keys',
      manage_webhooks: 'Configuring webhooks',
    };
    return messages[action] || 'This action';
  };

  if (!showUpgradePrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 text-center border-b dark:border-gray-700">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <FiShield className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Demo Restriction
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">
              {getActionMessage(restrictedActionAttempted)}
            </span>{' '}
            is disabled in demo mode to protect sample data.
          </p>
        </div>

        {/* Benefits */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
              <FiZap className="w-4 h-4" />
              Upgrade to unlock everything:
            </h4>
            <ul className="space-y-2">
              {UPGRADE_BENEFITS.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setRestrictedAction(null)}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Continue Exploring
          </button>
          <button
            onClick={() => window.open('/pricing', '_blank')}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded hover:from-indigo-700 hover:to-purple-700"
          >
            View Pricing
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={() => setRestrictedAction(null)}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default DemoUpgradePrompt;

