/**
 * Zones List - Manage ad placement zones
 */
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface Zone {
  id: string;
  name: string;
  description?: string;
  position: string;
  format: string;
  width?: number;
  height?: number;
  isActive: boolean;
  _count?: { placements: number };
}

export const ZonesList: React.FC = () => {
  const { token } = useAuthStore();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchZones();
  }, [token]);

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/admin/ads/zones', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setZones(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleZone = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/ads/zones/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchZones();
    } catch (err) {
      console.error('Failed to toggle zone:', err);
    }
  };

  const copyEmbedCode = (zone: Zone) => {
    const code = `<div data-ad-zone="${zone.name}" data-format="${zone.format}"></div>
<script src="/api/ads/loader.js" async></script>`;
    navigator.clipboard.writeText(code);
    alert('Embed code copied to clipboard!');
  };

  if (loading) {
    return <div className="p-6">Loading zones...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ad Zones</h1>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Create Zone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border border-gray-200 dark:border-slate-700 ${
              zone.isActive ? 'border-l-green-500' : 'border-l-gray-300 dark:border-l-slate-600'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{zone.name}</h3>
              <button
                onClick={() => toggleZone(zone.id, zone.isActive)}
                className={`px-2 py-1 rounded text-xs ${
                  zone.isActive
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-slate-300'
                }`}
              >
                {zone.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>

            {zone.description && (
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">{zone.description}</p>
            )}

            <div className="space-y-1 text-sm text-gray-500 dark:text-slate-400 mb-3">
              <div>📍 Position: {zone.position}</div>
              <div>📐 Format: {zone.format}</div>
              {zone.width && zone.height && (
                <div>📏 Size: {zone.width}x{zone.height}px</div>
              )}
              <div>🔗 Placements: {zone._count?.placements ?? 0}</div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => copyEmbedCode(zone)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Copy Embed Code
              </button>
              <button className="text-sm text-gray-600 dark:text-slate-400 hover:underline">
                Edit
              </button>
            </div>
          </div>
        ))}

        {zones.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-slate-400">
            No zones created yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ZonesList;

