/**
 * Authentication Store
 * Manages authentication state using Zustand with hydration tracking
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  _isCheckingCookie: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  checkCookieAuth: () => Promise<void>;
}

/**
 * Get access_token from cookie
 */
function getAccessTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('access_token='));
  if (!tokenCookie) return null;
  return tokenCookie.split('=')[1];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      _isCheckingCookie: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      /**
       * Check for access_token cookie and fetch user data
       * This is used for demo auto-login
       */
      checkCookieAuth: async () => {
        // Skip if already authenticated
        if (get().isAuthenticated) {
          set({ _isCheckingCookie: false });
          return;
        }

        const cookieToken = getAccessTokenFromCookie();
        if (!cookieToken) {
          set({ _isCheckingCookie: false });
          return;
        }

        set({ _isCheckingCookie: true });

        try {
          // Fetch user profile using the cookie token
          const response = await axios.get('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${cookieToken}`
            }
          });

          if (response.data) {
            set({
              user: response.data,
              token: cookieToken,
              isAuthenticated: true,
              _isCheckingCookie: false
            });
          } else {
            set({ _isCheckingCookie: false });
          }
        } catch (error) {
          console.error('Cookie auth failed:', error);
          // Clear invalid cookie
          document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          set({ _isCheckingCookie: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      // Only persist auth data, not hydration state
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

