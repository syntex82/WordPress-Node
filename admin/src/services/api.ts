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
  estimatedMinutes?: number;
  isPreview: boolean;
  isRequired: boolean;
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
  // Courses
  getCourses: (params?: { page?: number; limit?: number; status?: string; category?: string }) =>
    api.get<{ courses: Course[]; pagination: { page: number; limit: number; total: number; pages: number } }>('/lms/admin/courses', { params }),
  getCourse: (id: string) => api.get<Course>(`/lms/admin/courses/${id}`),
  createCourse: (data: Partial<Course>) => api.post<Course>('/lms/admin/courses', data),
  updateCourse: (id: string, data: Partial<Course>) => api.put<Course>(`/lms/admin/courses/${id}`, data),
  deleteCourse: (id: string) => api.delete(`/lms/admin/courses/${id}`),
  getCategories: () => api.get<string[]>('/lms/admin/courses/categories/list'),

  // Lessons
  getLessons: (courseId: string) => api.get<Lesson[]>(`/lms/admin/courses/${courseId}/lessons`),
  getLesson: (courseId: string, id: string) => api.get<Lesson>(`/lms/admin/courses/${courseId}/lessons/${id}`),
  createLesson: (courseId: string, data: Partial<Lesson>) => api.post<Lesson>(`/lms/admin/courses/${courseId}/lessons`, data),
  updateLesson: (courseId: string, id: string, data: Partial<Lesson>) => api.put<Lesson>(`/lms/admin/courses/${courseId}/lessons/${id}`, data),
  deleteLesson: (courseId: string, id: string) => api.delete(`/lms/admin/courses/${courseId}/lessons/${id}`),
  reorderLessons: (courseId: string, lessonIds: string[]) => api.put(`/lms/admin/courses/${courseId}/lessons/reorder`, { lessonIds }),

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
  type: 'post_published' | 'course_enrolled' | 'course_completed' | 'certificate_earned';
  title: string;
  link: string;
  date: string;
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

  // Public profiles
  getProfile: (identifier: string) => api.get<UserProfile>(`/profiles/${identifier}`),
  getProfileStats: (identifier: string) => api.get<ProfileStats>(`/profiles/${identifier}/stats`),
  getProfileActivity: (identifier: string, page?: number, limit?: number) =>
    api.get<{ activities: ActivityItem[] }>(`/profiles/${identifier}/activity`, { params: { page, limit } }),
  getProfileFollowers: (identifier: string, page?: number, limit?: number) =>
    api.get(`/profiles/${identifier}/followers`, { params: { page, limit } }),
  getProfileFollowing: (identifier: string, page?: number, limit?: number) =>
    api.get(`/profiles/${identifier}/following`, { params: { page, limit } }),

  // Follow actions
  getFollowingStatus: (identifier: string) =>
    api.get<{ isFollowing: boolean }>(`/profiles/${identifier}/following-status`),
  followUser: (identifier: string) => api.post(`/profiles/${identifier}/follow`),
  unfollowUser: (identifier: string) => api.delete(`/profiles/${identifier}/follow`),

  // Search
  searchUsers: (query: string, page?: number, limit?: number) =>
    api.get('/profiles/search', { params: { q: query, page, limit } }),
};
