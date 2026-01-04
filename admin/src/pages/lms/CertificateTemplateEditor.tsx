import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lmsAdminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiArrowLeft, FiUpload } from 'react-icons/fi';
import MediaPickerModal from '../../components/MediaPickerModal';

export default function CertificateTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
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
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => navigate('/lms/certificate-templates')}
            className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {isNew ? 'New Certificate Template' : 'Edit Certificate Template'}
            </h1>
            {!isNew && template.name && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-1">{template.name}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-500 hover:to-blue-400 flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSave size={18} />
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
                <button
                  type="button"
                  onClick={() => setShowLogoPicker(true)}
                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                  <FiUpload size={18} />
                </button>
              </div>
              {template.logoUrl && (
                <div className="mt-2">
                  <img
                    src={template.logoUrl}
                    alt="Logo preview"
                    className="h-12 object-contain rounded border border-slate-600/50"
                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                  />
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1">Click the upload button to select from Media Library</p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Colors</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-6">
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

      {/* Media Picker Modal */}
      {showLogoPicker && (
        <MediaPickerModal
          type="image"
          onClose={() => setShowLogoPicker(false)}
          onSelect={(media) => {
            setTemplate({ ...template, logoUrl: media.path || media.url });
            setShowLogoPicker(false);
          }}
        />
      )}
    </div>
  );
}

