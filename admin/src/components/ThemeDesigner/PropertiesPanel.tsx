/**
 * Enhanced Properties Panel System for Theme Designer
 * Modern, professional UI with comprehensive styling capabilities
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  FiX, FiMaximize2, FiMinimize2, FiChevronDown, FiChevronRight,
  FiType, FiDroplet, FiBox, FiLayers, FiSettings, FiGrid,
  FiZap, FiEye, FiLink, FiCopy, FiRotateCcw, FiCheck, FiSun, FiMoon,
  FiPlay, FiPause, FiRefreshCw, FiDownload, FiUpload, FiSearch,
  FiMove, FiLayout, FiSquare, FiCircle, FiSliders, FiClock
} from 'react-icons/fi';
import { ContentBlock, BlockStyle, DEFAULT_BLOCK_STYLE, blockStyleToCSS, AdvancedBlockPropertiesPanel } from './ContentBlocks';

// ============ Types ============
export interface PanelTab {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

export interface PropertyPanelProps {
  block: ContentBlock | null;
  onBlockUpdate: (block: ContentBlock) => void;
  onClose?: () => void;
  isOpen: boolean;
  position?: 'right' | 'left' | 'floating';
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

// ============ Style Preset Types ============
type TypographyPreset = { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing?: string };
type ColorPreset = { backgroundColor: string; textColor: string; accentColor: string };
type SpacingPreset = { padding: { top: string; right: string; bottom: string; left: string }; margin: { top: string; right: string; bottom: string; left: string } };
type BorderPreset = { width: string; style: 'none' | 'solid' | 'dashed' | 'dotted' | 'double'; color: string; radius: string };
type ShadowPreset = { enabled: boolean; x: string; y: string; blur: string; spread: string; color: string };

// ============ Animation Presets ============
export const STYLE_PRESETS: {
  typography: { id: string; name: string; style: TypographyPreset }[];
  colors: { id: string; name: string; style: ColorPreset }[];
  spacing: { id: string; name: string; style: SpacingPreset }[];
  borders: { id: string; name: string; style: BorderPreset }[];
  shadows: { id: string; name: string; style: ShadowPreset }[];
} = {
  typography: [
    { id: 'heading-bold', name: 'Bold Heading', style: { fontFamily: 'Inter', fontSize: '2rem', fontWeight: '700', lineHeight: '1.2' } },
    { id: 'body-readable', name: 'Readable Body', style: { fontFamily: 'Georgia', fontSize: '1.125rem', fontWeight: '400', lineHeight: '1.8' } },
    { id: 'elegant', name: 'Elegant', style: { fontFamily: 'Playfair Display', fontSize: '1.25rem', fontWeight: '400', lineHeight: '1.6', letterSpacing: '0.02em' } },
    { id: 'modern-clean', name: 'Modern Clean', style: { fontFamily: 'system-ui', fontSize: '1rem', fontWeight: '400', lineHeight: '1.6' } },
    { id: 'compact', name: 'Compact', style: { fontFamily: 'Inter', fontSize: '0.875rem', fontWeight: '500', lineHeight: '1.4' } },
  ],
  colors: [
    { id: 'light-neutral', name: 'Light Neutral', style: { backgroundColor: '#ffffff', textColor: '#1f2937', accentColor: '#3b82f6' } },
    { id: 'dark-elegant', name: 'Dark Elegant', style: { backgroundColor: '#1f2937', textColor: '#f9fafb', accentColor: '#8b5cf6' } },
    { id: 'warm-cozy', name: 'Warm & Cozy', style: { backgroundColor: '#fef3c7', textColor: '#78350f', accentColor: '#d97706' } },
    { id: 'cool-blue', name: 'Cool Blue', style: { backgroundColor: '#eff6ff', textColor: '#1e3a8a', accentColor: '#2563eb' } },
    { id: 'nature-green', name: 'Nature Green', style: { backgroundColor: '#ecfdf5', textColor: '#064e3b', accentColor: '#059669' } },
    { id: 'sunset', name: 'Sunset', style: { backgroundColor: '#fef2f2', textColor: '#7f1d1d', accentColor: '#dc2626' } },
  ],
  spacing: [
    { id: 'compact', name: 'Compact', style: { padding: { top: '8px', right: '12px', bottom: '8px', left: '12px' }, margin: { top: '0', right: '0', bottom: '8px', left: '0' } } },
    { id: 'normal', name: 'Normal', style: { padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' }, margin: { top: '0', right: '0', bottom: '16px', left: '0' } } },
    { id: 'spacious', name: 'Spacious', style: { padding: { top: '32px', right: '48px', bottom: '32px', left: '48px' }, margin: { top: '0', right: '0', bottom: '32px', left: '0' } } },
    { id: 'section', name: 'Section', style: { padding: { top: '64px', right: '48px', bottom: '64px', left: '48px' }, margin: { top: '0', right: '0', bottom: '0', left: '0' } } },
  ],
  borders: [
    { id: 'none', name: 'None', style: { width: '0', style: 'none', color: 'transparent', radius: '0' } },
    { id: 'subtle', name: 'Subtle', style: { width: '1px', style: 'solid', color: '#e5e7eb', radius: '4px' } },
    { id: 'rounded', name: 'Rounded', style: { width: '1px', style: 'solid', color: '#d1d5db', radius: '12px' } },
    { id: 'bold', name: 'Bold', style: { width: '2px', style: 'solid', color: '#374151', radius: '8px' } },
    { id: 'pill', name: 'Pill', style: { width: '1px', style: 'solid', color: '#e5e7eb', radius: '9999px' } },
  ],
  shadows: [
    { id: 'none', name: 'None', style: { enabled: false, x: '0', y: '0', blur: '0', spread: '0', color: 'transparent' } },
    { id: 'subtle', name: 'Subtle', style: { enabled: true, x: '0', y: '1px', blur: '3px', spread: '0', color: 'rgba(0,0,0,0.1)' } },
    { id: 'medium', name: 'Medium', style: { enabled: true, x: '0', y: '4px', blur: '6px', spread: '-1px', color: 'rgba(0,0,0,0.1)' } },
    { id: 'large', name: 'Large', style: { enabled: true, x: '0', y: '10px', blur: '15px', spread: '-3px', color: 'rgba(0,0,0,0.1)' } },
    { id: 'glow', name: 'Glow', style: { enabled: true, x: '0', y: '0', blur: '20px', spread: '0', color: 'rgba(59,130,246,0.5)' } },
  ],
};

// ============ Collapsible Section Component ============
interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  actions?: React.ReactNode;
}

export function CollapsibleSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false,
  badge,
  actions 
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/30 transition-all duration-200 group"
      >
        <Icon className="text-blue-400 flex-shrink-0" size={18} />
        <span className="flex-1 text-sm font-medium text-gray-200 text-left">{title}</span>
        {badge && (
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
            {badge}
          </span>
        )}
        {actions && (
          <div onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
            {actions}
          </div>
        )}
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <FiChevronDown className="text-gray-400" size={16} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============ Preset Selector Component ============
interface PresetSelectorProps<T> {
  presets: { id: string; name: string; style: T }[];
  onSelect: (style: T) => void;
  columns?: number;
}

export function PresetSelector<T>({ presets, onSelect, columns = 3 }: PresetSelectorProps<T>) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelect(preset.style)}
          className="p-2 text-xs bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 hover:border-blue-500 rounded-lg transition-all duration-200 text-center text-gray-300 hover:text-white"
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
}

// ============ Animation Test Panel Component ============
interface AnimationTestPanelProps {
  animation: { type: string; duration: number; delay: number; easing?: string };
  onChange: (animation: any) => void;
}

export function AnimationTestPanel({ animation, onChange }: AnimationTestPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const playAnimation = () => {
    setPreviewKey(k => k + 1);
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), animation.duration + animation.delay);
  };

  const animationTypes = [
    { id: 'none', name: 'None' },
    { id: 'fadeIn', name: 'Fade In' },
    { id: 'fadeInUp', name: 'Fade In Up' },
    { id: 'fadeInDown', name: 'Fade In Down' },
    { id: 'fadeInLeft', name: 'Fade In Left' },
    { id: 'fadeInRight', name: 'Fade In Right' },
    { id: 'scaleIn', name: 'Scale In' },
    { id: 'slideIn', name: 'Slide In' },
    { id: 'bounceIn', name: 'Bounce In' },
    { id: 'rotateIn', name: 'Rotate In' },
  ];

  const easingOptions = [
    { id: 'ease', name: 'Ease' },
    { id: 'ease-in', name: 'Ease In' },
    { id: 'ease-out', name: 'Ease Out' },
    { id: 'ease-in-out', name: 'Ease In Out' },
    { id: 'linear', name: 'Linear' },
    { id: 'cubic-bezier(0.68,-0.55,0.265,1.55)', name: 'Bounce' },
  ];

  return (
    <div className="space-y-4">
      {/* Animation Type */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Animation Type</label>
        <select
          value={animation.type}
          onChange={(e) => onChange({ ...animation, type: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        >
          {animationTypes.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Duration Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400">Duration</label>
          <span className="text-xs text-blue-400 font-mono">{animation.duration}ms</span>
        </div>
        <input
          type="range"
          min={100}
          max={2000}
          step={50}
          value={animation.duration}
          onChange={(e) => onChange({ ...animation, duration: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Delay Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400">Delay</label>
          <span className="text-xs text-blue-400 font-mono">{animation.delay}ms</span>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          step={50}
          value={animation.delay}
          onChange={(e) => onChange({ ...animation, delay: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Easing */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Easing</label>
        <select
          value={animation.easing || 'ease'}
          onChange={(e) => onChange({ ...animation, easing: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        >
          {easingOptions.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {/* Preview Box */}
      <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">Preview</span>
          <button
            onClick={playAnimation}
            disabled={isPlaying || animation.type === 'none'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors"
          >
            {isPlaying ? <FiPause size={12} /> : <FiPlay size={12} />}
            {isPlaying ? 'Playing...' : 'Play'}
          </button>
        </div>
        <div className="h-24 flex items-center justify-center bg-gray-900/50 rounded-lg overflow-hidden">
          <div
            key={previewKey}
            className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg ${
              isPlaying && animation.type !== 'none' ? `animate-${animation.type}` : ''
            }`}
            style={{
              animationDuration: `${animation.duration}ms`,
              animationDelay: `${animation.delay}ms`,
              animationTimingFunction: animation.easing || 'ease',
              animationFillMode: 'both',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ============ Quick Actions Bar ============
interface QuickActionsBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function QuickActionsBar({ onUndo, onRedo, onReset, onDuplicate, onExport, canUndo, canRedo }: QuickActionsBarProps) {
  return (
    <div className="flex items-center gap-1 p-2 bg-gray-800/50 border-b border-gray-700/50">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors group"
        title="Undo (Ctrl+Z)"
      >
        <FiRotateCcw size={16} className="text-gray-400 group-hover:text-white" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors group"
        title="Redo (Ctrl+Y)"
      >
        <FiRefreshCw size={16} className="text-gray-400 group-hover:text-white" />
      </button>
      <div className="w-px h-5 bg-gray-700 mx-1" />
      {onDuplicate && (
        <button
          onClick={onDuplicate}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
          title="Duplicate Block"
        >
          <FiCopy size={16} className="text-gray-400 group-hover:text-white" />
        </button>
      )}
      {onExport && (
        <button
          onClick={onExport}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
          title="Export Block Config"
        >
          <FiDownload size={16} className="text-gray-400 group-hover:text-white" />
        </button>
      )}
      <div className="flex-1" />
      <button
        onClick={onReset}
        className="p-2 hover:bg-red-600/20 rounded-lg transition-colors group"
        title="Reset to Defaults"
      >
        <FiRotateCcw size={16} className="text-gray-400 group-hover:text-red-400" />
      </button>
    </div>
  );
}

// ============ Block Info Header ============
interface BlockInfoHeaderProps {
  block: ContentBlock;
  onClose?: () => void;
}

export function BlockInfoHeader({ block, onClose }: BlockInfoHeaderProps) {
  const blockTypeLabels: Record<string, string> = {
    hero: '🦸 Hero Section',
    cta: '📢 Call to Action',
    features: '⭐ Features',
    testimonial: '💬 Testimonial',
    pricing: '💰 Pricing',
    gallery: '🖼️ Gallery',
    video: '🎬 Video',
    button: '🔘 Button',
    card: '🎴 Card',
    accordion: '📋 Accordion',
    tabs: '📑 Tabs',
    timeline: '📅 Timeline',
    stats: '📊 Statistics',
    newsletter: '📧 Newsletter',
    divider: '➖ Divider',
    row: '📐 Row/Columns',
    header: '🔝 Header',
    audio: '🎵 Audio',
    map: '🗺️ Map',
    imageText: '🖼️ Image + Text',
    logoCloud: '🏢 Logo Cloud',
    socialProof: '👥 Social Proof',
    countdown: '⏱️ Countdown',
    productCard: '🛍️ Product Card',
    productGrid: '🛒 Product Grid',
    featuredProduct: '⭐ Featured Product',
    productCarousel: '🎠 Product Carousel',
    courseCard: '📚 Course Card',
    courseGrid: '📖 Course Grid',
    courseCurriculum: '📝 Curriculum',
    courseProgress: '📈 Progress',
    courseInstructor: '👨‍🏫 Instructor',
    courseCategories: '🏷️ Categories',
    shoppingCart: '🛒 Shopping Cart',
    productCategories: '📦 Product Categories',
    productFilter: '🔍 Product Filter',
    checkoutSummary: '🧾 Checkout Summary',
    saleBanner: '🏷️ Sale Banner',
    loginForm: '🔐 Login Form',
    navGlass: '🧊 Glass Nav',
    navMinimal: '➖ Minimal Nav',
    navMega: '📋 Mega Nav',
    navCentered: '⚖️ Centered Nav',
    navSidebar: '📌 Sidebar Nav',
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-700/50">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg">
        {blockTypeLabels[block.type]?.split(' ')[0] || '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white truncate">
          {blockTypeLabels[block.type]?.split(' ').slice(1).join(' ') || block.type}
        </h3>
        <p className="text-xs text-gray-400">Block ID: {block.id.slice(0, 12)}...</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FiX size={18} className="text-gray-400" />
        </button>
      )}
    </div>
  );
}

// ============ Main Enhanced Properties Panel ============
export function EnhancedPropertiesPanel({
  block,
  onBlockUpdate,
  onClose,
  isOpen,
  position = 'right',
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: PropertyPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('content');
  const [searchQuery, setSearchQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        onRedo?.();
      }
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onClose]);

  if (!isOpen || !block) {
    return null;
  }

  const tabs: PanelTab[] = [
    { id: 'content', label: 'Content', icon: FiBox },
    { id: 'style', label: 'Style', icon: FiDroplet },
    { id: 'layout', label: 'Layout', icon: FiLayout },
    { id: 'animation', label: 'Animation', icon: FiZap },
    { id: 'advanced', label: 'Advanced', icon: FiSettings },
  ];

  const updateBlock = (updates: Partial<ContentBlock>) => {
    onBlockUpdate({ ...block, ...updates });
  };

  const updateStyle = (style: BlockStyle) => {
    updateBlock({ style });
  };

  const handleExport = () => {
    const config = JSON.stringify(block, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `block-${block.type}-${block.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm('Reset all styling to defaults?')) {
      updateBlock({ style: undefined });
    }
  };

  const positionClasses = {
    right: 'right-0 top-0 h-full border-l',
    left: 'left-0 top-0 h-full border-r',
    floating: 'right-4 top-20 h-auto max-h-[calc(100vh-160px)] rounded-xl shadow-2xl',
  };

  return (
    <div
      ref={panelRef}
      className={`fixed w-96 bg-gray-800/95 backdrop-blur-xl border-gray-700/50 flex flex-col z-50 transition-all duration-300 ease-out overflow-hidden ${positionClasses[position]} ${
        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {/* Block Info Header */}
      <BlockInfoHeader block={block} onClose={onClose} />

      {/* Quick Actions */}
      <QuickActionsBar
        onUndo={onUndo || (() => {})}
        onRedo={onRedo || (() => {})}
        onReset={handleReset}
        onExport={handleExport}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700/50 bg-gray-800/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar (for advanced tab) */}
      {activeTab === 'advanced' && (
        <div className="p-3 border-b border-gray-700/50">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties..."
              className="w-full pl-9 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'content' && (
          <div className="p-4 space-y-4">
            <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
              <FiBox size={12} /> Block Content Settings
            </div>
            <p className="text-sm text-gray-500 italic">
              Content settings are displayed in the sidebar. Use the Style and Layout tabs here for advanced visual customization.
            </p>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="divide-y divide-gray-700/50">
            {/* Typography Presets */}
            <CollapsibleSection title="Typography Presets" icon={FiType} defaultOpen={true}>
              <PresetSelector
                presets={STYLE_PRESETS.typography}
                onSelect={(style) => {
                  const currentStyle = block.style || DEFAULT_BLOCK_STYLE;
                  updateStyle({
                    ...currentStyle,
                    typography: { ...currentStyle.typography, ...style },
                  });
                }}
                columns={2}
              />
            </CollapsibleSection>

            {/* Color Presets */}
            <CollapsibleSection title="Color Presets" icon={FiDroplet}>
              <PresetSelector
                presets={STYLE_PRESETS.colors}
                onSelect={(style) => {
                  const currentStyle = block.style || DEFAULT_BLOCK_STYLE;
                  updateStyle({
                    ...currentStyle,
                    colors: { ...currentStyle.colors, ...style },
                  });
                }}
                columns={2}
              />
            </CollapsibleSection>

            {/* Border Presets */}
            <CollapsibleSection title="Border Presets" icon={FiSquare}>
              <PresetSelector
                presets={STYLE_PRESETS.borders}
                onSelect={(style) => {
                  const currentStyle = block.style || DEFAULT_BLOCK_STYLE;
                  updateStyle({
                    ...currentStyle,
                    border: { ...currentStyle.border, ...style },
                  });
                }}
                columns={2}
              />
            </CollapsibleSection>

            {/* Shadow Presets */}
            <CollapsibleSection title="Shadow Presets" icon={FiLayers}>
              <PresetSelector
                presets={STYLE_PRESETS.shadows}
                onSelect={(style) => {
                  const currentStyle = block.style || DEFAULT_BLOCK_STYLE;
                  updateStyle({
                    ...currentStyle,
                    shadow: { ...currentStyle.shadow, ...style },
                  });
                }}
                columns={2}
              />
            </CollapsibleSection>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="divide-y divide-gray-700/50">
            {/* Spacing Presets */}
            <CollapsibleSection title="Spacing Presets" icon={FiMove} defaultOpen={true}>
              <PresetSelector
                presets={STYLE_PRESETS.spacing}
                onSelect={(style) => {
                  const currentStyle = block.style || DEFAULT_BLOCK_STYLE;
                  updateStyle({
                    ...currentStyle,
                    spacing: { ...currentStyle.spacing, ...style },
                  });
                }}
                columns={2}
              />
            </CollapsibleSection>

            {/* Visibility Settings */}
            <CollapsibleSection title="Device Visibility" icon={FiEye}>
              <div className="space-y-3">
                {['desktop', 'tablet', 'mobile'].map((device) => (
                  <label key={device} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {device === 'desktop' ? '🖥️' : device === 'tablet' ? '📱' : '📲'}
                      </span>
                      <span className="text-sm text-gray-300 capitalize">{device}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={block.visibility?.[device as keyof typeof block.visibility] !== false}
                      onChange={(e) => {
                        updateBlock({
                          visibility: {
                            desktop: true,
                            tablet: true,
                            mobile: true,
                            ...block.visibility,
                            [device]: e.target.checked,
                          },
                        });
                      }}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                  </label>
                ))}
              </div>
            </CollapsibleSection>
          </div>
        )}

        {activeTab === 'animation' && (
          <div className="p-4">
            <AnimationTestPanel
              animation={block.animation || { type: 'none', duration: 300, delay: 0 }}
              onChange={(animation) => updateBlock({ animation })}
            />
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="p-4">
            <AdvancedBlockPropertiesPanel
              style={block.style || DEFAULT_BLOCK_STYLE}
              onChange={updateStyle}
              onReset={handleReset}
            />
          </div>
        )}
      </div>

      {/* Footer with keyboard shortcuts hint */}
      <div className="p-3 border-t border-gray-700/50 bg-gray-800/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>⌘Z Undo • ⌘Y Redo</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}

// ============ History Manager Hook ============
export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const set = useCallback((newPresent: T | ((prev: T) => T), recordHistory = true) => {
    setHistory((prev) => {
      const resolvedPresent = typeof newPresent === 'function'
        ? (newPresent as (prev: T) => T)(prev.present)
        : newPresent;

      if (!recordHistory) {
        return { ...prev, present: resolvedPresent };
      }

      return {
        past: [...prev.past, prev.present],
        present: resolvedPresent,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = prev.past.slice(0, -1);
      const newPresent = prev.past[prev.past.length - 1];

      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = prev.future.slice(1);
      const newPresent = prev.future[0];

      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newPresent: T) => {
    setHistory({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    historyLength: history.past.length,
  };
}

// ============ Block Configuration Export/Import ============
export const BlockConfigUtils = {
  exportBlock: (block: ContentBlock): string => {
    return JSON.stringify(block, null, 2);
  },

  exportBlocks: (blocks: ContentBlock[]): string => {
    return JSON.stringify({ version: '1.0', blocks, exportedAt: new Date().toISOString() }, null, 2);
  },

  importBlock: (json: string): ContentBlock | null => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.id && parsed.type) {
        return {
          ...parsed,
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate new ID
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  importBlocks: (json: string): ContentBlock[] | null => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        return parsed.blocks.map((b: ContentBlock) => ({
          ...b,
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));
      }
      return null;
    } catch {
      return null;
    }
  },

  downloadAsFile: (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ============ Inline Property Editor Components ============
interface InlineInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'color';
  suffix?: string;
  min?: number;
  max?: number;
}

export function InlineInput({ label, value, onChange, type = 'text', suffix, min, max }: InlineInputProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <label className="text-xs text-gray-400 flex-shrink-0">{label}</label>
      <div className="flex items-center gap-2">
        {type === 'color' ? (
          <div className="relative">
            <input
              type="color"
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-8 rounded-lg border border-gray-600 cursor-pointer overflow-hidden"
            />
          </div>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={min}
            max={max}
            className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        )}
        {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}

// ============ Visual Spacing Editor ============
interface VisualSpacingEditorProps {
  margin: { top: string; right: string; bottom: string; left: string };
  padding: { top: string; right: string; bottom: string; left: string };
  onMarginChange: (margin: { top: string; right: string; bottom: string; left: string }) => void;
  onPaddingChange: (padding: { top: string; right: string; bottom: string; left: string }) => void;
}

export function VisualSpacingEditor({ margin, padding, onMarginChange, onPaddingChange }: VisualSpacingEditorProps) {
  return (
    <div className="relative w-full aspect-[4/3] bg-gray-800/50 rounded-xl border border-gray-700 p-3">
      {/* Margin Labels */}
      <div className="absolute inset-0 flex flex-col items-center justify-between p-1 pointer-events-none">
        <input
          type="text"
          value={margin.top}
          onChange={(e) => onMarginChange({ ...margin, top: e.target.value })}
          className="w-16 px-2 py-1 bg-orange-500/20 border border-orange-500/50 rounded text-xs text-center text-orange-300 pointer-events-auto"
          title="Margin Top"
        />
        <div className="flex justify-between w-full px-1">
          <input
            type="text"
            value={margin.left}
            onChange={(e) => onMarginChange({ ...margin, left: e.target.value })}
            className="w-12 px-1 py-1 bg-orange-500/20 border border-orange-500/50 rounded text-xs text-center text-orange-300 pointer-events-auto"
            title="Margin Left"
          />
          <input
            type="text"
            value={margin.right}
            onChange={(e) => onMarginChange({ ...margin, right: e.target.value })}
            className="w-12 px-1 py-1 bg-orange-500/20 border border-orange-500/50 rounded text-xs text-center text-orange-300 pointer-events-auto"
            title="Margin Right"
          />
        </div>
        <input
          type="text"
          value={margin.bottom}
          onChange={(e) => onMarginChange({ ...margin, bottom: e.target.value })}
          className="w-16 px-2 py-1 bg-orange-500/20 border border-orange-500/50 rounded text-xs text-center text-orange-300 pointer-events-auto"
          title="Margin Bottom"
        />
      </div>

      {/* Padding Box */}
      <div className="absolute inset-8 bg-blue-500/10 border-2 border-dashed border-blue-500/50 rounded-lg flex flex-col items-center justify-between p-1">
        <input
          type="text"
          value={padding.top}
          onChange={(e) => onPaddingChange({ ...padding, top: e.target.value })}
          className="w-14 px-1 py-0.5 bg-blue-500/20 border border-blue-500/50 rounded text-xs text-center text-blue-300"
          title="Padding Top"
        />
        <div className="flex justify-between w-full">
          <input
            type="text"
            value={padding.left}
            onChange={(e) => onPaddingChange({ ...padding, left: e.target.value })}
            className="w-10 px-1 py-0.5 bg-blue-500/20 border border-blue-500/50 rounded text-xs text-center text-blue-300"
            title="Padding Left"
          />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs text-gray-500">Content</span>
          </div>
          <input
            type="text"
            value={padding.right}
            onChange={(e) => onPaddingChange({ ...padding, right: e.target.value })}
            className="w-10 px-1 py-0.5 bg-blue-500/20 border border-blue-500/50 rounded text-xs text-center text-blue-300"
            title="Padding Right"
          />
        </div>
        <input
          type="text"
          value={padding.bottom}
          onChange={(e) => onPaddingChange({ ...padding, bottom: e.target.value })}
          className="w-14 px-1 py-0.5 bg-blue-500/20 border border-blue-500/50 rounded text-xs text-center text-blue-300"
          title="Padding Bottom"
        />
      </div>

      {/* Legend */}
      <div className="absolute bottom-1 left-1 flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-orange-500/50 rounded-sm" /> Margin
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500/50 rounded-sm" /> Padding
        </span>
      </div>
    </div>
  );
}