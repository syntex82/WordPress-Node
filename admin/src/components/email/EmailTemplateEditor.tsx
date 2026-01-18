/**
 * Email Template Editor Component
 * Beautiful editor with HTML/visual mode toggle and live preview
 */

import { useState, useMemo } from 'react';
import { FiCode, FiEye, FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { sanitizeEmailHtml } from '../../utils/sanitize';

interface EmailTemplateEditorProps {
  htmlContent: string;
  onChange: (content: string) => void;
  previewHtml?: string;
}

export default function EmailTemplateEditor({
  htmlContent,
  onChange,
  previewHtml,
}: EmailTemplateEditorProps) {
  const [mode, setMode] = useState<'html' | 'preview'>('html');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    toast.success('HTML copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('html')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              mode === 'html'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiCode size={18} />
            HTML Editor
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              mode === 'preview'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiEye size={18} />
            Preview
          </button>
        </div>
        {mode === 'html' && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
          >
            {copied ? <FiCheck size={16} className="text-green-600" /> : <FiCopy size={16} />}
            {copied ? 'Copied!' : 'Copy HTML'}
          </button>
        )}
      </div>

      {/* Editor or Preview */}
      {mode === 'html' ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">HTML Content</label>
          <textarea
            value={htmlContent}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
            placeholder="Enter your HTML email template here..."
            spellCheck="false"
          />
          <p className="text-xs text-gray-500">
            💡 Tip: Use Handlebars syntax like {`{{user.name}}`} for dynamic variables
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Live Preview</label>
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-4 border-b border-gray-200">
              <p className="text-xs text-gray-600 font-medium">📧 Email Preview</p>
            </div>
            <div className="p-4 overflow-auto max-h-96 bg-white">
              {previewHtml ? (
                <div
                  className="max-w-2xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(previewHtml) }}
                />
              ) : (
                <div
                  className="max-w-2xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(htmlContent) }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

