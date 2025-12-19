/**
 * Recommendations Admin Dashboard
 * Manage recommendation rules, settings, and view analytics
 * Styled to match the dashboard design with tooltips and beautiful UI
 */

import { useEffect, useState } from 'react';
import { recommendationsApi, RecommendationRule, RecommendationSettings, RecommendationAnalytics } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Tooltip from '../components/Tooltip';
import toast from 'react-hot-toast';
import {
  FiSettings, FiTrendingUp, FiList, FiTrash2, FiEdit2, FiPlus, FiRefreshCw,
  FiZap, FiBarChart2, FiToggleLeft, FiToggleRight, FiHelpCircle, FiTarget,
  FiActivity, FiPercent, FiAward, FiCpu, FiDatabase, FiClock, FiLayers
} from 'react-icons/fi';

// Tooltip content for recommendations page
const RECOMMENDATIONS_TOOLTIPS = {
  pageHelp: { title: 'About Recommendations', content: 'Configure how content is recommended to your visitors. Set up rules, algorithms, and personalization to increase engagement.' },
  addRule: { title: 'Create Rule', content: 'Add a new recommendation rule to control which content gets suggested based on algorithms and conditions.' },
  clearCache: { title: 'Clear Cache', content: 'Remove cached recommendations to force fresh calculations. Useful after making major content changes.' },
  refresh: { title: 'Refresh Data', content: 'Reload all recommendation data from the server.' },
  rulesTab: { title: 'Recommendation Rules', content: 'Define rules that control which content is recommended where. Each rule specifies a source, target, and algorithm.' },
  settingsTab: { title: 'Settings', content: 'Configure global recommendation settings like personalization, caching, and performance options.' },
  analyticsTab: { title: 'Analytics', content: 'Track recommendation performance with clicks, impressions, and conversion metrics.' },
  editRule: { title: 'Edit Rule', content: 'Modify this recommendation rule\'s settings, algorithm, or conditions.' },
  deleteRule: { title: 'Delete Rule', content: 'Remove this rule permanently. This cannot be undone.' },
  toggleSetting: { title: 'Toggle Setting', content: 'Enable or disable this feature. Changes take effect immediately.' },
};

type TabType = 'rules' | 'settings' | 'analytics';

