/**
 * Role-based Permissions Configuration
 * Defines what each role can access in the admin panel
 *
 * Access Control Rules:
 * - ADMIN: Full access to all features
 * - EDITOR/AUTHOR: No access to shop or LMS course creation (requires upgrade)
 * - VIEWER: Access to messages and groups only
 */

export type UserRole = 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'VIEWER';

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface RolePermissions {
  dashboard: Permission;
  analytics: Permission;
  seo: Permission;
  posts: Permission;
  pages: Permission;
  media: Permission;
  menus: Permission;
  users: Permission;
  messages: Permission;
  groups: Permission;
  security: Permission;
  settings: Permission;
  shop: Permission;
  lms: Permission;
  themes: Permission;
  plugins: Permission;
  email: Permission;
  recommendations: Permission;
  marketplace: Permission;
  payments: Permission;
}

// Features that require an upgraded subscription for non-admin users
export const PREMIUM_FEATURES = ['shop', 'lms'] as const;
export type PremiumFeature = typeof PREMIUM_FEATURES[number];

// Check if a feature requires premium access for a given role
export function requiresPremiumAccess(role: string, feature: string): boolean {
  if (role === 'ADMIN') return false;
  return PREMIUM_FEATURES.includes(feature as PremiumFeature);
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    dashboard: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    analytics: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    seo: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    posts: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    pages: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    media: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    menus: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    users: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    messages: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    groups: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    security: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    settings: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    shop: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    lms: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    themes: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    plugins: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    email: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    recommendations: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    marketplace: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    payments: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  },
  EDITOR: {
    dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    analytics: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    seo: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    posts: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    pages: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    media: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    menus: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    messages: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    groups: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    security: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    settings: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    // Shop: ADMIN only - EDITOR/AUTHOR cannot access shop functionality
    shop: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    // LMS: ADMIN only for course creation - EDITOR/AUTHOR can only view catalog/take courses
    lms: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    themes: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    plugins: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    email: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    recommendations: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    marketplace: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    payments: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },
  AUTHOR: {
    dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    analytics: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    seo: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    posts: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    pages: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    media: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    menus: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    messages: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    groups: { canView: true, canCreate: true, canEdit: true, canDelete: false },
    security: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    settings: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    // Shop: ADMIN only - EDITOR/AUTHOR cannot access shop functionality
    shop: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    // LMS: ADMIN only for course creation - EDITOR/AUTHOR can only view catalog/take courses
    lms: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    themes: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    plugins: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    email: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    recommendations: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    marketplace: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    payments: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },
  VIEWER: {
    dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    analytics: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    seo: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    posts: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    pages: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    media: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    menus: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    messages: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    groups: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    security: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    settings: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    shop: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    lms: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    themes: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    plugins: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    email: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    recommendations: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    marketplace: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    payments: { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },
};

// Role descriptions for display
export const ROLE_DESCRIPTIONS: Record<UserRole, { title: string; description: string; color: string }> = {
  ADMIN: {
    title: 'Administrator',
    description: 'Full access to all features and settings',
    color: 'text-red-400 bg-red-500/20',
  },
  EDITOR: {
    title: 'Editor',
    description: 'Can manage content, media, and view analytics',
    color: 'text-blue-400 bg-blue-500/20',
  },
  AUTHOR: {
    title: 'Author',
    description: 'Can create and manage own content',
    color: 'text-green-400 bg-green-500/20',
  },
  VIEWER: {
    title: 'Viewer',
    description: 'Access to messages and groups only',
    color: 'text-gray-400 bg-gray-500/20',
  },
};

// Helper function to check if a role can access a feature
export function canAccess(role: string, feature: keyof RolePermissions, action: keyof Permission = 'canView'): boolean {
  const permissions = ROLE_PERMISSIONS[role as UserRole];
  if (!permissions) return false;
  return permissions[feature]?.[action] ?? false;
}

// Helper to get role badge color
export function getRoleBadgeClass(role: string): string {
  return ROLE_DESCRIPTIONS[role as UserRole]?.color || 'text-gray-400 bg-gray-500/20';
}

