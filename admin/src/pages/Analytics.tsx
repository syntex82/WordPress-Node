/**
 * Advanced Analytics Dashboard
 * Real-time analytics with world map, live visitors, and comprehensive stats
 */

import { useEffect, useState, useCallback } from 'react';
import { analyticsApi } from '../services/api';
import { useThemeClasses } from '../contexts/SiteThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  FiUsers, FiEye, FiClock, FiTrendingUp, FiMonitor, FiSmartphone, FiTablet,
  FiRefreshCw, FiGlobe, FiActivity, FiMapPin, FiChrome, FiDownload,
  FiArrowUp, FiArrowDown, FiMinus, FiZap, FiTarget, FiBarChart2
} from 'react-icons/fi';

interface DashboardStats {
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  avgDuration: number;
  bounceRate: number;
  pagesPerSession?: number;
  avgScrollDepth?: number;
  comparison?: {
    pageViews: number;
    uniqueVisitors: number;
    sessions: number;
    avgDuration: number;
    bounceRate: number;
  };
}

interface PageViewData {
  date: string;
  views: number;
}

interface TopPage {
  path: string;
  views: number;
  avgDuration: number;
  percentage?: number;
}

interface DeviceData {
  device: string;
  count: number;
  percentage: number;
}

interface RealTimeData {
  activeVisitors: number;
  recentPages: { path: string; createdAt: string; device?: string; country?: string }[];
  activeByPage?: { path: string; count: number }[];
  activeByCountry?: { country: string; count: number }[];
  pageViewsPerMinute?: { minute: string; count: number }[];
}

interface GeoData {
  countries: { country: string; sessions: number; percentage: number }[];
  cities: { city: string; country: string; sessions: number }[];
}

interface TrafficSource {
  source: string;
  sessions: number;
  percentage: number;
}

interface BrowserData {
  browser: string;
  count: number;
  percentage: number;
}

// Country code to name mapping for display
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', DE: 'Germany', FR: 'France',
  CA: 'Canada', AU: 'Australia', IN: 'India', BR: 'Brazil', JP: 'Japan',
  CN: 'China', RU: 'Russia', IT: 'Italy', ES: 'Spain', MX: 'Mexico',
  NL: 'Netherlands', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  PL: 'Poland', AT: 'Austria', CH: 'Switzerland', BE: 'Belgium', IE: 'Ireland',
  PT: 'Portugal', GR: 'Greece', CZ: 'Czech Republic', RO: 'Romania', HU: 'Hungary',
  SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia', TH: 'Thailand', PH: 'Philippines',
  VN: 'Vietnam', KR: 'South Korea', TW: 'Taiwan', HK: 'Hong Kong', NZ: 'New Zealand',
  ZA: 'South Africa', EG: 'Egypt', NG: 'Nigeria', KE: 'Kenya', AE: 'UAE',
  SA: 'Saudi Arabia', IL: 'Israel', TR: 'Turkey', UA: 'Ukraine', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru', VE: 'Venezuela',
};

const getCountryName = (code: string) => COUNTRY_NAMES[code] || code;

