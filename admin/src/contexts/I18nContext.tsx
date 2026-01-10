/**
 * Internationalization Context
 * Provides language switching and translation functionality
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../services/api';

// Types
export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
  isRTL: boolean;
  flagEmoji?: string;
  locale?: string;
}

interface I18nContextType {
  currentLanguage: string;
  languages: Language[];
  translations: Record<string, Record<string, string>>;
  isLoading: boolean;
  setLanguage: (code: string) => void;
  t: (key: string, namespace?: string, fallback?: string) => string;
  refreshTranslations: () => Promise<void>;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'nodepress_language';

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: string;
}

export function I18nProvider({ children, defaultLanguage = 'en' }: I18nProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    // Try to get from localStorage first
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) return stored;
    
    // Try to detect from browser
    const browserLang = navigator.language.split('-')[0];
    return browserLang || defaultLanguage;
  });
  
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load available languages
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await api.get('/i18n/languages');
        setLanguages(response.data);
        
        // If current language is not in the list, switch to default
        const validLang = response.data.find((l: Language) => l.code === currentLanguage);
        if (!validLang) {
          const defaultLang = response.data.find((l: Language) => l.isDefault);
          if (defaultLang) {
            setCurrentLanguage(defaultLang.code);
          }
        }
      } catch (error) {
        console.error('Failed to load languages:', error);
      }
    };
    
    loadLanguages();
  }, []);

  // Load translations when language changes
  const loadTranslations = useCallback(async (langCode: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/i18n/translations/ui/${langCode}`);
      setTranslations(response.data);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fall back to empty translations
      setTranslations({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTranslations(currentLanguage);
  }, [currentLanguage, loadTranslations]);

  // Set language and persist
  const setLanguage = useCallback((code: string) => {
    setCurrentLanguage(code);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    
    // Set document direction for RTL languages
    const lang = languages.find(l => l.code === code);
    document.documentElement.dir = lang?.isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  }, [languages]);

  // Translation function
  const t = useCallback((key: string, namespace = 'common', fallback?: string): string => {
    const namespaceTranslations = translations[namespace];
    if (namespaceTranslations && namespaceTranslations[key]) {
      return namespaceTranslations[key];
    }
    // Return fallback or key itself
    return fallback || key;
  }, [translations]);

  // Refresh translations
  const refreshTranslations = useCallback(async () => {
    await loadTranslations(currentLanguage);
  }, [currentLanguage, loadTranslations]);

  // Check if current language is RTL
  const isRTL = languages.find(l => l.code === currentLanguage)?.isRTL || false;

  const value: I18nContextType = {
    currentLanguage,
    languages,
    translations,
    isLoading,
    setLanguage,
    t,
    refreshTranslations,
    isRTL,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use i18n context
export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Hook for just the translation function
export function useTranslation(namespace = 'common') {
  const { t, currentLanguage, isLoading } = useI18n();
  
  const translate = useCallback((key: string, fallback?: string) => {
    return t(key, namespace, fallback);
  }, [t, namespace]);
  
  return { t: translate, language: currentLanguage, isLoading };
}

