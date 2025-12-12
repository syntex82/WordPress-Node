/**
 * LMS Quizzes Management Page
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lmsAdminApi, Quiz, Course } from '../../services/api';

export default function Quizzes() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      const [courseRes, quizzesRes] = await Promise.all([
        lmsAdminApi.getCourse(courseId!),
        lmsAdminApi.getQuizzes(courseId!),
      ]);
      setCourse(courseRes.data);
      setQuizzes(quizzesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingQuiz?.title) return;
    try {
      if (editingQuiz.id) {
        await lmsAdminApi.updateQuiz(courseId!, editingQuiz.id, editingQuiz);
      } else {
        await lmsAdminApi.createQuiz(courseId!, editingQuiz);
      }
      setShowModal(false);
      setEditingQuiz(null);
      loadData();
    } catch (error) {
      console.error('Failed to save quiz:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quiz and all its questions?')) return;
    try {
      await lmsAdminApi.deleteQuiz(courseId!, id);
      loadData();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    }
  };

  const openModal = (quiz?: Quiz) => {
    setEditingQuiz(quiz || { title: '', description: '', timeLimitSeconds: undefined, attemptsAllowed: undefined, shuffleQuestions: false, isRequired: true });
    setShowModal(true);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/lms/courses" className="text-blue-600 hover:underline text-sm">← Back to Courses</Link>
          <h1 className="text-2xl font-bold">{course?.title} - Quizzes</h1>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Quiz
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {quizzes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No quizzes yet. Add your first quiz!</div>
        ) : (
          <ul className="divide-y">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-medium">{quiz.title}</div>
                  <div className="text-sm text-gray-500">
                    {quiz._count?.questions || 0} questions
                    {quiz.timeLimitSeconds && ` • ${Math.floor(quiz.timeLimitSeconds / 60)} min limit`}
                    {quiz.attemptsAllowed && ` • ${quiz.attemptsAllowed} attempts`}
                    {quiz.isRequired && <span className="ml-2 text-orange-600">Required</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/lms/courses/${courseId}/quizzes/${quiz.id}/questions`} className="text-purple-600 hover:text-purple-800 px-3 py-1">Questions</Link>
                  <button onClick={() => openModal(quiz)} className="text-blue-600 hover:text-blue-800 px-3 py-1">Edit</button>
                  <button onClick={() => handleDelete(quiz.id)} className="text-red-600 hover:text-red-800 px-3 py-1">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && editingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingQuiz.id ? 'Edit Quiz' : 'Add Quiz'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input type="text" value={editingQuiz.title || ''} onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={editingQuiz.description || ''} onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Time Limit (minutes)</label>
                  <input type="number" value={editingQuiz.timeLimitSeconds ? editingQuiz.timeLimitSeconds / 60 : ''} 
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, timeLimitSeconds: e.target.value ? parseInt(e.target.value) * 60 : undefined })}
                    className="w-full border rounded-lg px-3 py-2" min="0" placeholder="No limit" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Attempts</label>
                  <input type="number" value={editingQuiz.attemptsAllowed || ''} 
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, attemptsAllowed: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full border rounded-lg px-3 py-2" min="1" placeholder="Unlimited" />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editingQuiz.shuffleQuestions} onChange={(e) => setEditingQuiz({ ...editingQuiz, shuffleQuestions: e.target.checked })} />
                  <span className="text-sm">Shuffle Questions</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editingQuiz.isRequired} onChange={(e) => setEditingQuiz({ ...editingQuiz, isRequired: e.target.checked })} />
                  <span className="text-sm">Required for Completion</span>
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

