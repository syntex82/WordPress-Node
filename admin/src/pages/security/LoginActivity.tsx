/**
 * Login Activity Page
 * Monitor all login attempts and authentication events
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../../services/api';
import { useThemeClasses } from '../../contexts/SiteThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiAlertTriangle, FiFilter } from 'react-icons/fi';

export default function LoginActivity() {
  const theme = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      const params: any = {};
      if (filter !== 'all') {
        params.type = filter;
      }
      const response = await securityApi.getEvents(params);
      setEvents(response.data.events || []);
    } catch (error) {
      toast.error('Failed to load login activity');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    if (type === 'SUCCESS_LOGIN') return <FiCheckCircle className="text-emerald-400" size={20} />;
    if (type === 'FAILED_LOGIN') return <FiXCircle className="text-red-400" size={20} />;
    if (type === 'LOCKOUT_TRIGGERED') return <FiAlertTriangle className="text-orange-400" size={20} />;
    return <FiAlertTriangle className="text-amber-400" size={20} />;
  };

  const getEventColor = (type: string) => {
    if (type === 'SUCCESS_LOGIN') return 'bg-emerald-500/10 border-emerald-500/30';
    if (type === 'FAILED_LOGIN') return 'bg-red-500/10 border-red-500/30';
    if (type === 'LOCKOUT_TRIGGERED') return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-amber-500/10 border-amber-500/30';
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <Link to=".." relative="path" className="flex items-center text-blue-400 hover:text-blue-300 mb-4">
          <FiArrowLeft className="mr-2" size={18} />
          Back to Security Center
        </Link>
        <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>Login Activity</h1>
        <p className={`mt-1 ${theme.textMuted}`}>Monitor all authentication events and login attempts</p>
      </div>

      {/* Filters */}
      <div className={`backdrop-blur rounded-xl border p-4 mb-6 ${theme.card}`}>
        <div className="flex items-center">
          <FiFilter className={`mr-3 ${theme.icon}`} size={20} />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : theme.isDark ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('SUCCESS_LOGIN')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'SUCCESS_LOGIN' ? 'bg-emerald-600 text-white' : theme.isDark ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Successful
            </button>
            <button
              onClick={() => setFilter('FAILED_LOGIN')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'FAILED_LOGIN' ? 'bg-red-600 text-white' : theme.isDark ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Failed
            </button>
            <button
              onClick={() => setFilter('LOCKOUT_TRIGGERED')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'LOCKOUT_TRIGGERED' ? 'bg-orange-600 text-white' : theme.isDark ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Lockouts
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className={`backdrop-blur rounded-xl border ${theme.card}`}>
        <div className={`p-6 border-b ${theme.border}`}>
          <h2 className={`text-xl font-bold ${theme.textPrimary}`}>Recent Activity ({events.length})</h2>
        </div>
        <div className={`divide-y ${theme.border}`}>
          {events.length === 0 ? (
            <div className={`p-8 text-center ${theme.textMuted}`}>
              No login activity found
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className={`p-6 border-l-4 ${getEventColor(event.type)}`}>
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${theme.textPrimary}`}>{formatEventType(event.type)}</h3>
                      <span className={`text-sm ${theme.textMuted}`}>
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className={`mt-2 text-sm space-y-1 ${theme.textMuted}`}>
                      {event.user && (
                        <p><span className={`font-medium ${theme.textSecondary}`}>User:</span> {event.user.email}</p>
                      )}
                      {event.ip && (
                        <p><span className={`font-medium ${theme.textSecondary}`}>IP Address:</span> {event.ip}</p>
                      )}
                      {event.userAgent && (
                        <p><span className={`font-medium ${theme.textSecondary}`}>User Agent:</span> {event.userAgent}</p>
                      )}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <p><span className={`font-medium ${theme.textSecondary}`}>Details:</span> {JSON.stringify(event.metadata)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