export default function Recommendations() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('rules');
  const [rules, setRules] = useState<RecommendationRule[]>([]);
  const [settings, setSettings] = useState<RecommendationSettings | null>(null);
  const [analytics, setAnalytics] = useState<RecommendationAnalytics | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<RecommendationRule | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, settingsRes, analyticsRes] = await Promise.all([
        recommendationsApi.getRules(),
        recommendationsApi.getSettings(),
        recommendationsApi.getAnalytics(),
      ]);
      const rulesData = rulesRes.data as any;
      setRules(Array.isArray(rulesData) ? rulesData : (rulesData?.rules || []));
      setSettings(settingsRes.data || null);
      const analyticsData = analyticsRes.data as any;
      setAnalytics(analyticsData ? {
        totalClicks: analyticsData.totalClicks || 0,
        totalImpressions: analyticsData.totalInteractions || 0,
        clickThroughRate: analyticsData.totalInteractions > 0
          ? analyticsData.totalClicks / analyticsData.totalInteractions
          : 0,
        topPerforming: [],
        byAlgorithm: [],
        dailyStats: [],
      } : null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load recommendations data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await recommendationsApi.deleteRule(id);
      toast.success('Rule deleted');
      setRules(rules.filter(r => r.id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete rule');
    }
  };

  const handleClearCache = async () => {
    try {
      await recommendationsApi.clearCache();
      toast.success('Cache cleared successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clear cache');
    }
  };

  const handleToggleSetting = async (key: keyof RecommendationSettings) => {
    if (!settings) return;
    try {
      const newValue = !settings[key];
      await recommendationsApi.updateSettings({ [key]: newValue });
      setSettings({ ...settings, [key]: newValue } as RecommendationSettings);
      toast.success(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update setting');
    }
  };

  const handleUpdatePerformance = async (data: Partial<RecommendationSettings>) => {
    if (!settings) return;
    try {
      await recommendationsApi.updateSettings(data);
      setSettings({ ...settings, ...data } as RecommendationSettings);
      toast.success('Performance settings saved');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    }
  };

  if (loading) return <LoadingSpinner />;

  const tabs = [
    { id: 'rules' as const, label: 'Rules', icon: FiList, tooltip: RECOMMENDATIONS_TOOLTIPS.rulesTab },
    { id: 'settings' as const, label: 'Settings', icon: FiSettings, tooltip: RECOMMENDATIONS_TOOLTIPS.settingsTab },
    { id: 'analytics' as const, label: 'Analytics', icon: FiBarChart2, tooltip: RECOMMENDATIONS_TOOLTIPS.analyticsTab },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/20">
            <FiTarget className="text-white" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Recommendations
              </h1>
              <Tooltip title={RECOMMENDATIONS_TOOLTIPS.pageHelp.title} content={RECOMMENDATIONS_TOOLTIPS.pageHelp.content} position="right" variant="help">
                <button className="p-1 text-slate-400 hover:text-blue-400 transition-colors">
                  <FiHelpCircle size={18} />
                </button>
              </Tooltip>
            </div>
            <p className="text-slate-400 mt-0.5">Configure smart content recommendations for your visitors</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Tooltip title={RECOMMENDATIONS_TOOLTIPS.refresh.title} content={RECOMMENDATIONS_TOOLTIPS.refresh.content} position="bottom">
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              <FiRefreshCw size={18} />
            </button>
          </Tooltip>
          <Tooltip title={RECOMMENDATIONS_TOOLTIPS.clearCache.title} content={RECOMMENDATIONS_TOOLTIPS.clearCache.content} position="bottom">
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              <FiDatabase size={16} />
              Clear Cache
            </button>
          </Tooltip>
          <Tooltip title={RECOMMENDATIONS_TOOLTIPS.addRule.title} content={RECOMMENDATIONS_TOOLTIPS.addRule.content} position="left">
            <button
              onClick={() => { setEditingRule(null); setShowRuleModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-500 hover:to-pink-400 shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
            >
              <FiPlus size={18} />
              Add Rule
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-1.5">
        <nav className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Tooltip key={tab.id} title={tab.tooltip.title} content={tab.tooltip.content} position="bottom">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-purple-400' : ''} />
                  {tab.label}
                </button>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'rules' && (
        <RulesTab rules={rules} onEdit={(r) => { setEditingRule(r); setShowRuleModal(true); }} onDelete={handleDeleteRule} />
      )}
      {activeTab === 'settings' && settings && (
        <SettingsTab settings={settings} onToggle={handleToggleSetting} onUpdatePerformance={handleUpdatePerformance} />
      )}
      {activeTab === 'analytics' && analytics && (
        <AnalyticsTab analytics={analytics} />
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <RuleModal
          rule={editingRule}
          onClose={() => setShowRuleModal(false)}
          onSave={async (data) => {
            try {
              if (editingRule) {
                await recommendationsApi.updateRule(editingRule.id, data);
                toast.success('Rule updated');
              } else {
                await recommendationsApi.createRule(data);
                toast.success('Rule created');
              }
              setShowRuleModal(false);
              fetchData();
            } catch (error: any) {
              toast.error(error.response?.data?.message || 'Failed to save rule');
            }
          }}
        />
      )}
    </div>
  );
}

// Rules Tab Component
function RulesTab({ rules, onEdit, onDelete }: { rules: RecommendationRule[]; onEdit: (r: RecommendationRule) => void; onDelete: (id: string) => void }) {
  const algorithmConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    related: { label: 'Related', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <FiLayers size={14} /> },
    trending: { label: 'Trending', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <FiTrendingUp size={14} /> },
    popular: { label: 'Popular', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: <FiAward size={14} /> },
    personalized: { label: 'Personal', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <FiTarget size={14} /> },
    manual: { label: 'Manual', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: <FiEdit2 size={14} /> },
    recent: { label: 'Recent', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: <FiClock size={14} /> },
  };

  if (rules.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-12 text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FiList className="text-purple-400" size={32} />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Rules Configured</h3>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Create your first recommendation rule to start showing smart content suggestions to your visitors.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <FiHelpCircle size={14} />
          <span>Click "Add Rule" above to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rule</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Flow</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Algorithm</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {rules.map(rule => {
            const algo = algorithmConfig[rule.algorithm] || algorithmConfig.related;
            return (
              <tr key={rule.id} className="hover:bg-slate-700/30 transition-colors group">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{rule.name}</p>
                    {rule.description && (
                      <p className="text-sm text-slate-500 mt-0.5">{rule.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-slate-700/50 rounded text-slate-300 capitalize">{rule.sourceType}</span>
                    <span className="text-slate-500">→</span>
                    <span className="px-2 py-1 bg-slate-700/50 rounded text-slate-300 capitalize">{rule.targetType}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${algo.color}`}>
                    {algo.icon}
                    {algo.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-700/50 rounded-lg text-white font-medium">
                    {rule.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    rule.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip content="Edit rule" position="top">
                      <button
                        onClick={() => onEdit(rule)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      >
                        <FiEdit2 size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete rule" position="top">
                      <button
                        onClick={() => onDelete(rule.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Rule Modal Component
function RuleModal({ rule, onClose, onSave }: { rule: RecommendationRule | null; onClose: () => void; onSave: (data: Partial<RecommendationRule>) => void }) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    sourceType: rule?.sourceType || 'post',
    targetType: rule?.targetType || 'post',
    algorithm: rule?.algorithm || 'related',
    priority: rule?.priority || 0,
    isActive: rule?.isActive ?? true,
    settings: rule?.settings || {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputClass = "w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all";
  const labelClass = "block text-sm font-medium text-slate-300 mb-2";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              {rule ? <FiEdit2 className="text-purple-400" size={20} /> : <FiPlus className="text-purple-400" size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{rule ? 'Edit Rule' : 'Create New Rule'}</h2>
              <p className="text-sm text-slate-400">{rule ? 'Modify recommendation rule settings' : 'Define how content is recommended'}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className={labelClass}>Rule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              placeholder="e.g., Related Posts on Blog"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Description (Optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={inputClass}
              placeholder="Brief description of this rule's purpose"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Source Type</label>
              <select
                value={formData.sourceType}
                onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                className={inputClass}
              >
                <option value="post">Posts</option>
                <option value="page">Pages</option>
                <option value="product">Products</option>
                <option value="course">Courses</option>
                <option value="category">Category</option>
                <option value="global">Global (All)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Target Type</label>
              <select
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                className={inputClass}
              >
                <option value="post">Posts</option>
                <option value="page">Pages</option>
                <option value="product">Products</option>
                <option value="course">Courses</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Algorithm</label>
            <select
              value={formData.algorithm}
              onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
              className={inputClass}
            >
              <option value="related">🔗 Related Content</option>
              <option value="trending">📈 Trending</option>
              <option value="popular">⭐ Most Popular</option>
              <option value="personalized">🎯 Personalized</option>
              <option value="recent">🕐 Most Recent</option>
              <option value="manual">✏️ Manual Selection</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Priority (0-100)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="w-12 text-center text-white font-medium bg-slate-700/50 rounded-lg py-1">{formData.priority}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Higher priority rules are evaluated first</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className="text-2xl"
            >
              {formData.isActive
                ? <FiToggleRight className="text-emerald-400" size={28} />
                : <FiToggleLeft className="text-slate-500" size={28} />
              }
            </button>
            <div>
              <p className="font-medium text-white">{formData.isActive ? 'Active' : 'Inactive'}</p>
              <p className="text-xs text-slate-400">Rule will {formData.isActive ? '' : 'not '}be applied to recommendations</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-500 hover:to-pink-400 shadow-lg shadow-purple-500/20 transition-all"
            >
              {rule ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab({
  settings,
  onToggle,
  onUpdatePerformance
}: {
  settings: RecommendationSettings;
  onToggle: (key: keyof RecommendationSettings) => void;
  onUpdatePerformance: (data: Partial<RecommendationSettings>) => Promise<void>;
}) {
  const [localSettings, setLocalSettings] = useState({
    cacheDuration: settings.cacheDuration || 60,
    maxRecommendations: settings.maxRecommendations || 10,
    minScore: settings.minScore || 0.1,
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleSettings = [
    { key: 'enablePersonalization' as const, label: 'Personalization', desc: 'Show personalized recommendations based on user browsing history', icon: <FiTarget className="text-purple-400" size={20} />, color: 'purple' },
    { key: 'enableTrending' as const, label: 'Trending Content', desc: 'Show trending content based on recent user interactions', icon: <FiTrendingUp className="text-orange-400" size={20} />, color: 'orange' },
    { key: 'enableRelated' as const, label: 'Related Content', desc: 'Show related posts/products on content pages', icon: <FiLayers className="text-blue-400" size={20} />, color: 'blue' },
    { key: 'cacheEnabled' as const, label: 'Caching', desc: 'Cache recommendations for faster load times', icon: <FiDatabase className="text-cyan-400" size={20} />, color: 'cyan' },
  ];

  const inputClass = "w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 transition-all";

  const handleLocalChange = (key: string, value: number) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSavePerformance = async () => {
    setSaving(true);
    try {
      await onUpdatePerformance(localSettings);
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Feature Toggles */}
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <FiToggleRight className="text-emerald-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Feature Toggles</h3>
            <p className="text-sm text-slate-400">Click to enable or disable features</p>
          </div>
        </div>
        <div className="space-y-3">
          {toggleSettings.map(({ key, label, desc, icon }) => (
            <Tooltip key={key} content={`Click to ${settings[key] ? 'disable' : 'enable'} ${label.toLowerCase()}`} position="right">
              <div
                className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer hover:bg-slate-700/30 ${
                  settings[key]
                    ? 'bg-slate-700/20 border-slate-600/50'
                    : 'bg-slate-800/30 border-slate-700/30'
                }`}
                onClick={() => onToggle(key)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-700/50 rounded-lg">{icon}</div>
                  <div>
                    <p className="font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
                <button className="text-2xl transition-transform hover:scale-110">
                  {settings[key]
                    ? <FiToggleRight className="text-emerald-400" size={28} />
                    : <FiToggleLeft className="text-slate-500" size={28} />
                  }
                </button>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Performance Settings */}
      <div className="space-y-6">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <FiCpu className="text-amber-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Performance</h3>
                <p className="text-sm text-slate-400">Cache and display settings</p>
              </div>
            </div>
            {hasChanges && (
              <button
                onClick={handleSavePerformance}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-pink-400 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
          <div className="space-y-4">
            <Tooltip content="How long recommendations are cached before refreshing (1-1440 minutes)" position="top">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cache Duration</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={localSettings.cacheDuration}
                    onChange={(e) => handleLocalChange('cacheDuration', parseInt(e.target.value) || 60)}
                    className={inputClass}
                  />
                  <span className="text-slate-500 text-sm whitespace-nowrap">minutes</span>
                </div>
              </div>
            </Tooltip>
            <Tooltip content="Maximum number of items to show in recommendation widgets (1-50)" position="top">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Recommendations</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={localSettings.maxRecommendations}
                    onChange={(e) => handleLocalChange('maxRecommendations', parseInt(e.target.value) || 10)}
                    className={inputClass}
                  />
                  <span className="text-slate-500 text-sm whitespace-nowrap">items</span>
                </div>
              </div>
            </Tooltip>
            <Tooltip content="Minimum relevance score required for content to be recommended (0.0-1.0)" position="top">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Score</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localSettings.minScore}
                    onChange={(e) => handleLocalChange('minScore', parseFloat(e.target.value) || 0.1)}
                    className={inputClass}
                  />
                  <span className="text-slate-500 text-sm whitespace-nowrap">0.0 - 1.0</span>
                </div>
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Pro Tip Card */}
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur rounded-2xl border border-purple-500/30 p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FiZap className="text-purple-400" size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Pro Tip</h4>
              <p className="text-sm text-slate-300">
                Enable personalization to boost engagement by up to 35%. Recommendations become more accurate as users interact with your content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ analytics }: { analytics: RecommendationAnalytics }) {
  const statCards = [
    { label: 'Total Clicks', value: analytics.totalClicks.toLocaleString(), icon: <FiZap size={24} />, color: 'from-blue-500 to-cyan-400', bgGlow: 'shadow-blue-500/20', tooltip: 'Total number of times users clicked on recommendations' },
    { label: 'Impressions', value: analytics.totalImpressions.toLocaleString(), icon: <FiActivity size={24} />, color: 'from-emerald-500 to-green-400', bgGlow: 'shadow-emerald-500/20', tooltip: 'Total number of recommendation views' },
    { label: 'Click-Through Rate', value: `${(analytics.clickThroughRate * 100).toFixed(2)}%`, icon: <FiPercent size={24} />, color: 'from-purple-500 to-pink-400', bgGlow: 'shadow-purple-500/20', tooltip: 'Percentage of impressions that resulted in clicks' },
    { label: 'Top Performers', value: analytics.topPerforming.length.toString(), icon: <FiAward size={24} />, color: 'from-orange-500 to-amber-400', bgGlow: 'shadow-orange-500/20', tooltip: 'Number of high-performing recommendation items' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Tooltip key={idx} content={stat.tooltip} position="bottom">
            <div className={`bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-5 hover:border-slate-600/50 transition-all hover:-translate-y-1 shadow-xl ${stat.bgGlow}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.color} text-white p-3.5 rounded-2xl shadow-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FiBarChart2 className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Performance Overview</h3>
                <p className="text-sm text-slate-400">Clicks vs Impressions trend</p>
              </div>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center border border-dashed border-slate-700/50 rounded-xl">
            <div className="text-center">
              <FiTrendingUp className="text-slate-600 mx-auto mb-2" size={32} />
              <p className="text-slate-500">Analytics chart coming soon</p>
              <p className="text-xs text-slate-600">Collect more data to see trends</p>
            </div>
          </div>
        </div>

        {/* Algorithm Performance */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FiCpu className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Algorithm Performance</h3>
              <p className="text-sm text-slate-400">CTR by recommendation type</p>
            </div>
          </div>
          {analytics.byAlgorithm.length === 0 ? (
            <div className="h-48 flex items-center justify-center border border-dashed border-slate-700/50 rounded-xl">
              <div className="text-center">
                <FiLayers className="text-slate-600 mx-auto mb-2" size={32} />
                <p className="text-slate-500">No algorithm data yet</p>
                <p className="text-xs text-slate-600">Performance by algorithm will appear here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.byAlgorithm.map((algo, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-400 capitalize">{algo.algorithm}</span>
                  <div className="flex-1 h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${Math.min(algo.ctr * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm text-white font-medium">{(algo.ctr * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Table */}
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <FiAward className="text-amber-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Top Performing Content</h3>
              <p className="text-sm text-slate-400">Recommendations with highest engagement</p>
            </div>
          </div>
        </div>
        {analytics.topPerforming.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiBarChart2 className="text-slate-500" size={32} />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">No Data Yet</h4>
            <p className="text-slate-400 max-w-md mx-auto">
              Performance data will appear here once users start interacting with your recommendations.
            </p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Content</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Clicks</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Impressions</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {analytics.topPerforming.slice(0, 10).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-700/50 rounded-lg flex items-center justify-center text-xs text-slate-400">{idx + 1}</span>
                      <span className="font-mono text-sm text-white">{item.contentId.slice(0, 12)}...</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 capitalize">{item.contentType}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">{item.clicks.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-slate-300">{item.impressions.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-medium ${item.ctr >= 0.05 ? 'text-emerald-400' : item.ctr >= 0.02 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {(item.ctr * 100).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

