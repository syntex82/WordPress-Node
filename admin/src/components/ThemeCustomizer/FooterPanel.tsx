/**
 * Footer Panel Component
 * Allows customization of footer styles and content
 */

import { CustomThemeSettings } from '../../services/api';

interface FooterPanelProps {
  settings: CustomThemeSettings;
  onChange: (path: string, value: any) => void;
}

export default function FooterPanel({ settings, onChange }: FooterPanelProps) {
  const { layout } = settings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Footer Style</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['default', 'centered', 'minimal'] as const).map(style => (
            <button
              key={style}
              onClick={() => onChange('layout.footerStyle', style)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                layout.footerStyle === style
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-sm text-white capitalize">{style}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Copyright Text</h3>
        <textarea
          rows={2}
          defaultValue="© 2024 Your Company. All rights reserved."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500"
          placeholder="Enter copyright text..."
        />
        <p className="text-xs text-gray-500 mt-1">Use {'{year}'} for dynamic year</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Footer Menu</h3>
        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
          <option value="footer">Footer Menu</option>
          <option value="secondary">Secondary Menu</option>
          <option value="none">No Menu</option>
        </select>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Social Links</h3>
        <div className="space-y-3">
          {['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'YouTube'].map(social => (
            <div key={social} className="flex items-center gap-2">
              <span className="text-sm text-gray-300 w-20">{social}</span>
              <input
                type="text"
                placeholder={`https://${social.toLowerCase()}.com/...`}
                className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Widget Areas</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Number of Columns</label>
            <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
              <option value="2">2 Columns</option>
              <option value="3">3 Columns</option>
              <option value="4">4 Columns</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Show widget area</span>
            <input type="checkbox" className="w-5 h-5 rounded bg-gray-700 border-gray-600" defaultChecked />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Footer Colors</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Background</span>
            <input
              type="color"
              defaultValue="#1F2937"
              className="w-8 h-8 rounded cursor-pointer border border-gray-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Text Color</span>
            <input
              type="color"
              defaultValue="#9CA3AF"
              className="w-8 h-8 rounded cursor-pointer border border-gray-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Link Color</span>
            <input
              type="color"
              defaultValue="#60A5FA"
              className="w-8 h-8 rounded cursor-pointer border border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-700 rounded-lg">
        <h4 className="text-xs text-gray-400 uppercase mb-2">Preview</h4>
        <div className={`bg-gray-900 rounded p-4 ${layout.footerStyle === 'centered' ? 'text-center' : ''}`}>
          {layout.footerStyle !== 'minimal' && (
            <div className="grid grid-cols-3 gap-4 mb-4 text-xs text-gray-400">
              <div>
                <div className="font-medium text-gray-300 mb-1">Company</div>
                <div>About</div>
                <div>Contact</div>
              </div>
              <div>
                <div className="font-medium text-gray-300 mb-1">Support</div>
                <div>FAQ</div>
                <div>Help</div>
              </div>
              <div>
                <div className="font-medium text-gray-300 mb-1">Legal</div>
                <div>Privacy</div>
                <div>Terms</div>
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
            © 2024 Your Company. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

