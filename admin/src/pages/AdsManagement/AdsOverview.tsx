/**
 * Ads Overview Dashboard - Summary stats and quick actions
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface AdStats {
  totalAdvertisers: number;
  activeCampaigns: number;
  totalAds: number;
  totalZones: number;
  todayImpressions: number;
  todayClicks: number;
  todayRevenue: number;
  ctr: number;
}

export const AdsOverview: React.FC = () => {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/ads/stats/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setStats(await response.json());
        }
      } catch (err) {
        console.error('Failed to fetch ad stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) {
    return <div className="p-6">Loading ads dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ads Management</h1>
        <div className="space-x-2">
          <Link to="/ads/campaigns/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            New Campaign
          </Link>
          <Link to="/ads/zones/new" className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
            New Zone
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Advertisers" value={stats?.totalAdvertisers ?? 0} link="/ads/advertisers" />
        <StatCard title="Active Campaigns" value={stats?.activeCampaigns ?? 0} link="/ads/campaigns" />
        <StatCard title="Total Ads" value={stats?.totalAds ?? 0} link="/ads/ads" />
        <StatCard title="Ad Zones" value={stats?.totalZones ?? 0} link="/ads/zones" />
      </div>

      {/* Today's Performance */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Today's Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats?.todayImpressions?.toLocaleString() ?? 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-slate-400">Impressions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats?.todayClicks?.toLocaleString() ?? 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-slate-400">Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {((stats?.ctr ?? 0) * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-slate-400">CTR</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              ${stats?.todayRevenue?.toFixed(2) ?? '0.00'}
            </div>
            <div className="text-sm text-gray-500 dark:text-slate-400">Revenue</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/ads/house"
          className="bg-green-50 dark:bg-green-900/30 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-green-200 dark:border-green-800"
        >
          <h3 className="font-semibold text-green-800 dark:text-green-300">🏠 House Ads (FREE!)</h3>
          <p className="text-sm text-green-600 dark:text-green-400">Your own promotional ads - no payment needed</p>
        </Link>
        <Link
          to="/ads/analytics"
          className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-slate-700"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">📊 View Analytics</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">Detailed performance reports</p>
        </Link>
        <Link
          to="/ads/advertisers"
          className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-slate-700"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">👥 Manage Advertisers</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">External advertisers who pay you</p>
        </Link>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; link: string }> = ({
  title,
  value,
  link,
}) => (
  <Link to={link} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-slate-700">
    <div className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</div>
    <div className="text-sm text-gray-500 dark:text-slate-400">{title}</div>
  </Link>
);

export default AdsOverview;

