/**
 * AI Theme Generator Modal
 * Generates complete, marketplace-ready themes with all pages and blocks
 * Works with AI when configured, or uses beautiful presets as fallback
 */

import { useState, useEffect } from 'react';
import { FiX, FiLoader, FiCheck, FiAlertCircle, FiShoppingCart, FiBook, FiFileText, FiInfo, FiZap, FiPackage, FiGrid, FiEdit3 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { customThemesApi } from '../../services/api';

// Preset type for display
interface PresetInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  tags: string[];
  industry: string;
  style: string;
  colorScheme: string;
  primaryColor: string;
  secondaryColor: string;
}

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

// Predefined prompts for quick selection
interface PredefinedPrompt {
  icon: string;
  label: string;
  prompt: string;
  industry: IndustryType;
  style: 'modern' | 'minimal' | 'bold' | 'professional' | 'creative';
  colorScheme: 'light' | 'dark' | 'auto';
  includeEcommerce?: boolean;
  includeBlog?: boolean;
  includeCourses?: boolean;
}

const PREDEFINED_PROMPTS: PredefinedPrompt[] = [
  // 🔥 Cyberpunk / Gaming
  {
    icon: '🎮',
    label: 'Cyberpunk Gaming',
    prompt: 'Futuristic cyberpunk theme with neon glows (cyan, magenta, purple), dark mode, glassmorphism panels, holographic UI elements, glitch animations, and a Neo-Tokyo dystopian aesthetic. Perfect for gaming platforms and tech startups.',
    industry: 'technology',
    style: 'bold',
    colorScheme: 'dark',
    includeEcommerce: true,
    includeBlog: true,
    includeCourses: true,
  },
  // 🛒 E-commerce
  {
    icon: '🛍️',
    label: 'Modern E-commerce',
    prompt: 'Clean, modern e-commerce theme with a minimalist design, soft shadows, and a focus on product imagery. Use a neutral color palette with a vibrant accent color for CTAs. Include product grids, filters, and a seamless checkout experience.',
    industry: 'ecommerce',
    style: 'modern',
    colorScheme: 'light',
    includeEcommerce: true,
    includeBlog: true,
  },
  {
    icon: '👗',
    label: 'Luxury Fashion',
    prompt: 'Elegant luxury fashion boutique theme with sophisticated typography, gold accents on cream backgrounds, high-end imagery, and refined animations. Showcase premium products with style and exclusivity.',
    industry: 'ecommerce',
    style: 'minimal',
    colorScheme: 'light',
    includeEcommerce: true,
    includeBlog: true,
  },
  // 📚 Education / LMS
  {
    icon: '🎓',
    label: 'Online Learning Platform',
    prompt: 'Modern e-learning platform with a friendly, approachable design. Use calming blues and greens, clear typography, progress indicators, video course layouts, and gamification elements like badges and certificates.',
    industry: 'education',
    style: 'modern',
    colorScheme: 'auto',
    includeCourses: true,
    includeBlog: true,
  },
  {
    icon: '📖',
    label: 'Kids Education',
    prompt: 'Fun and colorful educational theme for children with playful illustrations, rounded shapes, bright primary colors, interactive elements, and engaging animations. Perfect for kids learning platforms.',
    industry: 'education',
    style: 'creative',
    colorScheme: 'light',
    includeCourses: true,
  },
  // 💼 Business / Agency
  {
    icon: '🏢',
    label: 'Corporate Business',
    prompt: 'Professional corporate website with a clean, trustworthy design. Use navy blue and white color scheme, structured layouts, team showcases, service offerings, and client testimonials. Convey reliability and expertise.',
    industry: 'agency',
    style: 'professional',
    colorScheme: 'light',
    includeBlog: true,
  },
  {
    icon: '🚀',
    label: 'SaaS Startup',
    prompt: 'Modern SaaS product website with gradient backgrounds, floating UI elements, feature showcases, pricing tables, and interactive demos. Use vibrant purples and blues with smooth animations.',
    industry: 'saas',
    style: 'modern',
    colorScheme: 'auto',
    includeBlog: true,
  },
  {
    icon: '⚖️',
    label: 'Law Firm',
    prompt: 'Prestigious law firm website with a conservative, professional design. Use dark navy, gold accents, serif typography, attorney profiles, practice area pages, and trust-building elements.',
    industry: 'finance',
    style: 'professional',
    colorScheme: 'light',
    includeBlog: true,
  },
  // 🎨 Creative / Portfolio
  {
    icon: '🎨',
    label: 'Creative Portfolio',
    prompt: 'Bold creative portfolio with asymmetric layouts, dramatic typography, dark backgrounds with vibrant accent colors, project showcases, and artistic animations. Make a strong visual statement.',
    industry: 'portfolio',
    style: 'creative',
    colorScheme: 'dark',
    includeBlog: true,
  },
  {
    icon: '📸',
    label: 'Photography Portfolio',
    prompt: 'Minimal photography portfolio with full-screen image galleries, subtle animations, clean white space, and elegant typography. Let the photos be the hero with a gallery-focused layout.',
    industry: 'portfolio',
    style: 'minimal',
    colorScheme: 'light',
  },
  // 🍕 Restaurant / Food
  {
    icon: '🍕',
    label: 'Restaurant & Cafe',
    prompt: 'Warm, inviting restaurant theme with appetizing food photography, menu displays, reservation system, warm earth tones (terracotta, olive, cream), and a cozy, welcoming atmosphere.',
    industry: 'restaurant',
    style: 'modern',
    colorScheme: 'light',
    includeEcommerce: true,
  },
  {
    icon: '☕',
    label: 'Artisan Coffee Shop',
    prompt: 'Hipster coffee shop theme with rustic textures, hand-drawn elements, brown and cream tones, vintage typography, and a cozy indie aesthetic. Include menu and online ordering.',
    industry: 'restaurant',
    style: 'creative',
    colorScheme: 'light',
    includeEcommerce: true,
  },
  // 🏥 Healthcare
  {
    icon: '🏥',
    label: 'Medical Clinic',
    prompt: 'Clean, trustworthy healthcare website with calming blues and greens, professional imagery, doctor profiles, service listings, appointment booking, and HIPAA-compliant design principles.',
    industry: 'healthcare',
    style: 'professional',
    colorScheme: 'light',
    includeBlog: true,
  },
  {
    icon: '🧘',
    label: 'Wellness & Spa',
    prompt: 'Serene wellness spa theme with soft pastels, organic shapes, calming imagery, service menus, booking system, and a zen-like atmosphere. Focus on relaxation and self-care.',
    industry: 'healthcare',
    style: 'minimal',
    colorScheme: 'light',
    includeEcommerce: true,
  },
  // 💪 Fitness
  {
    icon: '💪',
    label: 'Fitness Gym',
    prompt: 'High-energy fitness gym theme with bold colors (red, black, yellow), dynamic imagery, class schedules, trainer profiles, membership plans, and motivational design elements.',
    industry: 'fitness',
    style: 'bold',
    colorScheme: 'dark',
    includeEcommerce: true,
    includeBlog: true,
  },
  {
    icon: '🧘‍♀️',
    label: 'Yoga Studio',
    prompt: 'Peaceful yoga studio theme with soft earth tones, flowing shapes, serene imagery, class schedules, instructor bios, and a mindful, calming aesthetic.',
    industry: 'fitness',
    style: 'minimal',
    colorScheme: 'light',
    includeCourses: true,
  },
  // 🏠 Real Estate
  {
    icon: '🏠',
    label: 'Luxury Real Estate',
    prompt: 'Premium real estate theme with elegant design, property listings with advanced filters, virtual tour integration, agent profiles, gold and navy color scheme, and luxury property showcases.',
    industry: 'realestate',
    style: 'professional',
    colorScheme: 'light',
    includeBlog: true,
  },
  // ✈️ Travel
  {
    icon: '✈️',
    label: 'Travel Agency',
    prompt: 'Inspiring travel theme with stunning destination imagery, trip packages, booking system, customer reviews, vibrant colors, and wanderlust-inducing design. Make people want to explore.',
    industry: 'travel',
    style: 'modern',
    colorScheme: 'light',
    includeEcommerce: true,
    includeBlog: true,
  },
  {
    icon: '🏨',
    label: 'Boutique Hotel',
    prompt: 'Sophisticated boutique hotel theme with elegant typography, room showcases, amenity highlights, booking integration, and a luxurious yet welcoming atmosphere.',
    industry: 'travel',
    style: 'minimal',
    colorScheme: 'light',
    includeEcommerce: true,
  },
  // ❤️ Nonprofit
  {
    icon: '❤️',
    label: 'Nonprofit Charity',
    prompt: 'Heartfelt nonprofit theme with emotional imagery, impact stories, donation system, volunteer signup, event calendar, and warm, compassionate colors that inspire action.',
    industry: 'nonprofit',
    style: 'modern',
    colorScheme: 'light',
    includeBlog: true,
  },
  // 🎬 Entertainment
  {
    icon: '🎬',
    label: 'Entertainment & Media',
    prompt: 'Dynamic entertainment theme with bold visuals, video showcases, event listings, dark backgrounds with vibrant accents, and an exciting, immersive experience.',
    industry: 'entertainment',
    style: 'bold',
    colorScheme: 'dark',
    includeBlog: true,
    includeEcommerce: true,
  },
  {
    icon: '🎵',
    label: 'Music & Artist',
    prompt: 'Edgy music artist theme with dark aesthetics, album showcases, tour dates, music player integration, merchandise shop, and a rock-and-roll vibe.',
    industry: 'entertainment',
    style: 'bold',
    colorScheme: 'dark',
    includeEcommerce: true,
    includeBlog: true,
  },
  // 📝 Blog
  {
    icon: '✍️',
    label: 'Personal Blog',
    prompt: 'Clean, readable blog theme with excellent typography, comfortable reading experience, featured posts, categories, author bio, and newsletter signup. Focus on content.',
    industry: 'blog',
    style: 'minimal',
    colorScheme: 'auto',
    includeBlog: true,
  },
  {
    icon: '📰',
    label: 'News Magazine',
    prompt: 'Professional news magazine theme with multi-column layouts, breaking news sections, category organization, featured stories, and a newspaper-inspired design.',
    industry: 'blog',
    style: 'professional',
    colorScheme: 'light',
    includeBlog: true,
  },
  // 🚗 Automotive
  {
    icon: '🚗',
    label: 'Auto Dealership',
    prompt: 'Premium auto dealership theme with vehicle showcases, inventory filters, financing calculator, test drive booking, sleek dark design with red accents, and high-performance imagery.',
    industry: 'technology',
    style: 'bold',
    colorScheme: 'dark',
    includeEcommerce: true,
  },
];

