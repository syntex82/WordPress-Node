import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lmsAdminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Upload } from 'lucide-react';

export default function CertificateTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState({
    name: '',
    isDefault: false,
    logoUrl: '',
    primaryColor: '#6366f1',
    secondaryColor: '#a5b4fc',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    accentColor: '#6366f1',
    titleFont: 'Helvetica-Bold',
    bodyFont: 'Helvetica',
    titleFontSize: 42,
    nameFontSize: 36,
    courseFontSize: 28,
    bodyFontSize: 14,
    titleText: 'Certificate of Completion',
    subtitleText: 'This is to certify that',
    completionText: 'has successfully completed the course',
    brandingText: 'NodePress LMS',
    showBorder: true,
    showLogo: false,
    showBranding: true,
    borderWidth: 3,
    borderStyle: 'double',
  });

  useEffect(() => {
    if (!isNew && id) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      const { data } = await lmsAdminApi.getCertificateTemplate(id!);
      setTemplate(data);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
      navigate('/lms/certificate-templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await lmsAdminApi.createCertificateTemplate(template);
        toast.success('Template created successfully');
      } else {
        await lmsAdminApi.updateCertificateTemplate(id!, template);
        toast.success('Template updated successfully');
      }
      navigate('/lms/certificate-templates');
    } catch (error: any) {
      console.error('Failed to save template:', error);
      const message = error.response?.data?.message || 'Failed to save template';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/lms/certificate-templates')}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            {isNew ? 'New Certificate Template' : 'Edit Certificate Template'}
          </h1>
          <p className="text-slate-400 mt-1">Customize certificate design and branding</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Template Name *</label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="e.g., Modern Blue Template"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={template.isDefault}
                onChange={(e) => setTemplate({ ...template, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isDefault" className="text-sm text-slate-300">
                Set as default template
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Logo URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={template.logoUrl || ''}
                  onChange={(e) => setTemplate({ ...template, logoUrl: e.target.value })}
                  className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="/uploads/logo.png"
                />
                <button className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-colors">
                  <Upload className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Upload logo to Media Library and paste URL here</p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Colors</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'primaryColor', label: 'Primary Color' },
              { key: 'secondaryColor', label: 'Secondary Color' },
              { key: 'backgroundColor', label: 'Background' },
              { key: 'textColor', label: 'Text Color' },
              { key: 'accentColor', label: 'Accent Color' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={template[key as keyof typeof template] as string}
                    onChange={(e) => setTemplate({ ...template, [key]: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-slate-600 bg-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={template[key as keyof typeof template] as string}
                    onChange={(e) => setTemplate({ ...template, [key]: e.target.value })}
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Typography</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title Font</label>
                <select
                  value={template.titleFont}
                  onChange={(e) => setTemplate({ ...template, titleFont: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Helvetica-Bold">Helvetica Bold</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times-Bold">Times Bold</option>
                  <option value="Times-Roman">Times Roman</option>
                  <option value="Courier-Bold">Courier Bold</option>
                  <option value="Courier">Courier</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Body Font</label>
                <select
                  value={template.bodyFont}
                  onChange={(e) => setTemplate({ ...template, bodyFont: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Helvetica">Helvetica</option>
                  <option value="Helvetica-Bold">Helvetica Bold</option>
                  <option value="Times-Roman">Times Roman</option>
                  <option value="Times-Bold">Times Bold</option>
                  <option value="Courier">Courier</option>
                  <option value="Courier-Bold">Courier Bold</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'titleFontSize', label: 'Title Size', min: 20, max: 72 },
                { key: 'nameFontSize', label: 'Name Size', min: 16, max: 60 },
                { key: 'courseFontSize', label: 'Course Size', min: 14, max: 48 },
                { key: 'bodyFontSize', label: 'Body Size', min: 10, max: 24 },
              ].map(({ key, label, min, max }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={template[key as keyof typeof template] as number}
                    onChange={(e) => setTemplate({ ...template, [key]: parseInt(e.target.value) })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Text Content</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title Text</label>
              <input
                type="text"
                value={template.titleText}
                onChange={(e) => setTemplate({ ...template, titleText: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subtitle Text</label>
              <input
                type="text"
                value={template.subtitleText}
                onChange={(e) => setTemplate({ ...template, subtitleText: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Completion Text</label>
              <input
                type="text"
                value={template.completionText}
                onChange={(e) => setTemplate({ ...template, completionText: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Branding Text</label>
              <input
                type="text"
                value={template.brandingText}
                onChange={(e) => setTemplate({ ...template, brandingText: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Display Options</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showBorder"
                checked={template.showBorder}
                onChange={(e) => setTemplate({ ...template, showBorder: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showBorder" className="text-sm text-slate-300">
                Show Border
              </label>
            </div>

            {template.showBorder && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Border Width</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={template.borderWidth}
                    onChange={(e) => setTemplate({ ...template, borderWidth: parseInt(e.target.value) })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Border Style</label>
                  <select
                    value={template.borderStyle}
                    onChange={(e) => setTemplate({ ...template, borderStyle: e.target.value })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showLogo"
                checked={template.showLogo}
                onChange={(e) => setTemplate({ ...template, showLogo: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showLogo" className="text-sm text-slate-300">
                Show Logo
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showBranding"
                checked={template.showBranding}
                onChange={(e) => setTemplate({ ...template, showBranding: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showBranding" className="text-sm text-slate-300">
                Show Branding Text
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

