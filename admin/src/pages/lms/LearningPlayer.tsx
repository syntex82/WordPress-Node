/**
 * LMS Learning Player - Course learning interface
 * Enhanced with video progress tracking and external video support
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { lmsApi } from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiPlay, FiChevronLeft, FiChevronRight, FiAward, FiBookOpen, FiFileText } from 'react-icons/fi';

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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <Link to={`/lms/course/${course.slug}`} className="text-blue-600 text-sm hover:underline">← Back to Course</Link>
          <h2 className="font-bold text-lg mt-2">{course.title}</h2>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress?.percentComplete || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress?.percentComplete || 0}%` }} />
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {course.lessons?.map((lesson: any, index: number) => (
            <button
              key={lesson.id}
              onClick={() => loadLesson(lesson.id)}
              className={`w-full text-left px-4 py-3 border-b flex items-center gap-3 hover:bg-gray-50 ${
                currentLesson?.id === lesson.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                isLessonComplete(lesson.id) ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {isLessonComplete(lesson.id) ? '✓' : index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{lesson.title}</div>
                <div className="text-xs text-gray-500">{lesson.type} • {lesson.estimatedMinutes || 0} min</div>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {currentLesson ? (
          <div className="max-w-4xl mx-auto p-8">
            {/* Lesson Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-lg ${
                  currentLesson.type === 'VIDEO' ? 'bg-purple-100 text-purple-600' :
                  currentLesson.type === 'QUIZ' ? 'bg-orange-100 text-orange-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {currentLesson.type === 'VIDEO' ? <FiPlay /> :
                   currentLesson.type === 'QUIZ' ? <FiFileText /> : <FiBookOpen />}
                </span>
                <div>
                  <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
                  <p className="text-sm text-gray-500">
                    Lesson {getCurrentLessonIndex() + 1} of {course.lessons?.length || 0}
                  </p>
                </div>
              </div>
              {isLessonComplete(currentLesson.id) && (
                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <FiCheck /> Completed
                </span>
              )}
            </div>

            {/* Video Player */}
            {currentLesson.type === 'VIDEO' && currentLesson.videoAsset && (
              <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden">
                {getVideoEmbed(currentLesson.videoAsset)}
              </div>
            )}

            {/* Quiz Link */}
            {currentLesson.type === 'QUIZ' && currentLesson.quiz && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6 text-center">
                <FiFileText className="text-4xl text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{currentLesson.quiz.title}</h3>
                <p className="text-gray-600 mb-4">Test your knowledge with this quiz</p>
                <Link
                  to={`/lms/quiz/${courseId}/${currentLesson.quiz.id}`}
                  className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
                >
                  Start Quiz
                </Link>
              </div>
            )}

            {/* Lesson Content */}
            {currentLesson.content && (
              <div className="prose max-w-none bg-white rounded-lg p-6 shadow mb-6">
                <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow">
              <button
                onClick={goToPrevLesson}
                disabled={getCurrentLessonIndex() <= 0}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft /> Previous
              </button>

              <div className="flex items-center gap-4">
                {!isLessonComplete(currentLesson.id) && currentLesson.type !== 'VIDEO' && (
                  <button onClick={handleMarkComplete}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                    <FiCheck /> Mark Complete
                  </button>
                )}

                {progress?.isComplete && course.certificateEnabled && (
                  <Link to={`/lms/certificate/${courseId}`}
                    className="flex items-center gap-2 bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">
                    <FiAward /> Get Certificate
                  </Link>
                )}
              </div>

              <button
                onClick={goToNextLesson}
                disabled={getCurrentLessonIndex() >= (course.lessons?.length || 0) - 1}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a lesson to begin
          </div>
        )}
      </main>
    </div>
  );
}

