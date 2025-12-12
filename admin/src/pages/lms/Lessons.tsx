/**
 * LMS Lessons Management Page
 * Enhanced with video upload and drag-drop reordering
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lmsAdminApi, Lesson, Course } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { FiUpload, FiVideo, FiLink, FiTrash2, FiEdit2, FiMove, FiEye, FiCheck } from 'react-icons/fi';

export default function Lessons() {
  const { courseId } = useParams();
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!editingLesson?.title) return;
    try {
      if (editingLesson.id) {
        await lmsAdminApi.updateLesson(courseId!, editingLesson.id, editingLesson);
      } else {
        await lmsAdminApi.createLesson(courseId!, editingLesson);
      }
      setShowModal(false);
      setEditingLesson(null);
      loadData();
    } catch (error) {
      console.error('Failed to save lesson:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await lmsAdminApi.deleteLesson(courseId!, id);
      loadData();
    } catch (error) {
      console.error('Failed to delete lesson:', error);
    }
  };

  const openModal = (lesson?: Lesson) => {
    setEditingLesson(lesson || { title: '', type: 'VIDEO', content: '', isPreview: false, isRequired: true });
    setShowModal(true);
  };

  const openVideoModal = (lesson: Lesson) => {
    setVideoLesson(lesson);
    setExternalVideoUrl('');
    setExternalVideoProvider('YOUTUBE');
    setShowVideoModal(true);
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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/lms/courses" className="text-blue-600 hover:underline text-sm">← Back to Courses</Link>
          <h1 className="text-2xl font-bold">{course?.title} - Lessons</h1>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Lesson
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {lessons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No lessons yet. Add your first lesson!</div>
        ) : (
          <ul className="divide-y">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 w-8 cursor-move"><FiMove className="opacity-0 group-hover:opacity-100" /></span>
                  <span className="text-2xl">{getLessonTypeIcon(lesson.type)}</span>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {lesson.title}
                      {lesson.isPreview && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          <FiEye className="inline mr-1" />Preview
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{lesson.type}</span>
                      {lesson.estimatedMinutes && <span>• {lesson.estimatedMinutes} min</span>}
                      {lesson.type === 'VIDEO' && (
                        <span className={`flex items-center gap-1 ${(lesson as any).videoAsset ? 'text-green-600' : 'text-orange-500'}`}>
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
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Manage Video"
                    >
                      <FiVideo />
                    </button>
                  )}
                  <button
                    onClick={() => openModal(lesson)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Lesson"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(lesson.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingLesson.id ? 'Edit Lesson' : 'Add Lesson'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input type="text" value={editingLesson.title || ''} onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={editingLesson.type} onChange={(e) => setEditingLesson({ ...editingLesson, type: e.target.value as any })}
                    className="w-full border rounded-lg px-3 py-2">
                    <option value="VIDEO">Video</option>
                    <option value="ARTICLE">Article</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="ASSIGNMENT">Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input type="number" value={editingLesson.estimatedMinutes || ''} onChange={(e) => setEditingLesson({ ...editingLesson, estimatedMinutes: parseInt(e.target.value) || undefined })}
                    className="w-full border rounded-lg px-3 py-2" min="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea value={editingLesson.content || ''} onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 h-32" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editingLesson.isPreview} onChange={(e) => setEditingLesson({ ...editingLesson, isPreview: e.target.checked })} />
                  <span className="text-sm">Free Preview</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editingLesson.isRequired} onChange={(e) => setEditingLesson({ ...editingLesson, isRequired: e.target.checked })} />
                  <span className="text-sm">Required</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Video Upload/Attach Modal */}
      {showVideoModal && videoLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiVideo /> Manage Video - {videoLesson.title}
            </h2>

            {/* Current Video Status */}
            {(videoLesson as any).videoAsset && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 flex items-center gap-2">
                  <FiCheck /> Video attached: {(videoLesson as any).videoAsset.provider || 'Uploaded'}
                </p>
                {(videoLesson as any).videoAsset.url && (
                  <p className="text-sm text-gray-600 truncate">{(videoLesson as any).videoAsset.url}</p>
                )}
              </div>
            )}

            {/* Upload Section */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 flex items-center gap-2">
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
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="space-y-2">
                    <div className="text-purple-600">Uploading... {uploadProgress}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <FiUpload className="mx-auto text-2xl mb-2" />
                    <p>Click to upload video (max 500MB)</p>
                    <p className="text-sm text-gray-400">MP4, WebM, MOV</p>
                  </div>
                )}
              </button>
            </div>

            {/* External Video Section */}
            <div className="mb-6">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <FiLink /> Or Link External Video
              </h3>
              <div className="space-y-3">
                <select
                  value={externalVideoProvider}
                  onChange={(e) => setExternalVideoProvider(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
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
                  className="w-full border rounded-lg px-3 py-2"
                />
                <button
                  onClick={handleAttachExternalVideo}
                  disabled={!externalVideoUrl}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Attach External Video
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setShowVideoModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

