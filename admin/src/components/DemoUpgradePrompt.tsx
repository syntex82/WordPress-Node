/**
 * Demo Upgrade Prompt Modal
 * Shows when user tries to perform a restricted action
 */

import { useDemoStore } from '@/stores/demoStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Rocket, CheckCircle2 } from 'lucide-react';

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

  return (
    <Dialog open={showUpgradePrompt} onOpenChange={() => setRestrictedAction(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">Demo Restriction</DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-medium text-foreground">
              {getActionMessage(restrictedActionAttempted)}
            </span>{' '}
            is disabled in demo mode to protect sample data.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 my-4">
          <h4 className="font-semibold text-sm text-indigo-900 mb-3 flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Upgrade to unlock everything:
          </h4>
          <ul className="space-y-2">
            {UPGRADE_BENEFITS.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setRestrictedAction(null)} className="w-full sm:w-auto">
            Continue Exploring
          </Button>
          <Button 
            onClick={() => window.open('/pricing', '_blank')}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            View Pricing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DemoUpgradePrompt;

