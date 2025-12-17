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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    <div className="p-6">
      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <FiAlertTriangle size={24} />
              <h3 className="text-lg font-semibold">Unsaved Changes</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelNavigation}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Stay on Page
              </button>
              <button
                onClick={confirmNavigation}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Leave Without Saving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dirty State Indicator */}
      {isDirty && (
        <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-40">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium">Unsaved changes</span>
          {lastSaved && (
            <span className="text-xs text-amber-600">
              (Last saved: {lastSaved.toLocaleTimeString()})
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lms/courses')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'Create Course' : 'Edit Course'}
            </h1>
            {!isNew && course.title && (
              <p className="text-sm text-gray-500 mt-1">{course.title}</p>
            )}
          </div>
        </div>

        {/* Quick Actions for existing course */}
        {!isNew && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigation(`/lms/courses/${id}/lessons`)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiList size={16} />
              Lessons ({course._count?.lessons || 0})
            </button>
            <button
              onClick={() => handleNavigation(`/lms/courses/${id}/quizzes`)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiHelpCircle size={16} />
              Quizzes ({course._count?.quizzes || 0})
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                  <input
                    type="text"
                    value={course.title || ''}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter course title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={course.shortDescription || ''}
                    onChange={(e) => setCourse({ ...course, shortDescription: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                    placeholder="Brief summary (max 200 characters)"
                  />
                  <p className="text-xs text-gray-400 mt-1">{(course.shortDescription?.length || 0)}/200 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                  <RichTextEditor
                    content={course.description || ''}
                    onChange={(content) => setCourse({ ...course, description: content })}
                    placeholder="Write a detailed course description..."
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={course.status || 'DRAFT'}
                  onChange={(e) => setCourse({ ...course, status: e.target.value as any })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {/* Category */}
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={course.category || ''}
                  onChange={(e) => setCourse({ ...course, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 mb-2"
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
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  />
                  {newCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setCourse({ ...course, category: newCategory });
                        setNewCategory('');
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>

              {/* Level */}
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select
                  value={course.level || 'BEGINNER'}
                  onChange={(e) => setCourse({ ...course, level: e.target.value as any })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Featured Image */}
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Featured Image</label>
                {course.featuredImage ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={course.featuredImage}
                      alt="Featured"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCourse({ ...course, featuredImage: undefined })}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(true)}
                    className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                  >
                    <FiImage size={32} className="mb-2" />
                    <span>Click to select image</span>
                  </button>
                )}
                {course.featuredImage && (
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(true)}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Change image
                  </button>
                )}
              </div>

              {/* What You'll Learn */}
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">What You'll Learn</label>
                <p className="text-xs text-gray-500 mb-3">Enter each learning objective on a new line</p>
                <textarea
                  value={whatYouLearnText}
                  onChange={(e) => setWhatYouLearnText(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 h-32 focus:ring-2 focus:ring-blue-500"
                  placeholder="Build modern web applications&#10;Master React and TypeScript&#10;Deploy to production..."
                />
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                <p className="text-xs text-gray-500 mb-3">Enter each prerequisite on a new line</p>
                <textarea
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 h-32 focus:ring-2 focus:ring-blue-500"
                  placeholder="Basic JavaScript knowledge&#10;Familiarity with HTML/CSS&#10;A computer with internet access..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={course.estimatedHours || 0}
                    onChange={(e) => setCourse({ ...course, estimatedHours: parseInt(e.target.value) })}
                    className="w-24 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                  <span className="text-gray-500">hours</span>
                </div>
              </div>

              {/* Curriculum Quick Access */}
              {!isNew && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Course Curriculum</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleNavigation(`/lms/courses/${id}/lessons`)}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FiList className="text-green-600" />
                        <span>Lessons</span>
                      </div>
                      <span className="text-gray-500">{course._count?.lessons || 0}</span>
                    </button>
                    <button
                      onClick={() => handleNavigation(`/lms/courses/${id}/quizzes`)}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FiHelpCircle className="text-purple-600" />
                        <span>Quizzes</span>
                      </div>
                      <span className="text-gray-500">{course._count?.quizzes || 0}</span>
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
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 mb-4">Pricing Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setCourse({ ...course, priceType: 'FREE' })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        course.priceType === 'FREE'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">Free</div>
                      <div className="text-sm text-gray-500">No payment required</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCourse({ ...course, priceType: 'PAID' })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        course.priceType === 'PAID'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">Paid</div>
                      <div className="text-sm text-gray-500">One-time payment</div>
                    </button>
                  </div>
                </div>

                {course.priceType === 'PAID' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD)</label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={course.priceAmount || 0}
                        onChange={(e) => setCourse({ ...course, priceAmount: parseFloat(e.target.value) })}
                        className="w-full border rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-blue-500"
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
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 mb-4">Completion Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
                  <p className="text-xs text-gray-500 mb-2">Minimum quiz score required to complete the course</p>
                  <input
                    type="number"
                    value={course.passingScorePercent || 80}
                    onChange={(e) => setCourse({ ...course, passingScorePercent: parseInt(e.target.value) })}
                    className="w-32 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Certificate on Completion</div>
                    <div className="text-sm text-gray-500">Award certificate when course is completed</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={course.certificateEnabled ?? true}
                      onChange={(e) => setCourse({ ...course, certificateEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Instructor Info (read-only for now) */}
            {course.instructor && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-900 mb-4">Instructor</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                    {course.instructor.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium">{course.instructor.name}</div>
                    <div className="text-sm text-gray-500">Course Instructor</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/lms/courses')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

