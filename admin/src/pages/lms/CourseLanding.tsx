/**
 * LMS Course Landing Page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lmsApi, Course } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function CourseLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [slug]);

  const loadCourse = async () => {
    try {
      const { data } = await lmsApi.getCourse(slug!);
      setCourse(data);
      
      if (isAuthenticated) {
        try {
          await lmsApi.getEnrollment(data.id);
          setIsEnrolled(true);
        } catch {
          setIsEnrolled(false);
        }
      }
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!course) return;

    setEnrolling(true);
    try {
      await lmsApi.enroll(course.id);
      setIsEnrolled(true);
      navigate(`/lms/learn/${course.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{course.level.replace('_', ' ')}</span>
                {course.category && <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{course.category}</span>}
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl opacity-90 mb-6">{course.shortDescription}</p>
              <div className="flex items-center gap-6 text-sm">
                <span>👤 {course.instructor?.name}</span>
                <span>📚 {course._count?.lessons || 0} lessons</span>
                {course.estimatedHours && <span>⏱️ {course.estimatedHours} hours</span>}
                <span>👥 {course._count?.enrollments || 0} students</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 text-gray-900 shadow-xl">
              {course.featuredImage && (
                <img src={course.featuredImage} alt="" className="w-full h-40 object-cover rounded-lg mb-4" />
              )}
              <div className="text-3xl font-bold mb-4">
                {course.priceType === 'FREE' ? 'Free' : `$${course.priceAmount?.toFixed(2)}`}
              </div>
              {isEnrolled ? (
                <button onClick={() => navigate(`/lms/learn/${course.id}`)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
                  Continue Learning
                </button>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {enrolling ? 'Enrolling...' : course.priceType === 'FREE' ? 'Enroll for Free' : 'Enroll Now'}
                </button>
              )}
              {course.certificateEnabled && (
                <p className="text-sm text-gray-500 mt-4 text-center">🏆 Certificate on completion</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* What you'll learn */}
            {course.whatYouLearn && course.whatYouLearn.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-xl font-bold mb-4">What you'll learn</h2>
                <ul className="grid md:grid-cols-2 gap-3">
                  {(course.whatYouLearn as string[]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <div className="prose max-w-none">{course.description}</div>
            </div>

            {/* Curriculum */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-bold mb-4">Curriculum</h2>
              <ul className="divide-y">
                {course.lessons?.map((lesson, i) => (
                  <li key={lesson.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{i + 1}</span>
                      <span>{lesson.title}</span>
                      {lesson.isPreview && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Preview</span>}
                    </div>
                    <span className="text-sm text-gray-500">{lesson.estimatedMinutes} min</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {course.requirements && course.requirements.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-bold mb-3">Requirements</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {(course.requirements as string[]).map((req, i) => (
                    <li key={i}>• {req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

