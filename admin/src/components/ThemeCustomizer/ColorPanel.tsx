/**
 * Color Panel Component
 * Allows customization of theme colors
 */

import { CustomThemeSettings } from '../../services/api';

interface ColorPanelProps {
  settings: CustomThemeSettings;
  onChange: (path: string, value: any) => void;
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-gray-300">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-600"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200"
        />
      </div>
    </div>
  );
}

export default function ColorPanel({ settings, onChange }: ColorPanelProps) {
  const colors = settings.colors;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Brand Colors</h3>
        <div className="space-y-1">
          <ColorInput
            label="Primary"
            value={colors.primary}
            onChange={(v) => onChange('colors.primary', v)}
          />
          <ColorInput
            label="Secondary"
            value={colors.secondary}
            onChange={(v) => onChange('colors.secondary', v)}
          />
          <ColorInput
            label="Accent"
            value={colors.accent}
            onChange={(v) => onChange('colors.accent', v)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Background</h3>
        <div className="space-y-1">
          <ColorInput
            label="Background"
            value={colors.background}
            onChange={(v) => onChange('colors.background', v)}
          />
          <ColorInput
            label="Surface"
            value={colors.surface}
            onChange={(v) => onChange('colors.surface', v)}
          />
          <ColorInput
            label="Border"
            value={colors.border}
            onChange={(v) => onChange('colors.border', v)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Text</h3>
        <div className="space-y-1">
          <ColorInput
            label="Heading"
            value={colors.heading}
            onChange={(v) => onChange('colors.heading', v)}
          />
          <ColorInput
            label="Body Text"
            value={colors.text}
            onChange={(v) => onChange('colors.text', v)}
          />
          <ColorInput
            label="Muted Text"
            value={colors.textMuted}
            onChange={(v) => onChange('colors.textMuted', v)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Links</h3>
        <div className="space-y-1">
          <ColorInput
            label="Link Color"
            value={colors.link}
            onChange={(v) => onChange('colors.link', v)}
          />
          <ColorInput
            label="Link Hover"
            value={colors.linkHover}
            onChange={(v) => onChange('colors.linkHover', v)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Status Colors</h3>
        <div className="space-y-1">
          <ColorInput
            label="Success"
            value={colors.success || '#10B981'}
            onChange={(v) => onChange('colors.success', v)}
          />
          <ColorInput
            label="Warning"
            value={colors.warning || '#F59E0B'}
            onChange={(v) => onChange('colors.warning', v)}
          />
          <ColorInput
            label="Error"
            value={colors.error || '#EF4444'}
            onChange={(v) => onChange('colors.error', v)}
          />
        </div>
      </div>
    </div>
  );
}

