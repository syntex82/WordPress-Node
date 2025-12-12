/**
 * LMS Quiz Questions Editor Page
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lmsAdminApi, Quiz, Question } from '../../services/api';

const questionTypes = [
  { value: 'MCQ', label: 'Multiple Choice (Single)' },
  { value: 'MCQ_MULTI', label: 'Multiple Choice (Multiple)' },
  { value: 'TRUE_FALSE', label: 'True/False' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'ESSAY', label: 'Essay' },
];

export default function QuizQuestions() {
  const { courseId, quizId } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [optionsText, setOptionsText] = useState('');

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const { data } = await lmsAdminApi.getQuiz(courseId!, quizId!);
      setQuiz(data);
    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingQuestion?.prompt) return;
    try {
      const options = optionsText.split('\n').filter(Boolean);
      const data = { ...editingQuestion, optionsJson: options.length > 0 ? options : undefined };
      
      if (editingQuestion.id) {
        await lmsAdminApi.updateQuestion(courseId!, editingQuestion.id, data);
      } else {
        await lmsAdminApi.addQuestion(courseId!, quizId!, data);
      }
      setShowModal(false);
      setEditingQuestion(null);
      loadQuiz();
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await lmsAdminApi.deleteQuestion(courseId!, id);
      loadQuiz();
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const openModal = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setOptionsText((question.optionsJson || []).join('\n'));
    } else {
      setEditingQuestion({ type: 'MCQ', prompt: '', points: 1, correctAnswerJson: '' });
      setOptionsText('');
    }
    setShowModal(true);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to={`/lms/courses/${courseId}/quizzes`} className="text-blue-600 hover:underline text-sm">← Back to Quizzes</Link>
          <h1 className="text-2xl font-bold">{quiz?.title} - Questions</h1>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Question
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {!quiz?.questions?.length ? (
          <div className="p-8 text-center text-gray-500">No questions yet. Add your first question!</div>
        ) : (
          <ul className="divide-y">
            {quiz.questions.map((q, index) => (
              <li key={q.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400">Q{index + 1}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{q.type}</span>
                      <span className="text-xs text-gray-500">{q.points} pts</span>
                    </div>
                    <div className="font-medium">{q.prompt}</div>
                    {q.optionsJson && (
                      <ul className="mt-2 text-sm text-gray-600 ml-4">
                        {(q.optionsJson as string[]).map((opt, i) => (
                          <li key={i} className={opt === q.correctAnswerJson ? 'text-green-600 font-medium' : ''}>
                            {String.fromCharCode(65 + i)}. {opt} {opt === q.correctAnswerJson && '✓'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(q)} className="text-blue-600 hover:text-blue-800 px-3 py-1">Edit</button>
                    <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-800 px-3 py-1">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingQuestion.id ? 'Edit Question' : 'Add Question'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={editingQuestion.type} onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as any })}
                    className="w-full border rounded-lg px-3 py-2">
                    {questionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Points</label>
                  <input type="number" value={editingQuestion.points || 1} onChange={(e) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2" min="1" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Question *</label>
                <textarea value={editingQuestion.prompt || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 h-20" />
              </div>
              {['MCQ', 'MCQ_MULTI'].includes(editingQuestion.type || '') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Options (one per line)</label>
                  <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 h-24" placeholder="Option A&#10;Option B&#10;Option C" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Correct Answer</label>
                {editingQuestion.type === 'TRUE_FALSE' ? (
                  <select value={String(editingQuestion.correctAnswerJson)} onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswerJson: e.target.value === 'true' })}
                    className="w-full border rounded-lg px-3 py-2">
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input type="text" value={editingQuestion.correctAnswerJson || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswerJson: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" placeholder="Enter correct answer" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Explanation (shown after answer)</label>
                <textarea value={editingQuestion.explanation || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 h-16" />
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

