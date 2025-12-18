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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <button onClick={() => navigate('/settings')} className="flex items-center text-slate-400 hover:text-white mb-4 transition-colors"><FiArrowLeft className="mr-2" /> Back to Settings</button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Theme Builder</h1>
        <p className="text-slate-400 mt-2">Upload and install custom theme packages</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-white"><FiInfo className="mr-2 text-blue-400" /> Theme Structure Requirements</h2>
        <div className="bg-slate-900/50 rounded-xl p-4 font-mono text-sm border border-slate-700/50">
          <div className="flex items-center text-slate-300"><FiFolder className="mr-2 text-yellow-400" /> your-theme-name/</div>
          <div className="ml-6 space-y-1">
            <div className="flex items-center text-slate-400"><FiFile className="mr-2 text-green-400" /> theme.json <span className="ml-2 text-xs text-green-400">(required)</span></div>
            <div className="flex items-center text-slate-400"><FiFile className="mr-2 text-slate-500" /> screenshot.png <span className="ml-2 text-xs text-slate-500">(optional)</span></div>
            <div className="flex items-center text-slate-300"><FiFolder className="mr-2 text-yellow-400" /> templates/ <span className="ml-2 text-xs text-green-400">(required)</span></div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center text-slate-400"><FiFile className="mr-2 text-blue-400" /> home.hbs <span className="ml-2 text-xs text-green-400">(required)</span></div>
              <div className="flex items-center text-slate-400"><FiFile className="mr-2 text-blue-400" /> single-post.hbs <span className="ml-2 text-xs text-green-400">(required)</span></div>
              <div className="flex items-center text-slate-400"><FiFile className="mr-2 text-blue-400" /> single-page.hbs <span className="ml-2 text-xs text-green-400">(required)</span></div>
              <div className="flex items-center text-slate-400"><FiFile className="mr-2 text-slate-500" /> archive.hbs <span className="ml-2 text-xs text-slate-500">(optional)</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-white"><FiUploadCloud className="mr-2" /> Upload Theme Package</h2>
        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600/50 hover:border-slate-500'}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
          <input ref={fileInputRef} type="file" accept=".zip" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          {!selectedFile ? (
            <>
              <FiUploadCloud className="mx-auto text-5xl text-slate-500 mb-4" />
              <p className="text-lg text-slate-300 mb-2">Drag and drop your theme ZIP file here</p>
              <p className="text-sm text-slate-500 mb-4">or</p>
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition-all">Browse Files</button>
              <p className="text-xs text-slate-500 mt-4">Maximum file size: 10MB</p>
            </>
          ) : (
            <div className="text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center"><FiPackage className="text-2xl text-blue-400 mr-3" /><div><p className="font-medium text-white">{selectedFile.name}</p><p className="text-sm text-slate-400">{formatFileSize(selectedFile.size)}</p></div></div>
                <button onClick={resetUpload} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><FiX size={20} /></button>
              </div>
              {validating && <div className="flex items-center text-blue-400"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-3"></div>Validating theme structure...</div>}
              {validation && (
                <div className="space-y-4">
                  <div className={`flex items-center p-3 rounded-xl ${validation.valid ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                    {validation.valid ? <><FiCheck className="mr-2" size={20} /><span className="font-medium">Theme is valid and ready to install</span></> : <><FiX className="mr-2" size={20} /><span className="font-medium">Theme validation failed</span></>}
                  </div>
                  {validation.themeConfig && <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50"><h3 className="font-semibold text-white">{validation.themeConfig.name}</h3><p className="text-sm text-slate-400">Version {validation.themeConfig.version} by {validation.themeConfig.author}</p>{validation.themeConfig.description && <p className="text-sm text-slate-500 mt-2">{validation.themeConfig.description}</p>}</div>}
                  {validation.errors.length > 0 && <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30"><h4 className="font-medium text-red-400 mb-2">Errors</h4><ul className="list-disc list-inside text-sm text-red-300 space-y-1">{validation.errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
                  {validation.warnings.length > 0 && <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30"><h4 className="font-medium text-yellow-400 mb-2 flex items-center"><FiAlertTriangle className="mr-2" />Warnings</h4><ul className="list-disc list-inside text-sm text-yellow-300 space-y-1">{validation.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>}
                  {uploading && <div><div className="flex justify-between text-sm text-slate-400 mb-1"><span>Uploading...</span><span>{uploadProgress}%</span></div><div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div></div></div>}
                  {validation.valid && !uploading && <button onClick={handleUpload} className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 font-medium flex items-center justify-center shadow-lg shadow-green-500/20 transition-all"><FiCheck className="mr-2" /> Install Theme</button>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

