/**
 * Advanced Animation System for Theme Designer
 * Comprehensive animation controls with presets, triggers, and real-time preview
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FiPlay, FiPause, FiRotateCcw, FiZap, FiEye, FiClock, FiChevronDown,
  FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight, FiMaximize2, FiMinimize2,
  FiRefreshCw, FiStar, FiSettings, FiSliders, FiLayers
} from 'react-icons/fi';

// ============ Enhanced Animation Types ============
export type AnimationType = 
  | 'none'
  // Fade animations
  | 'fadeIn' | 'fadeOut' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight'
  // Slide animations  
  | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
  // Scale/zoom animations
  | 'zoomIn' | 'zoomOut' | 'zoomInUp' | 'zoomInDown'
  // Rotation effects
  | 'rotateIn' | 'rotateOut' | 'flipX' | 'flipY' | 'spin'
  // Bounce and elastic
  | 'bounce' | 'bounceIn' | 'bounceOut' | 'elastic' | 'rubberBand' | 'pulse'
  // Attention seekers
  | 'shake' | 'wobble' | 'swing' | 'tada' | 'jello' | 'heartBeat'
  // Special effects
  | 'blur' | 'glow' | 'typewriter' | 'parallax' | 'morphing';

export type EasingType = 
  | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'bounce' | 'elastic' | 'spring' | 'back' | 'circ'
  | 'expo-in' | 'expo-out' | 'expo-in-out';

export type TriggerType = 
  | 'onLoad' | 'onScroll' | 'onHover' | 'onClick' | 'onView' | 'manual';

export interface EnhancedAnimationSettings {
  type: AnimationType;
  duration: number;       // in ms (100-3000)
  delay: number;          // in ms (0-2000)
  easing: EasingType;
  trigger: TriggerType;
  repeat: 'once' | 'loop' | 'infinite' | number;
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode: 'none' | 'forwards' | 'backwards' | 'both';
  stagger?: number;       // For list/grid items, delay between each
  threshold?: number;     // For scroll trigger (0-1)
  reduceMotion?: boolean; // Respect prefers-reduced-motion
}

// Default animation settings
export const DEFAULT_ANIMATION: EnhancedAnimationSettings = {
  type: 'none',
  duration: 500,
  delay: 0,
  easing: 'ease-out',
  trigger: 'onLoad',
  repeat: 'once',
  direction: 'normal',
  fillMode: 'both',
  threshold: 0.2,
  reduceMotion: true,
};

// ============ Animation Presets with Categories ============
export interface AnimationPreset {
  id: AnimationType;
  name: string;
  category: 'fade' | 'slide' | 'zoom' | 'rotate' | 'bounce' | 'attention' | 'special';
  description: string;
  icon: string;
  defaultDuration: number;
  defaultEasing: EasingType;
}

export const ENHANCED_ANIMATION_PRESETS: AnimationPreset[] = [
  // None
  { id: 'none', name: 'None', category: 'fade', description: 'No animation', icon: '⚪', defaultDuration: 0, defaultEasing: 'linear' },
  
  // Fade animations
  { id: 'fadeIn', name: 'Fade In', category: 'fade', description: 'Gradually appear', icon: '🌅', defaultDuration: 500, defaultEasing: 'ease-out' },
  { id: 'fadeOut', name: 'Fade Out', category: 'fade', description: 'Gradually disappear', icon: '🌆', defaultDuration: 500, defaultEasing: 'ease-in' },
  { id: 'fadeInUp', name: 'Fade In Up', category: 'fade', description: 'Fade in from below', icon: '⬆️', defaultDuration: 600, defaultEasing: 'ease-out' },
  { id: 'fadeInDown', name: 'Fade In Down', category: 'fade', description: 'Fade in from above', icon: '⬇️', defaultDuration: 600, defaultEasing: 'ease-out' },
  { id: 'fadeInLeft', name: 'Fade In Left', category: 'fade', description: 'Fade in from left', icon: '⬅️', defaultDuration: 600, defaultEasing: 'ease-out' },
  { id: 'fadeInRight', name: 'Fade In Right', category: 'fade', description: 'Fade in from right', icon: '➡️', defaultDuration: 600, defaultEasing: 'ease-out' },
  
  // Slide animations
  { id: 'slideUp', name: 'Slide Up', category: 'slide', description: 'Slide in from bottom', icon: '📤', defaultDuration: 500, defaultEasing: 'ease-out' },
  { id: 'slideDown', name: 'Slide Down', category: 'slide', description: 'Slide in from top', icon: '📥', defaultDuration: 500, defaultEasing: 'ease-out' },
  { id: 'slideLeft', name: 'Slide Left', category: 'slide', description: 'Slide in from right', icon: '◀️', defaultDuration: 500, defaultEasing: 'ease-out' },
  { id: 'slideRight', name: 'Slide Right', category: 'slide', description: 'Slide in from left', icon: '▶️', defaultDuration: 500, defaultEasing: 'ease-out' },
  
  // Zoom/scale animations
  { id: 'zoomIn', name: 'Zoom In', category: 'zoom', description: 'Scale up from small', icon: '🔍', defaultDuration: 400, defaultEasing: 'ease-out' },
  { id: 'zoomOut', name: 'Zoom Out', category: 'zoom', description: 'Scale down from large', icon: '🔎', defaultDuration: 400, defaultEasing: 'ease-in' },
  { id: 'zoomInUp', name: 'Zoom In Up', category: 'zoom', description: 'Zoom while rising', icon: '📈', defaultDuration: 500, defaultEasing: 'ease-out' },
  { id: 'zoomInDown', name: 'Zoom In Down', category: 'zoom', description: 'Zoom while falling', icon: '📉', defaultDuration: 500, defaultEasing: 'ease-out' },
  
  // Rotation animations
  { id: 'rotateIn', name: 'Rotate In', category: 'rotate', description: 'Spin into view', icon: '🔄', defaultDuration: 600, defaultEasing: 'ease-out' },
  { id: 'rotateOut', name: 'Rotate Out', category: 'rotate', description: 'Spin out of view', icon: '🔃', defaultDuration: 600, defaultEasing: 'ease-in' },
  { id: 'flipX', name: 'Flip X', category: 'rotate', description: 'Flip horizontally', icon: '↔️', defaultDuration: 700, defaultEasing: 'ease-in-out' },
  { id: 'flipY', name: 'Flip Y', category: 'rotate', description: 'Flip vertically', icon: '↕️', defaultDuration: 700, defaultEasing: 'ease-in-out' },
  { id: 'spin', name: 'Spin', category: 'rotate', description: 'Continuous rotation', icon: '💫', defaultDuration: 1000, defaultEasing: 'linear' },
  
  // Bounce and elastic
  { id: 'bounce', name: 'Bounce', category: 'bounce', description: 'Bouncy entrance', icon: '🏀', defaultDuration: 800, defaultEasing: 'bounce' },
  { id: 'bounceIn', name: 'Bounce In', category: 'bounce', description: 'Bounce into view', icon: '🎾', defaultDuration: 750, defaultEasing: 'bounce' },
  { id: 'bounceOut', name: 'Bounce Out', category: 'bounce', description: 'Bounce out of view', icon: '🎱', defaultDuration: 750, defaultEasing: 'bounce' },
  { id: 'elastic', name: 'Elastic', category: 'bounce', description: 'Elastic snap effect', icon: '🎯', defaultDuration: 1000, defaultEasing: 'elastic' },
  { id: 'rubberBand', name: 'Rubber Band', category: 'bounce', description: 'Stretch and snap', icon: '🔗', defaultDuration: 800, defaultEasing: 'elastic' },
  { id: 'pulse', name: 'Pulse', category: 'bounce', description: 'Gentle pulsing', icon: '💓', defaultDuration: 1000, defaultEasing: 'ease-in-out' },
  
  // Attention seekers
  { id: 'shake', name: 'Shake', category: 'attention', description: 'Shake side to side', icon: '📳', defaultDuration: 500, defaultEasing: 'ease-in-out' },
  { id: 'wobble', name: 'Wobble', category: 'attention', description: 'Wobbly movement', icon: '🌀', defaultDuration: 800, defaultEasing: 'ease-in-out' },
  { id: 'swing', name: 'Swing', category: 'attention', description: 'Pendulum swing', icon: '🎐', defaultDuration: 800, defaultEasing: 'ease-in-out' },
  { id: 'tada', name: 'Tada', category: 'attention', description: 'Celebratory pop', icon: '🎉', defaultDuration: 1000, defaultEasing: 'ease-in-out' },
  { id: 'jello', name: 'Jello', category: 'attention', description: 'Jelly wiggle', icon: '🍮', defaultDuration: 900, defaultEasing: 'ease-in-out' },
  { id: 'heartBeat', name: 'Heart Beat', category: 'attention', description: 'Pulsing heartbeat', icon: '❤️', defaultDuration: 1300, defaultEasing: 'ease-in-out' },
  
  // Special effects
  { id: 'blur', name: 'Blur Reveal', category: 'special', description: 'Blur to sharp', icon: '🌫️', defaultDuration: 600, defaultEasing: 'ease-out' },
  { id: 'glow', name: 'Glow', category: 'special', description: 'Glowing effect', icon: '✨', defaultDuration: 1500, defaultEasing: 'ease-in-out' },
  { id: 'typewriter', name: 'Typewriter', category: 'special', description: 'Text typing effect', icon: '⌨️', defaultDuration: 2000, defaultEasing: 'linear' },
  { id: 'parallax', name: 'Parallax', category: 'special', description: 'Depth scroll effect', icon: '🏔️', defaultDuration: 0, defaultEasing: 'linear' },
  { id: 'morphing', name: 'Morphing', category: 'special', description: 'Shape morphing', icon: '🔮', defaultDuration: 800, defaultEasing: 'ease-in-out' },
];

// Easing presets with cubic-bezier values
export const EASING_PRESETS: { id: EasingType; name: string; value: string; description: string }[] = [
  { id: 'linear', name: 'Linear', value: 'linear', description: 'Constant speed' },
  { id: 'ease', name: 'Ease', value: 'ease', description: 'Default smooth' },
  { id: 'ease-in', name: 'Ease In', value: 'ease-in', description: 'Start slow' },
  { id: 'ease-out', name: 'Ease Out', value: 'ease-out', description: 'End slow' },
  { id: 'ease-in-out', name: 'Ease In Out', value: 'ease-in-out', description: 'Smooth both ends' },
  { id: 'bounce', name: 'Bounce', value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', description: 'Bouncy effect' },
  { id: 'elastic', name: 'Elastic', value: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', description: 'Elastic snap' },
  { id: 'spring', name: 'Spring', value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', description: 'Spring motion' },
  { id: 'back', name: 'Back', value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', description: 'Overshoot' },
  { id: 'circ', name: 'Circular', value: 'cubic-bezier(0.075, 0.82, 0.165, 1)', description: 'Circular ease' },
  { id: 'expo-in', name: 'Expo In', value: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)', description: 'Exponential start' },
  { id: 'expo-out', name: 'Expo Out', value: 'cubic-bezier(0.19, 1, 0.22, 1)', description: 'Exponential end' },
  { id: 'expo-in-out', name: 'Expo In Out', value: 'cubic-bezier(1, 0, 0, 1)', description: 'Exponential both' },
];

// Trigger presets
export const TRIGGER_PRESETS: { id: TriggerType; name: string; icon: React.ReactNode; description: string }[] = [
  { id: 'onLoad', name: 'On Load', icon: <FiZap size={14} />, description: 'When page loads' },
  { id: 'onScroll', name: 'On Scroll', icon: <FiArrowDown size={14} />, description: 'When scrolled into view' },
  { id: 'onHover', name: 'On Hover', icon: <FiEye size={14} />, description: 'When mouse hovers' },
  { id: 'onClick', name: 'On Click', icon: <FiPlay size={14} />, description: 'When clicked' },
  { id: 'onView', name: 'On View', icon: <FiMaximize2 size={14} />, description: 'When visible in viewport' },
  { id: 'manual', name: 'Manual', icon: <FiSettings size={14} />, description: 'Triggered programmatically' },
];

// ============ Animation CSS Generator ============
export function getAnimationCSS(animation: EnhancedAnimationSettings): React.CSSProperties {
  if (animation.type === 'none') return {};

  const easing = EASING_PRESETS.find(e => e.id === animation.easing)?.value || 'ease';
  const repeatValue = animation.repeat === 'infinite' ? 'infinite' :
                      animation.repeat === 'loop' ? 'infinite' :
                      typeof animation.repeat === 'number' ? animation.repeat : 1;

  return {
    animationName: `anim-${animation.type}`,
    animationDuration: `${animation.duration}ms`,
    animationDelay: `${animation.delay}ms`,
    animationTimingFunction: easing,
    animationIterationCount: repeatValue,
    animationDirection: animation.direction,
    animationFillMode: animation.fillMode,
  };
}

// Get animation class name
export function getAnimationClassName(animation: EnhancedAnimationSettings): string {
  if (animation.type === 'none') return '';
  return `animate-${animation.type}`;
}

// ============ Animation Preview Component ============
interface AnimationPreviewProps {
  animation: EnhancedAnimationSettings;
  children?: React.ReactNode;
  className?: string;
}

export function AnimationPreview({ animation, children, className = '' }: AnimationPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [key, setKey] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const playAnimation = useCallback(() => {
    setKey(prev => prev + 1);
    setIsPlaying(true);
  }, []);

  const stopAnimation = useCallback(() => {
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (isPlaying && animation.repeat === 'once') {
      const timer = setTimeout(() => {
        setIsPlaying(false);
      }, animation.duration + animation.delay + 100);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, animation]);

  const style = isPlaying ? getAnimationCSS(animation) : {};
  const animClass = isPlaying ? getAnimationClassName(animation) : '';

  return (
    <div
      key={key}
      ref={elementRef}
      className={`${className} ${animClass}`}
      style={style}
      onAnimationEnd={() => animation.repeat === 'once' && setIsPlaying(false)}
    >
      {children || (
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center">
          <FiStar className="text-white" size={24} />
        </div>
      )}
    </div>
  );
}

// ============ Animation Controls Panel ============
interface AnimationControlsProps {
  animation: EnhancedAnimationSettings;
  onChange: (animation: EnhancedAnimationSettings) => void;
  showPreview?: boolean;
  compact?: boolean;
}

export function AnimationControls({ animation, onChange, showPreview = true, compact = false }: AnimationControlsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const categories = ['all', 'fade', 'slide', 'zoom', 'rotate', 'bounce', 'attention', 'special'];

  const filteredPresets = activeCategory === 'all'
    ? ENHANCED_ANIMATION_PRESETS
    : ENHANCED_ANIMATION_PRESETS.filter(p => p.category === activeCategory);

  const handlePresetSelect = (preset: AnimationPreset) => {
    onChange({
      ...animation,
      type: preset.id,
      duration: preset.defaultDuration,
      easing: preset.defaultEasing,
    });
    // Trigger preview
    setPreviewKey(prev => prev + 1);
    setIsPreviewPlaying(true);
  };

  const playPreview = () => {
    setPreviewKey(prev => prev + 1);
    setIsPreviewPlaying(true);
    setTimeout(() => setIsPreviewPlaying(false), animation.duration + animation.delay + 100);
  };

  return (
    <div className={`space-y-4 ${compact ? 'p-2' : 'p-4'} bg-gray-800/50 rounded-xl`}>
      {/* Preview Box */}
      {showPreview && (
        <div className="relative bg-gray-900/50 rounded-lg p-6 flex items-center justify-center min-h-[120px] border border-gray-700">
          <div
            key={previewKey}
            className={`transition-all ${isPreviewPlaying ? getAnimationClassName(animation) : ''}`}
            style={isPreviewPlaying ? getAnimationCSS(animation) : {}}
            onAnimationEnd={() => setIsPreviewPlaying(false)}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-2xl flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
          </div>

          {/* Preview Controls */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            <button
              onClick={playPreview}
              className="p-1.5 bg-blue-500 hover:bg-blue-600 rounded text-white text-xs flex items-center gap-1"
              title="Play Animation"
            >
              <FiPlay size={12} /> Play
            </button>
            <button
              onClick={() => setPreviewKey(prev => prev + 1)}
              className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded text-white"
              title="Reset"
            >
              <FiRotateCcw size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1 text-xs rounded-full capitalize transition-all ${
              activeCategory === cat
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Animation Type Grid */}
      <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto pr-1">
        {filteredPresets.map(preset => (
          <button
            key={preset.id}
            onClick={() => handlePresetSelect(preset)}
            className={`p-2 rounded-lg text-left transition-all ${
              animation.type === preset.id
                ? 'bg-blue-500/30 border-blue-500 border'
                : 'bg-gray-700/50 border-transparent border hover:bg-gray-600/50'
            }`}
            title={preset.description}
          >
            <div className="text-lg mb-0.5">{preset.icon}</div>
            <div className="text-xs text-white truncate">{preset.name}</div>
          </button>
        ))}
      </div>

      {animation.type !== 'none' && (
        <>
          {/* Duration Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-400 flex items-center gap-1">
                <FiClock size={12} /> Duration
              </label>
              <span className="text-xs text-blue-400">{animation.duration}ms</span>
            </div>
            <input
              type="range"
              min={100}
              max={3000}
              step={50}
              value={animation.duration}
              onChange={e => onChange({ ...animation, duration: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Delay Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-400 flex items-center gap-1">
                <FiPause size={12} /> Delay
              </label>
              <span className="text-xs text-purple-400">{animation.delay}ms</span>
            </div>
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={animation.delay}
              onChange={e => onChange({ ...animation, delay: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Easing Selector */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Easing</label>
            <select
              value={animation.easing}
              onChange={e => onChange({ ...animation, easing: e.target.value as EasingType })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white"
            >
              {EASING_PRESETS.map(easing => (
                <option key={easing.id} value={easing.id}>{easing.name} - {easing.description}</option>
              ))}
            </select>
          </div>

          {/* Trigger Selector */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Trigger</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TRIGGER_PRESETS.map(trigger => (
                <button
                  key={trigger.id}
                  onClick={() => onChange({ ...animation, trigger: trigger.id })}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    animation.trigger === trigger.id
                      ? 'bg-green-500/30 border-green-500 border'
                      : 'bg-gray-700/50 border-transparent border hover:bg-gray-600/50'
                  }`}
                  title={trigger.description}
                >
                  {trigger.icon}
                  <span className="text-[10px] text-gray-300">{trigger.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings Accordion */}
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-white py-1">
              <FiSliders size={12} />
              <span>Advanced Settings</span>
              <FiChevronDown size={12} className="ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 space-y-3 pl-4 border-l border-gray-700">
              {/* Repeat */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Repeat</label>
                <select
                  value={typeof animation.repeat === 'number' ? 'custom' : animation.repeat}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      onChange({ ...animation, repeat: 2 });
                    } else {
                      onChange({ ...animation, repeat: val as 'once' | 'loop' | 'infinite' });
                    }
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="once">Once</option>
                  <option value="loop">Loop</option>
                  <option value="infinite">Infinite</option>
                  <option value="custom">Custom Count</option>
                </select>
                {typeof animation.repeat === 'number' && (
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={animation.repeat}
                    onChange={e => onChange({ ...animation, repeat: parseInt(e.target.value) || 1 })}
                    className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                  />
                )}
              </div>

              {/* Direction */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Direction</label>
                <select
                  value={animation.direction}
                  onChange={e => onChange({ ...animation, direction: e.target.value as EnhancedAnimationSettings['direction'] })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="normal">Normal</option>
                  <option value="reverse">Reverse</option>
                  <option value="alternate">Alternate</option>
                  <option value="alternate-reverse">Alternate Reverse</option>
                </select>
              </div>

              {/* Scroll Threshold (for onScroll/onView triggers) */}
              {(animation.trigger === 'onScroll' || animation.trigger === 'onView') && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-gray-400">View Threshold</label>
                    <span className="text-xs text-green-400">{Math.round((animation.threshold || 0.2) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={animation.threshold || 0.2}
                    onChange={e => onChange({ ...animation, threshold: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                </div>
              )}

              {/* Stagger (for lists) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-gray-400">Stagger Delay</label>
                  <span className="text-xs text-yellow-400">{animation.stagger || 0}ms</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={25}
                  value={animation.stagger || 0}
                  onChange={e => onChange({ ...animation, stagger: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">For list/grid items</p>
              </div>

              {/* Reduce Motion */}
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={animation.reduceMotion !== false}
                  onChange={e => onChange({ ...animation, reduceMotion: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                />
                Respect reduced motion preference
              </label>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

// ============ Animation Timeline Component ============
interface AnimationTimelineProps {
  blocks: Array<{ id: string; name: string; animation?: EnhancedAnimationSettings }>;
  onSelectBlock: (id: string) => void;
  selectedBlockId?: string;
}

export function AnimationTimeline({ blocks, onSelectBlock, selectedBlockId }: AnimationTimelineProps) {
  const animatedBlocks = blocks.filter(b => b.animation && b.animation.type !== 'none');
  const maxTime = Math.max(
    ...animatedBlocks.map(b => (b.animation?.duration || 0) + (b.animation?.delay || 0)),
    3000
  );

  if (animatedBlocks.length === 0) {
    return (
      <div className="p-4 bg-gray-800/50 rounded-xl text-center text-gray-400 text-sm">
        <FiLayers className="mx-auto mb-2" size={24} />
        <p>No animated blocks</p>
        <p className="text-xs mt-1">Add animations to blocks to see the timeline</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/50 rounded-xl space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <FiClock size={14} /> Animation Timeline
        </h4>
        <span className="text-xs text-gray-400">{maxTime}ms total</span>
      </div>

      {/* Time ruler */}
      <div className="relative h-4 bg-gray-900/50 rounded">
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] text-gray-500">
          <span>0s</span>
          <span>0.5s</span>
          <span>1s</span>
          <span>1.5s</span>
          <span>2s</span>
          <span>2.5s</span>
          <span>3s</span>
        </div>
      </div>

      {/* Animation bars */}
      <div className="space-y-2">
        {animatedBlocks.map(block => {
          const anim = block.animation!;
          const startPercent = (anim.delay / maxTime) * 100;
          const widthPercent = (anim.duration / maxTime) * 100;

          return (
            <div
              key={block.id}
              onClick={() => onSelectBlock(block.id)}
              className={`relative h-8 bg-gray-900/50 rounded cursor-pointer transition-all hover:bg-gray-700/50 ${
                selectedBlockId === block.id ? 'ring-1 ring-blue-500' : ''
              }`}
            >
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-300 truncate max-w-[80px] z-10">
                {block.name}
              </div>
              <div
                className="absolute h-6 top-1 rounded bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"
                style={{
                  left: `${Math.max(startPercent, 0)}%`,
                  width: `${Math.min(widthPercent, 100 - startPercent)}%`,
                }}
              >
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-white/80">
                  {anim.type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Scroll Trigger Hook ============
export function useScrollTrigger(
  ref: React.RefObject<HTMLElement>,
  options: { threshold?: number; once?: boolean } = {}
) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const { threshold = 0.2, once = true } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        if (visible && (!once || !hasTriggered)) {
          setIsVisible(true);
          setHasTriggered(true);
        } else if (!once) {
          setIsVisible(visible);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, once, hasTriggered]);

  return { isVisible, hasTriggered };
}

// ============ Animated Block Wrapper ============
interface AnimatedBlockProps {
  animation?: EnhancedAnimationSettings;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  isDesignMode?: boolean;
}

export function AnimatedBlock({
  animation,
  children,
  className = '',
  style = {},
  onClick,
  isDesignMode = false
}: AnimatedBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const { isVisible } = useScrollTrigger(ref, {
    threshold: animation?.threshold || 0.2,
    once: animation?.repeat === 'once'
  });

  // Handle different triggers
  useEffect(() => {
    if (!animation || animation.type === 'none') return;

    if (animation.trigger === 'onLoad') {
      const timer = setTimeout(() => setIsAnimating(true), animation.delay);
      return () => clearTimeout(timer);
    }

    if ((animation.trigger === 'onScroll' || animation.trigger === 'onView') && isVisible && !hasAnimated) {
      setIsAnimating(true);
      if (animation.repeat === 'once') setHasAnimated(true);
    }
  }, [animation, isVisible, hasAnimated]);

  const handleHover = () => {
    if (animation?.trigger === 'onHover' && !isDesignMode) {
      setIsAnimating(true);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (animation?.trigger === 'onClick' && !isDesignMode) {
      setIsAnimating(true);
    }
    onClick?.();
  };

  const animStyle = isAnimating ? getAnimationCSS(animation || DEFAULT_ANIMATION) : {};
  const animClass = isAnimating ? getAnimationClassName(animation || DEFAULT_ANIMATION) : '';

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion && animation?.reduceMotion !== false) {
    return (
      <div ref={ref} className={className} style={style} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`${className} ${animClass}`}
      style={{ ...style, ...animStyle }}
      onMouseEnter={handleHover}
      onMouseLeave={() => animation?.trigger === 'onHover' && setIsAnimating(false)}
      onClick={handleClick}
      onAnimationEnd={() => {
        if (animation?.repeat === 'once') {
          setIsAnimating(false);
        }
      }}
    >
      {children}
    </div>
  );
}

// ============ Staggered Animation Container ============
interface StaggeredContainerProps {
  animation?: EnhancedAnimationSettings;
  children: React.ReactNode[];
  className?: string;
}

export function StaggeredContainer({ animation, children, className = '' }: StaggeredContainerProps) {
  const staggerDelay = animation?.stagger || 100;

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <AnimatedBlock
          animation={animation ? {
            ...animation,
            delay: (animation.delay || 0) + (index * staggerDelay)
          } : undefined}
        >
          {child}
        </AnimatedBlock>
      ))}
    </div>
  );
}

