/**
 * Typography Panel Component
 * Allows customization of fonts and text styles
 */

import { CustomThemeSettings } from '../../services/api';

interface TypographyPanelProps {
  settings: CustomThemeSettings;
  onChange: (path: string, value: any) => void;
}

const fontOptions = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Montserrat',
  'Raleway',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Nunito',
  'Work Sans',
  'DM Sans',
  'Outfit',
  'Manrope',
];

export default function TypographyPanel({ settings, onChange }: TypographyPanelProps) {
  const { typography } = settings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Font Families</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Heading Font</label>
            <select
              value={typography.headingFont}
              onChange={(e) => onChange('typography.headingFont', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Body Font</label>
            <select
              value={typography.bodyFont}
              onChange={(e) => onChange('typography.bodyFont', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Base Typography</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Base Font Size: {typography.baseFontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="24"
              value={typography.baseFontSize}
              onChange={(e) => onChange('typography.baseFontSize', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Line Height: {typography.lineHeight}
            </label>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.1"
              value={typography.lineHeight}
              onChange={(e) => onChange('typography.lineHeight', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Heading Weight</label>
            <select
              value={typography.headingWeight}
              onChange={(e) => onChange('typography.headingWeight', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value={400}>Regular (400)</option>
              <option value={500}>Medium (500)</option>
              <option value={600}>Semibold (600)</option>
              <option value={700}>Bold (700)</option>
              <option value={800}>Extra Bold (800)</option>
              <option value={900}>Black (900)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Heading Sizes</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(level => {
            const key = `h${level}Size` as keyof typeof typography;
            const defaultSize = 48 - (level - 1) * 6;
            return (
              <div key={level}>
                <label className="block text-sm text-gray-300 mb-1">
                  H{level}: {typography[key] || defaultSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="72"
                  value={typography[key] || defaultSize}
                  onChange={(e) => onChange(`typography.h${level}Size`, parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-700 rounded-lg">
        <h4 className="text-xs text-gray-400 uppercase mb-2">Preview</h4>
        <div style={{ fontFamily: `${typography.headingFont}, sans-serif`, fontWeight: typography.headingWeight }}>
          <div className="text-2xl text-white mb-1">Heading Text</div>
        </div>
        <div style={{ fontFamily: `${typography.bodyFont}, sans-serif`, fontSize: typography.baseFontSize, lineHeight: typography.lineHeight }}>
          <p className="text-gray-300">
            This is sample body text showing the selected typography settings.
          </p>
        </div>
      </div>
    </div>
  );
}

