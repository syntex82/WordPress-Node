/**
 * Demo Mode Store
 * Manages demo mode state and restrictions in the admin panel
 */

import { create } from 'zustand';

export interface DemoInfo {
  id: string;
  subdomain: string;
  name: string;
  expiresAt: string;
  remainingHours: number;
}

interface DemoState {
  isDemo: boolean;
  demoInfo: DemoInfo | null;
  showUpgradePrompt: boolean;
  restrictedActionAttempted: string | null;
  
  // Actions
  initFromCookie: () => void;
  setShowUpgradePrompt: (show: boolean) => void;
  setRestrictedAction: (action: string | null) => void;
  exitDemo: () => void;
  getRemainingTime: () => { hours: number; minutes: number } | null;
}

/**
 * Parse demo_mode cookie
 */
function getDemoCookie(): DemoInfo | null {
  try {
    const cookies = document.cookie.split(';');
    const demoCookie = cookies.find(c => c.trim().startsWith('demo_mode='));
    if (!demoCookie) return null;
    
    const value = demoCookie.split('=')[1];
    const decoded = decodeURIComponent(value);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Clear demo cookies
 */
function clearDemoCookies() {
  document.cookie = 'demo_mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

export const useDemoStore = create<DemoState>((set, get) => ({
  isDemo: false,
  demoInfo: null,
  showUpgradePrompt: false,
  restrictedActionAttempted: null,

  initFromCookie: () => {
    const demoInfo = getDemoCookie();
    if (demoInfo) {
      // Check if demo has expired
      const expiresAt = new Date(demoInfo.expiresAt);
      if (expiresAt < new Date()) {
        clearDemoCookies();
        set({ isDemo: false, demoInfo: null });
        window.location.href = '/try-demo?expired=true';
        return;
      }
      set({ isDemo: true, demoInfo });
    } else {
      set({ isDemo: false, demoInfo: null });
    }
  },

  setShowUpgradePrompt: (show) => set({ showUpgradePrompt: show }),
  
  setRestrictedAction: (action) => {
    set({ restrictedActionAttempted: action, showUpgradePrompt: !!action });
  },

  exitDemo: () => {
    clearDemoCookies();
    set({ isDemo: false, demoInfo: null });
    window.location.href = '/';
  },

  getRemainingTime: () => {
    const { demoInfo } = get();
    if (!demoInfo) return null;
    
    const expiresAt = new Date(demoInfo.expiresAt);
    const remaining = expiresAt.getTime() - Date.now();
    if (remaining <= 0) return { hours: 0, minutes: 0 };
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  },
}));

/**
 * List of restricted actions in demo mode
 */
export const DEMO_RESTRICTED_ACTIONS = [
  'delete_user',
  'delete_post',
  'delete_course',
  'delete_product',
  'change_password',
  'update_email_settings',
  'update_payment_settings',
  'update_site_settings',
  'export_data',
  'import_data',
  'manage_api_keys',
  'manage_webhooks',
] as const;

export type RestrictedAction = typeof DEMO_RESTRICTED_ACTIONS[number];

/**
 * Check if an action is allowed in demo mode
 */
export function isDemoActionAllowed(action: string): boolean {
  return !DEMO_RESTRICTED_ACTIONS.includes(action as RestrictedAction);
}

