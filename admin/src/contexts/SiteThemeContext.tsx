/**
 * Site Theme Context
 * Provides global light/dark mode support for the entire application
 * Persists preference to localStorage and respects system preference
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SiteTheme = 'light' | 'dark' | 'system';

interface SiteThemeContextType {
  theme: SiteTheme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: SiteTheme) => void;
  toggleTheme: () => void;
}

const SiteThemeContext = createContext<SiteThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'site-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Default to dark for admin panel
}

export function SiteThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return 'dark'; // Default to dark for admin panel
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  });

  // Update resolved theme when theme changes or system preference changes
  useEffect(() => {
    if (theme === 'system') {
      setResolvedTheme(getSystemTheme());
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: SiteTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <SiteThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </SiteThemeContext.Provider>
  );
}

export function useSiteTheme() {
  const context = useContext(SiteThemeContext);
  if (context === undefined) {
    throw new Error('useSiteTheme must be used within a SiteThemeProvider');
  }
  return context;
}

// Hook for components that just need the resolved theme
export function useResolvedTheme(): 'light' | 'dark' {
  const { resolvedTheme } = useSiteTheme();
  return resolvedTheme;
}

// Theme class generator for consistent styling across the app
export function useThemeClasses() {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';

  return {
    isDark,

    // ═══════════════════════════════════════════════════════════════
    // PAGE & LAYOUT
    // ═══════════════════════════════════════════════════════════════
    page: isDark
      ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
      : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30',

    // Sidebar
    sidebar: isDark
      ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-slate-800/50'
      : 'bg-gradient-to-b from-white via-slate-50 to-white border-slate-200/80 shadow-xl shadow-slate-200/50',
    sidebarHover: isDark
      ? 'hover:bg-white/5'
      : 'hover:bg-blue-50/80',
    sidebarActive: isDark
      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/10 text-blue-400 border-l-2 border-blue-500'
      : 'bg-gradient-to-r from-blue-100 to-indigo-50 text-blue-700 border-l-2 border-blue-600',

    // Header
    header: isDark
      ? 'bg-slate-900/80 backdrop-blur-xl border-slate-800/50'
      : 'bg-white/80 backdrop-blur-xl border-slate-200/50 shadow-sm',

    // ═══════════════════════════════════════════════════════════════
    // CARDS & CONTAINERS
    // ═══════════════════════════════════════════════════════════════
    card: isDark
      ? 'bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 shadow-lg shadow-black/20'
      : 'bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-lg shadow-slate-200/50',
    cardHover: isDark
      ? 'hover:bg-slate-800/60 hover:border-slate-600/50 hover:shadow-xl hover:shadow-black/30'
      : 'hover:bg-white hover:border-slate-300/80 hover:shadow-xl hover:shadow-slate-300/30',
    cardSolid: isDark
      ? 'bg-slate-800 border border-slate-700 shadow-xl shadow-black/30'
      : 'bg-white border border-slate-200 shadow-xl shadow-slate-200/60',
    cardGlass: isDark
      ? 'bg-white/5 backdrop-blur-xl border border-white/10'
      : 'bg-white/70 backdrop-blur-xl border border-white/80 shadow-lg',

    // Stats cards with gradients
    statsCard: isDark
      ? 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 shadow-lg'
      : 'bg-gradient-to-br from-white to-slate-50/80 border border-slate-200/80 shadow-lg shadow-slate-200/50',

    // ═══════════════════════════════════════════════════════════════
    // TEXT COLORS
    // ═══════════════════════════════════════════════════════════════
    textPrimary: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-300' : 'text-slate-700',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-slate-400',

    // Accent text
    textAccent: isDark ? 'text-blue-400' : 'text-blue-600',
    textSuccess: isDark ? 'text-emerald-400' : 'text-emerald-600',
    textWarning: isDark ? 'text-amber-400' : 'text-amber-600',
    textDanger: isDark ? 'text-red-400' : 'text-red-600',

    // Title with beautiful gradient
    titleGradient: isDark
      ? 'bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent'
      : 'bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 bg-clip-text text-transparent',
    titleAccent: isDark
      ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'
      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent',

    // ═══════════════════════════════════════════════════════════════
    // FORM ELEMENTS
    // ═══════════════════════════════════════════════════════════════
    input: isDark
      ? 'bg-slate-800/50 border border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800/80 transition-all'
      : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all',
    inputWithIcon: isDark
      ? 'bg-slate-800/30 border border-slate-700/50 text-white placeholder-slate-500'
      : 'bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400',

    select: isDark
      ? 'bg-slate-800/50 border border-slate-700/80 text-white focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 transition-all'
      : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all',

    checkbox: isDark
      ? 'bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500/30'
      : 'bg-white border-slate-300 text-blue-600 focus:ring-blue-500/30',

    // ═══════════════════════════════════════════════════════════════
    // BUTTONS
    // ═══════════════════════════════════════════════════════════════
    buttonPrimary: isDark
      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all'
      : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all',
    buttonSecondary: isDark
      ? 'bg-slate-700/80 hover:bg-slate-600 text-slate-200 border border-slate-600/80 hover:border-slate-500 transition-all'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm transition-all',
    buttonGhost: isDark
      ? 'hover:bg-white/10 text-slate-400 hover:text-white transition-all'
      : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all',
    buttonDanger: isDark
      ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all'
      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all',
    buttonSuccess: isDark
      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25'
      : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/30',

    // ═══════════════════════════════════════════════════════════════
    // TABLES
    // ═══════════════════════════════════════════════════════════════
    tableHeader: isDark
      ? 'bg-slate-900/60'
      : 'bg-gradient-to-r from-slate-50 to-slate-100/80',
    tableRow: isDark
      ? 'hover:bg-slate-700/30 transition-colors'
      : 'hover:bg-blue-50/50 transition-colors',
    tableRowAlt: isDark
      ? 'bg-slate-800/30'
      : 'bg-slate-50/50',
    tableCell: isDark ? 'text-slate-300' : 'text-slate-600',

    // ═══════════════════════════════════════════════════════════════
    // BORDERS & DIVIDERS
    // ═══════════════════════════════════════════════════════════════
    border: isDark ? 'border-slate-700/50' : 'border-slate-200',
    borderSolid: isDark ? 'border-slate-700' : 'border-slate-300',
    borderAccent: isDark ? 'border-blue-500/50' : 'border-blue-400',
    divider: isDark ? 'bg-slate-700/50' : 'bg-slate-200',
    dividerGradient: isDark
      ? 'bg-gradient-to-r from-transparent via-slate-700 to-transparent'
      : 'bg-gradient-to-r from-transparent via-slate-300 to-transparent',

    // ═══════════════════════════════════════════════════════════════
    // BADGES (Stunning pill badges)
    // ═══════════════════════════════════════════════════════════════
    badgeSuccess: isDark
      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
      : 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm',
    badgeWarning: isDark
      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10'
      : 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200 shadow-sm',
    badgeError: isDark
      ? 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm shadow-red-500/10'
      : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 shadow-sm',
    badgeInfo: isDark
      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
      : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm',
    badgePurple: isDark
      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm shadow-purple-500/10'
      : 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200 shadow-sm',
    badgeDefault: isDark
      ? 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
      : 'bg-slate-100 text-slate-600 border border-slate-200',

    // ═══════════════════════════════════════════════════════════════
    // ICONS
    // ═══════════════════════════════════════════════════════════════
    icon: isDark ? 'text-slate-400' : 'text-slate-500',
    iconHover: isDark ? 'hover:text-white' : 'hover:text-slate-800',
    iconActive: isDark ? 'text-blue-400' : 'text-blue-600',
    iconSuccess: isDark ? 'text-emerald-400' : 'text-emerald-600',
    iconWarning: isDark ? 'text-amber-400' : 'text-amber-600',
    iconDanger: isDark ? 'text-red-400' : 'text-red-600',

    // ═══════════════════════════════════════════════════════════════
    // MODALS & OVERLAYS
    // ═══════════════════════════════════════════════════════════════
    overlay: isDark
      ? 'bg-black/60 backdrop-blur-sm'
      : 'bg-slate-900/40 backdrop-blur-sm',
    modal: isDark
      ? 'bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 shadow-2xl shadow-black/50'
      : 'bg-gradient-to-b from-white to-slate-50 border border-slate-200 shadow-2xl shadow-slate-400/30',

    // Dropdown menus
    dropdown: isDark
      ? 'bg-slate-800 border border-slate-700/80 shadow-xl shadow-black/40'
      : 'bg-white border border-slate-200 shadow-xl shadow-slate-300/40',
    dropdownItem: isDark
      ? 'hover:bg-slate-700/80 text-slate-300 hover:text-white'
      : 'hover:bg-blue-50 text-slate-700 hover:text-blue-700',

    // ═══════════════════════════════════════════════════════════════
    // SPECIAL EFFECTS
    // ═══════════════════════════════════════════════════════════════
    glowBlue: isDark
      ? 'shadow-lg shadow-blue-500/20'
      : 'shadow-lg shadow-blue-400/25',
    glowGreen: isDark
      ? 'shadow-lg shadow-emerald-500/20'
      : 'shadow-lg shadow-emerald-400/25',
    glowPurple: isDark
      ? 'shadow-lg shadow-purple-500/20'
      : 'shadow-lg shadow-purple-400/25',
    glowAmber: isDark
      ? 'shadow-lg shadow-amber-500/20'
      : 'shadow-lg shadow-amber-400/25',

    // Rings for focus states
    focusRing: isDark
      ? 'focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900'
      : 'focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-white',

    // Skeleton loading
    skeleton: isDark
      ? 'bg-slate-700/50 animate-pulse'
      : 'bg-slate-200 animate-pulse',

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION LINKS
    // ═══════════════════════════════════════════════════════════════
    link: isDark
      ? 'text-blue-400 hover:text-blue-300 transition-colors'
      : 'text-blue-600 hover:text-blue-500 transition-colors',
    linkMuted: isDark
      ? 'text-slate-400 hover:text-slate-200 transition-colors'
      : 'text-slate-500 hover:text-slate-700 transition-colors',

    // ═══════════════════════════════════════════════════════════════
    // SCROLLBAR (for custom scrollbars)
    // ═══════════════════════════════════════════════════════════════
    scrollbar: isDark
      ? '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full'
      : '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full',

    // ═══════════════════════════════════════════════════════════════
    // CODE/TERMINAL
    // ═══════════════════════════════════════════════════════════════
    code: isDark
      ? 'bg-slate-900 text-emerald-400 border border-slate-700'
      : 'bg-slate-900 text-emerald-400 border border-slate-700', // Code is always dark
    codeInline: isDark
      ? 'bg-slate-700/50 text-pink-400 px-1.5 py-0.5 rounded'
      : 'bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded',

    // ═══════════════════════════════════════════════════════════════
    // PROGRESS BARS & METERS
    // ═══════════════════════════════════════════════════════════════
    progressTrack: isDark
      ? 'bg-slate-700/50'
      : 'bg-slate-200',
    progressBar: isDark
      ? 'bg-gradient-to-r from-blue-600 to-blue-400'
      : 'bg-gradient-to-r from-blue-600 to-blue-400',

    // ═══════════════════════════════════════════════════════════════
    // TOOLTIPS
    // ═══════════════════════════════════════════════════════════════
    tooltip: isDark
      ? 'bg-slate-900 border border-slate-700 text-slate-200 shadow-xl'
      : 'bg-slate-800 border border-slate-700 text-white shadow-xl', // Tooltips are always dark for contrast

    // ═══════════════════════════════════════════════════════════════
    // CHARTS/DATA VIZ (accent colors for data)
    // ═══════════════════════════════════════════════════════════════
    chartPrimary: isDark ? '#3b82f6' : '#2563eb', // blue
    chartSecondary: isDark ? '#8b5cf6' : '#7c3aed', // purple
    chartSuccess: isDark ? '#10b981' : '#059669', // emerald
    chartWarning: isDark ? '#f59e0b' : '#d97706', // amber
    chartDanger: isDark ? '#ef4444' : '#dc2626', // red
    chartNeutral: isDark ? '#6b7280' : '#9ca3af', // gray
  };
}

