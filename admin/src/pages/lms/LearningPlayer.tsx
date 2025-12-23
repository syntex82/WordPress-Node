/**
 * LMS Learning Player - Course learning interface
 * Enhanced with video progress tracking and external video support
 * Mobile-responsive with collapsible sidebar
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { lmsApi } from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiPlay, FiChevronLeft, FiChevronRight, FiAward, FiBookOpen, FiFileText, FiMenu, FiX } from 'react-icons/fi';

interface LessonProgress {
  id: string;
  title: string;
  type: string;
  completed: boolean;
  isRequired: boolean;
}

interface CourseProgress {
  lessons: LessonProgress[];
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
  nextLesson?: { id: string };
  isComplete: boolean;
  requiredQuizzes?: { id: string; title: string; passed: boolean }[];
  allRequiredQuizzesPassed?: boolean;
}

export default function LearningPlayer() {
  const { courseId, lessonId } = useParams();
  useNavigate(); // Keep hook for potential future use
  const videoRef = useRef<HTMLVideoElement>(null);
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const lastProgressUpdate = useRef(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  useEffect(() => {
    if (lessonId) loadLesson(lessonId);
  }, [lessonId]);

  const loadCourseData = async () => {
    try {
      const { data } = await lmsApi.getCourseForLearning(courseId!);
      setCourse(data.course);
      setProgress(data.progress);
      
      // Load first incomplete lesson if no lesson selected
      if (!lessonId && data.progress.nextLesson) {
        loadLesson(data.progress.nextLesson.id);
      } else if (!lessonId && data.course.lessons?.length > 0) {
        loadLesson(data.course.lessons[0].id);
      }
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLesson = async (id: string) => {
    try {
      const { data } = await lmsApi.getLesson(courseId!, id);
      setCurrentLesson(data.lesson);
    } catch (error) {
      console.error('Failed to load lesson:', error);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    try {
      await lmsApi.markLessonComplete(courseId!, currentLesson.id);
      toast.success('Lesson completed!');
      loadCourseData(); // Refresh progress
    } catch (error) {
      console.error('Failed to mark complete:', error);
    }
  };

  const handleVideoProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const percent = (video.currentTime / video.duration) * 100;

    // Update progress every 10 seconds
    if (video.currentTime - lastProgressUpdate.current >= 10) {
      lastProgressUpdate.current = video.currentTime;
      lmsApi.updateProgress(courseId!, currentLesson.id, {
        videoWatchedSeconds: Math.floor(video.currentTime),
      }).catch(console.error);
    }

    // Auto-complete at 90%
    if (percent >= 90 && !isLessonComplete(currentLesson.id)) {
      handleMarkComplete();
    }
  };

  const isLessonComplete = (lessonId: string) => {
    return progress?.lessons.find(l => l.id === lessonId)?.completed || false;
  };

  const getCurrentLessonIndex = () => {
    return course?.lessons?.findIndex((l: any) => l.id === currentLesson?.id) ?? -1;
  };

  const goToNextLesson = () => {
    const idx = getCurrentLessonIndex();
    if (idx >= 0 && idx < course.lessons.length - 1) {
      loadLesson(course.lessons[idx + 1].id);
    }
  };

  const goToPrevLesson = () => {
    const idx = getCurrentLessonIndex();
    if (idx > 0) {
      loadLesson(course.lessons[idx - 1].id);
    }
  };

  const getVideoEmbed = (videoAsset: any) => {
    if (!videoAsset) return null;

    const { provider, url, playbackId } = videoAsset;

    if (provider === 'YOUTUBE') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1] || playbackId;
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (provider === 'VIMEO') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1] || playbackId;
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          className="w-full h-full rounded-lg"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Default: direct video file
    return (
      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full h-full rounded-lg"
        onTimeUpdate={handleVideoProgress}
      />
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500"></div>
    </div>
  );
  if (!course) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Course not found</div>;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700/50">
        <Link to={`/lms/course/${course.slug}`} className="text-blue-400 text-sm hover:text-blue-300 transition-colors">← Back</Link>
        <h2 className="font-bold text-sm text-white truncate flex-1 mx-4 text-center">{course.title}</h2>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          aria-label="Toggle lessons menu"
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 max-w-[85vw] bg-slate-800 border-r border-slate-700/50 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-700/50 hidden lg:block">
          <Link to={`/lms/course/${course.slug}`} className="text-blue-400 text-sm hover:text-blue-300 transition-colors">← Back to Course</Link>
          <h2 className="font-bold text-lg mt-2 text-white">{course.title}</h2>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>Progress</span>
              <span>{progress?.percentComplete || 0}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress?.percentComplete || 0}%` }} />
            </div>
          </div>
        </div>
        {/* Mobile Progress Bar */}
        <div className="p-4 border-b border-slate-700/50 lg:hidden">
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>Progress</span>
            <span>{progress?.percentComplete || 0}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress?.percentComplete || 0}%` }} />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {/* Lessons */}
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
            Lessons
          </div>
          {course.lessons?.map((lesson: any, index: number) => (
            <button
              key={lesson.id}
              onClick={() => { loadLesson(lesson.id); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 border-b border-slate-700/50 flex items-center gap-3 hover:bg-slate-700/50 transition-colors min-h-[48px] ${
                currentLesson?.id === lesson.id ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                isLessonComplete(lesson.id) ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {isLessonComplete(lesson.id) ? '✓' : index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-white">{lesson.title}</div>
                <div className="text-xs text-slate-500">{lesson.type} • {lesson.estimatedMinutes || 0} min</div>
              </div>
            </button>
          ))}

          {/* Standalone Quizzes */}
          {progress?.requiredQuizzes && progress.requiredQuizzes.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700/50 mt-2">
                Required Quizzes
              </div>
              {progress.requiredQuizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  to={`/lms/quiz/${courseId}/${quiz.id}`}
                  className="w-full text-left px-4 py-3 border-b border-slate-700/50 flex items-center gap-3 hover:bg-slate-700/50 transition-colors block"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    quiz.passed ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {quiz.passed ? '✓' : '?'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-white">{quiz.title}</div>
                    <div className="text-xs text-slate-500">
                      {quiz.passed ? 'Passed' : 'Not completed'}
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {currentLesson ? (
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Lesson Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-xl flex-shrink-0 ${
                  currentLesson.type === 'VIDEO' ? 'bg-purple-500/20 text-purple-400' :
                  currentLesson.type === 'QUIZ' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {currentLesson.type === 'VIDEO' ? <FiPlay /> :
                   currentLesson.type === 'QUIZ' ? <FiFileText /> : <FiBookOpen />}
                </span>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{currentLesson.title}</h1>
                  <p className="text-sm text-slate-400">
                    Lesson {getCurrentLessonIndex() + 1} of {course.lessons?.length || 0}
                  </p>
                </div>
              </div>
              {isLessonComplete(currentLesson.id) && (
                <span className="flex items-center gap-1 text-green-400 bg-green-500/20 px-3 py-1 rounded-full text-sm self-start sm:self-auto">
                  <FiCheck /> Completed
                </span>
              )}
            </div>

            {/* Video Player */}
            {currentLesson.type === 'VIDEO' && currentLesson.videoAsset && (
              <div className="aspect-video bg-black rounded-xl mb-6 overflow-hidden">
                {getVideoEmbed(currentLesson.videoAsset)}
              </div>
            )}

            {/* Quiz Link */}
            {currentLesson.type === 'QUIZ' && currentLesson.quiz && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-6 text-center">
                <FiFileText className="text-4xl text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{currentLesson.quiz.title}</h3>
                <p className="text-slate-400 mb-4">Test your knowledge with this quiz</p>
                <Link
                  to={`/lms/quiz/${courseId}/${currentLesson.quiz.id}`}
                  className="inline-block bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-2 rounded-xl hover:from-orange-700 hover:to-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                  Start Quiz
                </Link>
              </div>
            )}

            {/* Lesson Content */}
            {currentLesson.content && (
              <div className="prose prose-invert max-w-none bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6 mb-6">
                <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
              {/* Navigation Row (Mobile: full width) */}
              <div className="flex justify-between sm:contents gap-2">
                <button
                  onClick={goToPrevLesson}
                  disabled={getCurrentLessonIndex() <= 0}
                  className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] flex-1 sm:flex-initial"
                >
                  <FiChevronLeft /> <span className="hidden sm:inline">Previous</span>
                </button>

                <button
                  onClick={goToNextLesson}
                  disabled={getCurrentLessonIndex() >= (course.lessons?.length || 0) - 1}
                  className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] flex-1 sm:flex-initial sm:order-last"
                >
                  <span className="hidden sm:inline">Next</span> <FiChevronRight />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {!isLessonComplete(currentLesson.id) && (
                  <button onClick={handleMarkComplete}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 sm:py-2 rounded-xl hover:from-green-700 hover:to-green-600 transition-colors shadow-lg shadow-green-500/20 min-h-[48px]">
                    <FiCheck /> Mark Complete
                  </button>
                )}

                {progress?.isComplete && course.certificateEnabled && (
                  <Link to={`/lms/certificate/${courseId}`}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-6 py-3 sm:py-2 rounded-xl hover:from-yellow-700 hover:to-yellow-600 transition-colors shadow-lg shadow-yellow-500/20 min-h-[48px]">
                    <FiAward /> Get Certificate
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            Select a lesson to begin
          </div>
        )}
      </main>
    </div>
  );
}

