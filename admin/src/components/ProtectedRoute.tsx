/**
 * Protected Route Component
 * Wraps routes that require specific permissions
 */

import { ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import { canAccess, type RolePermissions, type UserRole } from '../config/permissions';
import AccessDenied from './AccessDenied';

interface ProtectedRouteProps {
  children: ReactNode;
  feature: keyof RolePermissions;
  action?: 'canView' | 'canCreate' | 'canEdit' | 'canDelete';
  requiredRole?: string;
}

export default function ProtectedRoute({ 
  children, 
  feature, 
  action = 'canView',
  requiredRole 
}: ProtectedRouteProps) {
  const { user } = useAuthStore();
  const userRole = (user?.role || 'VIEWER') as UserRole;

  if (!canAccess(userRole, feature, action)) {
    return <AccessDenied feature={feature} requiredRole={requiredRole} />;
  }

  return <>{children}</>;
}

