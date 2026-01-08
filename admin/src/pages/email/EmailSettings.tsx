/**
 * Email Settings Page
 * User-friendly configuration for email branding and settings
 */

import { useEffect, useState } from 'react';
import { FiSave, FiImage, FiMail, FiHelpCircle, FiCheck, FiUpload, FiGlobe, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { settingsApi, mediaApi } from '../../services/api';

interface EmailSettings {
  siteName: string;
  logoUrl: string;
  supportEmail: string;
  companyAddress: string;
  helpUrl: string;
  docsUrl: string;
  primaryColor: string;
  footerText: string;
}

const DEFAULT_SETTINGS: EmailSettings = {
  siteName: 'NodePress',
  logoUrl: '',
  supportEmail: 'support@nodepress.co.uk',
  companyAddress: '',
  helpUrl: '',
  docsUrl: '',
  primaryColor: '#10b981',
  footerText: '© {year} {siteName}. All rights reserved.',
};

export default function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [media, setMedia] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadMedia();
  }, []);

  const loadSettings = async () => {
    try {
      const keys = [
        'email_site_name', 'email_logo_url', 'email_support_email',
        'email_company_address', 'email_help_url', 'email_docs_url',
        'email_primary_color', 'email_footer_text'
      ];
      const response = await settingsApi.getSettings(keys);
      const data = response.data || {};
      
      setSettings({
        siteName: data.email_site_name || DEFAULT_SETTINGS.siteName,
        logoUrl: data.email_logo_url || DEFAULT_SETTINGS.logoUrl,
        supportEmail: data.email_support_email || DEFAULT_SETTINGS.supportEmail,
        companyAddress: data.email_company_address || DEFAULT_SETTINGS.companyAddress,
        helpUrl: data.email_help_url || DEFAULT_SETTINGS.helpUrl,
        docsUrl: data.email_docs_url || DEFAULT_SETTINGS.docsUrl,
        primaryColor: data.email_primary_color || DEFAULT_SETTINGS.primaryColor,
        footerText: data.email_footer_text || DEFAULT_SETTINGS.footerText,
      });
    } catch (error) {
      console.error('Failed to load email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async () => {
    try {
      const response = await mediaApi.getAll({ type: 'image', limit: 50 });
      setMedia(response.data.data || []);
    } catch (error) {
      console.error('Failed to load media:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: 'email_site_name', value: settings.siteName, type: 'string', group: 'email' },
        { key: 'email_logo_url', value: settings.logoUrl, type: 'string', group: 'email' },
        { key: 'email_support_email', value: settings.supportEmail, type: 'string', group: 'email' },
        { key: 'email_company_address', value: settings.companyAddress, type: 'string', group: 'email' },
        { key: 'email_help_url', value: settings.helpUrl, type: 'string', group: 'email' },
        { key: 'email_docs_url', value: settings.docsUrl, type: 'string', group: 'email' },
        { key: 'email_primary_color', value: settings.primaryColor, type: 'string', group: 'email' },
        { key: 'email_footer_text', value: settings.footerText, type: 'string', group: 'email' },
      ];

      for (const setting of settingsToSave) {
        await settingsApi.updateSetting(setting.key, setting);
      }

      toast.success('Email settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const selectImage = (url: string) => {
    setSettings({ ...settings, logoUrl: url });
    setShowMediaPicker(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
            Email Settings
          </h1>
          <p className="text-slate-400 text-lg">Configure your email branding and company information</p>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Branding Section */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FiImage className="text-indigo-400" />
              Branding
            </h2>

            <div className="space-y-4">
              {/* Site Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="Your Company Name"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Logo URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    placeholder="https://example.com/logo.png"
                  />
                  <button
                    onClick={() => setShowMediaPicker(true)}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    <FiUpload size={18} />
                    Browse
                  </button>
                </div>
                {settings.logoUrl && (
                  <div className="mt-3 p-4 bg-slate-700/30 rounded-xl">
                    <p className="text-sm text-slate-400 mb-2">Preview:</p>
                    <img src={settings.logoUrl} alt="Logo preview" className="max-h-16 rounded" />
                  </div>
                )}
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-600"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white font-mono"
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FiMail className="text-green-400" />
              Contact Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="support@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Company Address
                </label>
                <textarea
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="123 Main Street, City, Country"
                />
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FiGlobe className="text-purple-400" />
              Links
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Help Center URL
                </label>
                <input
                  type="url"
                  value={settings.helpUrl}
                  onChange={(e) => setSettings({ ...settings, helpUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="https://example.com/help"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Documentation URL
                </label>
                <input
                  type="url"
                  value={settings.docsUrl}
                  onChange={(e) => setSettings({ ...settings, docsUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="https://example.com/docs"
                />
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FiFileText className="text-amber-400" />
              Footer
            </h2>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Footer Text
              </label>
              <textarea
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
                rows={2}
                placeholder="© {year} {siteName}. All rights reserved."
              />
              <p className="text-xs text-slate-500 mt-2">
                Use {'{year}'} for current year and {'{siteName}'} for your site name
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={20} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* Media Picker Modal */}
        {showMediaPicker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold text-white">Select Logo Image</h3>
                <button
                  onClick={() => setShowMediaPicker(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-4 gap-4">
                  {media.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectImage(item.url || `/uploads/${item.path}`)}
                      className="aspect-square rounded-xl overflow-hidden border-2 border-slate-600 hover:border-indigo-500 transition-all"
                    >
                      <img
                        src={item.url || `/uploads/${item.path}`}
                        alt={item.originalName || item.filename}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                {media.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <FiImage size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No images found. Upload images in the Media Library first.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

