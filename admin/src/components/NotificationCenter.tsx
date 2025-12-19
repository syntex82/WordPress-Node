/**
 * Notification Center Component
 * Bell icon with dropdown showing notifications
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell, FiCheck, FiCheckCircle, FiX, FiTrash2, FiAlertCircle,
  FiInfo, FiAlertTriangle, FiShield, FiFileText, FiUser, FiPackage,
  FiSettings, FiLoader
} from 'react-icons/fi';
import { notificationsApi, Notification } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch unread count periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationsApi.getUnreadCount();
        setUnreadCount(res.data.count);
      } catch { /* ignore */ }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await notificationsApi.getAll({ page: pageNum, limit: 10 });
      if (pageNum === 1) {
        setNotifications(res.data.data);
      } else {
        setNotifications(prev => [...prev, ...res.data.data]);
      }
      setHasMore(pageNum < res.data.meta.totalPages);
      setPage(pageNum);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.delete(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch { /* ignore */ }
  };

  const handleClearAll = async () => {
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      notificationsApi.markAsRead(notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getIcon = (notification: Notification) => {
    const iconMap: Record<string, React.ElementType> = {
      FiFileText, FiUser, FiPackage, FiShield, FiSettings,
      FiInfo, FiCheckCircle, FiAlertTriangle, FiAlertCircle,
    };
    const Icon = notification.icon ? iconMap[notification.icon] || FiBell : getTypeIcon(notification.type);
    return Icon;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return FiCheckCircle;
      case 'WARNING': return FiAlertTriangle;
      case 'ERROR': return FiAlertCircle;
      case 'SECURITY': return FiShield;
      case 'CONTENT': return FiFileText;
      case 'USER_ACTION': return FiUser;
      case 'MARKETPLACE': return FiPackage;
      default: return FiInfo;
    }
  };

  const getIconColor = (notification: Notification) => {
    if (notification.iconColor) return notification.iconColor;
    switch (notification.type) {
      case 'SUCCESS': return 'text-emerald-400';
      case 'WARNING': return 'text-amber-400';
      case 'ERROR': return 'text-red-400';
      case 'SECURITY': return 'text-red-400';
      case 'CONTENT': return 'text-blue-400';
      case 'USER_ACTION': return 'text-purple-400';
      case 'MARKETPLACE': return 'text-violet-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 rounded-xl border border-slate-700/50 shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FiBell className="text-violet-400" size={16} />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full text-xs">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                  title="Mark all as read"
                >
                  <FiCheck size={16} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                  title="Clear all"
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && !loading && (
              <div className="px-4 py-8 text-center text-slate-500">
                <FiBell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            )}

            {notifications.map((notification) => {
              const Icon = getIcon(notification);
              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-slate-700/30 transition-colors border-b border-slate-700/30 last:border-0 ${
                    !notification.isRead ? 'bg-violet-500/5' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg bg-slate-700/50 ${getIconColor(notification)}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium truncate ${notification.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Mark as read"
                      >
                        <FiCheck size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </button>
              );
            })}

            {loading && (
              <div className="px-4 py-3 flex items-center justify-center">
                <FiLoader className="animate-spin text-violet-400" size={20} />
              </div>
            )}

            {hasMore && !loading && notifications.length > 0 && (
              <button
                onClick={() => fetchNotifications(page + 1)}
                className="w-full px-4 py-2 text-sm text-violet-400 hover:bg-slate-700/30 transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

