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
      // Only send allowed DTO fields
      const data = {
        type: editingQuestion.type,
        prompt: editingQuestion.prompt,
        optionsJson: options.length > 0 ? options : undefined,
        correctAnswerJson: editingQuestion.correctAnswerJson,
        explanation: editingQuestion.explanation,
        points: editingQuestion.points,
        orderIndex: editingQuestion.orderIndex,
      };

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

  if (loading) return <div className="p-4 md:p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500"></div></div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Link to={`/lms/courses/${courseId}/quizzes`} className="text-blue-400 hover:text-blue-300 text-sm transition-colors">← Back to Quizzes</Link>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent line-clamp-2">{quiz?.title} - Questions</h1>
        </div>
        <button onClick={() => openModal()} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition-all">
          Add Question
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50">
        {!quiz?.questions?.length ? (
          <div className="p-8 text-center text-slate-400">No questions yet. Add your first question!</div>
        ) : (
          <ul className="divide-y divide-slate-700/50">
            {quiz.questions.map((q, index) => (
              <li key={q.id} className="p-3 md:p-4 hover:bg-slate-700/30 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-slate-500">Q{index + 1}</span>
                      <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded">{q.type}</span>
                      <span className="text-xs text-slate-500">{q.points} pts</span>
                    </div>
                    <div className="font-medium text-white break-words">{q.prompt}</div>
                    {q.optionsJson && (
                      <ul className="mt-2 text-sm text-slate-400 ml-4">
                        {(q.optionsJson as string[]).map((opt, i) => (
                          <li key={i} className={`break-words ${opt === q.correctAnswerJson ? 'text-green-400 font-medium' : ''}`}>
                            {String.fromCharCode(65 + i)}. {opt} {opt === q.correctAnswerJson && '✓'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-2 ml-auto sm:ml-0">
                    <button onClick={() => openModal(q)} className="text-blue-400 hover:text-blue-300 px-2 md:px-3 py-1 transition-colors text-sm">Edit</button>
                    <button onClick={() => handleDelete(q.id)} className="text-red-400 hover:text-red-300 px-2 md:px-3 py-1 transition-colors text-sm">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && editingQuestion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-white">{editingQuestion.id ? 'Edit Question' : 'Add Question'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-300">Type</label>
                  <select value={editingQuestion.type} onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as any })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    {questionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-300">Points</label>
                  <input type="number" value={editingQuestion.points || 1} onChange={(e) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" min="1" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Question *</label>
                <textarea value={editingQuestion.prompt || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 h-20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              {['MCQ', 'MCQ_MULTI'].includes(editingQuestion.type || '') && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-300">Options (one per line)</label>
                  <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 h-24 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Option A&#10;Option B&#10;Option C" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Correct Answer</label>
                {editingQuestion.type === 'TRUE_FALSE' ? (
                  <select value={String(editingQuestion.correctAnswerJson)} onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswerJson: e.target.value === 'true' })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input type="text" value={editingQuestion.correctAnswerJson || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswerJson: e.target.value })}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Enter correct answer" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Explanation (shown after answer)</label>
                <textarea value={editingQuestion.explanation || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 h-16 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="w-full sm:w-auto px-4 py-2.5 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-colors">Cancel</button>
              <button onClick={handleSave} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition-all">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

