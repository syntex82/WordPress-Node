/**
 * My Developer Profile Page
 * Shows the current user's developer profile and allows editing
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiUser, FiCode, FiDollarSign, FiLink, FiSave, FiEdit2,
  FiAlertCircle, FiHelpCircle, FiGithub, FiLinkedin, FiGlobe,
  FiClock, FiCheckCircle, FiStar, FiBriefcase, FiExternalLink
} from 'react-icons/fi';
import api from '../../services/api';
import { developerMarketplaceApi } from '../../services/api';
import toast from 'react-hot-toast';

const categories = [
  { value: 'FRONTEND', label: 'Frontend Developer' },
  { value: 'BACKEND', label: 'Backend Developer' },
  { value: 'FULLSTACK', label: 'Full-Stack Developer' },
  { value: 'CMS', label: 'CMS Developer' },
  { value: 'MOBILE', label: 'Mobile Developer' },
  { value: 'DEVOPS', label: 'DevOps Engineer' },
  { value: 'DESIGN', label: 'UI/UX Designer' },
  { value: 'DATABASE', label: 'Database Expert' },
  { value: 'SECURITY', label: 'Security Specialist' },
  { value: 'OTHER', label: 'Other' },
];

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  INACTIVE: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function MyDeveloperProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
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
    availability: 'available',
    availableHours: 40,
    timezone: '',
    websiteUrl: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await developerMarketplaceApi.getMyProfile();
      if (data) {
        setProfile(data);
        setForm({
          displayName: data.displayName || '',
          headline: data.headline || '',
          bio: data.bio || '',
          category: data.category || 'FULLSTACK',
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          languages: Array.isArray(data.languages) ? data.languages.join(', ') : '',
          frameworks: Array.isArray(data.frameworks) ? data.frameworks.join(', ') : '',
          hourlyRate: data.hourlyRate || 50,
          minimumBudget: data.minimumBudget || 500,
          yearsOfExperience: data.yearsOfExperience || 1,
          availability: data.availability || 'available',
          availableHours: data.availableHours || 40,
          timezone: data.timezone || '',
          websiteUrl: data.websiteUrl || '',
          githubUrl: data.githubUrl || '',
          linkedinUrl: data.linkedinUrl || '',
        });
      }
    } catch {
      // No profile found
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await developerMarketplaceApi.updateMyProfile({
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
        frameworks: form.frameworks.split(',').map(s => s.trim()).filter(Boolean),
      } as any);
      toast.success('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";
  const labelClass = "block text-sm font-medium text-slate-300 mb-2";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <FiUser className="mx-auto text-slate-600 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-white mb-2">No Developer Profile</h2>
        <p className="text-slate-400 mb-6">You haven't applied to become a developer yet.</p>
        <Link
          to="/dev-marketplace/apply"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all"
        >
          Apply Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            My Developer Profile
          </h1>
          <p className="text-slate-400 mt-1">Manage your developer marketplace presence</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <FiEdit2 size={18} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl border ${statusColors[profile.status]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile.status === 'ACTIVE' ? (
              <FiCheckCircle size={24} />
            ) : profile.status === 'PENDING' ? (
              <FiClock size={24} />
            ) : (
              <FiAlertCircle size={24} />
            )}
            <div>
              <p className="font-semibold">Status: {profile.status}</p>
              {profile.status === 'PENDING' && (
                <p className="text-sm opacity-80">Your application is being reviewed</p>
              )}
              {profile.status === 'REJECTED' && profile.rejectionReason && (
                <p className="text-sm opacity-80">Reason: {profile.rejectionReason}</p>
              )}
            </div>
          </div>
          {profile.status === 'ACTIVE' && (
            <Link
              to={`/dev-marketplace/browse`}
              className="flex items-center gap-1 text-sm hover:underline"
            >
              View Public Profile <FiExternalLink size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Stats (only for active profiles) */}
      {profile.status === 'ACTIVE' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 text-center">
            <FiStar className="mx-auto text-amber-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">{Number(profile.rating || 0).toFixed(1)}</p>
            <p className="text-xs text-slate-500">{profile.reviewCount || 0} reviews</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 text-center">
            <FiBriefcase className="mx-auto text-blue-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">{profile.projectsCompleted || 0}</p>
            <p className="text-xs text-slate-500">Projects</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 text-center">
            <FiDollarSign className="mx-auto text-emerald-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">${profile.hourlyRate}</p>
            <p className="text-xs text-slate-500">Per Hour</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 text-center">
            <FiCode className="mx-auto text-purple-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-white">{profile.yearsOfExperience || 0}</p>
            <p className="text-xs text-slate-500">Years Exp</p>
          </div>
        </div>
      )}

      {/* Profile Form/View */}
      {editing ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiUser className="text-blue-400" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Display Name</label>
                <input type="text" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputClass}>
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Headline</label>
                <input type="text" value={form.headline} onChange={e => setForm({...form, headline: e.target.value})} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Bio</label>
                <textarea rows={4} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiCode className="text-purple-400" /> Skills & Experience
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Skills (comma-separated)</label>
                <input type="text" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} className={inputClass} placeholder="React, Node.js, TypeScript" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Languages</label>
                  <input type="text" value={form.languages} onChange={e => setForm({...form, languages: e.target.value})} className={inputClass} placeholder="JavaScript, Python" />
                </div>
                <div>
                  <label className={labelClass}>Frameworks</label>
                  <input type="text" value={form.frameworks} onChange={e => setForm({...form, frameworks: e.target.value})} className={inputClass} placeholder="React, NestJS" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Years of Experience</label>
                  <input type="number" min={0} max={50} value={form.yearsOfExperience} onChange={e => setForm({...form, yearsOfExperience: parseInt(e.target.value) || 0})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Hourly Rate ($)</label>
                  <input type="number" min={1} value={form.hourlyRate} onChange={e => setForm({...form, hourlyRate: parseInt(e.target.value) || 0})} className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiLink className="text-amber-400" /> Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input type="url" value={form.websiteUrl} placeholder="Website" onChange={e => setForm({...form, websiteUrl: e.target.value})} className={`${inputClass} pl-10`} />
              </div>
              <div className="relative">
                <FiGithub className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input type="url" value={form.githubUrl} placeholder="GitHub" onChange={e => setForm({...form, githubUrl: e.target.value})} className={`${inputClass} pl-10`} />
              </div>
              <div className="relative">
                <FiLinkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input type="url" value={form.linkedinUrl} placeholder="LinkedIn" onChange={e => setForm({...form, linkedinUrl: e.target.value})} className={`${inputClass} pl-10`} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition-all">
              {saving ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> Saving...</> : <><FiSave size={18} /> Save Changes</>}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="px-6 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-start gap-4">
              <img src={profile.user?.avatar || '/images/default-avatar.png'} alt={profile.displayName} className="w-20 h-20 rounded-xl border-2 border-slate-600 object-cover" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {profile.displayName}
                  {profile.isVerified && <FiCheckCircle className="text-blue-400" />}
                  {profile.isFeatured && <FiStar className="text-amber-400" />}
                </h2>
                <p className="text-slate-400">{profile.headline}</p>
                <p className="text-sm text-slate-500 mt-1">{categories.find(c => c.value === profile.category)?.label}</p>
              </div>
            </div>
            {profile.bio && <p className="text-slate-300 mt-4">{profile.bio}</p>}
          </div>

          {profile.skills?.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