export function AiThemeGeneratorModal({
  isOpen,
  onClose,
  onThemeGenerated,
}: AiThemeGeneratorModalProps) {
  // Generation mode: 'prompt' for AI/template-based, 'preset' for direct preset selection
  const [mode, setMode] = useState<'prompt' | 'preset'>('preset');

  // Preset selection state
  const [presets, setPresets] = useState<PresetInfo[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [presetFilter, setPresetFilter] = useState<string>('all');

  // Prompt/template-based generation state
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
  const [showPromptPicker, setShowPromptPicker] = useState(false);

  // Load presets when modal opens
  useEffect(() => {
    if (isOpen && presets.length === 0) {
      loadPresets();
    }
  }, [isOpen]);

  const loadPresets = async () => {
    setPresetsLoading(true);
    try {
      const response = await customThemesApi.listPresets();
      setPresets(response.data);
    } catch (err) {
      console.error('Failed to load presets:', err);
      // Presets will just be empty, user can still use prompt mode
    } finally {
      setPresetsLoading(false);
    }
  };

  // Get unique categories for filtering
  const categories = ['all', ...new Set(presets.map(p => p.category))];

  // Filter presets by category
  const filteredPresets = presetFilter === 'all'
    ? presets
    : presets.filter(p => p.category === presetFilter);

  // Handle selecting a predefined prompt
  const handleSelectPrompt = (predefinedPrompt: PredefinedPrompt) => {
    setPrompt(predefinedPrompt.prompt);
    setStyle(predefinedPrompt.style);
    setColorScheme(predefinedPrompt.colorScheme);
    setIndustry(predefinedPrompt.industry);
    if (predefinedPrompt.includeEcommerce !== undefined) {
      setIncludeEcommerce(predefinedPrompt.includeEcommerce);
    }
    if (predefinedPrompt.includeBlog !== undefined) {
      setIncludeBlog(predefinedPrompt.includeBlog);
    }
    if (predefinedPrompt.includeCourses !== undefined) {
      setIncludeCourses(predefinedPrompt.includeCourses);
    }
    setShowPromptPicker(false);
  };

  const handleGenerate = async () => {
    // Validate based on mode
    if (mode === 'preset') {
      if (!selectedPresetId) {
        setError('Please select a preset theme');
        return;
      }
    } else {
      if (!prompt.trim()) {
        setError('Please describe the theme you want to create');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = mode === 'preset'
        ? {
            presetId: selectedPresetId!,
            usePreset: true,
            themeName: themeName || undefined,
            description: description || undefined,
          }
        : {
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
          };

      const response = await customThemesApi.generateAiTheme(requestData);

      const themeData = response.data as {
        settings: any;
        pages: any[];
        name: string;
        description: string;
        generatedBy?: 'ai' | 'preset';
        presetName?: string;
        presetId?: string;
      };

      // Show appropriate success message based on generation method
      if (themeData.generatedBy === 'preset') {
        toast.success(
          `Theme created using "${themeData.presetName}" preset! Customize it to make it yours.`,
          { duration: 5000, icon: '🎨' }
        );
      } else {
        toast.success('AI-generated theme created successfully!', { duration: 4000, icon: '✨' });
      }

      onThemeGenerated(themeData);
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
          {/* Mode Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('preset')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${
                mode === 'preset'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiGrid size={16} />
              Browse Presets
            </button>
            <button
              type="button"
              onClick={() => setMode('prompt')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${
                mode === 'prompt'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiEdit3 size={16} />
              Custom Prompt
            </button>
          </div>

          {/* PRESET MODE */}
          {mode === 'preset' && (
            <>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPresetFilter(cat)}
                    disabled={loading}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      presetFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Preset Grid */}
              {presetsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <FiLoader className="animate-spin text-blue-600" size={32} />
                </div>
              ) : filteredPresets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No presets found. Try a different category.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPresetId(preset.id)}
                      disabled={loading}
                      className={`relative p-3 text-left border-2 rounded-xl transition-all ${
                        selectedPresetId === preset.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {/* Color Preview */}
                      <div
                        className="h-16 rounded-lg mb-2 flex items-end"
                        style={{
                          background: `linear-gradient(135deg, ${preset.primaryColor}, ${preset.secondaryColor})`,
                        }}
                      >
                        <div className="flex gap-1 p-1.5">
                          <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: preset.primaryColor }} />
                          <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: preset.secondaryColor }} />
                        </div>
                      </div>

                      {/* Preset Info */}
                      <div className="font-medium text-gray-900 text-sm truncate">{preset.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{preset.description}</div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                          {preset.style}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                          {preset.colorScheme}
                        </span>
                      </div>

                      {/* Selected Indicator */}
                      {selectedPresetId === preset.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <FiCheck className="text-white" size={12} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Optional Name Override */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Theme Name (Optional)
                </label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="Leave empty to use preset name"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </>
          )}

          {/* PROMPT MODE */}
          {mode === 'prompt' && (
            <>
              {/* Predefined Prompts Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Quick Start Templates
              </label>
              <button
                type="button"
                onClick={() => setShowPromptPicker(!showPromptPicker)}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                {showPromptPicker ? 'Hide Templates' : 'Browse All Templates →'}
              </button>
            </div>

            {/* Quick picks - always visible */}
            <div className="flex flex-wrap gap-2 mb-2">
              {PREDEFINED_PROMPTS.slice(0, 6).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPrompt(p)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50"
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Expanded prompt picker */}
            {showPromptPicker && (
              <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {PREDEFINED_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPrompt(p)}
                      disabled={loading}
                      className="flex items-start gap-3 p-3 text-left bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all disabled:opacity-50 group"
                    >
                      <span className="text-2xl flex-shrink-0">{p.icon}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 text-sm">
                          {p.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {p.prompt.substring(0, 80)}...
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="inline-block px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                            {p.style}
                          </span>
                          <span className="inline-block px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                            {p.colorScheme}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
              Be specific about colors, style, and purpose for best results — or select a template above
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
            </>
          )}

          {/* Error Message - shown in both modes */}
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
            disabled={loading || (mode === 'preset' && !selectedPresetId)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                {mode === 'preset' ? 'Creating Theme...' : 'Generating...'}
              </>
            ) : (
              <>
                {mode === 'preset' ? <FiPackage /> : <FiZap />}
                {mode === 'preset' ? 'Use This Preset' : 'Generate Theme'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

