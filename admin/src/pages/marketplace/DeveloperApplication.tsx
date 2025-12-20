/**
 * Developer Application Page
 * Form for users to apply as developers
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiCode, FiDollarSign, FiLink, FiSend,
  FiAlertCircle, FiHelpCircle, FiGithub, FiLinkedin, FiGlobe,
  FiShield, FiMail, FiInfo
} from 'react-icons/fi';
import api from '../../services/api';
import Tooltip from '../../components/Tooltip';
import { MARKETPLACE_TOOLTIPS } from '../../config/tooltips';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';

const categories = [
  { value: 'FRONTEND', label: 'Frontend Developer' },
  { value: 'BACKEND', label: 'Backend Developer' },
  { value: 'FULLSTACK', label: 'Full-Stack Developer' },
  { value: 'WORDPRESS', label: 'WordPress Developer' },
  { value: 'MOBILE', label: 'Mobile Developer' },
  { value: 'DEVOPS', label: 'DevOps Engineer' },
  { value: 'DESIGN', label: 'UI/UX Designer' },
  { value: 'DATABASE', label: 'Database Expert' },
  { value: 'SECURITY', label: 'Security Specialist' },
  { value: 'OTHER', label: 'Other' },
];

export default function DeveloperApplication() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    displayName: '',
    headline: '',
    bio: '',
    category: 'FULLSTACK',
    skills: '',
    languages: '',
    frameworks: '',
    hourlyRate: 50,
    minimumBudget: 500,
    yearsOfExperience: 1,
    websiteUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    applicationNote: '',
  });

  // Check if user already has a developer profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const { data } = await api.get('/marketplace/developers/me');
        if (data) {
          setExistingProfile(data);
        }
      } catch {
        // No existing profile - that's fine
      } finally {
        setCheckingProfile(false);
      }
    };
    checkExistingProfile();
  }, []);

  // Pre-fill display name from user's name
  useEffect(() => {
    if (user?.name && !form.displayName) {
      setForm(prev => ({ ...prev, displayName: user.name }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/marketplace/developers', {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
        frameworks: form.frameworks.split(',').map(s => s.trim()).filter(Boolean),
      });
      toast.success('Application submitted successfully!');
      navigate('/marketplace/my-profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application');
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";
  const labelClass = "block text-sm font-medium text-slate-300 mb-2";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Apply as Developer
          </h1>
          <p className="text-slate-400 mt-1">Join our marketplace and start earning by helping clients with their projects.</p>
        </div>
        <Tooltip title="Help" content="Fill out this form to apply as a developer. Your application will be reviewed by our team." position="left" variant="help">
          <button className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all text-slate-400 hover:text-blue-400">
            <FiHelpCircle size={22} />
          </button>
        </Tooltip>
      </div>

      {/* Loading State */}
      {checkingProfile && (
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Checking your profile...</p>
        </div>
      )}

      {/* Existing Profile Message */}
      {!checkingProfile && existingProfile && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <FiInfo className="text-amber-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">You Already Have a Developer Profile</h3>
              <p className="text-slate-400 mt-1">
                Your developer application is currently <span className={`font-medium ${existingProfile.status === 'ACTIVE' ? 'text-emerald-400' : existingProfile.status === 'PENDING' ? 'text-amber-400' : 'text-red-400'}`}>{existingProfile.status}</span>.
              </p>
              <button
                type="button"
                onClick={() => navigate('/marketplace/my-profile')}
                className="mt-4 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg hover:bg-amber-500/30 transition-colors"
              >
                View My Developer Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <FiAlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Show form only if no existing profile */}
      {!checkingProfile && !existingProfile && (
      <>
      {/* User Account Info */}
      {user && (
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <FiShield className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Your User Account</h2>
              <p className="text-sm text-slate-400">This developer profile will be linked to your account</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-14 h-14 rounded-full border-2 border-slate-600 object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-slate-600 bg-slate-700 flex items-center justify-center">
                <FiUser className="text-slate-400" size={24} />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-white text-lg">{user.name}</p>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <FiMail size={14} />
                <span>{user.email}</span>
              </div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FiUser className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Basic Information</h2>
              <p className="text-sm text-slate-400">Tell us about yourself</p>
            </div>
          </div>

          <div className="space-y-4">
            <Tooltip title={MARKETPLACE_TOOLTIPS.displayName.title} content={MARKETPLACE_TOOLTIPS.displayName.content} position="top">
              <div>
                <label className={labelClass}>Display Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
            </Tooltip>

            <Tooltip title={MARKETPLACE_TOOLTIPS.headline.title} content={MARKETPLACE_TOOLTIPS.headline.content} position="top">
              <div>
                <label className={labelClass}>Professional Headline <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={form.headline}
                  onChange={e => setForm({ ...form, headline: e.target.value })}
                  className={inputClass}
                  placeholder="Senior Full-Stack Developer"
                />
              </div>
            </Tooltip>

            <div>
              <label className={labelClass}>Bio</label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                className={inputClass}
                placeholder="Tell clients about yourself, your experience, and what makes you unique..."
              />
            </div>

            <Tooltip title={MARKETPLACE_TOOLTIPS.category.title} content={MARKETPLACE_TOOLTIPS.category.content} position="top">
              <div>
                <label className={labelClass}>Category <span className="text-red-400">*</span></label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value} className="bg-slate-800">{cat.label}</option>
                  ))}
                </select>
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Skills & Experience */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FiCode className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Skills & Experience</h2>
              <p className="text-sm text-slate-400">Highlight your technical expertise</p>
            </div>
          </div>

          <div className="space-y-4">
            <Tooltip title={MARKETPLACE_TOOLTIPS.skills.title} content={MARKETPLACE_TOOLTIPS.skills.content} position="top">
              <div>
                <label className={labelClass}>Skills (comma-separated)</label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={e => setForm({ ...form, skills: e.target.value })}
                  className={inputClass}
                  placeholder="React, Node.js, TypeScript, PostgreSQL"
                />
              </div>
            </Tooltip>

            <div>
              <label className={labelClass}>Programming Languages</label>
              <input
                type="text"
                value={form.languages}
                onChange={e => setForm({ ...form, languages: e.target.value })}
                className={inputClass}
                placeholder="JavaScript, Python, Go, Rust"
              />
            </div>

            <div>
              <label className={labelClass}>Frameworks</label>
              <input
                type="text"
                value={form.frameworks}
                onChange={e => setForm({ ...form, frameworks: e.target.value })}
                className={inputClass}
                placeholder="React, NestJS, Django, Next.js"
              />
            </div>

            <div>
              <label className={labelClass}>Years of Experience</label>
              <input
                type="number"
                min={0}
                max={50}
                value={form.yearsOfExperience}
                onChange={e => setForm({ ...form, yearsOfExperience: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <FiDollarSign className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pricing</h2>
              <p className="text-sm text-slate-400">Set your rates</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Tooltip title={MARKETPLACE_TOOLTIPS.hourlyRate.title} content={MARKETPLACE_TOOLTIPS.hourlyRate.content} position="top">
              <div>
                <label className={labelClass}>Hourly Rate ($) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.hourlyRate}
                    onChange={e => setForm({ ...form, hourlyRate: parseInt(e.target.value) || 0 })}
                    className={`${inputClass} pl-8`}
                  />
                </div>
              </div>
            </Tooltip>
            <Tooltip title={MARKETPLACE_TOOLTIPS.minimumBudget.title} content={MARKETPLACE_TOOLTIPS.minimumBudget.content} position="top">
              <div>
                <label className={labelClass}>Minimum Budget ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    min={0}
                    value={form.minimumBudget}
                    onChange={e => setForm({ ...form, minimumBudget: parseInt(e.target.value) || 0 })}
                    className={`${inputClass} pl-8`}
                  />
                </div>
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Links & Application Note */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <FiLink className="text-amber-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Links & Application Note</h2>
              <p className="text-sm text-slate-400">Share your online presence</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="url"
                  value={form.websiteUrl}
                  placeholder="Website URL"
                  onChange={e => setForm({ ...form, websiteUrl: e.target.value })}
                  className={`${inputClass} pl-10`}
                />
              </div>
              <div className="relative">
                <FiGithub className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="url"
                  value={form.githubUrl}
                  placeholder="GitHub URL"
                  onChange={e => setForm({ ...form, githubUrl: e.target.value })}
                  className={`${inputClass} pl-10`}
                />
              </div>
              <div className="relative">
                <FiLinkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="url"
                  value={form.linkedinUrl}
                  placeholder="LinkedIn URL"
                  onChange={e => setForm({ ...form, linkedinUrl: e.target.value })}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Why do you want to join?</label>
              <textarea
                rows={3}
                value={form.applicationNote}
                onChange={e => setForm({ ...form, applicationNote: e.target.value })}
                className={inputClass}
                placeholder="Tell us why you'd be a great addition to our marketplace..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 transition-all"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Submitting...
            </>
          ) : (
            <>
              <FiSend size={18} />
              Submit Application
            </>
          )}
        </button>
      </form>
      </>
      )}
    </div>
  );
}

