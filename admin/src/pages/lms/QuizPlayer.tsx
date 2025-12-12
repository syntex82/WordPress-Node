/**
 * LMS Quiz Player - Student quiz taking interface
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lmsApi } from '../../services/api';
import toast from 'react-hot-toast';
import { FiClock, FiCheck, FiX, FiArrowLeft, FiArrowRight, FiAward } from 'react-icons/fi';

interface QuizQuestion {
  id: string;
  type: 'MCQ' | 'MCQ_MULTI' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  prompt: string;
  optionsJson?: string[];
  points: number;
}

interface QuizAttempt { id: string; attemptNumber: number; }
interface QuizResult { scorePercent: number; scorePoints: number; maxPoints: number; passed: boolean; passingScore: number; }

export default function QuizPlayer() {
  const { courseId, quizId } = useParams();
  const [quiz, setQuiz] = useState<any>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => { loadQuiz(); }, [quizId]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(t => { if (t && t <= 1) { handleSubmit(); return 0; } return t ? t - 1 : null; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const loadQuiz = async () => {
    try { const { data } = await lmsApi.getQuiz(courseId!, quizId!); setQuiz(data); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed to load quiz'); }
    finally { setLoading(false); }
  };

  const startQuiz = async () => {
    try {
      const { data } = await lmsApi.startQuiz(courseId!, quizId!);
      setAttempt(data.attempt); setQuestions(data.questions); setTimeRemaining(data.timeLimitSeconds || null); setStarted(true);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to start quiz'); }
  };

  const handleSubmit = useCallback(async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const { data } = await lmsApi.submitQuiz(courseId!, quizId!, attempt.id, answerArray);
      setResult(data); toast.success(data.passed ? 'Congratulations! You passed!' : 'Quiz submitted');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to submit quiz'); }
    finally { setSubmitting(false); }
  }, [attempt, answers, courseId, quizId, submitting]);

  const setAnswer = (qId: string, val: any) => setAnswers(prev => ({ ...prev, [qId]: val }));
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!quiz) return <div className="min-h-screen flex items-center justify-center">Quiz not found</div>;

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${result.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {result.passed ? <FiAward className="text-4xl" /> : <FiX className="text-4xl" />}
          </div>
          <h1 className="text-2xl font-bold mb-2">{result.passed ? 'Congratulations!' : 'Keep Trying!'}</h1>
          <p className="text-gray-600 mb-6">{result.passed ? 'You passed the quiz!' : 'You did not pass this time.'}</p>
          <div className="text-5xl font-bold mb-2">{result.scorePercent.toFixed(0)}%</div>
          <p className="text-gray-500 mb-6">{result.scorePoints} / {result.maxPoints} points (Passing: {result.passingScore}%)</p>
          <div className="flex gap-4 justify-center">
            <Link to={`/lms/learn/${courseId}`} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Back to Course</Link>
            {!result.passed && quiz.attemptsRemaining !== 0 && (
              <button onClick={() => { setResult(null); setStarted(false); setAnswers({}); loadQuiz(); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Try Again</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
          <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
          {quiz.description && <p className="text-gray-600 mb-6">{quiz.description}</p>}
          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between"><span>Questions:</span><span className="font-medium">{quiz.questions?.length || 0}</span></div>
            {quiz.timeLimitSeconds && <div className="flex justify-between"><span>Time Limit:</span><span className="font-medium">{Math.floor(quiz.timeLimitSeconds / 60)} min</span></div>}
            {quiz.passingScorePercent && <div className="flex justify-between"><span>Passing Score:</span><span className="font-medium">{quiz.passingScorePercent}%</span></div>}
            {quiz.attemptsAllowed && <div className="flex justify-between"><span>Attempts:</span><span className="font-medium">{quiz.attemptsUsed || 0} / {quiz.attemptsAllowed}</span></div>}
          </div>
          {quiz.attemptsRemaining === 0 ? (
            <p className="text-red-600 text-center">You have used all attempts for this quiz.</p>
          ) : (
            <button onClick={startQuiz} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Start Quiz</button>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold truncate">{quiz.title}</h1>
          {timeRemaining !== null && <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${timeRemaining < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}><FiClock /> {formatTime(timeRemaining)}</div>}
        </div>
        <div className="h-1 bg-gray-200"><div className="h-1 bg-blue-600 transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div>
      </header>
      <main className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</span>
            <span className="text-sm text-gray-500">{currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}</span>
          </div>
          <h2 className="text-xl font-medium mb-6">{currentQuestion.prompt}</h2>
          {renderQuestionInput(currentQuestion, answers, setAnswer)}
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50"><FiArrowLeft /> Previous</button>
          <div className="flex gap-1">{questions.map((_, i) => <button key={i} onClick={() => setCurrentIndex(i)} className={`w-8 h-8 rounded-full text-sm ${i === currentIndex ? 'bg-blue-600 text-white' : answers[questions[i].id] !== undefined ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}>{i + 1}</button>)}</div>
          {currentIndex < questions.length - 1 ? (
            <button onClick={() => setCurrentIndex(i => i + 1)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Next <FiArrowRight /></button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Quiz'}</button>
          )}
        </div>
      </main>
    </div>
  );
}

function renderQuestionInput(q: QuizQuestion, answers: Record<string, any>, setAnswer: (id: string, val: any) => void) {
  if (q.type === 'MCQ' || q.type === 'MCQ_MULTI') {
    return <div className="space-y-3">{q.optionsJson?.map((opt, i) => {
      const sel = q.type === 'MCQ' ? answers[q.id] === opt : (answers[q.id] || []).includes(opt);
      return <button key={i} onClick={() => q.type === 'MCQ' ? setAnswer(q.id, opt) : setAnswer(q.id, sel ? (answers[q.id] || []).filter((o: string) => o !== opt) : [...(answers[q.id] || []), opt])} className={`w-full text-left p-4 rounded-lg border-2 ${sel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}><span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 text-sm ${sel ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{q.type === 'MCQ' ? String.fromCharCode(65 + i) : sel ? <FiCheck /> : ''}</span>{opt}</button>;
    })}</div>;
  }
  if (q.type === 'TRUE_FALSE') {
    return <div className="flex gap-4">{['True', 'False'].map(o => <button key={o} onClick={() => setAnswer(q.id, o === 'True')} className={`flex-1 p-4 rounded-lg border-2 font-medium ${answers[q.id] === (o === 'True') ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>{o}</button>)}</div>;
  }
  return <textarea value={answers[q.id] || ''} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Type your answer..." rows={q.type === 'ESSAY' ? 6 : 2} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />;
}