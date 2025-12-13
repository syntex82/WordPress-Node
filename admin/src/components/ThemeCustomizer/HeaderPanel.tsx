/**
 * Header Panel Component
 * Allows customization of header/navigation styles
 */

import { CustomThemeSettings } from '../../services/api';

interface HeaderPanelProps {
  settings: CustomThemeSettings;
  onChange: (path: string, value: any) => void;
}

export default function HeaderPanel({ settings, onChange }: HeaderPanelProps) {
  const { layout } = settings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Header Style</h3>
        <div className="grid grid-cols-2 gap-2">
          {(['default', 'centered', 'minimal', 'sticky'] as const).map(style => (
            <button
              key={style}
              onClick={() => onChange('layout.headerStyle', style)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                layout.headerStyle === style
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-sm text-white capitalize">{style}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {style === 'default' && 'Logo left, nav right'}
                  {style === 'centered' && 'Centered layout'}
                  {style === 'minimal' && 'Clean & simple'}
                  {style === 'sticky' && 'Fixed on scroll'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Logo & Site Title</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Logo URL</label>
            <input
              type="text"
              placeholder="https://example.com/logo.png"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to use site title</p>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Site Title Display</label>
            <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
              <option value="show">Show site title</option>
              <option value="hide">Hide site title (logo only)</option>
              <option value="both">Show both logo and title</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Navigation</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Navigation Menu</label>
            <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
              <option value="header">Header Menu</option>
              <option value="primary">Primary Menu</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Manage menus in <a href="/admin/menus" className="text-blue-400 hover:underline">Menu Manager</a>
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Show search icon</span>
            <input type="checkbox" className="w-5 h-5 rounded bg-gray-700 border-gray-600" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Show user account</span>
            <input type="checkbox" className="w-5 h-5 rounded bg-gray-700 border-gray-600" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Show cart icon (Shop)</span>
            <input type="checkbox" className="w-5 h-5 rounded bg-gray-700 border-gray-600" defaultChecked />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Header Colors</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Background</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                defaultValue="#FFFFFF"
                className="w-8 h-8 rounded cursor-pointer border border-gray-600"
              />
              <select className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white">
                <option value="solid">Solid</option>
                <option value="transparent">Transparent</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Text Color</span>
            <input
              type="color"
              defaultValue="#1F2937"
              className="w-8 h-8 rounded cursor-pointer border border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-700 rounded-lg">
        <h4 className="text-xs text-gray-400 uppercase mb-2">Preview</h4>
        <div className={`bg-white rounded p-3 ${layout.headerStyle === 'centered' ? 'text-center' : 'flex justify-between items-center'}`}>
          <div className="font-bold text-gray-900">Site Logo</div>
          {layout.headerStyle !== 'centered' && (
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Home</span>
              <span>About</span>
              <span>Contact</span>
            </div>
          )}
          {layout.headerStyle === 'centered' && (
            <div className="flex justify-center gap-4 text-sm text-gray-600 mt-2">
              <span>Home</span>
              <span>About</span>
              <span>Contact</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

