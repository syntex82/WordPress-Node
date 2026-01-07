/**
 * Theme Content Manager Page
 * Advanced manager for images, content blocks, and links for the active theme
 * Features: Stats dashboard, live preview, templates, search/filter, bulk actions
 * With comprehensive tooltips for user guidance
 * Integrated with Theme Customizer for seamless design workflow
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FiImage, FiLayout, FiLink2, FiRefreshCw, FiAlertCircle, FiArrowLeft, FiEye,
  FiGrid, FiList, FiSearch, FiDownload, FiUpload,
  FiZap, FiPackage, FiX, FiExternalLink,
  FiMonitor, FiSmartphone, FiTablet, FiSettings, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { themesApi, themeCustomizationApi } from '../services/api';
import ImageManagementPanel from '../components/ThemeCustomizer/ImageManagementPanel';
import ContentBlocksPanel from '../components/ThemeCustomizer/ContentBlocksPanel';
import LinkManagementPanel from '../components/ThemeCustomizer/LinkManagementPanel';
import Tooltip from '../components/Tooltip';

// Tooltip content for all features
const TOOLTIPS = {
  dashboard: { title: '📊 Dashboard', content: 'Overview of all theme content. See stats, quick actions, and recent updates at a glance.' },
  images: { title: '🖼️ Images', content: 'Manage theme images like logos, backgrounds, and banners. Drag to reorder, upload new images, and organize by type.' },
  blocks: { title: '🧱 Content Blocks', content: 'Reusable content sections like heroes, features, and CTAs. Build your page layout with drag-and-drop.' },
  links: { title: '🔗 Links', content: 'Manage navigation links, social media, and CTAs. Organize into groups and control visibility.' },
  refresh: { title: 'Refresh Data', content: 'Reload all content from the server to see the latest changes.' },
  export: { title: 'Export All', content: 'Download all theme content as a JSON file for backup or transfer to another site.' },
  preview: { title: 'Live Preview', content: 'Toggle the live preview panel to see your changes in real-time on different devices.' },
  viewSite: { title: 'View Website', content: 'Open your live website in a new tab to see how it looks to visitors.' },
  search: { title: 'Search', content: 'Filter content by name or keyword. Start typing to find specific items.' },
  gridView: { title: 'Grid View', content: 'Display items in a visual grid layout with thumbnails.' },
  listView: { title: 'List View', content: 'Display items in a compact list format.' },
  templates: { title: 'Section Templates', content: 'Pre-built content sections you can add with one click. Great for quickly building pages.' },
  uploadImage: { title: 'Upload Image', content: 'Add a new image to your theme. Supports JPG, PNG, GIF, and SVG formats.' },
  addBlock: { title: 'Add Block', content: 'Create a new content block. Choose from 11 different block types.' },
  addLink: { title: 'Add Link', content: 'Create a new navigation or social link. Organize into groups.' },
  desktopPreview: { title: 'Desktop Preview', content: 'Preview your site at desktop resolution (1200px wide).' },
  tabletPreview: { title: 'Tablet Preview', content: 'Preview your site at tablet resolution (768px wide).' },
  mobilePreview: { title: 'Mobile Preview', content: 'Preview your site at mobile resolution (375px wide).' },
  customizer: { title: '🎨 Theme Customizer', content: 'Open the Theme Customizer to change colors, fonts, layout, and visual styling of your theme.' },
};

type TabType = 'dashboard' | 'images' | 'blocks' | 'links';
type ViewMode = 'grid' | 'list';
type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface Theme {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface ContentStats {
  images: number;
  blocks: number;
  links: number;
  totalSize: string;
  lastUpdated: string;
}

// Pre-built section templates for quick adding
const SECTION_TEMPLATES = [
  {
    id: 'hero-basic',
    name: 'Basic Hero',
    type: 'block',
    icon: '🏠',
    description: 'Simple hero with title and CTA',
    data: { type: 'hero', title: 'Welcome to Our Site', content: 'Discover amazing features', layout: 'full-width', columns: 1 }
  },
  {
    id: 'features-3col',
    name: '3-Column Features',
    type: 'block',
    icon: '⚡',
    description: 'Three feature cards',
    data: { type: 'features', title: 'Our Features', layout: 'grid', columns: 3 }
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    type: 'block',
    icon: '💬',
    description: 'Customer testimonials slider',
    data: { type: 'testimonials', title: 'What Our Customers Say', layout: 'contained', columns: 1 }
  },
  {
    id: 'cta-banner',
    name: 'CTA Banner',
    type: 'block',
    icon: '📢',
    description: 'Call to action section',
    data: { type: 'cta', title: 'Ready to Get Started?', content: 'Join thousands of happy customers', layout: 'full-width', columns: 1 }
  },
  {
    id: 'gallery-grid',
    name: 'Image Gallery',
    type: 'block',
    icon: '🖼️',
    description: '4-column image gallery',
    data: { type: 'gallery', title: 'Our Gallery', layout: 'grid', columns: 4 }
  },
  {
    id: 'nav-main',
    name: 'Main Navigation',
    type: 'links',
    icon: '🔗',
    description: 'Standard navigation links',
    data: [
      { name: 'home', label: 'Home', url: '/', group: 'main-nav', type: 'navigation' },
      { name: 'about', label: 'About', url: '/about', group: 'main-nav', type: 'navigation' },
      { name: 'services', label: 'Services', url: '/services', group: 'main-nav', type: 'navigation' },
      { name: 'contact', label: 'Contact', url: '/contact', group: 'main-nav', type: 'navigation' },
    ]
  },
  {
    id: 'social-links',
    name: 'Social Media Links',
    type: 'links',
    icon: '📱',
    description: 'Common social media links',
    data: [
      { name: 'facebook', label: 'Facebook', url: 'https://facebook.com', group: 'social-links', type: 'social', target: '_blank' },
      { name: 'twitter', label: 'Twitter', url: 'https://twitter.com', group: 'social-links', type: 'social', target: '_blank' },
      { name: 'instagram', label: 'Instagram', url: 'https://instagram.com', group: 'social-links', type: 'social', target: '_blank' },
      { name: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com', group: 'social-links', type: 'social', target: '_blank' },
    ]
  },
];

export default function ThemeContentManager() {
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [stats, setStats] = useState<ContentStats>({ images: 0, blocks: 0, links: 0, totalSize: '0 KB', lastUpdated: 'Never' });
  const [showTemplates, setShowTemplates] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadActiveTheme();
  }, []);

  useEffect(() => {
    if (activeTheme) {
      loadStats();
    }
  }, [activeTheme, refreshKey]);

  const loadActiveTheme = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await themesApi.getActive();
      if (response.data) {
        setActiveTheme(response.data);
      } else {
        setError('No active theme found. Please activate a theme first.');
      }
    } catch (err: any) {
      console.error('Error loading theme:', err);
      setError(err.response?.data?.message || 'Failed to load active theme');
      toast.error('Failed to load active theme');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!activeTheme) return;
    try {
      const [imagesRes, blocksRes, linksRes] = await Promise.all([
        themeCustomizationApi.getImages(activeTheme.id),
        themeCustomizationApi.getBlocks(activeTheme.id),
        themeCustomizationApi.getLinks(activeTheme.id),
      ]);

      // Calculate total size from images
      const totalBytes = imagesRes.data.reduce((acc: number, img: any) => acc + (img.fileSize || 0), 0);
      const totalSize = totalBytes > 1024 * 1024
        ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
        : `${(totalBytes / 1024).toFixed(2)} KB`;

      // Find most recent update
      const allItems = [...imagesRes.data, ...blocksRes.data, ...linksRes.data];
      const mostRecent = allItems.reduce((latest: any, item: any) => {
        if (!latest) return item;
        return new Date(item.updatedAt) > new Date(latest.updatedAt) ? item : latest;
      }, null);

      setStats({
        images: imagesRes.data.length,
        blocks: blocksRes.data.length,
        links: linksRes.data.length,
        totalSize,
        lastUpdated: mostRecent ? new Date(mostRecent.updatedAt).toLocaleDateString() : 'Never',
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleAddTemplate = async (template: typeof SECTION_TEMPLATES[0]) => {
    if (!activeTheme) return;

    try {
      if (template.type === 'block') {
        await themeCustomizationApi.createBlock(activeTheme.id, {
          name: template.name,
          ...template.data,
          isVisible: true,
          position: stats.blocks,
        });
        toast.success(`Added ${template.name} block`);
      } else if (template.type === 'links' && Array.isArray(template.data)) {
        for (let i = 0; i < template.data.length; i++) {
          await themeCustomizationApi.createLink(activeTheme.id, {
            ...template.data[i],
            isVisible: true,
            isActive: false,
            position: stats.links + i,
          });
        }
        toast.success(`Added ${template.data.length} links from ${template.name}`);
      }
      setRefreshKey(k => k + 1);
      setShowTemplates(false);
    } catch (err) {
      toast.error('Failed to add template');
    }
  };

  const handleExportContent = async () => {
    if (!activeTheme) return;

    try {
      const [imagesRes, blocksRes, linksRes] = await Promise.all([
        themeCustomizationApi.getImages(activeTheme.id),
        themeCustomizationApi.getBlocks(activeTheme.id),
        themeCustomizationApi.getLinks(activeTheme.id),
      ]);

      const exportData = {
        theme: activeTheme.name,
        exportedAt: new Date().toISOString(),
        images: imagesRes.data,
        blocks: blocksRes.data,
        links: linksRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `theme-content-${activeTheme.slug}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Content exported successfully');
    } catch (err) {
      toast.error('Failed to export content');
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    toast.success('Content refreshed');
  }, []);

  const getPreviewWidth = () => {
    switch (previewDevice) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: FiGrid, description: 'Overview & quick actions', count: null },
    { id: 'images' as TabType, label: 'Images', icon: FiImage, description: 'Logos, heroes, backgrounds', count: stats.images },
    { id: 'blocks' as TabType, label: 'Content Blocks', icon: FiLayout, description: 'Sections & components', count: stats.blocks },
    { id: 'links' as TabType, label: 'Links', icon: FiLink2, description: 'Navigation & social', count: stats.links },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading Theme Content Manager...</p>
        </div>
      </div>
    );
  }

  if (error || !activeTheme) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <FiAlertCircle className="text-red-400" size={28} />
              </div>
              <div>
                <h3 className="font-bold text-red-300 text-xl mb-2">Error Loading Theme</h3>
                <p className="text-red-400 mb-6">{error || 'No active theme found'}</p>
                <button
                  onClick={loadActiveTheme}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-400 font-medium transition-all shadow-lg shadow-red-500/20"
                >
                  <FiRefreshCw size={18} />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showPreview ? 'mr-[400px]' : ''}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-800/80 to-slate-800 border-b border-slate-700/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/" className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-all">
                  <FiArrowLeft size={20} className="text-white" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
                    <FiPackage className="text-blue-400" />
                    Theme Content Manager
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Managing: <span className="font-semibold text-white">{activeTheme.name}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Search */}
                <Tooltip title={TOOLTIPS.search.title} content={TOOLTIPS.search.content} position="bottom" variant="help">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search content..."
                      className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
                    />
                  </div>
                </Tooltip>

                {/* Actions */}
                <Tooltip title={TOOLTIPS.refresh.title} content={TOOLTIPS.refresh.content} position="bottom">
                  <button
                    onClick={handleRefresh}
                    className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-all text-slate-400 hover:text-white"
                  >
                    <FiRefreshCw size={18} />
                  </button>
                </Tooltip>
                <Tooltip title={TOOLTIPS.export.title} content={TOOLTIPS.export.content} position="bottom">
                  <button
                    onClick={handleExportContent}
                    className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-all text-slate-400 hover:text-white"
                  >
                    <FiDownload size={18} />
                  </button>
                </Tooltip>
                <Tooltip title={TOOLTIPS.preview.title} content={TOOLTIPS.preview.content} position="bottom">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      showPreview ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-700/50 hover:bg-slate-600/50 text-white'
                    }`}
                  >
                    <FiEye size={18} />
                    Preview
                  </button>
                </Tooltip>
                <Tooltip title={TOOLTIPS.customizer.title} content={TOOLTIPS.customizer.content} position="bottom">
                  <Link
                    to="/admin/customize"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl transition-all shadow-lg shadow-purple-500/20"
                  >
                    <FiSettings size={18} />
                    Customize Theme
                  </Link>
                </Tooltip>
                <Tooltip title={TOOLTIPS.viewSite.title} content={TOOLTIPS.viewSite.content} position="bottom">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    <FiExternalLink size={18} />
                    View Site
                  </a>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Banner - Quick Navigation */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/30">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400">Quick Navigation:</span>
                <Link
                  to="/admin/customize"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-all"
                >
                  <FiSettings size={14} />
                  <span>Colors & Fonts</span>
                  <FiArrowRight size={12} className="text-slate-500" />
                </Link>
                <Link
                  to="/admin/customize"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-all"
                >
                  <FiLayout size={14} />
                  <span>Header & Footer</span>
                  <FiArrowRight size={12} className="text-slate-500" />
                </Link>
              </div>
              <div className="text-xs text-slate-500">
                Changes sync automatically • Last saved: {stats.lastUpdated}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const tooltip = TOOLTIPS[tab.id as keyof typeof TOOLTIPS];
                return (
                  <Tooltip key={tab.id} title={tooltip?.title || tab.label} content={tooltip?.content || tab.description} position="bottom" variant="help">
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-4 font-medium transition-all border-b-2 ${
                        isActive
                          ? 'text-blue-400 border-blue-400 bg-slate-700/50'
                          : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-700/30'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          isActive ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-600 text-slate-300'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                );
              })}

              {/* View Mode Toggle (for non-dashboard tabs) */}
              {activeTab !== 'dashboard' && (
                <div className="ml-auto flex items-center gap-2 pr-2">
                  <Tooltip title={TOOLTIPS.gridView.title} content={TOOLTIPS.gridView.content} position="bottom">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-xl transition-all ${
                        viewMode === 'grid' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      <FiGrid size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip title={TOOLTIPS.listView.title} content={TOOLTIPS.listView.content} position="bottom">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-xl transition-all ${
                        viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      <FiList size={16} />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div
                  onClick={() => setActiveTab('images')}
                  className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all transform hover:scale-105 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                      <FiImage size={24} className="text-blue-400" />
                    </div>
                    <span className="text-4xl font-bold text-white">{stats.images}</span>
                  </div>
                  <h3 className="text-white font-semibold">Images</h3>
                  <p className="text-slate-400 text-sm">Total size: {stats.totalSize}</p>
                </div>

                <div
                  onClick={() => setActiveTab('blocks')}
                  className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all transform hover:scale-105 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                      <FiLayout size={24} className="text-purple-400" />
                    </div>
                    <span className="text-4xl font-bold text-white">{stats.blocks}</span>
                  </div>
                  <h3 className="text-white font-semibold">Content Blocks</h3>
                  <p className="text-slate-400 text-sm">Sections & components</p>
                </div>

                <div
                  onClick={() => setActiveTab('links')}
                  className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all transform hover:scale-105 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform">
                      <FiLink2 size={24} className="text-emerald-400" />
                    </div>
                    <span className="text-4xl font-bold text-white">{stats.links}</span>
                  </div>
                  <h3 className="text-white font-semibold">Links</h3>
                  <p className="text-slate-400 text-sm">Navigation & social</p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                      <FiRefreshCw size={24} className="text-amber-400" />
                    </div>
                  </div>
                  <h3 className="text-white font-semibold">Last Updated</h3>
                  <p className="text-slate-400 text-sm">{stats.lastUpdated}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FiZap className="text-amber-400" />
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => { setActiveTab('images'); }}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-all group"
                  >
                    <FiUpload size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white text-sm">Upload Image</span>
                  </button>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-all group"
                  >
                    <FiPackage size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white text-sm">Add Template</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('links'); }}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-all group"
                  >
                    <FiLink2 size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white text-sm">Add Link</span>
                  </button>
                  <button
                    onClick={handleExportContent}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-all group"
                  >
                    <FiDownload size={24} className="text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white text-sm">Export All</span>
                  </button>
                </div>
              </div>

              {/* Section Templates */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FiPackage className="text-blue-400" />
                  Section Templates
                </h2>
                <p className="text-slate-400 mb-4">Quickly add pre-built sections to your theme</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SECTION_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleAddTemplate(template)}
                      className="flex items-start gap-3 p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-all text-left group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{template.icon}</span>
                      <div>
                        <h3 className="text-white font-medium">{template.name}</h3>
                        <p className="text-slate-400 text-sm">{template.description}</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-lg ${
                          template.type === 'block' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {template.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
              <ImageManagementPanel key={`images-${refreshKey}`} themeId={activeTheme.id} />
            </div>
          )}

          {/* Blocks Tab */}
          {activeTab === 'blocks' && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
              <ContentBlocksPanel key={`blocks-${refreshKey}`} themeId={activeTheme.id} />
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
              <LinkManagementPanel key={`links-${refreshKey}`} themeId={activeTheme.id} />
            </div>
          )}
        </div>
      </div>

      {/* Live Preview Sidebar */}
      {showPreview && (
        <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-slate-800/95 backdrop-blur border-l border-slate-700/50 flex flex-col z-50">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-white font-semibold">Live Preview</h3>
            <div className="flex items-center gap-2">
              <Tooltip title={TOOLTIPS.desktopPreview.title} content={TOOLTIPS.desktopPreview.content} position="left">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-2 rounded-lg transition-all ${previewDevice === 'desktop' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                >
                  <FiMonitor size={16} />
                </button>
              </Tooltip>
              <Tooltip title={TOOLTIPS.tabletPreview.title} content={TOOLTIPS.tabletPreview.content} position="left">
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-2 rounded-lg transition-all ${previewDevice === 'tablet' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                >
                  <FiTablet size={16} />
                </button>
              </Tooltip>
              <Tooltip title={TOOLTIPS.mobilePreview.title} content={TOOLTIPS.mobilePreview.content} position="left">
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-2 rounded-lg transition-all ${previewDevice === 'mobile' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                >
                  <FiSmartphone size={16} />
                </button>
              </Tooltip>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto bg-slate-900">
            <div
              className="bg-white rounded-xl overflow-hidden mx-auto transition-all duration-300 ring-1 ring-slate-700/50"
              style={{ width: getPreviewWidth(), minHeight: '600px' }}
            >
              <iframe
                src="/"
                className="w-full h-full min-h-[600px]"
                title="Theme Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-auto border border-slate-700/50">
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-slate-800/95 backdrop-blur">
              <h2 className="text-xl font-bold text-white">Add Section Template</h2>
              <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 rounded-lg transition-all">
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {SECTION_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleAddTemplate(template)}
                  className="flex items-start gap-4 p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-all text-left group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{template.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                    <p className="text-slate-400 text-sm mb-2">{template.description}</p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-lg ${
                      template.type === 'block' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {template.type === 'block' ? 'Content Block' : 'Link Set'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

