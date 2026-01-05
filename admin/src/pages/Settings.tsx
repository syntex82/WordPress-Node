/**
 * Settings Page
 * Manage site settings, themes, plugins, email, and domain configuration
 * With comprehensive tooltips for user guidance
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsApi, themesApi, pluginsApi, systemConfigApi, SmtpConfig, DomainConfig, PaymentConfig } from '../services/api';
import { useThemeClasses } from '../contexts/SiteThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import ThemeRequirements from '../components/ThemeRequirements';
import ThemeShop from '../components/ThemeShop';
import toast from 'react-hot-toast';
import { FiCheck, FiRefreshCw, FiUpload, FiTrash2, FiInfo, FiShoppingBag, FiTool, FiPenTool, FiHelpCircle, FiMail, FiGlobe, FiSend, FiEye, FiEyeOff, FiCreditCard, FiZap } from 'react-icons/fi';
import Tooltip from '../components/Tooltip';

// Tooltip content for settings page
const SETTINGS_TOOLTIPS = {
  general: { title: 'General Settings', content: 'Configure your site name, description, and other basic settings.' },
  themes: { title: 'Themes', content: 'Install, activate, and customize themes to change your site\'s appearance.' },
  plugins: { title: 'Plugins', content: 'Extend your site\'s functionality with plugins.' },
  email: { title: 'Email Settings', content: 'Configure SMTP settings for sending emails (password reset, notifications, etc.).' },
  domain: { title: 'Domain Settings', content: 'Configure your site URLs and domain-related settings.' },
  payment: { title: 'Payment Settings', content: 'Configure Stripe API keys for accepting payments.' },
  uploadTheme: { title: 'Upload Theme', content: 'Upload a theme package (.zip) to install a new theme.' },
  activateTheme: { title: 'Activate Theme', content: 'Make this theme the active theme for your site.' },
  customizeTheme: { title: 'Customize Theme', content: 'Open the theme customizer to adjust colors, fonts, and layout.' },
  deleteTheme: { title: 'Delete Theme', content: 'Permanently remove this theme from your site.' },
  themeShop: { title: 'Theme Shop', content: 'Browse and install themes from the marketplace.' },
  uploadPlugin: { title: 'Upload Plugin', content: 'Upload a plugin package (.zip) to install a new plugin.' },
  activatePlugin: { title: 'Activate Plugin', content: 'Enable this plugin to add its features to your site.' },
  deactivatePlugin: { title: 'Deactivate Plugin', content: 'Disable this plugin without removing it.' },
  deletePlugin: { title: 'Delete Plugin', content: 'Permanently remove this plugin from your site.' },
};

export default function Settings() {
  const navigate = useNavigate();
  const theme = useThemeClasses();
  const [themes, setThemes] = useState<any[]>([]);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'themes' | 'plugins' | 'email' | 'domain' | 'payment'>('general');
  const [showRequirements, setShowRequirements] = useState(false);
  const [showThemeShop, setShowThemeShop] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; themeId: string | null; themeName: string | null }>({
    isOpen: false,
    themeId: null,
    themeName: null,
  });
  const [deletePluginConfirm, setDeletePluginConfirm] = useState<{ isOpen: boolean; pluginId: string | null; pluginName: string | null }>({
    isOpen: false,
    pluginId: null,
    pluginName: null,
  });
  const [siteSettings, setSiteSettings] = useState({
    siteName: '',
    siteDescription: '',
  });
  const [showPluginDetails, setShowPluginDetails] = useState<string | null>(null);
  const [pluginUploading, setPluginUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pluginFileInputRef = useRef<HTMLInputElement>(null);

  // Email settings state
  const [emailConfig, setEmailConfig] = useState<SmtpConfig>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: '',
  });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Domain settings state
  const [domainConfig, setDomainConfig] = useState<DomainConfig>({
    frontendUrl: '',
    adminUrl: '',
    supportEmail: '',
    siteName: '',
  });
  const [domainSaving, setDomainSaving] = useState(false);

  // Payment settings state
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    isLiveMode: false,
    isConfigured: false,
    provider: 'stripe',
  });
  const [paymentInput, setPaymentInput] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
  });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentTesting, setPaymentTesting] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [themesRes, pluginsRes, settingsRes, emailRes, domainRes, paymentRes] = await Promise.all([
        themesApi.getAll(),
        pluginsApi.getAll(),
        settingsApi.getAll(),
        systemConfigApi.getEmailConfig().catch(() => ({ data: null })),
        systemConfigApi.getDomainConfig().catch(() => ({ data: null })),
        systemConfigApi.getPaymentConfig().catch(() => ({ data: null })),
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

      // Load email config
      if (emailRes.data) {
        setEmailConfig({
          host: emailRes.data.host || '',
          port: emailRes.data.port || 587,
          secure: emailRes.data.secure || false,
          user: emailRes.data.user || '',
          password: '', // Password is masked, don't show it
          fromEmail: emailRes.data.fromEmail || '',
          fromName: emailRes.data.fromName || '',
        });
      }

      // Load domain config
      if (domainRes.data) {
        setDomainConfig({
          frontendUrl: domainRes.data.frontendUrl || '',
          adminUrl: domainRes.data.adminUrl || '',
          supportEmail: domainRes.data.supportEmail || '',
          siteName: domainRes.data.siteName || '',
        });
      }

      // Load payment config
      if (paymentRes.data) {
        setPaymentConfig(paymentRes.data);
      }
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

  // Email settings handlers
  const handleSaveEmailConfig = async () => {
    setEmailSaving(true);
    try {
      await systemConfigApi.saveEmailConfig(emailConfig);
      toast.success('Email settings saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save email settings');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error('Please enter a test email address');
      return;
    }
    setEmailTesting(true);
    try {
      await systemConfigApi.testEmail(testEmailAddress);
      toast.success(`Test email sent to ${testEmailAddress}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    } finally {
      setEmailTesting(false);
    }
  };

  // Domain settings handlers
  const handleSaveDomainConfig = async () => {
    setDomainSaving(true);
    try {
      await systemConfigApi.saveDomainConfig(domainConfig);
      toast.success('Domain settings saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save domain settings');
    } finally {
      setDomainSaving(false);
    }
  };

  // Payment settings handlers
  const handleSavePaymentConfig = async () => {
    // Validate at least one field is being updated
    if (!paymentInput.publishableKey && !paymentInput.secretKey && !paymentInput.webhookSecret) {
      toast.error('Please enter at least one API key to update');
      return;
    }

    setPaymentSaving(true);
    try {
      await systemConfigApi.savePaymentConfig(paymentInput);
      toast.success('Payment settings saved successfully');
      // Clear input fields and refresh config
      setPaymentInput({ publishableKey: '', secretKey: '', webhookSecret: '' });
      const paymentRes = await systemConfigApi.getPaymentConfig();
      if (paymentRes.data) {
        setPaymentConfig(paymentRes.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save payment settings');
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleTestPaymentConnection = async () => {
    setPaymentTesting(true);
    try {
      const result = await systemConfigApi.testPaymentConnection();
      toast.success(result.data.message || 'Stripe connection successful');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to connect to Stripe');
    } finally {
      setPaymentTesting(false);
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

  const handlePluginFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('Please select a ZIP file');
      return;
    }

    setPluginUploading(true);
    try {
      const result = await pluginsApi.upload(file);
      toast.success(`Plugin "${result.data.name}" installed successfully!`);
      if (result.data.warnings?.length > 0) {
        result.data.warnings.forEach((w: string) => toast(w, { icon: '⚠️' }));
      }
      fetchData();
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.errors) {
        errorData.errors.forEach((e: string) => toast.error(e));
      } else {
        toast.error(errorData?.message || 'Failed to upload plugin');
      }
    } finally {
      setPluginUploading(false);
      if (pluginFileInputRef.current) {
        pluginFileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePlugin = async () => {
    if (!deletePluginConfirm.pluginId) return;

    try {
      await pluginsApi.delete(deletePluginConfirm.pluginId);
      toast.success('Plugin deleted successfully');
      setDeletePluginConfirm({ isOpen: false, pluginId: null, pluginName: null });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete plugin');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>Settings</h1>
        <Tooltip title="About Settings" content="Configure your site's core settings, manage themes and plugins, and customize your site's behavior." position="right" variant="help">
          <button className={`p-1 ${theme.icon} hover:text-blue-400`}>
            <FiHelpCircle size={18} />
          </button>
        </Tooltip>
      </div>

      {/* Tabs */}
      <div className={`mb-6 border-b ${theme.border}`}>
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { id: 'general', label: 'General', icon: null, tooltip: SETTINGS_TOOLTIPS.general },
            { id: 'payment', label: 'Payment', icon: FiCreditCard, tooltip: SETTINGS_TOOLTIPS.payment },
            { id: 'email', label: 'Email', icon: FiMail, tooltip: SETTINGS_TOOLTIPS.email },
            { id: 'domain', label: 'Domain', icon: FiGlobe, tooltip: SETTINGS_TOOLTIPS.domain },
            { id: 'themes', label: 'Themes', icon: null, tooltip: SETTINGS_TOOLTIPS.themes },
            { id: 'plugins', label: 'Plugins', icon: null, tooltip: SETTINGS_TOOLTIPS.plugins },
          ].map((tab) => (
            <Tooltip key={tab.id} title={tab.tooltip.title} content={tab.tooltip.content} position="bottom">
              <button
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : theme.isDark
                      ? 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-400'
                }`}
              >
                {tab.icon && <tab.icon size={16} />}
                {tab.label}
              </button>
            </Tooltip>
          ))}
        </nav>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className={`backdrop-blur rounded-xl border p-6 ${theme.card}`}>
          <h2 className={`text-xl font-bold mb-6 ${theme.textPrimary}`}>General Settings</h2>
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>
                Site Name
              </label>
              <input
                type="text"
                value={siteSettings.siteName}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                placeholder="My NodePress Site"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>
                Site Description
              </label>
              <textarea
                value={siteSettings.siteDescription}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                rows={3}
                placeholder="A brief description of your site"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all"
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
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>Themes</h2>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowThemeShop(!showThemeShop)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-all ${theme.isDark ? 'border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <FiShoppingBag className="mr-2" size={18} />
                {showThemeShop ? 'Hide' : 'Browse'} Theme Shop
              </button>
              <button
                onClick={() => setShowRequirements(!showRequirements)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-all ${theme.isDark ? 'border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <FiInfo className="mr-2" size={18} />
                {showRequirements ? 'Hide' : 'Show'} Requirements
              </button>
              <button
                onClick={handleScanThemes}
                className={`flex items-center px-4 py-2 border rounded-lg transition-all ${theme.isDark ? 'border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <FiRefreshCw className="mr-2" size={18} />
                Scan Themes
              </button>
              <button
                onClick={() => navigate('/theme-designer')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/20 transition-all"
              >
                <FiPenTool className="mr-2" size={18} />
                Design Theme
              </button>
              <button
                onClick={() => navigate('/theme-builder')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <FiTool className="mr-2" size={18} />
                Upload Theme
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
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

          <h3 className={`text-lg font-semibold mb-4 ${theme.textPrimary}`}>Installed Themes ({themes.length})</h3>

          {themes.length === 0 ? (
            <div className={`backdrop-blur rounded-xl border p-8 text-center ${theme.card}`}>
              <p className={`mb-4 ${theme.textMuted}`}>No themes found. Click "Scan Themes" to detect installed themes.</p>
              <button
                onClick={handleScanThemes}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all"
              >
                <FiRefreshCw className="mr-2" size={18} />
                Scan for Themes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {themes.map((themeItem) => (
              <div key={themeItem.id} className={`backdrop-blur rounded-xl border overflow-hidden transition-all group ${theme.card} ${theme.isDark ? 'hover:border-slate-600/50' : 'hover:border-gray-400'}`}>
                {themeItem.thumbnail ? (
                  <img src={themeItem.thumbnail} alt={themeItem.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{themeItem.name.charAt(0)}</span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className={`text-lg font-semibold mb-1 ${theme.textPrimary}`}>{themeItem.name}</h3>
                  <p className={`text-xs mb-2 ${theme.textMuted}`}>by {themeItem.author}</p>
                  <p className={`text-sm mb-4 ${theme.textMuted}`}>{themeItem.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs ${theme.textMuted}`}>v{themeItem.version}</span>
                    {themeItem.isActive ? (
                      <span className="flex items-center px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
                        <FiCheck className="mr-1" size={14} />
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleActivateTheme(themeItem.id)}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full hover:bg-blue-500/30 transition-all"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                  {!themeItem.isActive && (
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, themeId: themeItem.id, themeName: themeItem.name })}
                      className="w-full flex items-center justify-center px-3 py-2 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/10 transition-all"
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
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>Plugins</h2>
            <div className="flex gap-3">
              <input
                type="file"
                ref={pluginFileInputRef}
                onChange={handlePluginFileSelect}
                accept=".zip"
                className="hidden"
              />
              <button
                onClick={() => pluginFileInputRef.current?.click()}
                disabled={pluginUploading}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                <FiUpload className="mr-2" size={18} />
                {pluginUploading ? 'Uploading...' : 'Upload Plugin'}
              </button>
              <button
                onClick={handleScanPlugins}
                className={`flex items-center px-4 py-2 border rounded-lg transition-all ${theme.isDark ? 'border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <FiRefreshCw className="mr-2" size={18} />
                Scan for Plugins
              </button>
            </div>
          </div>

          {/* Plugin Requirements Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center">
              <FiInfo className="mr-2" /> Plugin Requirements
            </h3>
            <p className="text-sm text-blue-300 mb-2">
              Plugins must be ZIP files containing a <code className="bg-blue-500/20 px-1 rounded">plugin.json</code> file with:
            </p>
            <ul className="text-sm text-blue-300 list-disc list-inside space-y-1">
              <li><strong className="text-blue-200">name</strong> (required): Display name of the plugin</li>
              <li><strong className="text-blue-200">version</strong> (required): Version string (e.g., "1.0.0")</li>
              <li><strong className="text-blue-200">author</strong>: Author name</li>
              <li><strong className="text-blue-200">description</strong>: Brief description</li>
              <li><strong className="text-blue-200">entry</strong>: Entry file (defaults to "index.js")</li>
              <li><strong className="text-blue-200">hooks</strong>: Array of lifecycle hooks (e.g., ["onActivate", "beforeSave", "registerRoutes"])</li>
            </ul>
          </div>

          <div className={`backdrop-blur rounded-xl border overflow-hidden ${theme.card}`}>
            {plugins.length === 0 ? (
              <div className="text-center py-12">
                <p className={`mb-4 ${theme.textMuted}`}>No plugins found</p>
                <button
                  onClick={() => pluginFileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all"
                >
                  <FiUpload className="mr-2" size={18} />
                  Upload Your First Plugin
                </button>
              </div>
            ) : (
              <div className={`divide-y ${theme.border}`}>
                {plugins.map((plugin) => (
                  <div key={plugin.id} className={`p-6 transition-colors ${theme.isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>{plugin.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${theme.isDark ? 'text-slate-400 bg-slate-700/50' : 'text-gray-500 bg-gray-200'}`}>v{plugin.version}</span>
                          {plugin.isActive && (
                            <span className="flex items-center text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                              <FiCheck className="mr-1" size={12} /> Active
                            </span>
                          )}
                        </div>
                        {plugin.author && (
                          <p className={`text-sm mt-1 ${theme.textMuted}`}>by {plugin.author}</p>
                        )}
                        <p className={`text-sm mt-2 ${theme.textMuted}`}>{plugin.description}</p>

                        {/* Plugin Details Toggle */}
                        <button
                          onClick={() => setShowPluginDetails(showPluginDetails === plugin.id ? null : plugin.id)}
                          className="text-sm text-blue-400 hover:text-blue-300 mt-2 flex items-center transition-colors"
                        >
                          <FiInfo className="mr-1" size={14} />
                          {showPluginDetails === plugin.id ? 'Hide Details' : 'Show Details'}
                        </button>

                        {showPluginDetails === plugin.id && plugin.config && (
                          <div className={`mt-3 p-3 rounded-lg text-sm border ${theme.isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className={`font-medium ${theme.textMuted}`}>Entry File:</span>
                                <span className={`ml-2 ${theme.textPrimary}`}>{plugin.config.entry || 'index.js'}</span>
                              </div>
                              <div>
                                <span className={`font-medium ${theme.textMuted}`}>Path:</span>
                                <span className={`ml-2 ${theme.textPrimary}`}>{plugin.path}</span>
                              </div>
                            </div>
                            {plugin.config.hooks && plugin.config.hooks.length > 0 && (
                              <div className="mt-2">
                                <span className={`font-medium ${theme.textMuted}`}>Hooks:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {plugin.config.hooks.map((hook: string) => (
                                    <span key={hook} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                                      {hook}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {plugin.config.dependencies && Object.keys(plugin.config.dependencies).length > 0 && (
                              <div className="mt-2">
                                <span className={`font-medium ${theme.textMuted}`}>Dependencies:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {Object.entries(plugin.config.dependencies).map(([dep, ver]) => (
                                    <span key={dep} className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                                      {dep}@{ver as string}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleTogglePlugin(plugin)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            plugin.isActive
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          }`}
                        >
                          {plugin.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {!plugin.isActive && (
                          <button
                            onClick={() => setDeletePluginConfirm({ isOpen: true, pluginId: plugin.id, pluginName: plugin.name })}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                            title="Delete Plugin"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Settings Tab */}
      {activeTab === 'email' && (
        <div className={`backdrop-blur rounded-xl border p-6 ${theme.card}`}>
          <div className="flex items-center gap-3 mb-6">
            <FiMail className="text-blue-400" size={24} />
            <h2 className={`text-xl font-bold ${theme.textPrimary}`}>Email (SMTP) Settings</h2>
          </div>
          <p className={`mb-6 ${theme.textMuted}`}>
            Configure your SMTP server to enable email functionality (password reset, notifications, etc.).
          </p>

          <div className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>SMTP Host</label>
                <input
                  type="text"
                  value={emailConfig.host}
                  onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>SMTP Port</label>
                <input
                  type="number"
                  value={emailConfig.port}
                  onChange={(e) => setEmailConfig({ ...emailConfig, port: parseInt(e.target.value) || 587 })}
                  className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="smtpSecure"
                checked={emailConfig.secure}
                onChange={(e) => setEmailConfig({ ...emailConfig, secure: e.target.checked })}
                className={`w-4 h-4 rounded text-blue-500 focus:ring-blue-500/50 ${theme.isDark ? 'border-slate-600 bg-slate-900' : 'border-gray-300 bg-white'}`}
              />
              <label htmlFor="smtpSecure" className={`text-sm ${theme.textMuted}`}>
                Use SSL/TLS (check for port 465, uncheck for port 587 with STARTTLS)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>SMTP Username</label>
                <input
                  type="text"
                  value={emailConfig.user}
                  onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>SMTP Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={emailConfig.password}
                    onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 pr-10 ${theme.input}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.icon} ${theme.iconHover}`}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                <p className={`text-xs mt-1 ${theme.textMuted}`}>Leave blank to keep existing password</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>From Email</label>
                <input
                  type="email"
                  value={emailConfig.fromEmail}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                  placeholder="noreply@yoursite.com"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>From Name</label>
                <input
                  type="text"
                  value={emailConfig.fromName}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                  placeholder="My Site"
                />
              </div>
            </div>

            <div className={`flex flex-wrap gap-4 pt-4 border-t ${theme.border}`}>
              <button
                onClick={handleSaveEmailConfig}
                disabled={emailSaving}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {emailSaving ? (
                  <>
                    <FiRefreshCw className="mr-2 animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" size={18} />
                    Save Email Settings
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className={`px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                  placeholder="test@example.com"
                />
                <button
                  onClick={handleTestEmail}
                  disabled={emailTesting || !testEmailAddress}
                  className="flex items-center px-4 py-2.5 border border-emerald-500/50 text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                >
                  {emailTesting ? (
                    <>
                      <FiRefreshCw className="mr-2 animate-spin" size={18} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" size={18} />
                      Send Test Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain Settings Tab */}
      {activeTab === 'domain' && (
        <div className={`backdrop-blur rounded-xl border p-6 ${theme.card}`}>
          <div className="flex items-center gap-3 mb-6">
            <FiGlobe className="text-purple-400" size={24} />
            <h2 className={`text-xl font-bold ${theme.textPrimary}`}>Domain Settings</h2>
          </div>
          <p className={`mb-6 ${theme.textMuted}`}>
            Configure your site URLs and domain-related settings. These are used in emails and other system communications.
          </p>

          <div className="space-y-6 max-w-2xl">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>Frontend URL</label>
              <input
                type="url"
                value={domainConfig.frontendUrl}
                onChange={(e) => setDomainConfig({ ...domainConfig, frontendUrl: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                placeholder="https://yoursite.com"
              />
              <p className={`text-xs mt-1 ${theme.textMuted}`}>The public URL of your website (used in password reset links, etc.)</p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>Admin Panel URL</label>
              <input
                type="url"
                value={domainConfig.adminUrl}
                onChange={(e) => setDomainConfig({ ...domainConfig, adminUrl: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                placeholder="https://yoursite.com/admin"
              />
              <p className={`text-xs mt-1 ${theme.textMuted}`}>The URL of your admin panel</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>Site Name</label>
                <input
                  type="text"
                  value={domainConfig.siteName}
                  onChange={(e) => setDomainConfig({ ...domainConfig, siteName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                  placeholder="My Awesome Site"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>Support Email</label>
                <input
                  type="email"
                  value={domainConfig.supportEmail}
                  onChange={(e) => setDomainConfig({ ...domainConfig, supportEmail: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
                  placeholder="support@yoursite.com"
                />
              </div>
            </div>

            <button
              onClick={handleSaveDomainConfig}
              disabled={domainSaving}
              className="flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              {domainSaving ? (
                <>
                  <FiRefreshCw className="mr-2 animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck className="mr-2" size={18} />
                  Save Domain Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Payment Settings Tab */}
      {activeTab === 'payment' && (
        <div className={`backdrop-blur rounded-xl border p-6 ${theme.card}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FiCreditCard className="text-emerald-400" size={24} />
              <h2 className={`text-xl font-bold ${theme.textPrimary}`}>Payment Settings (Stripe)</h2>
            </div>
            {paymentConfig.isConfigured && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                paymentConfig.isLiveMode
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                <FiZap size={14} />
                {paymentConfig.isLiveMode ? 'LIVE MODE' : 'TEST MODE'}
              </div>
            )}
          </div>

          {/* Current Configuration Status */}
          <div className={`p-4 rounded-lg mb-6 ${
            paymentConfig.isConfigured
              ? 'bg-emerald-500/10 border border-emerald-500/30'
              : 'bg-amber-500/10 border border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <FiInfo size={16} className={paymentConfig.isConfigured ? 'text-emerald-400' : 'text-amber-400'} />
              <span className={`font-medium ${paymentConfig.isConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                {paymentConfig.isConfigured ? 'Stripe is configured' : 'Stripe is not configured'}
              </span>
            </div>
            {paymentConfig.isConfigured && (
              <div className={`text-sm space-y-1 ${theme.textMuted}`}>
                <p><strong>Publishable Key:</strong> {paymentConfig.publishableKey || 'Not set'}</p>
                <p><strong>Secret Key:</strong> {paymentConfig.secretKey || 'Not set'}</p>
                <p><strong>Webhook Secret:</strong> {paymentConfig.webhookSecret || 'Not set'}</p>
              </div>
            )}
          </div>

          <p className={`mb-6 ${theme.textMuted}`}>
            Enter your Stripe API keys below. Get your keys from the{' '}
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              Stripe Dashboard
            </a>.
          </p>

          <div className="space-y-6 max-w-2xl">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>Publishable Key</label>
              <input
                type="text"
                value={paymentInput.publishableKey}
                onChange={(e) => setPaymentInput({ ...paymentInput, publishableKey: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm ${theme.input}`}
                placeholder="pk_test_... or pk_live_..."
              />
              <p className={`text-xs mt-1 ${theme.textMuted}`}>Starts with pk_test_ (test mode) or pk_live_ (live mode)</p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>Secret Key</label>
              <div className="relative">
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={paymentInput.secretKey}
                  onChange={(e) => setPaymentInput({ ...paymentInput, secretKey: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm pr-10 ${theme.input}`}
                  placeholder="sk_test_... or sk_live_..."
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.icon} ${theme.iconHover}`}
                >
                  {showSecretKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              <p className={`text-xs mt-1 ${theme.textMuted}`}>Starts with sk_test_ (test mode) or sk_live_ (live mode)</p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>Webhook Secret</label>
              <div className="relative">
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={paymentInput.webhookSecret}
                  onChange={(e) => setPaymentInput({ ...paymentInput, webhookSecret: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm pr-10 ${theme.input}`}
                  placeholder="whsec_..."
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.icon} ${theme.iconHover}`}
                >
                  {showWebhookSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              <p className={`text-xs mt-1 ${theme.textMuted}`}>
                Get this from{' '}
                <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  Stripe Webhooks
                </a>
                {' '}after creating a webhook endpoint
              </p>
            </div>

            <div className={`flex flex-wrap gap-4 pt-4 border-t ${theme.border}`}>
              <button
                onClick={handleSavePaymentConfig}
                disabled={paymentSaving}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {paymentSaving ? (
                  <>
                    <FiRefreshCw className="mr-2 animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" size={18} />
                    Save Payment Settings
                  </>
                )}
              </button>

              {paymentConfig.isConfigured && (
                <button
                  onClick={handleTestPaymentConnection}
                  disabled={paymentTesting}
                  className="flex items-center px-4 py-2.5 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-all disabled:opacity-50"
                >
                  {paymentTesting ? (
                    <>
                      <FiRefreshCw className="mr-2 animate-spin" size={18} />
                      Testing...
                    </>
                  ) : (
                    <>
                      <FiZap className="mr-2" size={18} />
                      Test Connection
                    </>
                  )}
                </button>
              )}
            </div>
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

      {/* Delete Plugin Confirmation */}
      <ConfirmDialog
        isOpen={deletePluginConfirm.isOpen}
        title="Delete Plugin"
        message={`Are you sure you want to delete "${deletePluginConfirm.pluginName}"? This action cannot be undone and will permanently remove all plugin files.`}
        onConfirm={handleDeletePlugin}
        onCancel={() => setDeletePluginConfirm({ isOpen: false, pluginId: null, pluginName: null })}
      />
    </div>
  );
}


