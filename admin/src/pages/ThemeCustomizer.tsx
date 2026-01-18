/**
 * Theme Customizer Page
 * Live theme customization with sidebar and preview
 * Features: Real-time preview via postMessage, Undo/Redo, Import/Export, Element Inspector
 * Content Management: Media, Content Blocks, Links directly in customizer
 * With comprehensive tooltips and guided onboarding
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiX, FiSave, FiRefreshCw, FiChevronLeft, FiChevronRight, FiEye, FiSettings, FiType, FiLayout, FiGrid, FiHome as FiHomeIcon, FiAlertCircle, FiCode, FiTarget, FiRotateCcw, FiRotateCw, FiDownload, FiDroplet, FiBox, FiImage, FiLink2, FiHelpCircle, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { customThemesApi, CustomTheme, CustomThemeSettings } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Tooltip from '../components/Tooltip';
import OnboardingTooltip from '../components/OnboardingTooltip';
import { CUSTOMIZATION_ONBOARDING_STEPS, OnboardingStep } from '../contexts/ThemeCustomizationContext';

// Tooltip content for all customizer features
const CUSTOMIZER_TOOLTIPS = {
  colors: { title: '🎨 Colors', content: 'Customize your site\'s color scheme. Set primary, secondary, background, text, and accent colors.' },
  typography: { title: '✏️ Typography', content: 'Choose fonts and text styles. Set heading and body fonts, sizes, and line heights.' },
  header: { title: '📌 Header', content: 'Configure your site header. Choose layout, logo position, navigation style, and sticky behavior.' },
  footer: { title: '🦶 Footer', content: 'Design your site footer. Add widgets, copyright text, and social links.' },
  layout: { title: '📐 Layout', content: 'Control page structure. Set content width, sidebar position, and container styles.' },
  homepage: { title: '🏠 Homepage', content: 'Customize your homepage layout. Choose hero style, featured sections, and content blocks.' },
  palette: { title: '🎭 Color Palette', content: 'Create and manage color palettes. Save presets and apply them with one click.' },
  advTypography: { title: '📝 Advanced Typography', content: 'Fine-tune typography settings. Control letter spacing, text transforms, and font weights.' },
  spacing: { title: '📏 Spacing & Layout', content: 'Adjust spacing and margins. Control section padding, element gaps, and container sizes.' },
  css: { title: '💻 Custom CSS', content: 'Add your own CSS code. Override any style with custom rules.' },
  inspector: { title: '🔍 Element Inspector', content: 'Click any element on the preview to inspect its styles. Generate CSS rules automatically.' },
  importExport: { title: '📦 Import / Export', content: 'Backup your settings or transfer to another site. Export as JSON file.' },
  // Content Management tooltips
  images: { title: '🖼️ Media Library', content: 'Upload and manage images like logos, backgrounds, and banners. Drag to reorder.' },
  blocks: { title: '🧱 Content Blocks', content: 'Create reusable content sections like heroes, features, and CTAs.' },
  links: { title: '🔗 Links & Navigation', content: 'Manage navigation links, social media, and call-to-action buttons.' },
  contentManager: { title: '📝 Content Manager', content: 'Open the full content manager for advanced media and content block editing.' },
  // Action tooltips
  undo: { title: 'Undo', content: 'Revert your last change. Keyboard shortcut: Ctrl+Z', shortcut: 'Ctrl+Z' },
  redo: { title: 'Redo', content: 'Restore a reverted change. Keyboard shortcut: Ctrl+Y', shortcut: 'Ctrl+Y' },
  reset: { title: 'Reset Changes', content: 'Discard all unsaved changes and revert to the last saved state.' },
  saveDraft: { title: 'Save Draft', content: 'Save your changes without publishing. Your changes will be preserved but not visible to visitors.' },
  publish: { title: 'Publish', content: 'Make your changes live! Visitors will see the updated design immediately.' },
  refresh: { title: 'Refresh Preview', content: 'Reload the preview to see the latest changes from the server.' },
  viewport: { title: 'Responsive Preview', content: 'Test how your site looks on different devices. Switch between desktop, tablet, and mobile views.' },
  collapse: { title: 'Toggle Sidebar', content: 'Collapse or expand the sidebar to see more of the preview.' },
  close: { title: 'Close Customizer', content: 'Exit the customizer and return to the dashboard. Unsaved changes will prompt for confirmation.' },
  startTour: { title: '🎓 Start Tour', content: 'Take a guided tour through the customization process. Perfect for first-time users!' },
};

// Components
import ColorPanel from '../components/ThemeCustomizer/ColorPanel';
import TypographyPanel from '../components/ThemeCustomizer/TypographyPanel';
import HeaderPanel from '../components/ThemeCustomizer/HeaderPanel';
import FooterPanel from '../components/ThemeCustomizer/FooterPanel';
import LayoutPanel from '../components/ThemeCustomizer/LayoutPanel';
import HomepagePanel from '../components/ThemeCustomizer/HomepagePanel';
import CustomCSSEditor from '../components/ThemeCustomizer/CustomCSSEditor';
import ColorPaletteManager from '../components/ThemeCustomizer/ColorPaletteManager';
import AdvancedTypographyPanel from '../components/ThemeCustomizer/AdvancedTypographyPanel';
import SpacingLayoutPanel from '../components/ThemeCustomizer/SpacingLayoutPanel';
import ElementInspector from '../components/ThemeCustomizer/ElementInspector';
import ImportExportPanel from '../components/ThemeCustomizer/ImportExportPanel';
import ResponsivePreview, { ViewportSize, getViewportWidth } from '../components/ThemeCustomizer/ResponsivePreview';
import { useUndoRedo } from '../components/ThemeCustomizer/useUndoRedo';
import ImageManagementPanel from '../components/ThemeCustomizer/ImageManagementPanel';
import ContentBlocksPanel from '../components/ThemeCustomizer/ContentBlocksPanel';
import LinkManagementPanel from '../components/ThemeCustomizer/LinkManagementPanel';

// Get the backend URL - in production it's same origin, in development it's port 3000
const getBackendUrl = () => {
  if (window.location.port !== '5173') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

type PanelType = 'colors' | 'typography' | 'header' | 'footer' | 'layout' | 'homepage' | 'css' | 'palette' | 'advTypography' | 'spacing' | 'inspector' | 'importExport' | 'images' | 'blocks' | 'links' | null;

// Onboarding storage key
const ONBOARDING_STORAGE_KEY = 'theme_customizer_onboarding';

interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  text: string;
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    margin: string;
    padding: string;
    borderRadius: string;
  };
}

// Default theme settings
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

export default function ThemeCustomizer() {
  const navigate = useNavigate();
  useAuthStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const backendUrl = getBackendUrl();

  // Core state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTheme, setActiveTheme] = useState<CustomTheme | null>(null);
  const [savedSettings, setSavedSettings] = useState<CustomThemeSettings>(defaultSettings);

  // Undo/Redo for draft settings
  const {
    state: draftSettings,
    setState: setDraftSettings,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useUndoRedo<CustomThemeSettings>(defaultSettings);

  // Custom CSS (separate from theme settings)
  const [customCSS, setCustomCSS] = useState('');

  // UI state
  const [viewport, setViewport] = useState<ViewportSize>('full');
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Preview state
  const [previewError, setPreviewError] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const tokenRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Element Inspector state
  const [inspectorEnabled, setInspectorEnabled] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Load onboarding state
  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setCompletedSteps(data.completedSteps || []);
        // Don't auto-start if user has seen it before
        if (!data.hasSeenTour) {
          setShowOnboarding(true);
          setOnboardingStep('welcome');
        }
      } catch (e) {
        // First time user
        setShowOnboarding(true);
        setOnboardingStep('welcome');
      }
    } else {
      // First time user
      setShowOnboarding(true);
      setOnboardingStep('welcome');
    }
  }, []);

  // Save onboarding state
  useEffect(() => {
    if (completedSteps.length > 0 || !showOnboarding) {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
        completedSteps,
        hasSeenTour: true,
        currentStep: onboardingStep,
      }));
    }
  }, [completedSteps, showOnboarding, onboardingStep]);

  // Computed
  const hasChanges = JSON.stringify(savedSettings) !== JSON.stringify(draftSettings);

  // Get the preview URL with secure token
  const getPreviewUrl = useCallback(() => {
    if (!previewToken) return null;
    return `${backendUrl}?_preview_token=${encodeURIComponent(previewToken)}`;
  }, [backendUrl, previewToken]);

  // Fetch preview token on mount and refresh before expiry
  const fetchPreviewToken = useCallback(async () => {
    try {
      const response = await customThemesApi.getPreviewToken();
      setPreviewToken(response.data.token);

      // Refresh token 1 minute before expiry
      const refreshIn = (response.data.expiresIn - 60) * 1000;
      if (tokenRefreshTimer.current) {
        clearTimeout(tokenRefreshTimer.current);
      }
      tokenRefreshTimer.current = setTimeout(fetchPreviewToken, Math.max(refreshIn, 60000));
    } catch (error) {
      console.error('Failed to get preview token:', error);
      setPreviewError(true);
    }
  }, []);

  // Load active theme and preview token on mount
  useEffect(() => {
    loadActiveTheme();
    fetchPreviewToken();

    return () => {
      if (tokenRefreshTimer.current) {
        clearTimeout(tokenRefreshTimer.current);
      }
    };
  }, [fetchPreviewToken]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin to prevent cross-origin attacks
      const allowedOrigins = [window.location.origin];
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'CUSTOMIZER_READY':
          setPreviewReady(true);
          // Send initial styles
          applyPreviewStyles();
          break;
        case 'CUSTOMIZER_PONG':
          setPreviewReady(true);
          break;
        case 'ELEMENT_SELECTED':
          setSelectedElement(data.element);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Apply live preview styles to iframe via postMessage
  useEffect(() => {
    if (previewReady) {
      applyPreviewStyles();
    }
  }, [draftSettings, customCSS, previewReady]);

  const loadActiveTheme = async () => {
    try {
      setLoading(true);
      const response = await customThemesApi.getActive();
      if (response.data) {
        setActiveTheme(response.data);
        setSavedSettings(response.data.settings);
        resetHistory(response.data.settings);
        setCustomCSS(response.data.customCSS || '');
      } else {
        const allThemesResponse = await customThemesApi.getAll();
        if (allThemesResponse.data && allThemesResponse.data.length > 0) {
          const firstTheme = allThemesResponse.data[0];
          await customThemesApi.activate(firstTheme.id);
          setActiveTheme(firstTheme);
          setSavedSettings(firstTheme.settings);
          resetHistory(firstTheme.settings);
          setCustomCSS(firstTheme.customCSS || '');
          toast.success(`Activated theme: ${firstTheme.name}`);
        } else {
          const newTheme = await customThemesApi.create({
            name: 'Default Theme',
            description: 'Auto-generated default theme',
            settings: defaultSettings,
            isDefault: true,
          });
          await customThemesApi.activate(newTheme.data.id);
          setActiveTheme(newTheme.data);
          setSavedSettings(newTheme.data.settings);
          resetHistory(newTheme.data.settings);
          toast.success('Created and activated Default Theme');
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      toast.error('Failed to load or create theme');
    } finally {
      setLoading(false);
    }
  };

  // Send styles to iframe via postMessage (cross-origin safe)
  const applyPreviewStyles = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;

    const css = generatePreviewCSS(draftSettings);

    // Send CSS via postMessage
    iframeRef.current.contentWindow.postMessage({
      type: 'CUSTOMIZER_UPDATE_STYLES',
      css: css,
    }, '*');

    // Send custom CSS separately
    iframeRef.current.contentWindow.postMessage({
      type: 'CUSTOMIZER_UPDATE_CUSTOM_CSS',
      customCSS: customCSS,
    }, '*');
  }, [draftSettings, customCSS]);

  // Toggle element inspector in iframe
  const toggleInspector = useCallback((enabled: boolean) => {
    setInspectorEnabled(enabled);
    if (!enabled) {
      setSelectedElement(null);
    }
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'CUSTOMIZER_TOGGLE_INSPECTOR',
        enabled,
      }, '*');
    }
  }, []);

  // Load a Google Font in the iframe
  const loadFontInPreview = useCallback((font: string) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'CUSTOMIZER_LOAD_FONT',
        font,
      }, '*');
    }
  }, []);

  const generatePreviewCSS = (s: CustomThemeSettings): string => {
    const letterSpacing = s.typography.letterSpacing || 0;
    const bodyWeight = s.typography.bodyWeight || 400;

    return `
      :root {
        --color-primary: ${s.colors.primary} !important;
        --color-secondary: ${s.colors.secondary} !important;
        --color-background: ${s.colors.background} !important;
        --color-surface: ${s.colors.surface} !important;
        --color-text: ${s.colors.text} !important;
        --color-text-muted: ${s.colors.textMuted} !important;
        --color-heading: ${s.colors.heading} !important;
        --color-link: ${s.colors.link} !important;
        --color-link-hover: ${s.colors.linkHover} !important;
        --color-border: ${s.colors.border} !important;
        --color-accent: ${s.colors.accent} !important;
        --font-heading: "${s.typography.headingFont}", system-ui, sans-serif !important;
        --font-body: "${s.typography.bodyFont}", system-ui, sans-serif !important;
        --font-size-base: ${s.typography.baseFontSize}px !important;
        --line-height: ${s.typography.lineHeight} !important;
        --heading-weight: ${s.typography.headingWeight} !important;
        --body-weight: ${bodyWeight} !important;
        --letter-spacing: ${letterSpacing}em !important;
        --content-width: ${s.layout.contentWidth}px !important;
        --section-padding: ${s.spacing.sectionPadding}px !important;
        --element-spacing: ${s.spacing.elementSpacing}px !important;
        --container-padding: ${s.spacing.containerPadding}px !important;
        --border-radius: ${s.borders.radius}px !important;
        --border-width: ${s.borders.width}px !important;
      }
      body {
        background-color: ${s.colors.background} !important;
        color: ${s.colors.text} !important;
        font-family: "${s.typography.bodyFont}", system-ui, sans-serif !important;
        font-size: ${s.typography.baseFontSize}px !important;
        font-weight: ${bodyWeight} !important;
        line-height: ${s.typography.lineHeight} !important;
        letter-spacing: ${letterSpacing}em !important;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: "${s.typography.headingFont}", system-ui, sans-serif !important;
        font-weight: ${s.typography.headingWeight} !important;
        color: ${s.colors.heading} !important;
        letter-spacing: ${letterSpacing}em !important;
      }
      ${s.typography.h1Size ? `h1 { font-size: ${s.typography.h1Size}px !important; }` : ''}
      ${s.typography.h2Size ? `h2 { font-size: ${s.typography.h2Size}px !important; }` : ''}
      ${s.typography.h3Size ? `h3 { font-size: ${s.typography.h3Size}px !important; }` : ''}
      ${s.typography.h4Size ? `h4 { font-size: ${s.typography.h4Size}px !important; }` : ''}
      ${s.typography.h5Size ? `h5 { font-size: ${s.typography.h5Size}px !important; }` : ''}
      ${s.typography.h6Size ? `h6 { font-size: ${s.typography.h6Size}px !important; }` : ''}
      a { color: ${s.colors.link} !important; }
      a:hover { color: ${s.colors.linkHover} !important; }
      .container, .content-wrapper, main { max-width: ${s.layout.contentWidth}px !important; }
      section { padding: ${s.spacing.sectionPadding}px 0 !important; }
      .card, .post-card, .widget { border-radius: ${s.borders.radius}px !important; border-width: ${s.borders.width}px !important; }
    `;
  };

  const updateSettings = useCallback((path: string, value: any, actionName?: string) => {
    const newSettings = JSON.parse(JSON.stringify(draftSettings));
    const keys = path.split('.');
    // Prevent prototype pollution by blocking dangerous keys
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    if (keys.some(key => dangerousKeys.includes(key))) {
      console.warn('Blocked potentially dangerous property path:', path);
      return;
    }
    let current: any = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setDraftSettings(newSettings, actionName || `Update ${path}`);
  }, [draftSettings, setDraftSettings]);

  // Apply a full color palette
  const applyColorPalette = useCallback((colors: CustomThemeSettings['colors']) => {
    const newSettings = { ...draftSettings, colors };
    setDraftSettings(newSettings, 'Apply color palette');
  }, [draftSettings, setDraftSettings]);

  // Import settings from JSON
  const handleImportSettings = useCallback((importedSettings: CustomThemeSettings, importedCSS?: string) => {
    setDraftSettings(importedSettings, 'Import settings');
    if (importedCSS !== undefined) {
      setCustomCSS(importedCSS);
    }
  }, [setDraftSettings]);

  // Add CSS from element inspector
  const handleAddCSSFromInspector = useCallback((css: string) => {
    setCustomCSS(prev => prev ? prev + '\n\n' + css : css);
    setActivePanel('css');
    toast.success('CSS rule added');
  }, []);

  const handleSaveDraft = async () => {
    if (!activeTheme) {
      toast.error('No active theme to save');
      return;
    }
    try {
      setSaving(true);
      await customThemesApi.update(activeTheme.id, {
        settings: draftSettings,
        customCSS: customCSS,
      });
      setSavedSettings(draftSettings);
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!activeTheme) {
      toast.error('No active theme to publish');
      return;
    }
    try {
      setSaving(true);
      await customThemesApi.update(activeTheme.id, {
        settings: draftSettings,
        customCSS: customCSS,
      });
      await customThemesApi.activate(activeTheme.id);
      setSavedSettings(draftSettings);
      toast.success('Theme published successfully!');
      // Refresh iframe to show published changes
      if (iframeRef.current && previewToken) {
        setPreviewLoading(true);
        setPreviewReady(false);
        iframeRef.current.src = getPreviewUrl() || '';
      }
    } catch (error) {
      toast.error('Failed to publish theme');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    resetHistory(savedSettings);
    setCustomCSS(activeTheme?.customCSS || '');
    toast.success('Changes reverted');
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const getPreviewWidth = () => {
    const width = getViewportWidth(viewport);
    return typeof width === 'number' ? `${width}px` : width;
  };

  // Panel definitions - Basic, Content, and Advanced
  const basicPanels = [
    { id: 'colors' as PanelType, name: 'Colors', icon: FiEye },
    { id: 'typography' as PanelType, name: 'Typography', icon: FiType },
    { id: 'header' as PanelType, name: 'Header', icon: FiLayout },
    { id: 'footer' as PanelType, name: 'Footer', icon: FiGrid },
    { id: 'layout' as PanelType, name: 'Layout', icon: FiSettings },
    { id: 'homepage' as PanelType, name: 'Homepage', icon: FiHomeIcon },
  ];

  const contentPanels = [
    { id: 'images' as PanelType, name: 'Media Library', icon: FiImage },
    { id: 'blocks' as PanelType, name: 'Content Blocks', icon: FiLayout },
    { id: 'links' as PanelType, name: 'Links & Navigation', icon: FiLink2 },
  ];

  const advancedPanels = [
    { id: 'palette' as PanelType, name: 'Color Palette', icon: FiDroplet },
    { id: 'advTypography' as PanelType, name: 'Advanced Typography', icon: FiType },
    { id: 'spacing' as PanelType, name: 'Spacing & Layout', icon: FiBox },
    { id: 'css' as PanelType, name: 'Custom CSS', icon: FiCode },
    { id: 'inspector' as PanelType, name: 'Element Inspector', icon: FiTarget },
    { id: 'importExport' as PanelType, name: 'Import / Export', icon: FiDownload },
  ];

  // Onboarding functions
  const handleNextOnboardingStep = () => {
    if (!onboardingStep) return;
    const step = CUSTOMIZATION_ONBOARDING_STEPS.find(s => s.id === onboardingStep);
    if (step?.nextStep) {
      setCompletedSteps(prev => [...prev, onboardingStep]);
      setOnboardingStep(step.nextStep);

      // Auto-navigate based on step
      if (step.nextStep === 'choose-colors') {
        setActivePanel('colors');
      } else if (step.nextStep === 'set-typography') {
        setActivePanel('typography');
      } else if (step.nextStep === 'configure-header') {
        setActivePanel('header');
      } else if (step.nextStep === 'add-content') {
        setActivePanel(null);
      } else if (step.nextStep === 'upload-images') {
        setActivePanel('images');
      } else if (step.nextStep === 'create-blocks') {
        setActivePanel('blocks');
      } else if (step.nextStep === 'add-links') {
        setActivePanel('links');
      }
    } else {
      // Complete the tour
      setShowOnboarding(false);
      setOnboardingStep(null);
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingStep(null);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
      completedSteps: ['skipped'],
      hasSeenTour: true,
      currentStep: null,
    }));
  };

  const handleStartTour = () => {
    setShowOnboarding(true);
    setOnboardingStep('welcome');
    setCompletedSteps([]);
  };

  const getCurrentOnboardingStep = (): OnboardingStep | null => {
    return CUSTOMIZATION_ONBOARDING_STEPS.find(s => s.id === onboardingStep) || null;
  };

  const getOnboardingStepIndex = (): number => {
    return CUSTOMIZATION_ONBOARDING_STEPS.findIndex(s => s.id === onboardingStep);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Theme Customizer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-slate-800/80 backdrop-blur flex flex-col transition-all duration-300 border-r border-slate-700/50 ${sidebarCollapsed ? 'w-16' : 'w-80'}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-white font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Customize</h1>
              <p className="text-xs text-slate-400">{activeTheme?.name || 'Theme'}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-all"
            >
              {sidebarCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
            </button>
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-all">
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Panel Navigation */}
        {!sidebarCollapsed && !activePanel && (
          <div className="flex-1 overflow-y-auto p-4">
            {/* Start Tour Button */}
            <Tooltip title={CUSTOMIZER_TOOLTIPS.startTour.title} content={CUSTOMIZER_TOOLTIPS.startTour.content} position="right" variant="help">
              <button
                onClick={handleStartTour}
                className="w-full flex items-center gap-3 p-3 mb-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-300 hover:from-blue-600/30 hover:to-purple-600/30 transition-all group"
                data-action="start-tour"
              >
                <FiHelpCircle size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Start Guided Tour</span>
                <FiChevronRight size={14} className="ml-auto text-blue-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </Tooltip>

            {/* Basic Panels */}
            <div className="mb-4">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">🎨 Design</h3>
              <div className="space-y-1">
                {basicPanels.map(panel => {
                  const tooltip = CUSTOMIZER_TOOLTIPS[panel.id as keyof typeof CUSTOMIZER_TOOLTIPS];
                  return (
                    <Tooltip key={panel.id} title={tooltip?.title || panel.name} content={tooltip?.content || ''} position="right" variant="help">
                      <button
                        onClick={() => setActivePanel(panel.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all group"
                        data-panel={panel.id}
                      >
                        <panel.icon size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm">{panel.name}</span>
                        <FiChevronRight size={14} className="ml-auto text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Content Management Panels */}
            <div className="mb-4">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">📝 Content</h3>
              <div className="space-y-1">
                {contentPanels.map(panel => {
                  const tooltip = CUSTOMIZER_TOOLTIPS[panel.id as keyof typeof CUSTOMIZER_TOOLTIPS];
                  return (
                    <Tooltip key={panel.id} title={tooltip?.title || panel.name} content={tooltip?.content || ''} position="right" variant="help">
                      <button
                        onClick={() => setActivePanel(panel.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all group"
                        data-panel={panel.id}
                        data-tab={panel.id}
                      >
                        <panel.icon size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm">{panel.name}</span>
                        <FiChevronRight size={14} className="ml-auto text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Tooltip>
                  );
                })}
                {/* Full Content Manager Link */}
                <Tooltip title={CUSTOMIZER_TOOLTIPS.contentManager.title} content={CUSTOMIZER_TOOLTIPS.contentManager.content} position="right" variant="help">
                  <Link
                    to="/admin/theme-content"
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-700/30 hover:text-slate-200 transition-all group border border-dashed border-slate-600/50"
                    data-action="manage-content"
                  >
                    <FiExternalLink size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Full Content Manager</span>
                    <FiChevronRight size={14} className="ml-auto text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Tooltip>
              </div>
            </div>

            {/* Advanced Panels */}
            <div>
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">⚙️ Advanced</h3>
              <div className="space-y-1">
                {advancedPanels.map(panel => {
                  const tooltip = CUSTOMIZER_TOOLTIPS[panel.id as keyof typeof CUSTOMIZER_TOOLTIPS];
                  return (
                    <Tooltip key={panel.id} title={tooltip?.title || panel.name} content={tooltip?.content || ''} position="right" variant="help">
                      <button
                        onClick={() => setActivePanel(panel.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all group"
                        data-panel={panel.id}
                      >
                        <panel.icon size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm">{panel.name}</span>
                        <FiChevronRight size={14} className="ml-auto text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Active Panel Content */}
        {!sidebarCollapsed && activePanel && (
          <div className="flex-1 overflow-y-auto">
            <button
              onClick={() => { setActivePanel(null); toggleInspector(false); }}
              className="flex items-center gap-2 p-4 text-slate-400 hover:text-white border-b border-slate-700/50 w-full transition-colors"
            >
              <FiChevronLeft size={16} />
              <span>Back</span>
            </button>
            <div className="p-4">
              {/* Basic Panels */}
              {activePanel === 'colors' && <ColorPanel settings={draftSettings} onChange={updateSettings} />}
              {activePanel === 'typography' && <TypographyPanel settings={draftSettings} onChange={updateSettings} />}
              {activePanel === 'header' && <HeaderPanel settings={draftSettings} onChange={updateSettings} />}
              {activePanel === 'footer' && <FooterPanel settings={draftSettings} onChange={updateSettings} />}
              {activePanel === 'layout' && <LayoutPanel settings={draftSettings} onChange={updateSettings} />}
              {activePanel === 'homepage' && <HomepagePanel settings={draftSettings} onChange={updateSettings} />}
              {/* Content Management Panels */}
              {activePanel === 'images' && activeTheme && <ImageManagementPanel themeId={activeTheme.id} />}
              {activePanel === 'blocks' && activeTheme && <ContentBlocksPanel themeId={activeTheme.id} />}
              {activePanel === 'links' && activeTheme && <LinkManagementPanel themeId={activeTheme.id} />}
              {/* Advanced Panels */}
              {activePanel === 'palette' && <ColorPaletteManager settings={draftSettings} onChange={updateSettings} onApplyPalette={applyColorPalette} />}
              {activePanel === 'advTypography' && <AdvancedTypographyPanel settings={draftSettings} onChange={updateSettings} onLoadFont={loadFontInPreview} />}
              {activePanel === 'spacing' && <SpacingLayoutPanel settings={draftSettings} onChange={updateSettings} />}
              {activePanel === 'css' && <CustomCSSEditor value={customCSS} onChange={setCustomCSS} />}
              {activePanel === 'inspector' && <ElementInspector isEnabled={inspectorEnabled} onToggle={toggleInspector} selectedElement={selectedElement} onGenerateCSS={handleAddCSSFromInspector} />}
              {activePanel === 'importExport' && <ImportExportPanel settings={draftSettings} customCSS={customCSS} themeName={activeTheme?.name || 'Theme'} onImport={handleImportSettings} />}
            </div>
          </div>
        )}

        {/* Collapsed sidebar icons */}
        {sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
              {[...basicPanels, ...contentPanels, ...advancedPanels].map(panel => {
                const tooltip = CUSTOMIZER_TOOLTIPS[panel.id as keyof typeof CUSTOMIZER_TOOLTIPS];
                return (
                  <Tooltip key={panel.id} title={tooltip?.title || panel.name} content={tooltip?.content || ''} position="right" variant="help">
                    <button
                      onClick={() => { setSidebarCollapsed(false); setActivePanel(panel.id); }}
                      className="w-full p-2.5 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all flex items-center justify-center"
                    >
                      <panel.icon size={18} />
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700/50 space-y-2">
          {!sidebarCollapsed && (
            <>
              {/* Undo/Redo buttons */}
              <div className="flex gap-2 mb-2">
                <Tooltip title={CUSTOMIZER_TOOLTIPS.undo.title} content={CUSTOMIZER_TOOLTIPS.undo.content} shortcut={CUSTOMIZER_TOOLTIPS.undo.shortcut} position="top">
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                  >
                    <FiRotateCcw size={14} />
                    Undo
                  </button>
                </Tooltip>
                <Tooltip title={CUSTOMIZER_TOOLTIPS.redo.title} content={CUSTOMIZER_TOOLTIPS.redo.content} shortcut={CUSTOMIZER_TOOLTIPS.redo.shortcut} position="top">
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                  >
                    <FiRotateCw size={14} />
                    Redo
                  </button>
                </Tooltip>
              </div>
              <div className="flex gap-2">
                <Tooltip title={CUSTOMIZER_TOOLTIPS.saveDraft.title} content={CUSTOMIZER_TOOLTIPS.saveDraft.content} position="top">
                  <button
                    onClick={handleSaveDraft}
                    disabled={!hasChanges || saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 text-white rounded-xl hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <FiSave size={16} />
                    Save Draft
                  </button>
                </Tooltip>
                <Tooltip title={CUSTOMIZER_TOOLTIPS.reset.title} content={CUSTOMIZER_TOOLTIPS.reset.content} position="top">
                  <button
                    onClick={handleReset}
                    disabled={!hasChanges}
                    className="p-2 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-600/50 disabled:opacity-50 transition-all"
                  >
                    <FiRefreshCw size={16} />
                  </button>
                </Tooltip>
              </div>
              <Tooltip title={CUSTOMIZER_TOOLTIPS.publish.title} content={CUSTOMIZER_TOOLTIPS.publish.content} position="top">
                <button
                  onClick={handlePublish}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
              </Tooltip>
              {hasChanges && (
                <p className="text-xs text-amber-400 text-center">You have unsaved changes</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {/* Preview Toolbar */}
        <div className="h-14 bg-slate-800/50 backdrop-blur border-b border-slate-700/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Preview</span>
            <ResponsivePreview currentViewport={viewport} onViewportChange={setViewport} />
          </div>
          <div className="flex items-center gap-4">
            {inspectorEnabled && (
              <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-lg border border-blue-500/30">
                Inspector Active
              </span>
            )}
            <a
              href={backendUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Open in new tab →
            </a>
          </div>
        </div>

        {/* Preview iframe */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 relative ring-1 ring-slate-700/50"
            style={{ width: getPreviewWidth(), height: viewport === 'full' ? '100%' : '90%', maxHeight: '100%' }}
          >
            {/* Loading state */}
            {(previewLoading || !previewToken) && !previewError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 z-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-slate-300">Loading preview...</p>
                <p className="text-xs text-slate-500 mt-1">
                  {!previewToken ? 'Authenticating...' : `Connecting to ${backendUrl}`}
                </p>
              </div>
            )}

            {/* Error state */}
            {previewError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 z-10 p-8">
                <FiAlertCircle className="text-amber-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-white mb-2">Cannot Connect to Server</h3>
                <p className="text-slate-400 text-center mb-4 max-w-md">
                  The backend server at <code className="bg-slate-700 px-2 py-1 rounded text-slate-300">{backendUrl}</code> is not responding.
                </p>
                <div className="bg-slate-900 text-slate-300 rounded-xl p-4 mb-4 font-mono text-sm max-w-md border border-slate-700/50">
                  <p className="text-slate-500 mb-2"># Start the backend server:</p>
                  <p>npm run start:dev</p>
                </div>
                <button
                  onClick={async () => {
                    setPreviewError(false);
                    setPreviewLoading(true);
                    await fetchPreviewToken();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all"
                >
                  <FiRefreshCw size={16} /> Retry Connection
                </button>
              </div>
            )}

            {/* Only render iframe when we have a valid preview token */}
            {previewToken && (
              <iframe
                ref={iframeRef}
                src={getPreviewUrl() || ''}
                className="w-full h-full border-0"
                title="Theme Preview"
                onLoad={() => {
                  setPreviewLoading(false);
                  setPreviewError(false);
                  applyPreviewStyles();
                }}
                onError={() => {
                  setPreviewLoading(false);
                  setPreviewError(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Tooltip */}
      {showOnboarding && onboardingStep && getCurrentOnboardingStep() && (
        <OnboardingTooltip
          step={getCurrentOnboardingStep()!}
          currentStepIndex={getOnboardingStepIndex()}
          totalSteps={CUSTOMIZATION_ONBOARDING_STEPS.length}
          onNext={handleNextOnboardingStep}
          onSkip={handleSkipOnboarding}
          onComplete={() => {
            setShowOnboarding(false);
            setOnboardingStep(null);
          }}
        />
      )}

      {/* Onboarding highlight styles */}
      <style>{`
        .onboarding-highlight {
          position: relative;
          z-index: 9998;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          animation: pulse-highlight 2s ease-in-out infinite;
        }
        @keyframes pulse-highlight {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.7), 0 0 30px rgba(59, 130, 246, 0.5); }
        }
      `}</style>
    </div>
  );
}

