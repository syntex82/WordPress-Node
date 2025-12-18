/**
 * LMS Course Landing Page
 * Supports free enrollment and paid course purchases
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { lmsApi, cartApi, Course } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiPlay, FiCheck, FiClock, FiUsers, FiAward, FiBookOpen } from 'react-icons/fi';

export default function CourseLanding() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const autoEnrollTriggered = useRef(false);

  useEffect(() => {
    loadCourse();
  }, [slug]);

  // Auto-enroll if redirected from theme with ?enroll=true
  useEffect(() => {
    if (course && !loading && searchParams.get('enroll') === 'true' && !autoEnrollTriggered.current && !isEnrolled) {
      autoEnrollTriggered.current = true;
      handleEnroll();
    }
  }, [course, loading, searchParams, isEnrolled]);

  const loadCourse = async () => {
    if (!slug) {
      console.error('No slug provided');
      setLoading(false);
      return;
    }
    try {
      console.log('Loading course:', slug);
      const { data } = await lmsApi.getCourse(slug);
      console.log('Course loaded:', data);
      setCourse(data);

      if (isAuthenticated && data?.id) {
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

    // For paid courses, add to cart
    if (course.priceType === 'PAID' && course.priceAmount && course.priceAmount > 0) {
      setEnrolling(true);
      try {
        await cartApi.addCourse(course.id);
        toast.success('Course added to cart!');
        navigate('/cart');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to add to cart');
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // For free courses, enroll directly
    setEnrolling(true);
    try {
      await lmsApi.enroll(course.id);
      setIsEnrolled(true);
      toast.success('Successfully enrolled!');
      navigate(`/lms/learn/${course.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500"></div>
    </div>
  );
  if (!course) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Course not found</div>;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                {course.level && <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{course.level.replace('_', ' ')}</span>}
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
            <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-2xl border border-slate-700/50">
              {course.featuredImage && (
                <img src={course.featuredImage} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
              )}
              <div className="text-3xl font-bold mb-4">
                {course.priceType === 'FREE' ? 'Free' : `$${course.priceAmount?.toFixed(2)}`}
              </div>
              {isEnrolled ? (
                <button onClick={() => navigate(`/lms/learn/${course.id}`)}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20">
                  <FiPlay /> Continue Learning
                </button>
              ) : course.priceType === 'FREE' ? (
                <button onClick={handleEnroll} disabled={enrolling}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                  {enrolling ? 'Enrolling...' : <><FiCheck /> Enroll for Free</>}
                </button>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-500/20">
                  {enrolling ? 'Adding to Cart...' : <><FiShoppingCart /> Add to Cart</>}
                </button>
              )}

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                {course.certificateEnabled && (
                  <p className="flex items-center gap-2"><FiAward className="text-yellow-400" /> Certificate on completion</p>
                )}
                <p className="flex items-center gap-2"><FiBookOpen /> {course._count?.lessons || 0} lessons</p>
                {course.estimatedHours && (
                  <p className="flex items-center gap-2"><FiClock /> {course.estimatedHours} hours of content</p>
                )}
                <p className="flex items-center gap-2"><FiUsers /> {course._count?.enrollments || 0} students enrolled</p>
              </div>
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
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                <h2 className="text-xl font-bold text-white mb-4">What you'll learn</h2>
                <ul className="grid md:grid-cols-2 gap-3">
                  {(course.whatYouLearn as string[]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="text-green-400">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Description</h2>
              <div className="prose prose-invert max-w-none text-slate-300">{course.description}</div>
            </div>

            {/* Curriculum */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Curriculum</h2>
              <ul className="divide-y divide-slate-700/50">
                {course.lessons?.map((lesson, i) => (
                  <li key={lesson.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">{i + 1}</span>
                      <span className="text-slate-300">{lesson.title}</span>
                      {lesson.isPreview && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-lg">Preview</span>}
                    </div>
                    <span className="text-sm text-slate-500">{lesson.estimatedMinutes} min</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {course.requirements && course.requirements.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                <h3 className="font-bold text-white mb-3">Requirements</h3>
                <ul className="space-y-2 text-sm text-slate-400">
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

