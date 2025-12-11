/**
 * Visual Theme Designer Page
 * Allows non-technical users to create custom themes visually
 * Enhanced with WYSIWYG editor for media content
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { themesApi, ThemeDesignConfig } from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiDroplet, FiType, FiLayout, FiMaximize2, FiBox, FiSave, FiEdit3, FiEye } from 'react-icons/fi';
import ThemeWysiwygEditor, { MediaBlock } from '../components/ThemeWysiwygEditor';

// Starter templates
const STARTER_TEMPLATES: { id: string; name: string; description: string; config: Partial<ThemeDesignConfig> }[] = [
  {
    id: 'minimal',
    name: 'Minimal Blog',
    description: 'Clean, minimalist design with focus on content',
    config: {
      colors: { primary: '#2563eb', secondary: '#1d4ed8', background: '#ffffff', surface: '#f8fafc', text: '#334155', textMuted: '#64748b', heading: '#0f172a', link: '#2563eb', linkHover: '#1d4ed8', border: '#e2e8f0', accent: '#3b82f6' },
      typography: { headingFont: 'Inter', bodyFont: 'Inter', baseFontSize: 16, lineHeight: 1.6, headingWeight: 600 },
      layout: { sidebarPosition: 'none', contentWidth: 720, headerStyle: 'centered' },
      spacing: { sectionPadding: 32, elementSpacing: 16, containerPadding: 24 },
      borders: { radius: 8, width: 1 },
    },
  },
  {
    id: 'magazine',
    name: 'Magazine Style',
    description: 'Bold typography and sidebar for rich content sites',
    config: {
      colors: { primary: '#dc2626', secondary: '#b91c1c', background: '#fafafa', surface: '#ffffff', text: '#1f2937', textMuted: '#6b7280', heading: '#111827', link: '#dc2626', linkHover: '#b91c1c', border: '#e5e7eb', accent: '#ef4444' },
      typography: { headingFont: 'Georgia', bodyFont: 'system-ui', baseFontSize: 17, lineHeight: 1.7, headingWeight: 700 },
      layout: { sidebarPosition: 'right', contentWidth: 1200, headerStyle: 'default' },
      spacing: { sectionPadding: 40, elementSpacing: 20, containerPadding: 32 },
      borders: { radius: 4, width: 1 },
    },
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Modern portfolio with dark accents',
    config: {
      colors: { primary: '#8b5cf6', secondary: '#7c3aed', background: '#0f0f0f', surface: '#1a1a1a', text: '#e5e5e5', textMuted: '#a3a3a3', heading: '#ffffff', link: '#8b5cf6', linkHover: '#a78bfa', border: '#2a2a2a', accent: '#a78bfa' },
      typography: { headingFont: 'Poppins', bodyFont: 'system-ui', baseFontSize: 16, lineHeight: 1.6, headingWeight: 600 },
      layout: { sidebarPosition: 'none', contentWidth: 1000, headerStyle: 'minimal' },
      spacing: { sectionPadding: 48, elementSpacing: 24, containerPadding: 24 },
      borders: { radius: 12, width: 1 },
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional look with sidebar navigation',
    config: {
      colors: { primary: '#0284c7', secondary: '#0369a1', background: '#f1f5f9', surface: '#ffffff', text: '#475569', textMuted: '#94a3b8', heading: '#1e293b', link: '#0284c7', linkHover: '#0369a1', border: '#cbd5e1', accent: '#0ea5e9' },
      typography: { headingFont: 'system-ui', bodyFont: 'system-ui', baseFontSize: 15, lineHeight: 1.65, headingWeight: 600 },
      layout: { sidebarPosition: 'left', contentWidth: 1140, headerStyle: 'default' },
      spacing: { sectionPadding: 36, elementSpacing: 18, containerPadding: 28 },
      borders: { radius: 6, width: 1 },
    },
  },
  {
    id: 'blank',
    name: 'Start from Scratch',
    description: 'Begin with default settings and customize everything',
    config: {
      colors: { primary: '#3b82f6', secondary: '#2563eb', background: '#ffffff', surface: '#f9fafb', text: '#374151', textMuted: '#6b7280', heading: '#111827', link: '#3b82f6', linkHover: '#2563eb', border: '#e5e7eb', accent: '#60a5fa' },
      typography: { headingFont: 'system-ui', bodyFont: 'system-ui', baseFontSize: 16, lineHeight: 1.6, headingWeight: 600 },
      layout: { sidebarPosition: 'right', contentWidth: 1100, headerStyle: 'default' },
      spacing: { sectionPadding: 32, elementSpacing: 16, containerPadding: 24 },
      borders: { radius: 8, width: 1 },
    },
  },
];

const FONT_OPTIONS = [
  'system-ui', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat',
  'Georgia', 'Merriweather', 'Playfair Display', 'Lora', 'Source Serif Pro',
];

type Step = 'template' | 'design' | 'content' | 'metadata' | 'preview';
type DesignTab = 'colors' | 'typography' | 'layout' | 'spacing' | 'borders';
type ContentMode = 'preview' | 'wysiwyg';

export default function ThemeDesigner() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('template');
  const [designTab, setDesignTab] = useState<DesignTab>('colors');
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [contentMode, setContentMode] = useState<ContentMode>('preview');
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlock[]>([]);

  // Theme configuration state
  const [config, setConfig] = useState<ThemeDesignConfig>({
    name: '', author: '', version: '1.0.0', description: '', baseTemplate: 'blank',
    colors: { primary: '#3b82f6', secondary: '#2563eb', background: '#ffffff', surface: '#f9fafb', text: '#374151', textMuted: '#6b7280', heading: '#111827', link: '#3b82f6', linkHover: '#2563eb', border: '#e5e7eb', accent: '#60a5fa' },
    typography: { headingFont: 'system-ui', bodyFont: 'system-ui', baseFontSize: 16, lineHeight: 1.6, headingWeight: 600 },
    layout: { sidebarPosition: 'right', contentWidth: 1100, headerStyle: 'default' },
    spacing: { sectionPadding: 32, elementSpacing: 16, containerPadding: 24 },
    borders: { radius: 8, width: 1 },
  });

  const updateColors = (key: keyof ThemeDesignConfig['colors'], value: string) => {
    setConfig(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };
  const updateTypography = (key: keyof ThemeDesignConfig['typography'], value: string | number) => {
    setConfig(prev => ({ ...prev, typography: { ...prev.typography, [key]: value } }));
  };
  const updateLayout = (key: keyof ThemeDesignConfig['layout'], value: string | number) => {
    setConfig(prev => ({ ...prev, layout: { ...prev.layout, [key]: value } }));
  };
  const updateSpacing = (key: keyof ThemeDesignConfig['spacing'], value: number) => {
    setConfig(prev => ({ ...prev, spacing: { ...prev.spacing, [key]: value } }));
  };
  const updateBorders = (key: keyof ThemeDesignConfig['borders'], value: number) => {
    setConfig(prev => ({ ...prev, borders: { ...prev.borders, [key]: value } }));
  };

  const selectTemplate = (templateId: string) => {
    const template = STARTER_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setConfig(prev => ({ ...prev, ...template.config, baseTemplate: templateId }));
    }
  };

  const handleGenerate = async () => {
    if (!config.name.trim()) { toast.error('Please enter a theme name'); return; }
    if (!config.author.trim()) { toast.error('Please enter an author name'); return; }
    setGenerating(true);
    try {
      // Include media blocks in the config
      const configWithMedia = { ...config, mediaBlocks };
      await themesApi.generate(configWithMedia);
      toast.success(`Theme "${config.name}" created successfully!`);
      navigate('/settings');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate theme');
    } finally { setGenerating(false); }
  };

  // Continue with more component code in next insert...
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/settings')} className="p-2 hover:bg-gray-100 rounded-lg"><FiArrowLeft size={20} /></button>
            <div><h1 className="text-xl font-bold text-gray-900">Theme Designer</h1><p className="text-sm text-gray-500">Create a custom theme visually</p></div>
          </div>
          <div className="flex items-center gap-2">
            {['template', 'design', 'content', 'metadata', 'preview'].map((s, i) => (
              <button key={s} onClick={() => setStep(s as Step)} className={`px-4 py-2 rounded-lg font-medium ${step === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Content placeholder - will be expanded */}
      <div className="p-8">{renderStepContent()}</div>
    </div>
  );

  function renderStepContent() {
    switch (step) {
      case 'template': return renderTemplateStep();
      case 'design': return renderDesignStep();
      case 'content': return renderContentStep();
      case 'metadata': return renderMetadataStep();
      case 'preview': return renderPreviewStep();
      default: return null;
    }
  }

  function renderTemplateStep() {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Starter Template</h2>
        <p className="text-gray-600 mb-6">Select a template as your starting point. You can customize everything in the next step.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STARTER_TEMPLATES.map(template => (
            <button key={template.id} onClick={() => { selectTemplate(template.id); setStep('design'); }}
              className={`p-6 bg-white rounded-xl border-2 text-left transition-all hover:shadow-lg ${selectedTemplate === template.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="w-full h-24 rounded-lg mb-4" style={{ background: `linear-gradient(135deg, ${template.config.colors?.primary} 0%, ${template.config.colors?.secondary} 100%)` }} />
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderDesignStep() {
    const tabs: { id: DesignTab; label: string; icon: any }[] = [
      { id: 'colors', label: 'Colors', icon: FiDroplet },
      { id: 'typography', label: 'Typography', icon: FiType },
      { id: 'layout', label: 'Layout', icon: FiLayout },
      { id: 'spacing', label: 'Spacing', icon: FiMaximize2 },
      { id: 'borders', label: 'Borders', icon: FiBox },
    ];

    return (
      <div className="flex gap-8 max-w-7xl mx-auto">
        {/* Controls Panel */}
        <div className="w-96 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="flex border-b">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setDesignTab(tab.id)}
                  className={`flex-1 py-3 px-2 text-sm font-medium flex flex-col items-center gap-1 ${designTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  <tab.icon size={18} />{tab.label}
                </button>
              ))}
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">{renderDesignControls()}</div>
          </div>
          <button onClick={() => setStep('content')} className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Continue to Content →</button>
        </div>
        {/* Live Preview */}
        <div className="flex-1 min-w-0"><ThemePreview config={config} /></div>
      </div>
    );
  }

  function renderContentStep() {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Media Content</h2>
            <p className="text-gray-600">Use the WYSIWYG editor to add images, videos, and audio to your theme.</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setContentMode('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${contentMode === 'preview' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <FiEye size={16} /> Preview
            </button>
            <button
              onClick={() => setContentMode('wysiwyg')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${contentMode === 'wysiwyg' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <FiEdit3 size={16} /> WYSIWYG Editor
            </button>
          </div>
        </div>

        {contentMode === 'wysiwyg' ? (
          <ThemeWysiwygEditor
            config={config}
            onMediaChange={(blocks) => setMediaBlocks(blocks)}
          />
        ) : (
          <ThemePreview config={config} />
        )}

        <div className="flex gap-4 mt-6">
          <button onClick={() => setStep('design')} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">← Back to Design</button>
          <button onClick={() => setStep('metadata')} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Continue to Metadata →</button>
        </div>
      </div>
    );
  }

  function renderDesignControls() {
    switch (designTab) {
      case 'colors': return (
        <div className="space-y-4">
          {Object.entries(config.colors).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={value} onChange={e => updateColors(key as keyof ThemeDesignConfig['colors'], e.target.value)} className="w-10 h-8 rounded border cursor-pointer" />
                <input type="text" value={value} onChange={e => updateColors(key as keyof ThemeDesignConfig['colors'], e.target.value)} className="w-20 px-2 py-1 text-xs border rounded font-mono" />
              </div>
            </div>
          ))}
        </div>
      );
      case 'typography': return (
        <div className="space-y-4">
          <div><label className="block text-sm text-gray-700 mb-1">Heading Font</label><select value={config.typography.headingFont} onChange={e => updateTypography('headingFont', e.target.value)} className="w-full p-2 border rounded-lg">{FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
          <div><label className="block text-sm text-gray-700 mb-1">Body Font</label><select value={config.typography.bodyFont} onChange={e => updateTypography('bodyFont', e.target.value)} className="w-full p-2 border rounded-lg">{FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
          <div><label className="block text-sm text-gray-700 mb-1">Base Font Size: {config.typography.baseFontSize}px</label><input type="range" min="12" max="22" value={config.typography.baseFontSize} onChange={e => updateTypography('baseFontSize', Number(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-gray-700 mb-1">Line Height: {config.typography.lineHeight}</label><input type="range" min="1.2" max="2" step="0.1" value={config.typography.lineHeight} onChange={e => updateTypography('lineHeight', Number(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-gray-700 mb-1">Heading Weight: {config.typography.headingWeight}</label><input type="range" min="400" max="900" step="100" value={config.typography.headingWeight} onChange={e => updateTypography('headingWeight', Number(e.target.value))} className="w-full" /></div>
        </div>
      );
      case 'layout': return (
        <div className="space-y-4">
          <div><label className="block text-sm text-gray-700 mb-2">Sidebar Position</label><div className="grid grid-cols-3 gap-2">{(['left', 'none', 'right'] as const).map(pos => (<button key={pos} onClick={() => updateLayout('sidebarPosition', pos)} className={`py-2 px-3 rounded-lg border text-sm font-medium ${config.layout.sidebarPosition === pos ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>{pos === 'none' ? 'No Sidebar' : pos.charAt(0).toUpperCase() + pos.slice(1)}</button>))}</div></div>
          <div><label className="block text-sm text-gray-700 mb-1">Content Width: {config.layout.contentWidth}px</label><input type="range" min="600" max="1400" step="20" value={config.layout.contentWidth} onChange={e => updateLayout('contentWidth', Number(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-gray-700 mb-2">Header Style</label><div className="grid grid-cols-3 gap-2">{(['default', 'centered', 'minimal'] as const).map(style => (<button key={style} onClick={() => updateLayout('headerStyle', style)} className={`py-2 px-3 rounded-lg border text-sm font-medium ${config.layout.headerStyle === style ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>{style.charAt(0).toUpperCase() + style.slice(1)}</button>))}</div></div>
        </div>
      );
      case 'spacing': return (
        <div className="space-y-4">
          <div><label className="block text-sm text-gray-700 mb-1">Section Padding: {config.spacing.sectionPadding}px</label><input type="range" min="16" max="64" step="4" value={config.spacing.sectionPadding} onChange={e => updateSpacing('sectionPadding', Number(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-gray-700 mb-1">Element Spacing: {config.spacing.elementSpacing}px</label><input type="range" min="8" max="40" step="2" value={config.spacing.elementSpacing} onChange={e => updateSpacing('elementSpacing', Number(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-gray-700 mb-1">Container Padding: {config.spacing.containerPadding}px</label><input type="range" min="12" max="48" step="4" value={config.spacing.containerPadding} onChange={e => updateSpacing('containerPadding', Number(e.target.value))} className="w-full" /></div>
        </div>
      );
      case 'borders': return (
        <div className="space-y-4">
          <div><label className="block text-sm text-gray-700 mb-1">Border Radius: {config.borders.radius}px</label><input type="range" min="0" max="24" value={config.borders.radius} onChange={e => updateBorders('radius', Number(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-gray-700 mb-1">Border Width: {config.borders.width}px</label><input type="range" min="0" max="4" value={config.borders.width} onChange={e => updateBorders('width', Number(e.target.value))} className="w-full" /></div>
        </div>
      );
      default: return null;
    }
  }

  function renderMetadataStep() {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Theme Information</h2>
        <p className="text-gray-600 mb-6">Enter details about your theme.</p>
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Theme Name *</label><input type="text" value={config.name} onChange={e => setConfig(p => ({ ...p, name: e.target.value }))} placeholder="My Awesome Theme" className="w-full p-3 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Author *</label><input type="text" value={config.author} onChange={e => setConfig(p => ({ ...p, author: e.target.value }))} placeholder="Your Name" className="w-full p-3 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Version</label><input type="text" value={config.version} onChange={e => setConfig(p => ({ ...p, version: e.target.value }))} placeholder="1.0.0" className="w-full p-3 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={config.description} onChange={e => setConfig(p => ({ ...p, description: e.target.value }))} placeholder="A brief description of your theme..." rows={3} className="w-full p-3 border rounded-lg" /></div>
        </div>
        <div className="flex gap-4 mt-6">
          <button onClick={() => setStep('content')} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">← Back to Content</button>
          <button onClick={() => setStep('preview')} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Preview Theme →</button>
        </div>
      </div>
    );
  }

  function renderPreviewStep() {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-2xl font-bold text-gray-900">Preview Your Theme</h2><p className="text-gray-600">This is how your theme will look when installed.</p></div>
          <div className="flex gap-4">
            <button onClick={() => setStep('metadata')} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">← Edit Details</button>
            <button onClick={handleGenerate} disabled={generating || !config.name || !config.author} className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              {generating ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>Generating...</> : <><FiSave /> Generate & Install Theme</>}
            </button>
          </div>
        </div>
        <ThemePreview config={config} fullSize />
      </div>
    );
  }
}

// Live Preview Component
function ThemePreview({ config, fullSize = false }: { config: ThemeDesignConfig; fullSize?: boolean }) {
  const { colors, typography, layout, spacing, borders } = config;
  const hasSidebar = layout.sidebarPosition !== 'none';
  const headerClass = layout.headerStyle === 'centered' ? 'text-center' : '';

  const containerStyle: React.CSSProperties = {
    fontFamily: `${typography.bodyFont}, system-ui, sans-serif`,
    fontSize: typography.baseFontSize,
    lineHeight: typography.lineHeight,
    color: colors.text,
    background: colors.background,
    borderRadius: fullSize ? 0 : 12,
    overflow: 'hidden',
    border: fullSize ? 'none' : `1px solid ${colors.border}`,
    maxHeight: fullSize ? 'none' : '70vh',
    overflowY: 'auto',
  };

  return (
    <div style={containerStyle} className={fullSize ? '' : 'shadow-lg'}>
      {/* Header */}
      <header style={{ background: colors.surface, borderBottom: `${borders.width}px solid ${colors.border}`, padding: `${spacing.sectionPadding * (layout.headerStyle === 'minimal' ? 0.5 : 1)}px ${spacing.containerPadding}px` }} className={headerClass}>
        <h1 style={{ fontFamily: `${typography.headingFont}, system-ui`, fontWeight: typography.headingWeight, color: colors.heading, fontSize: '1.5rem', margin: 0 }}>{config.name || 'My Theme'}</h1>
        <nav style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: layout.headerStyle === 'centered' ? 'center' : 'flex-start' }}>
          {['Home', 'About', 'Blog', 'Contact'].map(item => (<a key={item} href="#" style={{ color: colors.text, fontWeight: 500, textDecoration: 'none' }}>{item}</a>))}
        </nav>
      </header>
      {/* Main */}
      <main style={{ padding: `${spacing.sectionPadding}px ${spacing.containerPadding}px`, maxWidth: layout.contentWidth, margin: '0 auto' }}>
        <div style={{ display: hasSidebar ? 'grid' : 'block', gridTemplateColumns: hasSidebar ? (layout.sidebarPosition === 'left' ? '200px 1fr' : '1fr 200px') : undefined, gap: spacing.sectionPadding * 1.5 }}>
          <div style={{ order: layout.sidebarPosition === 'left' ? 1 : 0 }}>
            <article style={{ background: colors.surface, border: `${borders.width}px solid ${colors.border}`, borderRadius: borders.radius, padding: spacing.sectionPadding, marginBottom: spacing.elementSpacing }}>
              <h2 style={{ fontFamily: `${typography.headingFont}, system-ui`, fontWeight: typography.headingWeight, color: colors.heading, fontSize: '1.5rem', marginBottom: spacing.elementSpacing / 2 }}>Welcome to Your New Theme</h2>
              <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: spacing.elementSpacing }}>By {config.author || 'Author'} • December 11, 2025</p>
              <p style={{ marginBottom: spacing.elementSpacing }}>This is a preview of how your blog posts will appear with the current theme settings. The colors, typography, and layout you've chosen are reflected here.</p>
              <a href="#" style={{ display: 'inline-block', background: colors.primary, color: 'white', padding: '8px 16px', borderRadius: borders.radius, fontWeight: 500, textDecoration: 'none' }}>Read More</a>
            </article>
          </div>
          {hasSidebar && (
            <aside style={{ order: layout.sidebarPosition === 'left' ? 0 : 1 }}>
              <div style={{ background: colors.surface, border: `${borders.width}px solid ${colors.border}`, borderRadius: borders.radius, padding: spacing.sectionPadding, marginBottom: spacing.elementSpacing }}>
                <h3 style={{ fontFamily: `${typography.headingFont}, system-ui`, fontWeight: typography.headingWeight, color: colors.heading, fontSize: '1rem', marginBottom: spacing.elementSpacing * 0.75, paddingBottom: spacing.elementSpacing * 0.5, borderBottom: `${borders.width}px solid ${colors.border}` }}>About</h3>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Your site description here.</p>
              </div>
              <div style={{ background: colors.surface, border: `${borders.width}px solid ${colors.border}`, borderRadius: borders.radius, padding: spacing.sectionPadding }}>
                <h3 style={{ fontFamily: `${typography.headingFont}, system-ui`, fontWeight: typography.headingWeight, color: colors.heading, fontSize: '1rem', marginBottom: spacing.elementSpacing * 0.75, paddingBottom: spacing.elementSpacing * 0.5, borderBottom: `${borders.width}px solid ${colors.border}` }}>Categories</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>{['Technology', 'Design', 'Business'].map(c => (<li key={c} style={{ marginBottom: 8 }}><a href="#" style={{ color: colors.link, textDecoration: 'none' }}>{c}</a></li>))}</ul>
              </div>
            </aside>
          )}
        </div>
      </main>
      {/* Footer */}
      <footer style={{ background: colors.surface, borderTop: `${borders.width}px solid ${colors.border}`, padding: `${spacing.sectionPadding}px ${spacing.containerPadding}px`, textAlign: 'center', color: colors.textMuted, fontSize: '0.875rem' }}>© 2025 {config.name || 'My Theme'}. All rights reserved.</footer>
    </div>
  );
}

