/**
 * Advanced Page Builder Blocks
 * Includes: Link System, Grid/Columns, Header Builder, E-commerce Blocks
 */
import React, { useState } from 'react';
import {
  FiMail, FiPhone, FiChevronDown,
  FiShoppingCart, FiStar, FiMenu, FiX,
  FiHeart, FiEye,
  FiSmartphone, FiTablet, FiMonitor, FiChevronRight, FiPlus, FiTrash2
} from 'react-icons/fi';
import { CustomThemeSettings } from '../../services/api';

// Import enhanced animation and link systems
import {
  EnhancedAnimationSettings,
  DEFAULT_ANIMATION,
  AnimationType,
  EasingType,
  TriggerType
} from './AnimationSystem';
import {
  EnhancedLinkSettings,
  EnhancedLinkType,
  DEFAULT_LINK
} from './UniversalLinkEditor';

// Re-export enhanced types for backward compatibility
export type { EnhancedAnimationSettings, EnhancedLinkSettings };
export { DEFAULT_ANIMATION, DEFAULT_LINK };

// ============ Link/Action System Types ============
// Legacy types kept for backward compatibility
export type LinkType = 'none' | 'internal' | 'external' | 'anchor' | 'email' | 'phone' | 'modal' | 'scroll';
export type ButtonAction = 'link' | 'scroll' | 'modal' | 'submit';

export interface LinkSettings {
  type: LinkType;
  url: string;
  anchor?: string;
  email?: string;
  phone?: string;
  newTab?: boolean;
  modalId?: string;
  scrollTarget?: string;
}

export interface BlockVisibility {
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
}

// Legacy animation settings for backward compatibility
export interface AnimationSettings {
  type: 'none' | 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoomIn' | 'bounce';
  duration: number;
  delay: number;
}

// Convert legacy to enhanced animation settings
export function toEnhancedAnimation(legacy?: AnimationSettings): EnhancedAnimationSettings {
  if (!legacy) return DEFAULT_ANIMATION;
  return {
    ...DEFAULT_ANIMATION,
    type: legacy.type as AnimationType,
    duration: legacy.duration,
    delay: legacy.delay,
  };
}

// Convert enhanced to legacy animation settings (for backward compatibility)
export function toLegacyAnimation(enhanced?: EnhancedAnimationSettings): AnimationSettings {
  if (!enhanced) return { type: 'none', duration: 300, delay: 0 };
  return {
    type: enhanced.type as AnimationSettings['type'],
    duration: enhanced.duration,
    delay: enhanced.delay,
  };
}

// ============ Grid System Types ============
export type ColumnWidth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type BreakpointSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ColumnSettings {
  id: string;
  width: { desktop: ColumnWidth; tablet: ColumnWidth; mobile: ColumnWidth };
  blocks: ContentBlock[];
}

export interface RowSettings {
  columns: ColumnSettings[];
  gap: number;
  verticalAlign: 'top' | 'center' | 'bottom' | 'stretch';
  horizontalAlign: 'left' | 'center' | 'right' | 'between' | 'around';
}

// ============ Header Builder Types ============
export interface NavItem {
  id: string;
  label: string;
  link: LinkSettings;
  children?: NavItem[];
}

export interface HeaderSettings {
  logo: { url: string; width: number; position: 'left' | 'center' | 'right' };
  style: 'default' | 'transparent' | 'solid' | 'sticky' | 'hamburger';
  backgroundColor: string;
  navItems: NavItem[];
  showTopBar: boolean;
  topBar: { phone: string; email: string; socialLinks: { platform: string; url: string }[] };
  ctaButton: { show: boolean; text: string; link: LinkSettings; style: 'solid' | 'outline' | 'ghost' };
  mobileBreakpoint: 'md' | 'lg';
}

// ============ E-commerce Types ============
export interface ProductData {
  id: string;
  image: string;
  title: string;
  price: number;
  salePrice?: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  inStock: boolean;
  description?: string;
  // Individual product links
  productUrl?: string;        // URL to product detail page
  addToCartAction?: 'link' | 'button' | 'modal';  // What happens on add to cart
  addToCartUrl?: string;      // URL if addToCartAction is 'link'
  quickViewEnabled?: boolean; // Enable quick view modal
}

// Product Category for shop
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  productCount: number;
  description?: string;
}

// Cart Item for shopping cart
export interface CartItem {
  id: string;
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  variant?: string;
}

// Cart Data for shopping cart block
export interface CartData {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  total: number;
  currency?: string;
}

// ============ Course/LMS Types ============
export interface InstructorData {
  id: string;
  name: string;
  photo: string;
  title: string;
  bio: string;
  credentials?: string[];
  rating?: number;
  reviewCount?: number;
  courseCount?: number;
  studentCount?: number;
  socialLinks?: { platform: string; url: string }[];
}

export interface LessonData {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  isPreview?: boolean;
  isCompleted?: boolean;
}

export interface ModuleData {
  id: string;
  title: string;
  lessons: LessonData[];
  duration: string;
}

export interface CourseData {
  id: string;
  image: string;
  title: string;
  instructor: string;
  instructorImage?: string;
  duration: string;
  lessonCount: number;
  price: number;
  salePrice?: number;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  badge?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  category?: string;
  description?: string;
  courseUrl?: string;
}

export interface CourseCategoryData {
  id: string;
  name: string;
  slug: string;
  icon: string;
  courseCount: number;
  color?: string;
}

export interface CourseProgressData {
  courseId: string;
  courseTitle: string;
  courseImage: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedLesson?: string;
  continueUrl?: string;
}

// Re-export ContentBlock for this file
export interface ContentBlock {
  id: string;
  type: string;
  props: Record<string, any>;
  visibility?: BlockVisibility;
  animation?: AnimationSettings;
  link?: LinkSettings;
}

// ============ Preset Layouts ============
export const PRESET_LAYOUTS = [
  { id: '2-equal', name: '2 Equal', columns: [6, 6] },
  { id: '3-equal', name: '3 Equal', columns: [4, 4, 4] },
  { id: '4-equal', name: '4 Equal', columns: [3, 3, 3, 3] },
  { id: '1-3-2-3', name: '1/3 + 2/3', columns: [4, 8] },
  { id: '2-3-1-3', name: '2/3 + 1/3', columns: [8, 4] },
  { id: '1-4-3-4', name: '1/4 + 3/4', columns: [3, 9] },
  { id: '3-4-1-4', name: '3/4 + 1/4', columns: [9, 3] },
  { id: 'sidebar-left', name: 'Sidebar Left', columns: [3, 9] },
  { id: 'sidebar-right', name: 'Sidebar Right', columns: [9, 3] },
];

