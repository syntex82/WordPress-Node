/**
 * Session Management Page
 * View and manage active user sessions
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMonitor, FiTrash2, FiRefreshCw, FiUsers } from 'react-icons/fi';

export default function SessionManagement() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await securityApi.getSessions();
      setSessions(response.data);
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (sessionId: string) => {
    if (!confirm('Force logout this session?')) return;

    try {
      await securityApi.forceLogoutSession(sessionId);
      toast.success('Session terminated');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to terminate session');
    }
  };

  const handleForceLogoutAll = async (userId: string) => {
    if (!confirm('Force logout ALL sessions for this user?')) return;

    try {
      await securityApi.forceLogoutAllSessions(userId);
      toast.success('All sessions terminated');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to terminate sessions');
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await securityApi.cleanupSessions();
      toast.success(`Cleaned up ${response.data.deleted} expired sessions`);
      fetchSessions();
    } catch (error) {
      toast.error('Failed to cleanup sessions');
    }
  };

  const formatLastActivity = (date: string) => {
    const now = new Date();
    const activity = new Date(date);
    const diffMs = now.getTime() - activity.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getUserAgent = (ua: string) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  };

  if (loading) return <LoadingSpinner />;

  // Group sessions by user
  const sessionsByUser = sessions.reduce((acc, session) => {
    const userId = session.userId;
    if (!acc[userId]) {
      acc[userId] = {
        user: session.user,
        sessions: [],
      };
    }
    acc[userId].sessions.push(session);
    return acc;
  }, {} as Record<string, { user: any; sessions: any[] }>);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link to=".." relative="path" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4">
          <FiArrowLeft /> Back to Security
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
            <p className="text-gray-600 mt-2">View and manage active user sessions</p>
          </div>
          <button
            onClick={handleCleanup}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <FiRefreshCw /> Cleanup Expired
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
            </div>
            <FiMonitor className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">{Object.keys(sessionsByUser).length}</p>
            </div>
            <FiUsers className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Sessions by User */}
      <div className="space-y-6">
        {Object.entries(sessionsByUser).map(([userId, data]: [string, any]) => {
          const { user, sessions: userSessions } = data;
          return (
          <div key={userId} className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name || user.email}</h2>
                <p className="text-sm text-gray-600">
                  {user.email} • {user.role} • {userSessions.length} session(s)
                </p>
              </div>
              {userSessions.length > 1 && (
                <button
                  onClick={() => handleForceLogoutAll(userId)}
                  className="text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <FiTrash2 /> Logout All
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Browser</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userSessions.map((session: any) => (
                    <tr key={session.id}>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {session.ip || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getUserAgent(session.userAgent)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatLastActivity(session.lastActivity)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(session.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleForceLogout(session.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Force logout"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiMonitor className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No active sessions found</p>
          </div>
        )}
      </div>
    </div>
  );
}

