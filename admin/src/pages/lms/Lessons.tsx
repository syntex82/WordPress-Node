/**
 * LMS Lessons Management Page
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lmsAdminApi, Lesson, Course } from '../../services/api';

export default function Lessons() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);

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
            {lessons.map((lesson, index) => (
              <li key={lesson.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 w-8">{index + 1}</span>
                  <span className="text-2xl">{getLessonTypeIcon(lesson.type)}</span>
                  <div>
                    <div className="font-medium">{lesson.title}</div>
                    <div className="text-sm text-gray-500">
                      {lesson.type} {lesson.estimatedMinutes && `• ${lesson.estimatedMinutes} min`}
                      {lesson.isPreview && <span className="ml-2 text-green-600">Preview</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(lesson)} className="text-blue-600 hover:text-blue-800 px-3 py-1">Edit</button>
                  <button onClick={() => handleDelete(lesson.id)} className="text-red-600 hover:text-red-800 px-3 py-1">Delete</button>
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
    </div>
  );
}