export default function Analytics() {
  const theme = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'realtime' | 'geo' | 'behavior' | 'tech'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pageViews, setPageViews] = useState<PageViewData[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [browsers, setBrowsers] = useState<BrowserData[]>([]);
  const [realtime, setRealtime] = useState<RealTimeData | null>(null);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [trafficSources, setTrafficSources] = useState<{ byType: TrafficSource[] } | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, viewsRes, pagesRes, devicesRes, realtimeRes, geoRes, trafficRes, browserRes] = await Promise.all([
        analyticsApi.getDashboard(period),
        analyticsApi.getPageViews(period),
        analyticsApi.getTopPages(period, 10),
        analyticsApi.getDevices(period),
        analyticsApi.getRealtime(),
        analyticsApi.getGeographic ? analyticsApi.getGeographic(period) : Promise.resolve({ data: null }),
        analyticsApi.getTrafficSources ? analyticsApi.getTrafficSources(period) : Promise.resolve({ data: null }),
        analyticsApi.getBrowsers ? analyticsApi.getBrowsers(period) : Promise.resolve({ data: [] }),
      ]);
      setStats(dashRes.data || { pageViews: 0, uniqueVisitors: 0, sessions: 0, avgDuration: 0, bounceRate: 0 });
      setPageViews(viewsRes.data || []);
      setTopPages(pagesRes.data || []);
      setDevices(devicesRes.data || []);
      setRealtime(realtimeRes.data || { activeVisitors: 0, recentPages: [] });
      setGeoData(geoRes.data || { countries: [], cities: [] });
      setTrafficSources(trafficRes.data || { byType: [] });
      setBrowsers(browserRes.data || []);
    } catch (error: any) {
      setStats({ pageViews: 0, uniqueVisitors: 0, sessions: 0, avgDuration: 0, bounceRate: 0 });
      setPageViews([]);
      setTopPages([]);
      setDevices([]);
      setRealtime({ activeVisitors: 0, recentPages: [] });
      setGeoData({ countries: [], cities: [] });
      setTrafficSources({ byType: [] });
      setBrowsers([]);
      toast.error(error.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Auto-refresh realtime every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await analyticsApi.getRealtime();
        setRealtime(res.data);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getChangeIcon = (change: number | undefined) => {
    if (!change) return <FiMinus className="text-gray-400" size={14} />;
    if (change > 0) return <FiArrowUp className="text-green-500" size={14} />;
    return <FiArrowDown className="text-red-500" size={14} />;
  };

  const getChangeColor = (change: number | undefined, inverse = false) => {
    if (!change) return 'text-gray-400';
    const positive = inverse ? change < 0 : change > 0;
    return positive ? 'text-green-500' : 'text-red-500';
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return <FiSmartphone className="text-blue-400" />;
      case 'tablet': return <FiTablet className="text-emerald-400" />;
      default: return <FiMonitor className="text-slate-400" />;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme.textPrimary}`}>Analytics Dashboard</h1>
          <p className={`text-sm ${theme.textMuted}`}>Real-time insights into your website performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={`rounded-lg px-3 py-2 text-sm border ${theme.card} ${theme.border} ${theme.textPrimary}`}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
          <button onClick={fetchAnalytics} className={`p-2 border rounded-lg ${theme.card} ${theme.border} hover:bg-blue-500/10`}>
            <FiRefreshCw size={18} className={theme.textMuted} />
          </button>
        </div>
      </div>

      {/* Real-time Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-4 h-4 bg-emerald-500 rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <span className="text-emerald-400 font-bold text-2xl">{realtime?.activeVisitors || 0}</span>
            <span className={`ml-2 ${theme.textMuted}`}>active visitors right now</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className={`font-semibold ${theme.textPrimary}`}>{(stats?.pageViews || 0).toLocaleString()}</div>
            <div className={theme.textMuted}>Views Today</div>
          </div>
          <div className="text-center">
            <div className={`font-semibold ${theme.textPrimary}`}>{(stats?.uniqueVisitors || 0).toLocaleString()}</div>
            <div className={theme.textMuted}>Unique</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-lg border ${theme.card} ${theme.border}`}>
        {[
          { id: 'overview', label: 'Overview', icon: FiBarChart2 },
          { id: 'realtime', label: 'Real-time', icon: FiActivity },
          { id: 'geo', label: 'Geography', icon: FiGlobe },
          { id: 'behavior', label: 'Behavior', icon: FiTarget },
          { id: 'tech', label: 'Technology', icon: FiMonitor },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : `${theme.textMuted} hover:bg-blue-500/10`
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards with Comparison */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={<FiEye />} label="Page Views" value={(stats?.pageViews || 0).toLocaleString()}
              change={stats?.comparison?.pageViews} color="blue" />
            <StatCard icon={<FiUsers />} label="Visitors" value={(stats?.uniqueVisitors || 0).toLocaleString()}
              change={stats?.comparison?.uniqueVisitors} color="green" />
            <StatCard icon={<FiActivity />} label="Sessions" value={(stats?.sessions || 0).toLocaleString()}
              change={stats?.comparison?.sessions} color="purple" />
            <StatCard icon={<FiClock />} label="Avg Duration" value={formatDuration(stats?.avgDuration || 0)}
              change={stats?.comparison?.avgDuration} color="orange" />
            <StatCard icon={<FiTrendingUp />} label="Bounce Rate" value={`${stats?.bounceRate || 0}%`}
              change={stats?.comparison?.bounceRate} color="red" inverse />
            <StatCard icon={<FiBarChart2 />} label="Pages/Session" value={`${stats?.pagesPerSession || 0}`}
              color="cyan" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PageViewsChart pageViews={pageViews} theme={theme} />
            <TrafficSourcesCard sources={trafficSources?.byType || []} theme={theme} />
          </div>

          {/* Top Pages & Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPagesCard pages={topPages} formatDuration={formatDuration} theme={theme} />
            <DevicesCard devices={devices} getDeviceIcon={getDeviceIcon} theme={theme} />
          </div>
        </>
      )}

      {/* Real-time Tab */}
      {activeTab === 'realtime' && (
        <>
          {/* Live Activity Chart */}
          <div className={`rounded-xl border p-6 ${theme.card} ${theme.border}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${theme.textPrimary}`}>Pageviews (Last 30 minutes)</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className={`text-sm ${theme.textMuted}`}>Live</span>
              </div>
            </div>
            <div className="h-32 flex items-end gap-1">
              {(realtime?.pageViewsPerMinute || []).map((pv, i) => {
                const max = Math.max(...(realtime?.pageViewsPerMinute || []).map(p => p.count), 1);
                const height = (pv.count / max) * 100;
                return (
                  <div key={i} className="flex-1 group relative">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all hover:from-emerald-500"
                      style={{ height: `${height}%`, minHeight: pv.count > 0 ? '4px' : '1px' }}
                    />
                    <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {pv.minute}: {pv.count} views
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active by Country & Page */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-xl border p-6 ${theme.card} ${theme.border}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
                <FiGlobe className="text-blue-400" /> Active by Country
              </h3>
              {(realtime?.activeByCountry || []).length === 0 ? (
                <p className={`text-center py-8 ${theme.textMuted}`}>No active visitors</p>
              ) : (
                <div className="space-y-3">
                  {(realtime?.activeByCountry || []).map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiMapPin className="text-emerald-400" size={14} />
                        <span className={theme.textPrimary}>{getCountryName(c.country)}</span>
                      </div>
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm font-medium">
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`rounded-xl border p-6 ${theme.card} ${theme.border}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
                <FiActivity className="text-purple-400" /> Active by Page
              </h3>
              {(realtime?.activeByPage || []).length === 0 ? (
                <p className={`text-center py-8 ${theme.textMuted}`}>No active pages</p>
              ) : (
                <div className="space-y-3">
                  {(realtime?.activeByPage || []).slice(0, 10).map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className={`truncate max-w-xs ${theme.textPrimary}`}>{p.path}</span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm font-medium">
                        {p.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className={`rounded-xl border overflow-hidden ${theme.card} ${theme.border}`}>
            <div className={`px-6 py-4 border-b ${theme.border} flex items-center gap-2`}>
              <FiZap className="text-yellow-400" />
              <h3 className={`font-semibold ${theme.textPrimary}`}>Live Activity Feed</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {(realtime?.recentPages || []).map((page, i) => (
                <div key={i} className={`px-6 py-3 flex items-center justify-between border-b ${theme.border} last:border-0`}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className={theme.textPrimary}>{page.path}</span>
                    {page.country && (
                      <span className={`text-xs px-2 py-0.5 rounded ${theme.isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>{page.country}</span>
                    )}
                  </div>
                  <span className={`text-sm ${theme.textMuted}`}>
                    {page.createdAt ? new Date(page.createdAt).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Geography Tab */}
      {activeTab === 'geo' && (
        <>
          {/* World Map Placeholder + Countries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 rounded-xl border p-6 ${theme.card} ${theme.border}`}>
              <h3 className={`font-semibold mb-4 ${theme.textPrimary}`}>Visitors by Country</h3>
              <WorldMapVisualization countries={geoData?.countries || []} theme={theme} />
            </div>
            <div className={`rounded-xl border p-6 ${theme.card} ${theme.border}`}>
              <h3 className={`font-semibold mb-4 ${theme.textPrimary}`}>Top Countries</h3>
              <div className="space-y-3">
                {(geoData?.countries || []).slice(0, 10).map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 text-right text-sm font-medium ${theme.textMuted}`}>{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className={theme.textPrimary}>{getCountryName(c.country)}</span>
                        <span className={theme.textMuted}>{c.sessions} ({c.percentage}%)</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${theme.isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                          style={{ width: `${c.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Cities */}
          <div className={`rounded-xl border p-6 ${theme.card} ${theme.border}`}>
            <h3 className={`font-semibold mb-4 ${theme.textPrimary}`}>Top Cities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {(geoData?.cities || []).slice(0, 10).map((c, i) => (
                <div key={i} className={`p-3 rounded-lg border ${theme.border} ${theme.card}`}>
                  <div className={`font-medium ${theme.textPrimary}`}>{c.city}</div>
                  <div className={`text-sm ${theme.textMuted}`}>{c.country}</div>
                  <div className="text-blue-400 font-semibold">{c.sessions} sessions</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Behavior Tab */}
      {activeTab === 'behavior' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPagesCard pages={topPages} formatDuration={formatDuration} theme={theme} />
            <div className={`rounded-xl border p-6 ${theme.card} ${theme.border}`}>
              <h3 className={`font-semibold mb-4 ${theme.textPrimary}`}>Traffic Sources</h3>
              <div className="space-y-4">
                {(trafficSources?.byType || []).map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className={`capitalize ${theme.textPrimary}`}>{s.source}</span>
                        <span className={theme.textMuted}>{s.sessions} ({s.percentage}%)</span>
                      </div>
                      <div className={`h-2 rounded-full ${theme.isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${s.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <PageViewsChart pageViews={pageViews} theme={theme} />
        </>
      )}

      {/* Technology Tab */}
      {activeTab === 'tech' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DevicesCard devices={devices} getDeviceIcon={getDeviceIcon} theme={theme} />
          <div className={`rounded-xl border p-6 ${theme.card} ${theme.border}`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
              <FiChrome className="text-blue-400" /> Browsers
            </h3>
            <div className="space-y-4">
              {(browsers || []).slice(0, 8).map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className={theme.textPrimary}>{b.browser}</span>
                      <span className={theme.textMuted}>{b.count} ({b.percentage}%)</span>
                    </div>
                    <div className={`h-2 rounded-full ${theme.isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"
                        style={{ width: `${b.percentage}%` }} />
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card with comparison
function StatCard({ icon, label, value, color, change, inverse }: {
  icon: React.ReactNode; label: string; value: string; color: string; change?: number; inverse?: boolean
}) {
  const theme = useThemeClasses();
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  };

  const getChangeColor = () => {
    if (!change) return 'text-gray-400';
    const positive = inverse ? change < 0 : change > 0;
    return positive ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className={`rounded-xl border p-4 ${theme.card} ${theme.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${theme.textPrimary}`}>{value}</p>
      <div className="flex items-center justify-between">
        <p className={`text-xs ${theme.textMuted}`}>{label}</p>
        {change !== undefined && (
          <span className={`text-xs flex items-center gap-0.5 ${getChangeColor()}`}>
            {change > 0 ? <FiArrowUp size={10} /> : change < 0 ? <FiArrowDown size={10} /> : null}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

// Page Views Chart
function PageViewsChart({ pageViews, theme }: { pageViews: PageViewData[]; theme: any }) {
  return (
    <div className={`rounded-xl border p-6 ${theme.card} ${theme.border}`}>
      <h3 className={`font-semibold mb-4 ${theme.textPrimary}`}>Page Views Over Time</h3>
      <div className="h-48 flex items-end gap-1">
        {!pageViews.length ? (
          <p className={`text-center w-full ${theme.textMuted}`}>No data available</p>
        ) : (
          pageViews.map((pv, i) => {
            const max = Math.max(...pageViews.map(p => p.views), 1);
            const height = (pv.views / max) * 100;
            return (
              <div key={i} className="flex-1 group relative">
                <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 rounded-t transition-all cursor-pointer"
                  style={{ height: `${height}%`, minHeight: '4px' }} />
                <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {pv.date}: {pv.views} views
                </div>
              </div>
            );
          })
        )}
      </div>
      {pageViews.length > 0 && (
        <div className={`flex justify-between text-xs mt-2 ${theme.textMuted}`}>
          <span>{pageViews[0]?.date}</span>
          <span>{pageViews[pageViews.length - 1]?.date}</span>
        </div>
      )}
    </div>
  );
}

// Traffic Sources Card
function TrafficSourcesCard({ sources, theme }: { sources: TrafficSource[]; theme: any }) {
  const colors = ['from-blue-500 to-cyan-400', 'from-purple-500 to-pink-400', 'from-emerald-500 to-green-400',
    'from-orange-500 to-yellow-400', 'from-red-500 to-rose-400'];
  return (
    <div className={`rounded-xl border p-6 ${theme.card} ${theme.border}`}>
      <h3 className={`font-semibold mb-4 ${theme.textPrimary}`}>Traffic Sources</h3>
      {!sources.length ? (
        <p className={`text-center py-8 ${theme.textMuted}`}>No data available</p>
      ) : (
        <div className="space-y-4">
          {sources.map((s, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className={`capitalize ${theme.textPrimary}`}>{s.source || 'Direct'}</span>
                <span className={theme.textMuted}>{s.sessions} ({s.percentage}%)</span>
              </div>
              <div className={`h-2 rounded-full ${theme.isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div className={`h-full bg-gradient-to-r ${colors[i % colors.length]} rounded-full`}
                  style={{ width: `${s.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Top Pages Card
function TopPagesCard({ pages, formatDuration, theme }: { pages: TopPage[]; formatDuration: (s: number) => string; theme: any }) {
  return (
    <div className={`rounded-xl border overflow-hidden ${theme.card} ${theme.border}`}>
      <div className={`px-6 py-4 border-b ${theme.border}`}>
        <h3 className={`font-semibold ${theme.textPrimary}`}>Top Pages</h3>
      </div>
      {!pages.length ? (
        <p className={`text-center py-8 ${theme.textMuted}`}>No data available</p>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {pages.map((page, i) => (
            <div key={i} className={`px-6 py-3 flex items-center justify-between border-b ${theme.border} last:border-0`}>
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  i < 3 ? 'bg-blue-500 text-white' : `${theme.isDark ? 'bg-slate-700' : 'bg-gray-200'} ${theme.textMuted}`
                }`}>{i + 1}</span>
                <span className={`truncate max-w-xs ${theme.textPrimary}`}>{page.path}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className={theme.textMuted}>{page.views.toLocaleString()} views</span>
                <span className={theme.textMuted}>{formatDuration(page.avgDuration)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Devices Card
function DevicesCard({ devices, getDeviceIcon, theme }: { devices: DeviceData[]; getDeviceIcon: (d: string) => React.ReactNode; theme: any }) {
  return (
    <div className={`rounded-xl border p-6 ${theme.card} ${theme.border}`}>
      <h3 className={`font-semibold mb-4 ${theme.textPrimary}`}>Devices</h3>
      {!devices.length ? (
        <p className={`text-center py-8 ${theme.textMuted}`}>No data available</p>
      ) : (
        <div className="space-y-4">
          {devices.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-2xl">{getDeviceIcon(d.device)}</div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className={`capitalize ${theme.textPrimary}`}>{d.device || 'Unknown'}</span>
                  <span className={theme.textMuted}>{d.count} ({d.percentage}%)</span>
                </div>
                <div className={`h-2 rounded-full ${theme.isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${d.percentage}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// World Map Visualization
function WorldMapVisualization({ countries, theme }: { countries: { country: string; sessions: number; percentage: number }[]; theme: any }) {
  // Simple SVG world map with country highlights
  const countryMap = new Map(countries.map(c => [c.country, c]));
  const maxSessions = Math.max(...countries.map(c => c.sessions), 1);

  return (
    <div className="relative w-full h-64 md:h-80">
      {/* Simplified world map representation using a grid of dots */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {/* Create a dot-based world representation */}
          <svg viewBox="0 0 1000 500" className="w-full h-full">
            {/* Background */}
            <rect fill={theme.isDark ? '#0f172a' : '#f1f5f9'} width="1000" height="500" rx="8" />

            {/* Simplified continents as shapes */}
            {/* North America */}
            <ellipse cx="200" cy="150" rx="120" ry="80" fill={theme.isDark ? '#1e293b' : '#e2e8f0'} />
            {/* South America */}
            <ellipse cx="280" cy="320" rx="60" ry="100" fill={theme.isDark ? '#1e293b' : '#e2e8f0'} />
            {/* Europe */}
            <ellipse cx="500" cy="130" rx="80" ry="50" fill={theme.isDark ? '#1e293b' : '#e2e8f0'} />
            {/* Africa */}
            <ellipse cx="520" cy="280" rx="70" ry="100" fill={theme.isDark ? '#1e293b' : '#e2e8f0'} />
            {/* Asia */}
            <ellipse cx="700" cy="150" rx="150" ry="80" fill={theme.isDark ? '#1e293b' : '#e2e8f0'} />
            {/* Australia */}
            <ellipse cx="820" cy="350" rx="60" ry="40" fill={theme.isDark ? '#1e293b' : '#e2e8f0'} />

            {/* Country dots - positioned approximately */}
            {countries.slice(0, 20).map((c, i) => {
              const positions: Record<string, [number, number]> = {
                US: [180, 160], CA: [200, 100], MX: [150, 220], BR: [300, 320], AR: [280, 400],
                GB: [470, 120], DE: [510, 130], FR: [480, 150], IT: [520, 170], ES: [450, 170],
                RU: [680, 100], CN: [750, 180], JP: [850, 160], IN: [680, 230], AU: [820, 350],
                KR: [820, 170], SG: [740, 280], ID: [760, 310], TH: [720, 250], VN: [740, 240],
              };
              const [x, y] = positions[c.country] || [500 + i * 20, 250];
              const intensity = c.sessions / maxSessions;
              const size = 8 + intensity * 20;

              return (
                <g key={c.country}>
                  <circle cx={x} cy={y} r={size} fill="#3b82f6" opacity={0.3 + intensity * 0.5} />
                  <circle cx={x} cy={y} r={size * 0.6} fill="#3b82f6" opacity={0.6 + intensity * 0.4} />
                  <text x={x} y={y + size + 12} textAnchor="middle" className="text-[10px]" fill={theme.isDark ? '#94a3b8' : '#64748b'}>
                    {c.country}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className={`absolute bottom-2 left-2 flex items-center gap-2 text-xs ${theme.textMuted}`}>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 opacity-30" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 opacity-60" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

