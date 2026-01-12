/**
 * Block Style System
 * Comprehensive styling types and components for Theme Designer blocks
 * Provides full editability for typography, colors, spacing, and layout
 */

import React, { useState } from 'react';
import {
  FiType, FiDroplet, FiBox, FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiAlignJustify, FiChevronDown, FiChevronUp, FiRotateCcw, FiMaximize2
} from 'react-icons/fi';

// ============ Typography Types ============
export interface TypographyStyle {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

// ============ Color Types ============
export interface ColorStyle {
  backgroundColor?: string;
  textColor?: string;
  headingColor?: string;
  accentColor?: string;
  borderColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  gradientEnabled?: boolean;
  gradientStart?: string;
  gradientEnd?: string;
  gradientDirection?: string;
}

// ============ Spacing Types ============
export interface SpacingValue {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface SpacingStyle {
  margin?: SpacingValue;
  padding?: SpacingValue;
  gap?: string;
}

// ============ Border Types ============
export interface BorderStyle {
  width?: string;
  style?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  color?: string;
  radius?: string;
  radiusTopLeft?: string;
  radiusTopRight?: string;
  radiusBottomLeft?: string;
  radiusBottomRight?: string;
}

// ============ Shadow Types ============
export interface ShadowStyle {
  enabled?: boolean;
  x?: string;
  y?: string;
  blur?: string;
  spread?: string;
  color?: string;
  inset?: boolean;
}

// ============ Layout Types ============
export interface LayoutStyle {
  display?: 'block' | 'flex' | 'grid' | 'inline-block' | 'inline-flex';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gridColumns?: number;
  gridGap?: string;
  width?: string;
  maxWidth?: string;
  minWidth?: string;
  height?: string;
  maxHeight?: string;
  minHeight?: string;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  zIndex?: number;
}

// ============ Responsive Types ============
export interface ResponsiveValue<T> {
  desktop?: T;
  tablet?: T;
  mobile?: T;
}

// ============ Comprehensive Block Style ============
export interface BlockStyle {
  // Typography
  typography?: TypographyStyle;
  headingTypography?: TypographyStyle;
  
  // Colors
  colors?: ColorStyle;
  
  // Spacing
  spacing?: SpacingStyle;
  
  // Border
  border?: BorderStyle;
  
  // Shadow
  shadow?: ShadowStyle;
  
  // Layout
  layout?: LayoutStyle;
  
  // Responsive overrides
  responsive?: ResponsiveValue<Partial<BlockStyle>>;
  
  // Custom CSS class
  customClass?: string;
  
