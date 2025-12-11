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
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  verify2FA: (tempToken: string, code: string) =>
    api.post('/auth/verify-2fa', { tempToken, code }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
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
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) => api.delete(`/media/${id}`),
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
  set: (key: string, value: any, type: string, group?: string) =>
    api.post('/settings', { key, value, type, group }),
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
  type: 'CUSTOM' | 'PAGE' | 'POST' | 'HOME' | 'SHOP' | 'PRODUCT' | 'CATEGORY';
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
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  type: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  featured: boolean;
  images: string[];
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
  name: string;
  sku?: string;
  price: number;
  stock: number;
  options: Record<string, string>;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
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
  productId: string;
  variantId?: string;
  quantity: number;
  product: Product;
  variant?: { id: string; name: string; price: number; options: Record<string, string> };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
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
  add: (productId: string, quantity: number, variantId?: string) =>
    api.post<Cart>('/shop/cart/add', { productId, quantity, variantId }),
  update: (itemId: string, quantity: number) =>
    api.put<Cart>(`/shop/cart/item/${itemId}`, { quantity }),
  remove: (itemId: string) => api.delete<Cart>(`/shop/cart/item/${itemId}`),
  clear: () => api.delete<Cart>('/shop/cart/clear'),
};

export const checkoutApi = {
  getConfig: () => api.get<{ publishableKey: string }>('/shop/checkout/config'),
  createOrder: (data: { email: string; shippingAddress?: object; billingAddress?: object }) =>
    api.post<{ order: Order; clientSecret: string; paymentIntentId: string }>('/shop/checkout/create-order', data),
  getOrder: (id: string) => api.get<Order>(`/shop/orders/${id}`),
};
