/**
 * Role-based Permissions Configuration
 * Defines what each role can access in the admin panel
 *
 * Role Hierarchy (highest to lowest):
 * - SUPER_ADMIN: Full system access including security
 * - ADMIN: Site administrator with full access (no security)
 * - INSTRUCTOR: Course instructor - messages, groups, media, LMS
 * - STUDENT: Default signup - messages, groups, media, LMS view
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: UserRole[] = [
  'SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'STUDENT'
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
  INSTRUCTOR: {
    dashboard: VIEW_ONLY,
    analytics: VIEW_ONLY,
    seo: NO_ACCESS,
    posts: NO_ACCESS,
    pages: NO_ACCESS,
    media: FULL_ACCESS,
    menus: NO_ACCESS,
    users: NO_ACCESS,
    messages: FULL_ACCESS,
    groups: FULL_ACCESS,
    security: NO_ACCESS,
    settings: NO_ACCESS,
    shop: NO_ACCESS,
    lms: FULL_ACCESS,
    themes: NO_ACCESS,
    plugins: NO_ACCESS,
    email: NO_ACCESS,
    recommendations: NO_ACCESS,
    marketplace: FULL_ACCESS,  // Can apply as developer, browse, hire
    payments: NO_ACCESS,
  },
  STUDENT: {
    dashboard: VIEW_ONLY,
    analytics: NO_ACCESS,
    seo: NO_ACCESS,
    posts: NO_ACCESS,
    pages: NO_ACCESS,
    media: FULL_ACCESS,   // Can upload profile images
    menus: NO_ACCESS,
    users: NO_ACCESS,
    messages: FULL_ACCESS,
    groups: FULL_ACCESS,
    security: NO_ACCESS,
    settings: NO_ACCESS,
    shop: NO_ACCESS,
    lms: VIEW_ONLY,       // Can enroll in courses, not create
    themes: NO_ACCESS,
    plugins: NO_ACCESS,
    email: NO_ACCESS,
    recommendations: NO_ACCESS,
    marketplace: FULL_ACCESS,  // Can apply as developer, browse, hire
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

