/**
 * Login Activity Page
 * Monitor all login attempts and authentication events
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiAlertTriangle, FiFilter } from 'react-icons/fi';

export default function LoginActivity() {
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
    if (type === 'SUCCESS_LOGIN') return <FiCheckCircle className="text-green-600" size={20} />;
    if (type === 'FAILED_LOGIN') return <FiXCircle className="text-red-600" size={20} />;
    if (type === 'LOCKOUT_TRIGGERED') return <FiAlertTriangle className="text-orange-600" size={20} />;
    return <FiAlertTriangle className="text-yellow-600" size={20} />;
  };

  const getEventColor = (type: string) => {
    if (type === 'SUCCESS_LOGIN') return 'bg-green-50 border-green-200';
    if (type === 'FAILED_LOGIN') return 'bg-red-50 border-red-200';
    if (type === 'LOCKOUT_TRIGGERED') return 'bg-orange-50 border-orange-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <Link to=".." relative="path" className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <FiArrowLeft className="mr-2" size={18} />
          Back to Security Center
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Login Activity</h1>
        <p className="text-gray-600 mt-1">Monitor all authentication events and login attempts</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center">
          <FiFilter className="text-gray-500 mr-3" size={20} />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('SUCCESS_LOGIN')}
              className={`px-4 py-2 rounded-md ${filter === 'SUCCESS_LOGIN' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Successful
            </button>
            <button
              onClick={() => setFilter('FAILED_LOGIN')}
              className={`px-4 py-2 rounded-md ${filter === 'FAILED_LOGIN' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Failed
            </button>
            <button
              onClick={() => setFilter('LOCKOUT_TRIGGERED')}
              className={`px-4 py-2 rounded-md ${filter === 'LOCKOUT_TRIGGERED' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Lockouts
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity ({events.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {events.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
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
                      <h3 className="font-semibold text-gray-900">{formatEventType(event.type)}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      {event.user && (
                        <p><span className="font-medium">User:</span> {event.user.email}</p>
                      )}
                      {event.ip && (
                        <p><span className="font-medium">IP Address:</span> {event.ip}</p>
                      )}
                      {event.userAgent && (
                        <p><span className="font-medium">User Agent:</span> {event.userAgent}</p>
                      )}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <p><span className="font-medium">Details:</span> {JSON.stringify(event.metadata)}</p>
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


