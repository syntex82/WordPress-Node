/**
 * Theme Shop Component
 * Browse and install themes from the marketplace
 */

import { useState } from 'react';
import { FiDownload, FiStar, FiExternalLink, FiLoader, FiSearch, FiGrid, FiList, FiFilter, FiCheck, FiHeart, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { themesApi } from '../services/api';

interface Theme {
  id: string;
  name: string;
  author: string;
  description: string;
  thumbnail: string;
  downloadUrl: string;
  demoUrl: string;
  rating: number;
  downloads: number;
  version: string;
  price: string;
  category: 'blog' | 'business' | 'portfolio' | 'ecommerce';
  features: string[];
  isPremium?: boolean;
}

// Theme marketplace - Add your GitHub repositories here
// Format: https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip
const SAMPLE_THEMES: Theme[] = [
  {
    id: 'modern-blog',
    name: 'Modern Blog',
    author: 'WordPress Node',
    description: 'A beautiful, modern blog theme with clean typography, responsive design, and elegant animations. Perfect for bloggers and content creators.',
    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop',
    downloadUrl: 'LOCAL',
    demoUrl: '#',
    rating: 5.0,
    downloads: 0,
    version: '1.0.0',
    price: 'Free',
    category: 'blog',
    features: ['Responsive', 'SEO Optimized', 'Dark Mode', 'Fast Loading'],
  },
  {
    id: 'minimal-blog',
    name: 'Minimal Blog',
    author: 'Community',
    description: 'A clean and minimal blog theme with focus on typography and readability.',
    thumbnail: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop',
    downloadUrl: 'https://github.com/yourusername/minimal-blog-theme/archive/refs/heads/main.zip',
    demoUrl: '#',
    rating: 4.8,
    downloads: 1250,
    version: '1.2.0',
    price: 'Free',
    category: 'blog',
    features: ['Minimal Design', 'Typography Focus', 'Mobile First'],
  },
  {
    id: 'business-pro',
    name: 'Business Pro',
    author: 'Community',
    description: 'Professional business theme with modern design and powerful features for enterprises.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    downloadUrl: 'https://github.com/yourusername/business-pro-theme/archive/refs/heads/main.zip',
    demoUrl: '#',
    rating: 4.9,
    downloads: 2100,
    version: '2.0.1',
    price: 'Free',
    category: 'business',
    features: ['Contact Forms', 'Team Section', 'Services', 'Testimonials'],
    isPremium: true,
  },
  {
    id: 'portfolio-creative',
    name: 'Portfolio Creative',
    author: 'Community',
    description: 'Showcase your work with this stunning portfolio theme with gallery layouts.',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&h=600&fit=crop',
    downloadUrl: 'https://github.com/yourusername/portfolio-creative-theme/archive/refs/heads/main.zip',
    demoUrl: '#',
    rating: 4.7,
    downloads: 890,
    version: '1.5.2',
    price: 'Free',
    category: 'portfolio',
    features: ['Gallery', 'Lightbox', 'Filtering', 'Animations'],
  },
  {
    id: 'ecommerce-starter',
    name: 'E-Commerce Starter',
    author: 'Community',
    description: 'Complete e-commerce theme with product pages, cart, and checkout integration.',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    downloadUrl: 'https://github.com/yourusername/ecommerce-starter-theme/archive/refs/heads/main.zip',
    demoUrl: '#',
    rating: 4.6,
    downloads: 1850,
    version: '1.0.0',
    price: 'Free',
    category: 'ecommerce',
    features: ['Product Grid', 'Cart', 'Checkout', 'Reviews'],
    isPremium: true,
  },
  {
    id: 'developer-docs',
    name: 'Developer Docs',
    author: 'Community',
    description: 'Documentation theme perfect for API docs, guides, and technical content.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
    downloadUrl: 'https://github.com/yourusername/developer-docs-theme/archive/refs/heads/main.zip',
    demoUrl: '#',
    rating: 4.9,
    downloads: 3200,
    version: '2.1.0',
    price: 'Free',
    category: 'blog',
    features: ['Code Highlighting', 'Search', 'Navigation', 'Dark Mode'],
  },
];

interface ThemeShopProps {
  onThemeInstalled?: () => void;
}

type ViewMode = 'grid' | 'list';
type CategoryFilter = 'all' | 'blog' | 'business' | 'portfolio' | 'ecommerce';

export default function ThemeShop({ onThemeInstalled }: ThemeShopProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  const filteredThemes = SAMPLE_THEMES.filter(theme => {
    const matchesSearch = !searchTerm ||
      theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || theme.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories: { key: CategoryFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'All Themes', icon: '🎨' },
    { key: 'blog', label: 'Blog', icon: '📝' },
    { key: 'business', label: 'Business', icon: '💼' },
    { key: 'portfolio', label: 'Portfolio', icon: '🖼️' },
    { key: 'ecommerce', label: 'E-Commerce', icon: '🛒' },
  ];

  const handleInstall = async (theme: Theme) => {
    setInstalling(theme.id);
    try {
      let file: File;

      if (theme.downloadUrl === 'LOCAL') {
        // For local themes, create a ZIP from the theme directory
        // This is handled by the backend - we just need to trigger it
        toast(`Installing ${theme.name} from local files...`, { icon: 'ℹ️' });

        // Create a marker file to indicate local installation
        const markerBlob = new Blob([JSON.stringify({ type: 'local', themeId: theme.id })], { type: 'application/json' });
        file = new File([markerBlob], `${theme.id}-local.json`, { type: 'application/json' });

        // For now, show a message that the theme is already available locally
        toast.success(`${theme.name} is available locally! Click "Scan Themes" to detect it.`);

        if (onThemeInstalled) {
          onThemeInstalled();
        }
        setInstalling(null);
        return;
      }

      // Download the theme ZIP file from GitHub or other URL
      toast(`Downloading ${theme.name}...`, { icon: 'ℹ️' });
      const response = await fetch(theme.downloadUrl);

      if (!response.ok) {
        throw new Error('Failed to download theme from repository');
      }

      const blob = await response.blob();
      file = new File([blob], `${theme.id}.zip`, { type: 'application/zip' });

      // Upload to the server
      toast(`Installing ${theme.name}...`, { icon: 'ℹ️' });
      await themesApi.upload(file);

      toast.success(`${theme.name} installed successfully!`);

      // Notify parent component to refresh theme list
      if (onThemeInstalled) {
        onThemeInstalled();
      }
    } catch (error: any) {
      console.error('Installation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Installation failed';

      if (errorMessage.includes('already exists')) {
        toast.error(`${theme.name} is already installed. Delete it first to reinstall.`);
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        toast.error(`Theme repository not found. Please check the GitHub URL or create the repository first.`);
      } else {
        toast.error(`Failed to install ${theme.name}: ${errorMessage}`);
      }
    } finally {
      setInstalling(null);
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
          {filteredThemes.length} {filteredThemes.length === 1 ? 'theme' : 'themes'}
        </div>
      </div>

      {/* Theme Grid */}
      <div className={viewMode === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
        : 'flex flex-col gap-4'
      }>
        {filteredThemes.map((theme) => (
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
                src={theme.thumbnail}
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
                  <a
                    href={theme.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-white/20 backdrop-blur text-white text-sm rounded-lg hover:bg-white/30 transition-all flex items-center"
                  >
                    <FiEye size={14} />
                  </a>
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {theme.downloadUrl === 'LOCAL' && (
                  <span className="px-2 py-1 bg-emerald-500/90 backdrop-blur text-white text-xs font-medium rounded-lg flex items-center gap-1">
                    <FiCheck size={10} /> Local
                  </span>
                )}
                {theme.isPremium && (
                  <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-lg">
                    ⭐ Premium
                  </span>
                )}
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 bg-emerald-500/90 backdrop-blur text-white text-xs font-medium rounded-lg">
                  {theme.price}
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
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    {renderStars(theme.rating)}
                    <span className="text-slate-400 ml-1">{theme.rating}</span>
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
                  <a
                    href={theme.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-700 text-slate-300 text-sm rounded-xl hover:bg-slate-600 transition-all flex items-center"
                  >
                    <FiExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredThemes.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No themes found</h3>
          <p className="text-slate-400">No themes match "{searchTerm}" in {categoryFilter === 'all' ? 'all categories' : categoryFilter}</p>
          <button
            onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}
            className="mt-4 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
          >
            Clear Filters
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
              <span><strong className="text-slate-300">Local themes</strong> are ready - just click "Scan Themes"</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="text-emerald-400 mt-0.5 flex-shrink-0" size={14} />
              <span>Other themes download from GitHub automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="text-emerald-400 mt-0.5 flex-shrink-0" size={14} />
              <span>Hover over any theme to see quick actions</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
          <h4 className="text-sm font-semibold text-violet-400 mb-2 flex items-center gap-2">
            🚀 Add Your Own Theme
          </h4>
          <p className="text-sm text-slate-400 mb-2">
            Add themes from GitHub by editing <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-violet-400 text-xs">ThemeShop.tsx</code>
          </p>
          <p className="text-xs text-slate-500">
            Use format: <code className="text-slate-400">https://github.com/user/repo/archive/refs/heads/main.zip</code>
          </p>
        </div>
      </div>
    </div>
  );
}


