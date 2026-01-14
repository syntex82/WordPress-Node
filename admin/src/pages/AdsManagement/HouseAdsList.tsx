/**
 * House Ads List - FREE ads you run on your own site
 * No payment required!
 */
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { FiPlus, FiEdit, FiTrash2, FiX, FiExternalLink } from 'react-icons/fi';

interface HouseAd {
  id: string;
  name: string;
  ad: { id: string; headline?: string; imageUrl?: string; type: string; format: string };
  zones: { id: string; name: string }[];
  targetUrl: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: string;
  createdAt: string;
}

interface Zone {
  id: string;
  name: string;
  format: string;
}

export const HouseAdsList: React.FC = () => {
  const { token } = useAuthStore();
  const [houseAds, setHouseAds] = useState<HouseAd[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'banner', format: '728x90', headline: '', description: '',
    imageUrl: '', targetUrl: '', ctaText: 'Learn More', priority: 100, zones: [] as string[],
  });

  useEffect(() => { fetchHouseAds(); fetchZones(); }, [token]);

  const fetchHouseAds = async () => {
    try {
      const res = await fetch('/api/admin/ads/house', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setHouseAds(data.ads || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/admin/ads/zones', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setZones(data.zones || data || []);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ads/house', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) { setShowModal(false); resetForm(); fetchHouseAds(); }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this house ad?')) return;
    await fetch(`/api/admin/ads/house/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchHouseAds();
  };

  const resetForm = () => setFormData({
    name: '', type: 'banner', format: '728x90', headline: '', description: '',
    imageUrl: '', targetUrl: '', ctaText: 'Learn More', priority: 100, zones: [],
  });

  if (loading) return <div className="p-6 text-gray-900 dark:text-white">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏠 House Ads</h1>
          <p className="text-green-600 dark:text-green-400 font-medium">FREE - No payment required!</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <FiPlus /> Create House Ad
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-blue-800 dark:text-blue-200">
          <strong>💡 Tip:</strong> House ads are YOUR OWN promotional banners. Use them to promote your products, newsletter, affiliate links, or anything else - completely FREE!
        </p>
      </div>

      {houseAds.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400">
          No house ads yet. Create your first free ad!
        </div>
      ) : (
        <div className="grid gap-4">
          {houseAds.map(ad => (
            <div key={ad.id} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  {ad.ad?.imageUrl && <img src={ad.ad.imageUrl} alt="" className="w-24 h-16 object-cover rounded" />}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{ad.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{ad.ad?.headline}</p>
                    <a href={ad.targetUrl} target="_blank" className="text-sm text-blue-600 flex items-center gap-1"><FiExternalLink /> {ad.targetUrl}</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-gray-900 dark:text-white">{ad.impressions.toLocaleString()} views</div>
                    <div className="text-gray-500 dark:text-slate-400">{ad.clicks} clicks ({ad.ctr}%)</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${ad.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {ad.status}
                  </span>
                  <button onClick={() => handleDelete(ad.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><FiTrash2 /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create House Ad (FREE!)</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white"><FiX size={24} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name *</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Headline</label><input type="text" value={formData.headline} onChange={e => setFormData({...formData, headline: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Image URL</label><input type="text" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="/uploads/my-banner.jpg" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Target URL *</label><input type="text" required value={formData.targetUrl} onChange={e => setFormData({...formData, targetUrl: e.target.value})} placeholder="/shop/products" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Type</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"><option value="banner">Banner</option><option value="native">Native</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Format</label><select value={formData.format} onChange={e => setFormData({...formData, format: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"><option value="728x90">728x90 (Leaderboard)</option><option value="300x250">300x250 (Rectangle)</option><option value="160x600">160x600 (Skyscraper)</option><option value="320x50">320x50 (Mobile)</option></select></div>
              </div>
              {zones.length > 0 && <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Show in Zones</label><div className="space-y-2 max-h-32 overflow-y-auto">{zones.map(z => <label key={z.id} className="flex items-center gap-2 text-gray-900 dark:text-white"><input type="checkbox" checked={formData.zones.includes(z.id)} onChange={e => setFormData({...formData, zones: e.target.checked ? [...formData.zones, z.id] : formData.zones.filter(id => id !== z.id)})} />{z.name} ({z.format})</label>)}</div></div>}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create Free Ad'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HouseAdsList;

