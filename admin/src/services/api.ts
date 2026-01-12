/**
 * API Service
 * Handles all API requests with authentication
 */

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for cart session
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  console.log('API Request:', config.url, 'Token:', token ? 'present' : 'missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors - but be very careful not to logout during normal operation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data?.message);

    // Never auto-logout - let the UI handle auth errors gracefully
    // The old approach was causing logout loops on initial page load
    // Users will be redirected to login by the route guards if not authenticated

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; name: string; password: string }) =>
    api.post('/auth/register', data),
  verify2FA: (tempToken: string, code: string) =>
    api.post('/auth/verify-2fa', { tempToken, code }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// Posts API
export const postsApi = {
  getAll: (params?: any) => api.get('/posts', { params }),
  getById: (id: string) => api.get(`/posts/${id}`),
  create: (data: any) => api.post('/posts', data),
  update: (id: string, data: any) => api.patch(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
};

// Pages API
export const pagesApi = {
  getAll: (params?: any) => api.get('/pages', { params }),
  getById: (id: string) => api.get(`/pages/${id}`),
  create: (data: any) => api.post('/pages', data),
  update: (id: string, data: any) => api.patch(`/pages/${id}`, data),
  delete: (id: string) => api.delete(`/pages/${id}`),
};

// Media API
export const mediaApi = {
  getAll: (params?: any) => api.get('/media', { params }),
  getByUser: (userId: string, params?: any) => api.get('/media', { params: { ...params, userId } }),
  getAllMedia: (params?: any) => api.get('/media', { params: { ...params, showAll: 'true' } }),
  getMyStorageStats: () => api.get('/media/storage/me'),
  getAllStorageStats: () => api.get('/media/storage/all'),
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10 * 60 * 1000, // 10 minutes timeout for large files
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  delete: (id: string) => api.delete(`/media/${id}`),
  update: (id: string, data: { alt?: string; caption?: string }) => api.patch(`/media/${id}`, data),
  optimizeAll: () => api.post('/media/optimize-all'),
};

// Users API
export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Settings API
export const settingsApi = {
  getAll: (group?: string) => api.get('/settings', { params: { group } }),
  getSettings: (keys: string[]) => api.get('/settings', { params: { keys: keys.join(',') } }),
  set: (key: string, value: any, type: string, group?: string) =>
    api.post('/settings', { key, value, type, group }),
  updateSetting: (key: string, data: { key: string; value: any; type: string; group?: string }) =>
    api.post('/settings', data),
};

// System Configuration API (for production-ready settings)
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  fromEmail: string;
  fromName: string;
}

export interface DomainConfig {
  frontendUrl: string;
  adminUrl: string;
  supportEmail: string;
  siteName: string;
  siteLogo?: string;
  siteTagline?: string;
}

export interface SetupStatus {
  setupComplete: boolean;
  adminCreated: boolean;
  smtpConfigured: boolean;
  domainConfigured: boolean;
}

export interface PaymentConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  isLiveMode: boolean;
  isConfigured: boolean;
  provider: string;
}

export interface PaymentConfigInput {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
}

export interface PaymentTestResult {
  success: boolean;
  message: string;
  accountId?: string;
  isLiveMode?: boolean;
}

export const systemConfigApi = {
  // Email/SMTP configuration
  getEmailConfig: () => api.get<SmtpConfig>('/system-config/email'),
  saveEmailConfig: (config: SmtpConfig) => api.put('/system-config/email', config),
  testEmail: (testEmail: string) => api.post('/system-config/email/test', { testEmail }),

  // Domain configuration
  getDomainConfig: () => api.get<DomainConfig>('/system-config/domain'),
  saveDomainConfig: (config: DomainConfig) => api.put('/system-config/domain', config),

  // Payment/Stripe configuration
  getPaymentConfig: () => api.get<PaymentConfig>('/system-config/payment'),
  savePaymentConfig: (config: PaymentConfigInput) => api.put('/system-config/payment', config),
  testPaymentConnection: () => api.post<PaymentTestResult>('/system-config/payment/test'),

  // Setup status
  getSetupStatus: () => api.get<SetupStatus>('/system-config/setup-status'),
};

// Setup Wizard API (public, no auth required)
export const setupWizardApi = {
  getStatus: () => api.get<{ setupRequired: boolean; status: SetupStatus }>('/setup/status'),
  createAdmin: (data: { email: string; name: string; password: string }) =>
    api.post('/setup/admin', data),
  configureSmtp: (config: SmtpConfig) => api.post('/setup/smtp', config),
  complete: () => api.post('/setup/complete'),
};

// Themes API
export const themesApi = {
  getAll: () => api.get('/themes'),
  getActive: () => api.get('/themes/active'),
  scan: () => api.post('/themes/scan'),
  activate: (id: string) => api.post(`/themes/${id}/activate`),
  validate: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/themes/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/themes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  delete: (id: string) => api.delete(`/themes/${id}`),
  generate: (config: ThemeDesignConfig) => api.post('/themes/generate', config),
};

