/**
 * Hierarchical Role-Based Access Control (RBAC) Permissions
 * 
 * Role Hierarchy (highest to lowest):
 * SUPER_ADMIN > ADMIN > EDITOR > AUTHOR > INSTRUCTOR > STUDENT > USER > VIEWER
 */

import { UserRole } from '@prisma/client';

// Role hierarchy - higher index = lower privilege
export const ROLE_HIERARCHY: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.EDITOR,
  UserRole.AUTHOR,
  UserRole.INSTRUCTOR,
  UserRole.STUDENT,
  UserRole.USER,
  UserRole.VIEWER,
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

// Check if role1 is strictly higher than role2
export function isRoleHigher(role1: UserRole, role2: UserRole): boolean {
  return getRoleLevel(role1) < getRoleLevel(role2);
}

// Resource types
export type ResourceType = 
  | 'users' | 'posts' | 'pages' | 'media' | 'products' | 'orders'
  | 'courses' | 'lessons' | 'enrollments' | 'settings' | 'security'
  | 'analytics' | 'plugins' | 'themes' | 'backups' | 'email';

// Action types
export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export';

// Permission definition
export interface Permission {
  roles: UserRole[];
  ownerOnly?: boolean;  // If true, non-admin roles can only access their own resources
  scopeCheck?: boolean; // If true, applies demo/scope isolation
}

// Permission map
export const PERMISSIONS: Record<ResourceType, Record<ActionType, Permission>> = {
  users: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR] },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], ownerOnly: true },
    delete: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN] },
  },
  posts: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR] },
    read: { roles: ROLE_HIERARCHY },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR], ownerOnly: true },
    delete: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR], ownerOnly: true },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR] },
    export: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  },
  pages: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR] },
    read: { roles: ROLE_HIERARCHY },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR], ownerOnly: true },
    delete: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR], ownerOnly: true },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR] },
    export: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  },
  media: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR, UserRole.INSTRUCTOR] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR, UserRole.INSTRUCTOR], ownerOnly: true },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR, UserRole.INSTRUCTOR], ownerOnly: true },
    delete: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR, UserRole.INSTRUCTOR], ownerOnly: true },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  },
  products: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR] },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR], ownerOnly: true },
    delete: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR] },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  },
  orders: {
    create: { roles: ROLE_HIERARCHY },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR], ownerOnly: true },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR] },
    delete: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  },
  courses: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.INSTRUCTOR] },
    read: { roles: ROLE_HIERARCHY },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.INSTRUCTOR], ownerOnly: true },
    delete: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.INSTRUCTOR], ownerOnly: true },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR] },
    export: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  },
  lessons: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.INSTRUCTOR], ownerOnly: true },
    read: { roles: ROLE_HIERARCHY },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.INSTRUCTOR], ownerOnly: true },
    delete: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.INSTRUCTOR], ownerOnly: true },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR] },
    export: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  },
  enrollments: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT, UserRole.USER] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.INSTRUCTOR], ownerOnly: true },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    delete: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  },
  settings: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    delete: { roles: [UserRole.SUPER_ADMIN] },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN] },
  },
  security: {
    create: { roles: [UserRole.SUPER_ADMIN] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    update: { roles: [UserRole.SUPER_ADMIN] },
    delete: { roles: [UserRole.SUPER_ADMIN] },
    manage: { roles: [UserRole.SUPER_ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN] },
  },
  analytics: {
    create: { roles: [] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR] },
    update: { roles: [] },
    delete: { roles: [UserRole.SUPER_ADMIN] },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  },
  plugins: {
    create: { roles: [UserRole.SUPER_ADMIN] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    update: { roles: [UserRole.SUPER_ADMIN] },
    delete: { roles: [UserRole.SUPER_ADMIN] },
    manage: { roles: [UserRole.SUPER_ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN] },
  },
  themes: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR] },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    delete: { roles: [UserRole.SUPER_ADMIN] },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN] },
  },
  backups: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    update: { roles: [UserRole.SUPER_ADMIN] },
    delete: { roles: [UserRole.SUPER_ADMIN] },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN] },
  },
  email: {
    create: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    read: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    update: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    delete: { roles: [UserRole.SUPER_ADMIN] },
    manage: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    export: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  },
};

/**
 * Check if a role has permission for a resource action
 */
export function hasPermission(
  role: UserRole,
  resource: ResourceType,
  action: ActionType,
): boolean {
  const permission = PERMISSIONS[resource]?.[action];
  if (!permission) return false;
  return permission.roles.includes(role);
}

/**
 * Check if permission requires ownership check
 */
export function requiresOwnership(resource: ResourceType, action: ActionType): boolean {
  return PERMISSIONS[resource]?.[action]?.ownerOnly ?? false;
}

/**
 * Check if user can access resource (considering ownership)
 */
export function canAccessResource(
  userRole: UserRole,
  userId: string,
  resource: ResourceType,
  action: ActionType,
  ownerId?: string,
): boolean {
  if (!hasPermission(userRole, resource, action)) {
    return false;
  }

  // Super admins and admins bypass ownership checks
  if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
    return true;
  }

  // Editors can access all content
  if (userRole === UserRole.EDITOR && ['posts', 'pages', 'media', 'products', 'courses'].includes(resource)) {
    return true;
  }

  // For owner-only resources, check ownership
  if (requiresOwnership(resource, action) && ownerId) {
    return userId === ownerId;
  }

  return true;
}

