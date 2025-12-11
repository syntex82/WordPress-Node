/**
 * Theme Shop Component
 * Browse and install themes from the marketplace
 */

import { useState } from 'react';
import { FiDownload, FiStar, FiExternalLink, FiLoader } from 'react-icons/fi';
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
    downloadUrl: 'LOCAL', // Special marker for locally available theme
    demoUrl: '#',
    rating: 5.0,
    downloads: 0,
    version: '1.0.0',
    price: 'Free',
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
  },
  {
    id: 'business-pro',
    name: 'Business Pro',
    author: 'Community',
    description: 'Professional business theme with modern design and powerful features.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    downloadUrl: 'https://github.com/yourusername/business-pro-theme/archive/refs/heads/main.zip',
    demoUrl: '#',
    rating: 4.9,
    downloads: 2100,
    version: '2.0.1',
    price: 'Free',
  },
  {
    id: 'portfolio-creative',
    name: 'Portfolio Creative',
    author: 'Community',
    description: 'Showcase your work with this stunning portfolio theme.',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&h=600&fit=crop',
    downloadUrl: 'https://github.com/yourusername/portfolio-creative-theme/archive/refs/heads/main.zip',
    demoUrl: '#',
    rating: 4.7,
    downloads: 890,
    version: '1.5.2',
    price: 'Free',
  },
];

interface ThemeShopProps {
  onThemeInstalled?: () => void;
}

export default function ThemeShop({ onThemeInstalled }: ThemeShopProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);

  const filteredThemes = SAMPLE_THEMES.filter(theme => {
    if (!searchTerm) return true;
    return theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           theme.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Theme Marketplace</h3>
        <div className="flex-1 max-w-md mx-4">
          <input
            type="text"
            placeholder="Search themes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredThemes.length} {filteredThemes.length === 1 ? 'theme' : 'themes'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThemes.map((theme) => (
          <div key={theme.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img src={theme.thumbnail} alt={theme.name} className="w-full h-48 object-cover" />
              <div className="absolute top-2 right-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                  Free
                </span>
              </div>
            </div>
            <div className="p-4">
              <h4 className="text-lg font-semibold mb-1">{theme.name}</h4>
              <p className="text-xs text-gray-500 mb-2">by {theme.author}</p>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{theme.description}</p>
              
              <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                <div className="flex items-center">
                  <FiStar className="text-yellow-500 mr-1" size={14} />
                  <span>{theme.rating}</span>
                </div>
                <span>{theme.downloads.toLocaleString()} downloads</span>
                <span>v{theme.version}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleInstall(theme)}
                  disabled={installing === theme.id}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {installing === theme.id ? (
                    <>
                      <FiLoader className="mr-2 animate-spin" size={14} />
                      Installing...
                    </>
                  ) : (
                    <>
                      <FiDownload className="mr-2" size={14} />
                      Install Theme
                    </>
                  )}
                </button>
                <a
                  href={theme.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center"
                  title="View Demo"
                >
                  <FiExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredThemes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No themes found matching "{searchTerm}"</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            <strong>📦 How to Install Themes:</strong>
          </p>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li><strong>Modern Blog</strong> is already available locally - just click "Scan Themes" to detect it</li>
            <li>Other themes will download from GitHub when you click "Install Theme"</li>
            <li>To add your own GitHub theme, edit <code className="bg-blue-100 px-1 rounded">admin/src/components/ThemeShop.tsx</code></li>
          </ul>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 mb-2">
            <strong>🚀 Add Your GitHub Theme:</strong>
          </p>
          <p className="text-sm text-green-800 mb-2">
            To add a theme from GitHub, add it to the SAMPLE_THEMES array with this format:
          </p>
          <pre className="text-xs bg-green-100 p-2 rounded overflow-x-auto text-green-900">
{`{
  id: 'my-theme',
  name: 'My Theme',
  author: 'Your Name',
  description: 'Theme description',
  thumbnail: 'https://...',
  downloadUrl: 'https://github.com/user/repo/archive/refs/heads/main.zip',
  demoUrl: '#',
  rating: 5.0,
  downloads: 0,
  version: '1.0.0',
  price: 'Free',
}`}</pre>
        </div>
      </div>
    </div>
  );
}


