/**
 * Dashboard Page
 * Shows overview, statistics, and quick actions with comprehensive tooltips
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiFile, FiUsers, FiImage, FiSettings, FiLayout, FiPlus, FiExternalLink, FiHelpCircle, FiTrendingUp, FiClock, FiZap, FiBookOpen, FiShoppingBag, FiMail, FiShield } from 'react-icons/fi';
import { postsApi, pagesApi, usersApi, systemConfigApi } from '../services/api';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import toast from 'react-hot-toast';
import Tooltip from '../components/Tooltip';

// Get the frontend URL from domain config or use origin as fallback
const getFrontendUrl = async (): Promise<string> => {
  try {
    const response = await systemConfigApi.getDomainConfig();
    if (response.data?.frontendUrl) {
      return response.data.frontendUrl;
    }
  } catch (error) {
    console.warn('Failed to fetch domain config');
  }
  return window.location.origin;
};

const DASHBOARD_TOOLTIPS = {
  posts: { title: 'Blog Posts', content: 'Total number of blog posts on your site. Click to manage posts, create new content, or edit existing articles.' },
  pages: { title: 'Static Pages', content: 'Total static pages like About, Contact, Services. Pages don\'t have dates and appear in your main navigation.' },
  users: { title: 'Registered Users', content: 'Total user accounts on your site. Manage roles, permissions, and user profiles from the Users section.' },
  quickCreate: { title: 'Quick Create', content: 'Shortcuts to create new content quickly. Jump straight to the editor and start writing.' },
  recentActivity: { title: 'Recent Activity', content: 'Track what\'s happening on your site. See recent posts, user registrations, and system events.' },
  systemStatus: { title: 'System Status', content: 'Monitor your site\'s health. Check server status, performance metrics, and any issues.' },
  helpCenter: { title: 'Help Center', content: 'Need assistance? Access documentation, tutorials, and support resources.' },
};

export default function Dashboard() {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';

  const [stats, setStats] = useState({ posts: 0, pages: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [frontendUrl, setFrontendUrl] = useState<string>(window.location.origin);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, pagesRes, usersRes] = await Promise.all([
          postsApi.getAll({ limit: 1 }),
          pagesApi.getAll({ limit: 1 }),
          usersApi.getAll({ limit: 1 }),
        ]);
        setStats({
          posts: postsRes.data.meta?.total || 0,
          pages: pagesRes.data.meta?.total || 0,
          users: usersRes.data.meta?.total || 0,
        });

        // Fetch frontend URL
        const url = await getFrontendUrl();
        setFrontendUrl(url);
      } catch (error: any) {
        console.error('Error fetching stats:', error);
        toast.error(error.response?.data?.message || 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { name: 'Total Posts', value: stats.posts, icon: FiFileText, color: 'from-blue-500 to-cyan-400', bgGlow: 'shadow-blue-500/20', link: '/posts', tooltipKey: 'posts' as const },
    { name: 'Total Pages', value: stats.pages, icon: FiFile, color: 'from-emerald-500 to-green-400', bgGlow: 'shadow-emerald-500/20', link: '/pages', tooltipKey: 'pages' as const },
    { name: 'Total Users', value: stats.users, icon: FiUsers, color: 'from-purple-500 to-pink-400', bgGlow: 'shadow-purple-500/20', link: '/users', tooltipKey: 'users' as const },
  ];

  const quickActions = [
    { name: 'New Post', icon: FiFileText, link: '/posts/new', color: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20', desc: 'Write a new blog post' },
    { name: 'New Page', icon: FiFile, link: '/pages/new', color: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20', desc: 'Create a static page' },
    { name: 'Upload Media', icon: FiImage, link: '/media', color: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20', desc: 'Add images & files' },
    { name: 'Customize', icon: FiLayout, link: '/customize', color: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20', desc: 'Style your theme' },
    { name: 'Settings', icon: FiSettings, link: '/settings', color: 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border border-slate-500/20', desc: 'Configure site options' },
    { name: 'View Site', icon: FiExternalLink, link: '#', color: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20', external: true, desc: 'Preview your website' },
  ];

  const features = [
    { name: 'LMS', icon: FiBookOpen, desc: 'Create online courses', link: '/lms', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { name: 'Shop', icon: FiShoppingBag, desc: 'Sell products online', link: '/shop/products', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { name: 'Email', icon: FiMail, desc: 'Design email templates', link: '/email/templates', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { name: 'Security', icon: FiShield, desc: 'Protect your site', link: '/security', color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-0">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent truncate ${
            isDark ? 'from-white to-slate-300' : 'from-gray-900 to-gray-600'
          }`}>Dashboard</h1>
          <p className={`mt-1 text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Welcome back! Here's what's happening with your site.</p>
        </div>
        <Tooltip title={DASHBOARD_TOOLTIPS.helpCenter.title} content={DASHBOARD_TOOLTIPS.helpCenter.content} position="left" variant="help">
          <button className={`flex-shrink-0 p-2.5 sm:p-3 rounded-xl border transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation ${
            isDark
              ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-slate-400 hover:text-blue-400'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-blue-500 shadow-sm'
          }`}>
            <FiHelpCircle size={20} className="sm:w-[22px] sm:h-[22px]" />
          </button>
        </Tooltip>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const tooltip = DASHBOARD_TOOLTIPS[stat.tooltipKey];
          return (
            <Tooltip key={stat.name} title={tooltip.title} content={tooltip.content} position="top" variant="info">
              <Link
                to={stat.link}
                className={`group backdrop-blur rounded-xl sm:rounded-2xl border p-5 sm:p-6 transition-all hover:-translate-y-1 shadow-xl ${stat.bgGlow} touch-manipulation active:scale-95 ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-medium truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{stat.name}</p>
                    <p className={`text-3xl sm:text-4xl font-bold mt-1.5 sm:mt-2 tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {loading ? <span className={`animate-pulse ${isDark ? 'text-slate-500' : 'text-gray-300'}`}>...</span> : stat.value}
                    </p>
                    <p className={`text-xs sm:text-sm mt-1.5 sm:mt-2 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      <FiTrendingUp size={12} className="text-emerald-500 sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                      <span className="truncate">Click to manage</span>
                    </p>
                  </div>
                  <div className={`flex-shrink-0 bg-gradient-to-br ${stat.color} text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className="sm:w-[28px] sm:h-[28px]" />
                  </div>
                </div>
              </Link>
            </Tooltip>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className={`backdrop-blur rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-1.5 sm:p-2 bg-indigo-500/20 rounded-lg flex-shrink-0">
            <FiZap className="text-indigo-400" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-base sm:text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
            <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Create content and manage your site</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Tooltip key={action.name} content={action.desc} position="bottom">
                {action.external ? (
                  <a
                    href={frontendUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl ${action.color} transition-all hover:scale-105 active:scale-95 touch-manipulation min-h-[80px] sm:min-h-[96px]`}
                  >
                    <Icon size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-center leading-tight">{action.name}</span>
                  </a>
                ) : (
                  <Link
                    to={action.link}
                    className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl ${action.color} transition-all hover:scale-105 active:scale-95 touch-manipulation min-h-[80px] sm:min-h-[96px]`}
                  >
                    <Icon size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-center leading-tight">{action.name}</span>
                  </Link>
                )}
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Features & Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Built-in Features */}
        <div className={`backdrop-blur rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
          isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
              <FiPlus className="text-purple-400" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-base sm:text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>Built-in Features</h2>
              <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Explore powerful capabilities</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Tooltip key={feature.name} content={feature.desc} position="top">
                  <Link
                    to={feature.link}
                    className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl ${feature.bg} transition-colors group border touch-manipulation active:scale-95 min-h-[64px] ${
                      isDark ? 'hover:bg-slate-700/50 border-slate-700/30' : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Icon size={20} className={`${feature.color} flex-shrink-0 sm:w-[22px] sm:h-[22px]`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.name}</p>
                      <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{feature.desc}</p>
                    </div>
                  </Link>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-br from-indigo-600/80 to-purple-700/80 backdrop-blur rounded-xl sm:rounded-2xl shadow-lg shadow-purple-500/10 p-4 sm:p-6 text-white border border-indigo-500/30">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
              <FiBookOpen className="text-white" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">Getting Started</h2>
              <p className="text-xs sm:text-sm text-white/70 truncate">Tips to help you get going</p>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {[
              { step: 1, text: 'Create your first page or post', done: stats.posts > 0 || stats.pages > 0 },
              { step: 2, text: 'Upload images to Media Library', done: false },
              { step: 3, text: 'Customize your theme colors', done: false },
              { step: 4, text: 'Configure site settings', done: false },
            ].map((item) => (
              <div key={item.step} className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg ${item.done ? 'bg-white/20' : 'bg-white/10'} touch-manipulation`}>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.done ? 'bg-emerald-400 text-emerald-900' : 'bg-white/30'}`}>
                  {item.done ? '✓' : item.step}
                </div>
                <span className={`text-xs sm:text-sm ${item.done ? 'line-through opacity-70' : ''}`}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pro Tip */}
      <div className={`backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start sm:items-center gap-3 border ${
        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
          <FiClock className="text-amber-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>Pro Tip</p>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Hover over any button or menu item to see helpful tooltips explaining what it does!</p>
        </div>
      </div>
    </div>
  );
}

