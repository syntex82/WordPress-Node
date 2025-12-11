/**
 * Settings Page
 * Manage site settings, themes, and plugins
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsApi, themesApi, pluginsApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import ThemeRequirements from '../components/ThemeRequirements';
import ThemeShop from '../components/ThemeShop';
import toast from 'react-hot-toast';
import { FiCheck, FiRefreshCw, FiUpload, FiTrash2, FiInfo, FiShoppingBag, FiTool, FiPenTool } from 'react-icons/fi';

export default function Settings() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState<any[]>([]);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'themes' | 'plugins'>('general');
  const [showRequirements, setShowRequirements] = useState(false);
  const [showThemeShop, setShowThemeShop] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; themeId: string | null; themeName: string | null }>({
    isOpen: false,
    themeId: null,
    themeName: null,
  });
  const [siteSettings, setSiteSettings] = useState({
    siteName: '',
    siteDescription: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [themesRes, pluginsRes, settingsRes] = await Promise.all([
        themesApi.getAll(),
        pluginsApi.getAll(),
        settingsApi.getAll(),
      ]);
      setThemes(themesRes.data);
      setPlugins(pluginsRes.data);

      // Parse settings
      const settings = settingsRes.data;
      const siteName = settings.find((s: any) => s.key === 'site_name');
      const siteDesc = settings.find((s: any) => s.key === 'site_description');
      setSiteSettings({
        siteName: siteName?.value || '',
        siteDescription: siteDesc?.value || '',
      });
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await Promise.all([
        settingsApi.set('site_name', siteSettings.siteName, 'string', 'general'),
        settingsApi.set('site_description', siteSettings.siteDescription, 'string', 'general'),
      ]);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleActivateTheme = async (id: string) => {
    try {
      await themesApi.activate(id);
      toast.success('Theme activated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to activate theme');
    }
  };

  const handleScanThemes = async () => {
    try {
      await themesApi.scan();
      toast.success('Themes scanned successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to scan themes');
    }
  };

  const handleUploadTheme = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('Please upload a ZIP file');
      return;
    }

    setUploading(true);
    try {
      await themesApi.upload(file);
      toast.success('Theme uploaded and installed successfully');
      fetchData();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload theme');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTheme = async () => {
    if (!deleteConfirm.themeId) return;

    try {
      await themesApi.delete(deleteConfirm.themeId);
      toast.success('Theme deleted successfully');
      setDeleteConfirm({ isOpen: false, themeId: null, themeName: null });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete theme');
    }
  };

  const handleTogglePlugin = async (plugin: any) => {
    try {
      if (plugin.isActive) {
        await pluginsApi.deactivate(plugin.id);
        toast.success(`${plugin.name} deactivated`);
      } else {
        await pluginsApi.activate(plugin.id);
        toast.success(`${plugin.name} activated`);
      }
      fetchData();
    } catch (error) {
      toast.error('Failed to toggle plugin');
    }
  };

  const handleScanPlugins = async () => {
    try {
      await pluginsApi.scan();
      toast.success('Plugins scanned successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to scan plugins');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', label: 'General' },
            { id: 'themes', label: 'Themes' },
            { id: 'plugins', label: 'Plugins' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">General Settings</h2>
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={siteSettings.siteName}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="My WordPress Node Site"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Description
              </label>
              <textarea
                value={siteSettings.siteDescription}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="A brief description of your site"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiCheck className="mr-2" size={18} />
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Themes Tab */}
      {activeTab === 'themes' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Themes</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowThemeShop(!showThemeShop)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FiShoppingBag className="mr-2" size={18} />
                {showThemeShop ? 'Hide' : 'Browse'} Theme Shop
              </button>
              <button
                onClick={() => setShowRequirements(!showRequirements)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FiInfo className="mr-2" size={18} />
                {showRequirements ? 'Hide' : 'Show'} Requirements
              </button>
              <button
                onClick={handleScanThemes}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FiRefreshCw className="mr-2" size={18} />
                Scan Themes
              </button>
              <button
                onClick={() => navigate('/theme-designer')}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <FiPenTool className="mr-2" size={18} />
                Design Theme
              </button>
              <button
                onClick={() => navigate('/theme-builder')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FiTool className="mr-2" size={18} />
                Upload Theme
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <FiUpload className="mr-2" size={18} />
                {uploading ? 'Uploading...' : 'Quick Upload'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleUploadTheme}
                className="hidden"
              />
            </div>
          </div>

          {/* Theme Shop */}
          {showThemeShop && (
            <div className="mb-6">
              <ThemeShop onThemeInstalled={fetchData} />
            </div>
          )}

          {/* Theme Requirements */}
          {showRequirements && (
            <div className="mb-6">
              <ThemeRequirements />
            </div>
          )}

          <h3 className="text-lg font-semibold mb-4">Installed Themes ({themes.length})</h3>

          {themes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">No themes found. Click "Scan Themes" to detect installed themes.</p>
              <button
                onClick={handleScanThemes}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FiRefreshCw className="mr-2" size={18} />
                Scan for Themes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {themes.map((theme) => (
              <div key={theme.id} className="bg-white rounded-lg shadow overflow-hidden">
                {theme.thumbnail ? (
                  <img src={theme.thumbnail} alt={theme.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{theme.name.charAt(0)}</span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-1">{theme.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">by {theme.author}</p>
                  <p className="text-sm text-gray-600 mb-4">{theme.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-500">v{theme.version}</span>
                    {theme.isActive ? (
                      <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        <FiCheck className="mr-1" size={14} />
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleActivateTheme(theme.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                  {!theme.isActive && (
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, themeId: theme.id, themeName: theme.name })}
                      className="w-full flex items-center justify-center px-3 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50"
                    >
                      <FiTrash2 className="mr-2" size={14} />
                      Delete Theme
                    </button>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plugins Tab */}
      {activeTab === 'plugins' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Plugins</h2>
            <button
              onClick={handleScanPlugins}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FiRefreshCw className="mr-2" size={18} />
              Scan for Plugins
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {plugins.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No plugins found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plugin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plugins.map((plugin) => (
                    <tr key={plugin.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{plugin.name}</div>
                        {plugin.author && (
                          <div className="text-xs text-gray-500">by {plugin.author}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{plugin.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">v{plugin.version}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleTogglePlugin(plugin)}
                          className={`px-3 py-1 text-xs font-semibold rounded ${
                            plugin.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {plugin.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Delete Theme Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Theme"
        message={`Are you sure you want to delete "${deleteConfirm.themeName}"? This action cannot be undone and will permanently remove all theme files.`}
        onConfirm={handleDeleteTheme}
        onCancel={() => setDeleteConfirm({ isOpen: false, themeId: null, themeName: null })}
      />
    </div>
  );
}


