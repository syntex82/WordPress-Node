/**
 * Layout Panel Component
 * Allows customization of layout, spacing, and structure
 */

import { CustomThemeSettings } from '../../services/api';

interface LayoutPanelProps {
  settings: CustomThemeSettings;
  onChange: (path: string, value: any) => void;
}

export default function LayoutPanel({ settings, onChange }: LayoutPanelProps) {
  const { layout, spacing, borders } = settings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Content Width</h3>
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Max Width: {layout.contentWidth}px
          </label>
          <input
            type="range"
            min="800"
            max="1600"
            step="50"
            value={layout.contentWidth}
            onChange={(e) => onChange('layout.contentWidth', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Narrow (800px)</span>
            <span>Wide (1600px)</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Sidebar Position</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['left', 'none', 'right'] as const).map(position => (
            <button
              key={position}
              onClick={() => onChange('layout.sidebarPosition', position)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                layout.sidebarPosition === position
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-sm text-white capitalize">
                  {position === 'none' ? 'No Sidebar' : `${position} Sidebar`}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Spacing</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Section Padding: {spacing.sectionPadding}px
            </label>
            <input
              type="range"
              min="16"
              max="96"
              step="8"
              value={spacing.sectionPadding}
              onChange={(e) => onChange('spacing.sectionPadding', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Element Spacing: {spacing.elementSpacing}px
            </label>
            <input
              type="range"
              min="8"
              max="48"
              step="4"
              value={spacing.elementSpacing}
              onChange={(e) => onChange('spacing.elementSpacing', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Container Padding: {spacing.containerPadding}px
            </label>
            <input
              type="range"
              min="8"
              max="48"
              step="4"
              value={spacing.containerPadding}
              onChange={(e) => onChange('spacing.containerPadding', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Borders</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Border Radius: {borders.radius}px
            </label>
            <input
              type="range"
              min="0"
              max="24"
              value={borders.radius}
              onChange={(e) => onChange('borders.radius', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Border Width: {borders.width}px
            </label>
            <input
              type="range"
              min="0"
              max="4"
              value={borders.width}
              onChange={(e) => onChange('borders.width', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-700 rounded-lg">
        <h4 className="text-xs text-gray-400 uppercase mb-2">Layout Preview</h4>
        <div className="bg-gray-800 rounded p-2">
          <div className="bg-gray-600 rounded h-4 mb-2"></div>
          <div className="flex gap-2">
            {layout.sidebarPosition === 'left' && (
              <div className="w-1/4 bg-gray-600 rounded h-20"></div>
            )}
            <div className="flex-1 bg-gray-500 rounded h-20"></div>
            {layout.sidebarPosition === 'right' && (
              <div className="w-1/4 bg-gray-600 rounded h-20"></div>
            )}
          </div>
          <div className="bg-gray-600 rounded h-4 mt-2"></div>
        </div>
      </div>
    </div>
  );
}