// ============ Animation Presets ============
// Legacy presets for backward compatibility
export const ANIMATION_PRESETS = [
  { id: 'none', name: 'None', css: '', category: 'none' },
  // Fade animations
  { id: 'fadeIn', name: 'Fade In', css: 'animate-fadeIn', category: 'fade' },
  { id: 'fadeInUp', name: 'Fade In Up', css: 'animate-fadeInUp', category: 'fade' },
  { id: 'fadeInDown', name: 'Fade In Down', css: 'animate-fadeInDown', category: 'fade' },
  { id: 'fadeInLeft', name: 'Fade In Left', css: 'animate-fadeInLeft', category: 'fade' },
  { id: 'fadeInRight', name: 'Fade In Right', css: 'animate-fadeInRight', category: 'fade' },
  // Slide animations
  { id: 'slideUp', name: 'Slide Up', css: 'animate-slideUp', category: 'slide' },
  { id: 'slideDown', name: 'Slide Down', css: 'animate-slideDown', category: 'slide' },
  { id: 'slideLeft', name: 'Slide Left', css: 'animate-slideLeft', category: 'slide' },
  { id: 'slideRight', name: 'Slide Right', css: 'animate-slideRight', category: 'slide' },
  // Zoom animations
  { id: 'zoomIn', name: 'Zoom In', css: 'animate-zoomIn', category: 'zoom' },
  { id: 'zoomOut', name: 'Zoom Out', css: 'animate-zoomOut', category: 'zoom' },
  { id: 'zoomInUp', name: 'Zoom In Up', css: 'animate-zoomInUp', category: 'zoom' },
  { id: 'zoomInDown', name: 'Zoom In Down', css: 'animate-zoomInDown', category: 'zoom' },
  // Rotation animations
  { id: 'rotateIn', name: 'Rotate In', css: 'animate-rotateIn', category: 'rotate' },
  { id: 'flipX', name: 'Flip X', css: 'animate-flipX', category: 'rotate' },
  { id: 'flipY', name: 'Flip Y', css: 'animate-flipY', category: 'rotate' },
  { id: 'spin', name: 'Spin', css: 'animate-spin', category: 'rotate' },
  // Bounce and elastic
  { id: 'bounce', name: 'Bounce', css: 'animate-bounce', category: 'bounce' },
  { id: 'bounceIn', name: 'Bounce In', css: 'animate-bounceIn', category: 'bounce' },
  { id: 'elastic', name: 'Elastic', css: 'animate-elastic', category: 'bounce' },
  { id: 'rubberBand', name: 'Rubber Band', css: 'animate-rubberBand', category: 'bounce' },
  { id: 'pulse', name: 'Pulse', css: 'animate-pulse', category: 'bounce' },
  // Attention seekers
  { id: 'shake', name: 'Shake', css: 'animate-shake', category: 'attention' },
  { id: 'wobble', name: 'Wobble', css: 'animate-wobble', category: 'attention' },
  { id: 'swing', name: 'Swing', css: 'animate-swing', category: 'attention' },
  { id: 'tada', name: 'Tada', css: 'animate-tada', category: 'attention' },
  { id: 'jello', name: 'Jello', css: 'animate-jello', category: 'attention' },
  { id: 'heartBeat', name: 'Heart Beat', css: 'animate-heartBeat', category: 'attention' },
  // Special effects
  { id: 'blur', name: 'Blur Reveal', css: 'animate-blur', category: 'special' },
  { id: 'glow', name: 'Glow', css: 'animate-glow', category: 'special' },
];

