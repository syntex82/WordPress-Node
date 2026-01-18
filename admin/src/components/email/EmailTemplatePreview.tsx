/**
 * Email Template Preview Component
 * Displays email templates with responsive design
 */

import { FiX, FiDownload, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { sanitizeEmailHtml } from '../../utils/sanitize';

interface EmailTemplatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  subject?: string;
  templateName?: string;
}

export default function EmailTemplatePreview({
  isOpen,
  onClose,
  htmlContent,
  subject,
  templateName,
}: EmailTemplatePreviewProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([htmlContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${templateName || 'email-template'}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Template downloaded');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <FiMail size={24} />
            <div>
              <h2 className="text-xl font-bold">Email Preview</h2>
              {subject && <p className="text-sm text-indigo-100">{subject}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
              title="Download HTML"
            >
              <FiDownload size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-100 to-gray-50 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Device Frame */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-8 border-gray-800">
              {/* Browser Chrome */}
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-400 font-mono">preview.email</p>
                </div>
              </div>

              {/* Email Content */}
              <div className="bg-white p-6 overflow-auto max-h-96">
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(htmlContent) }}
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> This preview shows how your email will look in most email clients. Test with different devices and email providers for best results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

