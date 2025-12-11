/**
 * Dashboard Page
 * Shows overview and statistics
 */

import { useEffect, useState } from 'react';
import { postsApi, pagesApi, usersApi } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    pages: 0,
    users: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [postsRes, pagesRes, usersRes] = await Promise.all([
          postsApi.getAll({ limit: 1 }),
          pagesApi.getAll({ limit: 1 }),
          usersApi.getAll({ limit: 1 }),
        ]);

        setStats({
          posts: postsRes.data.meta.total,
          pages: pagesRes.data.meta.total,
          users: usersRes.data.meta.total,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Posts', value: stats.posts, icon: '📝', color: 'bg-blue-500' },
    { name: 'Total Pages', value: stats.pages, icon: '📄', color: 'bg-green-500' },
    { name: 'Total Users', value: stats.users, icon: '👥', color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} text-white text-4xl p-4 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to WordPress Node!</h2>
        <p className="text-gray-600 mb-4">
          This is your admin dashboard. From here you can manage your content, users, and settings.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Quick Links:</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Create a new post or page</li>
            <li>Upload media files</li>
            <li>Manage users and permissions</li>
            <li>Configure site settings and themes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

