/**
 * Visual Theme Designer Page
 * Professional-grade theme customization tool with live preview
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { customThemesApi, CustomTheme, CustomThemeSettings } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiDroplet, FiType, FiLayout, FiSave,
  FiCode, FiSmartphone, FiTablet, FiMonitor, FiSun, FiMoon, FiCopy, FiTrash2,
  FiUpload, FiRotateCcw, FiRotateCw, FiChevronDown, FiChevronRight,
  FiPlus, FiGrid, FiSliders, FiBox, FiPackage, FiFile, FiArchive, FiZap
} from 'react-icons/fi';
import {
  ContentBlock, BlockType, BLOCK_CONFIGS,
  ContentBlocksPanel, BlockRenderer, PageTemplate, ThemePage
} from '../components/ThemeDesigner/ContentBlocks';
import { AiThemeGeneratorModal } from '../components/ThemeDesigner/AiThemeGeneratorModal';

// Theme presets
const THEME_PRESETS: { id: string; name: string; description: string; settings: CustomThemeSettings }[] = [
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    description: 'Clean, minimalist design with focus on content',
    settings: {
      colors: { primary: '#2563eb', secondary: '#1d4ed8', background: '#ffffff', surface: '#f8fafc', text: '#334155', textMuted: '#64748b', heading: '#0f172a', link: '#2563eb', linkHover: '#1d4ed8', border: '#e2e8f0', accent: '#3b82f6' },
      typography: { headingFont: 'Inter', bodyFont: 'Inter', baseFontSize: 16, lineHeight: 1.6, headingWeight: 600 },
      layout: { sidebarPosition: 'none', contentWidth: 720, headerStyle: 'centered', footerStyle: 'centered' },
      spacing: { sectionPadding: 32, elementSpacing: 16, containerPadding: 24 },
      borders: { radius: 8, width: 1 },
    },
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    description: 'Dark mode minimalist design',
    settings: {
      colors: { primary: '#60a5fa', secondary: '#3b82f6', background: '#0f172a', surface: '#1e293b', text: '#e2e8f0', textMuted: '#94a3b8', heading: '#f8fafc', link: '#60a5fa', linkHover: '#93c5fd', border: '#334155', accent: '#3b82f6' },
      typography: { headingFont: 'Inter', bodyFont: 'Inter', baseFontSize: 16, lineHeight: 1.6, headingWeight: 600 },
      layout: { sidebarPosition: 'none', contentWidth: 720, headerStyle: 'centered', footerStyle: 'centered' },
      spacing: { sectionPadding: 32, elementSpacing: 16, containerPadding: 24 },
      borders: { radius: 8, width: 1 },
    },
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Bold typography for rich content sites',
    settings: {
      colors: { primary: '#dc2626', secondary: '#b91c1c', background: '#fafafa', surface: '#ffffff', text: '#1f2937', textMuted: '#6b7280', heading: '#111827', link: '#dc2626', linkHover: '#b91c1c', border: '#e5e7eb', accent: '#ef4444' },
      typography: { headingFont: 'Georgia', bodyFont: 'system-ui', baseFontSize: 17, lineHeight: 1.7, headingWeight: 700 },
      layout: { sidebarPosition: 'right', contentWidth: 1200, headerStyle: 'default', footerStyle: 'default' },
      spacing: { sectionPadding: 40, elementSpacing: 20, containerPadding: 32 },
      borders: { radius: 4, width: 1 },
    },
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Modern portfolio with dark accents',
    settings: {
      colors: { primary: '#8b5cf6', secondary: '#7c3aed', background: '#0f0f0f', surface: '#1a1a1a', text: '#e5e5e5', textMuted: '#a3a3a3', heading: '#ffffff', link: '#8b5cf6', linkHover: '#a78bfa', border: '#2a2a2a', accent: '#a78bfa' },
      typography: { headingFont: 'Poppins', bodyFont: 'system-ui', baseFontSize: 16, lineHeight: 1.6, headingWeight: 600 },
      layout: { sidebarPosition: 'none', contentWidth: 1000, headerStyle: 'minimal', footerStyle: 'minimal' },
      spacing: { sectionPadding: 48, elementSpacing: 24, containerPadding: 24 },
      borders: { radius: 12, width: 1 },
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional corporate look',
    settings: {
      colors: { primary: '#0284c7', secondary: '#0369a1', background: '#f1f5f9', surface: '#ffffff', text: '#475569', textMuted: '#94a3b8', heading: '#1e293b', link: '#0284c7', linkHover: '#0369a1', border: '#cbd5e1', accent: '#0ea5e9' },
      typography: { headingFont: 'system-ui', bodyFont: 'system-ui', baseFontSize: 15, lineHeight: 1.65, headingWeight: 600 },
      layout: { sidebarPosition: 'left', contentWidth: 1140, headerStyle: 'sticky', footerStyle: 'default' },
      spacing: { sectionPadding: 36, elementSpacing: 18, containerPadding: 28 },
      borders: { radius: 6, width: 1 },
    },
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Shop-focused design with product emphasis',
    settings: {
      colors: { primary: '#059669', secondary: '#047857', background: '#ffffff', surface: '#f9fafb', text: '#374151', textMuted: '#6b7280', heading: '#111827', link: '#059669', linkHover: '#047857', border: '#e5e7eb', accent: '#10b981' },
      typography: { headingFont: 'system-ui', bodyFont: 'system-ui', baseFontSize: 15, lineHeight: 1.6, headingWeight: 600 },
      layout: { sidebarPosition: 'left', contentWidth: 1280, headerStyle: 'sticky', footerStyle: 'default' },
      spacing: { sectionPadding: 32, elementSpacing: 16, containerPadding: 24 },
      borders: { radius: 8, width: 1 },
    },
  },
  {
    id: 'cyber-dark',
    name: 'Cyber Dark',
    description: 'Modern dark theme with purple/blue gradients - perfect for auth pages',
    settings: {
      colors: { primary: '#6366F1', secondary: '#8B5CF6', background: '#0F0F1A', surface: '#1E1E2E', text: '#E2E8F0', textMuted: '#94A3B8', heading: '#F8FAFC', link: '#818CF8', linkHover: '#A5B4FC', border: '#3F3F5A', accent: '#EC4899' },
      typography: { headingFont: 'Inter', bodyFont: 'Inter', baseFontSize: 16, lineHeight: 1.7, headingWeight: 700 },
      layout: { sidebarPosition: 'none', contentWidth: 1200, headerStyle: 'minimal', footerStyle: 'minimal' },
      spacing: { sectionPadding: 48, elementSpacing: 24, containerPadding: 32 },
      borders: { radius: 16, width: 1 },
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Professional dark blue theme for SaaS applications',
    settings: {
      colors: { primary: '#3B82F6', secondary: '#2563EB', background: '#0B1120', surface: '#111827', text: '#D1D5DB', textMuted: '#6B7280', heading: '#F9FAFB', link: '#60A5FA', linkHover: '#93C5FD', border: '#1F2937', accent: '#10B981' },
      typography: { headingFont: 'Inter', bodyFont: 'Inter', baseFontSize: 15, lineHeight: 1.6, headingWeight: 600 },
      layout: { sidebarPosition: 'none', contentWidth: 1100, headerStyle: 'sticky', footerStyle: 'default' },
      spacing: { sectionPadding: 40, elementSpacing: 20, containerPadding: 24 },
      borders: { radius: 12, width: 1 },
    },
  },
];

const FONT_OPTIONS = [
  'system-ui', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat',
  'Georgia', 'Merriweather', 'Playfair Display', 'Lora', 'Source Serif Pro',
  'Raleway', 'Nunito', 'Work Sans', 'Oswald', 'Quicksand',
];

// System fonts that don't need Google Fonts loading
const SYSTEM_FONTS = ['system-ui', 'Georgia'];

// Google Fonts loader - dynamically loads fonts when selected
const loadGoogleFont = (fontName: string) => {
  if (SYSTEM_FONTS.includes(fontName)) return;

  const linkId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) return; // Already loaded

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
};

type DesignSection = 'colors' | 'typography' | 'layout' | 'spacing' | 'components' | 'css' | 'blocks' | 'pages';
type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
type PreviewMode = 'light' | 'dark';

// Generate unique ID for blocks
const generateBlockId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default theme settings
const DEFAULT_SETTINGS: CustomThemeSettings = {
  colors: { primary: '#3b82f6', secondary: '#2563eb', background: '#ffffff', surface: '#f9fafb', text: '#374151', textMuted: '#6b7280', heading: '#111827', link: '#3b82f6', linkHover: '#2563eb', border: '#e5e7eb', accent: '#60a5fa' },
  typography: { headingFont: 'system-ui', bodyFont: 'system-ui', baseFontSize: 16, lineHeight: 1.6, headingWeight: 600 },
  layout: { sidebarPosition: 'right', contentWidth: 1100, headerStyle: 'default', footerStyle: 'default' },
  spacing: { sectionPadding: 32, elementSpacing: 16, containerPadding: 24 },
  borders: { radius: 8, width: 1 },
};

export default function ThemeDesigner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [themes, setThemes] = useState<CustomTheme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(editId);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [settings, setSettings] = useState<CustomThemeSettings>(DEFAULT_SETTINGS);
  const [customCSS, setCustomCSS] = useState('');
  const [activeSection, setActiveSection] = useState<DesignSection>('colors');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('light');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ colors: true });

  // Undo/Redo history
  const [history, setHistory] = useState<CustomThemeSettings[]>([DEFAULT_SETTINGS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showThemeList, setShowThemeList] = useState(!editId);
  const [showPresets, setShowPresets] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Multi-page state
  const [pages, setPages] = useState<ThemePage[]>([
    { id: 'home', name: 'Home', slug: '/', blocks: [], isHomePage: true }
  ]);
  const [currentPageId, setCurrentPageId] = useState<string>('home');

  // Get current page's blocks
  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];
  const contentBlocks = currentPage?.blocks || [];

  // Update blocks for current page
  const setContentBlocks = useCallback((updater: ContentBlock[] | ((prev: ContentBlock[]) => ContentBlock[])) => {
    setPages(prevPages => prevPages.map(page => {
      if (page.id !== currentPageId) return page;
      const newBlocks = typeof updater === 'function' ? updater(page.blocks) : updater;
      return { ...page, blocks: newBlocks };
    }));
  }, [currentPageId]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [copiedBlock, setCopiedBlock] = useState<ContentBlock | null>(null);

  // Page management functions
  const generatePageId = () => `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addPage = useCallback((name: string = 'New Page') => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newPage: ThemePage = {
      id: generatePageId(),
      name,
      slug: `/${slug}`,
      blocks: [],
      isHomePage: false,
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageId(newPage.id);
    setSelectedBlockId(null);
    toast.success(`Created page "${name}"`);
  }, []);

  const renamePage = useCallback((pageId: string, newName: string) => {
    setPages(prev => prev.map(page => {
      if (page.id !== pageId) return page;
      const slug = page.isHomePage ? '/' : `/${newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      return { ...page, name: newName, slug };
    }));
  }, []);

  const duplicatePage = useCallback((pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    const newPage: ThemePage = {
      id: generatePageId(),
      name: `${page.name} (Copy)`,
      slug: `${page.slug}-copy`,
      blocks: page.blocks.map(block => ({ ...block, id: generateBlockId() })),
      isHomePage: false,
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageId(newPage.id);
    toast.success(`Duplicated page "${page.name}"`);
  }, [pages]);

  const deletePage = useCallback((pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    if (page.isHomePage) {
      toast.error('Cannot delete the home page');
      return;
    }
    if (pages.length <= 1) {
      toast.error('Cannot delete the last page');
      return;
    }

    setPages(prev => prev.filter(p => p.id !== pageId));
    if (currentPageId === pageId) {
      const homePage = pages.find(p => p.isHomePage);
      setCurrentPageId(homePage?.id || pages[0].id);
    }
    setSelectedBlockId(null);
    toast.success(`Deleted page "${page.name}"`);
  }, [pages, currentPageId]);

  const setHomePage = useCallback((pageId: string) => {
    setPages(prev => prev.map(page => ({
      ...page,
      isHomePage: page.id === pageId,
      slug: page.id === pageId ? '/' : (page.slug === '/' ? `/${page.name.toLowerCase().replace(/\s+/g, '-')}` : page.slug),
    })));
    toast.success('Home page updated');
  }, []);

  // Block management functions
  const addBlock = useCallback((type: BlockType) => {
    const config = BLOCK_CONFIGS[type];
    const newBlock: ContentBlock = {
      id: generateBlockId(),
      type,
      props: { ...config.defaultProps },
      visibility: { desktop: true, tablet: true, mobile: true },
      animation: { type: 'none', duration: 300, delay: 0 },
    };
    setContentBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, []);

  const removeBlock = useCallback((id: string) => {
    setContentBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setContentBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;

      const newBlocks = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
      return newBlocks;
    });
  }, []);

  const updateBlockProps = useCallback((id: string, props: Record<string, any>) => {
    setContentBlocks(prev => prev.map(b =>
      b.id === id ? { ...b, props } : b
    ));
  }, []);

  const updateBlock = useCallback((updatedBlock: ContentBlock) => {
    setContentBlocks(prev => prev.map(b =>
      b.id === updatedBlock.id ? updatedBlock : b
    ));
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    setContentBlocks(prev => {
      const block = prev.find(b => b.id === id);
      if (!block) return prev;
      const newBlock: ContentBlock = {
        ...block,
        id: generateBlockId(),
        props: { ...block.props },
      };
      const index = prev.findIndex(b => b.id === id);
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
  }, []);

  const copyBlock = useCallback((id: string) => {
    const block = contentBlocks.find(b => b.id === id);
    if (block) {
      setCopiedBlock({ ...block, props: { ...block.props } });
    }
  }, [contentBlocks]);

  const pasteBlock = useCallback(() => {
    if (!copiedBlock) return;
    const newBlock: ContentBlock = {
      ...copiedBlock,
      id: generateBlockId(),
      props: { ...copiedBlock.props },
    };
    setContentBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, [copiedBlock]);

  // Load a page template
  const loadTemplate = useCallback((template: PageTemplate) => {
    if (template.blocks.length === 0) {
      // Blank template - clear all blocks
      setContentBlocks([]);
      setSelectedBlockId(null);
      toast.success('Canvas cleared');
      return;
    }

    // Convert template blocks to ContentBlocks with IDs
    const newBlocks: ContentBlock[] = template.blocks.map((templateBlock) => {
      const config = BLOCK_CONFIGS[templateBlock.type];
      return {
        id: generateBlockId(),
        type: templateBlock.type,
        props: { ...config.defaultProps, ...templateBlock.props },
      };
    });

    setContentBlocks(newBlocks);
    setSelectedBlockId(null);
    toast.success(`Loaded "${template.name}" template`);
  }, []);

  // Load themes on mount
  useEffect(() => {
    loadThemes();
  }, []);

  // Load theme for editing
  useEffect(() => {
    if (editId) {
      loadTheme(editId);
    }
  }, [editId]);

  // Load Google Fonts when typography settings change
  useEffect(() => {
    loadGoogleFont(settings.typography.headingFont);
    loadGoogleFont(settings.typography.bodyFont);
  }, [settings.typography.headingFont, settings.typography.bodyFont]);

  const loadThemes = async () => {
    try {
      const res = await customThemesApi.getAll();
      setThemes(res.data);
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  };

  const loadTheme = async (id: string) => {
    setLoading(true);
    try {
      const res = await customThemesApi.getById(id);
      const theme = res.data;
      setSelectedThemeId(theme.id);
      setThemeName(theme.name);
      setThemeDescription(theme.description || '');
      setSettings(theme.settings);
      setCustomCSS(theme.customCSS || '');
      setHistory([theme.settings]);
      setHistoryIndex(0);
      setShowThemeList(false);

      // Load pages if available, otherwise create default home page
      if (theme.pages && theme.pages.length > 0) {
        setPages(theme.pages as ThemePage[]);
        setCurrentPageId(theme.pages.find(p => p.isHomePage)?.id || theme.pages[0].id);
      } else {
        // Reset to default home page for themes without pages
        setPages([{ id: 'home', name: 'Home', slug: '/', blocks: [], isHomePage: true }]);
        setCurrentPageId('home');
      }
      setSelectedBlockId(null);
    } catch (error: any) {
      toast.error('Failed to load theme');
    } finally {
      setLoading(false);
    }
  };

  // Update settings with history tracking
  const updateSettings = useCallback((newSettings: CustomThemeSettings) => {
    setSettings(newSettings);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSettings);
    if (newHistory.length > 50) newHistory.shift(); // Limit history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSettings(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSettings(history[historyIndex + 1]);
    }
  };

  const updateColors = (key: keyof CustomThemeSettings['colors'], value: string) => {
    updateSettings({ ...settings, colors: { ...settings.colors, [key]: value } });
  };

  const updateTypography = (key: keyof CustomThemeSettings['typography'], value: string | number) => {
    updateSettings({ ...settings, typography: { ...settings.typography, [key]: value } });
  };

  const updateLayout = (key: keyof CustomThemeSettings['layout'], value: string | number) => {
    updateSettings({ ...settings, layout: { ...settings.layout, [key]: value } as any });
  };

  const updateSpacing = (key: keyof CustomThemeSettings['spacing'], value: number) => {
    updateSettings({ ...settings, spacing: { ...settings.spacing, [key]: value } });
  };

  const updateBorders = (key: keyof CustomThemeSettings['borders'], value: number) => {
    updateSettings({ ...settings, borders: { ...settings.borders, [key]: value } });
  };

  // Save theme
  const handleSave = async () => {
    if (!themeName.trim()) {
      toast.error('Please enter a theme name');
      return;
    }
    setSaving(true);
    try {
      console.log('Saving theme:', { themeName, themeDescription, settings, customCSS, pages });
      if (selectedThemeId) {
        const res = await customThemesApi.update(selectedThemeId, {
          name: themeName,
          description: themeDescription,
          settings,
          customCSS,
          pages, // Include pages in save
        });
        console.log('Theme updated:', res.data);
        toast.success('Theme updated successfully!');
      } else {
        console.log('Creating new theme...');
        const res = await customThemesApi.create({
          name: themeName,
          description: themeDescription,
          settings,
          customCSS,
          pages, // Include pages in save
        });
        console.log('Theme created:', res.data);
        setSelectedThemeId(res.data.id);
        toast.success('Theme created successfully!');
      }
      loadThemes();
    } catch (error: any) {
      console.error('Save error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  // Delete theme
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return;
    try {
      await customThemesApi.delete(id);
      toast.success('Theme deleted');
      if (selectedThemeId === id) {
        setSelectedThemeId(null);
        setThemeName('');
        setThemeDescription('');
        setSettings(DEFAULT_SETTINGS);
        setCustomCSS('');
        setShowThemeList(true);
      }
      loadThemes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete theme');
    }
  };

  // Duplicate theme
  const handleDuplicate = async (id: string) => {
    try {
      const res = await customThemesApi.duplicate(id);
      toast.success('Theme duplicated');
      loadThemes();
      loadTheme(res.data.id);
    } catch (error: any) {
      toast.error('Failed to duplicate theme');
    }
  };

  // Export theme as JSON
  const handleExport = async (id: string) => {
    try {
      const res = await customThemesApi.export(id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `theme-${res.data.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Theme exported as JSON');
    } catch (error) {
      toast.error('Failed to export theme');
    }
  };

  // Export theme as ZIP
  const handleExportZip = async (id: string) => {
    try {
      const theme = themes.find(t => t.id === id);
      const slug = theme?.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theme';

      const response = await customThemesApi.exportZip(id);
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Theme exported as ZIP');
    } catch (error) {
      toast.error('Failed to export theme as ZIP');
    }
  };

  // Install theme to installed themes
  const handleInstall = async (id: string) => {
    try {
      await customThemesApi.install(id);
      toast.success('Theme installed successfully! You can now activate it from Themes.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to install theme';
      toast.error(message);
    }
  };

  // Import theme
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await customThemesApi.import(data);
      toast.success('Theme imported successfully');
      loadThemes();
      loadTheme(res.data.id);
    } catch (error: any) {
      toast.error('Failed to import theme: Invalid file format');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Apply preset
  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    updateSettings(preset.settings);
    setShowPresets(false);
    toast.success(`Applied "${preset.name}" preset`);
  };

  // Handle AI-generated theme
  const handleAiThemeGenerated = (aiTheme: any) => {
    try {
      // Merge AI settings with defaults to ensure all required properties exist
      const mergedSettings: CustomThemeSettings = {
        colors: { ...DEFAULT_SETTINGS.colors, ...aiTheme.settings?.colors },
        typography: { ...DEFAULT_SETTINGS.typography, ...aiTheme.settings?.typography },
        layout: { ...DEFAULT_SETTINGS.layout, ...aiTheme.settings?.layout },
        spacing: { ...DEFAULT_SETTINGS.spacing, ...aiTheme.settings?.spacing },
        borders: { ...DEFAULT_SETTINGS.borders, ...aiTheme.settings?.borders },
      };

      setThemeName(aiTheme.name || 'AI Generated Theme');
      setThemeDescription(aiTheme.description || '');
      setSettings(mergedSettings);

      // Helper function to merge block props with defaults from BLOCK_CONFIGS
      const mergeBlockWithDefaults = (block: any) => {
        const blockType = block.type as BlockType;
        const config = BLOCK_CONFIGS[blockType];
        const defaultProps = config?.defaultProps || {};

        return {
          id: block.id || `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: blockType || 'hero',
          props: { ...defaultProps, ...block.props }, // Merge defaults with AI props
          visibility: block.visibility || { desktop: true, tablet: true, mobile: true },
          animation: block.animation || { type: 'none', duration: 300, delay: 0 },
        };
      };

      // Validate and set pages with proper structure
      const validPages = (aiTheme.pages && Array.isArray(aiTheme.pages) && aiTheme.pages.length > 0)
        ? aiTheme.pages.map((page: any, index: number) => ({
            id: page.id || `page-${Date.now()}-${index}`,
            name: page.name || (index === 0 ? 'Home' : `Page ${index + 1}`),
            slug: page.slug || (index === 0 ? '/' : `/page-${index + 1}`),
            blocks: Array.isArray(page.blocks) ? page.blocks.map(mergeBlockWithDefaults) : [],
            isHomePage: page.isHomePage ?? index === 0,
          }))
        : [{ id: 'home', name: 'Home', slug: '/', blocks: [], isHomePage: true }];

      setPages(validPages);
      setCurrentPageId(validPages[0]?.id || 'home');
      setHistory([mergedSettings]);
      setHistoryIndex(0);
      setSelectedBlockId(null);
      setShowThemeList(false);

      // Auto-switch to blocks tab so user can see and edit the blocks
      setActiveSection('blocks');

      // Show helpful toast with instructions
      const totalBlocks = validPages.reduce((acc: number, p: any) => acc + p.blocks.length, 0);
      toast.success(`Theme generated with ${validPages.length} page(s) and ${totalBlocks} blocks! Click any block to edit it.`, {
        duration: 5000,
      });
    } catch (error) {
      console.error('Error applying AI theme:', error);
      toast.error('Failed to apply AI-generated theme. Using defaults.');
      setSettings(DEFAULT_SETTINGS);
      setPages([{ id: 'home', name: 'Home', slug: '/', blocks: [], isHomePage: true }]);
      setCurrentPageId('home');
    }
  };

  // Create new theme
  const handleNewTheme = () => {
    setSelectedThemeId(null);
    setThemeName('');
    setThemeDescription('');
    setSettings(DEFAULT_SETTINGS);
    setCustomCSS('');
    setHistory([DEFAULT_SETTINGS]);
    setHistoryIndex(0);
    setShowThemeList(false);
    // Reset pages to default home page
    setPages([{ id: 'home', name: 'Home', slug: '/', blocks: [], isHomePage: true }]);
    setCurrentPageId('home');
    setSelectedBlockId(null);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Theme list view
  if (showThemeList) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/settings')} className="p-2 hover:bg-gray-800 rounded-lg">
                <FiArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Theme Designer</h1>
                <p className="text-gray-400">Create and manage custom themes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="file" ref={fileInputRef} accept=".json" onChange={handleImport} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                <FiUpload size={16} /> Import
              </button>
              <button onClick={handleNewTheme} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                <FiPlus size={16} /> New Theme
              </button>
            </div>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map(theme => (
              <div key={theme.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all">
                {/* Theme Preview */}
                <div className="h-40 relative" style={{ background: (theme.settings as CustomThemeSettings).colors.background }}>
                  <div className="absolute inset-0 p-4">
                    <div className="h-6 rounded" style={{ background: (theme.settings as CustomThemeSettings).colors.surface, borderBottom: `2px solid ${(theme.settings as CustomThemeSettings).colors.border}` }} />
                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 h-16 rounded" style={{ background: (theme.settings as CustomThemeSettings).colors.surface }} />
                      <div className="w-16 h-16 rounded" style={{ background: (theme.settings as CustomThemeSettings).colors.surface }} />
                    </div>
                    <div className="mt-2 h-4 w-24 rounded" style={{ background: (theme.settings as CustomThemeSettings).colors.primary }} />
                  </div>
                  {theme.isActive && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">Active</div>
                  )}
                </div>
                {/* Theme Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{theme.name}</h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{theme.description || 'No description'}</p>
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => loadTheme(theme.id)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
                        Edit
                      </button>
                      <button onClick={() => handleInstall(theme.id)} className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1" title="Install to Themes">
                        <FiPackage size={14} /> Install
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDuplicate(theme.id)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg" title="Duplicate">
                        <FiCopy size={16} />
                      </button>
                      <button onClick={() => handleExport(theme.id)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg" title="Export JSON">
                        <FiFile size={16} />
                      </button>
                      <button onClick={() => handleExportZip(theme.id)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg" title="Export ZIP">
                        <FiArchive size={16} />
                      </button>
                      <button onClick={() => handleDelete(theme.id)} className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg" title="Delete">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {themes.length === 0 && (
              <div className="col-span-full text-center py-16">
                <FiGrid size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No custom themes yet</h3>
                <p className="text-gray-400 mb-6">Create your first theme or import an existing one</p>
                <button onClick={handleNewTheme} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
                  Create Your First Theme
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main editor view
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading theme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowThemeList(true)} className="p-2 hover:bg-gray-700 rounded-lg">
              <FiArrowLeft size={20} />
            </button>
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={themeName}
                onChange={e => setThemeName(e.target.value)}
                placeholder="Enter theme name..."
                className="bg-gray-700 text-xl font-bold border border-gray-600 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 w-64"
              />
              <input
                type="text"
                value={themeDescription}
                onChange={e => setThemeDescription(e.target.value)}
                placeholder="Add a description..."
                className="bg-gray-700/50 text-sm text-gray-300 border border-gray-600/50 rounded-lg px-3 py-1 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-r border-gray-700 pr-3">
              <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-gray-700 rounded disabled:opacity-30" title="Undo">
                <FiRotateCcw size={18} />
              </button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-gray-700 rounded disabled:opacity-30" title="Redo">
                <FiRotateCw size={18} />
              </button>
            </div>

            {/* Preview Controls */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              <button onClick={() => setPreviewDevice('desktop')} className={`p-2 rounded ${previewDevice === 'desktop' ? 'bg-gray-600' : 'hover:bg-gray-600'}`} title="Desktop">
                <FiMonitor size={16} />
              </button>
              <button onClick={() => setPreviewDevice('tablet')} className={`p-2 rounded ${previewDevice === 'tablet' ? 'bg-gray-600' : 'hover:bg-gray-600'}`} title="Tablet">
                <FiTablet size={16} />
              </button>
              <button onClick={() => setPreviewDevice('mobile')} className={`p-2 rounded ${previewDevice === 'mobile' ? 'bg-gray-600' : 'hover:bg-gray-600'}`} title="Mobile">
                <FiSmartphone size={16} />
              </button>
            </div>

            {/* Light/Dark Toggle */}
            <button onClick={() => setPreviewMode(previewMode === 'light' ? 'dark' : 'light')} className="p-2 hover:bg-gray-700 rounded-lg" title="Toggle Preview Mode">
              {previewMode === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
            </button>

            {/* AI Theme Generator */}
            <button onClick={() => setShowAiModal(true)} className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg" title="Generate theme with AI">
              <FiZap size={16} /> AI Designer
            </button>

            {/* Presets */}
            <div className="relative">
              <button onClick={() => setShowPresets(!showPresets)} className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                <FiSliders size={16} /> Presets
              </button>
              {showPresets && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                  {THEME_PRESETS.map(preset => (
                    <button key={preset.id} onClick={() => applyPreset(preset)} className="w-full p-3 text-left hover:bg-gray-700 border-b border-gray-700 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${preset.settings.colors.primary}, ${preset.settings.colors.secondary})` }} />
                        <div>
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-xs text-gray-400">{preset.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <button onClick={handleSave} disabled={saving || !themeName.trim()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium">
              {saving ? <span className="animate-spin">⏳</span> : <FiSave size={16} />}
              {selectedThemeId ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
          {/* Section Tabs */}
          <div className="flex border-b border-gray-700 flex-shrink-0">
            {[
              { id: 'pages', icon: FiGrid, label: 'Pages' },
              { id: 'blocks', icon: FiBox, label: 'Blocks' },
              { id: 'colors', icon: FiDroplet, label: 'Colors' },
              { id: 'typography', icon: FiType, label: 'Type' },
              { id: 'layout', icon: FiLayout, label: 'Layout' },
              { id: 'css', icon: FiCode, label: 'CSS' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as DesignSection)}
                className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                  activeSection === tab.id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section Content */}
          <div className={`flex-1 overflow-y-auto ${activeSection === 'blocks' || activeSection === 'pages' ? '' : 'p-4'}`}>
            {/* Pages Section */}
            {activeSection === 'pages' && (
              <div className="h-full flex flex-col">
                {/* Page Selector Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Theme Pages</h3>
                    <button
                      onClick={() => {
                        const name = prompt('Enter page name:');
                        if (name?.trim()) addPage(name.trim());
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium"
                    >
                      <FiPlus size={12} /> Add Page
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Create multiple pages for your theme. Each page has its own blocks.
                  </p>
                </div>

                {/* Page List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                        currentPageId === page.id
                          ? 'bg-blue-600/20 border-blue-500'
                          : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => {
                        setCurrentPageId(page.id);
                        setSelectedBlockId(null);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{page.isHomePage ? '🏠' : '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{page.name}</span>
                            {page.isHomePage && (
                              <span className="px-1.5 py-0.5 bg-green-600/30 text-green-400 text-xs rounded">Home</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{page.slug}</span>
                        </div>
                        <span className="text-xs text-gray-500">{page.blocks.length} blocks</span>
                      </div>

                      {/* Page Actions (shown on hover) */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt('Rename page:', page.name);
                            if (newName?.trim()) renamePage(page.id, newName.trim());
                          }}
                          className="p-1 text-gray-400 hover:text-white rounded"
                          title="Rename"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicatePage(page.id);
                          }}
                          className="p-1 text-gray-400 hover:text-white rounded"
                          title="Duplicate"
                        >
                          <FiCopy size={14} />
                        </button>
                        {!page.isHomePage && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Set "${page.name}" as home page?`)) {
                                  setHomePage(page.id);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-green-400 rounded"
                              title="Set as Home"
                            >
                              🏠
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${page.name}"?`)) {
                                  deletePage(page.id);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-400 rounded"
                              title="Delete"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current Page Info */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                  <div className="text-xs text-gray-400 mb-2">Currently Editing:</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentPage?.isHomePage ? '🏠' : '📄'}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{currentPage?.name}</div>
                      <div className="text-xs text-gray-500">{currentPage?.blocks.length} blocks</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('blocks')}
                    className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FiBox size={14} /> Edit Page Blocks
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'colors' && renderColorsSection()}
            {activeSection === 'typography' && renderTypographySection()}
            {activeSection === 'layout' && renderLayoutSection()}
            {activeSection === 'blocks' && (
              <div className="h-full flex flex-col">
                {/* Current Page Indicator */}
                <div className="p-3 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{currentPage?.isHomePage ? '🏠' : '📄'}</span>
                    <span className="text-sm font-medium text-white">{currentPage?.name}</span>
                    <span className="text-xs text-gray-500">({currentPage?.blocks.length} blocks)</span>
                  </div>
                  <button
                    onClick={() => setActiveSection('pages')}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Switch Page
                  </button>
                </div>

                <ContentBlocksPanel
                  blocks={contentBlocks}
                  onAddBlock={addBlock}
                  onRemoveBlock={removeBlock}
                  onMoveBlock={moveBlock}
                  onUpdateBlock={updateBlockProps}
                  onUpdateFullBlock={updateBlock}
                  onLoadTemplate={loadTemplate}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                />
                {copiedBlock && (
                  <div className="p-4 border-t border-gray-700">
                    <button
                      onClick={pasteBlock}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                    >
                      <FiBox size={16} /> Paste Block ({BLOCK_CONFIGS[copiedBlock.type]?.label})
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeSection === 'css' && renderCSSSection()}
          </div>
        </aside>

        {/* Preview */}
        <main className="flex-1 bg-gray-950 p-6 overflow-auto flex items-start justify-center">
          <div
            className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
              previewDevice === 'desktop' ? 'w-full max-w-5xl' :
              previewDevice === 'tablet' ? 'w-[768px]' : 'w-[375px]'
            }`}
            style={{ minHeight: '600px' }}
          >
            <ThemePreview
              settings={settings}
              previewMode={previewMode}
              blocks={contentBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onDeleteBlock={removeBlock}
              onMoveBlock={moveBlock}
              onUpdateBlockProps={updateBlockProps}
              onDuplicateBlock={duplicateBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={updateBlock}
              previewDevice={previewDevice}
            />
          </div>
        </main>
      </div>

      {/* AI Theme Generator Modal */}
      <AiThemeGeneratorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onThemeGenerated={handleAiThemeGenerated}
      />
    </div>
  );

  // Render sections
  function renderColorsSection() {
    const colorGroups = [
      { title: 'Brand Colors', keys: ['primary', 'secondary', 'accent'] },
      { title: 'Background', keys: ['background', 'surface'] },
      { title: 'Text', keys: ['text', 'textMuted', 'heading'] },
      { title: 'Interactive', keys: ['link', 'linkHover'] },
      { title: 'Borders', keys: ['border'] },
    ];

    return (
      <div className="space-y-4">
        {colorGroups.map(group => (
          <div key={group.title}>
            <button onClick={() => toggleSection(group.title)} className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-300">
              {group.title}
              {expandedSections[group.title] ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
            </button>
            {expandedSections[group.title] && (
              <div className="space-y-3 mt-2">
                {group.keys.map(key => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(settings.colors as any)[key] || '#000000'}
                        onChange={e => updateColors(key as keyof CustomThemeSettings['colors'], e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                      />
                      <input
                        type="text"
                        value={(settings.colors as any)[key] || ''}
                        onChange={e => updateColors(key as keyof CustomThemeSettings['colors'], e.target.value)}
                        className="w-20 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderTypographySection() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Heading Font</label>
          <select
            value={settings.typography.headingFont}
            onChange={e => updateTypography('headingFont', e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Body Font</label>
          <select
            value={settings.typography.bodyFont}
            onChange={e => updateTypography('bodyFont', e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Base Font Size: {settings.typography.baseFontSize}px</label>
          <input
            type="range"
            min="12"
            max="22"
            value={settings.typography.baseFontSize}
            onChange={e => updateTypography('baseFontSize', Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Line Height: {settings.typography.lineHeight}</label>
          <input
            type="range"
            min="1.2"
            max="2"
            step="0.1"
            value={settings.typography.lineHeight}
            onChange={e => updateTypography('lineHeight', Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Heading Weight: {settings.typography.headingWeight}</label>
          <input
            type="range"
            min="400"
            max="900"
            step="100"
            value={settings.typography.headingWeight}
            onChange={e => updateTypography('headingWeight', Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>
    );
  }

  function renderLayoutSection() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Sidebar Position</label>
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'none', 'right'] as const).map(pos => (
              <button
                key={pos}
                onClick={() => updateLayout('sidebarPosition', pos)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  settings.layout.sidebarPosition === pos
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {pos === 'none' ? 'None' : pos.charAt(0).toUpperCase() + pos.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Content Width: {settings.layout.contentWidth}px</label>
          <input
            type="range"
            min="600"
            max="1400"
            step="20"
            value={settings.layout.contentWidth}
            onChange={e => updateLayout('contentWidth', Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Header Style</label>
          <div className="grid grid-cols-2 gap-2">
            {(['default', 'centered', 'minimal', 'sticky'] as const).map(style => (
              <button
                key={style}
                onClick={() => updateLayout('headerStyle', style)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  settings.layout.headerStyle === style
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Section Padding: {settings.spacing.sectionPadding}px</label>
          <input
            type="range"
            min="16"
            max="64"
            step="4"
            value={settings.spacing.sectionPadding}
            onChange={e => updateSpacing('sectionPadding', Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Border Radius: {settings.borders.radius}px</label>
          <input
            type="range"
            min="0"
            max="24"
            value={settings.borders.radius}
            onChange={e => updateBorders('radius', Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>
    );
  }

  function renderCSSSection() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Custom CSS</label>
          <p className="text-xs text-gray-500 mb-3">Add custom CSS to override or extend theme styles</p>
          <textarea
            value={customCSS}
            onChange={e => setCustomCSS(e.target.value)}
            placeholder={`/* Custom CSS */\n.my-class {\n  color: var(--color-primary);\n}`}
            className="w-full h-64 p-3 bg-gray-700 border border-gray-600 rounded-lg font-mono text-sm text-gray-200 resize-none"
            spellCheck={false}
          />
        </div>
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Available CSS Variables</h4>
          <div className="text-xs text-gray-400 font-mono space-y-1">
            <div>--color-primary, --color-secondary</div>
            <div>--color-background, --color-surface</div>
            <div>--color-text, --color-heading</div>
            <div>--font-heading, --font-body</div>
            <div>--border-radius, --border-width</div>
          </div>
        </div>
      </div>
    );
  }
}

// Live Preview Component
function ThemePreview({
  settings,
  previewMode,
  blocks = [],
  selectedBlockId,
  onSelectBlock,
  onDeleteBlock,
  onMoveBlock,
  onUpdateBlockProps,
  onDuplicateBlock,
  onCopyBlock,
  onUpdateBlock,
  previewDevice = 'desktop',
}: {
  settings: CustomThemeSettings;
  previewMode: 'light' | 'dark';
  blocks?: ContentBlock[];
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string | null) => void;
  onDeleteBlock?: (id: string) => void;
  onMoveBlock?: (id: string, direction: 'up' | 'down') => void;
  onUpdateBlockProps?: (id: string, props: Record<string, any>) => void;
  onDuplicateBlock?: (id: string) => void;
  onCopyBlock?: (id: string) => void;
  onUpdateBlock?: (block: ContentBlock) => void;
  previewDevice?: 'desktop' | 'tablet' | 'mobile';
}) {
  const { colors, typography, borders } = settings;

  // Use dark mode colors if available and in dark mode
  const activeColors = previewMode === 'dark' && settings.darkMode
    ? { ...colors, ...settings.darkMode }
    : colors;

  const containerStyle: React.CSSProperties = {
    fontFamily: `${typography.bodyFont}, system-ui, sans-serif`,
    fontSize: typography.baseFontSize,
    lineHeight: typography.lineHeight,
    color: activeColors.text,
    background: activeColors.background,
    minHeight: '100%',
  };

  // Device-specific padding
  const devicePadding = previewDevice === 'mobile' ? 12 : previewDevice === 'tablet' ? 20 : 24;

  return (
    <div style={containerStyle} className="min-h-full">
      {/* Blank Canvas - Only show blocks or empty state */}
      {blocks.length === 0 ? (
        /* Empty State - Clean blank canvas with helpful message */
        <div
          className="flex flex-col items-center justify-center min-h-[500px] p-8"
          style={{
            background: `linear-gradient(135deg, ${activeColors.background} 0%, ${activeColors.surface} 100%)`,
            borderRadius: borders.radius,
          }}
        >
          <div className="text-center max-w-md">
            {/* Canvas Icon */}
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{
                background: `${activeColors.primary}15`,
                border: `2px dashed ${activeColors.primary}40`
              }}
            >
              <FiGrid size={36} style={{ color: activeColors.primary }} />
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: `${typography.headingFont}, system-ui`,
                fontWeight: typography.headingWeight,
                color: activeColors.heading,
                fontSize: '1.5rem',
                marginBottom: '0.75rem'
              }}
            >
              Start Building Your Page
            </h2>

            {/* Description */}
            <p style={{ color: activeColors.textMuted, marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Add blocks from the sidebar to start creating your page.
              You can also use a preset template to get started quickly.
            </p>

            {/* Visual hints */}
            <div className="flex items-center justify-center gap-4 text-sm" style={{ color: activeColors.textMuted }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: activeColors.primary }} />
                <span>Click "Blocks" tab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: activeColors.secondary || activeColors.primary }} />
                <span>Add blocks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: activeColors.accent || activeColors.primary }} />
                <span>Customize</span>
              </div>
            </div>

            {/* Drop zone indicator */}
            <div
              className="mt-8 py-4 px-6 rounded-lg border-2 border-dashed"
              style={{
                borderColor: `${activeColors.primary}30`,
                background: `${activeColors.primary}05`
              }}
            >
              <p className="text-sm" style={{ color: activeColors.textMuted }}>
                ↑ Blocks will appear here ↑
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Blocks Container - Clean canvas with blocks */
        <div
          className="min-h-[500px]"
          style={{ padding: devicePadding }}
        >
          <div className="space-y-4">
            {blocks.map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                settings={settings}
                isSelected={selectedBlockId === block.id}
                onSelect={() => onSelectBlock?.(block.id)}
                onDelete={() => onDeleteBlock?.(block.id)}
                onMoveUp={() => onMoveBlock?.(block.id, 'up')}
                onMoveDown={() => onMoveBlock?.(block.id, 'down')}
                onUpdateProps={(props) => onUpdateBlockProps?.(block.id, props)}
                onDuplicate={() => onDuplicateBlock?.(block.id)}
                onCopy={() => onCopyBlock?.(block.id)}
                onUpdateBlock={onUpdateBlock}
                previewDevice={previewDevice}
              />
            ))}
          </div>

          {/* Add more blocks hint at bottom */}
          <div
            className="mt-6 py-3 text-center rounded-lg border-2 border-dashed opacity-50 hover:opacity-100 transition-opacity"
            style={{
              borderColor: `${activeColors.border}`,
              color: activeColors.textMuted
            }}
          >
            <p className="text-sm">+ Add more blocks from the sidebar</p>
          </div>
        </div>
      )}
    </div>
  );
}