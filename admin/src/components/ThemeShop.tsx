/**
 * Theme Shop Component
 * Browse and install themes from the marketplace
 */

import { useState, useEffect } from 'react';
import { FiDownload, FiStar, FiExternalLink, FiLoader, FiSearch, FiGrid, FiList, FiFilter, FiCheck, FiHeart, FiEye, FiUpload, FiX, FiPlus, FiPackage, FiAward, FiTrendingUp, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { marketplaceApi, MarketplaceTheme } from '../services/api';

interface ThemeShopProps {
  onThemeInstalled?: () => void;
}

type ViewMode = 'grid' | 'list';
type CategoryFilter = 'all' | 'blog' | 'business' | 'portfolio' | 'ecommerce';

interface SubmitFormData {
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string;
  features: string;
  demoUrl: string;
  repositoryUrl: string;
}

export default function ThemeShop({ onThemeInstalled }: ThemeShopProps) {
  const [themes, setThemes] = useState<MarketplaceTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'newest' | 'name'>('downloads');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitThumbnail, setSubmitThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [submitForm, setSubmitForm] = useState<SubmitFormData>({
    name: '', description: '', version: '1.0.0', category: 'blog',
    tags: '', features: '', demoUrl: '', repositoryUrl: '',
  });
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, featured: 0, totalDownloads: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Fetch themes from API
  const fetchThemes = async () => {
    setLoading(true);
    try {
      const response = await marketplaceApi.getThemes({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchTerm || undefined,
        sortBy,
        page: pagination.page,
        limit: pagination.limit,
      });
      setThemes(response.data.themes);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch themes:', error);
      // Show empty state if API fails
      setThemes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await marketplaceApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchThemes();
    fetchStats();
  }, [categoryFilter, sortBy, pagination.page]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pagination.page === 1) {
        fetchThemes();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const categories: { key: CategoryFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'All Themes', icon: '🎨' },
    { key: 'blog', label: 'Blog', icon: '📝' },
    { key: 'business', label: 'Business', icon: '💼' },
    { key: 'portfolio', label: 'Portfolio', icon: '🖼️' },
    { key: 'ecommerce', label: 'E-Commerce', icon: '🛒' },
  ];

  const handleInstall = async (theme: MarketplaceTheme) => {
    setInstalling(theme.id);
    try {
      toast(`Installing ${theme.name}...`, { icon: 'ℹ️' });
      await marketplaceApi.installTheme(theme.id);
      toast.success(`${theme.name} installed successfully!`);
      fetchThemes(); // Refresh to update download count
      if (onThemeInstalled) {
        onThemeInstalled();
      }
    } catch (error: any) {
      console.error('Installation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Installation failed';
      if (errorMessage.includes('already exists')) {
        toast.error(`${theme.name} is already installed. Delete it first to reinstall.`);
      } else {
        toast.error(`Failed to install ${theme.name}: ${errorMessage}`);
      }
    } finally {
      setInstalling(null);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmitThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitTheme = async () => {
    if (!submitFile) {
      toast.error('Please select a theme ZIP file');
      return;
    }
    if (!submitForm.name.trim()) {
      toast.error('Please enter a theme name');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', submitFile);
      if (submitThumbnail) formData.append('thumbnail', submitThumbnail);
      formData.append('name', submitForm.name);
      formData.append('description', submitForm.description);
      formData.append('version', submitForm.version);
      formData.append('category', submitForm.category);
      if (submitForm.tags) formData.append('tags', submitForm.tags);
      if (submitForm.features) formData.append('features', submitForm.features);
      if (submitForm.demoUrl) formData.append('demoUrl', submitForm.demoUrl);
      if (submitForm.repositoryUrl) formData.append('repositoryUrl', submitForm.repositoryUrl);

      await marketplaceApi.submitTheme(formData);
      toast.success('Theme submitted successfully! It will be reviewed by an admin.');
      setShowSubmitModal(false);
      setSubmitFile(null);
      setSubmitThumbnail(null);
      setThumbnailPreview(null);
      setSubmitForm({ name: '', description: '', version: '1.0.0', category: 'blog', tags: '', features: '', demoUrl: '', repositoryUrl: '' });
      fetchThemes();
      fetchStats();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit theme');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={12}
            className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg"><FiPackage className="text-violet-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Total Themes</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg"><FiCheck className="text-emerald-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
              <p className="text-xs text-slate-400">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg"><FiAward className="text-amber-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.featured}</p>
              <p className="text-xs text-slate-400">Featured</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg"><FiTrendingUp className="text-blue-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalDownloads.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Downloads</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            🎨 Theme Marketplace
          </h3>
          <p className="text-slate-400 text-sm mt-1">Browse and install beautiful themes for your site</p>
        </div>

        {/* Search and View Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <FiUpload size={16} />
            Submit Theme
          </button>
          <div className="relative flex-1 lg:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search themes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="downloads">Most Downloads</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="name">Name A-Z</option>
          </select>

          {/* View Toggle */}
          <div className="flex bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <FiGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <FiList size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              categoryFilter === cat.key
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
        <div className="ml-auto text-sm text-slate-500 flex items-center">
          <FiFilter className="mr-1" />
          {pagination.total} {pagination.total === 1 ? 'theme' : 'themes'}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="animate-spin text-violet-400" size={32} />
          <span className="ml-3 text-slate-400">Loading themes...</span>
        </div>
      )}

      {/* Theme Grid */}
      {!loading && (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
          : 'flex flex-col gap-4'
        }>
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`group bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-violet-500/50 transition-all duration-300 ${
              viewMode === 'list' ? 'flex' : ''
            }`}
            onMouseEnter={() => setHoveredTheme(theme.id)}
            onMouseLeave={() => setHoveredTheme(null)}
          >
            {/* Image */}
            <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
              <img
                src={theme.thumbnailUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop'}
                alt={theme.name}
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${viewMode === 'list' ? 'h-full' : 'h-48'}`}
              />

              {/* Overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-center pb-4 transition-opacity duration-300 ${
                hoveredTheme === theme.id ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleInstall(theme)}
                    disabled={installing === theme.id}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all flex items-center gap-2 shadow-lg"
                  >
                    {installing === theme.id ? (
                      <><FiLoader className="animate-spin" size={14} /> Installing...</>
                    ) : (
                      <><FiDownload size={14} /> Install</>
                    )}
                  </button>
                  {theme.demoUrl && (
                    <a
                      href={theme.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white/20 backdrop-blur text-white text-sm rounded-lg hover:bg-white/30 transition-all flex items-center"
                    >
                      <FiEye size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {theme.isFeatured && (
                  <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-lg flex items-center gap-1">
                    <FiAward size={10} /> Featured
                  </span>
                )}
                {theme.isPremium && (
                  <span className="px-2 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-medium rounded-lg">
                    ⭐ Premium
                  </span>
                )}
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 bg-emerald-500/90 backdrop-blur text-white text-xs font-medium rounded-lg">
                  {theme.price > 0 ? `$${theme.price}` : 'Free'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className={`p-4 flex-1 ${viewMode === 'list' ? 'flex flex-col justify-between' : ''}`}>
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors">{theme.name}</h4>
                    <p className="text-xs text-slate-500">by {theme.author}</p>
                  </div>
                  <button className="text-slate-500 hover:text-pink-400 transition-colors">
                    <FiHeart size={16} />
                  </button>
                </div>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{theme.description}</p>

                {/* Features */}
                {theme.features && theme.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {theme.features.slice(0, 3).map((feature, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs rounded-md">
                        {feature}
                      </span>
                    ))}
                    {theme.features.length > 3 && (
                      <span className="px-2 py-0.5 bg-slate-700/50 text-slate-500 text-xs rounded-md">
                        +{theme.features.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    {renderStars(theme.rating)}
                    <span className="text-slate-400 ml-1">{theme.rating.toFixed(1)}</span>
                    {theme.ratingCount > 0 && <span className="text-slate-600">({theme.ratingCount})</span>}
                  </div>
                  <span>•</span>
                  <span>{theme.downloads.toLocaleString()} installs</span>
                </div>
                <span className="text-xs text-slate-600">v{theme.version}</span>
              </div>

              {/* Actions (visible in list view or mobile) */}
              {viewMode === 'list' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleInstall(theme)}
                    disabled={installing === theme.id}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50"
                  >
                    {installing === theme.id ? (
                      <><FiLoader className="mr-2 animate-spin" size={14} /> Installing...</>
                    ) : (
                      <><FiDownload className="mr-2" size={14} /> Install Theme</>
                    )}
                  </button>
                  {theme.demoUrl && (
                    <a
                      href={theme.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-700 text-slate-300 text-sm rounded-xl hover:bg-slate-600 transition-all flex items-center"
                    >
                      <FiExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && themes.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No themes found</h3>
          <p className="text-slate-400">
            {searchTerm
              ? `No themes match "${searchTerm}" in ${categoryFilter === 'all' ? 'all categories' : categoryFilter}`
              : 'Be the first to submit a theme to the marketplace!'}
          </p>
          <button
            onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}
            className="mt-4 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-slate-400 px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Info Cards */}
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
            📦 How to Install Themes
          </h4>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <FiCheck className="text-emerald-400 mt-0.5 flex-shrink-0" size={14} />
              <span>Click <strong className="text-slate-300">Install</strong> on any theme to add it to your site</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="text-emerald-400 mt-0.5 flex-shrink-0" size={14} />
              <span>Themes are downloaded and installed automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="text-emerald-400 mt-0.5 flex-shrink-0" size={14} />
              <span>Hover over any theme to see quick actions</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
          <h4 className="text-sm font-semibold text-violet-400 mb-2 flex items-center gap-2">
            🚀 Submit Your Own Theme
          </h4>
          <p className="text-sm text-slate-400 mb-2">
            Share your theme with the community! Click <strong className="text-emerald-400">Submit Theme</strong> to upload your theme ZIP file.
          </p>
          <p className="text-xs text-slate-500">
            Themes are reviewed by admins before being published to the marketplace.
          </p>
        </div>
      </div>

      {/* Submit Theme Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FiUpload className="text-emerald-400" />
                Submit Theme to Marketplace
              </h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Theme ZIP File *</label>
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-violet-500/50 transition-colors">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="theme-file"
                  />
                  <label htmlFor="theme-file" className="cursor-pointer">
                    {submitFile ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-400">
                        <FiPackage size={24} />
                        <span>{submitFile.name}</span>
                      </div>
                    ) : (
                      <div className="text-slate-400">
                        <FiUpload size={32} className="mx-auto mb-2" />
                        <p>Click to select or drag & drop your theme ZIP</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Theme Thumbnail (optional)</label>
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-4 hover:border-violet-500/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    id="theme-thumbnail"
                  />
                  <label htmlFor="theme-thumbnail" className="cursor-pointer flex items-center gap-4">
                    {thumbnailPreview ? (
                      <>
                        <img src={thumbnailPreview} alt="Thumbnail preview" className="w-24 h-16 object-cover rounded-lg" />
                        <div className="text-emerald-400">
                          <p className="font-medium">{submitThumbnail?.name}</p>
                          <p className="text-xs text-slate-500">Click to change</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-400 flex items-center gap-3">
                        <div className="w-24 h-16 bg-slate-700/50 rounded-lg flex items-center justify-center">
                          <FiImage size={24} />
                        </div>
                        <div>
                          <p>Upload a preview image</p>
                          <p className="text-xs text-slate-500">Recommended: 800x600px</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Theme Name *</label>
                <input
                  type="text"
                  value={submitForm.name}
                  onChange={(e) => setSubmitForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Awesome Theme"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={submitForm.description}
                  onChange={(e) => setSubmitForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your theme..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                />
              </div>

              {/* Version & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Version</label>
                  <input
                    type="text"
                    value={submitForm.version}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="1.0.0"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    value={submitForm.category}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  >
                    <option value="blog">Blog</option>
                    <option value="business">Business</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="ecommerce">E-Commerce</option>
                  </select>
                </div>
              </div>

              {/* Tags & Features */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={submitForm.tags}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="modern, responsive, dark"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Features (comma-separated)</label>
                  <input
                    type="text"
                    value={submitForm.features}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, features: e.target.value }))}
                    placeholder="SEO, Dark Mode, Fast"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Demo URL</label>
                  <input
                    type="url"
                    value={submitForm.demoUrl}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, demoUrl: e.target.value }))}
                    placeholder="https://demo.example.com"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Repository URL</label>
                  <input
                    type="url"
                    value={submitForm.repositoryUrl}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, repositoryUrl: e.target.value }))}
                    placeholder="https://github.com/user/theme"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700/50 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-6 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTheme}
                disabled={submitting || !submitFile || !submitForm.name.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <><FiLoader className="animate-spin" size={16} /> Submitting...</>
                ) : (
                  <><FiPlus size={16} /> Submit Theme</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


