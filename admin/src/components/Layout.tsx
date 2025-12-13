/**
 * Admin Layout Component
 * Provides sidebar navigation and main content area with role-based access control
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { FiHome, FiFileText, FiFile, FiImage, FiUsers, FiSettings, FiExternalLink, FiLogOut, FiUser, FiShield, FiMessageSquare, FiMenu, FiShoppingCart, FiPackage, FiTag, FiBook, FiAward, FiBarChart2, FiSearch, FiMail, FiLock, FiInfo, FiEdit3 } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { messagesApi } from '../services/api';
import { canAccess, ROLE_DESCRIPTIONS, type UserRole, type RolePermissions } from '../config/permissions';

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const userRole = (user?.role || 'VIEWER') as UserRole;
  const roleInfo = ROLE_DESCRIPTIONS[userRole];

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await messagesApi.getUnreadCount();
        setUnreadMessages(res.data.count);
      } catch { /* ignore */ }
    };
    if (canAccess(userRole, 'messages')) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  // Navigation items with permission keys
  const navigation: Array<{ name: string; path: string; icon: any; permission: keyof RolePermissions; badge?: number }> = [
    { name: 'Dashboard', path: '/', icon: FiHome, permission: 'dashboard' },
    { name: 'Analytics', path: '/analytics', icon: FiBarChart2, permission: 'analytics' },
    { name: 'SEO', path: '/seo', icon: FiSearch, permission: 'seo' },
    { name: 'Posts', path: '/posts', icon: FiFileText, permission: 'posts' },
    { name: 'Pages', path: '/pages', icon: FiFile, permission: 'pages' },
    { name: 'Media', path: '/media', icon: FiImage, permission: 'media' },
    { name: 'Menus', path: '/menus', icon: FiMenu, permission: 'menus' },
    { name: 'Users', path: '/users', icon: FiUsers, permission: 'users' },
    { name: 'Messages', path: '/messages', icon: FiMail, permission: 'messages', badge: unreadMessages },
    { name: 'Groups', path: '/groups', icon: FiMessageSquare, permission: 'groups' },
    { name: 'Security', path: '/security', icon: FiShield, permission: 'security' },
    { name: 'Settings', path: '/settings', icon: FiSettings, permission: 'settings' },
  ];

  const shopNavigation: Array<{ name: string; path: string; icon: any }> = [
    { name: 'Products', path: '/shop/products', icon: FiPackage },
    { name: 'Orders', path: '/shop/orders', icon: FiShoppingCart },
    { name: 'Categories', path: '/shop/categories', icon: FiTag },
  ];

  const lmsNavigation: Array<{ name: string; path: string; icon: any }> = [
    { name: 'Courses', path: '/lms/courses', icon: FiBook },
  ];

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter(item => canAccess(userRole, item.permission));
  const canViewShop = canAccess(userRole, 'shop');
  const canViewLms = canAccess(userRole, 'lms');
  const canCustomize = canAccess(userRole, 'themes');

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleViewWebsite = () => {
    window.open('http://localhost:3000', '_blank');
  };

  const handleCustomize = () => {
    window.location.href = '/admin/customize';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">WordPress Node</h1>
          <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
        </div>

        <nav className="mt-6 flex-1 overflow-y-auto">
          {/* Role Badge */}
          <div className="px-6 py-2 mb-2">
            <button
              onClick={() => setShowRoleInfo(!showRoleInfo)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${roleInfo.color} hover:opacity-80 transition-opacity`}
            >
              <FiLock size={12} />
              {roleInfo.title}
              <FiInfo size={12} />
            </button>
            {showRoleInfo && (
              <div className="mt-2 p-3 bg-gray-800 rounded-lg text-xs text-gray-300 border border-gray-700">
                <p className="font-medium mb-1">{roleInfo.description}</p>
                <p className="text-gray-500 mt-2">You can only see menu items you have access to.</p>
              </div>
            )}
          </div>

          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="mr-3" size={18} />
                <span className="flex-1">{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{item.badge}</span>
                )}
              </Link>
            );
          })}

          {/* Shop Section - Only show if user has shop permission */}
          {canViewShop && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Shop
              </div>
              {shopNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="mr-3" size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* LMS Section - Only show if user has LMS permission */}
          {canViewLms && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                LMS
              </div>
              {lmsNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="mr-3" size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* View Website Link */}
          <button
            onClick={handleViewWebsite}
            className="flex items-center w-full px-6 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors mt-4 border-t border-gray-800"
          >
            <FiExternalLink className="mr-3" size={18} />
            View Website
          </button>

          {/* Customize Theme Link - Only for ADMIN and EDITOR */}
          {canCustomize && (
            <button
              onClick={handleCustomize}
              className="flex items-center w-full px-6 py-3 text-sm font-medium text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 transition-colors"
            >
              <FiEdit3 className="mr-3" size={18} />
              Customize Theme
            </button>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-800 bg-gray-900">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center w-full px-6 py-4 hover:bg-gray-800 transition-colors bg-gray-900"
            >
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 text-white shadow-lg">
                  <FiUser size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 w-full bg-gray-800 border-t border-gray-700 shadow-lg">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center w-full px-6 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <FiUser className="mr-3" size={16} />
                  My Profile
                </Link>
                <Link
                  to="/lms/dashboard"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center w-full px-6 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <FiAward className="mr-3" size={16} />
                  My Learning
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex items-center w-full px-6 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <FiLogOut className="mr-3" size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* About & Copyright */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-950">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Developed by <span className="text-blue-400">Michael James Blenkinsop</span>
          </p>
          <p className="text-xs text-gray-600">Lead Developer</p>
          <a
            href="mailto:m.blenkinsop@yahoo.co.uk"
            className="text-xs text-gray-600 hover:text-blue-400 transition-colors"
          >
            m.blenkinsop@yahoo.co.uk
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

