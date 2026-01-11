/**
 * Email Composer Page
 * Send emails to users with template selection
 */

import { useEffect, useState } from 'react';
import { emailApi, usersApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiSend, FiUsers, FiMail, FiEye, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  type: string;
  subject: string;
  variables?: { name: string; description?: string }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function EmailComposer() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [smtpStatus, setSmtpStatus] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    templateId: '',
    recipientType: 'specific' as 'all' | 'role' | 'specific',
    role: 'VIEWER',
    selectedUsers: [] as string[],
    subject: '',
    testEmail: '',
  });

  useEffect(() => {
    fetchData();
    checkSmtpConnection();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, usersRes] = await Promise.all([
        emailApi.getTemplates({ limit: 100 }),
        usersApi.getAll(),
      ]);
      setTemplates(templatesRes.data.data || []);
      setUsers(usersRes.data.users || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const checkSmtpConnection = async () => {
    try {
      const response = await emailApi.verifyConnection();
      setSmtpStatus(response.data.connected);
    } catch {
      setSmtpStatus(false);
    }
  };

  const handlePreview = async () => {
    if (!formData.templateId) {
      toast.error('Please select a template');
      return;
    }
    try {
      const response = await emailApi.previewTemplate(formData.templateId, {
        user: { name: 'John Doe', firstName: 'John', email: 'john@example.com' },
        site: { name: 'My Website', url: window.location.origin },
        year: new Date().getFullYear(),
      });
      setPreviewHtml(response.data.html);
      setShowPreview(true);
    } catch (error) {
      toast.error('Failed to preview template');
    }
  };

  const handleSendTest = async () => {
    if (!formData.templateId || !formData.testEmail) {
      toast.error('Please select a template and enter a test email');
      return;
    }
    setSending(true);
    try {
      await emailApi.sendTestEmail({
        templateId: formData.templateId,
        to: formData.testEmail,
        variables: {
          site: { name: 'My Website', url: window.location.origin },
          year: new Date().getFullYear(),
        },
      });
      toast.success('Test email sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  const handleSendBulk = async () => {
    if (!formData.templateId) {
      toast.error('Please select a template');
      return;
    }
    if (formData.recipientType === 'specific' && formData.selectedUsers.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    setSending(true);
    try {
      const result = await emailApi.sendBulkEmail({
        templateId: formData.templateId,
        subject: formData.subject || undefined,
        recipientType: formData.recipientType,
        role: formData.recipientType === 'role' ? formData.role : undefined,
        userIds: formData.recipientType === 'specific' ? formData.selectedUsers : undefined,
        variables: {
          site: { name: 'My Website', url: window.location.origin },
          year: new Date().getFullYear(),
        },
      });
      toast.success(`Sent ${result.data.successful}/${result.data.totalRecipients} emails`);
      if (result.data.failed > 0) {
        toast.error(`${result.data.failed} emails failed`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const getRecipientCount = () => {
    if (formData.recipientType === 'all') return users.length;
    if (formData.recipientType === 'role') return users.filter(u => u.role === formData.role).length;
    return formData.selectedUsers.length;
  };

  const selectedTemplate = templates.find(t => t.id === formData.templateId);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Email Composer</h1>
          <p className="text-slate-400">Send emails to your users</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
          smtpStatus === true ? 'bg-green-500/20 text-green-400' : smtpStatus === false ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-400'
        }`}>
          {smtpStatus === true ? <FiCheck /> : smtpStatus === false ? <FiAlertCircle /> : null}
          {smtpStatus === true ? 'SMTP Connected' : smtpStatus === false ? 'SMTP Not Connected' : 'Checking...'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selection */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-white"><FiMail className="text-blue-400" /> Select Template</h3>
            <select value={formData.templateId} onChange={(e) => setFormData({ ...formData, templateId: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value="">Choose a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.type.replace('_', ' ')})</option>
              ))}
            </select>
            {selectedTemplate && (
              <div className="mt-3 p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                <p className="text-sm text-slate-300"><strong className="text-white">Subject:</strong> {selectedTemplate.subject}</p>
                <button onClick={handlePreview} className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                  <FiEye /> Preview Template
                </button>
              </div>
            )}
          </div>

          {/* Recipients */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-white"><FiUsers className="text-purple-400" /> Recipients</h3>
            <div className="flex gap-4 mb-4">
              {(['all', 'role', 'specific'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="radio" name="recipientType" checked={formData.recipientType === type} onChange={() => setFormData({ ...formData, recipientType: type, selectedUsers: [] })} className="text-blue-500 focus:ring-blue-500/50" />
                  <span className="capitalize">{type === 'all' ? 'All Users' : type === 'role' ? 'By Role' : 'Select Users'}</span>
                </label>
              ))}
            </div>
            {formData.recipientType === 'role' && (
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4">
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="AUTHOR">Author</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="STUDENT">Student</option>
                <option value="USER">User</option>
                <option value="VIEWER">Viewer</option>
              </select>
            )}
            {formData.recipientType === 'specific' && (
              <div className="max-h-48 overflow-y-auto border border-slate-600/50 rounded-xl p-2 bg-slate-700/30">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-slate-600/30 rounded-lg cursor-pointer text-slate-300">
                    <input type="checkbox" checked={formData.selectedUsers.includes(user.id)} onChange={(e) => {
                      setFormData({
                        ...formData,
                        selectedUsers: e.target.checked
                          ? [...formData.selectedUsers, user.id]
                          : formData.selectedUsers.filter(id => id !== user.id),
                      });
                    }} className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/50" />
                    <span className="text-white">{user.name}</span>
                    <span className="text-slate-500 text-sm">({user.email})</span>
                  </label>
                ))}
              </div>
            )}
            <p className="mt-3 text-sm text-slate-400">
              <strong className="text-white">{getRecipientCount()}</strong> recipient(s) selected
            </p>
          </div>

          {/* Subject Override */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
            <label className="block text-sm font-medium mb-2 text-slate-300">Subject Override (optional)</label>
            <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Leave empty to use template subject" />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
            <h3 className="font-semibold mb-4 text-white">Send Test Email</h3>
            <input type="email" value={formData.testEmail} onChange={(e) => setFormData({ ...formData, testEmail: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-3" placeholder="test@example.com" />
            <button onClick={handleSendTest} disabled={sending || !formData.templateId} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 transition-colors">
              <FiSend /> Send Test
            </button>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
            <h3 className="font-semibold mb-4 text-white">Send to Recipients</h3>
            <p className="text-sm text-slate-400 mb-4">
              This will send emails to <strong className="text-white">{getRecipientCount()}</strong> user(s).
            </p>
            <button onClick={handleSendBulk} disabled={sending || !formData.templateId || getRecipientCount() === 0} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all">
              {sending ? 'Sending...' : <><FiSend /> Send Emails</>}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-700/50">
              <h2 className="text-xl font-semibold text-white">Email Preview</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-colors"><FiX /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-900/50">
              <div className="bg-white rounded-xl shadow max-w-xl mx-auto" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