// Easing options for animation
export const EASING_OPTIONS = [
  { id: 'ease', name: 'Ease', value: 'ease' },
  { id: 'ease-in', name: 'Ease In', value: 'ease-in' },
  { id: 'ease-out', name: 'Ease Out', value: 'ease-out' },
  { id: 'ease-in-out', name: 'Ease In Out', value: 'ease-in-out' },
  { id: 'linear', name: 'Linear', value: 'linear' },
  { id: 'bounce', name: 'Bounce', value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  { id: 'elastic', name: 'Elastic', value: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)' },
  { id: 'spring', name: 'Spring', value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
];

// Trigger options
export const TRIGGER_OPTIONS = [
  { id: 'onLoad', name: 'On Page Load' },
  { id: 'onScroll', name: 'On Scroll Into View' },
  { id: 'onHover', name: 'On Hover' },
  { id: 'onClick', name: 'On Click' },
];

// ============ Link Settings Form Component ============
export function LinkSettingsForm({
  link,
  onChange,
}: {
  link: LinkSettings;
  onChange: (link: LinkSettings) => void;
  settings?: CustomThemeSettings;
}) {
  return (
    <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Link Type</label>
        <select
          value={link.type}
          onChange={e => onChange({ ...link, type: e.target.value as LinkType })}
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
        >
          <option value="none">None</option>
          <option value="internal">Internal Page</option>
          <option value="external">External URL</option>
          <option value="anchor">Anchor Link</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="modal">Open Modal</option>
          <option value="scroll">Scroll to Section</option>
        </select>
      </div>
      {(link.type === 'internal' || link.type === 'external') && (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">URL</label>
          <input
            type="text"
            value={link.url || ''}
            onChange={e => onChange({ ...link, url: e.target.value })}
            placeholder={link.type === 'internal' ? '/page-slug' : 'https://example.com'}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
      )}
      {link.type === 'anchor' && (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Anchor ID</label>
          <input
            type="text"
            value={link.anchor || ''}
            onChange={e => onChange({ ...link, anchor: e.target.value })}
            placeholder="#section-id"
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
      )}
      {link.type === 'email' && (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Email Address</label>
          <input
            type="email"
            value={link.email || ''}
            onChange={e => onChange({ ...link, email: e.target.value })}
            placeholder="hello@example.com"
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
      )}
      {link.type === 'phone' && (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
          <input
            type="tel"
            value={link.phone || ''}
            onChange={e => onChange({ ...link, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
      )}
      {link.type === 'scroll' && (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Scroll Target</label>
          <input
            type="text"
            value={link.scrollTarget || ''}
            onChange={e => onChange({ ...link, scrollTarget: e.target.value })}
            placeholder="#target-section"
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
      )}
      {link.type === 'external' && (
        <label className="flex items-center gap-2 text-sm text-gray-300 mt-2">
          <input
            type="checkbox"
            checked={link.newTab || false}
            onChange={e => onChange({ ...link, newTab: e.target.checked })}
            className="rounded bg-gray-700 border-gray-600"
          />
          Open in new tab
        </label>
      )}
    </div>
  );
}

// ============ Visibility Settings Component ============
export function VisibilitySettings({
  visibility,
  onChange,
}: {
  visibility: BlockVisibility;
  onChange: (visibility: BlockVisibility) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
      <span className="text-xs text-gray-400">Show on:</span>
      <button
        onClick={() => onChange({ ...visibility, desktop: !visibility.desktop })}
        className={`p-1.5 rounded ${visibility.desktop ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
        title="Desktop"
      >
        <FiMonitor size={14} />
      </button>
      <button
        onClick={() => onChange({ ...visibility, tablet: !visibility.tablet })}
        className={`p-1.5 rounded ${visibility.tablet ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
        title="Tablet"
      >
        <FiTablet size={14} />
      </button>
      <button
        onClick={() => onChange({ ...visibility, mobile: !visibility.mobile })}
        className={`p-1.5 rounded ${visibility.mobile ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
        title="Mobile"
      >
        <FiSmartphone size={14} />
      </button>
    </div>
  );
}

// ============ Animation Settings Component ============
interface ExtendedAnimation extends AnimationSettings {
  easing?: string;
  trigger?: string;
  repeat?: 'once' | 'loop' | 'infinite';
}

export function AnimationSettingsForm({
  animation,
  onChange,
  showPreview = true,
  compact = false,
}: {
  animation: AnimationSettings | ExtendedAnimation;
  onChange: (animation: AnimationSettings | ExtendedAnimation) => void;
  showPreview?: boolean;
  compact?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const extAnim = animation as ExtendedAnimation;
  const categories = ['all', 'fade', 'slide', 'zoom', 'rotate', 'bounce', 'attention', 'special'];

  const filteredPresets = activeCategory === 'all'
    ? ANIMATION_PRESETS
    : ANIMATION_PRESETS.filter(p => p.category === activeCategory);

  const playPreview = () => {
    setPreviewKey(prev => prev + 1);
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), animation.duration + animation.delay + 100);
  };

  const preset = ANIMATION_PRESETS.find(p => p.id === animation.type);

  return (
    <div className={`space-y-3 ${compact ? 'p-2' : 'p-3'} bg-gray-800/50 rounded-lg`}>
      {/* Preview Box */}
      {showPreview && (
        <div className="relative bg-gray-900/50 rounded-lg p-4 flex items-center justify-center min-h-[80px] border border-gray-700">
          <div
            key={previewKey}
            className={isPlaying ? preset?.css || '' : ''}
            style={isPlaying ? {
              animationDuration: `${animation.duration}ms`,
              animationDelay: `${animation.delay}ms`,
              animationFillMode: 'both',
              animationTimingFunction: (extAnim.easing && EASING_OPTIONS.find(e => e.id === extAnim.easing)?.value) || 'ease-out',
            } : {}}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={playPreview}
            className="absolute bottom-2 right-2 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-xs flex items-center gap-1"
          >
            ▶ Play
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-0.5 text-[10px] rounded-full capitalize transition-all ${
              activeCategory === cat
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Animation Type Selector */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Animation Type</label>
        <select
          value={animation.type}
          onChange={e => {
            const newPreset = ANIMATION_PRESETS.find(p => p.id === e.target.value);
            onChange({
              ...animation,
              type: e.target.value as AnimationSettings['type'],
            });
            // Auto-play preview when changing
            setTimeout(playPreview, 100);
          }}
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
        >
          {filteredPresets.map(preset => (
            <option key={preset.id} value={preset.id}>{preset.name}</option>
          ))}
        </select>
      </div>

      {animation.type !== 'none' && (
        <>
          {/* Duration Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-400">Duration</label>
              <span className="text-xs text-blue-400">{animation.duration}ms</span>
            </div>
            <input
              type="range"
              value={animation.duration}
              onChange={e => onChange({ ...animation, duration: parseInt(e.target.value) })}
              min={100}
              max={3000}
              step={50}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Delay Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-400">Delay</label>
              <span className="text-xs text-purple-400">{animation.delay}ms</span>
            </div>
            <input
              type="range"
              value={animation.delay}
              onChange={e => onChange({ ...animation, delay: parseInt(e.target.value) })}
              min={0}
              max={2000}
              step={50}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Easing Selector */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Easing</label>
            <select
              value={extAnim.easing || 'ease-out'}
              onChange={e => onChange({ ...animation, easing: e.target.value } as ExtendedAnimation)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
            >
              {EASING_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          {/* Trigger Selector */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Trigger</label>
            <select
              value={extAnim.trigger || 'onLoad'}
              onChange={e => onChange({ ...animation, trigger: e.target.value } as ExtendedAnimation)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
            >
              {TRIGGER_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          {/* Repeat Options */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Repeat</label>
            <div className="flex gap-1">
              {(['once', 'loop', 'infinite'] as const).map(repeat => (
                <button
                  key={repeat}
                  onClick={() => onChange({ ...animation, repeat } as ExtendedAnimation)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                    (extAnim.repeat || 'once') === repeat
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {repeat.charAt(0).toUpperCase() + repeat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


// ============ Row/Column Grid Block ============
export function RowBlock({
  props,
  settings,
  renderBlock,
}: {
  props: RowSettings;
  settings: CustomThemeSettings;
  onUpdateColumn?: (colIndex: number, blocks: ContentBlock[]) => void;
  renderBlock?: (block: ContentBlock, colIndex: number, blockIndex: number) => React.ReactNode;
}) {
  const { columns, gap, verticalAlign, horizontalAlign } = props;

  const alignItems: Record<string, string> = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyContent: Record<string, string> = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  return (
    <div
      className={`grid grid-cols-12 ${alignItems[verticalAlign]} ${justifyContent[horizontalAlign]}`}
      style={{ gap: `${gap}px` }}
    >
      {columns.map((col, colIndex) => (
        <div
          key={col.id}
          className="min-h-[60px] rounded-lg border-2 border-dashed border-gray-600 p-2 transition-all hover:border-blue-500"
          style={{
            gridColumn: `span ${col.width.desktop}`,
            background: settings.colors.surface,
          }}
        >
          {col.blocks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <FiPlus className="mr-1" /> Drop blocks here
            </div>
          ) : (
            <div className="space-y-2">
              {col.blocks.map((block, blockIndex) => (
                renderBlock ? renderBlock(block, colIndex, blockIndex) : (
                  <div key={block.id} className="p-2 bg-gray-700/50 rounded text-xs text-gray-300">
                    {block.type}
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ Column Width Selector ============
export function ColumnWidthSelector({
  width,
  onChange,
}: {
  width: ColumnWidth;
  onChange: (width: ColumnWidth) => void;
  breakpoint?: 'desktop' | 'tablet' | 'mobile';
}) {
  const widths: ColumnWidth[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="flex flex-wrap gap-1">
      {widths.map(w => (
        <button
          key={w}
          onClick={() => onChange(w)}
          className={`w-6 h-6 text-xs rounded ${width === w ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
        >
          {w}
        </button>
      ))}
    </div>
  );
}

// ============ E-commerce Product Card Block ============
export function ProductCardBlock({
  props,
  settings,
}: {
  props: {
    product: ProductData;
    showRating?: boolean;
    showBadge?: boolean;
    buttonStyle?: 'solid' | 'outline' | 'icon';
  };
  settings: CustomThemeSettings;
}) {
  const { product, showRating = true, showBadge = true, buttonStyle = 'solid' } = props;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.salePrice! / product.price) * 100) : 0;

  // Product link wrapper component
  const ProductLink = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    if (product.productUrl) {
      return (
        <a
          href={product.productUrl}
          className={`block ${className}`}
          onClick={(e) => e.preventDefault()} // Prevent navigation in preview
        >
          {children}
        </a>
      );
    }
    return <div className={className}>{children}</div>;
  };

  // Handle add to cart action
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // In preview mode, just show a console log
    console.log('Add to cart:', product.id, product.title);
  };

  return (
    <div
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl"
      style={{
        background: settings.colors.surface,
        borderRadius: settings.borders.radius,
        border: `${settings.borders.width}px solid ${settings.colors.border}`,
      }}
    >
      {/* Product Image - Clickable */}
      <ProductLink className="relative aspect-square overflow-hidden block cursor-pointer">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {showBadge && product.badge && (
          <span
            className="absolute top-3 left-3 px-2 py-1 text-xs font-bold rounded-full"
            style={{ background: settings.colors.primary, color: 'white' }}
          >
            {product.badge}
          </span>
        )}
        {hasDiscount && (
          <span className="absolute top-3 right-3 px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white">
            -{discountPercent}%
          </span>
        )}
        {/* Quick Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {product.quickViewEnabled !== false && (
            <button
              className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); console.log('Quick view:', product.id); }}
              title="Quick View"
            >
              <FiEye className="text-gray-800" />
            </button>
          )}
          <button
            className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            title="Add to Wishlist"
          >
            <FiHeart className="text-gray-800" />
          </button>
        </div>
      </ProductLink>

      {/* Product Info */}
      <div className="p-4">
        {/* Title - Clickable */}
        <ProductLink>
          <h3
            className="font-semibold mb-2 line-clamp-2 hover:underline cursor-pointer"
            style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }}
          >
            {product.title}
          </h3>
        </ProductLink>

        {showRating && (
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <FiStar
                key={star}
                size={14}
                className={star <= product.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold" style={{ color: settings.colors.primary }}>
                ${product.salePrice?.toFixed(2)}
              </span>
              <span className="text-sm line-through" style={{ color: settings.colors.textMuted }}>
                ${product.price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold" style={{ color: settings.colors.heading }}>
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        {buttonStyle === 'icon' ? (
          <button
            onClick={handleAddToCart}
            className="w-full py-2 flex items-center justify-center gap-2 font-medium transition-all hover:opacity-90"
            style={{
              background: settings.colors.primary,
              color: 'white',
              borderRadius: settings.borders.radius,
            }}
          >
            <FiShoppingCart size={18} />
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full py-2 flex items-center justify-center gap-2 font-medium transition-all hover:opacity-90"
            style={{
              background: buttonStyle === 'solid' ? settings.colors.primary : 'transparent',
              color: buttonStyle === 'solid' ? 'white' : settings.colors.primary,
              border: buttonStyle === 'outline' ? `2px solid ${settings.colors.primary}` : 'none',
              borderRadius: settings.borders.radius,
            }}
          >
            <FiShoppingCart size={16} /> Add to Cart
          </button>
        )}

        {/* Product URL indicator (shown in designer) */}
        {product.productUrl && (
          <div className="mt-2 text-xs text-gray-500 truncate" title={product.productUrl}>
            🔗 {product.productUrl}
          </div>
        )}
      </div>
    </div>
  );
}


// ============ Product Grid Block ============
export function ProductGridBlock({
  props,
  settings,
}: {
  props: {
    products: ProductData[];
    columns: 2 | 3 | 4;
    showRating?: boolean;
    buttonStyle?: 'solid' | 'outline' | 'icon';
  };
  settings: CustomThemeSettings;
}) {
  const { products, columns, showRating = true, buttonStyle = 'solid' } = props;
  const gridCols: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };

  return (
    <div className={`grid grid-cols-1 md:${gridCols[columns]} gap-6`}>
      {products.map(product => (
        <ProductCardBlock
          key={product.id}
          props={{ product, showRating, buttonStyle }}
          settings={settings}
        />
      ))}
    </div>
  );
}

// ============ Featured Product Block ============
export function FeaturedProductBlock({
  props,
  settings,
}: {
  props: {
    product: ProductData;
    layout: 'left' | 'right';
  };
  settings: CustomThemeSettings;
}) {
  const { product, layout } = props;
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Add to cart:', product.id, product.title);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.productUrl) {
      console.log('Navigate to:', product.productUrl);
    }
  };

  return (
    <div
      className={`flex flex-col md:flex-row gap-8 p-8 ${layout === 'right' ? 'md:flex-row-reverse' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${settings.colors.surface}, ${settings.colors.background})`,
        borderRadius: settings.borders.radius * 2,
      }}
    >
      <div className="flex-1">
        {product.productUrl ? (
          <a href={product.productUrl} onClick={(e) => e.preventDefault()} className="block">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-80 object-cover rounded-xl shadow-2xl cursor-pointer hover:opacity-90 transition-opacity"
            />
          </a>
        ) : (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-80 object-cover rounded-xl shadow-2xl"
          />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {product.badge && (
          <span
            className="inline-block px-3 py-1 text-sm font-bold rounded-full mb-4 w-fit"
            style={{ background: settings.colors.primary, color: 'white' }}
          >
            {product.badge}
          </span>
        )}
        {product.productUrl ? (
          <a href={product.productUrl} onClick={(e) => e.preventDefault()} className="block">
            <h2
              className="text-3xl font-bold mb-4 hover:underline cursor-pointer"
              style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }}
            >
              {product.title}
            </h2>
          </a>
        ) : (
          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }}
          >
            {product.title}
          </h2>
        )}

        {product.description && (
          <p className="mb-4" style={{ color: settings.colors.textMuted }}>
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <FiStar key={star} size={20} className={star <= product.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
          ))}
          <span className="ml-2" style={{ color: settings.colors.textMuted }}>({product.reviewCount} reviews)</span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          {hasDiscount ? (
            <>
              <span className="text-4xl font-bold" style={{ color: settings.colors.primary }}>${product.salePrice?.toFixed(2)}</span>
              <span className="text-xl line-through" style={{ color: settings.colors.textMuted }}>${product.price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-4xl font-bold" style={{ color: settings.colors.heading }}>${product.price.toFixed(2)}</span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold transition-all hover:opacity-90"
            style={{ background: settings.colors.primary, color: 'white', borderRadius: settings.borders.radius }}
          >
            <FiShoppingCart /> Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="px-6 py-3 font-semibold transition-all hover:opacity-90"
            style={{ background: settings.colors.surface, color: settings.colors.primary, border: `2px solid ${settings.colors.primary}`, borderRadius: settings.borders.radius }}
          >
            Buy Now
          </button>
        </div>

        {/* Product URL indicator (shown in designer) */}
        {product.productUrl && (
          <div className="mt-4 text-xs text-gray-500 truncate" title={product.productUrl}>
            🔗 {product.productUrl}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Product Carousel Block ============
export function ProductCarouselBlock({
  props,
  settings,
}: {
  props: {
    products: ProductData[];
    autoPlay?: boolean;
    showArrows?: boolean;
  };
  settings: CustomThemeSettings;
}) {
  const { products, showArrows = true } = props;
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex(i => (i + 1) % products.length);
  const prev = () => setCurrentIndex(i => (i - 1 + products.length) % products.length);

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {products.map(product => (
            <div key={product.id} className="flex-shrink-0 w-full px-2">
              <ProductCardBlock props={{ product }} settings={settings} />
            </div>
          ))}
        </div>
      </div>
      {showArrows && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg"
            style={{ background: settings.colors.surface, color: settings.colors.heading }}
          >
            <FiChevronRight className="rotate-180" size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg"
            style={{ background: settings.colors.surface, color: settings.colors.heading }}
          >
            <FiChevronRight size={24} />
          </button>
        </>
      )}
      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'w-6' : ''}`}
            style={{ background: i === currentIndex ? settings.colors.primary : settings.colors.border }}
          />
        ))}
      </div>
    </div>
  );
}

// ============ Header Builder Block ============
export function HeaderBuilderBlock({
  props,
  settings,
}: {
  props: HeaderSettings;
  settings: CustomThemeSettings;
}) {
  const { logo, style, backgroundColor, navItems, showTopBar, topBar, ctaButton } = props;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerBg = style === 'transparent' ? 'transparent' : (backgroundColor || settings.colors.surface);

  return (
    <div>
      {/* Top Bar */}
      {showTopBar && (
        <div className="py-2 px-4 text-sm flex items-center justify-between" style={{ background: settings.colors.primary, color: 'white' }}>
          <div className="flex items-center gap-4">
            {topBar.phone && (
              <a href={`tel:${topBar.phone}`} className="flex items-center gap-1 hover:opacity-80">
                <FiPhone size={14} /> {topBar.phone}
              </a>
            )}
            {topBar.email && (
              <a href={`mailto:${topBar.email}`} className="flex items-center gap-1 hover:opacity-80">
                <FiMail size={14} /> {topBar.email}
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
            {topBar.socialLinks?.map((social, i) => (
              <a key={i} href={social.url} className="hover:opacity-80">{social.platform}</a>
            ))}
          </div>
        </div>
      )}

      {/* Main Header */}
      <header
        className={`flex items-center justify-between px-6 py-4 ${style === 'sticky' ? 'sticky top-0 z-50' : ''}`}
        style={{ background: headerBg, borderBottom: `1px solid ${settings.colors.border}` }}
      >
        {/* Logo */}
        <div className={`flex items-center ${logo.position === 'center' ? 'absolute left-1/2 -translate-x-1/2' : ''}`}>
          {logo.url ? (
            <img src={logo.url} alt="Logo" style={{ width: logo.width }} className="h-auto" />
          ) : (
            <span className="text-xl font-bold" style={{ color: settings.colors.heading }}>Logo</span>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <div key={item.id} className="relative group">
              <a
                href={item.link.url || '#'}
                className="flex items-center gap-1 font-medium transition-colors hover:opacity-80"
                style={{ color: settings.colors.text }}
              >
                {item.label}
                {item.children && item.children.length > 0 && <FiChevronDown size={14} />}
              </a>
              {/* Dropdown */}
              {item.children && item.children.length > 0 && (
                <div
                  className="absolute top-full left-0 mt-2 py-2 min-w-[200px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
                  style={{ background: settings.colors.surface, border: `1px solid ${settings.colors.border}` }}
                >
                  {item.children.map(child => (
                    <a
                      key={child.id}
                      href={child.link.url || '#'}
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      style={{ color: settings.colors.text }}
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {ctaButton.show && (
            <button
              className="hidden md:flex px-4 py-2 font-medium transition-all"
              style={{
                background: ctaButton.style === 'solid' ? settings.colors.primary : 'transparent',
                color: ctaButton.style === 'solid' ? 'white' : settings.colors.primary,
                border: ctaButton.style !== 'solid' ? `2px solid ${settings.colors.primary}` : 'none',
                borderRadius: settings.borders.radius,
              }}
            >
              {ctaButton.text}
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            style={{ color: settings.colors.heading }}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 px-6 space-y-3" style={{ background: settings.colors.surface }}>
          {navItems.map(item => (
            <a key={item.id} href={item.link.url || '#'} className="block py-2 font-medium" style={{ color: settings.colors.text }}>
              {item.label}
            </a>
          ))}
          {ctaButton.show && (
            <button
              className="w-full py-2 font-medium mt-4"
              style={{ background: settings.colors.primary, color: 'white', borderRadius: settings.borders.radius }}
            >
              {ctaButton.text}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Header Settings Form ============
export function HeaderSettingsPanel({
  headerSettings,
  onChange,
}: {
  headerSettings: HeaderSettings;
  onChange: (settings: HeaderSettings) => void;
  settings?: CustomThemeSettings;
}) {
  const addNavItem = () => {
    onChange({
      ...headerSettings,
      navItems: [
        ...headerSettings.navItems,
        { id: Date.now().toString(), label: 'New Item', link: { type: 'internal', url: '/' }, children: [] },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Logo Settings */}
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-3">Logo</h4>
        <div className="space-y-2">
          <input
            type="text"
            value={headerSettings.logo.url}
            onChange={e => onChange({ ...headerSettings, logo: { ...headerSettings.logo, url: e.target.value } })}
            placeholder="Logo URL"
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Width:</label>
            <input
              type="number"
              value={headerSettings.logo.width}
              onChange={e => onChange({ ...headerSettings, logo: { ...headerSettings.logo, width: parseInt(e.target.value) || 120 } })}
              className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            />
            <span className="text-xs text-gray-400">px</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Position:</label>
            <select
              value={headerSettings.logo.position}
              onChange={e => onChange({ ...headerSettings, logo: { ...headerSettings.logo, position: e.target.value as 'left' | 'center' | 'right' } })}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </div>

      {/* Header Style */}
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-3">Style</h4>
        <select
          value={headerSettings.style}
          onChange={e => onChange({ ...headerSettings, style: e.target.value as HeaderSettings['style'] })}
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
        >
          <option value="default">Default</option>
          <option value="transparent">Transparent</option>
          <option value="solid">Solid</option>
          <option value="sticky">Sticky</option>
          <option value="hamburger">Hamburger Only</option>
        </select>
      </div>

      {/* Navigation Items */}
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white">Navigation</h4>
          <button onClick={addNavItem} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <FiPlus size={12} /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {headerSettings.navItems.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="text"
                value={item.label}
                onChange={e => {
                  const newItems = [...headerSettings.navItems];
                  newItems[i] = { ...item, label: e.target.value };
                  onChange({ ...headerSettings, navItems: newItems });
                }}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              />
              <button
                onClick={() => onChange({ ...headerSettings, navItems: headerSettings.navItems.filter((_, idx) => idx !== i) })}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Top Bar Toggle */}
      <label className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg cursor-pointer">
        <input
          type="checkbox"
          checked={headerSettings.showTopBar}
          onChange={e => onChange({ ...headerSettings, showTopBar: e.target.checked })}
          className="rounded bg-gray-700 border-gray-600"
        />
        <span className="text-sm text-white">Show Top Bar</span>
      </label>

      {/* CTA Button */}
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={headerSettings.ctaButton.show}
            onChange={e => onChange({ ...headerSettings, ctaButton: { ...headerSettings.ctaButton, show: e.target.checked } })}
            className="rounded bg-gray-700 border-gray-600"
          />
          <span className="text-sm font-semibold text-white">CTA Button</span>
        </label>
        {headerSettings.ctaButton.show && (
          <div className="space-y-2">
            <input
              type="text"
              value={headerSettings.ctaButton.text}
              onChange={e => onChange({ ...headerSettings, ctaButton: { ...headerSettings.ctaButton, text: e.target.value } })}
              placeholder="Button Text"
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
            />
            <select
              value={headerSettings.ctaButton.style}
              onChange={e => onChange({ ...headerSettings, ctaButton: { ...headerSettings.ctaButton, style: e.target.value as 'solid' | 'outline' | 'ghost' } })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
            >
              <option value="solid">Solid</option>
              <option value="outline">Outline</option>
              <option value="ghost">Ghost</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Course/LMS Blocks ============

// Course Card Block
export function CourseCardBlock({
  props,
  settings,
}: {
  props: {
    course: CourseData;
    showInstructor?: boolean;
    showRating?: boolean;
    buttonStyle?: 'solid' | 'outline';
  };
  settings: CustomThemeSettings;
}) {
  const { course, showInstructor = true, showRating = true, buttonStyle = 'solid' } = props;
  const hasDiscount = course.salePrice && course.salePrice < course.price;

  const levelColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-blue-100 text-blue-800',
    advanced: 'bg-purple-100 text-purple-800',
    'all-levels': 'bg-gray-100 text-gray-800',
  };

  return (
    <div
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl"
      style={{
        background: settings.colors.surface,
        borderRadius: settings.borders.radius,
        border: `${settings.borders.width}px solid ${settings.colors.border}`,
      }}
    >
      {/* Course Image */}
      <div className="relative aspect-video overflow-hidden">
        <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {course.badge && (
          <span className="absolute top-3 left-3 px-2 py-1 text-xs font-bold rounded-full" style={{ background: settings.colors.primary, color: 'white' }}>
            {course.badge}
          </span>
        )}
        {course.level && (
          <span className={`absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full ${levelColors[course.level]}`}>
            {course.level.replace('-', ' ')}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center gap-4 text-white text-xs">
            <span>⏱️ {course.duration}</span>
            <span>📚 {course.lessonCount} lessons</span>
          </div>
        </div>
      </div>

      {/* Course Info */}
      <div className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }}>
          {course.title}
        </h3>

        {showInstructor && (
          <div className="flex items-center gap-2 mb-3">
            <img src={course.instructorImage || 'https://i.pravatar.cc/40'} alt={course.instructor} className="w-6 h-6 rounded-full" />
            <span className="text-sm" style={{ color: settings.colors.textMuted }}>{course.instructor}</span>
          </div>
        )}

        {showRating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <FiStar key={star} size={14} className={star <= course.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-xs" style={{ color: settings.colors.textMuted }}>({course.reviewCount}) • {course.enrollmentCount} students</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-lg font-bold" style={{ color: settings.colors.primary }}>${course.salePrice?.toFixed(2)}</span>
                <span className="text-sm line-through" style={{ color: settings.colors.textMuted }}>${course.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-lg font-bold" style={{ color: settings.colors.heading }}>${course.price.toFixed(2)}</span>
            )}
          </div>
          <button
            className="px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: buttonStyle === 'solid' ? settings.colors.primary : 'transparent',
              color: buttonStyle === 'solid' ? 'white' : settings.colors.primary,
              border: buttonStyle === 'outline' ? `2px solid ${settings.colors.primary}` : 'none',
              borderRadius: settings.borders.radius,
            }}
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
}

// Course Grid Block
export function CourseGridBlock({
  props,
  settings,
}: {
  props: {
    courses: CourseData[];
    columns: 2 | 3 | 4;
    showInstructor?: boolean;
    showRating?: boolean;
  };
  settings: CustomThemeSettings;
}) {
  const { courses, columns, showInstructor = true, showRating = true } = props;

  return (
    <div className="p-6">
      <div className={`grid gap-6 ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {courses.map(course => (
          <CourseCardBlock key={course.id} props={{ course, showInstructor, showRating }} settings={settings} />
        ))}
      </div>
    </div>
  );
}

// Course Curriculum Block
export function CourseCurriculumBlock({
  props,
  settings,
}: {
  props: {
    modules: ModuleData[];
    courseTitle?: string;
    showDuration?: boolean;
  };
  settings: CustomThemeSettings;
}) {
  const { modules, courseTitle, showDuration = true } = props;
  const [expandedModules, setExpandedModules] = useState<string[]>([modules[0]?.id || '']);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const lessonIcons = { video: '🎥', text: '📖', quiz: '❓', assignment: '📝' };

  return (
    <div className="p-6" style={{ background: settings.colors.background }}>
      {courseTitle && (
        <h3 className="text-xl font-bold mb-4" style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }}>
          {courseTitle}
        </h3>
      )}
      <div className="space-y-2">
        {modules.map(module => (
          <div key={module.id} style={{ background: settings.colors.surface, borderRadius: settings.borders.radius, border: `${settings.borders.width}px solid ${settings.colors.border}` }}>
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <FiChevronDown className={`transition-transform ${expandedModules.includes(module.id) ? 'rotate-180' : ''}`} style={{ color: settings.colors.primary }} />
                <span className="font-medium" style={{ color: settings.colors.heading }}>{module.title}</span>
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: settings.colors.textMuted }}>
                <span>{module.lessons.length} lessons</span>
                {showDuration && <span>{module.duration}</span>}
              </div>
            </button>
            {expandedModules.includes(module.id) && (
              <div className="border-t" style={{ borderColor: settings.colors.border }}>
                {module.lessons.map(lesson => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 hover:bg-gray-50/5">
                    <div className="flex items-center gap-3">
                      <span>{lessonIcons[lesson.type]}</span>
                      <span style={{ color: lesson.isCompleted ? settings.colors.textMuted : settings.colors.text }}>{lesson.title}</span>
                      {lesson.isPreview && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">Preview</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: settings.colors.textMuted }}>{lesson.duration}</span>
                      {lesson.isCompleted && <span className="text-green-500">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// Course Progress Block
export function CourseProgressBlock({
  props,
  settings,
}: {
  props: {
    progress: CourseProgressData;
    showContinueButton?: boolean;
  };
  settings: CustomThemeSettings;
}) {
  const { progress, showContinueButton = true } = props;

  return (
    <div
      className="p-6"
      style={{
        background: settings.colors.surface,
        borderRadius: settings.borders.radius,
        border: `${settings.borders.width}px solid ${settings.colors.border}`,
      }}
    >
      <div className="flex items-center gap-4">
        <img src={progress.courseImage} alt={progress.courseTitle} className="w-20 h-14 rounded-lg object-cover" />
        <div className="flex-1">
          <h4 className="font-semibold mb-1" style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }}>
            {progress.courseTitle}
          </h4>
          <div className="flex items-center gap-4 text-sm" style={{ color: settings.colors.textMuted }}>
            <span>{progress.completedLessons} / {progress.totalLessons} lessons completed</span>
            <span>{progress.progress}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 mb-3">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: settings.colors.border }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress.progress}%`, background: settings.colors.primary }}
          />
        </div>
      </div>

      {showContinueButton && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: settings.colors.textMuted }}>
            Next: {progress.lastAccessedLesson || 'Start learning'}
          </span>
          <button
            className="px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
            style={{ background: settings.colors.primary, color: 'white', borderRadius: settings.borders.radius }}
          >
            Continue Learning →
          </button>
        </div>
      )}
    </div>
  );
}

// Course Instructor Block
export function CourseInstructorBlock({
  props,
  settings,
}: {
  props: {
    instructor: InstructorData;
    showStats?: boolean;
    showSocial?: boolean;
  };
  settings: CustomThemeSettings;
}) {
  const { instructor, showStats = true, showSocial = true } = props;

  return (
    <div
      className="p-6"
      style={{
        background: settings.colors.surface,
        borderRadius: settings.borders.radius,
        border: `${settings.borders.width}px solid ${settings.colors.border}`,
      }}
    >
      <div className="flex items-start gap-6">
        <img src={instructor.photo} alt={instructor.name} className="w-24 h-24 rounded-full object-cover" />
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1" style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }}>
            {instructor.name}
          </h3>
          <p className="text-sm mb-2" style={{ color: settings.colors.primary }}>{instructor.title}</p>

          {instructor.rating && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <FiStar key={star} size={14} className={star <= instructor.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                ))}
              </div>
              <span className="text-sm" style={{ color: settings.colors.textMuted }}>({instructor.reviewCount} reviews)</span>
            </div>
          )}

          {showStats && (
            <div className="flex items-center gap-6 mb-4">
              {instructor.courseCount && (
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: settings.colors.heading }}>{instructor.courseCount}</div>
                  <div className="text-xs" style={{ color: settings.colors.textMuted }}>Courses</div>
                </div>
              )}
              {instructor.studentCount && (
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: settings.colors.heading }}>{instructor.studentCount.toLocaleString()}</div>
                  <div className="text-xs" style={{ color: settings.colors.textMuted }}>Students</div>
                </div>
              )}
            </div>
          )}

          <p className="text-sm mb-4" style={{ color: settings.colors.text }}>{instructor.bio}</p>

          {instructor.credentials && instructor.credentials.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {instructor.credentials.map((cred, i) => (
                <span key={i} className="px-2 py-1 text-xs rounded-full" style={{ background: settings.colors.background, color: settings.colors.text }}>
                  {cred}
                </span>
              ))}
            </div>
          )}

          {showSocial && instructor.socialLinks && instructor.socialLinks.length > 0 && (
            <div className="flex items-center gap-3">
              {instructor.socialLinks.map((link, i) => (
                <a key={i} href={link.url} className="text-gray-400 hover:text-gray-600 transition-colors">
                  {link.platform === 'twitter' && '𝕏'}
                  {link.platform === 'linkedin' && 'in'}
                  {link.platform === 'youtube' && '▶'}
                  {link.platform === 'website' && '🌐'}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Course Categories Block
export function CourseCategoriesBlock({
  props,
  settings,
}: {
  props: {
    categories: CourseCategoryData[];
    columns: 2 | 3 | 4 | 6;
    style: 'cards' | 'minimal' | 'icons';
  };
  settings: CustomThemeSettings;
}) {
  const { categories, columns, style } = props;

  return (
    <div className="p-6" style={{ background: settings.colors.background }}>
      <div className={`grid gap-4 ${
        columns === 2 ? 'grid-cols-2' :
        columns === 3 ? 'grid-cols-3' :
        columns === 4 ? 'grid-cols-4' : 'grid-cols-6'
      }`}>
        {categories.map(category => (
          <div
            key={category.id}
            className={`flex ${style === 'icons' ? 'flex-col items-center text-center' : 'items-center gap-4'} p-4 transition-all hover:shadow-lg cursor-pointer`}
            style={{
              background: style === 'minimal' ? 'transparent' : settings.colors.surface,
              borderRadius: settings.borders.radius,
              border: style === 'minimal' ? 'none' : `${settings.borders.width}px solid ${settings.colors.border}`,
            }}
          >
            <div
              className={`${style === 'icons' ? 'w-16 h-16 text-3xl mb-3' : 'w-12 h-12 text-2xl'} rounded-xl flex items-center justify-center`}
              style={{ background: category.color || settings.colors.primary + '20' }}
            >
              {category.icon}
            </div>
            <div>
              <h4 className="font-semibold" style={{ color: settings.colors.heading }}>{category.name}</h4>
              <p className="text-sm" style={{ color: settings.colors.textMuted }}>{category.courseCount} courses</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ============ Shop/E-commerce Blocks ============

// Shopping Cart Block
export function ShoppingCartBlock({
  props,
  settings,
}: {
  props: {
    cart: CartData;
    style: 'mini' | 'full' | 'sidebar';
    showCheckoutButton?: boolean;
  };
  settings: CustomThemeSettings;
}) {
  const { cart, style, showCheckoutButton = true } = props;
  const currency = cart.currency || '$';

  if (style === 'mini') {
    return (
      <div
        className="relative inline-flex items-center gap-2 p-3 cursor-pointer"
        style={{
          background: settings.colors.surface,
          borderRadius: settings.borders.radius,
          border: `${settings.borders.width}px solid ${settings.colors.border}`,
        }}
      >
        <FiShoppingCart size={24} style={{ color: settings.colors.heading }} />
        {cart.items.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full text-white" style={{ background: settings.colors.primary }}>
            {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
        <span className="font-semibold" style={{ color: settings.colors.heading }}>{currency}{cart.total.toFixed(2)}</span>
      </div>
    );
  }

  return (
    <div
      className="p-6"
      style={{
        background: settings.colors.surface,
        borderRadius: settings.borders.radius,
        border: `${settings.borders.width}px solid ${settings.colors.border}`,
      }}
    >
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: settings.colors.heading }}>
        <FiShoppingCart size={20} /> Your Cart ({cart.items.length} items)
      </h3>

      {cart.items.length === 0 ? (
        <p className="text-center py-8" style={{ color: settings.colors.textMuted }}>Your cart is empty</p>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {cart.items.map(item => (
              <div key={item.id} className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: settings.colors.border }}>
                <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <h4 className="font-medium" style={{ color: settings.colors.heading }}>{item.title}</h4>
                  {item.variant && <p className="text-xs" style={{ color: settings.colors.textMuted }}>{item.variant}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm" style={{ color: settings.colors.textMuted }}>Qty: {item.quantity}</span>
                    <span className="font-semibold" style={{ color: settings.colors.primary }}>{currency}{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <button className="text-red-500 hover:text-red-600"><FiTrash2 size={16} /></button>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm" style={{ color: settings.colors.text }}>
              <span>Subtotal</span>
              <span>{currency}{cart.subtotal.toFixed(2)}</span>
            </div>
            {cart.discount && cart.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{currency}{cart.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm" style={{ color: settings.colors.text }}>
              <span>Shipping</span>
              <span>{cart.shipping === 0 ? 'Free' : `${currency}${cart.shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: settings.colors.text }}>
              <span>Tax</span>
              <span>{currency}{cart.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t" style={{ borderColor: settings.colors.border, color: settings.colors.heading }}>
              <span>Total</span>
              <span>{currency}{cart.total.toFixed(2)}</span>
            </div>
          </div>

          {showCheckoutButton && (
            <button
              className="w-full py-3 font-semibold transition-all hover:opacity-90"
              style={{ background: settings.colors.primary, color: 'white', borderRadius: settings.borders.radius }}
            >
              Proceed to Checkout
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Product Categories Block
export function ProductCategoriesBlock({
  props,
  settings,
}: {
  props: {
    categories: ProductCategory[];
    columns: 2 | 3 | 4 | 5;
    style: 'cards' | 'overlay' | 'minimal';
  };
  settings: CustomThemeSettings;
}) {
  const { categories, columns, style } = props;

  return (
    <div className="p-6" style={{ background: settings.colors.background }}>
      <div className={`grid gap-4 ${
        columns === 2 ? 'grid-cols-2' :
        columns === 3 ? 'grid-cols-3' :
        columns === 4 ? 'grid-cols-4' : 'grid-cols-5'
      }`}>
        {categories.map(category => (
          <div
            key={category.id}
            className="group relative overflow-hidden cursor-pointer transition-all hover:shadow-xl"
            style={{
              borderRadius: settings.borders.radius,
              border: style === 'minimal' ? 'none' : `${settings.borders.width}px solid ${settings.colors.border}`,
            }}
          >
            {style === 'overlay' && category.image ? (
              <>
                <div className="aspect-square overflow-hidden">
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <h4 className="font-bold text-white text-lg">{category.name}</h4>
                  <p className="text-white/80 text-sm">{category.productCount} products</p>
                </div>
              </>
            ) : (
              <div className="p-4 flex flex-col items-center text-center" style={{ background: settings.colors.surface }}>
                {category.image && (
                  <img src={category.image} alt={category.name} className="w-20 h-20 rounded-full object-cover mb-3" />
                )}
                <h4 className="font-semibold" style={{ color: settings.colors.heading }}>{category.name}</h4>
                <p className="text-sm" style={{ color: settings.colors.textMuted }}>{category.productCount} products</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Product Filter Block
export function ProductFilterBlock({
  props,
  settings,
}: {
  props: {
    showPriceRange?: boolean;
    showCategories?: boolean;
    showRating?: boolean;
    showSort?: boolean;
    categories?: string[];
    priceMin?: number;
    priceMax?: number;
  };
  settings: CustomThemeSettings;
}) {
  const {
    showPriceRange = true,
    showCategories = true,
    showRating = true,
    showSort = true,
    categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports'],
    priceMin = 0,
    priceMax = 500,
  } = props;

  const [priceRange, setPriceRange] = useState([priceMin, priceMax]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState(0);

  return (
    <div
      className="p-6 space-y-6"
      style={{
        background: settings.colors.surface,
        borderRadius: settings.borders.radius,
        border: `${settings.borders.width}px solid ${settings.colors.border}`,
      }}
    >
      {showSort && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: settings.colors.heading }}>Sort By</h4>
          <select
            className="w-full p-2 rounded-lg"
            style={{ background: settings.colors.background, color: settings.colors.text, border: `1px solid ${settings.colors.border}` }}
          >
            <option>Most Popular</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
            <option>Best Rated</option>
          </select>
        </div>
      )}

      {showPriceRange && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: settings.colors.heading }}>Price Range</h4>
          <div className="flex items-center gap-4 mb-2">
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
              className="w-24 p-2 rounded-lg text-center"
              style={{ background: settings.colors.background, color: settings.colors.text, border: `1px solid ${settings.colors.border}` }}
            />
            <span style={{ color: settings.colors.textMuted }}>to</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
              className="w-24 p-2 rounded-lg text-center"
              style={{ background: settings.colors.background, color: settings.colors.text, border: `1px solid ${settings.colors.border}` }}
            />
          </div>
          <input
            type="range"
            min={priceMin}
            max={priceMax}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full"
          />
        </div>
      )}

      {showCategories && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: settings.colors.heading }}>Categories</h4>
          <div className="space-y-2">
            {categories.map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, cat]);
                    } else {
                      setSelectedCategories(selectedCategories.filter(c => c !== cat));
                    }
                  }}
                  className="rounded"
                  style={{ accentColor: settings.colors.primary }}
                />
                <span style={{ color: settings.colors.text }}>{cat}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {showRating && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: settings.colors.heading }}>Rating</h4>
          <div className="space-y-2">
            {[4, 3, 2, 1].map(rating => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={selectedRating === rating}
                  onChange={() => setSelectedRating(rating)}
                  style={{ accentColor: settings.colors.primary }}
                />
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <FiStar key={star} size={14} className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-sm" style={{ color: settings.colors.textMuted }}>& up</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        className="w-full py-2 font-medium transition-all hover:opacity-90"
        style={{ background: settings.colors.primary, color: 'white', borderRadius: settings.borders.radius }}
      >
        Apply Filters
      </button>
    </div>
  );
}


// Checkout Summary Block
export function CheckoutSummaryBlock({
  props,
  settings,
}: {
  props: {
    cart: CartData;
    showItems?: boolean;
    showCoupon?: boolean;
  };
  settings: CustomThemeSettings;
}) {
  const { cart, showItems = true, showCoupon = true } = props;
  const currency = cart.currency || '$';

  return (
    <div
      className="p-6"
      style={{
        background: settings.colors.surface,
        borderRadius: settings.borders.radius,
        border: `${settings.borders.width}px solid ${settings.colors.border}`,
      }}
    >
      <h3 className="text-lg font-bold mb-4" style={{ color: settings.colors.heading }}>Order Summary</h3>

      {showItems && cart.items.length > 0 && (
        <div className="space-y-3 mb-4 pb-4 border-b" style={{ borderColor: settings.colors.border }}>
          {cart.items.map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.title} className="w-12 h-12 rounded object-cover" />
                <div>
                  <p className="text-sm font-medium" style={{ color: settings.colors.heading }}>{item.title}</p>
                  <p className="text-xs" style={{ color: settings.colors.textMuted }}>Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-medium" style={{ color: settings.colors.text }}>{currency}{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {showCoupon && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Coupon code"
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{ background: settings.colors.background, color: settings.colors.text, border: `1px solid ${settings.colors.border}` }}
          />
          <button
            className="px-4 py-2 text-sm font-medium"
            style={{ background: settings.colors.primary, color: 'white', borderRadius: settings.borders.radius }}
          >
            Apply
          </button>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between" style={{ color: settings.colors.text }}>
          <span>Subtotal</span>
          <span>{currency}{cart.subtotal.toFixed(2)}</span>
        </div>
        {cart.discount && cart.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{currency}{cart.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between" style={{ color: settings.colors.text }}>
          <span>Shipping</span>
          <span>{cart.shipping === 0 ? 'Free' : `${currency}${cart.shipping.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between" style={{ color: settings.colors.text }}>
          <span>Tax</span>
          <span>{currency}{cart.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold pt-4 border-t" style={{ borderColor: settings.colors.border, color: settings.colors.heading }}>
          <span>Total</span>
          <span>{currency}{cart.total.toFixed(2)}</span>
        </div>
      </div>

      <button
        className="w-full mt-6 py-3 font-semibold text-lg transition-all hover:opacity-90"
        style={{ background: settings.colors.primary, color: 'white', borderRadius: settings.borders.radius }}
      >
        Place Order
      </button>

      <p className="text-xs text-center mt-4" style={{ color: settings.colors.textMuted }}>
        🔒 Secure checkout powered by Stripe
      </p>
    </div>
  );
}

// Sale Banner Block
export function SaleBannerBlock({
  props,
  settings,
}: {
  props: {
    title: string;
    subtitle?: string;
    discountCode?: string;
    discountText?: string;
    ctaText?: string;
    ctaUrl?: string;
    endDate?: string;
    style: 'full' | 'compact' | 'floating';
    backgroundColor?: string;
  };
  settings: CustomThemeSettings;
}) {
  const {
    title,
    subtitle,
    discountCode,
    discountText,
    ctaText = 'Shop Now',
    endDate,
    style,
    backgroundColor,
  } = props;

  // Calculate countdown
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const bgColor = backgroundColor || settings.colors.primary;

  if (style === 'compact') {
    return (
      <div
        className="flex items-center justify-center gap-4 py-3 px-6"
        style={{ background: bgColor }}
      >
        <span className="font-bold text-white">{title}</span>
        {discountCode && (
          <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-mono">{discountCode}</span>
        )}
        {endDate && (
          <span className="text-white/80 text-sm">
            Ends in: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="p-8 text-center"
      style={{
        background: style === 'floating' ? 'transparent' : bgColor,
      }}
    >
      <div
        className={style === 'floating' ? 'p-8 rounded-2xl shadow-2xl' : ''}
        style={style === 'floating' ? { background: bgColor } : {}}
      >
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        {subtitle && <p className="text-white/90 text-lg mb-4">{subtitle}</p>}

        {discountText && (
          <div className="inline-block px-6 py-2 bg-white/20 rounded-full mb-4">
            <span className="text-white font-bold text-xl">{discountText}</span>
          </div>
        )}

        {discountCode && (
          <div className="mb-4">
            <span className="text-white/80 text-sm">Use code:</span>
            <span className="ml-2 px-4 py-2 bg-white text-gray-900 font-mono font-bold rounded-lg">{discountCode}</span>
          </div>
        )}

        {endDate && (
          <div className="flex justify-center gap-4 mb-6">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Mins' },
              { value: timeLeft.seconds, label: 'Secs' },
            ].map((item, i) => (
              <div key={i} className="bg-white/20 rounded-lg p-3 min-w-[60px]">
                <div className="text-2xl font-bold text-white">{String(item.value).padStart(2, '0')}</div>
                <div className="text-xs text-white/80">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        <button
          className="px-8 py-3 bg-white font-bold rounded-full transition-transform hover:scale-105"
          style={{ color: bgColor }}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}