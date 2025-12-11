/**
 * Security Dashboard - Overview Page
 * Main security center with metrics and quick actions
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiActivity,
  FiLock,
  FiFileText,
  FiRefreshCw,
  FiEye,
  FiKey,
  FiClock,
  FiMonitor,
} from 'react-icons/fi';

export default function SecurityDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [runningCheck, setRunningCheck] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await securityApi.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      toast.error('Failed to load security dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSecurityCheck = async () => {
    setRunningCheck(true);
    try {
      const response = await securityApi.runSecurityCheck();
      setDashboard({ ...dashboard, securityStatus: response.data });
      toast.success('Security check completed');
    } catch (error) {
      toast.error('Failed to run security check');
    } finally {
      setRunningCheck(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <FiCheckCircle className="text-green-600" size={20} />;
      case 'warning': return <FiAlertTriangle className="text-yellow-600" size={20} />;
      case 'fail': return <FiXCircle className="text-red-600" size={20} />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your site's security</p>
        </div>
        <button
          onClick={handleRunSecurityCheck}
          disabled={runningCheck}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <FiRefreshCw className={`mr-2 ${runningCheck ? 'animate-spin' : ''}`} size={18} />
          Run Security Check
        </button>
      </div>

      {/* Risk Level Badge */}
      {dashboard?.securityStatus && (
        <div className="mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold ${getRiskColor(dashboard.securityStatus.riskLevel)}`}>
            <FiShield className="mr-2" size={20} />
            Risk Level: {dashboard.securityStatus.riskLevel.toUpperCase()}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Logins (24h)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard?.failedLogins24h || 0}</p>
            </div>
            <div className="bg-red-100 text-red-600 p-3 rounded-lg">
              <FiXCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Locked Accounts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard?.lockedAccounts || 0}</p>
            </div>
            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
              <FiLock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blocked IPs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard?.blockedIps || 0}</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
              <FiShield size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Logins (7d)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard?.failedLogins7d || 0}</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
              <FiActivity size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Security Checks */}
      {dashboard?.securityStatus?.checks && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Security Checks</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboard.securityStatus.checks.map((check: any, index: number) => (
                <div key={index} className="flex items-start p-4 border border-gray-200 rounded-lg">
                  <div className="mr-4 mt-1">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{check.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                    {check.details && (
                      <p className="text-xs text-gray-500 mt-2">{check.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="activity" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg mr-4">
              <FiActivity size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Login Activity</h3>
          </div>
          <p className="text-sm text-gray-600">Monitor all login attempts and authentication events</p>
        </Link>

        <Link to="blocked-ips" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg mr-4">
              <FiShield size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">IP Blocking</h3>
          </div>
          <p className="text-sm text-gray-600">Block malicious IPs and manage access control</p>
        </Link>

        <Link to="rate-limiting" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg mr-4">
              <FiClock size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Rate Limiting</h3>
          </div>
          <p className="text-sm text-gray-600">Configure API rate limits and DDoS protection</p>
        </Link>

        <Link to="sessions" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-teal-100 text-teal-600 p-3 rounded-lg mr-4">
              <FiMonitor size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Session Management</h3>
          </div>
          <p className="text-sm text-gray-600">View and manage active user sessions</p>
        </Link>

        <Link to="password-policy" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg mr-4">
              <FiKey size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Password Policy</h3>
          </div>
          <p className="text-sm text-gray-600">Configure password strength requirements</p>
        </Link>

        <Link to="integrity" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 text-green-600 p-3 rounded-lg mr-4">
              <FiFileText size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">File Integrity</h3>
          </div>
          <p className="text-sm text-gray-600">Detect unauthorized file modifications</p>
        </Link>

        <Link to="audit-log" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-orange-100 text-orange-600 p-3 rounded-lg mr-4">
              <FiEye size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
          </div>
          <p className="text-sm text-gray-600">Complete security event history and forensics</p>
        </Link>

        <Link to="2fa" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg mr-4">
              <FiKey size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Two-Factor Auth</h3>
          </div>
          <p className="text-sm text-gray-600">Enable 2FA for enhanced account security</p>
        </Link>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
          <div className="flex items-center mb-4">
            <div className="bg-gray-200 text-gray-500 p-3 rounded-lg mr-4">
              <FiShield size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-500">More Tools</h3>
          </div>
          <p className="text-sm text-gray-500">Additional security features coming soon</p>
        </div>
      </div>
    </div>
  );
}

