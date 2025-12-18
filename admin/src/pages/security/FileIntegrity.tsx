/**
 * File Integrity Scanner Page
 * Detect unauthorized file modifications
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiFileText, FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiDatabase } from 'react-icons/fi';

export default function FileIntegrity() {
  const [scanning, setScanning] = useState(false);
  const [generatingBaseline, setGeneratingBaseline] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);

  const handleGenerateBaseline = async () => {
    if (!confirm('This will create a new baseline of all core files. Continue?')) return;
    
    setGeneratingBaseline(true);
    try {
      await securityApi.generateBaseline();
      toast.success('Baseline generated successfully');
    } catch (error) {
      toast.error('Failed to generate baseline');
    } finally {
      setGeneratingBaseline(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const response = await securityApi.scanIntegrity();
      setScanResults(response.data);
      
      const totalChanges = response.data.new.length + response.data.modified.length + response.data.deleted.length;
      if (totalChanges === 0) {
        toast.success('No file changes detected');
      } else {
        toast(`Found ${totalChanges} file changes`, { icon: '⚠️' });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('No baseline found. Please generate a baseline first.');
      } else {
        toast.error('Failed to scan files');
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link to=".." relative="path" className="flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <FiArrowLeft className="mr-2" size={18} />
          Back to Security Center
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">File Integrity Monitor</h1>
            <p className="text-slate-400 mt-1">Detect unauthorized modifications to core files</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateBaseline}
              disabled={generatingBaseline}
              className="flex items-center bg-slate-700 text-white px-4 py-2 rounded-xl hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              <FiDatabase className={`mr-2 ${generatingBaseline ? 'animate-spin' : ''}`} size={18} />
              {generatingBaseline ? 'Generating...' : 'Generate Baseline'}
            </button>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
            >
              <FiRefreshCw className={`mr-2 ${scanning ? 'animate-spin' : ''}`} size={18} />
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-start">
          <FiFileText className="text-blue-400 mr-3 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-blue-300">How it works</h3>
            <p className="text-sm text-blue-400/80 mt-1">
              The file integrity monitor creates a baseline snapshot of your core files (src, prisma/schema.prisma).
              When you run a scan, it compares the current state against the baseline to detect any modifications,
              new files, or deletions. This helps identify unauthorized changes or potential security breaches.
            </p>
          </div>
        </div>
      </div>

      {/* Scan Results */}
      {scanResults && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">New Files</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{scanResults.new.length}</p>
                </div>
                <div className="bg-blue-500/20 text-blue-400 p-3 rounded-xl">
                  <FiFileText size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Modified Files</p>
                  <p className="text-3xl font-bold text-orange-400 mt-2">{scanResults.modified.length}</p>
                </div>
                <div className="bg-orange-500/20 text-orange-400 p-3 rounded-xl">
                  <FiAlertTriangle size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Deleted Files</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{scanResults.deleted.length}</p>
                </div>
                <div className="bg-red-500/20 text-red-400 p-3 rounded-xl">
                  <FiAlertTriangle size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-500">
            Last scanned: {new Date(scanResults.scannedAt).toLocaleString()}
          </div>

          {/* New Files */}
          {scanResults.new.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 bg-blue-500/10">
                <h2 className="text-xl font-bold text-blue-400 flex items-center">
                  <FiFileText className="mr-2" size={20} />
                  New Files ({scanResults.new.length})
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {scanResults.new.map((file: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-slate-300 font-mono">
                      <FiCheckCircle className="text-blue-400 mr-2" size={16} />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Modified Files */}
          {scanResults.modified.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 bg-orange-500/10">
                <h2 className="text-xl font-bold text-orange-400 flex items-center">
                  <FiAlertTriangle className="mr-2" size={20} />
                  Modified Files ({scanResults.modified.length})
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {scanResults.modified.map((file: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-slate-300 font-mono">
                      <FiAlertTriangle className="text-orange-400 mr-2" size={16} />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Deleted Files */}
          {scanResults.deleted.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 bg-red-500/10">
                <h2 className="text-xl font-bold text-red-400 flex items-center">
                  <FiAlertTriangle className="mr-2" size={20} />
                  Deleted Files ({scanResults.deleted.length})
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {scanResults.deleted.map((file: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-slate-300 font-mono">
                      <FiAlertTriangle className="text-red-400 mr-2" size={16} />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* All Clear */}
          {scanResults.new.length === 0 && scanResults.modified.length === 0 && scanResults.deleted.length === 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 text-center">
              <FiCheckCircle className="text-green-400 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-green-400 mb-2">All Clear!</h3>
              <p className="text-green-400/80">No file changes detected. Your core files are intact.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


