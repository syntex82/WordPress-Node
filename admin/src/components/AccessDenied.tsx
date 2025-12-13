/**
 * Access Denied Component
 * Shown when a user tries to access a page they don't have permission for
 */

import { FiLock, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROLE_DESCRIPTIONS, type UserRole } from '../config/permissions';

interface AccessDeniedProps {
  feature?: string;
  requiredRole?: string;
}

export default function AccessDenied({ feature, requiredRole }: AccessDeniedProps) {
  const { user } = useAuthStore();
  const userRole = (user?.role || 'VIEWER') as UserRole;
  const roleInfo = ROLE_DESCRIPTIONS[userRole];

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <FiLock className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        
        <p className="text-gray-600 mb-4">
          {feature 
            ? `You don't have permission to access ${feature}.`
            : "You don't have permission to access this page."
          }
        </p>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${roleInfo.color} mb-4`}>
          <FiLock size={14} />
          Your role: {roleInfo.title}
        </div>

        <p className="text-sm text-gray-500 mb-6">
          {roleInfo.description}
        </p>

        {requiredRole && (
          <p className="text-sm text-gray-500 mb-6">
            Required role: <span className="font-medium">{requiredRole}</span> or higher
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiArrowLeft size={16} />
            Go to Dashboard
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          If you believe you should have access, please contact your administrator.
        </p>
      </div>
    </div>
  );
}

