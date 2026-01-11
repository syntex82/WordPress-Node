/**
 * Role-based Permissions Configuration
 * Defines what each role can access in the admin panel
 *
 * Role Hierarchy (highest to lowest):
 * - SUPER_ADMIN: Full system access, can manage all demos and users
 * - ADMIN: Site administrator, manages users within scope
 * - EDITOR: Content editor, can edit all content
 * - AUTHOR: Content author, can only edit own content
 * - INSTRUCTOR: Course instructor, manages own courses
 * - STUDENT: Course student, read-only course access
 * - USER: Basic user, profile management only
 * - VIEWER: Legacy read-only access (deprecated)
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'INSTRUCTOR' | 'STUDENT' | 'USER' | 'VIEWER';

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: UserRole[] = [
  'SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'INSTRUCTOR', 'STUDENT', 'USER', 'VIEWER'
];

// Get role level (lower = more privileged)
export function getRoleLevel(role: UserRole): number {
  const index = ROLE_HIERARCHY.indexOf(role);
  return index === -1 ? 999 : index;
}

// Check if role1 is higher than or equal to role2
export function isRoleHigherOrEqual(role1: UserRole, role2: UserRole): boolean {
  return getRoleLevel(role1) <= getRoleLevel(role2);
}

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
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return false;
  return PREMIUM_FEATURES.includes(feature as PremiumFeature);
}

// Full permissions helper
const FULL_ACCESS: Permission = { canView: true, canCreate: true, canEdit: true, canDelete: true };
const NO_ACCESS: Permission = { canView: false, canCreate: false, canEdit: false, canDelete: false };
const VIEW_ONLY: Permission = { canView: true, canCreate: false, canEdit: false, canDelete: false };
const VIEW_CREATE: Permission = { canView: true, canCreate: true, canEdit: false, canDelete: false };
const VIEW_EDIT: Permission = { canView: true, canCreate: true, canEdit: true, canDelete: false };

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  SUPER_ADMIN: {
    dashboard: FULL_ACCESS,
    analytics: FULL_ACCESS,
    seo: FULL_ACCESS,
    posts: FULL_ACCESS,
    pages: FULL_ACCESS,
    media: FULL_ACCESS,
    menus: FULL_ACCESS,
    users: FULL_ACCESS,
    messages: FULL_ACCESS,
    groups: FULL_ACCESS,
    security: FULL_ACCESS,
    settings: FULL_ACCESS,
    shop: FULL_ACCESS,
    lms: FULL_ACCESS,
    themes: FULL_ACCESS,
    plugins: FULL_ACCESS,
    email: FULL_ACCESS,
    recommendations: FULL_ACCESS,
    marketplace: FULL_ACCESS,
    payments: FULL_ACCESS,
  },
  ADMIN: {
    dashboard: FULL_ACCESS,
    analytics: FULL_ACCESS,
    seo: FULL_ACCESS,
    posts: FULL_ACCESS,
    pages: FULL_ACCESS,
    media: FULL_ACCESS,
    menus: FULL_ACCESS,
    users: VIEW_EDIT,     // Can manage users but not SUPER_ADMINs (enforced by backend)
    messages: FULL_ACCESS,
    groups: FULL_ACCESS,
    security: NO_ACCESS,  // SUPER_ADMIN only - contains sensitive security settings
    settings: VIEW_ONLY,  // Can view but not modify system settings
    shop: FULL_ACCESS,
    lms: FULL_ACCESS,
    themes: FULL_ACCESS,
    plugins: VIEW_ONLY,   // Can view but not install plugins
    email: FULL_ACCESS,
    recommendations: FULL_ACCESS,
    marketplace: FULL_ACCESS,
    payments: VIEW_EDIT,  // Can view/process payments but not configure
  },
  EDITOR: {
    dashboard: VIEW_ONLY,
    analytics: VIEW_ONLY,
    seo: VIEW_ONLY,
    posts: FULL_ACCESS,  // Can edit ALL posts
    pages: FULL_ACCESS,  // Can edit ALL pages
    media: VIEW_EDIT,    // Can manage shared media
    menus: VIEW_EDIT,
    users: NO_ACCESS,
    messages: FULL_ACCESS,
    groups: VIEW_EDIT,
    security: NO_ACCESS,
    settings: NO_ACCESS,
    shop: VIEW_EDIT,     // Can manage products
    lms: VIEW_EDIT,      // Can manage courses
    themes: VIEW_ONLY,
    plugins: NO_ACCESS,
    email: VIEW_ONLY,
    recommendations: VIEW_ONLY,
    marketplace: VIEW_ONLY,
    payments: NO_ACCESS,
  },
  AUTHOR: {
    dashboard: VIEW_ONLY,
    analytics: NO_ACCESS,
    seo: NO_ACCESS,
    posts: VIEW_EDIT,    // Can only edit OWN posts (enforced by backend)
    pages: VIEW_EDIT,    // Can only edit OWN pages
    media: VIEW_EDIT,    // Can only access OWN media
    menus: NO_ACCESS,
    users: NO_ACCESS,
    messages: FULL_ACCESS,
    groups: VIEW_CREATE,
    security: NO_ACCESS,
    settings: NO_ACCESS,
    shop: VIEW_CREATE,   // Can create products (own only)
    lms: NO_ACCESS,
    themes: NO_ACCESS,
    plugins: NO_ACCESS,
    email: NO_ACCESS,
    recommendations: NO_ACCESS,
    marketplace: VIEW_ONLY,
    payments: NO_ACCESS,
  },
  INSTRUCTOR: {
    dashboard: VIEW_ONLY,
    analytics: VIEW_ONLY, // Can view course analytics
    seo: NO_ACCESS,
    posts: NO_ACCESS,
    pages: NO_ACCESS,
    media: VIEW_EDIT,    // Can upload course media
    menus: NO_ACCESS,
    users: NO_ACCESS,
    messages: FULL_ACCESS,
    groups: VIEW_CREATE,
    security: NO_ACCESS,
    settings: NO_ACCESS,
    shop: NO_ACCESS,
    lms: VIEW_EDIT,      // Can manage OWN courses
    themes: NO_ACCESS,
    plugins: NO_ACCESS,
    email: NO_ACCESS,
    recommendations: NO_ACCESS,
    marketplace: VIEW_ONLY,
    payments: VIEW_ONLY, // Can view earnings
  },
  STUDENT: {
    dashboard: VIEW_ONLY,
    analytics: NO_ACCESS,
    seo: NO_ACCESS,
    posts: NO_ACCESS,
    pages: NO_ACCESS,
    media: NO_ACCESS,
    menus: NO_ACCESS,
    users: NO_ACCESS,
    messages: VIEW_CREATE,
    groups: VIEW_ONLY,
    security: NO_ACCESS,
    settings: NO_ACCESS,
    shop: VIEW_ONLY,     // Can browse products
    lms: VIEW_ONLY,      // Can view enrolled courses
    themes: NO_ACCESS,
    plugins: NO_ACCESS,
    email: NO_ACCESS,
    recommendations: NO_ACCESS,
    marketplace: NO_ACCESS,
    payments: VIEW_ONLY, // Can view own purchases
  },
  USER: {
    dashboard: VIEW_ONLY,
    analytics: NO_ACCESS,
    seo: NO_ACCESS,
    posts: NO_ACCESS,
    pages: NO_ACCESS,
    media: NO_ACCESS,
    menus: NO_ACCESS,
    users: NO_ACCESS,
    messages: VIEW_CREATE,
    groups: VIEW_ONLY,
    security: NO_ACCESS,
    settings: NO_ACCESS,
    shop: VIEW_ONLY,
    lms: VIEW_ONLY,
    themes: NO_ACCESS,
    plugins: NO_ACCESS,
    email: NO_ACCESS,
    recommendations: NO_ACCESS,
    marketplace: NO_ACCESS,
    payments: NO_ACCESS,
  },
  VIEWER: {
    dashboard: VIEW_ONLY,
    analytics: NO_ACCESS,
    seo: NO_ACCESS,
    posts: NO_ACCESS,
    pages: NO_ACCESS,
    media: NO_ACCESS,
    menus: NO_ACCESS,
    users: NO_ACCESS,
    messages: VIEW_ONLY,
    groups: VIEW_ONLY,
    security: NO_ACCESS,
    settings: NO_ACCESS,
    shop: NO_ACCESS,
    lms: NO_ACCESS,
    themes: NO_ACCESS,
    plugins: NO_ACCESS,
    email: NO_ACCESS,
    recommendations: NO_ACCESS,
    marketplace: NO_ACCESS,
    payments: NO_ACCESS,
  },
};

// Role descriptions for display
export const ROLE_DESCRIPTIONS: Record<UserRole, { title: string; description: string; color: string }> = {
  SUPER_ADMIN: {
    title: 'Super Administrator',
    description: 'Full system access including security and all demo data',
    color: 'text-purple-400 bg-purple-500/20',
  },
  ADMIN: {
    title: 'Administrator',
    description: 'Site administrator with full access within scope',
    color: 'text-red-400 bg-red-500/20',
  },
  EDITOR: {
    title: 'Editor',
    description: 'Can edit all content, media, and manage courses',
    color: 'text-blue-400 bg-blue-500/20',
  },
  AUTHOR: {
    title: 'Author',
    description: 'Can create and manage own content and products',
    color: 'text-green-400 bg-green-500/20',
  },
  INSTRUCTOR: {
    title: 'Instructor',
    description: 'Can create and manage own courses and students',
    color: 'text-orange-400 bg-orange-500/20',
  },
  STUDENT: {
    title: 'Student',
    description: 'Can access enrolled courses and track progress',
    color: 'text-cyan-400 bg-cyan-500/20',
  },
  USER: {
    title: 'User',
    description: 'Basic user with profile management',
    color: 'text-slate-400 bg-slate-500/20',
  },
  VIEWER: {
    title: 'Viewer',
    description: 'Read-only access (deprecated)',
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

