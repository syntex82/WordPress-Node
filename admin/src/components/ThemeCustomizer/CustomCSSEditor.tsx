/**
 * Custom CSS Editor Component
 * Visual CSS editor with syntax highlighting
 */

import { useState, useRef } from 'react';
import { FiCode, FiMaximize2, FiMinimize2, FiCopy, FiCheck } from 'react-icons/fi';

interface CustomCSSEditorProps {
  value: string;
  onChange: (css: string) => void;
}

// Escape HTML entities to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Simple syntax highlighting for CSS (with XSS protection)
function highlightCSS(code: string): string {
  // First escape all HTML entities to prevent XSS
  const escaped = escapeHtml(code);
  return escaped
    // Comments
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-500">$1</span>')
    // Selectors
    .replace(/([.#]?[\w-]+)(\s*{)/g, '<span class="text-cyan-400">$1</span>$2')
    // Properties
    .replace(/([\w-]+)(\s*:)/g, '<span class="text-purple-400">$1</span>$2')
    // Values with units
    .replace(/:\s*([^;{}]+)(;|$)/g, ': <span class="text-green-400">$1</span>$2')
    // Curly braces
    .replace(/([{}])/g, '<span class="text-yellow-400">$1</span>');
}

export default function CustomCSSEditor({ value, onChange }: CustomCSSEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and highlight
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <FiCode size={16} />
          Custom CSS
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
            title="Copy CSS"
          >
            {copied ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
          </button>
        </div>
      </div>

      <div className={`relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden transition-all ${isExpanded ? 'h-96' : 'h-48'}`}>
        {/* Syntax highlighted background */}
        <div
          ref={highlightRef}
          className="absolute inset-0 p-3 font-mono text-sm leading-relaxed overflow-auto pointer-events-none whitespace-pre-wrap break-words"
          style={{ color: 'transparent' }}
          dangerouslySetInnerHTML={{ __html: highlightCSS(value || '') + '\n' }}
        />
        
        {/* Actual textarea */}
        <textarea
          ref={textareaRef}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full p-3 font-mono text-sm leading-relaxed bg-transparent text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="/* Add your custom CSS here */&#10;&#10;.custom-class {&#10;  color: #3B82F6;&#10;}"
          spellCheck={false}
        />
      </div>

      <p className="text-xs text-gray-500">
        Add custom styles to override theme defaults. Changes apply in real-time.
      </p>

      {/* Quick CSS Templates */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Quick Templates:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Hide Header', css: '.site-header { display: none; }' },
            { label: 'Round Images', css: 'img { border-radius: 50%; }' },
            { label: 'Bold Links', css: 'a { font-weight: 700; }' },
          ].map((template) => (
            <button
              key={template.label}
              onClick={() => onChange(value ? value + '\n\n' + template.css : template.css)}
              className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              + {template.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

