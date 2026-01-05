/**
 * Theme Toggle Component
 * A button to switch between light and dark modes
 */

import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import { useSiteTheme, SiteTheme } from '../contexts/SiteThemeContext';
import { useState, useRef, useEffect } from 'react';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown';
  className?: string;
}

export default function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useSiteTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions: { value: SiteTheme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <FiSun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <FiMoon className="w-4 h-4" /> },
    { value: 'system', label: 'System', icon: <FiMonitor className="w-4 h-4" /> },
  ];

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2.5 rounded-xl transition-all duration-200 ${
          resolvedTheme === 'dark'
            ? 'bg-slate-800/50 border border-slate-700/50 text-yellow-400 hover:bg-slate-700/50 hover:text-yellow-300'
            : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        } ${className}`}
        title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {resolvedTheme === 'dark' ? (
          <FiSun className="w-5 h-5" />
        ) : (
          <FiMoon className="w-5 h-5" />
        )}
      </button>
    );
  }

  // Dropdown variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
          resolvedTheme === 'dark'
            ? 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
            : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        } ${className}`}
        title="Change theme"
        aria-label="Change theme"
      >
        {resolvedTheme === 'dark' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
        <span className="text-sm">Theme</span>
      </button>

      {dropdownOpen && (
        <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-lg border z-50 ${
          resolvedTheme === 'dark'
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="py-1">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  theme === option.value
                    ? resolvedTheme === 'dark'
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                    : resolvedTheme === 'dark'
                      ? 'text-slate-300 hover:bg-slate-700/50'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
                {theme === option.value && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

