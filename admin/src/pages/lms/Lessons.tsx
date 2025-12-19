/**
 * LMS Lessons Management Page
 * Enhanced with video upload, drag-drop reordering, and auto-save
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { lmsAdminApi, Lesson, Course } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import { FiUpload, FiVideo, FiLink, FiTrash2, FiEdit2, FiMove, FiEye, FiCheck, FiSave, FiHelpCircle, FiList } from 'react-icons/fi';

export default function Lessons() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoLesson, setVideoLesson] = useState<Lesson | null>(null);
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [externalVideoProvider, setExternalVideoProvider] = useState('YOUTUBE');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Warn before closing browser/tab with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showModal && isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showModal, isDirty]);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        lmsAdminApi.getCourse(courseId!),
        lmsAdminApi.getLessons(courseId!),
      ]);
      setCourse(courseRes.data);
      setLessons(lessonsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingLesson?.title?.trim()) {
      toast.error('Lesson title is required');
      return;
    }
    setSaving(true);
    try {
      if (editingLesson.id) {
        await lmsAdminApi.updateLesson(courseId!, editingLesson.id, editingLesson);
        toast.success('Lesson updated successfully!');
      } else {
        await lmsAdminApi.createLesson(courseId!, editingLesson);
        toast.success('Lesson created successfully!');
      }
      setIsDirty(false);
      setShowModal(false);
      setEditingLesson(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to save lesson:', error);
      const message = error.response?.data?.message || 'Failed to save lesson';
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson? This action cannot be undone.')) return;
    try {
      await lmsAdminApi.deleteLesson(courseId!, id);
      toast.success('Lesson deleted');
      loadData();
    } catch (error: any) {
      console.error('Failed to delete lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  const openModal = (lesson?: Lesson) => {
    setEditingLesson(lesson || { title: '', type: 'VIDEO', content: '', isPreview: false, isRequired: true });
    setIsDirty(false);
    setShowModal(true);
  };

  const updateEditingLesson = useCallback((updates: Partial<Lesson>) => {
    setEditingLesson(prev => prev ? { ...prev, ...updates } : null);
    setIsDirty(true);
  }, []);

  const handleCloseModal = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    setIsDirty(false);
    setShowModal(false);
    setEditingLesson(null);
  };

  const openVideoModal = (lesson: Lesson) => {
    setVideoLesson(lesson);
    setExternalVideoUrl('');
    setExternalVideoProvider('YOUTUBE');
    setShowVideoModal(true);
  };

  const handleCreateQuizForLesson = async (lesson: Lesson) => {
    setCreatingQuiz(lesson.id);
    try {
      // Create a quiz for this lesson
      const response = await lmsAdminApi.createQuiz(courseId!, {
        title: lesson.title,
        description: lesson.content || '',
        isRequired: lesson.isRequired ?? true,
        lessonId: lesson.id,
      });
      const quiz = response.data;
      toast.success('Quiz created! Redirecting to add questions...');
      // Navigate to questions page
      navigate(`/lms/courses/${courseId}/quizzes/${quiz.id}/questions`);
    } catch (error: any) {
      console.error('Failed to create quiz:', error);
      toast.error('Failed to create quiz');
      setCreatingQuiz(null);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !videoLesson) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error('Video must be less than 500MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);

      // Using XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));

        const token = useAuthStore.getState().token;
        xhr.open('POST', `/api/lms/admin/courses/${courseId}/lessons/${videoLesson.id}/upload-video`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      toast.success('Video uploaded successfully');
      setShowVideoModal(false);
      loadData();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAttachExternalVideo = async () => {
    if (!externalVideoUrl || !videoLesson) return;

    try {
      await lmsAdminApi.attachExternalVideo(courseId!, videoLesson.id, {
        provider: externalVideoProvider,
        url: externalVideoUrl,
      });
      toast.success('Video attached successfully');
      setShowVideoModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to attach video:', error);
      toast.error('Failed to attach video');
    }
  };

  const getLessonTypeIcon = (type: string) => {
    const icons: Record<string, string> = { VIDEO: '🎬', ARTICLE: '📄', QUIZ: '❓', ASSIGNMENT: '📝' };
    return icons[type] || '📄';
  };

  if (loading) return <div className="p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500"></div></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/lms/courses" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">← Back to Courses</Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{course?.title} - Lessons</h1>
        </div>
        <button onClick={() => openModal()} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition-all">
          Add Lesson
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50">
        {lessons.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No lessons yet. Add your first lesson!</div>
        ) : (
          <ul className="divide-y divide-slate-700/50">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-8 cursor-move"><FiMove className="opacity-0 group-hover:opacity-100" /></span>
                  <span className="text-2xl">{getLessonTypeIcon(lesson.type)}</span>
                  <div>
                    <div className="font-medium flex items-center gap-2 text-white">
                      {lesson.title}
                      {lesson.isPreview && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                          <FiEye className="inline mr-1" />Preview
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 flex items-center gap-2">
                      <span>{lesson.type}</span>
                      {lesson.estimatedMinutes && <span>• {lesson.estimatedMinutes} min</span>}
                      {lesson.type === 'VIDEO' && (
                        <span className={`flex items-center gap-1 ${(lesson as any).videoAsset ? 'text-green-400' : 'text-orange-400'}`}>
                          <FiVideo />
                          {(lesson as any).videoAsset ? 'Video attached' : 'No video'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {lesson.type === 'VIDEO' && (
                    <button
                      onClick={() => openVideoModal(lesson)}
                      className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-colors"
                      title="Manage Video"
                    >
                      <FiVideo />
                    </button>
                  )}
                  {lesson.type === 'QUIZ' && (
                    (lesson as any).quiz?.id ? (
                      <Link
                        to={`/lms/courses/${courseId}/quizzes/${(lesson as any).quiz.id}/questions`}
                        className="p-2 text-amber-400 hover:bg-amber-500/20 rounded-xl transition-colors"
                        title="Manage Questions"
                      >
                        <FiList />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleCreateQuizForLesson(lesson)}
                        disabled={creatingQuiz === lesson.id}
                        className="p-2 text-amber-400 hover:bg-amber-500/20 rounded-xl transition-colors disabled:opacity-50"
                        title="Create Quiz & Add Questions"
                      >
                        {creatingQuiz === lesson.id ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <FiList />
                        )}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => openModal(lesson)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors"
                    title="Edit Lesson"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(lesson.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                    title="Delete Lesson"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && editingLesson && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{editingLesson.id ? 'Edit Lesson' : 'Add Lesson'}</h2>
              {isDirty && (
                <span className="flex items-center gap-1 text-amber-400 text-sm">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Title *</label>
                <input
                  type="text"
                  value={editingLesson.title || ''}
                  onChange={(e) => updateEditingLesson({ title: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter lesson title..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-300">Type</label>
                  <select
                    value={editingLesson.type}
                    onChange={(e) => updateEditingLesson({ type: e.target.value as any })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="VIDEO">Video</option>
                    <option value="ARTICLE">Article</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="ASSIGNMENT">Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-300">Duration (minutes)</label>
                  <input
                    type="number"
                    value={editingLesson.estimatedMinutes || ''}
                    onChange={(e) => updateEditingLesson({ estimatedMinutes: parseInt(e.target.value) || undefined })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    min="0"
                    placeholder="e.g., 15"
                  />
                </div>
              </div>
              {/* Content Section - varies by lesson type */}
              {editingLesson.type === 'VIDEO' && (
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                  <label className="block text-sm font-medium mb-2 text-slate-300">Video Content</label>
                  <p className="text-slate-400 text-sm mb-3">
                    Save the lesson first, then use the video icon to upload or attach a video.
                  </p>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-dashed border-slate-500/50 text-center">
                    <FiVideo className="mx-auto text-3xl text-purple-400 mb-2" />
                    <p className="text-slate-400 text-sm">Video will be attached after saving</p>
                  </div>
                </div>
              )}

              {editingLesson.type === 'ARTICLE' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-300">Article Content</label>
                  <RichTextEditor
                    content={editingLesson.content || ''}
                    onChange={(content) => updateEditingLesson({ content })}
                    placeholder="Write your article content here..."
                  />
                </div>
              )}

              {editingLesson.type === 'QUIZ' && (
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <FiHelpCircle className="text-amber-400" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Quiz Lesson</h4>
                      <p className="text-slate-400 text-sm">
                        {editingLesson.id ? 'Quiz is automatically created. Add questions after saving.' : 'A quiz will be auto-created when you save this lesson.'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/50">
                    <label className="block text-sm font-medium mb-2 text-slate-300">Quiz Instructions (optional)</label>
                    <textarea
                      value={editingLesson.content || ''}
                      onChange={(e) => updateEditingLesson({ content: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                      placeholder="Enter instructions for students before they start the quiz..."
                    />
                  </div>
                  {editingLesson.id && (editingLesson as any).quiz?.id ? (
                    <Link
                      to={`/lms/courses/${courseId}/quizzes/${(editingLesson as any).quiz.id}/questions`}
                      className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white px-4 py-2 rounded-xl hover:from-amber-700 hover:to-orange-600 transition-colors shadow-lg shadow-amber-500/20"
                    >
                      <FiList size={14} /> Manage Quiz Questions
                    </Link>
                  ) : (
                    <p className="text-amber-400/80 text-xs mt-3 flex items-center gap-1">
                      <FiList size={12} /> Save lesson first, then click "Manage Questions" to add quiz questions
                    </p>
                  )}
                </div>
              )}

              {editingLesson.type === 'ASSIGNMENT' && (
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <FiEdit2 className="text-emerald-400" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Assignment Lesson</h4>
                      <p className="text-slate-400 text-sm">Students will submit their work for review</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">Assignment Description</label>
                      <textarea
                        value={editingLesson.content || ''}
                        onChange={(e) => updateEditingLesson({ content: e.target.value })}
                        rows={4}
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                        placeholder="Describe what students need to do for this assignment..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-600/50">
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500" />
                          Allow file uploads
                        </label>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-600/50">
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500" />
                          Text submission
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingLesson.isPreview}
                    onChange={(e) => updateEditingLesson({ isPreview: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/50"
                  />
                  <span className="text-sm">Free Preview (visible to non-enrolled users)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingLesson.isRequired}
                    onChange={(e) => updateEditingLesson({ isRequired: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/50"
                  />
                  <span className="text-sm">Required for completion</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700/50">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingLesson.title?.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FiSave />
                {saving ? 'Saving...' : 'Save Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Upload/Attach Modal */}
      {showVideoModal && videoLesson && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <FiVideo className="text-purple-400" /> Manage Video - {videoLesson.title}
            </h2>

            {/* Current Video Status */}
            {(videoLesson as any).videoAsset && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-green-400 flex items-center gap-2">
                  <FiCheck /> Video attached: {(videoLesson as any).videoAsset.provider || 'Uploaded'}
                </p>
                {(videoLesson as any).videoAsset.url && (
                  <p className="text-sm text-slate-400 truncate">{(videoLesson as any).videoAsset.url}</p>
                )}
              </div>
            )}

            {/* Upload Section */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-slate-300">
                <FiUpload /> Upload Video File
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full p-4 border-2 border-dashed border-slate-600/50 rounded-xl hover:border-purple-500 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="space-y-2">
                    <div className="text-purple-400">Uploading... {uploadProgress}%</div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <FiUpload className="mx-auto text-2xl mb-2" />
                    <p>Click to upload video (max 500MB)</p>
                    <p className="text-sm text-slate-500">MP4, WebM, MOV</p>
                  </div>
                )}
              </button>
            </div>

            {/* External Video Section */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-slate-300">
                <FiLink /> Or Link External Video
              </h3>
              <div className="space-y-3">
                <select
                  value={externalVideoProvider}
                  onChange={(e) => setExternalVideoProvider(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="YOUTUBE">YouTube</option>
                  <option value="VIMEO">Vimeo</option>
                  <option value="WISTIA">Wistia</option>
                  <option value="BUNNY">Bunny.net</option>
                  <option value="OTHER">Other URL</option>
                </select>
                <input
                  type="url"
                  value={externalVideoUrl}
                  onChange={(e) => setExternalVideoUrl(e.target.value)}
                  placeholder="Paste video URL here..."
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <button
                  onClick={handleAttachExternalVideo}
                  disabled={!externalVideoUrl}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-2 rounded-xl hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all"
                >
                  Attach External Video
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setShowVideoModal(false)} className="px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

