/**
 * Ads Analytics Dashboard
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface DailyStats {
  date: string;
  impressions: number;
  clicks: number;
  revenue: number;
  ctr: number;
}

interface TopPerformer {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
}

export const AdsAnalytics: React.FC = () => {
  const { token } = useAuth();
  const [dateRange, setDateRange] = useState(30);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topAds, setTopAds] = useState<TopPerformer[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [token, dateRange]);

  const fetchAnalytics = async () => {
    try {
      const [statsRes, earningsRes] = await Promise.all([
        fetch(`/api/admin/ads/stats/earnings?days=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/ads/stats/top-performers?days=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setDailyStats(data.daily || []);
      }

      if (earningsRes.ok) {
        const data = await earningsRes.json();
        setTopAds(data.topAds || []);
        setTopCampaigns(data.topCampaigns || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const totals = dailyStats.reduce(
    (acc, day) => ({
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
      revenue: acc.revenue + day.revenue,
    }),
    { impressions: 0, clicks: 0, revenue: 0 }
  );

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ads Analytics</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Impressions</div>
          <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Clicks</div>
          <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Average CTR</div>
          <div className="text-2xl font-bold">
            {totals.impressions > 0
              ? ((totals.clicks / totals.impressions) * 100).toFixed(2)
              : '0.00'}
            %
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600">${totals.revenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Top Performing Ads</h2>
          <div className="space-y-3">
            {topAds.slice(0, 5).map((ad, i) => (
              <div key={ad.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{i + 1}.</span>
                  <span className="font-medium">{ad.name}</span>
                </div>
                <div className="text-sm">
                  <span className="text-green-600">{ad.ctr.toFixed(2)}% CTR</span>
                  <span className="text-gray-400 ml-2">${ad.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {topAds.length === 0 && (
              <div className="text-gray-500 text-center py-4">No data available</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Top Campaigns</h2>
          <div className="space-y-3">
            {topCampaigns.slice(0, 5).map((campaign, i) => (
              <div key={campaign.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{i + 1}.</span>
                  <span className="font-medium">{campaign.name}</span>
                </div>
                <div className="text-sm">
                  <span className="text-blue-600">
                    {campaign.clicks.toLocaleString()} clicks
                  </span>
                  <span className="text-gray-400 ml-2">${campaign.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {topCampaigns.length === 0 && (
              <div className="text-gray-500 text-center py-4">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsAnalytics;

