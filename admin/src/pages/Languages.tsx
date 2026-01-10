/**
 * Languages Management Page
 * Admin interface for managing available languages
 */

import React, { useState, useEffect } from 'react';
import { FiGlobe, FiPlus, FiEdit2, FiTrash2, FiStar, FiCheck, FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';
import { useI18n, Language } from '../contexts/I18nContext';

interface LanguageFormData {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
  flagEmoji: string;
  locale: string;
}

const defaultFormData: LanguageFormData = {
  code: '',
  name: '',
  nativeName: '',
  isRTL: false,
  flagEmoji: '',
  locale: '',
};

export default function Languages() {
  const { refreshTranslations } = useI18n();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LanguageFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);

  const loadLanguages = async () => {
    try {
      const response = await api.get('/i18n/languages?includeInactive=true');
      setLanguages(response.data);
    } catch (err: any) {
      setError('Failed to load languages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (editingId) {
        await api.put(`/i18n/languages/${editingId}`, formData);
      } else {
        await api.post('/i18n/languages', formData);
      }
      await loadLanguages();
      await refreshTranslations();
      setShowForm(false);
      setEditingId(null);
      setFormData(defaultFormData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save language');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (lang: Language) => {
    setFormData({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      isRTL: lang.isRTL,
      flagEmoji: lang.flagEmoji || '',
      locale: lang.locale || '',
    });
    setEditingId(lang.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this language? All translations will be lost.')) return;
    
    try {
      await api.delete(`/i18n/languages/${id}`);
      await loadLanguages();
      await refreshTranslations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete language');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/i18n/languages/${id}`, { isDefault: true });
      await loadLanguages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set default language');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/i18n/languages/${id}`, { isActive: !isActive });
      await loadLanguages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update language');
    }
  };

  const handleSeedLanguages = async () => {
    try {
      await api.post('/i18n/seed');
      await loadLanguages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to seed languages');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiGlobe className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Languages</h1>
        </div>
        <div className="flex gap-2">
          {languages.length === 0 && (
            <button
              onClick={handleSeedLanguages}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Seed Default Languages
            </button>
          )}
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData(defaultFormData); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiPlus className="w-4 h-4" />
            Add Language
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2 text-red-700 dark:text-red-400">
          <FiAlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Language Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {editingId ? 'Edit Language' : 'Add Language'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Code (ISO 639-1)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                    placeholder="en"
                    maxLength={5}
                    disabled={!!editingId}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Flag Emoji
                  </label>
                  <input
                    type="text"
                    value={formData.flagEmoji}
                    onChange={(e) => setFormData({ ...formData, flagEmoji: e.target.value })}
                    placeholder="🇬🇧"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name (English)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="English"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Native Name
                </label>
                <input
                  type="text"
                  value={formData.nativeName}
                  onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
                  placeholder="English"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Locale
                </label>
                <input
                  type="text"
                  value={formData.locale}
                  onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                  placeholder="en-GB"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRTL"
                  checked={formData.isRTL}
                  onChange={(e) => setFormData({ ...formData, isRTL: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isRTL" className="text-sm text-gray-700 dark:text-gray-300">
                  Right-to-Left (RTL) language
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving && <FiLoader className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Languages List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Language</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Code</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Default</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {languages.map((lang) => (
              <tr key={lang.id} className={!lang.isActive ? 'opacity-50' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {lang.flagEmoji && <span className="text-xl">{lang.flagEmoji}</span>}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{lang.nativeName}</div>
                      <div className="text-sm text-gray-500">{lang.name}</div>
                    </div>
                    {lang.isRTL && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded">
                        RTL
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono">{lang.code}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleActive(lang.id, lang.isActive)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      lang.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {lang.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  {lang.isDefault ? (
                    <FiStar className="w-5 h-5 text-yellow-500 mx-auto fill-current" />
                  ) : (
                    <button
                      onClick={() => handleSetDefault(lang.id)}
                      className="text-gray-400 hover:text-yellow-500"
                      title="Set as default"
                    >
                      <FiStar className="w-5 h-5 mx-auto" />
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(lang)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    {!lang.isDefault && (
                      <button
                        onClick={() => handleDelete(lang.id)}
                        className="p-1 text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {languages.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No languages configured. Click "Seed Default Languages" to add common languages.
          </div>
        )}
      </div>
    </div>
  );
}

