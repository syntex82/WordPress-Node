/**
 * AI Theme Generator Modal
 * Generates complete, marketplace-ready themes with all pages and blocks
 */

import { useState } from 'react';
import { FiX, FiLoader, FiCheck, FiAlertCircle, FiShoppingCart, FiBook, FiFileText, FiVideo, FiUsers, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { customThemesApi } from '../../services/api';

type IndustryType = 'technology' | 'ecommerce' | 'education' | 'healthcare' | 'finance' | 'restaurant' | 'portfolio' | 'blog' | 'agency' | 'nonprofit' | 'entertainment' | 'fitness' | 'travel' | 'realestate' | 'saas' | 'general';

interface AiThemeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeGenerated: (theme: any) => void;
}

const INDUSTRIES: { value: IndustryType; label: string }[] = [
  { value: 'general', label: '🌐 General Purpose' },
  { value: 'ecommerce', label: '🛒 E-commerce / Shop' },
  { value: 'education', label: '📚 Education / Courses' },
  { value: 'blog', label: '✍️ Blog / Magazine' },
  { value: 'portfolio', label: '🎨 Portfolio / Creative' },
  { value: 'agency', label: '💼 Agency / Business' },
  { value: 'saas', label: '💻 SaaS / Technology' },
  { value: 'restaurant', label: '🍕 Restaurant / Food' },
  { value: 'fitness', label: '💪 Fitness / Gym' },
  { value: 'healthcare', label: '🏥 Healthcare / Medical' },
  { value: 'realestate', label: '🏠 Real Estate' },
  { value: 'travel', label: '✈️ Travel / Tourism' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'nonprofit', label: '❤️ Nonprofit / Charity' },
  { value: 'finance', label: '💰 Finance / Banking' },
];

export function AiThemeGeneratorModal({
  isOpen,
  onClose,
  onThemeGenerated,
}: AiThemeGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [themeName, setThemeName] = useState('');
  const [description, setDescription] = useState('');
  const [numberOfPages, setNumberOfPages] = useState(5);
  const [style, setStyle] = useState<'modern' | 'minimal' | 'bold' | 'professional' | 'creative'>('modern');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [industry, setIndustry] = useState<IndustryType>('general');
  const [includeEcommerce, setIncludeEcommerce] = useState(true);
  const [includeBlog, setIncludeBlog] = useState(true);
  const [includeCourses, setIncludeCourses] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe the theme you want to create');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await customThemesApi.generateAiTheme({
        prompt,
        themeName: themeName || `AI Theme ${new Date().toLocaleDateString()}`,
        description: description || prompt.substring(0, 100),
        numberOfPages,
        style,
        colorScheme,
        industry,
        includeEcommerce,
        includeBlog,
        includeCourses,
        generateFullTheme: true,
        pageTypes: ['home', 'about', 'contact', ...(includeEcommerce ? ['shop', 'products'] : []), ...(includeBlog ? ['blog'] : []), ...(includeCourses ? ['courses'] : [])],
        preferredBlocks: ['hero', 'features', 'testimonials', 'cta', 'newsletter', 'stats', ...(includeEcommerce ? ['productGrid', 'pricing'] : []), ...(includeBlog ? ['blogPosts'] : []), ...(includeCourses ? ['courseGrid'] : [])],
        features: {
          darkMode: colorScheme === 'auto' || colorScheme === 'dark',
          animations: true,
          responsiveImages: true,
          lazyLoading: true,
          stickyHeader: true,
          backToTop: true,
          newsletter: true,
        },
      });

      toast.success('Theme generated successfully!');
      onThemeGenerated(response.data);
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate theme';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">AI Theme Generator</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe Your Theme *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Modern e-commerce theme with blue color scheme and minimalist design"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 bg-white placeholder-gray-400"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Be specific about colors, style, and purpose for best results
            </p>
          </div>

          {/* Theme Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme Name (Optional)
            </label>
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="My Custom Theme"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 bg-white placeholder-gray-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Theme description"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 bg-white placeholder-gray-400"
            />
          </div>

          {/* Industry Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry / Theme Type
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value as IndustryType)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 bg-white"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          </div>

          {/* Grid: Style, Color Scheme, Pages */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 bg-white"
              >
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="bold">Bold</option>
                <option value="professional">Professional</option>
                <option value="creative">Creative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Scheme
              </label>
              <select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value as any)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 bg-white"
              >
                <option value="auto">Auto (Light + Dark)</option>
                <option value="light">Light Only</option>
                <option value="dark">Dark Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Pages
              </label>
              <select
                value={numberOfPages}
                onChange={(e) => setNumberOfPages(parseInt(e.target.value))}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 bg-white"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} pages
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feature Toggles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Include Features
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${includeEcommerce ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={includeEcommerce}
                  onChange={(e) => setIncludeEcommerce(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <FiShoppingCart className="text-gray-600" />
                <span className="text-sm text-gray-700">Shop</span>
              </label>

              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${includeBlog ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={includeBlog}
                  onChange={(e) => setIncludeBlog(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <FiFileText className="text-gray-600" />
                <span className="text-sm text-gray-700">Blog</span>
              </label>

              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${includeCourses ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={includeCourses}
                  onChange={(e) => setIncludeCourses(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <FiBook className="text-gray-600" />
                <span className="text-sm text-gray-700">Courses</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected features will include relevant pages, blocks, and content
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FiCheck />
                Generate Theme
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

