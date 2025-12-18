/**
 * Audit Log Page
 * Complete security event history and forensics
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiFilter, FiDownload } from 'react-icons/fi';

export default function AuditLog() {
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
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const exportLog = () => {
    const csv = [
      ['Timestamp', 'Event Type', 'User', 'IP Address', 'User Agent', 'Details'].join(','),
      ...events.map(e => [
        new Date(e.createdAt).toISOString(),
        e.type,
        e.user?.email || 'N/A',
        e.ip || 'N/A',
        e.userAgent || 'N/A',
        JSON.stringify(e.metadata || {})
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString()}.csv`;
    a.click();
    toast.success('Audit log exported');
  };

  const eventTypes = [
    'SUCCESS_LOGIN',
    'FAILED_LOGIN',
    'FAILED_2FA',
    'LOCKOUT_TRIGGERED',
    'TWO_FA_ENABLED',
    'TWO_FA_DISABLED',
    'BLOCKED_REQUEST',
    'INTEGRITY_SCAN',
    'IP_BLOCKED',
    'IP_UNBLOCKED',
    'SECURITY_CHECK',
  ];

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventBadgeColor = (type: string) => {
    if (type.includes('SUCCESS')) return 'bg-green-500/20 text-green-400';
    if (type.includes('FAILED') || type.includes('LOCKOUT')) return 'bg-red-500/20 text-red-400';
    if (type.includes('BLOCKED')) return 'bg-orange-500/20 text-orange-400';
    if (type.includes('2FA') || type.includes('TWO_FA')) return 'bg-purple-500/20 text-purple-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <Link to=".." relative="path" className="flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <FiArrowLeft className="mr-2" size={18} />
          Back to Security Center
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Audit Log</h1>
            <p className="text-slate-400 mt-1">Complete security event history and forensics</p>
          </div>
          <button
            onClick={exportLog}
            className="flex items-center bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-xl hover:from-green-700 hover:to-green-600 transition-colors shadow-lg shadow-green-500/20"
          >
            <FiDownload className="mr-2" size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 mb-6">
        <div className="flex items-center flex-wrap gap-2">
          <FiFilter className="text-slate-400 mr-2" size={20} />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}
          >
            All Events
          </button>
          {eventTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${filter === type ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}
            >
              {formatEventType(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white">Security Events ({events.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No security events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEventBadgeColor(event.type)}`}>
                        {formatEventType(event.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {event.user?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300">
                      {event.ip || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {event.metadata && Object.keys(event.metadata).length > 0 ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-400 hover:text-blue-300 transition-colors">View Details</summary>
                          <pre className="mt-2 text-xs bg-slate-900/50 p-2 rounded-lg overflow-x-auto text-slate-300">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