  // Custom inline styles
  customCSS?: string;
}

// ============ Font Options ============
export const FONT_FAMILIES = [
  { value: 'inherit', label: 'Theme Default' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Raleway, sans-serif', label: 'Raleway' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Merriweather, serif', label: 'Merriweather' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Source Code Pro, monospace', label: 'Source Code Pro' },
  { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono' },
];

export const FONT_SIZES = [
  { value: 'inherit', label: 'Default' },
  { value: '10px', label: '10px - Tiny' },
  { value: '12px', label: '12px - Small' },
  { value: '14px', label: '14px - Body Small' },
  { value: '16px', label: '16px - Body' },
  { value: '18px', label: '18px - Body Large' },
  { value: '20px', label: '20px - Heading 6' },
  { value: '24px', label: '24px - Heading 5' },
  { value: '30px', label: '30px - Heading 4' },
  { value: '36px', label: '36px - Heading 3' },
  { value: '48px', label: '48px - Heading 2' },
  { value: '60px', label: '60px - Heading 1' },
  { value: '72px', label: '72px - Display' },
];

export const FONT_WEIGHTS = [
  { value: 'inherit', label: 'Default' },
  { value: '100', label: 'Thin (100)' },
  { value: '200', label: 'Extra Light (200)' },
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Normal (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi Bold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra Bold (800)' },
  { value: '900', label: 'Black (900)' },
];

export const LINE_HEIGHTS = [
  { value: 'inherit', label: 'Default' },
  { value: '1', label: '1 - Tight' },
  { value: '1.25', label: '1.25' },
  { value: '1.5', label: '1.5 - Normal' },
  { value: '1.75', label: '1.75' },
  { value: '2', label: '2 - Loose' },
  { value: '2.5', label: '2.5 - Extra Loose' },
];

export const LETTER_SPACINGS = [
  { value: 'inherit', label: 'Default' },
  { value: '-0.05em', label: '-0.05em - Tighter' },
  { value: '-0.025em', label: '-0.025em - Tight' },
  { value: '0', label: '0 - Normal' },
  { value: '0.025em', label: '0.025em - Wide' },
  { value: '0.05em', label: '0.05em - Wider' },
  { value: '0.1em', label: '0.1em - Widest' },
];

export const SPACING_VALUES = [
  { value: '0', label: '0' },
  { value: '4px', label: '4px' },
  { value: '8px', label: '8px' },
  { value: '12px', label: '12px' },
  { value: '16px', label: '16px' },
  { value: '20px', label: '20px' },
  { value: '24px', label: '24px' },
  { value: '32px', label: '32px' },
  { value: '40px', label: '40px' },
  { value: '48px', label: '48px' },
  { value: '64px', label: '64px' },
  { value: '80px', label: '80px' },
  { value: '96px', label: '96px' },
  { value: 'auto', label: 'Auto' },
];

export const BORDER_RADIUS_VALUES = [
  { value: '0', label: '0 - None' },
  { value: '2px', label: '2px' },
  { value: '4px', label: '4px - Slight' },
  { value: '6px', label: '6px' },
  { value: '8px', label: '8px - Rounded' },
  { value: '12px', label: '12px' },
  { value: '16px', label: '16px - More Rounded' },
  { value: '24px', label: '24px - Very Rounded' },
  { value: '9999px', label: 'Full - Pill' },
];

export const GRADIENT_DIRECTIONS = [
  { value: 'to right', label: 'Left to Right →' },
  { value: 'to left', label: 'Right to Left ←' },
  { value: 'to bottom', label: 'Top to Bottom ↓' },
  { value: 'to top', label: 'Bottom to Top ↑' },
  { value: 'to bottom right', label: 'Top Left to Bottom Right ↘' },
  { value: 'to bottom left', label: 'Top Right to Bottom Left ↙' },
  { value: 'to top right', label: 'Bottom Left to Top Right ↗' },
  { value: 'to top left', label: 'Bottom Right to Top Left ↖' },
  { value: '45deg', label: '45° Diagonal' },
  { value: '135deg', label: '135° Diagonal' },
];

// ============ Default Block Style ============
export const DEFAULT_BLOCK_STYLE: BlockStyle = {
  typography: {
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontStyle: 'normal',
    lineHeight: 'inherit',
    letterSpacing: 'inherit',
    textTransform: 'none',
    textDecoration: 'none',
    textAlign: 'left',
  },
  colors: {
    backgroundColor: 'transparent',
    textColor: 'inherit',
    headingColor: 'inherit',
    accentColor: 'inherit',
    borderColor: 'transparent',
    overlayColor: '#000000',
    overlayOpacity: 0,
    gradientEnabled: false,
    gradientStart: '#3b82f6',
    gradientEnd: '#8b5cf6',
    gradientDirection: 'to right',
  },
  spacing: {
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
    gap: '16px',
  },
  border: {
    width: '0',
    style: 'none',
    color: 'transparent',
    radius: '0',
  },
  shadow: {
    enabled: false,
    x: '0',
    y: '4px',
    blur: '6px',
    spread: '0',
    color: 'rgba(0,0,0,0.1)',
    inset: false,
  },
  layout: {
    display: 'block',
    width: '100%',
    maxWidth: 'none',
    overflow: 'visible',
  },
};

// ============ Typography Editor Component ============
export function TypographyEditor({
  value,
  onChange,
  label = 'Typography',
  showAllOptions = true,
}: {
  value: TypographyStyle;
  onChange: (value: TypographyStyle) => void;
  label?: string;
  showAllOptions?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateValue = (key: keyof TypographyStyle, val: any) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700"
      >
        <span className="flex items-center gap-2">
          <FiType size={14} /> {label}
        </span>
        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="space-y-3 pl-2">
          {/* Font Family */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Font Family</label>
            <select
              value={value.fontFamily || 'inherit'}
              onChange={(e) => updateValue('fontFamily', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Font Size</label>
            <select
              value={value.fontSize || 'inherit'}
              onChange={(e) => updateValue('fontSize', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              {FONT_SIZES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Font Weight */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Font Weight</label>
            <select
              value={value.fontWeight || 'inherit'}
              onChange={(e) => updateValue('fontWeight', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              {FONT_WEIGHTS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {showAllOptions && (
            <>
              {/* Line Height */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Line Height</label>
                <select
                  value={value.lineHeight || 'inherit'}
                  onChange={(e) => updateValue('lineHeight', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                >
                  {LINE_HEIGHTS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Letter Spacing */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Letter Spacing</label>
                <select
                  value={value.letterSpacing || 'inherit'}
                  onChange={(e) => updateValue('letterSpacing', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                >
                  {LETTER_SPACINGS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Text Transform */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Text Transform</label>
                <div className="flex gap-1">
                  {(['none', 'uppercase', 'lowercase', 'capitalize'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateValue('textTransform', t)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded ${
                        value.textTransform === t
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {t === 'none' ? 'Aa' : t === 'uppercase' ? 'AA' : t === 'lowercase' ? 'aa' : 'Aa'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Align */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Text Align</label>
                <div className="flex gap-1">
                  {[
                    { value: 'left', icon: FiAlignLeft },
                    { value: 'center', icon: FiAlignCenter },
                    { value: 'right', icon: FiAlignRight },
                    { value: 'justify', icon: FiAlignJustify },
                  ].map((align) => (
                    <button
                      key={align.value}
                      onClick={() => updateValue('textAlign', align.value as any)}
                      className={`flex-1 p-2 rounded ${
                        value.textAlign === align.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <align.icon size={16} className="mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Style & Decoration */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateValue('fontStyle', value.fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={`flex-1 px-3 py-2 text-sm rounded ${
                    value.fontStyle === 'italic'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="italic">Italic</span>
                </button>
                <button
                  onClick={() => updateValue('textDecoration', value.textDecoration === 'underline' ? 'none' : 'underline')}
                  className={`flex-1 px-3 py-2 text-sm rounded ${
                    value.textDecoration === 'underline'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="underline">Underline</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Color Editor Component ============
export function ColorEditor({
  value,
  onChange,
  label = 'Colors',
}: {
  value: ColorStyle;
  onChange: (value: ColorStyle) => void;
  label?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateValue = (key: keyof ColorStyle, val: any) => {
    onChange({ ...value, [key]: val });
  };

  const ColorInput = ({ colorKey, colorLabel }: { colorKey: keyof ColorStyle; colorLabel: string }) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{colorLabel}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={(value[colorKey] as string) || '#000000'}
          onChange={(e) => updateValue(colorKey, e.target.value)}
          className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600"
        />
        <input
          type="text"
          value={(value[colorKey] as string) || ''}
          onChange={(e) => updateValue(colorKey, e.target.value)}
          placeholder="transparent"
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700"
      >
        <span className="flex items-center gap-2">
          <FiDroplet size={14} /> {label}
        </span>
        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="space-y-3 pl-2">
          <ColorInput colorKey="backgroundColor" colorLabel="Background Color" />
          <ColorInput colorKey="textColor" colorLabel="Text Color" />
          <ColorInput colorKey="headingColor" colorLabel="Heading Color" />
          <ColorInput colorKey="accentColor" colorLabel="Accent Color" />
          <ColorInput colorKey="borderColor" colorLabel="Border Color" />

          {/* Gradient Options */}
          <div className="pt-2 border-t border-gray-700">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={value.gradientEnabled || false}
                onChange={(e) => updateValue('gradientEnabled', e.target.checked)}
                className="rounded bg-gray-700 border-gray-600"
              />
              <span className="text-sm text-white">Enable Gradient Background</span>
            </label>

            {value.gradientEnabled && (
              <div className="space-y-3">
                <ColorInput colorKey="gradientStart" colorLabel="Gradient Start" />
                <ColorInput colorKey="gradientEnd" colorLabel="Gradient End" />
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Gradient Direction</label>
                  <select
                    value={value.gradientDirection || 'to right'}
                    onChange={(e) => updateValue('gradientDirection', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                  >
                    {GRADIENT_DIRECTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                {/* Gradient Preview */}
                <div
                  className="h-8 rounded-lg"
                  style={{
                    background: `linear-gradient(${value.gradientDirection || 'to right'}, ${value.gradientStart || '#3b82f6'}, ${value.gradientEnd || '#8b5cf6'})`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Overlay Options */}
          <div className="pt-2 border-t border-gray-700">
            <ColorInput colorKey="overlayColor" colorLabel="Overlay Color" />
            <div className="mt-2">
              <label className="block text-xs text-gray-400 mb-1">
                Overlay Opacity: {((value.overlayOpacity || 0) * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={value.overlayOpacity || 0}
                onChange={(e) => updateValue('overlayOpacity', parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Spacing Editor Component ============
export function SpacingEditor({
  value,
  onChange,
  label = 'Spacing',
}: {
  value: SpacingStyle;
  onChange: (value: SpacingStyle) => void;
  label?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [linkedMargin, setLinkedMargin] = useState(false);
  const [linkedPadding, setLinkedPadding] = useState(false);

  const updateMargin = (side: keyof SpacingValue, val: string) => {
    if (linkedMargin) {
      onChange({
        ...value,
        margin: { top: val, right: val, bottom: val, left: val },
      });
    } else {
      onChange({
        ...value,
        margin: { ...value.margin, [side]: val },
      });
    }
  };

  const updatePadding = (side: keyof SpacingValue, val: string) => {
    if (linkedPadding) {
      onChange({
        ...value,
        padding: { top: val, right: val, bottom: val, left: val },
      });
    } else {
      onChange({
        ...value,
        padding: { ...value.padding, [side]: val },
      });
    }
  };

  const SpacingInputGroup = ({
    groupLabel,
    values,
    onUpdate,
    linked,
    onToggleLink,
  }: {
    groupLabel: string;
    values: SpacingValue;
    onUpdate: (side: keyof SpacingValue, val: string) => void;
    linked: boolean;
    onToggleLink: () => void;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">{groupLabel}</label>
        <button
          onClick={onToggleLink}
          className={`p-1 rounded ${linked ? 'text-blue-400' : 'text-gray-500'}`}
          title={linked ? 'Unlink values' : 'Link all values'}
        >
          🔗
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <div key={side} className="text-center">
            <label className="block text-[10px] text-gray-500 mb-1 capitalize">{side[0]}</label>
            <select
              value={values?.[side] || '0'}
              onChange={(e) => onUpdate(side, e.target.value)}
              className="w-full px-1 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white text-center"
            >
              {SPACING_VALUES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-green-400 hover:text-green-300 py-2 border-b border-gray-700"
      >
        <span className="flex items-center gap-2">
          <FiBox size={14} /> {label}
        </span>
        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="space-y-4 pl-2">
          <SpacingInputGroup
            groupLabel="Margin (Outer Spacing)"
            values={value.margin || {}}
            onUpdate={updateMargin}
            linked={linkedMargin}
            onToggleLink={() => setLinkedMargin(!linkedMargin)}
          />
          <SpacingInputGroup
            groupLabel="Padding (Inner Spacing)"
            values={value.padding || {}}
            onUpdate={updatePadding}
            linked={linkedPadding}
            onToggleLink={() => setLinkedPadding(!linkedPadding)}
          />
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gap (Element Spacing)</label>
            <select
              value={value.gap || '16px'}
              onChange={(e) => onChange({ ...value, gap: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              {SPACING_VALUES.filter(s => s.value !== 'auto').map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Border Editor Component ============
export function BorderEditor({
  value,
  onChange,
  label = 'Border',
}: {
  value: BorderStyle;
  onChange: (value: BorderStyle) => void;
  label?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateValue = (key: keyof BorderStyle, val: any) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-orange-400 hover:text-orange-300 py-2 border-b border-gray-700"
      >
        <span className="flex items-center gap-2">
          <FiMaximize2 size={14} /> {label}
        </span>
        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="space-y-3 pl-2">
          {/* Border Style */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Border Style</label>
            <select
              value={value.style || 'none'}
              onChange={(e) => updateValue('style', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
            </select>
          </div>

          {value.style && value.style !== 'none' && (
            <>
              {/* Border Width */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Border Width</label>
                <select
                  value={value.width || '1px'}
                  onChange={(e) => updateValue('width', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                >
                  <option value="1px">1px - Thin</option>
                  <option value="2px">2px - Normal</option>
                  <option value="3px">3px - Medium</option>
                  <option value="4px">4px - Thick</option>
                  <option value="6px">6px - Extra Thick</option>
                </select>
              </div>

              {/* Border Color */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Border Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={value.color || '#e5e7eb'}
                    onChange={(e) => updateValue('color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600"
                  />
                  <input
                    type="text"
                    value={value.color || ''}
                    onChange={(e) => updateValue('color', e.target.value)}
                    placeholder="#e5e7eb"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
            </>
          )}

          {/* Border Radius */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Border Radius</label>
            <select
              value={value.radius || '0'}
              onChange={(e) => updateValue('radius', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              {BORDER_RADIUS_VALUES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div
            className="h-16 bg-gray-600"
            style={{
              border: value.style && value.style !== 'none'
                ? `${value.width || '1px'} ${value.style} ${value.color || '#e5e7eb'}`
                : 'none',
              borderRadius: value.radius || '0',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============ Shadow Editor Component ============
export function ShadowEditor({
  value,
  onChange,
  label = 'Shadow',
}: {
  value: ShadowStyle;
  onChange: (value: ShadowStyle) => void;
  label?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateValue = (key: keyof ShadowStyle, val: any) => {
    onChange({ ...value, [key]: val });
  };

  const shadowPreview = value.enabled
    ? `${value.inset ? 'inset ' : ''}${value.x || '0'} ${value.y || '4px'} ${value.blur || '6px'} ${value.spread || '0'} ${value.color || 'rgba(0,0,0,0.1)'}`
    : 'none';

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-cyan-400 hover:text-cyan-300 py-2 border-b border-gray-700"
      >
        <span className="flex items-center gap-2">
          ☁️ {label}
        </span>
        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="space-y-3 pl-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.enabled || false}
              onChange={(e) => updateValue('enabled', e.target.checked)}
              className="rounded bg-gray-700 border-gray-600"
            />
            <span className="text-sm text-white">Enable Shadow</span>
          </label>

          {value.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">X Offset</label>
                  <input
                    type="text"
                    value={value.x || '0'}
                    onChange={(e) => updateValue('x', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Y Offset</label>
                  <input
                    type="text"
                    value={value.y || '4px'}
                    onChange={(e) => updateValue('y', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                    placeholder="4px"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Blur</label>
                  <input
                    type="text"
                    value={value.blur || '6px'}
                    onChange={(e) => updateValue('blur', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                    placeholder="6px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Spread</label>
                  <input
                    type="text"
                    value={value.spread || '0'}
                    onChange={(e) => updateValue('spread', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Shadow Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={value.color?.startsWith('rgba') ? '#000000' : (value.color || '#000000')}
                    onChange={(e) => updateValue('color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600"
                  />
                  <input
                    type="text"
                    value={value.color || ''}
                    onChange={(e) => updateValue('color', e.target.value)}
                    placeholder="rgba(0,0,0,0.1)"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.inset || false}
                  onChange={(e) => updateValue('inset', e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600"
                />
                <span className="text-sm text-white">Inset Shadow</span>
              </label>

              {/* Preview */}
              <div
                className="h-16 bg-gray-600 rounded-lg"
                style={{ boxShadow: shadowPreview }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Layout Editor Component ============
export function LayoutEditor({
  value,
  onChange,
  label = 'Layout',
}: {
  value: LayoutStyle;
  onChange: (value: LayoutStyle) => void;
  label?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateValue = (key: keyof LayoutStyle, val: any) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-pink-400 hover:text-pink-300 py-2 border-b border-gray-700"
      >
        <span className="flex items-center gap-2">
          📐 {label}
        </span>
        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="space-y-3 pl-2">
          {/* Width */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Width</label>
            <input
              type="text"
              value={value.width || '100%'}
              onChange={(e) => updateValue('width', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              placeholder="100%"
            />
          </div>

          {/* Max Width */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Max Width</label>
            <select
              value={value.maxWidth || 'none'}
              onChange={(e) => updateValue('maxWidth', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="none">None</option>
              <option value="640px">640px - Small</option>
              <option value="768px">768px - Medium</option>
              <option value="1024px">1024px - Large</option>
              <option value="1280px">1280px - Extra Large</option>
              <option value="1536px">1536px - 2XL</option>
              <option value="100%">100% - Full</option>
            </select>
          </div>

          {/* Height */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Height</label>
            <input
              type="text"
              value={value.height || 'auto'}
              onChange={(e) => updateValue('height', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              placeholder="auto"
            />
          </div>

          {/* Min Height */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min Height</label>
            <input
              type="text"
              value={value.minHeight || '0'}
              onChange={(e) => updateValue('minHeight', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              placeholder="0"
            />
          </div>

          {/* Overflow */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Overflow</label>
            <select
              value={value.overflow || 'visible'}
              onChange={(e) => updateValue('overflow', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              <option value="scroll">Scroll</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Main Advanced Block Properties Panel ============
export function AdvancedBlockPropertiesPanel({
  style,
  onChange,
  onReset,
}: {
  style: BlockStyle;
  onChange: (style: BlockStyle) => void;
  onReset?: () => void;
}) {
  const updateStyle = (key: keyof BlockStyle, value: any) => {
    onChange({ ...style, [key]: value });
  };

  return (
    <div className="space-y-2">
      {/* Header with Reset Button */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-700">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          🎨 Advanced Styling
        </h4>
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="Reset to defaults"
          >
            <FiRotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Typography Section */}
      <TypographyEditor
        value={style.typography || DEFAULT_BLOCK_STYLE.typography!}
        onChange={(v) => updateStyle('typography', v)}
        label="Typography"
      />

      {/* Heading Typography (for blocks with headings) */}
      <TypographyEditor
        value={style.headingTypography || DEFAULT_BLOCK_STYLE.typography!}
        onChange={(v) => updateStyle('headingTypography', v)}
        label="Heading Typography"
        showAllOptions={false}
      />

      {/* Colors Section */}
      <ColorEditor
        value={style.colors || DEFAULT_BLOCK_STYLE.colors!}
        onChange={(v) => updateStyle('colors', v)}
      />

      {/* Spacing Section */}
      <SpacingEditor
        value={style.spacing || DEFAULT_BLOCK_STYLE.spacing!}
        onChange={(v) => updateStyle('spacing', v)}
      />

      {/* Border Section */}
      <BorderEditor
        value={style.border || DEFAULT_BLOCK_STYLE.border!}
        onChange={(v) => updateStyle('border', v)}
      />

      {/* Shadow Section */}
      <ShadowEditor
        value={style.shadow || DEFAULT_BLOCK_STYLE.shadow!}
        onChange={(v) => updateStyle('shadow', v)}
      />

      {/* Layout Section */}
      <LayoutEditor
        value={style.layout || DEFAULT_BLOCK_STYLE.layout!}
        onChange={(v) => updateStyle('layout', v)}
      />

      {/* Custom CSS Class */}
      <div className="pt-2 border-t border-gray-700">
        <label className="block text-xs text-gray-400 mb-1">Custom CSS Class</label>
        <input
          type="text"
          value={style.customClass || ''}
          onChange={(e) => updateStyle('customClass', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
          placeholder="my-custom-class"
        />
      </div>
    </div>
  );
}

// ============ Helper: Generate CSS from BlockStyle ============
export function blockStyleToCSS(style: BlockStyle): React.CSSProperties {
  const css: React.CSSProperties = {};

  // Typography
  if (style.typography) {
    if (style.typography.fontFamily && style.typography.fontFamily !== 'inherit') css.fontFamily = style.typography.fontFamily;
    if (style.typography.fontSize && style.typography.fontSize !== 'inherit') css.fontSize = style.typography.fontSize;
    if (style.typography.fontWeight && style.typography.fontWeight !== 'inherit') css.fontWeight = style.typography.fontWeight as any;
    if (style.typography.fontStyle) css.fontStyle = style.typography.fontStyle;
    if (style.typography.lineHeight && style.typography.lineHeight !== 'inherit') css.lineHeight = style.typography.lineHeight;
    if (style.typography.letterSpacing && style.typography.letterSpacing !== 'inherit') css.letterSpacing = style.typography.letterSpacing;
    if (style.typography.textTransform && style.typography.textTransform !== 'none') css.textTransform = style.typography.textTransform;
    if (style.typography.textDecoration && style.typography.textDecoration !== 'none') css.textDecoration = style.typography.textDecoration;
    if (style.typography.textAlign) css.textAlign = style.typography.textAlign;
  }

  // Colors
  if (style.colors) {
    if (style.colors.gradientEnabled && style.colors.gradientStart && style.colors.gradientEnd) {
      css.background = `linear-gradient(${style.colors.gradientDirection || 'to right'}, ${style.colors.gradientStart}, ${style.colors.gradientEnd})`;
    } else if (style.colors.backgroundColor && style.colors.backgroundColor !== 'transparent') {
      css.backgroundColor = style.colors.backgroundColor;
    }
    if (style.colors.textColor && style.colors.textColor !== 'inherit') css.color = style.colors.textColor;
  }

  // Spacing
  if (style.spacing) {
    if (style.spacing.margin) {
      css.marginTop = style.spacing.margin.top;
      css.marginRight = style.spacing.margin.right;
      css.marginBottom = style.spacing.margin.bottom;
      css.marginLeft = style.spacing.margin.left;
    }
    if (style.spacing.padding) {
      css.paddingTop = style.spacing.padding.top;
      css.paddingRight = style.spacing.padding.right;
      css.paddingBottom = style.spacing.padding.bottom;
      css.paddingLeft = style.spacing.padding.left;
    }
    if (style.spacing.gap) css.gap = style.spacing.gap;
  }

  // Border
  if (style.border) {
    if (style.border.style && style.border.style !== 'none') {
      css.borderWidth = style.border.width;
      css.borderStyle = style.border.style;
      css.borderColor = style.border.color;
    }
    if (style.border.radius) css.borderRadius = style.border.radius;
  }

  // Shadow
  if (style.shadow?.enabled) {
    css.boxShadow = `${style.shadow.inset ? 'inset ' : ''}${style.shadow.x || '0'} ${style.shadow.y || '4px'} ${style.shadow.blur || '6px'} ${style.shadow.spread || '0'} ${style.shadow.color || 'rgba(0,0,0,0.1)'}`;
  }

  // Layout
  if (style.layout) {
    if (style.layout.width) css.width = style.layout.width;
    if (style.layout.maxWidth && style.layout.maxWidth !== 'none') css.maxWidth = style.layout.maxWidth;
    if (style.layout.minWidth) css.minWidth = style.layout.minWidth;
    if (style.layout.height && style.layout.height !== 'auto') css.height = style.layout.height;
    if (style.layout.maxHeight) css.maxHeight = style.layout.maxHeight;
    if (style.layout.minHeight && style.layout.minHeight !== '0') css.minHeight = style.layout.minHeight;
    if (style.layout.overflow && style.layout.overflow !== 'visible') css.overflow = style.layout.overflow;
  }

  return css;
}