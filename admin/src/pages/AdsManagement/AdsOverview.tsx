/**
 * Ads Overview Dashboard - Summary stats and quick actions
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
  const { token } = useAuth();
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
        <h1 className="text-2xl font-bold">Ads Management</h1>
        <div className="space-x-2">
          <Link to="/ads/campaigns/new" className="btn btn-primary">
            New Campaign
          </Link>
          <Link to="/ads/zones/new" className="btn btn-secondary">
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Today's Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats?.todayImpressions?.toLocaleString() ?? 0}
            </div>
            <div className="text-sm text-gray-500">Impressions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats?.todayClicks?.toLocaleString() ?? 0}
            </div>
            <div className="text-sm text-gray-500">Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {((stats?.ctr ?? 0) * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500">CTR</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">
              ${stats?.todayRevenue?.toFixed(2) ?? '0.00'}
            </div>
            <div className="text-sm text-gray-500">Revenue</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/ads/analytics"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold">📊 View Analytics</h3>
          <p className="text-sm text-gray-500">Detailed performance reports</p>
        </Link>
        <Link
          to="/ads/advertisers/new"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold">➕ Add Advertiser</h3>
          <p className="text-sm text-gray-500">Register a new advertiser</p>
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
  <Link to={link} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
    <div className="text-2xl font-bold">{value.toLocaleString()}</div>
    <div className="text-sm text-gray-500">{title}</div>
  </Link>
);

export default AdsOverview;

