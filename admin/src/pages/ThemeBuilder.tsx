/**
 * Theme Builder Page - Upload and install custom themes
 */
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { themesApi } from '../services/api';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiCheck, FiX, FiAlertTriangle, FiInfo, FiFile, FiFolder, FiArrowLeft, FiPackage } from 'react-icons/fi';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  themeConfig?: { name: string; version: string; author: string; description?: string };
  themeSlug?: string;
  hasScreenshot?: boolean;
}

export default function ThemeBuilder() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleFile = async (file: File) => {
    setValidation(null);
    setUploadProgress(0);
    if (!file.name.endsWith('.zip')) { toast.error('Please select a ZIP file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File size exceeds 10MB limit'); return; }
    setSelectedFile(file);
    setValidating(true);
    try {
      const response = await themesApi.validate(file);
      setValidation(response.data);
    } catch (error: any) {
      const errorData = error.response?.data;
      setValidation(errorData?.errors ? { valid: false, errors: errorData.errors, warnings: errorData.warnings || [] } : null);
      if (!errorData?.errors) toast.error('Failed to validate theme');
    } finally { setValidating(false); }
  };

  const handleUpload = async () => {
    if (!selectedFile || !validation?.valid) return;
    setUploading(true);
    try {
      await themesApi.upload(selectedFile, setUploadProgress);
      toast.success('Theme uploaded successfully!');
      navigate('/settings');
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.errors) setValidation({ valid: false, errors: errorData.errors, warnings: errorData.warnings || [] });
      else toast.error(errorData?.message || 'Failed to upload theme');
    } finally { setUploading(false); }
  };

  const resetUpload = () => { setSelectedFile(null); setValidation(null); setUploadProgress(0); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const formatFileSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button onClick={() => navigate('/settings')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4"><FiArrowLeft className="mr-2" /> Back to Settings</button>
        <h1 className="text-3xl font-bold text-gray-900">Theme Builder</h1>
        <p className="text-gray-600 mt-2">Upload and install custom theme packages</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center"><FiInfo className="mr-2 text-blue-500" /> Theme Structure Requirements</h2>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
          <div className="flex items-center text-gray-700"><FiFolder className="mr-2 text-yellow-500" /> your-theme-name/</div>
          <div className="ml-6 space-y-1">
            <div className="flex items-center text-gray-600"><FiFile className="mr-2 text-green-500" /> theme.json <span className="ml-2 text-xs text-green-600">(required)</span></div>
            <div className="flex items-center text-gray-600"><FiFile className="mr-2 text-gray-400" /> screenshot.png <span className="ml-2 text-xs text-gray-500">(optional)</span></div>
            <div className="flex items-center text-gray-700"><FiFolder className="mr-2 text-yellow-500" /> templates/ <span className="ml-2 text-xs text-green-600">(required)</span></div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center text-gray-600"><FiFile className="mr-2 text-blue-400" /> home.hbs <span className="ml-2 text-xs text-green-600">(required)</span></div>
              <div className="flex items-center text-gray-600"><FiFile className="mr-2 text-blue-400" /> single-post.hbs <span className="ml-2 text-xs text-green-600">(required)</span></div>
              <div className="flex items-center text-gray-600"><FiFile className="mr-2 text-blue-400" /> single-page.hbs <span className="ml-2 text-xs text-green-600">(required)</span></div>
              <div className="flex items-center text-gray-600"><FiFile className="mr-2 text-gray-400" /> archive.hbs <span className="ml-2 text-xs text-gray-500">(optional)</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center"><FiUploadCloud className="mr-2" /> Upload Theme Package</h2>
        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
          <input ref={fileInputRef} type="file" accept=".zip" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          {!selectedFile ? (
            <>
              <FiUploadCloud className="mx-auto text-5xl text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 mb-2">Drag and drop your theme ZIP file here</p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Browse Files</button>
              <p className="text-xs text-gray-500 mt-4">Maximum file size: 10MB</p>
            </>
          ) : (
            <div className="text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center"><FiPackage className="text-2xl text-blue-500 mr-3" /><div><p className="font-medium text-gray-900">{selectedFile.name}</p><p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p></div></div>
                <button onClick={resetUpload} className="p-2 text-gray-500 hover:text-red-500"><FiX size={20} /></button>
              </div>
              {validating && <div className="flex items-center text-blue-600"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>Validating theme structure...</div>}
              {validation && (
                <div className="space-y-4">
                  <div className={`flex items-center p-3 rounded-lg ${validation.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {validation.valid ? <><FiCheck className="mr-2" size={20} /><span className="font-medium">Theme is valid and ready to install</span></> : <><FiX className="mr-2" size={20} /><span className="font-medium">Theme validation failed</span></>}
                  </div>
                  {validation.themeConfig && <div className="bg-gray-50 p-4 rounded-lg"><h3 className="font-semibold text-gray-900">{validation.themeConfig.name}</h3><p className="text-sm text-gray-600">Version {validation.themeConfig.version} by {validation.themeConfig.author}</p>{validation.themeConfig.description && <p className="text-sm text-gray-500 mt-2">{validation.themeConfig.description}</p>}</div>}
                  {validation.errors.length > 0 && <div className="bg-red-50 p-4 rounded-lg"><h4 className="font-medium text-red-800 mb-2">Errors</h4><ul className="list-disc list-inside text-sm text-red-700 space-y-1">{validation.errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
                  {validation.warnings.length > 0 && <div className="bg-yellow-50 p-4 rounded-lg"><h4 className="font-medium text-yellow-800 mb-2 flex items-center"><FiAlertTriangle className="mr-2" />Warnings</h4><ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">{validation.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>}
                  {uploading && <div><div className="flex justify-between text-sm text-gray-600 mb-1"><span>Uploading...</span><span>{uploadProgress}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div></div></div>}
                  {validation.valid && !uploading && <button onClick={handleUpload} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center"><FiCheck className="mr-2" /> Install Theme</button>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

