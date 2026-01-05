/**
 * LMS Course Editor Page
 * Complete course creation and editing with all fields
 * Includes auto-save and dirty state tracking to prevent data loss
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lmsAdminApi, Course } from '../../services/api';
import MediaPickerModal from '../../components/MediaPickerModal';
import RichTextEditor from '../../components/RichTextEditor';
import { FiImage, FiX, FiSave, FiArrowLeft, FiList, FiHelpCircle, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const defaultCourse: Partial<Course> = {
  title: '',
  description: '',
  shortDescription: '',
  category: '',
  level: 'BEGINNER',
  priceType: 'FREE',
  priceAmount: 0,
  passingScorePercent: 80,
  certificateEnabled: true,
  estimatedHours: 0,
  whatYouLearn: [],
  requirements: [],
  status: 'DRAFT',
};

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [course, setCourse] = useState<Partial<Course>>(defaultCourse);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [whatYouLearnText, setWhatYouLearnText] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'pricing' | 'settings'>('basic');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  // Warn before closing browser/tab with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Track changes to mark as dirty
  useEffect(() => {
    if (initialLoadRef.current) return;
    setIsDirty(true);
  }, [course, whatYouLearnText, requirementsText]);

  // Auto-save every 30 seconds if dirty (for existing courses only)
  useEffect(() => {
    if (!isNew && isDirty && !saving && course.title?.trim()) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 30000); // 30 seconds
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [isDirty, course, whatYouLearnText, requirementsText]);

  const handleAutoSave = useCallback(async () => {
    if (isNew || !isDirty || saving || !course.title?.trim()) return;

    try {
      const data = {
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription,
        category: course.category || newCategory || undefined,
        level: course.level,
        featuredImage: course.featuredImage,
        priceType: course.priceType,
        priceAmount: course.priceType === 'PAID' ? Number(course.priceAmount) || 0 : undefined,
        status: course.status,
        passingScorePercent: Number(course.passingScorePercent) || 80,
        certificateEnabled: course.certificateEnabled,
        estimatedHours: Number(course.estimatedHours) || 0,
        whatYouLearn: whatYouLearnText.split('\n').filter(Boolean),
        requirements: requirementsText.split('\n').filter(Boolean),
      };

      await lmsAdminApi.updateCourse(id!, data);
      setIsDirty(false);
      setLastSaved(new Date());
      toast.success('Auto-saved', { duration: 2000, icon: '💾' });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [id, isNew, isDirty, saving, course, whatYouLearnText, requirementsText, newCategory]);

  useEffect(() => {
    loadCategories();
    if (!isNew && id) loadCourse();
  }, [id]);

  const loadCategories = async () => {
    try {
      const { data } = await lmsAdminApi.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadCourse = async () => {
    try {
      const { data } = await lmsAdminApi.getCourse(id!);
      setCourse(data);
      setWhatYouLearnText((data.whatYouLearn || []).join('\n'));
      setRequirementsText((data.requirements || []).join('\n'));
      // Mark initial load complete after state is set
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 100);
    } catch (error) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!course.title?.trim()) {
      toast.error('Course title is required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription,
        category: course.category || newCategory || undefined,
        level: course.level,
        featuredImage: course.featuredImage,
        priceType: course.priceType,
        priceAmount: course.priceType === 'PAID' ? Number(course.priceAmount) || 0 : undefined,
        status: course.status,
        passingScorePercent: Number(course.passingScorePercent) || 80,
        certificateEnabled: course.certificateEnabled,
        estimatedHours: Number(course.estimatedHours) || 0,
        whatYouLearn: whatYouLearnText.split('\n').filter(Boolean),
        requirements: requirementsText.split('\n').filter(Boolean),
      };

      if (isNew) {
        const { data: newCourse } = await lmsAdminApi.createCourse(data);
        setIsDirty(false);
        toast.success('Course created successfully!');
        navigate(`/lms/courses/${newCourse.id}`);
      } else {
        await lmsAdminApi.updateCourse(id!, data);
        setIsDirty(false);
        setLastSaved(new Date());
        toast.success('Course saved successfully!');
      }
    } catch (error: any) {
      console.error('Failed to save course:', error);
      const message = error.response?.data?.message || 'Failed to save course';
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'content', label: 'Content & Media' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'settings', label: 'Settings' },
  ] as const;

  // Handle navigation with unsaved changes check
  const handleNavigation = (path: string) => {
    if (isDirty && !saving) {
      setPendingNavigation(path);
      setShowUnsavedModal(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      setShowUnsavedModal(false);
      setIsDirty(false); // Reset dirty state before navigating
      navigate(pendingNavigation);
    }
  };

  const cancelNavigation = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-6 max-w-md shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <FiAlertTriangle size={24} />
              <h3 className="text-lg font-semibold text-white">Unsaved Changes</h3>
            </div>
            <p className="text-slate-300 mb-6">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelNavigation}
                className="px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-colors"
              >
                Stay on Page
              </button>
              <button
                onClick={confirmNavigation}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Leave Without Saving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dirty State Indicator */}
      {isDirty && (
        <div className="fixed bottom-4 right-4 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 z-40 border border-amber-500/30">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium">Unsaved changes</span>
          {lastSaved && (
            <span className="text-xs text-amber-400/70">
              (Last saved: {lastSaved.toLocaleTimeString()})
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => navigate('/lms/courses')}
            className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {isNew ? 'Create Course' : 'Edit Course'}
            </h1>
            {!isNew && course.title && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-1">{course.title}</p>
            )}
          </div>
        </div>

        {/* Quick Actions for existing course */}
        {!isNew && (
          <div className="flex items-center gap-2 ml-10 sm:ml-0">
            <button
              onClick={() => handleNavigation(`/lms/courses/${id}/lessons`)}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
            >
              <FiList size={16} />
              <span className="hidden sm:inline">Lessons</span> ({course._count?.lessons || 0})
            </button>
            <button
              onClick={() => handleNavigation(`/lms/courses/${id}/quizzes`)}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
            >
              <FiHelpCircle size={16} />
              <span className="hidden sm:inline">Quizzes</span> ({course._count?.quizzes || 0})
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700/50 mb-6 overflow-x-auto">
        <nav className="flex gap-4 md:gap-6 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Course Title *</label>
                  <input
                    type="text"
                    value={course.title || ''}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter course title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={course.shortDescription || ''}
                    onChange={(e) => setCourse({ ...course, shortDescription: e.target.value })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    maxLength={200}
                    placeholder="Brief summary (max 200 characters)"
                  />
                  <p className="text-xs text-slate-500 mt-1">{(course.shortDescription?.length || 0)}/200 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Description</label>
                  <div className="overflow-hidden rounded-xl">
                    <RichTextEditor
                      content={course.description || ''}
                      onChange={(content) => setCourse({ ...course, description: content })}
                      placeholder="Write a detailed course description..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={course.status || 'DRAFT'}
                  onChange={(e) => setCourse({ ...course, status: e.target.value as any })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {/* Category */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={course.category || ''}
                  onChange={(e) => setCourse({ ...course, category: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-2"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Or add new..."
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  {newCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setCourse({ ...course, category: newCategory });
                        setNewCategory('');
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl text-sm hover:from-green-700 hover:to-green-600 transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>

              {/* Level */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Level</label>
                <select
                  value={course.level || 'BEGINNER'}
                  onChange={(e) => setCourse({ ...course, level: e.target.value as any })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="ALL_LEVELS">All Levels</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content & Media Tab */}
        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Featured Image */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
                <label className="block text-sm font-medium text-slate-300 mb-1">Featured Image</label>
                <p className="text-xs text-slate-500 mb-3">
                  📐 Recommended size: <span className="text-blue-400 font-medium">1280 × 720 px</span> (16:9 aspect ratio)
                </p>
                {course.featuredImage ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-700/50">
                    <img
                      src={course.featuredImage}
                      alt="Featured"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCourse({ ...course, featuredImage: undefined })}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(true)}
                    className="w-full aspect-video border-2 border-dashed border-slate-600/50 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
                  >
                    <FiImage size={32} className="mb-2" />
                    <span>Click to select image</span>
                    <span className="text-xs mt-1 opacity-75">1280 × 720 px recommended</span>
                  </button>
                )}
                {course.featuredImage && (
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(true)}
                    className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Change image
                  </button>
                )}
              </div>

              {/* What You'll Learn */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">What You'll Learn</label>
                <p className="text-xs text-slate-500 mb-3">Enter each learning objective on a new line</p>
                <textarea
                  value={whatYouLearnText}
                  onChange={(e) => setWhatYouLearnText(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 h-32 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Build modern web applications&#10;Master React and TypeScript&#10;Deploy to production..."
                />
              </div>

              {/* Requirements */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Requirements</label>
                <p className="text-xs text-slate-500 mb-3">Enter each prerequisite on a new line</p>
                <textarea
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 h-32 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Basic JavaScript knowledge&#10;Familiarity with HTML/CSS&#10;A computer with internet access..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Duration</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={course.estimatedHours || 0}
                    onChange={(e) => setCourse({ ...course, estimatedHours: parseInt(e.target.value) })}
                    className="w-24 bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    min="0"
                  />
                  <span className="text-slate-400">hours</span>
                </div>
              </div>

              {/* Curriculum Quick Access */}
              {!isNew && (
                <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
                  <h3 className="font-medium text-white mb-4">Course Curriculum</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleNavigation(`/lms/courses/${id}/lessons`)}
                      className="flex items-center justify-between p-3 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FiList className="text-green-400" />
                        <span className="text-slate-300">Lessons</span>
                      </div>
                      <span className="text-slate-400">{course._count?.lessons || 0}</span>
                    </button>
                    <button
                      onClick={() => handleNavigation(`/lms/courses/${id}/quizzes`)}
                      className="flex items-center justify-between p-3 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FiHelpCircle className="text-purple-400" />
                        <span className="text-slate-300">Quizzes</span>
                      </div>
                      <span className="text-slate-400">{course._count?.quizzes || 0}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
              <h3 className="font-medium text-white mb-4">Pricing Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Price Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setCourse({ ...course, priceType: 'FREE' })}
                      className={`p-4 border-2 rounded-xl text-left transition-colors ${
                        course.priceType === 'FREE'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600/50 hover:border-slate-500/50'
                      }`}
                    >
                      <div className="font-medium text-white">Free</div>
                      <div className="text-sm text-slate-400">No payment required</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCourse({ ...course, priceType: 'PAID' })}
                      className={`p-4 border-2 rounded-xl text-left transition-colors ${
                        course.priceType === 'PAID'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600/50 hover:border-slate-500/50'
                      }`}
                    >
                      <div className="font-medium text-white">Paid</div>
                      <div className="text-sm text-slate-400">One-time payment</div>
                    </button>
                  </div>
                </div>

                {course.priceType === 'PAID' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Price (USD)</label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        value={course.priceAmount || 0}
                        onChange={(e) => setCourse({ ...course, priceAmount: parseFloat(e.target.value) })}
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
              <h3 className="font-medium text-white mb-4">Completion Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Passing Score (%)</label>
                  <p className="text-xs text-slate-500 mb-2">Minimum quiz score required to complete the course</p>
                  <input
                    type="number"
                    value={course.passingScorePercent || 80}
                    onChange={(e) => setCourse({ ...course, passingScorePercent: parseInt(e.target.value) })}
                    className="w-32 bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-600/50 rounded-xl">
                  <div>
                    <div className="font-medium text-white">Certificate on Completion</div>
                    <div className="text-sm text-slate-400">Award certificate when course is completed</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={course.certificateEnabled ?? true}
                      onChange={(e) => setCourse({ ...course, certificateEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Instructor Info (read-only for now) */}
            {course.instructor && (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 md:p-6">
                <h3 className="font-medium text-white mb-4">Instructor</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                    {course.instructor.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-white">{course.instructor.name}</div>
                    <div className="text-sm text-slate-400">Course Instructor</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-700/50">
          <button
            type="button"
            onClick={() => navigate('/lms/courses')}
            className="w-full sm:w-auto px-6 py-2.5 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
          >
            <FiSave size={18} />
            {saving ? 'Saving...' : (isNew ? 'Create Course' : 'Save Changes')}
          </button>
        </div>
      </form>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            setCourse({ ...course, featuredImage: media.path });
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}

