import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lmsAdminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi';

interface CertificateTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  titleFont: string;
  bodyFont: string;
  titleFontSize: number;
  nameFontSize: number;
  courseFontSize: number;
  bodyFontSize: number;
  titleText: string;
  subtitleText: string;
  completionText: string;
  brandingText: string;
  showBorder: boolean;
  showLogo: boolean;
  showBranding: boolean;
  borderWidth: number;
  borderStyle: string;
  createdAt: string;
  updatedAt: string;
}

export default function CertificateTemplates() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data } = await lmsAdminApi.getCertificateTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load certificate templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await lmsAdminApi.setDefaultCertificateTemplate(id);
      toast.success('Default template updated');
      loadTemplates();
    } catch (error) {
      console.error('Failed to set default:', error);
      toast.error('Failed to set default template');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await lmsAdminApi.deleteCertificateTemplate(id);
      toast.success('Template deleted');
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      const message = error.response?.data?.message || 'Failed to delete template';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Certificate Templates</h1>
          <p className="text-slate-400 mt-1">Customize certificate designs and branding</p>
        </div>
        <Link
          to="/lms/certificate-templates/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          New Template
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                {template.isDefault && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full mt-2">
                    <FiStar className="w-3 h-3 fill-current" />
                    Default
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-slate-600" style={{ backgroundColor: template.primaryColor }}></div>
                <span className="text-sm text-slate-400">Primary: {template.primaryColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-slate-600" style={{ backgroundColor: template.backgroundColor }}></div>
                <span className="text-sm text-slate-400">Background: {template.backgroundColor}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/lms/certificate-templates/${template.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit
              </Link>
              {!template.isDefault && (
                <>
                  <button
                    onClick={() => handleSetDefault(template.id)}
                    className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    title="Set as default"
                  >
                    <FiStar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No certificate templates found</p>
          <Link
            to="/lms/certificate-templates/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Create Your First Template
          </Link>
        </div>
      )}
    </div>
  );
}

