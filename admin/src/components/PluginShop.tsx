/**
 * Plugin Shop Component
 * Browse and install plugins from the marketplace
 */

import { useState, useEffect } from 'react';
import { FiDownload, FiStar, FiLoader, FiSearch, FiGrid, FiList, FiCheck, FiUpload, FiX, FiPackage, FiAward, FiTrendingUp, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { pluginMarketplaceApi, MarketplacePlugin } from '../services/api';

interface PluginShopProps {
  onPluginInstalled?: () => void;
}

type ViewMode = 'grid' | 'list';
type CategoryFilter = 'all' | 'utility' | 'seo' | 'security' | 'social' | 'analytics' | 'backup' | 'ecommerce';

interface SubmitFormData {
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string;
  features: string;
  repositoryUrl: string;
}

export default function PluginShop({ onPluginInstalled }: PluginShopProps) {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [, setHoveredPlugin] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'newest' | 'name' | 'activeInstalls'>('downloads');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitIcon, setSubmitIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [submitForm, setSubmitForm] = useState<SubmitFormData>({
    name: '', description: '', version: '1.0.0', category: 'utility',
    tags: '', features: '', repositoryUrl: '',
  });
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, featured: 0, totalDownloads: 0, totalActiveInstalls: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const response = await pluginMarketplaceApi.getPlugins({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchTerm || undefined,
        sortBy,
        page: pagination.page,
        limit: pagination.limit,
      });
      setPlugins(response.data.plugins);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await pluginMarketplaceApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchPlugins();
    fetchStats();
  }, [categoryFilter, sortBy, pagination.page]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (pagination.page === 1) fetchPlugins();
      else setPagination(p => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleInstall = async (plugin: MarketplacePlugin) => {
    setInstalling(plugin.id);
    try {
      await pluginMarketplaceApi.installPlugin(plugin.id);
      toast.success(`${plugin.name} installed successfully!`);
      onPluginInstalled?.();
      fetchPlugins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to install plugin');
    } finally {
      setInstalling(null);
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmitIcon(file);
      const reader = new FileReader();
      reader.onloadend = () => setIconPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!submitFile) { toast.error('Please select a plugin ZIP file'); return; }
    if (!submitForm.name.trim()) { toast.error('Please enter a plugin name'); return; }
    if (!submitForm.description.trim()) { toast.error('Please enter a description'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', submitFile);
      if (submitIcon) formData.append('icon', submitIcon);
      Object.entries(submitForm).forEach(([key, value]) => {
        if (key === 'tags' || key === 'features') {
          const arr = value.split(',').map((s: string) => s.trim()).filter(Boolean);
          formData.append(key, JSON.stringify(arr));
        } else {
          formData.append(key, value);
        }
      });

      await pluginMarketplaceApi.submitPlugin(formData);
      toast.success('Plugin submitted for review!');
      setShowSubmitModal(false);
      setSubmitFile(null);
      setSubmitIcon(null);
      setIconPreview(null);
      setSubmitForm({ name: '', description: '', version: '1.0.0', category: 'utility', tags: '', features: '', repositoryUrl: '' });
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit plugin');
    } finally {
      setSubmitting(false);
    }
  };

  const categories: { id: CategoryFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <FiGrid size={14} /> },
    { id: 'utility', label: 'Utility', icon: <FiPackage size={14} /> },
    { id: 'seo', label: 'SEO', icon: <FiTrendingUp size={14} /> },
    { id: 'security', label: 'Security', icon: <FiCheck size={14} /> },
    { id: 'social', label: 'Social', icon: <FiUsers size={14} /> },
    { id: 'analytics', label: 'Analytics', icon: <FiTrendingUp size={14} /> },
    { id: 'backup', label: 'Backup', icon: <FiDownload size={14} /> },
    { id: 'ecommerce', label: 'E-commerce', icon: <FiPackage size={14} /> },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/20 rounded-xl p-4 border border-violet-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg"><FiPackage className="text-violet-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
              <p className="text-xs text-slate-400">Plugins</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg"><FiDownload className="text-blue-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{formatNumber(stats.totalDownloads)}</p>
              <p className="text-xs text-slate-400">Downloads</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg"><FiUsers className="text-emerald-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{formatNumber(stats.totalActiveInstalls)}</p>
              <p className="text-xs text-slate-400">Active Installs</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg"><FiAward className="text-amber-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.featured}</p>
              <p className="text-xs text-slate-400">Featured</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                categoryFilter === cat.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-64 pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
          >
            <option value="downloads">Most Downloads</option>
            <option value="activeInstalls">Most Installed</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
            <option value="name">Name A-Z</option>
          </select>
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-violet-600' : ''}`}>
              <FiGrid size={16} className={viewMode === 'grid' ? 'text-white' : 'text-slate-400'} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-violet-600' : ''}`}>
              <FiList size={16} className={viewMode === 'list' ? 'text-white' : 'text-slate-400'} />
            </button>
          </div>
          <button onClick={() => setShowSubmitModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-violet-700 hover:to-purple-700">
            <FiUpload size={16} /> Submit Plugin
          </button>
        </div>
      </div>

      {/* Plugin Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><FiLoader className="animate-spin text-violet-500" size={32} /></div>
      ) : plugins.length === 0 ? (
        <div className="text-center py-20">
          <FiPackage className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-400">No plugins found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plugins.map(plugin => (
            <div
              key={plugin.id}
              className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-violet-500/50 transition-all group"
              onMouseEnter={() => setHoveredPlugin(plugin.id)}
              onMouseLeave={() => setHoveredPlugin(null)}
            >
              <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                {plugin.iconUrl ? (
                  <img src={plugin.iconUrl} alt={plugin.name} className="w-16 h-16 object-contain" />
                ) : (
                  <FiPackage className="text-slate-600" size={48} />
                )}
                {plugin.isFeatured && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded text-xs text-amber-400 flex items-center gap-1">
                    <FiAward size={12} /> Featured
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white truncate">{plugin.name}</h3>
                <p className="text-xs text-slate-400 mt-1">by {plugin.author}</p>
                <p className="text-sm text-slate-400 mt-2 line-clamp-2 h-10">{plugin.description || 'No description'}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><FiDownload size={12} /> {formatNumber(plugin.downloads)}</span>
                  <span className="flex items-center gap-1"><FiUsers size={12} /> {formatNumber(plugin.activeInstalls)}</span>
                  <span className="flex items-center gap-1"><FiStar size={12} className="text-amber-400" /> {plugin.rating.toFixed(1)}</span>
                </div>
                <button
                  onClick={() => handleInstall(plugin)}
                  disabled={installing === plugin.id}
                  className="w-full mt-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  {installing === plugin.id ? <FiLoader className="animate-spin" size={16} /> : <FiDownload size={16} />}
                  {installing === plugin.id ? 'Installing...' : 'Install'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {plugins.map(plugin => (
            <div key={plugin.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 hover:border-violet-500/50 transition-all flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                {plugin.iconUrl ? <img src={plugin.iconUrl} alt={plugin.name} className="w-10 h-10 object-contain" /> : <FiPackage className="text-slate-500" size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{plugin.name}</h3>
                  {plugin.isFeatured && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">Featured</span>}
                </div>
                <p className="text-sm text-slate-400 mt-1 truncate">{plugin.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>v{plugin.version}</span>
                  <span className="flex items-center gap-1"><FiDownload size={12} /> {formatNumber(plugin.downloads)}</span>
                  <span className="flex items-center gap-1"><FiStar size={12} className="text-amber-400" /> {plugin.rating.toFixed(1)}</span>
                </div>
              </div>
              <button
                onClick={() => handleInstall(plugin)}
                disabled={installing === plugin.id}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
              >
                {installing === plugin.id ? <FiLoader className="animate-spin" size={16} /> : <FiDownload size={16} />}
                Install
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50">Previous</button>
          <span className="px-4 py-2 text-slate-400">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Submit Plugin</h2>
              <button onClick={() => setShowSubmitModal(false)} className="p-2 hover:bg-slate-700 rounded-lg"><FiX size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Plugin ZIP File *</label>
                <input type="file" accept=".zip" onChange={e => setSubmitFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Icon (optional)</label>
                <div className="flex items-center gap-4">
                  {iconPreview && <img src={iconPreview} alt="Icon preview" className="w-16 h-16 rounded-lg object-cover" />}
                  <input type="file" accept="image/*" onChange={handleIconChange} className="text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                  <input type="text" value={submitForm.name} onChange={e => setSubmitForm({ ...submitForm, name: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Version</label>
                  <input type="text" value={submitForm.version} onChange={e => setSubmitForm({ ...submitForm, version: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
                <textarea value={submitForm.description} onChange={e => setSubmitForm({ ...submitForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select value={submitForm.category} onChange={e => setSubmitForm({ ...submitForm, category: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                  <option value="utility">Utility</option>
                  <option value="seo">SEO</option>
                  <option value="security">Security</option>
                  <option value="social">Social</option>
                  <option value="analytics">Analytics</option>
                  <option value="backup">Backup</option>
                  <option value="ecommerce">E-commerce</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tags (comma-separated)</label>
                <input type="text" value={submitForm.tags} onChange={e => setSubmitForm({ ...submitForm, tags: e.target.value })} placeholder="caching, performance, speed" className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Repository URL</label>
                <input type="url" value={submitForm.repositoryUrl} onChange={e => setSubmitForm({ ...submitForm, repositoryUrl: e.target.value })} placeholder="https://github.com/..." className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium flex items-center gap-2">
                {submitting ? <FiLoader className="animate-spin" size={16} /> : <FiUpload size={16} />}
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