// Theme Marketplace API
export interface MarketplaceTheme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  longDescription: string | null;
  version: string;
  author: string;
  authorEmail: string | null;
  authorUrl: string | null;
  thumbnailUrl: string | null;
  screenshotUrls: string[] | null;
  downloadUrl: string | null;
  demoUrl: string | null;
  repositoryUrl: string | null;
  fileSize: number | null;
  category: string;
  tags: string[] | null;
  features: string[] | null;
  price: number;
  isPremium: boolean;
  downloads: number;
  rating: number;
  ratingCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isFeatured: boolean;
  submittedBy?: { id: string; name: string; avatar: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceQuery {
  category?: string;
  search?: string;
  status?: string;
  sortBy?: 'downloads' | 'rating' | 'newest' | 'name';
  page?: number;
  limit?: number;
}

export const marketplaceApi = {
  // Public endpoints
  getThemes: (query?: MarketplaceQuery) =>
    api.get<{ themes: MarketplaceTheme[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/marketplace/themes',
      { params: query }
    ),
  getFeatured: (limit = 6) =>
    api.get<MarketplaceTheme[]>('/marketplace/featured', { params: { limit } }),
  getStats: () =>
    api.get<{ total: number; approved: number; pending: number; featured: number; totalDownloads: number }>('/marketplace/stats'),
  getCategories: () =>
    api.get<{ category: string; count: number }[]>('/marketplace/categories'),
  getTheme: (id: string) =>
    api.get<MarketplaceTheme>(`/marketplace/themes/${id}`),
  getThemeBySlug: (slug: string) =>
    api.get<MarketplaceTheme>(`/marketplace/themes/slug/${slug}`),

  // Authenticated endpoints
  submitTheme: (data: FormData) =>
    api.post<MarketplaceTheme>('/marketplace/submit', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  installTheme: (id: string) =>
    api.post(`/marketplace/themes/${id}/install`),
  rateTheme: (id: string, rating: number, review?: string) =>
    api.post(`/marketplace/themes/${id}/rate`, { rating, review }),

  // Admin endpoints
  getAdminThemes: (query?: MarketplaceQuery & { status?: string }) =>
    api.get<{ themes: MarketplaceTheme[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/marketplace/admin/themes',
      { params: query }
    ),
  approveTheme: (id: string) =>
    api.post(`/marketplace/admin/themes/${id}/approve`),
  rejectTheme: (id: string, reason: string) =>
    api.post(`/marketplace/admin/themes/${id}/reject`, { reason }),
  setFeatured: (id: string, featured: boolean, order?: number) =>
    api.post(`/marketplace/admin/themes/${id}/feature`, { featured, order }),
  deleteTheme: (id: string) =>
    api.delete(`/marketplace/admin/themes/${id}`),

  // Bulk actions
  bulkApprove: (ids: string[]) =>
    api.post<{ succeeded: number; failed: number; total: number }>('/marketplace/admin/bulk/approve', { ids }),
  bulkReject: (ids: string[], reason: string) =>
    api.post<{ succeeded: number; failed: number; total: number }>('/marketplace/admin/bulk/reject', { ids, reason }),
  bulkDelete: (ids: string[]) =>
    api.post<{ succeeded: number; failed: number; total: number }>('/marketplace/admin/bulk/delete', { ids }),
};

// Plugin Marketplace API
export interface MarketplacePlugin {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  longDescription: string | null;
  version: string;
  author: string;
  authorEmail: string | null;
  authorUrl: string | null;
  iconUrl: string | null;
  screenshotUrls: string[] | null;
  downloadUrl: string | null;
  repositoryUrl: string | null;
  fileSize: number | null;
  category: string;
  tags: string[] | null;
  features: string[] | null;
  price: number;
  isPremium: boolean;
  downloads: number;
  activeInstalls: number;
  rating: number;
  ratingCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isFeatured: boolean;
  submittedBy?: { id: string; name: string; avatar: string | null };
  createdAt: string;
  updatedAt: string;
}

interface PluginMarketplaceQuery {
  category?: string;
  search?: string;
  sortBy?: 'downloads' | 'rating' | 'newest' | 'name' | 'activeInstalls';
  page?: number;
  limit?: number;
}

export const pluginMarketplaceApi = {
  // Public endpoints
  getPlugins: (query?: PluginMarketplaceQuery) =>
    api.get<{ plugins: MarketplacePlugin[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/plugin-marketplace/plugins',
      { params: query }
    ),
  getFeatured: (limit = 6) =>
    api.get<MarketplacePlugin[]>('/plugin-marketplace/featured', { params: { limit } }),
  getStats: () =>
    api.get<{ total: number; approved: number; pending: number; featured: number; totalDownloads: number; totalActiveInstalls: number }>('/plugin-marketplace/stats'),
  getCategories: () =>
    api.get<{ category: string; count: number }[]>('/plugin-marketplace/categories'),
  getPlugin: (id: string) =>
    api.get<MarketplacePlugin>(`/plugin-marketplace/plugins/${id}`),
  getPluginBySlug: (slug: string) =>
    api.get<MarketplacePlugin>(`/plugin-marketplace/plugins/slug/${slug}`),

  // Authenticated endpoints
  submitPlugin: (data: FormData) =>
    api.post<MarketplacePlugin>('/plugin-marketplace/submit', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  installPlugin: (id: string) =>
    api.post(`/plugin-marketplace/plugins/${id}/install`),
  ratePlugin: (id: string, rating: number, review?: string) =>
    api.post(`/plugin-marketplace/plugins/${id}/rate`, { rating, review }),

  // Admin endpoints
  getAdminPlugins: (query?: PluginMarketplaceQuery & { status?: string }) =>
    api.get<{ plugins: MarketplacePlugin[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/plugin-marketplace/admin/plugins',
      { params: query }
    ),
  approvePlugin: (id: string) =>
    api.post(`/plugin-marketplace/admin/plugins/${id}/approve`),
  rejectPlugin: (id: string, reason: string) =>
    api.post(`/plugin-marketplace/admin/plugins/${id}/reject`, { reason }),
  setFeatured: (id: string, featured: boolean, order?: number) =>
    api.post(`/plugin-marketplace/admin/plugins/${id}/feature`, { featured, order }),
  deletePlugin: (id: string) =>
    api.delete(`/plugin-marketplace/admin/plugins/${id}`),

  // Bulk actions
  bulkApprove: (ids: string[]) =>
    api.post<{ succeeded: number; failed: number; total: number }>('/plugin-marketplace/admin/bulk/approve', { ids }),
  bulkReject: (ids: string[], reason: string) =>
    api.post<{ succeeded: number; failed: number; total: number }>('/plugin-marketplace/admin/bulk/reject', { ids, reason }),
  bulkDelete: (ids: string[]) =>
    api.post<{ succeeded: number; failed: number; total: number }>('/plugin-marketplace/admin/bulk/delete', { ids }),
};

// Custom Themes API (for Theme Designer)
export interface CustomThemeSettings {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    heading: string;
    link: string;
    linkHover: string;
    border: string;
    accent: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: number;
    lineHeight: number;
    headingWeight: number;
    bodyWeight?: number;
    letterSpacing?: number;
    h1Size?: number;
    h2Size?: number;
    h3Size?: number;
    h4Size?: number;
    h5Size?: number;
    h6Size?: number;
  };
  layout: {
    sidebarPosition: 'left' | 'right' | 'none';
    contentWidth: number;
    headerStyle: 'default' | 'centered' | 'minimal' | 'sticky';
    footerStyle: 'default' | 'centered' | 'minimal';
  };
  spacing: {
    sectionPadding: number;
    elementSpacing: number;
    containerPadding: number;
    contentMargin?: { top: number; right: number; bottom: number; left: number };
  };
  borders: {
    radius: number;
    width: number;
  };
  components?: {
    buttons?: {
      borderRadius?: number;
      padding?: string;
      fontWeight?: number;
    };
    cards?: {
      borderRadius?: number;
      shadow?: string;
      padding?: number;
    };
    forms?: {
      borderRadius?: number;
      borderWidth?: number;
      focusColor?: string;
    };
  };
  responsive?: {
    tablet?: Partial<CustomThemeSettings>;
    mobile?: Partial<CustomThemeSettings>;
  };
  darkMode?: Partial<CustomThemeSettings['colors']>;
  homepage?: {
    type: 'posts' | 'static';
    pageId?: string;
    blogPageId?: string;
    postsPerPage?: number;
    showHero?: boolean;
    showFeaturedPosts?: boolean;
    showFeaturedProducts?: boolean;
    showFeaturedCourses?: boolean;
    showNewsletter?: boolean;
  };
}

// Theme Page structure for multi-page themes
export interface ThemePageData {
  id: string;
  name: string;
  slug: string;
  blocks: any[]; // ContentBlock[] - using any to avoid circular dependency
  isHomePage?: boolean;
}

export interface CustomTheme {
  id: string;
  name: string;
  description?: string;
  settings: CustomThemeSettings;
  customCSS?: string;
  pages?: ThemePageData[]; // Multi-page support
  isActive: boolean;
  isDefault: boolean;
  previewUrl?: string;
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export const customThemesApi = {
  getAll: () => api.get<CustomTheme[]>('/custom-themes'),
  getById: (id: string) => api.get<CustomTheme>(`/custom-themes/${id}`),
  getActive: () => api.get<CustomTheme | null>('/custom-themes/active'),
  create: (data: { name: string; description?: string; settings: CustomThemeSettings; customCSS?: string; pages?: ThemePageData[]; isDefault?: boolean }) =>
    api.post<CustomTheme>('/custom-themes', data),
  update: (id: string, data: { name?: string; description?: string; settings?: CustomThemeSettings; customCSS?: string; pages?: ThemePageData[]; isDefault?: boolean }) =>
    api.put<CustomTheme>(`/custom-themes/${id}`, data),
  delete: (id: string) => api.delete(`/custom-themes/${id}`),
  duplicate: (id: string, name?: string) => api.post<CustomTheme>(`/custom-themes/${id}/duplicate`, { name }),
  activate: (id: string) => api.post<CustomTheme>(`/custom-themes/${id}/activate`),
  export: (id: string) => api.get(`/custom-themes/${id}/export`),
  exportZip: (id: string) => api.get(`/custom-themes/${id}/export-zip`, { responseType: 'blob' }),
  install: (id: string) => api.post(`/custom-themes/${id}/install`),
  import: (data: any) => api.post<CustomTheme>('/custom-themes/import', data),
  generateCSS: (settings: CustomThemeSettings, customCSS?: string) =>
    api.post<{ css: string }>('/custom-themes/generate-css', { settings, customCSS }),
  // Generate theme using AI
  generateAiTheme: (data: {
    prompt?: string;
    presetId?: string;
    usePreset?: boolean;
    themeName?: string;
    description?: string;
    numberOfPages?: number;
    style?: string;
    colorScheme?: string;
    industry?: string;
    pageTypes?: string[];
    preferredBlocks?: string[];
    features?: Record<string, boolean>;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    includeEcommerce?: boolean;
    includeCourses?: boolean;
    includeBlog?: boolean;
    headerStyle?: string;
    footerStyle?: string;
    generateFullTheme?: boolean;
  }) =>
    api.post<{ settings: CustomThemeSettings; pages: ThemePageData[]; name: string; description: string; generatedBy?: 'ai' | 'preset'; presetId?: string; presetName?: string }>('/custom-themes/generate-ai', data),
  // List available AI theme presets
  listPresets: () => api.get<Array<{
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
  }>>('/custom-themes/presets'),
  // Get a specific preset by ID
  getPreset: (id: string) => api.get<any>(`/custom-themes/presets/${id}`),
  // Generate a short-lived preview token for secure iframe embedding
  getPreviewToken: () => api.post<{ token: string; expiresIn: number }>('/custom-themes/preview-token'),
};

// Theme Customization API - for customizing active theme images, blocks, and links
export interface ThemeCustomizationImage {
  id: string;
  themeId: string;
  name: string;
  type: string;
  url: string;
  altText?: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  fileSize?: number;
  section?: string;
  position: number;
  customData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeCustomizationBlock {
  id: string;
  themeId: string;
  name: string;
  type: string;
  title?: string;
  description?: string;
  content?: string;
  richContent?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  customCSS?: string;
  layout?: string;
  columns: number;
  padding?: string;
  margin?: string;
  backgroundImage?: string;
  featuredImage?: string;
  isVisible: boolean;
  position: number;
  customData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeCustomizationLink {
  id: string;
  themeId: string;
  name: string;
  type: string;
  label: string;
  url: string;
  icon?: string;
  target: string;
  rel?: string;
  title?: string;
  className?: string;
  customCSS?: string;
  group?: string;
  position: number;
  isVisible: boolean;
  isActive: boolean;
  customData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const themeCustomizationApi = {
  // Images
  createImage: (themeId: string, data: any) =>
    api.post<ThemeCustomizationImage>(`/theme-customization/images/${themeId}`, data),
  getImages: (themeId: string, type?: string) =>
    api.get<ThemeCustomizationImage[]>(`/theme-customization/images/${themeId}`, { params: { type } }),
  getImage: (id: string) =>
    api.get<ThemeCustomizationImage>(`/theme-customization/images/detail/${id}`),
  updateImage: (id: string, data: any) =>
    api.put<ThemeCustomizationImage>(`/theme-customization/images/${id}`, data),
  deleteImage: (id: string) =>
    api.delete(`/theme-customization/images/${id}`),
  reorderImages: (themeId: string, imageIds: string[]) =>
    api.post(`/theme-customization/images/${themeId}/reorder`, { imageIds }),

  // Blocks
  createBlock: (themeId: string, data: any) =>
    api.post<ThemeCustomizationBlock>(`/theme-customization/blocks/${themeId}`, data),
  getBlocks: (themeId: string, type?: string) =>
    api.get<ThemeCustomizationBlock[]>(`/theme-customization/blocks/${themeId}`, { params: { type } }),
  getBlock: (id: string) =>
    api.get<ThemeCustomizationBlock>(`/theme-customization/blocks/detail/${id}`),
  updateBlock: (id: string, data: any) =>
    api.put<ThemeCustomizationBlock>(`/theme-customization/blocks/${id}`, data),
  deleteBlock: (id: string) =>
    api.delete(`/theme-customization/blocks/${id}`),
  reorderBlocks: (themeId: string, blockIds: string[]) =>
    api.post(`/theme-customization/blocks/${themeId}/reorder`, { blockIds }),

  // Links
  createLink: (themeId: string, data: any) =>
    api.post<ThemeCustomizationLink>(`/theme-customization/links/${themeId}`, data),
  getLinks: (themeId: string, type?: string, group?: string) =>
    api.get<ThemeCustomizationLink[]>(`/theme-customization/links/${themeId}`, { params: { type, group } }),
  getLink: (id: string) =>
    api.get<ThemeCustomizationLink>(`/theme-customization/links/detail/${id}`),
  updateLink: (id: string, data: any) =>
    api.put<ThemeCustomizationLink>(`/theme-customization/links/${id}`, data),
  deleteLink: (id: string) =>
    api.delete(`/theme-customization/links/${id}`),
  reorderLinks: (themeId: string, linkIds: string[]) =>
    api.post(`/theme-customization/links/${themeId}/reorder`, { linkIds }),
};

// Media block for WYSIWYG editor
export interface ThemeMediaBlock {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text' | 'shoplink';
  src?: string;
  content?: string;
  title?: string;
  url?: string;
  label?: string;
  artist?: string;
  coverImage?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
}

// Theme design configuration interface
export interface ThemeDesignConfig {
  name: string;
  author: string;
  version: string;
  description?: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    heading: string;
    link: string;
    linkHover: string;
    border: string;
    accent: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: number;
    lineHeight: number;
    headingWeight: number;
  };
  layout: {
    sidebarPosition: 'left' | 'right' | 'none';
    contentWidth: number;
    headerStyle: 'default' | 'centered' | 'minimal';
  };
  spacing: {
    sectionPadding: number;
    elementSpacing: number;
    containerPadding: number;
  };
  borders: {
    radius: number;
    width: number;
  };
  baseTemplate: string;
  mediaBlocks?: ThemeMediaBlock[];
}

// Plugins API
export const pluginsApi = {
  getAll: () => api.get('/plugins'),
  scan: () => api.post('/plugins/scan'),
  activate: (id: string) => api.post(`/plugins/${id}/activate`),
  deactivate: (id: string) => api.post(`/plugins/${id}/deactivate`),
  delete: (id: string) => api.delete(`/plugins/${id}`),
  validate: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/plugins/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/plugins/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Analytics API
export const analyticsApi = {
  getDashboard: (period?: string) => api.get('/analytics/dashboard', { params: { period } }),
  getPageViews: (period?: string) => api.get('/analytics/pageviews', { params: { period } }),
  getTopPages: (period?: string, limit?: number) => api.get('/analytics/top-pages', { params: { period, limit } }),
  getTrafficSources: (period?: string) => api.get('/analytics/traffic-sources', { params: { period } }),
  getDevices: (period?: string) => api.get('/analytics/devices', { params: { period } }),
  getBrowsers: (period?: string) => api.get('/analytics/browsers', { params: { period } }),
  getRealtime: () => api.get('/analytics/realtime'),
  // Tracking endpoints (no auth)
  trackPageView: (path: string, sessionId?: string) => api.post('/analytics/track/pageview', { path, sessionId }),
  trackEvent: (data: { category: string; action: string; label?: string; value?: number; path?: string; sessionId?: string }) =>
    api.post('/analytics/track/event', data),
  startSession: (path?: string) => api.post('/analytics/track/session', { path }),
};

// SEO API
export const seoApi = {
  // Redirects
  getRedirects: () => api.get('/seo/redirects'),
  createRedirect: (data: { fromPath: string; toPath: string; type?: number }) => api.post('/seo/redirects', data),
  updateRedirect: (id: string, data: any) => api.put(`/seo/redirects/${id}`, data),
  deleteRedirect: (id: string) => api.delete(`/seo/redirects/${id}`),
  // Sitemap
  getSitemapEntries: () => api.get('/seo/sitemap/entries'),
  createSitemapEntry: (data: { url: string; priority?: number; changefreq?: string }) => api.post('/seo/sitemap/entries', data),
  updateSitemapEntry: (id: string, data: any) => api.put(`/seo/sitemap/entries/${id}`, data),
  deleteSitemapEntry: (id: string) => api.delete(`/seo/sitemap/entries/${id}`),
  // Schema Markup
  getSchemas: (scope?: string) => api.get('/seo/schema', { params: { scope } }),
  createSchema: (data: { name: string; type: string; content: any; scope?: string; scopeId?: string }) => api.post('/seo/schema', data),
  updateSchema: (id: string, data: any) => api.put(`/seo/schema/${id}`, data),
  deleteSchema: (id: string) => api.delete(`/seo/schema/${id}`),
  // Analysis
  analyzeContent: (contentType: string, contentId: string) => api.get(`/seo/analyze/${contentType}/${contentId}`),
};

// Security API
export const securityApi = {
  getDashboard: () => api.get('/security/dashboard'),
  runSecurityCheck: () => api.post('/security/check'),
  getEvents: (params?: any) => api.get('/security/events', { params }),
  getBlockedIps: () => api.get('/security/blocked-ips'),
  blockIp: (data: { ip: string; reason: string; expiresAt?: string }) =>
    api.post('/security/blocked-ips', data),
  unblockIp: (ip: string) => api.delete(`/security/blocked-ips/${ip}`),
  generate2FASecret: () => api.post('/security/2fa/generate'),
  enable2FA: (data: { secret: string; token: string }) =>
    api.post('/security/2fa/enable', data),
  disable2FA: (data: { password: string }) =>
    api.post('/security/2fa/disable', data),
  verify2FA: (data: { token: string }) =>
    api.post('/security/2fa/verify', data),
  generateBaseline: () => api.post('/security/integrity/baseline'),
  scanIntegrity: () => api.post('/security/integrity/scan'),

  // Rate Limiting
  getRateLimits: () => api.get('/security/rate-limits'),
  upsertRateLimit: (data: {
    endpoint: string;
    windowMs: number;
    maxRequests: number;
    enabled: boolean;
    blockDuration?: number;
  }) => api.post('/security/rate-limits', data),
  deleteRateLimit: (endpoint: string) => api.delete(`/security/rate-limits/${endpoint}`),
  getRateLimitViolations: () => api.get('/security/rate-limits/violations'),

  // Session Management
  getSessions: (params?: any) => api.get('/security/sessions', { params }),
  getMySessions: () => api.get('/security/sessions/me'),
  forceLogoutSession: (sessionId: string) => api.delete(`/security/sessions/${sessionId}`),
  forceLogoutAllSessions: (userId: string) => api.delete(`/security/sessions/user/${userId}`),
  cleanupSessions: () => api.post('/security/sessions/cleanup'),

  // Password Policy
  getPasswordPolicy: () => api.get('/security/password-policy'),
  updatePasswordPolicy: (policy: any) => api.post('/security/password-policy', policy),
  validatePassword: (password: string, userId?: string) =>
    api.post('/security/password-policy/validate', { password, userId }),
};

// Theme Editor API
export const themeEditorApi = {
  getFileTree: (themeSlug: string) => api.get(`/theme-editor/${themeSlug}/files`),
  readFile: (themeSlug: string, filePath: string) =>
    api.get(`/theme-editor/${themeSlug}/file`, { params: { path: filePath } }),
  saveFile: (themeSlug: string, filePath: string, content: string) =>
    api.post(`/theme-editor/${themeSlug}/file`, { path: filePath, content }),
  createBackup: (themeSlug: string, backupName?: string) =>
    api.post(`/theme-editor/${themeSlug}/backup`, { backupName }),
  listBackups: (themeSlug: string) => api.get(`/theme-editor/${themeSlug}/backups`),
  restoreBackup: (themeSlug: string, backupId: string) =>
    api.post(`/theme-editor/${themeSlug}/restore`, { backupId }),
  deleteBackup: (themeSlug: string, backupId: string) =>
    api.delete(`/theme-editor/${themeSlug}/backup/${backupId}`),
  validateFile: (filePath: string, content: string) =>
    api.post('/theme-editor/validate', { filePath, content }),
};

// Groups API
export const groupsApi = {
  getAll: (params?: { visibility?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/groups', { params }),
  getById: (id: string) => api.get(`/groups/${id}`),
  create: (data: { name: string; slug: string; description?: string; visibility?: string }) =>
    api.post('/groups', data),
  update: (id: string, data: { name?: string; description?: string; visibility?: string }) =>
    api.patch(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),
  join: (id: string) => api.post(`/groups/${id}/join`),
  leave: (id: string) => api.post(`/groups/${id}/leave`),
  getMessages: (id: string, params?: { limit?: number; before?: string }) =>
    api.get(`/groups/${id}/messages`, { params }),
  getMembers: (id: string) => api.get(`/groups/${id}/members`),
  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`),
  banUser: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/ban/${userId}`),
  deleteMessage: (groupId: string, messageId: string) =>
    api.delete(`/groups/${groupId}/messages/${messageId}`),
};

// Menu item interface
export interface MenuItem {
  id?: string;
  label: string;
  url?: string;
  target?: string;
  type: 'CUSTOM' | 'PAGE' | 'POST' | 'HOME' | 'SHOP' | 'PRODUCT' | 'CATEGORY' | 'LOGIN';
  pageId?: string;
  postId?: string;
  productId?: string;
  categoryId?: string;
  order?: number;
  cssClass?: string;
  icon?: string;
  parentId?: string;
  page?: { id: string; title: string; slug: string };
  post?: { id: string; title: string; slug: string };
  children?: MenuItem[];
}

// Menu interface
export interface Menu {
  id: string;
  name: string;
  location: string;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

// Menus API
export const menusApi = {
  getAll: () => api.get<Menu[]>('/menus'),
  getById: (id: string) => api.get<Menu>(`/menus/${id}`),
  getByLocation: (location: string) => api.get<Menu>(`/menus/location/${location}`),
  getAvailableLinks: () => api.get<{ pages: any[]; posts: any[]; products?: any[]; productCategories?: any[] }>('/menus/available-links'),
  create: (data: { name: string; location: string; items?: Partial<MenuItem>[] }) =>
    api.post<Menu>('/menus', data),
  update: (id: string, data: { name?: string; location?: string; items?: Partial<MenuItem>[] }) =>
    api.put<Menu>(`/menus/${id}`, data),
  delete: (id: string) => api.delete(`/menus/${id}`),
};

// Color option for product variants
export interface ColorOption {
  name: string;
  code: string; // Hex color code
  image?: string; // Swatch image URL
}

// Variant options configuration
export interface VariantOptions {
  sizes?: string[];
  colors?: ColorOption[];
}

// Shop Product interface
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  price: number;
  salePrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  trackStock: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  type: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  featuredImage?: string;
  images?: string[];
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  // Variant configuration
  hasVariants: boolean;
  variantOptions?: VariantOptions;
  categoryId?: string;
  category?: ProductCategory;
  variants?: ProductVariant[];
  tags?: ProductTag[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: ProductCategory;
  children?: ProductCategory[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price?: number;
  salePrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  image?: string;
  images?: string[];
  // Explicit clothing variant fields
  size?: string;
  color?: string;
  colorCode?: string;
  weight?: number;
  options: Record<string, string>;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
}

// Generate variants request
export interface GenerateVariantsRequest {
  sizes: string[];
  colors: ColorOption[];
  defaultPrice?: number;
  defaultStock?: number;
}

// Variant stock summary
export interface VariantStockSummary {
  variants: ProductVariant[];
  summary: {
    totalVariants: number;
    totalStock: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

// Shop Order interface
export interface Order {
  id: string;
  orderNumber: string;
  email: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND';
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  items: OrderItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string;
  stripePaymentIntentId?: string;
}

// Products API
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; category?: string; search?: string }) =>
    api.get<{ products: Product[]; pagination: { page: number; limit: number; total: number; pages: number } }>('/shop/products', { params }),
  getById: (id: string) => api.get<Product>(`/shop/products/${id}`),
  create: (data: Partial<Product>) => api.post<Product>('/shop/products', data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/shop/products/${id}`, data),
  delete: (id: string) => api.delete(`/shop/products/${id}`),
  updateStock: (id: string, stock: number) => api.patch(`/shop/products/${id}/stock`, { stock }),

  // Variant management
  getVariant: (variantId: string) => api.get<ProductVariant>(`/shop/variants/${variantId}`),
  updateVariant: (variantId: string, data: Partial<ProductVariant>) =>
    api.patch<ProductVariant>(`/shop/variants/${variantId}`, data),
  deleteVariant: (variantId: string) => api.delete(`/shop/variants/${variantId}`),
  setVariantStock: (variantId: string, stock: number) =>
    api.patch<ProductVariant>(`/shop/variants/${variantId}/stock`, { stock }),
  getVariantStockSummary: (productId: string) =>
    api.get<VariantStockSummary>(`/shop/products/${productId}/variants/stock`),
  generateVariants: (productId: string, data: GenerateVariantsRequest) =>
    api.post<Product>(`/shop/products/${productId}/variants/generate`, data),
  getAvailableVariants: (productId: string) =>
    api.get<ProductVariant[]>(`/shop/products/${productId}/variants/available`),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get<ProductCategory[]>('/shop/categories'),
  getTree: () => api.get<ProductCategory[]>('/shop/categories/tree'),
  getById: (id: string) => api.get<ProductCategory>(`/shop/categories/${id}`),
  create: (data: Partial<ProductCategory>) => api.post<ProductCategory>('/shop/categories', data),
  update: (id: string, data: Partial<ProductCategory>) => api.put<ProductCategory>(`/shop/categories/${id}`, data),
  delete: (id: string) => api.delete(`/shop/categories/${id}`),
};

// Shipping API
export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  cost: number;
  freeAbove?: number;
  minDays?: number;
  maxDays?: number;
  countries?: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export const shippingApi = {
  getAll: (includeInactive = false) =>
    api.get<ShippingMethod[]>('/shop/shipping', { params: { includeInactive: includeInactive ? 'true' : undefined } }),
  getById: (id: string) => api.get<ShippingMethod>(`/shop/shipping/${id}`),
  create: (data: Partial<ShippingMethod>) => api.post<ShippingMethod>('/shop/shipping', data),
  update: (id: string, data: Partial<ShippingMethod>) => api.put<ShippingMethod>(`/shop/shipping/${id}`, data),
  delete: (id: string) => api.delete(`/shop/shipping/${id}`),
  // Public endpoints
  getAvailable: (country: string) => api.get<ShippingMethod[]>('/shop/storefront/shipping/methods', { params: { country } }),
  getRates: (country: string, subtotal: number) =>
    api.get<Array<ShippingMethod & { estimatedDelivery: string; isFree: boolean }>>('/shop/storefront/shipping/rates', {
      params: { country, subtotal: String(subtotal) }
    }),
};

// Orders API
export const ordersApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; paymentStatus?: string; search?: string }) =>
    api.get<{ orders: Order[]; pagination: { page: number; limit: number; total: number; pages: number } }>('/shop/admin/orders', { params }),
  getById: (id: string) => api.get<Order>(`/shop/admin/orders/${id}`),
  updateStatus: (id: string, status: string, note?: string) =>
    api.put(`/shop/admin/orders/${id}/status`, { status, note }),
  cancel: (id: string) => api.post(`/shop/admin/orders/${id}/cancel`),
  getStats: () => api.get<{ totalOrders: number; totalRevenue: number; pendingOrders: number; todayOrders: number }>('/shop/admin/orders/stats'),
  refund: (orderId: string, amount?: number, reason?: string) =>
    api.post(`/shop/admin/refunds/${orderId}`, { amount, reason }),
};

// Storefront API (public)
export interface CartItem {
  id: string;
  itemType: 'PRODUCT' | 'COURSE';
  productId?: string;
  courseId?: string;
  variantId?: string;
  quantity: number;
  product?: Product;
  course?: Course;
  variant?: { id: string; name: string; price: number; options: Record<string, string> };
  // Pre-calculated fields from backend
  price: number;
  itemTotal: number;
  name: string;
  image?: string | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  hasCourses?: boolean;
  hasProducts?: boolean;
}

export const storefrontApi = {
  getProducts: (params?: { page?: number; limit?: number; category?: string; search?: string; featured?: boolean }) =>
    api.get<{ products: Product[]; pagination: { page: number; limit: number; total: number; pages: number } }>('/shop/storefront/products', { params }),
  getProduct: (slug: string) => api.get<Product>(`/shop/storefront/products/${slug}`),
  getCategories: () => api.get<ProductCategory[]>('/shop/storefront/categories'),
  getFeatured: () => api.get<Product[]>('/shop/storefront/featured'),
};

export const cartApi = {
  get: () => api.get<Cart>('/shop/cart'),
  add: (productId: string, quantity: number, variantId?: string) => {
    const payload: { productId: string; quantity: number; variantId?: string } = { productId, quantity };
    if (variantId) payload.variantId = variantId;
    return api.post<Cart>('/shop/cart/add', payload);
  },
  addCourse: (courseId: string) =>
    api.post<Cart>('/shop/cart/add-course', { courseId }),
  update: (itemId: string, quantity: number) =>
    api.put<Cart>(`/shop/cart/item/${itemId}`, { quantity }),
  remove: (itemId: string) => api.delete<Cart>(`/shop/cart/item/${itemId}`),
  clear: () => api.delete<Cart>('/shop/cart/clear'),
};

export const checkoutApi = {
  getConfig: () => api.get<{ publishableKey: string }>('/shop/checkout/config'),
  createOrder: (data?: { email?: string; shippingAddress?: object; billingAddress?: object }) =>
    api.post<{ order: Order; clientSecret: string; paymentIntentId: string }>('/shop/checkout/create-order', data || {}),
  getOrder: (id: string) => api.get<Order>(`/shop/orders/${id}`),
};

// ============================================
// LMS API
// ============================================

export interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  featuredImage?: string;
  instructorId: string;
  instructor?: { id: string; name: string; avatar?: string };
  priceType: 'FREE' | 'PAID';
  priceAmount?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  passingScorePercent: number;
  certificateEnabled: boolean;
  estimatedHours?: number;
  whatYouLearn?: string[];
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
  _count?: { lessons: number; enrollments: number; quizzes: number };
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content?: string;
  orderIndex: number;
  type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT';
  videoAssetId?: string;
  videoAsset?: VideoAsset;
  moduleId?: string;
  module?: { id: string; title: string };
  estimatedMinutes?: number;
  isPreview: boolean;
  isRequired: boolean;
  quiz?: { id: string; title: string };
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isPublished: boolean;
  lessons?: Lesson[];
  _count?: { lessons: number };
}

export interface VideoAsset {
  id: string;
  provider: 'UPLOAD' | 'HLS' | 'YOUTUBE' | 'VIMEO';
  url?: string;
  playbackId?: string;
  filePath?: string;
  durationSeconds?: number;
  isProtected: boolean;
  thumbnailUrl?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description?: string;
  timeLimitSeconds?: number;
  attemptsAllowed?: number;
  shuffleQuestions: boolean;
  passingScorePercent?: number;
  isRequired: boolean;
  orderIndex: number;
  questions?: Question[];
  _count?: { questions: number; attempts: number };
}

export interface Question {
  id: string;
  quizId: string;
  type: 'MCQ' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  prompt: string;
  optionsJson?: string[];
  correctAnswerJson: any;
  explanation?: string;
  points: number;
  orderIndex: number;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  enrolledAt: string;
  completedAt?: string;
  course?: Course;
  user?: { id: string; name: string; email: string; avatar?: string };
  progress?: { completedLessons: number; totalLessons: number; percent: number };
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  courseId: string;
  userId: string;
  issuedAt: string;
  pdfPath?: string;
  pdfUrl?: string;
  verificationHash: string;
  course?: { title: string };
  user?: { name: string };
}

// LMS Admin API
export const lmsAdminApi = {
  // Dashboard
  getDashboardStats: () => api.get('/lms/admin/courses/dashboard/stats'),

  // Courses
  getCourses: (params?: { page?: number; limit?: number; status?: string; category?: string }) =>
    api.get<{ courses: Course[]; pagination: { page: number; limit: number; total: number; pages: number } }>('/lms/admin/courses', { params }),
  getCourse: (id: string) => api.get<Course>(`/lms/admin/courses/${id}`),
  createCourse: (data: Partial<Course>) => api.post<Course>('/lms/admin/courses', data),
  updateCourse: (id: string, data: Partial<Course>) => api.put<Course>(`/lms/admin/courses/${id}`, data),
  deleteCourse: (id: string) => api.delete(`/lms/admin/courses/${id}`),
  getCategories: () => api.get<string[]>('/lms/admin/courses/categories/list'),

  // Modules (Curriculum Sections)
  getModules: (courseId: string) => api.get<CourseModule[]>(`/lms/admin/courses/${courseId}/modules`),
  getModule: (courseId: string, id: string) => api.get<CourseModule>(`/lms/admin/courses/${courseId}/modules/${id}`),
  createModule: (courseId: string, data: Partial<CourseModule>) => api.post<CourseModule>(`/lms/admin/courses/${courseId}/modules`, data),
  updateModule: (courseId: string, id: string, data: Partial<CourseModule>) => api.put<CourseModule>(`/lms/admin/courses/${courseId}/modules/${id}`, data),
  deleteModule: (courseId: string, id: string) => api.delete(`/lms/admin/courses/${courseId}/modules/${id}`),
  reorderModules: (courseId: string, moduleIds: string[]) => api.put(`/lms/admin/courses/${courseId}/modules/reorder`, { moduleIds }),
  moveLessonToModule: (courseId: string, lessonId: string, moduleId: string | null, orderIndex?: number) =>
    api.put(`/lms/admin/courses/${courseId}/modules/lessons/move`, { lessonId, moduleId, orderIndex }),

  // Lessons
  getLessons: (courseId: string) => api.get<Lesson[]>(`/lms/admin/courses/${courseId}/lessons`),
  getLesson: (courseId: string, id: string) => api.get<Lesson>(`/lms/admin/courses/${courseId}/lessons/${id}`),
  createLesson: (courseId: string, data: Partial<Lesson>) => api.post<Lesson>(`/lms/admin/courses/${courseId}/lessons`, data),
  updateLesson: (courseId: string, id: string, data: Partial<Lesson>) => api.put<Lesson>(`/lms/admin/courses/${courseId}/lessons/${id}`, data),
  deleteLesson: (courseId: string, id: string) => api.delete(`/lms/admin/courses/${courseId}/lessons/${id}`),
  reorderLessons: (courseId: string, lessonIds: string[]) => api.put(`/lms/admin/courses/${courseId}/lessons/reorder`, { lessonIds }),

  // Video management
  attachExternalVideo: (courseId: string, lessonId: string, data: { provider: string; url: string; playbackId?: string; durationSeconds?: number }) =>
    api.post<Lesson>(`/lms/admin/courses/${courseId}/lessons/${lessonId}/attach-video`, data),
  removeVideo: (courseId: string, lessonId: string) =>
    api.delete(`/lms/admin/courses/${courseId}/lessons/${lessonId}/video`),

  // Quizzes
  getQuizzes: (courseId: string) => api.get<Quiz[]>(`/lms/admin/courses/${courseId}/quizzes`),
  getQuiz: (courseId: string, id: string) => api.get<Quiz>(`/lms/admin/courses/${courseId}/quizzes/${id}`),
  createQuiz: (courseId: string, data: Partial<Quiz>) => api.post<Quiz>(`/lms/admin/courses/${courseId}/quizzes`, data),
  updateQuiz: (courseId: string, id: string, data: Partial<Quiz>) => api.put<Quiz>(`/lms/admin/courses/${courseId}/quizzes/${id}`, data),
  deleteQuiz: (courseId: string, id: string) => api.delete(`/lms/admin/courses/${courseId}/quizzes/${id}`),

  // Questions
  addQuestion: (courseId: string, quizId: string, data: Partial<Question>) => api.post<Question>(`/lms/admin/courses/${courseId}/quizzes/${quizId}/questions`, data),
  updateQuestion: (courseId: string, questionId: string, data: Partial<Question>) => api.put<Question>(`/lms/admin/courses/${courseId}/quizzes/questions/${questionId}`, data),
  deleteQuestion: (courseId: string, questionId: string) => api.delete(`/lms/admin/courses/${courseId}/quizzes/questions/${questionId}`),

  // Enrollments
  getEnrollments: (courseId: string) => api.get<Enrollment[]>(`/lms/admin/courses/${courseId}/enrollments`),
  getEnrollmentStats: (courseId: string) => api.get<{ total: number; active: number; completed: number }>(`/lms/admin/courses/${courseId}/enrollments/stats`),
  updateEnrollment: (courseId: string, userId: string, data: { status: string }) => api.put(`/lms/admin/courses/${courseId}/enrollments/${userId}`, data),

  // Certificates
  revokeCertificate: (id: string, reason: string) => api.put(`/lms/admin/certificates/${id}/revoke`, { reason }),

  // Certificate Templates
  getCertificateTemplates: () => api.get('/lms/admin/certificate-templates'),
  getCertificateTemplate: (id: string) => api.get(`/lms/admin/certificate-templates/${id}`),
  getDefaultCertificateTemplate: () => api.get('/lms/admin/certificate-templates/default'),
  createCertificateTemplate: (data: any) => api.post('/lms/admin/certificate-templates', data),
  updateCertificateTemplate: (id: string, data: any) => api.put(`/lms/admin/certificate-templates/${id}`, data),
  deleteCertificateTemplate: (id: string) => api.delete(`/lms/admin/certificate-templates/${id}`),
  setDefaultCertificateTemplate: (id: string) => api.patch(`/lms/admin/certificate-templates/${id}/set-default`),
};

// LMS Student API
export const lmsApi = {
  // Public courses
  getCourses: (params?: { page?: number; limit?: number; category?: string; level?: string; priceType?: string }) =>
    api.get<{ courses: Course[]; pagination: { page: number; limit: number; total: number; pages: number } }>('/lms/courses', { params }),
  getCourse: (slug: string) => api.get<Course>(`/lms/courses/${slug}`),
  getCategories: () => api.get<string[]>('/lms/courses/categories'),

  // Enrollment
  enroll: (courseId: string, paymentId?: string) => api.post<Enrollment>(`/lms/courses/${courseId}/enroll`, { paymentId }),
  getMyEnrollments: () => api.get<Enrollment[]>('/lms/my-enrollments'),
  getEnrollment: (courseId: string) => api.get<Enrollment>(`/lms/courses/${courseId}/enrollment`),
  cancelEnrollment: (courseId: string) => api.delete(`/lms/courses/${courseId}/enrollment`),

  // Learning
  getCourseForLearning: (courseId: string) => api.get(`/lms/learn/${courseId}`),
  getLesson: (courseId: string, lessonId: string) => api.get(`/lms/learn/${courseId}/lessons/${lessonId}`),
  updateProgress: (courseId: string, lessonId: string, data: { videoWatchedSeconds?: number; lessonCompleted?: boolean }) =>
    api.put(`/lms/learn/${courseId}/lessons/${lessonId}/progress`, data),
  markLessonComplete: (courseId: string, lessonId: string) => api.post(`/lms/learn/${courseId}/lessons/${lessonId}/complete`),

  // Quizzes
  getQuiz: (courseId: string, quizId: string) => api.get(`/lms/learn/${courseId}/quizzes/${quizId}`),
  startQuiz: (courseId: string, quizId: string) => api.post(`/lms/learn/${courseId}/quizzes/${quizId}/start`),
  submitQuiz: (courseId: string, quizId: string, attemptId: string, answers: { questionId: string; answer: any }[]) =>
    api.post(`/lms/learn/${courseId}/quizzes/${quizId}/attempts/${attemptId}/submit`, { answers }),

  // Dashboard & Certificates
  getDashboard: () => api.get('/lms/dashboard'),
  getMyCertificates: () => api.get<Certificate[]>('/lms/my-certificates'),
  getCertificate: (id: string) => api.get<Certificate>(`/lms/certificates/${id}`),
  requestCertificate: (courseId: string) => api.post<Certificate>(`/lms/courses/${courseId}/certificate`),
  verifyCertificate: (hash: string) => api.get(`/lms/certificates/verify/${hash}`),
};

// Profile types
export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  email?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  about?: string;
  headline?: string;
  location?: string;
  website?: string;
  company?: string;
  jobTitle?: string;
  skills: string[];
  interests: string[];
  isPublic: boolean;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
  };
  followersCount: number;
  followingCount: number;
  postsCount: number;
  coursesCount: number;
  createdAt: string;
  role: string;
  twoFactorEnabled?: boolean;
  posts?: { id: string; title: string; slug: string; excerpt?: string; featuredImage?: string; createdAt: string }[];
  instructedCourses?: { id: string; title: string; slug: string; shortDescription?: string; thumbnail?: string }[];
  certificates?: { id: string; issuedAt: string; course: { title: string; slug: string } }[];
  badges?: { id: string; earnedAt: string; badge: Badge }[];
}

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
}

export interface ProfileStats {
  postsPublished: number;
  coursesCreated: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
}

export interface ActivityItem {
  type: 'post_published' | 'timeline_post' | 'course_enrolled' | 'course_completed' | 'certificate_earned';
  title: string;
  link: string;
  date: string;
}

// Feed Activity Types
export type FeedActivityType =
  | 'POST_PUBLISHED'
  | 'POST_LIKED'
  | 'POST_COMMENTED'
  | 'COURSE_ENROLLED'
  | 'COURSE_COMPLETED'
  | 'CERTIFICATE_EARNED'
  | 'BADGE_EARNED'
  | 'PROFILE_UPDATED'
  | 'NEW_FOLLOWER'
  | 'STARTED_FOLLOWING'
  | 'STATUS_UPDATE';

export interface CreateTimelinePostDto {
  content: string;
  imageUrl?: string;
  isPublic?: boolean;
}

export interface FeedActivity {
  id: string;
  userId: string;
  type: FeedActivityType;
  targetType?: string;
  targetId?: string;
  title: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    headline?: string;
    followersCount?: number;
  };
}

export interface FeedResponse {
  data: FeedActivity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SuggestedUser {
  id: string;
  username?: string;
  name: string;
  avatar?: string;
  headline?: string;
  followersCount: number;
  interests: string[];
  skills: string[];
  matchScore: number;
  sharedInterests: number;
  sharedSkills: number;
}

export interface MutualStatus {
  userFollowsTarget: boolean;
  targetFollowsUser: boolean;
  isMutual: boolean;
}

// Profile API
export const profileApi = {
  // My profile
  getMyProfile: () => api.get<UserProfile>('/profiles/me'),
  updateMyProfile: (data: Partial<UserProfile>) => api.put<UserProfile>('/profiles/me', data),
  getMyStats: () => api.get<ProfileStats>('/profiles/me/stats'),
  getMyActivity: (page?: number, limit?: number) =>
    api.get<{ activities: ActivityItem[] }>('/profiles/me/activity', { params: { page, limit } }),
  getMyFollowers: (page?: number, limit?: number) =>
    api.get('/profiles/me/followers', { params: { page, limit } }),
  getMyFollowing: (page?: number, limit?: number) =>
    api.get('/profiles/me/following', { params: { page, limit } }),
  getSuggestedUsers: (limit?: number) =>
    api.get<SuggestedUser[]>('/profiles/me/suggested', { params: { limit } }),

  // Public profiles
  getProfile: (identifier: string) => api.get<UserProfile>(`/profiles/${identifier}`),
  getProfileStats: (identifier: string) => api.get<ProfileStats>(`/profiles/${identifier}/stats`),
  getProfileActivity: (identifier: string, page?: number, limit?: number) =>
    api.get<{ activities: ActivityItem[] }>(`/profiles/${identifier}/activity`, { params: { page, limit } }),
  getProfileFollowers: (identifier: string, page?: number, limit?: number) =>
    api.get(`/profiles/${identifier}/followers`, { params: { page, limit } }),
  getProfileFollowing: (identifier: string, page?: number, limit?: number) =>
    api.get(`/profiles/${identifier}/following`, { params: { page, limit } }),
  getMutualConnections: (identifier: string, page?: number, limit?: number) =>
    api.get(`/profiles/${identifier}/mutual-connections`, { params: { page, limit } }),
  getMutualFollowing: (identifier: string, page?: number, limit?: number) =>
    api.get(`/profiles/${identifier}/mutual-following`, { params: { page, limit } }),
  getMutualStatus: (identifier: string) =>
    api.get<MutualStatus>(`/profiles/${identifier}/mutual-status`),

  // Follow actions
  getFollowingStatus: (identifier: string) =>
    api.get<{ isFollowing: boolean }>(`/profiles/${identifier}/following-status`),
  followUser: (identifier: string) => api.post(`/profiles/${identifier}/follow`),
  unfollowUser: (identifier: string) => api.delete(`/profiles/${identifier}/follow`),

  // Search
  searchUsers: (query: string, page?: number, limit?: number) =>
    api.get('/profiles/search', { params: { q: query, page, limit } }),
};

// Feed API
export const feedApi = {
  // Get following feed (activities from users you follow)
  getFollowingFeed: (page?: number, limit?: number, type?: FeedActivityType) =>
    api.get<FeedResponse>('/feed/following', { params: { page, limit, type } }),

  // Get discover feed (trending/recommended content)
  getDiscoverFeed: (page?: number, limit?: number, type?: FeedActivityType) =>
    api.get<FeedResponse>('/feed/discover', { params: { page, limit, type } }),

  // Get trending users
  getTrendingUsers: (limit?: number) =>
    api.get<SuggestedUser[]>('/feed/trending-users', { params: { limit } }),

  // Get my activities
  getMyActivities: (page?: number, limit?: number, type?: FeedActivityType) =>
    api.get<FeedResponse>('/feed/my-activities', { params: { page, limit, type } }),

  // Create a timeline post (status update)
  createPost: (dto: CreateTimelinePostDto) =>
    api.post<FeedActivity>('/feed/posts', dto),

  // Delete an activity
  deleteActivity: (id: string) => api.delete(`/feed/activities/${id}`),
};

// Timeline Post types
export interface PostMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'GIF' | 'AUDIO' | 'LINK';
  url: string;
  thumbnail?: string;
  altText?: string;
  width?: number;
  height?: number;
  duration?: number;
  order: number;
  // Link preview metadata
  linkTitle?: string;
  linkDescription?: string;
  linkSiteName?: string;
}

export interface TimelinePostUser {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  headline?: string;
}

export interface TimelineHashtag {
  id: string;
  tag: string;
}

export interface TimelineMention {
  id: string;
  username?: string;
  name: string;
  avatar?: string;
}

export interface TimelinePost {
  id: string;
  content?: string;
  shareComment?: string;
  isPublic: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
  user: TimelinePostUser;
  media: PostMedia[];
  hashtags: TimelineHashtag[];
  mentions: TimelineMention[];
  originalPost?: {
    id: string;
    content?: string;
    createdAt: string;
    user: TimelinePostUser;
    media: PostMedia[];
  };
  isLiked: boolean;
  isShared: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  likesCount: number;
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  replies?: PostComment[];
  _count?: { replies: number };
}

export interface TimelinePostsResponse {
  data: TimelinePost[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface CreatePostMediaDto {
  type: 'IMAGE' | 'VIDEO' | 'GIF' | 'AUDIO' | 'LINK';
  url: string;
  thumbnail?: string;
  altText?: string;
  width?: number;
  height?: number;
  duration?: number;
  // Link preview metadata
  linkTitle?: string;
  linkDescription?: string;
  linkSiteName?: string;
}

export interface CreateTimelinePostInputDto {
  content?: string;
  isPublic?: boolean;
  media?: CreatePostMediaDto[];
}

// Timeline API
export const timelineApi = {
  // Create a new post
  createPost: (dto: CreateTimelinePostInputDto) =>
    api.post<TimelinePost>('/timeline/posts', dto),

  // Get feed (posts from followed users)
  getFeed: (page?: number, limit?: number) =>
    api.get<TimelinePostsResponse>('/timeline/feed', { params: { page, limit } }),

  // Get discover feed (all public posts)
  getDiscover: (page?: number, limit?: number) =>
    api.get<TimelinePostsResponse>('/timeline/discover', { params: { page, limit } }),

  // Get user's posts
  getUserPosts: (userId: string, page?: number, limit?: number) =>
    api.get<TimelinePostsResponse>(`/timeline/users/${userId}/posts`, { params: { page, limit } }),

  // Get single post
  getPost: (postId: string) =>
    api.get<TimelinePost>(`/timeline/posts/${postId}`),

  // Like a post
  likePost: (postId: string) =>
    api.post(`/timeline/posts/${postId}/like`),

  // Unlike a post
  unlikePost: (postId: string) =>
    api.delete(`/timeline/posts/${postId}/like`),

  // Add comment
  addComment: (postId: string, content: string, parentId?: string) =>
    api.post<PostComment>(`/timeline/posts/${postId}/comments`, { content, parentId }),

  // Get comments
  getComments: (postId: string, page?: number, limit?: number) =>
    api.get<{ data: PostComment[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/timeline/posts/${postId}/comments`,
      { params: { page, limit } }
    ),

  // Delete a comment
  deleteComment: (postId: string, commentId: string) =>
    api.delete(`/timeline/posts/${postId}/comments/${commentId}`),

  // Update a post
  updatePost: (postId: string, data: { content?: string; isPublic?: boolean }) =>
    api.patch<TimelinePost>(`/timeline/posts/${postId}`, data),

  // Delete a post
  deletePost: (postId: string) =>
    api.delete(`/timeline/posts/${postId}`),

  // Share a post
  sharePost: (postId: string, comment?: string, isPublic?: boolean) =>
    api.post<TimelinePost>(`/timeline/posts/${postId}/share`, { comment, isPublic }),

  // Get trending hashtags
  getTrendingHashtags: (limit?: number) =>
    api.get<{ id: string; tag: string; postCount: number }[]>('/timeline/hashtags/trending', { params: { limit } }),

  // Get posts by hashtag
  getPostsByHashtag: (tag: string, page?: number, limit?: number) =>
    api.get<TimelinePostsResponse & { hashtag: { tag: string; postCount: number } }>(
      `/timeline/hashtags/${encodeURIComponent(tag)}`,
      { params: { page, limit } }
    ),

  // Search users for mention autocomplete
  searchUsersForMention: (query: string) =>
    api.get<TimelinePostUser[]>('/timeline/mentions/search', { params: { q: query } }),

  // Fetch URL preview metadata
  fetchUrlPreview: (url: string) =>
    api.post<UrlPreviewData>('/timeline/url-preview', { url }),
};

// URL Preview types
export interface UrlPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
}

// Developer Marketplace types
export interface DeveloperProfile {
  id: string;
  username?: string;
  name: string;
  displayName?: string;
  avatar?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: string[];
  languages?: string[];
  frameworks?: string[];
  category?: string;
  hourlyRate?: number;
  minimumBudget?: number;
  yearsOfExperience?: number;
  availability?: 'available' | 'busy' | 'unavailable';
  availableHours?: number;
  timezone?: string;
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  followersCount: number;
  coursesCount: number;
  certificatesCount: number;
  rating?: number;
  reviewsCount?: number;
  reviewCount?: number;
  completedProjects?: number;
  websiteUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'INACTIVE';
  isVerified?: boolean;
  isFeatured?: boolean;
  createdAt: string;
}

export interface DeveloperMarketplaceQuery {
  page?: number;
  limit?: number;
  search?: string;
  skills?: string[];
  availability?: string;
  experienceLevel?: string;
  minRate?: number;
  maxRate?: number;
  location?: string;
  sortBy?: 'rating' | 'experience' | 'rate' | 'projects' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

// Developer Marketplace API
export const developerMarketplaceApi = {
  // Browse developers (public - only active)
  getDevelopers: (query?: DeveloperMarketplaceQuery) =>
    api.get<{ developers: DeveloperProfile[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/marketplace/developers',
      { params: query }
    ),

  // Get featured developers
  getFeatured: (limit = 6) =>
    api.get<DeveloperProfile[]>('/marketplace/developers/featured', { params: { limit } }),

  // Get developer by ID or username
  getDeveloper: (identifier: string) =>
    api.get<DeveloperProfile>(`/marketplace/developers/${identifier}`),

  // Get developer by slug (public profile)
  getDeveloperBySlug: (slug: string) =>
    api.get<DeveloperProfile>(`/marketplace/developers/profile/${slug}`),

  // Get available skills for filtering
  getSkills: () =>
    api.get<{ skill: string; count: number }[]>('/marketplace/developers/skills'),

  // Get marketplace stats
  getStats: () =>
    api.get<{ totalDevelopers: number; availableDevelopers: number; avgRating: number; topSkills: string[] }>('/marketplace/developers/stats'),

  // Contact developer (send inquiry)
  contactDeveloper: (developerId: string, data: { subject: string; message: string; projectDetails?: string }) =>
    api.post(`/marketplace/developers/${developerId}/contact`, data),

  // Get my developer profile
  getMyProfile: () =>
    api.get<DeveloperProfile>('/marketplace/developers/me'),

  // Update my developer profile
  updateMyProfile: (data: Partial<DeveloperProfile>) =>
    api.put<DeveloperProfile>('/marketplace/developers/me', data),

  // Admin: Get all developers (all statuses)
  adminGetDevelopers: (query?: DeveloperMarketplaceQuery & { status?: string }) =>
    api.get<{ developers: DeveloperProfile[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      '/marketplace/developers/admin/all',
      { params: query }
    ),

  // Admin: Get users available to become developers
  adminGetAvailableUsers: (search?: string, limit?: number) =>
    api.get<{ id: string; name: string; email: string; avatar?: string; username?: string }[]>(
      '/marketplace/developers/admin/available-users',
      { params: { search, limit } }
    ),

  // Admin: Create developer profile directly
  adminCreateDeveloper: (data: {
    userId: string;
    displayName: string;
    headline?: string;
    bio?: string;
    category?: string;
    skills?: string[];
    languages?: string[];
    frameworks?: string[];
    hourlyRate: number;
    minimumBudget?: number;
    yearsOfExperience?: number;
    websiteUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    status?: string;
    isVerified?: boolean;
    rating?: number;
    reviewCount?: number;
  }) => api.post<DeveloperProfile>('/marketplace/developers/admin/create', data),

  // Admin: Approve developer
  adminApprove: (id: string) =>
    api.patch(`/marketplace/developers/${id}/approve`),

  // Admin: Reject developer
  adminReject: (id: string, reason: string) =>
    api.patch(`/marketplace/developers/${id}/reject`, { reason }),

  // Admin: Suspend developer
  adminSuspend: (id: string, reason: string) =>
    api.patch(`/marketplace/developers/${id}/suspend`, { reason }),

  // Admin: Reactivate developer
  adminReactivate: (id: string) =>
    api.patch(`/marketplace/developers/${id}/reactivate`),

  // Admin: Set featured status
  adminSetFeatured: (id: string, featured: boolean, days?: number) =>
    api.patch(`/marketplace/developers/${id}/featured`, { featured, days }),

  // Admin: Delete developer permanently
  adminDelete: (id: string) =>
    api.delete(`/marketplace/developers/${id}`),

  // Admin: Update developer profile
  adminUpdate: (id: string, data: Partial<DeveloperProfile>) =>
    api.put<DeveloperProfile>(`/marketplace/developers/${id}`, data),

  // Admin: Get developer by ID
  adminGetDeveloper: (id: string) =>
    api.get<DeveloperProfile>(`/marketplace/developers/${id}`),
};

// Direct Messages API
// Media attachment interface for messages
interface MediaAttachment {
  url: string;
  type: 'image' | 'video' | 'audio';
  filename: string;
  size: number;
  mimeType: string;
}

export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  startConversation: (userId: string) => api.post('/messages/conversations', { userId }),
  getMessages: (conversationId: string, cursor?: string, limit?: number) =>
    api.get(`/messages/conversations/${conversationId}/messages`, { params: { cursor, limit } }),
  sendMessage: (conversationId: string, content: string, media?: MediaAttachment[]) =>
    api.post(`/messages/conversations/${conversationId}/messages`, { content, media }),
  deleteMessage: (conversationId: string, messageId: string) =>
    api.delete(`/messages/conversations/${conversationId}/messages/${messageId}`),
  deleteConversation: (conversationId: string) =>
    api.delete(`/messages/conversations/${conversationId}`),
  markAsRead: (conversationId: string) => api.post(`/messages/conversations/${conversationId}/read`),
  getUnreadCount: () => api.get('/messages/unread-count'),
  getOnlineUsers: () => api.get('/messages/online-users'),
  uploadMedia: (formData: FormData) =>
    api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Email API
export const emailApi = {
  // Templates
  getTemplates: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get('/email/templates', { params }),
  getTemplate: (id: string) => api.get(`/email/templates/${id}`),
  createTemplate: (data: {
    name: string;
    slug: string;
    type?: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    variables?: { name: string; description?: string; example?: string }[];
    isActive?: boolean;
  }) => api.post('/email/templates', data),
  updateTemplate: (id: string, data: Partial<{
    name: string;
    slug: string;
    type: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: { name: string; description?: string; example?: string }[];
    isActive: boolean;
  }>) => api.put(`/email/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/email/templates/${id}`),
  previewTemplate: (id: string, variables?: Record<string, unknown>) =>
    api.post(`/email/templates/${id}/preview`, { variables }),

  // Sending
  sendEmail: (data: { to: string; toName?: string; subject: string; html: string; text?: string }) =>
    api.post('/email/send', data),
  sendTemplateEmail: (data: {
    templateId: string;
    to: string;
    toName?: string;
    subject?: string;
    variables?: Record<string, unknown>;
  }) => api.post('/email/send-template', data),
  sendBulkEmail: (data: {
    templateId: string;
    subject?: string;
    recipientType: 'all' | 'role' | 'specific';
    role?: string;
    userIds?: string[];
    variables?: Record<string, unknown>;
    sendTestTo?: string;
  }) => api.post('/email/send-bulk', data),
  sendTestEmail: (data: { templateId: string; to: string; variables?: Record<string, unknown> }) =>
    api.post('/email/send-test', data),
  verifyConnection: () => api.get('/email/verify'),

  // Logs
  getLogs: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    templateId?: string;
    toEmail?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/email/logs', { params }),
  getLog: (id: string) => api.get(`/email/logs/${id}`),
  getLogStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/email/logs/stats', { params }),
  getRecentActivity: (limit?: number) => api.get('/email/logs/recent', { params: { limit } }),
  cleanupLogs: (daysOld?: number) => api.delete('/email/logs/cleanup', { params: { daysOld } }),
};

// Page Customization API
export const pageCustomizationApi = {
  getAll: () => api.get('/page-customizations'),
  getById: (id: string) => api.get(`/page-customizations/${id}`),
  getByPageId: (pageId: string) => api.get(`/page-customizations/page/${pageId}`),
  create: (data: any) => api.post('/page-customizations', data),
  update: (id: string, data: any) => api.put(`/page-customizations/${id}`, data),
  delete: (id: string) => api.delete(`/page-customizations/${id}`),
};

// Post Customization API
export const postCustomizationApi = {
  getAll: () => api.get('/post-customizations'),
  getById: (id: string) => api.get(`/post-customizations/${id}`),
  getByPostId: (postId: string) => api.get(`/post-customizations/post/${postId}`),
  create: (data: any) => api.post('/post-customizations', data),
  update: (id: string, data: any) => api.put(`/post-customizations/${id}`, data),
  delete: (id: string) => api.delete(`/post-customizations/${id}`),
};

// Customization Export/Import API
export const customizationExportApi = {
  exportPages: () => api.get('/customizations/export/pages'),
  exportPosts: () => api.get('/customizations/export/posts'),
  exportAll: () => api.get('/customizations/export/all'),
  import: (data: any) => api.post('/customizations/import', data),
};

// Customization Presets API
export const customizationPresetsApi = {
  getAllPresets: () => api.get('/customizations/presets'),
  getPresetsByCategory: (category: 'page' | 'post' | 'both') =>
    api.get(`/customizations/presets/category/${category}`),
  getPresetById: (id: string) => api.get(`/customizations/presets/${id}`),
  getPresetSettings: (id: string) => api.get(`/customizations/presets/${id}/settings`),
  addPreset: (data: any) => api.post('/customizations/presets', data),
  removePreset: (id: string) => api.delete(`/customizations/presets/${id}`),
};

// Notification type
export interface Notification {
  id: string;
  userId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM' | 'USER_ACTION' | 'CONTENT' | 'SECURITY' | 'MARKETPLACE';
  title: string;
  message: string;
  link?: string;
  icon?: string;
  iconColor?: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Notifications API
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean; type?: string }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  deleteAllRead: () => api.delete('/notifications/clear/read'),
  clearAll: () => api.delete('/notifications/clear/all'),
};

// Backup types
export interface Backup {
  id: string;
  name: string;
  description?: string;
  type: 'FULL' | 'DATABASE' | 'MEDIA' | 'THEMES' | 'PLUGINS' | 'SCHEDULED';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  filePath?: string;
  fileSize?: number;
  checksum?: string;
  includesDatabase: boolean;
  includesMedia: boolean;
  includesThemes: boolean;
  includesPlugins: boolean;
  tablesCount?: number;
  recordsCount?: number;
  filesCount?: number;
  errorMessage?: string;
  createdBy?: { id: string; name: string; email: string };
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// Backups API
export const backupsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; type?: string }) =>
    api.get('/backups', { params }),
  getStats: () => api.get('/backups/stats'),
  getOne: (id: string) => api.get(`/backups/${id}`),
  create: (data: { name: string; description?: string; type?: string; includesDatabase?: boolean; includesMedia?: boolean; includesThemes?: boolean; includesPlugins?: boolean }) =>
    api.post('/backups', data),
  quickBackup: () => api.post('/backups/quick'),
  databaseBackup: () => api.post('/backups/database'),
  delete: (id: string) => api.delete(`/backups/${id}`),
  getDownloadUrl: (id: string) => `/api/backups/${id}/download`,
  restore: (id: string, options?: { restoreDatabase?: boolean; restoreMedia?: boolean; restoreThemes?: boolean; restorePlugins?: boolean }) =>
    api.post(`/backups/${id}/restore`, options || {}),
};

// Recommendations API
export interface RecommendationRule {
  id: string;
  name: string;
  description?: string;
  sourceType: string;   // 'post', 'page', 'product', 'course', 'category', 'tag', 'global'
  sourceId?: string;
  targetType: string;   // what content to recommend
  algorithm: string;    // 'related', 'trending', 'personalized', 'manual', 'popular', 'recent'
  priority: number;     // higher = more important
  isActive: boolean;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationSettings {
  id: string;
  enablePersonalization: boolean;
  enableTrending: boolean;
  enableRelated: boolean;
  cacheEnabled: boolean;
  cacheDuration: number;
  maxRecommendations: number;
  minScore: number;
  excludeCategories: string[];
  excludeTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationAnalytics {
  totalClicks: number;
  totalImpressions: number;
  clickThroughRate: number;
  topPerforming: Array<{ contentId: string; contentType: string; title?: string; clicks: number; impressions: number; ctr: number }>;
  byAlgorithm: Array<{ algorithm: string; clicks: number; impressions: number; ctr: number }>;
  dailyStats: Array<{ date: string; clicks: number; impressions: number }>;
}

export const recommendationsApi = {
  // Rules
  getRules: () => api.get<RecommendationRule[]>('/admin/recommendations/rules'),
  getRule: (id: string) => api.get<RecommendationRule>(`/admin/recommendations/rules/${id}`),
  createRule: (data: Partial<RecommendationRule>) => api.post<RecommendationRule>('/admin/recommendations/rules', data),
  updateRule: (id: string, data: Partial<RecommendationRule>) => api.put<RecommendationRule>(`/admin/recommendations/rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`/admin/recommendations/rules/${id}`),

  // Settings
  getSettings: () => api.get<RecommendationSettings>('/admin/recommendations/settings'),
  updateSettings: (data: Partial<RecommendationSettings>) => api.put<RecommendationSettings>('/admin/recommendations/settings', data),

  // Analytics
  getAnalytics: (params?: { period?: string; contentType?: string }) =>
    api.get('/admin/recommendations/analytics', { params }),
  getAnalyticsCTR: (period?: string) =>
    api.get('/admin/recommendations/analytics/ctr', { params: { period } }),
  getAnalyticsTop: (period?: string, limit?: number) =>
    api.get('/admin/recommendations/analytics/top', { params: { period, limit } }),
  getAnalyticsDaily: (period?: string, contentType?: string) =>
    api.get('/admin/recommendations/analytics/daily', { params: { period, contentType } }),

  // Cache
  clearCache: (contentType?: string) => api.post('/admin/recommendations/cache/clear', { contentType }),

  // Preview recommendations
  previewRecommendations: (contentType: string, contentId: string, limit?: number) =>
    api.get(`/recommendations/${contentType}s/${contentId}`, { params: { limit } }),
};

// Updates API
export interface UpdateStatus {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  versionInfo?: {
    version: string;
    releaseDate: string;
    changelog: string;
    releaseNotes: string;
    downloadUrl: string;
    checksum: string;
    fileSize: number;
    breakingChanges: boolean;
    requiresManualSteps: boolean;
  };
  pendingMigrations: string[];
  updateInProgress: boolean;
  currentProgress: {
    stage: string;
    progress: number;
    message: string;
  };
}

export interface UpdateHistoryItem {
  id: string;
  fromVersion: string;
  toVersion: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  changelog?: string;
  errorMessage?: string;
  rolledBack: boolean;
  backup?: { id: string; name: string };
  initiatedByUser?: { id: string; name: string; email: string };
}

export const updatesApi = {
  // Get current update status
  getStatus: () => api.get<UpdateStatus>('/updates/status'),

  // Check for updates
  checkForUpdates: () => api.get('/updates/check'),

  // Get available updates
  getAvailableUpdates: () => api.get('/updates/available'),

  // Get update history
  getHistory: (limit?: number) => api.get<UpdateHistoryItem[]>('/updates/history', { params: { limit } }),

  // Get version info
  getVersionInfo: () => api.get('/updates/version'),

  // Check compatibility for a version
  checkCompatibility: (version: string) => api.get(`/updates/compatibility/${version}`),

  // Download an update
  downloadUpdate: (version: string) => api.post('/updates/download', { version }),

  // Apply an update
  applyUpdate: (version: string) => api.post('/updates/apply', { version }),

  // Rollback an update
  rollback: (updateHistoryId: string) => api.post(`/updates/rollback/${updateHistoryId}`),

  // Pull latest from GitHub main branch (quick updates)
  pullLatest: () => api.post<{
    success: boolean;
    message: string;
    fromVersion: string;
    toVersion: string;
    logs: string[];
  }>('/updates/pull-latest'),
};

// Demo Analytics API
export interface DemoUserDetail {
  id: string;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
  lastAccessedAt: string | null;
  sessionCount: number;
  totalTimeSpent: number;
  requestCount: number;
  featuresUsed: string[];
  topFeatures: { feature: string; count: number }[];
  postsCreated: number;
  pagesCreated: number;
  upgradeRequested: boolean;
  engagementScore: number;
  isOnMailingList: boolean;
}

export interface DemoSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  pagesViewed: number;
  actionsCount: number;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface DemoLoginAttempt {
  id: string;
  email: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface DemoMetrics {
  totalDemos: number;
  activeDemos: number;
  expiredDemos: number;
  conversions: number;
  conversionRate: number;
  pageViews: number;
  ctaClicks: number;
  inquiries: number;
  hostingerClicks: number;
  customDevClicks: number;
  emailsSent: number;
  emailsOpened: number;
  unsubscribes: number;
}

export interface MarketingList {
  id: string;
  name: string;
  description: string | null;
  type: string;
  subscriberCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface DemoUsersResponse {
  users: DemoUserDetail[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DemoListFilters {
  status?: 'active' | 'expired' | 'all';
  segment?: 'high_engagement' | 'low_engagement' | 'upgrade_requested' | 'all';
  search?: string;
  sortBy?: 'createdAt' | 'lastAccessedAt' | 'engagementScore' | 'sessionCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const demoAnalyticsApi = {
  // Get conversion metrics
  getMetrics: () => api.get<DemoMetrics>('/admin/demo-analytics/api/metrics'),

  // Get demo users with filtering
  getUsers: (filters?: DemoListFilters) =>
    api.get<DemoUsersResponse>('/admin/demo-analytics/api/users', { params: filters }),

  // Get single user detail
  getUserDetail: (id: string) =>
    api.get<DemoUserDetail>('/admin/demo-analytics/api/users/' + id),

  // Get user sessions
  getUserSessions: (id: string) =>
    api.get<DemoSession[]>('/admin/demo-analytics/api/users/' + id + '/sessions'),

  // Get user login attempts
  getUserLogins: (id: string) =>
    api.get<DemoLoginAttempt[]>('/admin/demo-analytics/api/users/' + id + '/logins'),

  // Extend demo
  extendDemo: (id: string, hours: number) =>
    api.post('/admin/demo-analytics/api/users/' + id + '/extend', { hours }),

  // Reset access token
  resetAccess: (id: string) =>
    api.post<{ success: boolean; newToken: string }>('/admin/demo-analytics/api/users/' + id + '/reset-access'),

  // Add to mailing list
  addToMailingList: (id: string, listId?: string) =>
    api.post('/admin/demo-analytics/api/users/' + id + '/add-to-list', { listId }),

  // Remove from mailing list
  removeFromMailingList: (id: string) =>
    api.post('/admin/demo-analytics/api/users/' + id + '/remove-from-list'),

  // Bulk add to mailing list
  bulkAddToMailingList: (demoIds: string[], listId?: string) =>
    api.post<{ success: boolean; added: number }>('/admin/demo-analytics/api/bulk/add-to-list', { demoIds, listId }),

  // Get marketing lists
  getMarketingLists: () =>
    api.get<MarketingList[]>('/admin/demo-analytics/api/lists'),

  // Export users (returns CSV)
  exportUsers: (filters?: { status?: string; segment?: string }) =>
    api.get('/admin/demo-analytics/api/export', {
      params: filters,
      responseType: 'blob',
    }),

  // Delete a demo user
  deleteUser: (id: string) =>
    api.delete<{ success: boolean }>('/admin/demo-analytics/api/users/' + id),

  // Bulk delete demo users
  bulkDeleteUsers: (demoIds: string[]) =>
    api.post<{ success: boolean; deleted: number }>('/admin/demo-analytics/api/bulk/delete', { demoIds }),
};

// Reel Types
export interface Reel {
  id: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration: number;
  isPublic: boolean;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
  };
  _count?: {
    likes: number;
    comments: number;
    views: number;
  };
  isLiked?: boolean;
}

export interface ReelComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  replies?: ReelComment[];
  _count?: { replies: number };
}

// Reels API
export const reelsApi = {
  // Get reels feed
  getReels: (page = 1, limit = 20, userId?: string) =>
    api.get<{ reels: Reel[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/reels',
      { params: { page, limit, userId } }
    ),

  // Get single reel
  getReel: (id: string) => api.get<Reel>(`/reels/${id}`),

  // Create reel
  createReel: (data: { videoUrl: string; thumbnailUrl?: string; caption?: string; duration: number; isPublic?: boolean; hashtags?: string[] }) =>
    api.post<Reel>('/reels', data),

  // Upload video
  uploadVideo: (formData: FormData) =>
    api.post<{ videoUrl: string; thumbnailUrl?: string; fileSize: number; mimeType: string }>('/reels/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Update reel
  updateReel: (id: string, data: { caption?: string; isPublic?: boolean }) =>
    api.patch<Reel>(`/reels/${id}`, data),

  // Delete reel
  deleteReel: (id: string) => api.delete(`/reels/${id}`),

  // Like reel
  likeReel: (id: string) => api.post(`/reels/${id}/like`),

  // Unlike reel
  unlikeReel: (id: string) => api.delete(`/reels/${id}/like`),

  // Get comments
  getComments: (reelId: string, page = 1, limit = 20) =>
    api.get<{ comments: ReelComment[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/reels/${reelId}/comments`,
      { params: { page, limit } }
    ),

  // Create comment
  createComment: (reelId: string, content: string, parentId?: string) =>
    api.post<ReelComment>(`/reels/${reelId}/comments`, { content, parentId }),

  // Track view
  trackView: (reelId: string, watchTime: number, completed?: boolean) =>
    api.post(`/reels/${reelId}/view`, { watchTime, completed }),

  // Get user's reels
  getUserReels: (userId: string, page = 1, limit = 20) =>
    api.get<{ reels: Reel[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/reels',
      { params: { page, limit, userId } }
    ),
};
