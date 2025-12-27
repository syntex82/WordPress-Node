/**
 * Admin Layout Component
 * Beautiful dark theme sidebar with smooth animations
 * Role-based access control and comprehensive tooltips
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { FiHome, FiFileText, FiFile, FiImage, FiUsers, FiSettings, FiExternalLink, FiLogOut, FiUser, FiShield, FiMessageSquare, FiMenu, FiShoppingCart, FiPackage, FiTag, FiBook, FiAward, FiBarChart2, FiSearch, FiMail, FiLock, FiInfo, FiEdit3, FiLayout, FiChevronDown, FiChevronRight, FiX, FiCommand, FiHardDrive, FiZap, FiArrowUp } from 'react-icons/fi';
import { useState, useEffect, useCallback } from 'react';
import { messagesApi, systemConfigApi } from '../services/api';
import { canAccess, ROLE_DESCRIPTIONS, type UserRole, type RolePermissions } from '../config/permissions';
import Tooltip from './Tooltip';
import { NAV_TOOLTIPS } from '../config/tooltips';
import CommandPalette from './CommandPalette';
import NotificationCenter from './NotificationCenter';

// Get the frontend URL - in production it's same origin (without /admin), in development uses domain config
const getFrontendUrl = async (): Promise<string> => {
  try {
    const response = await systemConfigApi.getDomainConfig();
    if (response.data?.frontendUrl) {
      return response.data.frontendUrl;
    }
  } catch (error) {
    console.warn('Failed to fetch domain config, using origin');
  }
  // Fallback: use current origin without /admin path
  return window.location.origin;
};

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [frontendUrl, setFrontendUrl] = useState<string>(window.location.origin);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    main: true,
    content: false,
    system: false,
    shop: false,
    lms: false,
    email: false,
    devMarketplace: false,
    theme: false,
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const userRole = (user?.role || 'VIEWER') as UserRole;
  const roleInfo = ROLE_DESCRIPTIONS[userRole];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch frontend URL on mount
  useEffect(() => {
    getFrontendUrl().then(url => setFrontendUrl(url));
  }, []);

  // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  // Main navigation - just Dashboard
  const mainNavigation: Array<{ name: string; path: string; icon: any; permission: keyof RolePermissions; badge?: number; tooltipKey: keyof typeof NAV_TOOLTIPS }> = [
    { name: 'Dashboard', path: '/', icon: FiHome, permission: 'dashboard', tooltipKey: 'dashboard' },
    { name: 'Analytics', path: '/analytics', icon: FiBarChart2, permission: 'analytics', tooltipKey: 'analytics' },
    { name: 'Recommendations', path: '/recommendations', icon: FiZap, permission: 'analytics', tooltipKey: 'analytics' },
  ];

  // Content navigation group
  const contentNavigation: Array<{ name: string; path: string; icon: any; permission: keyof RolePermissions; badge?: number; tooltipKey: keyof typeof NAV_TOOLTIPS }> = [
    { name: 'Posts', path: '/posts', icon: FiFileText, permission: 'posts', tooltipKey: 'posts' },
    { name: 'Pages', path: '/pages', icon: FiFile, permission: 'pages', tooltipKey: 'pages' },
    { name: 'Media', path: '/media', icon: FiImage, permission: 'media', tooltipKey: 'media' },
    { name: 'Menus', path: '/menus', icon: FiMenu, permission: 'menus', tooltipKey: 'menus' },
    { name: 'SEO', path: '/seo', icon: FiSearch, permission: 'seo', tooltipKey: 'seo' },
  ];

  // System navigation group
  const systemNavigation: Array<{ name: string; path: string; icon: any; permission: keyof RolePermissions; badge?: number; tooltipKey: keyof typeof NAV_TOOLTIPS }> = [
    { name: 'Users', path: '/users', icon: FiUsers, permission: 'users', tooltipKey: 'users' },
    { name: 'Messages', path: '/messages', icon: FiMail, permission: 'messages', badge: unreadMessages, tooltipKey: 'messages' },
    { name: 'Groups', path: '/groups', icon: FiMessageSquare, permission: 'groups', tooltipKey: 'groups' },
    { name: 'Security', path: '/security', icon: FiShield, permission: 'security', tooltipKey: 'security' },
    { name: 'Backups', path: '/backups', icon: FiHardDrive, permission: 'settings', tooltipKey: 'settings' },
    { name: 'Updates', path: '/updates', icon: FiArrowUp, permission: 'settings', tooltipKey: 'settings' },
    { name: 'Settings', path: '/settings', icon: FiSettings, permission: 'settings', tooltipKey: 'settings' },
  ];

  const shopNavigation: Array<{ name: string; path: string; icon: any; tooltipKey: keyof typeof NAV_TOOLTIPS }> = [
    { name: 'Products', path: '/shop/products', icon: FiPackage, tooltipKey: 'products' },
    { name: 'Orders', path: '/shop/orders', icon: FiShoppingCart, tooltipKey: 'orders' },
    { name: 'Categories', path: '/shop/categories', icon: FiTag, tooltipKey: 'shopCategories' },
  ];

  const lmsNavigation: Array<{ name: string; path: string; icon: any; tooltipKey: keyof typeof NAV_TOOLTIPS }> = [
    { name: 'Dashboard', path: '/lms', icon: FiBarChart2, tooltipKey: 'lmsDashboard' },
    { name: 'Courses', path: '/lms/courses', icon: FiBook, tooltipKey: 'courses' },
    { name: 'Categories', path: '/lms/categories', icon: FiTag, tooltipKey: 'lmsCategories' },
    { name: 'Course Catalog', path: '/lms/catalog', icon: FiBook, tooltipKey: 'catalog' },
  ];

  const emailNavigation: Array<{ name: string; path: string; icon: any; tooltipKey: keyof typeof NAV_TOOLTIPS }> = [
    { name: 'Templates', path: '/email/templates', icon: FiEdit3, tooltipKey: 'emailTemplates' },
    { name: 'Designer', path: '/email/designer', icon: FiLayout, tooltipKey: 'emailDesigner' },
    { name: 'Composer', path: '/email/composer', icon: FiMail, tooltipKey: 'emailComposer' },
    { name: 'Logs', path: '/email/logs', icon: FiInfo, tooltipKey: 'emailLogs' },
  ];

  const devMarketplaceNavigation: Array<{ name: string; path: string; icon: any; tooltipKey: keyof typeof NAV_TOOLTIPS }> = [
    { name: 'Dashboard', path: '/dev-marketplace', icon: FiBarChart2, tooltipKey: 'dashboard' },
    { name: 'Developers', path: '/dev-marketplace/developers', icon: FiUsers, tooltipKey: 'users' },
    { name: 'Requests', path: '/dev-marketplace/requests', icon: FiMail, tooltipKey: 'messages' },
    { name: 'Projects', path: '/dev-marketplace/projects', icon: FiPackage, tooltipKey: 'products' },
    { name: 'Apply', path: '/dev-marketplace/apply', icon: FiAward, tooltipKey: 'dashboard' },
  ];

  // Filter navigation based on permissions
  const filteredMainNav = mainNavigation.filter(item => canAccess(userRole, item.permission));
  const filteredContentNav = contentNavigation.filter(item => canAccess(userRole, item.permission));
  const filteredSystemNav = systemNavigation.filter(item => canAccess(userRole, item.permission));
  const canViewShop = canAccess(userRole, 'shop');
  const canViewLms = canAccess(userRole, 'lms');
  const canViewEmail = userRole === 'ADMIN';
  const canViewMarketplace = canAccess(userRole, 'marketplace');
  const canCustomize = canAccess(userRole, 'themes');

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleViewWebsite = () => {
    window.open(frontendUrl, '_blank');
  };

  const handleCustomize = () => {
    window.location.href = '/admin/customize';
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Mobile Header - Only visible on small screens */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800/50 px-4 py-3 flex items-center justify-between safe-area-inset">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <FiMenu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="text-sm font-semibold text-white">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="User menu"
          >
            <FiUser size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 touch-manipulation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col border-r border-slate-800/50 transform transition-transform duration-300 ease-out safe-area-inset ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Mobile Sidebar Header */}
        <div className="relative p-4 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">WordPress Node</h1>
              <p className="text-xs text-slate-500">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Mobile Search Button */}
        <div className="p-4 border-b border-slate-800/50">
          <button
            onClick={() => { setCommandPaletteOpen(true); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all touch-manipulation min-h-[48px]"
          >
            <FiSearch size={18} />
            <span className="flex-1 text-left text-sm">Search...</span>
          </button>
        </div>

        {/* Mobile Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {/* Role Badge */}
          <div className="px-4 mb-4">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium ${roleInfo.color}`}>
              <FiLock size={12} />
              <span>{roleInfo.title}</span>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="px-3 space-y-1">
            {filteredMainNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all touch-manipulation min-h-[48px] ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white active:bg-slate-700/50'
                  }`}
                >
                  <Icon size={20} className={active ? 'text-white' : 'text-slate-500'} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Collapsible Sections */}
          <div className="mt-4 px-3 space-y-2">
            {/* Content Section */}
            {filteredContentNav.length > 0 && (
              <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                <button
                  onClick={() => toggleSection('content')}
                  className="flex items-center justify-between w-full px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors touch-manipulation min-h-[48px]"
                >
                  <div className="flex items-center gap-2">
                    <FiFileText size={14} className="text-blue-400" />
                    <span>Content</span>
                  </div>
                  {expandedSections.content ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </button>
                {expandedSections.content && (
                  <div className="pb-2">
                    {filteredContentNav.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px] ${
                            active
                              ? 'bg-blue-500/20 text-blue-300 border-l-2 border-blue-500'
                              : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <Icon size={18} className={active ? 'text-blue-400' : 'text-slate-500'} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* System Section */}
            {filteredSystemNav.length > 0 && (
              <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                <button
                  onClick={() => toggleSection('system')}
                  className="flex items-center justify-between w-full px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors touch-manipulation min-h-[48px]"
                >
                  <div className="flex items-center gap-2">
                    <FiSettings size={14} className="text-slate-400" />
                    <span>System</span>
                  </div>
                  {expandedSections.system ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </button>
                {expandedSections.system && (
                  <div className="pb-2">
                    {filteredSystemNav.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px] ${
                            active
                              ? 'bg-slate-500/20 text-slate-200 border-l-2 border-slate-400'
                              : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <Icon size={18} className={active ? 'text-slate-300' : 'text-slate-500'} />
                          {item.name}
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{item.badge}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Shop Section */}
            {canViewShop && (
              <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                <button
                  onClick={() => toggleSection('shop')}
                  className="flex items-center justify-between w-full px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors touch-manipulation min-h-[48px]"
                >
                  <div className="flex items-center gap-2">
                    <FiShoppingCart size={14} className="text-orange-400" />
                    <span>Shop</span>
                  </div>
                  {expandedSections.shop ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </button>
                {expandedSections.shop && (
                  <div className="pb-2">
                    {shopNavigation.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px] ${
                            active
                              ? 'bg-orange-500/20 text-orange-300 border-l-2 border-orange-500'
                              : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <Icon size={18} className={active ? 'text-orange-400' : 'text-slate-500'} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* LMS Section */}
            {canViewLms && (
              <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                <button
                  onClick={() => toggleSection('lms')}
                  className="flex items-center justify-between w-full px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors touch-manipulation min-h-[48px]"
                >
                  <div className="flex items-center gap-2">
                    <FiBook size={14} className="text-green-400" />
                    <span>LMS</span>
                  </div>
                  {expandedSections.lms ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </button>
                {expandedSections.lms && (
                  <div className="pb-2">
                    {lmsNavigation.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px] ${
                            active
                              ? 'bg-green-500/20 text-green-300 border-l-2 border-green-500'
                              : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <Icon size={18} className={active ? 'text-green-400' : 'text-slate-500'} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Marketplace Section */}
            {canViewMarketplace && (
              <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                <button
                  onClick={() => toggleSection('devMarketplace')}
                  className="flex items-center justify-between w-full px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors touch-manipulation min-h-[48px]"
                >
                  <div className="flex items-center gap-2">
                    <FiUsers size={14} className="text-teal-400" />
                    <span>Marketplace</span>
                  </div>
                  {expandedSections.devMarketplace ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </button>
                {expandedSections.devMarketplace && (
                  <div className="pb-2">
                    {devMarketplaceNavigation.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px] ${
                            active
                              ? 'bg-teal-500/20 text-teal-300 border-l-2 border-teal-500'
                              : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <Icon size={18} className={active ? 'text-teal-400' : 'text-slate-500'} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 px-3 pb-4 border-t border-slate-800/50 pt-4">
            <button
              onClick={handleViewWebsite}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all touch-manipulation min-h-[48px]"
            >
              <FiExternalLink size={18} className="text-slate-500" />
              View Website
            </button>
          </div>
        </nav>

        {/* Mobile User Section */}
        <div className="border-t border-slate-800/50 p-4 pb-safe">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
              <FiUser size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Logout"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex-col border-r border-slate-800/50 transition-all duration-300 relative`}>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 pointer-events-none" />

        {/* Header with Logo */}
        <div className="relative p-4 border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">WordPress Node</h1>
                  <p className="text-xs text-slate-500">Admin Panel</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ${sidebarCollapsed ? 'absolute -right-3 top-6 bg-slate-800 border border-slate-700' : ''}`}
            >
              {sidebarCollapsed ? <FiChevronRight size={14} /> : <FiX size={14} />}
            </button>
          </div>
        </div>

        {/* Search Button */}
        <div className="p-4 border-b border-slate-800/50">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 hover:border-slate-600 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <FiSearch size={16} />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left text-sm">Search...</span>
                <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-700/50 rounded text-xs text-slate-500">
                  <FiCommand size={10} />K
                </kbd>
              </>
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 relative custom-scrollbar">
          {/* Role Badge */}
          {!sidebarCollapsed && (
            <div className="px-4 mb-4">
              <button
                onClick={() => setShowRoleInfo(!showRoleInfo)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium w-full ${roleInfo.color} hover:opacity-90 transition-all shadow-sm`}
              >
                <FiLock size={12} />
                <span className="flex-1 text-left">{roleInfo.title}</span>
                <FiInfo size={12} />
              </button>
              {showRoleInfo && (
                <div className="mt-2 p-3 bg-slate-800/80 backdrop-blur rounded-lg text-xs text-slate-300 border border-slate-700/50">
                  <p className="font-medium mb-1">{roleInfo.description}</p>
                  <p className="text-slate-500 mt-2">You can only see menu items you have access to.</p>
                </div>
              )}
            </div>
          )}

          {/* Main Navigation - Always visible */}
          <div className="px-3 space-y-1">
            {filteredMainNav.map((item) => {
              const Icon = item.icon;
              const tooltip = NAV_TOOLTIPS[item.tooltipKey];
              const active = isActive(item.path);
              return (
                <Tooltip
                  key={item.path}
                  title={tooltip.title}
                  content={tooltip.content}
                  position="right"
                  variant="help"
                  delay={400}
                  disabled={!sidebarCollapsed}
                >
                  <Link
                    to={item.path}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={18} className={active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors'} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">{item.badge}</span>
                        )}
                      </>
                    )}
                  </Link>
                </Tooltip>
              );
            })}
          </div>

          {/* Collapsible Sections */}
          {!sidebarCollapsed && (
            <div className="mt-4 px-3 space-y-2">
              {/* Content Section */}
              {filteredContentNav.length > 0 && (
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                  <button
                    onClick={() => toggleSection('content')}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiFileText size={14} className="text-blue-400" />
                      <span>Content</span>
                    </div>
                    {expandedSections.content ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </button>
                  {expandedSections.content && (
                    <div className="pb-2">
                      {filteredContentNav.map((item) => {
                        const Icon = item.icon;
                        const tooltip = NAV_TOOLTIPS[item.tooltipKey];
                        const active = isActive(item.path);
                        return (
                          <Tooltip key={item.path} title={tooltip.title} content={tooltip.content} position="right" variant="help" delay={400}>
                            <Link
                              to={item.path}
                              className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                active
                                  ? 'bg-blue-500/20 text-blue-300 border-l-2 border-blue-500'
                                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                              }`}
                            >
                              <Icon size={16} className={active ? 'text-blue-400' : 'text-slate-500'} />
                              {item.name}
                            </Link>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* System Section */}
              {filteredSystemNav.length > 0 && (
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                  <button
                    onClick={() => toggleSection('system')}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiSettings size={14} className="text-slate-400" />
                      <span>System</span>
                    </div>
                    {expandedSections.system ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </button>
                  {expandedSections.system && (
                    <div className="pb-2">
                      {filteredSystemNav.map((item) => {
                        const Icon = item.icon;
                        const tooltip = NAV_TOOLTIPS[item.tooltipKey];
                        const active = isActive(item.path);
                        return (
                          <Tooltip key={item.path} title={tooltip.title} content={tooltip.content} position="right" variant="help" delay={400}>
                            <Link
                              to={item.path}
                              className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                active
                                  ? 'bg-slate-500/20 text-slate-200 border-l-2 border-slate-400'
                                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                              }`}
                            >
                              <Icon size={16} className={active ? 'text-slate-300' : 'text-slate-500'} />
                              {item.name}
                              {item.badge !== undefined && item.badge > 0 && (
                                <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">{item.badge}</span>
                              )}
                            </Link>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Shop Section */}
              {canViewShop && (
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                  <button
                    onClick={() => toggleSection('shop')}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiShoppingCart size={14} className="text-orange-400" />
                      <span>Shop</span>
                    </div>
                    {expandedSections.shop ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </button>
                  {expandedSections.shop && (
                    <div className="pb-2">
                      {shopNavigation.map((item) => {
                        const Icon = item.icon;
                        const tooltip = NAV_TOOLTIPS[item.tooltipKey];
                        const active = isActive(item.path);
                        return (
                          <Tooltip key={item.path} title={tooltip.title} content={tooltip.content} position="right" variant="help" delay={400}>
                            <Link
                              to={item.path}
                              className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                active
                                  ? 'bg-orange-500/20 text-orange-300 border-l-2 border-orange-500'
                                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                              }`}
                            >
                              <Icon size={16} className={active ? 'text-orange-400' : 'text-slate-500'} />
                              {item.name}
                            </Link>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* LMS Section */}
              {canViewLms && (
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                  <button
                    onClick={() => toggleSection('lms')}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiBook size={14} className="text-green-400" />
                      <span>LMS</span>
                    </div>
                    {expandedSections.lms ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </button>
                  {expandedSections.lms && (
                    <div className="pb-2">
                      {lmsNavigation.map((item) => {
                        const Icon = item.icon;
                        const tooltip = NAV_TOOLTIPS[item.tooltipKey];
                        const active = isActive(item.path);
                        return (
                          <Tooltip key={item.path} title={tooltip.title} content={tooltip.content} position="right" variant="help" delay={400}>
                            <Link
                              to={item.path}
                              className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                active
                                  ? 'bg-green-500/20 text-green-300 border-l-2 border-green-500'
                                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                              }`}
                            >
                              <Icon size={16} className={active ? 'text-green-400' : 'text-slate-500'} />
                              {item.name}
                            </Link>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Email Section */}
              {canViewEmail && (
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                  <button
                    onClick={() => toggleSection('email')}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiMail size={14} className="text-purple-400" />
                      <span>Email</span>
                    </div>
                    {expandedSections.email ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </button>
                  {expandedSections.email && (
                    <div className="pb-2">
                      {emailNavigation.map((item) => {
                        const Icon = item.icon;
                        const tooltip = NAV_TOOLTIPS[item.tooltipKey];
                        const active = isActive(item.path);
                        return (
                          <Tooltip key={item.path} title={tooltip.title} content={tooltip.content} position="right" variant="help" delay={400}>
                            <Link
                              to={item.path}
                              className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                active
                                  ? 'bg-purple-500/20 text-purple-300 border-l-2 border-purple-500'
                                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                              }`}
                            >
                              <Icon size={16} className={active ? 'text-purple-400' : 'text-slate-500'} />
                              {item.name}
                            </Link>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Developer Marketplace Section */}
              {canViewMarketplace && (
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                  <button
                    onClick={() => toggleSection('devMarketplace')}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiUsers size={14} className="text-teal-400" />
                      <span>Dev Marketplace</span>
                    </div>
                    {expandedSections.devMarketplace ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </button>
                  {expandedSections.devMarketplace && (
                    <div className="pb-2">
                      {devMarketplaceNavigation.map((item) => {
                        const Icon = item.icon;
                        const tooltip = NAV_TOOLTIPS[item.tooltipKey];
                        const active = isActive(item.path);
                        return (
                          <Tooltip key={item.path} title={tooltip.title} content={tooltip.content} position="right" variant="help" delay={400}>
                            <Link
                              to={item.path}
                              className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                active
                                  ? 'bg-teal-500/20 text-teal-300 border-l-2 border-teal-500'
                                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                              }`}
                            >
                              <Icon size={16} className={active ? 'text-teal-400' : 'text-slate-500'} />
                              {item.name}
                            </Link>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Theme Section */}
              {canCustomize && (
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
                  <button
                    onClick={() => toggleSection('theme')}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiEdit3 size={14} className="text-pink-400" />
                      <span>Theme</span>
                    </div>
                    {expandedSections.theme ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </button>
                  {expandedSections.theme && (
                    <div className="pb-2">
                      <Tooltip title={NAV_TOOLTIPS.styleCustomizer.title} content={NAV_TOOLTIPS.styleCustomizer.content} position="right" variant="help" delay={400}>
                        <Link
                          to="/customize"
                          className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            isActive('/customize')
                              ? 'bg-pink-500/20 text-pink-300 border-l-2 border-pink-500'
                              : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <FiLayout size={16} className={isActive('/customize') ? 'text-pink-400' : 'text-slate-500'} />
                          Style Customizer
                        </Link>
                      </Tooltip>
                      <Tooltip title={NAV_TOOLTIPS.contentManager.title} content={NAV_TOOLTIPS.contentManager.content} position="right" variant="help" delay={400}>
                        <Link
                          to="/theme-content"
                          className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            isActive('/theme-content')
                              ? 'bg-pink-500/20 text-pink-300 border-l-2 border-pink-500'
                              : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <FiImage size={16} className={isActive('/theme-content') ? 'text-pink-400' : 'text-slate-500'} />
                          Content Manager
                        </Link>
                      </Tooltip>
                      {userRole === 'ADMIN' && (
                        <Tooltip title="Marketplace Admin" content="Manage theme submissions, approvals, and featured themes" position="right" variant="help" delay={400}>
                          <Link
                            to="/marketplace"
                            className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              isActive('/marketplace')
                                ? 'bg-pink-500/20 text-pink-300 border-l-2 border-pink-500'
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                          >
                            <FiPackage size={16} className={isActive('/marketplace') ? 'text-pink-400' : 'text-slate-500'} />
                            Marketplace
                          </Link>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className={`mt-4 px-3 pb-4 border-t border-slate-800/50 pt-4 ${sidebarCollapsed ? 'hidden' : ''}`}>
            <Tooltip title={NAV_TOOLTIPS.viewWebsite.title} content={NAV_TOOLTIPS.viewWebsite.content} position="right" variant="info">
              <button
                onClick={handleViewWebsite}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all"
              >
                <FiExternalLink size={18} className="text-slate-500" />
                View Website
              </button>
            </Tooltip>
            {canCustomize && (
              <Tooltip title={NAV_TOOLTIPS.customizeTheme.title} content={NAV_TOOLTIPS.customizeTheme.content} position="right" variant="help">
                <button
                  onClick={handleCustomize}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 hover:from-blue-600/30 hover:to-purple-600/30 transition-all border border-blue-500/20"
                >
                  <FiEdit3 size={18} className="text-blue-400" />
                  Customize Theme
                </button>
              </Tooltip>
            )}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="relative border-t border-slate-800/50 bg-gradient-to-r from-slate-900 to-slate-800">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center w-full p-3 hover:bg-slate-800/50 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 ring-2 ring-slate-700">
                <FiUser size={18} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            {!sidebarCollapsed && (
              <div className="text-left ml-3 flex-1">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
            )}
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 w-full bg-slate-800 border border-slate-700/50 rounded-t-xl shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-slate-700/50 bg-slate-800/50">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
              >
                <FiUser size={16} className="text-slate-500" />
                My Profile
              </Link>
              <Link
                to="/lms/dashboard"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
              >
                <FiAward size={16} className="text-slate-500" />
                My Learning
              </Link>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-t border-slate-700/50"
              >
                <FiLogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* About & Copyright */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 bg-slate-950/50 border-t border-slate-800/30">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} WordPress Node
            </p>
            <p className="text-xs text-slate-700 mt-0.5">
              By <span className="text-blue-400/70">Michael James Blenkinsop</span>
            </p>
          </div>
        )}
      </aside>

      {/* Main Content Area with Dark Theme */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 lg:pt-0 pt-[60px]">
        {/* Top Bar with Notifications - Hidden on mobile (using mobile header instead) */}
        <div className="hidden lg:flex sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800/50 items-center justify-end gap-4">
          <NotificationCenter />
          <div className="w-px h-6 bg-slate-700/50" />
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>{user?.name}</span>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 min-h-full pb-safe">
          <Outlet />
        </div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.5);
        }
      `}</style>

      {/* Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
}

