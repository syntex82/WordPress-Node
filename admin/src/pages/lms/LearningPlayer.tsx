/**
 * LMS Learning Player - Course learning interface
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lmsApi } from '../../services/api';

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
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      loadCourseData(); // Refresh progress
    } catch (error) {
      console.error('Failed to mark complete:', error);
    }
  };

  const isLessonComplete = (lessonId: string) => {
    return progress?.lessons.find(l => l.id === lessonId)?.completed || false;
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
            <h1 className="text-2xl font-bold mb-4">{currentLesson.title}</h1>
            
            {currentLesson.type === 'VIDEO' && currentLesson.videoAsset?.url && (
              <div className="aspect-video bg-black rounded-lg mb-6">
                <video src={currentLesson.videoAsset.url} controls className="w-full h-full rounded-lg" />
              </div>
            )}

            {currentLesson.content && (
              <div className="prose max-w-none bg-white rounded-lg p-6 shadow mb-6">
                <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
              </div>
            )}

            <div className="flex justify-between items-center">
              {!isLessonComplete(currentLesson.id) ? (
                <button onClick={handleMarkComplete}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                  Mark as Complete
                </button>
              ) : (
                <span className="text-green-600 font-medium">✓ Completed</span>
              )}

              {progress?.isComplete && (
                <Link to={`/lms/certificate/${courseId}`}
                  className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">
                  🏆 Get Certificate
                </Link>
              )}
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

