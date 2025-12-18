import React, { useEffect, useRef } from 'react';
import { FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { generatePreview, PreviewSettings } from '../../services/previewService';

interface LivePreviewPanelProps {
  settings: PreviewSettings;
  title?: string;
  onClose: () => void;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  settings,
  title = 'Live Preview',
  onClose,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  useEffect(() => {
    updatePreview();
  }, [settings]);

  const updatePreview = () => {
    if (iframeRef.current) {
      const html = generatePreview(settings, title);
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Live Preview - Fullscreen</h2>
          <div className="flex gap-2">
            <button
              onClick={toggleFullscreen}
              className="text-white hover:bg-blue-800 p-2 rounded transition"
            >
              <FiMinimize2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 p-2 rounded transition"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Live Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={toggleFullscreen}
              className="text-white hover:bg-blue-800 p-2 rounded transition"
              title="Fullscreen"
            >
              <FiMaximize2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 p-2 rounded transition"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-same-origin"
          />
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-600">
          <p>
            Preview updates in real-time as you make changes. Click fullscreen to see the preview in a larger view.
          </p>
        </div>
      </div>
    </div>
  );
};

