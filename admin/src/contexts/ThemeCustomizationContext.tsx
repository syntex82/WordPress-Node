/**
 * Theme Customization Context
 * Provides unified state management for theme customization across:
 * - Theme Customizer (/admin/customize) - Visual styling and layout
 * - Theme Content Manager (/admin/theme-content) - Content, images, links
 *
 * Features:
 * - Shared theme state
 * - Real-time sync between pages
 * - Onboarding/tooltip guidance
 * - Undo/redo support
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { customThemesApi, themesApi, themeCustomizationApi, CustomTheme, CustomThemeSettings } from '../services/api';
import toast from 'react-hot-toast';

// Onboarding step definitions
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'navigate' | 'input';
  nextStep?: string;
  isComplete?: boolean;
}

export const CUSTOMIZATION_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to Theme Customization',
    description: 'Let\'s walk you through customizing your theme. We\'ll start with the basics and work our way up.',
    placement: 'bottom',
    nextStep: 'choose-colors',
  },
  {
    id: 'choose-colors',
    title: '🎨 Step 1: Choose Your Colors',
    description: 'Start by selecting your brand colors. Click on "Colors" in the sidebar to customize your color palette.',
    targetSelector: '[data-panel="colors"]',
    placement: 'right',
    action: 'click',
    nextStep: 'set-typography',
  },
  {
    id: 'set-typography',
    title: '✏️ Step 2: Set Typography',
    description: 'Choose fonts that match your brand. Select heading and body fonts, sizes, and weights.',
    targetSelector: '[data-panel="typography"]',
    placement: 'right',
    action: 'click',
    nextStep: 'configure-header',
  },
  {
    id: 'configure-header',
    title: '📌 Step 3: Configure Header',
    description: 'Set up your site header with logo, navigation style, and layout options.',
    targetSelector: '[data-panel="header"]',
    placement: 'right',
    action: 'click',
    nextStep: 'add-content',
  },
  {
    id: 'add-content',
    title: '📝 Step 4: Add Content',
    description: 'Now let\'s add images and content blocks. Click "Manage Content" to go to the Content Manager.',
    targetSelector: '[data-action="manage-content"]',
    placement: 'bottom',
    action: 'navigate',
    nextStep: 'upload-images',
  },
  {
    id: 'upload-images',
    title: '🖼️ Step 5: Upload Images',
    description: 'Add your logo, hero images, and backgrounds. Drag and drop to reorder them.',
    targetSelector: '[data-tab="images"]',
    placement: 'right',
    action: 'click',
    nextStep: 'create-blocks',
  },
  {
    id: 'create-blocks',
    title: '🧱 Step 6: Create Content Blocks',
    description: 'Build your page with content blocks like heroes, features, and testimonials.',
    targetSelector: '[data-tab="blocks"]',
    placement: 'right',
    action: 'click',
    nextStep: 'add-links',
  },
  {
    id: 'add-links',
    title: '🔗 Step 7: Add Navigation Links',
    description: 'Set up your navigation menu and social media links.',
    targetSelector: '[data-tab="links"]',
    placement: 'right',
    action: 'click',
    nextStep: 'preview-publish',
  },
  {
    id: 'preview-publish',
    title: '🚀 Step 8: Preview & Publish',
    description: 'Preview your changes on different devices, then publish to make them live!',
    targetSelector: '[data-action="publish"]',
    placement: 'left',
    action: 'click',
    nextStep: 'complete',
  },
  {
    id: 'complete',
    title: '🎉 All Done!',
    description: 'Congratulations! Your theme is customized. You can always come back to make changes.',
    placement: 'bottom',
  },
];

// Context value interface
interface ThemeCustomizationContextValue {
  // Theme state
  activeTheme: CustomTheme | null;
  activeThemeId: string | null;
  loading: boolean;
  error: string | null;

  // Settings
  settings: CustomThemeSettings | null;
  customCSS: string;
  hasUnsavedChanges: boolean;

  // Content stats
  stats: {
    images: number;
    blocks: number;
    links: number;
  };

  // Actions
  loadActiveTheme: () => Promise<void>;
  updateSettings: (settings: Partial<CustomThemeSettings>) => void;
  setCustomCSS: (css: string) => void;
  saveChanges: () => Promise<void>;
  publishChanges: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Onboarding
  onboardingStep: string | null;
  isOnboardingActive: boolean;
  startOnboarding: () => void;
  completeStep: (stepId: string) => void;
  skipOnboarding: () => void;
  getCurrentStep: () => OnboardingStep | null;

  // Navigation helpers
  currentPage: 'customizer' | 'content-manager' | null;
  setCurrentPage: (page: 'customizer' | 'content-manager') => void;
}

const ThemeCustomizationContext = createContext<ThemeCustomizationContextValue | null>(null);

// Storage key for onboarding progress
const ONBOARDING_STORAGE_KEY = 'theme_customization_onboarding';

// Default settings
const defaultSettings: CustomThemeSettings = {
  colors: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#1F2937',
    textMuted: '#6B7280',
    heading: '#111827',
    link: '#3B82F6',
    linkHover: '#2563EB',
    border: '#E5E7EB',
    accent: '#F59E0B',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 700,
  },
  layout: {
    sidebarPosition: 'right',
    contentWidth: 1200,
    headerStyle: 'default',
    footerStyle: 'default',
  },
  spacing: {
    sectionPadding: 48,
    elementSpacing: 24,
    containerPadding: 24,
  },
  borders: {
    radius: 8,
    width: 1,
  },
};

interface ThemeCustomizationProviderProps {
  children: ReactNode;
}

export function ThemeCustomizationProvider({ children }: ThemeCustomizationProviderProps) {
  // Theme state
  const [activeTheme, setActiveTheme] = useState<CustomTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<CustomThemeSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<CustomThemeSettings | null>(null);
  const [customCSS, setCustomCSS] = useState('');
  const [savedCustomCSS, setSavedCustomCSS] = useState('');

  // Stats
  const [stats, setStats] = useState({ images: 0, blocks: 0, links: 0 });

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Current page tracking
  const [currentPage, setCurrentPage] = useState<'customizer' | 'content-manager' | null>(null);

  // Load onboarding state from storage
  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setCompletedSteps(data.completedSteps || []);
        if (data.isActive && data.currentStep) {
          setIsOnboardingActive(true);
          setOnboardingStep(data.currentStep);
        }
      } catch (e) {
        console.error('Error loading onboarding state:', e);
      }
    }
  }, []);

  // Save onboarding state to storage
  useEffect(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
      completedSteps,
      isActive: isOnboardingActive,
      currentStep: onboardingStep,
    }));
  }, [completedSteps, isOnboardingActive, onboardingStep]);

  // Computed: has unsaved changes
  const hasUnsavedChanges = settings !== null && savedSettings !== null &&
    (JSON.stringify(settings) !== JSON.stringify(savedSettings) || customCSS !== savedCustomCSS);

  // Load active theme
  const loadActiveTheme = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try custom theme first
      const customThemeResponse = await customThemesApi.getActive();
      if (customThemeResponse.data) {
        setActiveTheme(customThemeResponse.data);
        setSettings(customThemeResponse.data.settings || defaultSettings);
        setSavedSettings(customThemeResponse.data.settings || defaultSettings);
        setCustomCSS(customThemeResponse.data.customCSS || '');
        setSavedCustomCSS(customThemeResponse.data.customCSS || '');
      } else {
        // No active custom theme, create one
        const newTheme = await customThemesApi.create({
          name: 'My Theme',
          description: 'Custom theme created from customizer',
          settings: defaultSettings,
          isDefault: true,
        });
        await customThemesApi.activate(newTheme.data.id);
        setActiveTheme(newTheme.data);
        setSettings(defaultSettings);
        setSavedSettings(defaultSettings);
      }
    } catch (err: any) {
      console.error('Error loading theme:', err);
      setError(err.response?.data?.message || 'Failed to load theme');
      toast.error('Failed to load theme');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<CustomThemeSettings>) => {
    setSettings(prev => prev ? { ...prev, ...newSettings } : null);
  }, []);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!activeTheme) return;

    try {
      const [images, blocks, links] = await Promise.all([
        themeCustomizationApi.getImages(activeTheme.id),
        themeCustomizationApi.getBlocks(activeTheme.id),
        themeCustomizationApi.getLinks(activeTheme.id),
      ]);

      setStats({
        images: images.data.length,
        blocks: blocks.data.length,
        links: links.data.length,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [activeTheme]);

  // Save changes (draft)
  const saveChanges = useCallback(async () => {
    if (!activeTheme || !settings) return;

    try {
      await customThemesApi.update(activeTheme.id, {
        settings,
        customCSS,
      });
      setSavedSettings(settings);
      setSavedCustomCSS(customCSS);
      toast.success('Changes saved');
    } catch (err) {
      toast.error('Failed to save changes');
      throw err;
    }
  }, [activeTheme, settings, customCSS]);

  // Publish changes
  const publishChanges = useCallback(async () => {
    if (!activeTheme || !settings) return;

    try {
      await customThemesApi.update(activeTheme.id, {
        settings,
        customCSS,
      });
      await customThemesApi.activate(activeTheme.id);
      setSavedSettings(settings);
      setSavedCustomCSS(customCSS);
      toast.success('Theme published successfully!');
    } catch (err) {
      toast.error('Failed to publish theme');
      throw err;
    }
  }, [activeTheme, settings, customCSS]);

  // Onboarding functions
  const startOnboarding = useCallback(() => {
    setIsOnboardingActive(true);
    setOnboardingStep('welcome');
    setCompletedSteps([]);
  }, []);

  const completeStep = useCallback((stepId: string) => {
    setCompletedSteps(prev => [...prev, stepId]);
    const step = CUSTOMIZATION_ONBOARDING_STEPS.find(s => s.id === stepId);
    if (step?.nextStep) {
      setOnboardingStep(step.nextStep);
    } else {
      setIsOnboardingActive(false);
      setOnboardingStep(null);
    }
  }, []);

  const skipOnboarding = useCallback(() => {
    setIsOnboardingActive(false);
    setOnboardingStep(null);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
      completedSteps: ['skipped'],
      isActive: false,
      currentStep: null,
    }));
  }, []);

  const getCurrentStep = useCallback(() => {
    return CUSTOMIZATION_ONBOARDING_STEPS.find(s => s.id === onboardingStep) || null;
  }, [onboardingStep]);

  // Load theme on mount
  useEffect(() => {
    loadActiveTheme();
  }, [loadActiveTheme]);

  // Refresh stats when theme changes
  useEffect(() => {
    if (activeTheme) {
      refreshStats();
    }
  }, [activeTheme, refreshStats]);

  const value: ThemeCustomizationContextValue = {
    activeTheme,
    activeThemeId: activeTheme?.id || null,
    loading,
    error,
    settings,
    customCSS,
    hasUnsavedChanges,
    stats,
    loadActiveTheme,
    updateSettings,
    setCustomCSS,
    saveChanges,
    publishChanges,
    refreshStats,
    onboardingStep,
    isOnboardingActive,
    startOnboarding,
    completeStep,
    skipOnboarding,
    getCurrentStep,
    currentPage,
    setCurrentPage,
  };

  return (
    <ThemeCustomizationContext.Provider value={value}>
      {children}
    </ThemeCustomizationContext.Provider>
  );
}

// Hook to use the context
export function useThemeCustomization() {
  const context = useContext(ThemeCustomizationContext);
  if (!context) {
    throw new Error('useThemeCustomization must be used within a ThemeCustomizationProvider');
  }
  return context;
}

// Export the context for advanced use cases
export { ThemeCustomizationContext };
