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
        <Link to=".." relative="path" className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <FiArrowLeft className="mr-2" size={18} />
          Back to Security Center
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">File Integrity Monitor</h1>
            <p className="text-gray-600 mt-1">Detect unauthorized modifications to core files</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateBaseline}
              disabled={generatingBaseline}
              className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              <FiDatabase className={`mr-2 ${generatingBaseline ? 'animate-spin' : ''}`} size={18} />
              {generatingBaseline ? 'Generating...' : 'Generate Baseline'}
            </button>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 ${scanning ? 'animate-spin' : ''}`} size={18} />
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <FiFileText className="text-blue-600 mr-3 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900">How it works</h3>
            <p className="text-sm text-blue-700 mt-1">
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
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Files</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{scanResults.new.length}</p>
                </div>
                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                  <FiFileText size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Modified Files</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">{scanResults.modified.length}</p>
                </div>
                <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
                  <FiAlertTriangle size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Deleted Files</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">{scanResults.deleted.length}</p>
                </div>
                <div className="bg-red-100 text-red-600 p-3 rounded-lg">
                  <FiAlertTriangle size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Last scanned: {new Date(scanResults.scannedAt).toLocaleString()}
          </div>

          {/* New Files */}
          {scanResults.new.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 bg-blue-50">
                <h2 className="text-xl font-bold text-blue-900 flex items-center">
                  <FiFileText className="mr-2" size={20} />
                  New Files ({scanResults.new.length})
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {scanResults.new.map((file: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-gray-700 font-mono">
                      <FiCheckCircle className="text-blue-600 mr-2" size={16} />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Modified Files */}
          {scanResults.modified.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 bg-orange-50">
                <h2 className="text-xl font-bold text-orange-900 flex items-center">
                  <FiAlertTriangle className="mr-2" size={20} />
                  Modified Files ({scanResults.modified.length})
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {scanResults.modified.map((file: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-gray-700 font-mono">
                      <FiAlertTriangle className="text-orange-600 mr-2" size={16} />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Deleted Files */}
          {scanResults.deleted.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 bg-red-50">
                <h2 className="text-xl font-bold text-red-900 flex items-center">
                  <FiAlertTriangle className="mr-2" size={20} />
                  Deleted Files ({scanResults.deleted.length})
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {scanResults.deleted.map((file: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-gray-700 font-mono">
                      <FiAlertTriangle className="text-red-600 mr-2" size={16} />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* All Clear */}
          {scanResults.new.length === 0 && scanResults.modified.length === 0 && scanResults.deleted.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <FiCheckCircle className="text-green-600 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-green-900 mb-2">All Clear!</h3>
              <p className="text-green-700">No file changes detected. Your core files are intact.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


