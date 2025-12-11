/**
 * Editor Theme Context
 * Provides light/dark mode support for the WYSIWYG editor
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type EditorTheme = 'light' | 'dark' | 'system';

interface EditorThemeContextType {
  theme: EditorTheme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: EditorTheme) => void;
}

const EditorThemeContext = createContext<EditorThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'editor-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function EditorThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<EditorTheme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  });

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

  const setTheme = (newTheme: EditorTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  return (
    <EditorThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </EditorThemeContext.Provider>
  );
}

export function useEditorTheme() {
  const context = useContext(EditorThemeContext);
  if (context === undefined) {
    throw new Error('useEditorTheme must be used within an EditorThemeProvider');
  }
  return context;
}

// Theme-aware CSS variables for the editor
export const editorThemeStyles = {
  light: {
    '--editor-bg': '#ffffff',
    '--editor-text': '#1f2937',
    '--editor-text-muted': '#6b7280',
    '--editor-border': '#e5e7eb',
    '--editor-toolbar-bg': '#f9fafb',
    '--editor-toolbar-hover': '#f3f4f6',
    '--editor-selection': '#ddd6fe',
    '--editor-link': '#7c3aed',
    '--editor-code-bg': '#f3f4f6',
    '--editor-blockquote-border': '#7c3aed',
    '--editor-blockquote-bg': '#f5f3ff',
  },
  dark: {
    '--editor-bg': '#1f2937',
    '--editor-text': '#f9fafb',
    '--editor-text-muted': '#9ca3af',
    '--editor-border': '#374151',
    '--editor-toolbar-bg': '#111827',
    '--editor-toolbar-hover': '#374151',
    '--editor-selection': '#5b21b6',
    '--editor-link': '#a78bfa',
    '--editor-code-bg': '#374151',
    '--editor-blockquote-border': '#a78bfa',
    '--editor-blockquote-bg': '#1e1b4b',
  },
};

// Helper to get theme styles as CSS string
export function getEditorThemeCSS(theme: 'light' | 'dark'): string {
  const styles = editorThemeStyles[theme];
  return Object.entries(styles)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
}

