/**
 * Translation Editor Component
 * Allows editing translations for content in different languages
 */

import React, { useState, useEffect } from 'react';
import { FiGlobe, FiSave, FiLoader, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { useI18n, Language } from '../contexts/I18nContext';
import api from '../services/api';

interface TranslationEditorProps {
  contentType: 'post' | 'page' | 'product' | 'course';
  contentId: string;
  originalTitle: string;
  originalSlug: string;
  originalContent?: string;
  onSave?: (languageCode: string, data: any) => void;
}

interface TranslationData {
  title?: string;
  name?: string;
  slug: string;
  content?: string;
  description?: string;
  excerpt?: string;
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
}

export function TranslationEditor({
  contentType,
  contentId,
  originalTitle,
  originalSlug,
  originalContent,
  onSave,
}: TranslationEditorProps) {
  const { languages, currentLanguage } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [translation, setTranslation] = useState<TranslationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get non-default languages for translation
  const translatableLanguages = languages.filter(l => !l.isDefault);

  // Load translation when language is selected
  useEffect(() => {
    if (!selectedLanguage) return;

    const loadTranslation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const endpoint = `/i18n/translations/${contentType}s/${contentId}/${selectedLanguage}`;
        const response = await api.get(endpoint);
        if (response.data) {
          setTranslation(response.data);
        } else {
          // Initialize with empty translation
          setTranslation({
            [contentType === 'product' ? 'name' : 'title']: '',
            slug: '',
            [contentType === 'product' || contentType === 'course' ? 'description' : 'content']: '',
            isPublished: false,
          });
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // No translation exists yet
          setTranslation({
            [contentType === 'product' ? 'name' : 'title']: '',
            slug: '',
            [contentType === 'product' || contentType === 'course' ? 'description' : 'content']: '',
            isPublished: false,
          });
        } else {
          setError('Failed to load translation');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslation();
  }, [selectedLanguage, contentId, contentType]);

  const handleSave = async () => {
    if (!selectedLanguage || !translation) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const endpoint = `/i18n/translations/${contentType}s/${contentId}/${selectedLanguage}`;
      await api.put(endpoint, translation);
      setSuccess(true);
      onSave?.(selectedLanguage, translation);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save translation');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setTranslation(prev => prev ? { ...prev, [field]: value } : null);
  };

  const titleField = contentType === 'product' ? 'name' : 'title';
  const contentField = contentType === 'product' || contentType === 'course' ? 'description' : 'content';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <FiGlobe className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Translations</h3>
      </div>

      {translatableLanguages.length === 0 ? (
        <p className="text-gray-500 text-sm">No additional languages configured. Add languages in Settings.</p>
      ) : (
        <>
          {/* Language selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Choose a language...</option>
              {translatableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flagEmoji} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {selectedLanguage && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : translation ? (
                <div className="space-y-4">
                  {/* Original reference */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original ({titleField}):</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{originalTitle}</p>
                  </div>

                  {/* Title/Name field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {titleField === 'name' ? 'Name' : 'Title'}
                    </label>
                    <input
                      type="text"
                      value={(translation as any)[titleField] || ''}
                      onChange={(e) => updateField(titleField, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={`Translated ${titleField}...`}
                    />
                  </div>

                  {/* Slug field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={translation.slug || ''}
                      onChange={(e) => updateField('slug', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="translated-slug"
                    />
                  </div>

                  {/* Content/Description field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {contentField === 'description' ? 'Description' : 'Content'}
                    </label>
                    <textarea
                      value={(translation as any)[contentField] || ''}
                      onChange={(e) => updateField(contentField, e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={`Translated ${contentField}...`}
                    />
                  </div>

                  {/* Published toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={translation.isPublished}
                      onChange={(e) => updateField('isPublished', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="isPublished" className="text-sm text-gray-700 dark:text-gray-300">
                      Publish this translation
                    </label>
                  </div>

                  {/* Error/Success messages */}
                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <FiAlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <FiCheck className="w-4 h-4" />
                      Translation saved successfully!
                    </div>
                  )}

                  {/* Save button */}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
                    Save Translation
                  </button>
                </div>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default TranslationEditor;

