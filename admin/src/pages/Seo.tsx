/**
 * SEO Management Dashboard
 * Manage redirects, sitemap, and schema markup
 */

import { useEffect, useState } from 'react';
import { seoApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiArrowRight, FiPlus, FiTrash2, FiExternalLink, FiMap, FiCode } from 'react-icons/fi';

type TabType = 'redirects' | 'sitemap' | 'schema';

interface Redirect {
  id: string;
  fromPath: string;
  toPath: string;
  type: number;
  isActive: boolean;
  hitCount: number;
  lastHitAt: string | null;
}

interface SitemapEntry {
  id: string;
  url: string;
  priority: number;
  changefreq: string;
  isActive: boolean;
}

interface Schema {
  id: string;
  name: string;
  type: string;
  content: any;
  scope: string;
  isActive: boolean;
}

export default function Seo() {
  const [activeTab, setActiveTab] = useState<TabType>('redirects');
  const [loading, setLoading] = useState(true);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [sitemapEntries, setSitemapEntries] = useState<SitemapEntry[]>([]);
  const [schemas, setSchemas] = useState<Schema[]>([]);

  // Form states
  const [showRedirectForm, setShowRedirectForm] = useState(false);
  const [redirectForm, setRedirectForm] = useState({ fromPath: '', toPath: '', type: 301 });
  const [showSitemapForm, setShowSitemapForm] = useState(false);
  const [sitemapForm, setSitemapForm] = useState({ url: '', priority: 0.5, changefreq: 'weekly' });
  const [showSchemaForm, setShowSchemaForm] = useState(false);
  const [schemaForm, setSchemaForm] = useState({ name: '', type: 'Organization', content: '{}', scope: 'global' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, sRes, scRes] = await Promise.all([
        seoApi.getRedirects(),
        seoApi.getSitemapEntries(),
        seoApi.getSchemas(),
      ]);
      setRedirects(rRes.data);
      setSitemapEntries(sRes.data);
      setSchemas(scRes.data);
    } catch (error) {
      toast.error('Failed to load SEO data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateRedirect = async () => {
    try {
      await seoApi.createRedirect(redirectForm);
      toast.success('Redirect created');
      setShowRedirectForm(false);
      setRedirectForm({ fromPath: '', toPath: '', type: 301 });
      loadData();
    } catch (error) {
      toast.error('Failed to create redirect');
    }
  };

  const handleDeleteRedirect = async (id: string) => {
    if (!confirm('Delete this redirect?')) return;
    try {
      await seoApi.deleteRedirect(id);
      toast.success('Redirect deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete redirect');
    }
  };

  const handleCreateSitemapEntry = async () => {
    try {
      await seoApi.createSitemapEntry(sitemapForm);
      toast.success('Sitemap entry created');
      setShowSitemapForm(false);
      setSitemapForm({ url: '', priority: 0.5, changefreq: 'weekly' });
      loadData();
    } catch (error) {
      toast.error('Failed to create sitemap entry');
    }
  };

  const handleDeleteSitemapEntry = async (id: string) => {
    if (!confirm('Delete this sitemap entry?')) return;
    try {
      await seoApi.deleteSitemapEntry(id);
      toast.success('Entry deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const handleCreateSchema = async () => {
    try {
      let content;
      try { content = JSON.parse(schemaForm.content); }
      catch { toast.error('Invalid JSON'); return; }
      await seoApi.createSchema({ ...schemaForm, content });
      toast.success('Schema created');
      setShowSchemaForm(false);
      setSchemaForm({ name: '', type: 'Organization', content: '{}', scope: 'global' });
      loadData();
    } catch (error) {
      toast.error('Failed to create schema');
    }
  };

  const handleDeleteSchema = async (id: string) => {
    if (!confirm('Delete this schema?')) return;
    try {
      await seoApi.deleteSchema(id);
      toast.success('Schema deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete schema');
    }
  };

  if (loading) return <LoadingSpinner />;

  const tabs = [
    { id: 'redirects' as TabType, label: 'Redirects', icon: FiArrowRight },
    { id: 'sitemap' as TabType, label: 'Sitemap', icon: FiMap },
    { id: 'schema' as TabType, label: 'Schema Markup', icon: FiCode },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">SEO Management</h1>
        <a href="/api/seo/sitemap.xml" target="_blank" className="flex items-center gap-2 text-blue-600 hover:underline">
          <FiExternalLink /> View Sitemap
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 -mb-px ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>
      {/* Redirects Tab */}
      {activeTab === 'redirects' && (
        <div>
          <div className="flex justify-between mb-4">
            <p className="text-gray-600">{redirects.length} redirect(s) configured</p>
            <button onClick={() => setShowRedirectForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <FiPlus /> Add Redirect
            </button>
          </div>
          {showRedirectForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">From Path</label>
                <input type="text" value={redirectForm.fromPath} onChange={e => setRedirectForm({...redirectForm, fromPath: e.target.value})} placeholder="/old-page" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">To Path/URL</label>
                <input type="text" value={redirectForm.toPath} onChange={e => setRedirectForm({...redirectForm, toPath: e.target.value})} placeholder="/new-page" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={redirectForm.type} onChange={e => setRedirectForm({...redirectForm, type: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2">
                  <option value={301}>301 Permanent</option>
                  <option value={302}>302 Temporary</option>
                </select>
              </div>
              <button onClick={handleCreateRedirect} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
              <button onClick={() => setShowRedirectForm(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
            </div>
          )}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hits</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {redirects.map(r => (
                  <tr key={r.id} className={!r.isActive ? 'bg-gray-100 opacity-60' : ''}>
                    <td className="px-6 py-4 font-mono text-sm">{r.fromPath}</td>
                    <td className="px-6 py-4 font-mono text-sm">{r.toPath}</td>
                    <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded text-xs font-medium ${r.type === 301 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.type}</span></td>
                    <td className="px-6 py-4 text-center text-gray-600">{r.hitCount}</td>
                    <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteRedirect(r.id)} className="text-red-600 hover:text-red-800"><FiTrash2 /></button></td>
                  </tr>
                ))}
                {redirects.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No redirects configured</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sitemap Tab */}
      {activeTab === 'sitemap' && (
        <div>
          <div className="flex justify-between mb-4">
            <p className="text-gray-600">{sitemapEntries.length} custom entries (posts, pages, products auto-included)</p>
            <button onClick={() => setShowSitemapForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <FiPlus /> Add Entry
            </button>
          </div>
          {showSitemapForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">URL/Path</label>
                <input type="text" value={sitemapForm.url} onChange={e => setSitemapForm({...sitemapForm, url: e.target.value})} placeholder="/custom-page" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">Priority</label>
                <input type="number" min="0" max="1" step="0.1" value={sitemapForm.priority} onChange={e => setSitemapForm({...sitemapForm, priority: parseFloat(e.target.value)})} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium mb-1">Change Freq</label>
                <select value={sitemapForm.changefreq} onChange={e => setSitemapForm({...sitemapForm, changefreq: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="always">Always</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="never">Never</option>
                </select>
              </div>
              <button onClick={handleCreateSitemapEntry} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
              <button onClick={() => setShowSitemapForm(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
            </div>
          )}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Change Freq</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sitemapEntries.map(e => (
                  <tr key={e.id}>
                    <td className="px-6 py-4 font-mono text-sm">{e.url}</td>
                    <td className="px-6 py-4 text-center">{e.priority}</td>
                    <td className="px-6 py-4 text-center capitalize">{e.changefreq}</td>
                    <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteSitemapEntry(e.id)} className="text-red-600 hover:text-red-800"><FiTrash2 /></button></td>
                  </tr>
                ))}
                {sitemapEntries.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No custom entries</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schema Tab */}
      {activeTab === 'schema' && (
        <div>
          <div className="flex justify-between mb-4">
            <p className="text-gray-600">{schemas.length} schema(s) configured</p>
            <button onClick={() => setShowSchemaForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <FiPlus /> Add Schema
            </button>
          </div>
          {showSchemaForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input type="text" value={schemaForm.name} onChange={e => setSchemaForm({...schemaForm, name: e.target.value})} placeholder="My Organization" className="w-full border rounded px-3 py-2" />
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={schemaForm.type} onChange={e => setSchemaForm({...schemaForm, type: e.target.value})} className="w-full border rounded px-3 py-2">
                    <option value="Organization">Organization</option>
                    <option value="LocalBusiness">Local Business</option>
                    <option value="WebSite">Website</option>
                    <option value="Article">Article</option>
                    <option value="Product">Product</option>
                    <option value="FAQPage">FAQ Page</option>
                    <option value="BreadcrumbList">Breadcrumbs</option>
                  </select>
                </div>
                <div className="w-40">
                  <label className="block text-sm font-medium mb-1">Scope</label>
                  <select value={schemaForm.scope} onChange={e => setSchemaForm({...schemaForm, scope: e.target.value})} className="w-full border rounded px-3 py-2">
                    <option value="global">Global</option>
                    <option value="post">Posts</option>
                    <option value="page">Pages</option>
                    <option value="product">Products</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">JSON-LD Content</label>
                <textarea value={schemaForm.content} onChange={e => setSchemaForm({...schemaForm, content: e.target.value})} rows={6} className="w-full border rounded px-3 py-2 font-mono text-sm" placeholder='{"@context":"https://schema.org","@type":"Organization",...}' />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateSchema} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
                <button onClick={() => setShowSchemaForm(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          )}
          <div className="grid gap-4">
            {schemas.map(s => (
              <div key={s.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{s.type}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs capitalize">{s.scope}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteSchema(s.id)} className="text-red-600 hover:text-red-800"><FiTrash2 /></button>
                </div>
                <pre className="mt-3 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-32">{JSON.stringify(s.content, null, 2)}</pre>
              </div>
            ))}
            {schemas.length === 0 && <p className="text-center py-8 text-gray-500">No schemas configured. Add structured data for better search results!</p>}
          </div>
        </div>
      )}
    </div>
  );
}

