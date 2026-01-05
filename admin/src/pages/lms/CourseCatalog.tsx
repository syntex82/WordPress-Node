/**
 * LMS Course Catalog - Public course listing
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lmsApi, Course } from '../../services/api';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ category: '', level: '', priceType: '' });

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesRes, categoriesRes] = await Promise.all([
        lmsApi.getCourses({ page, limit: 12, ...filters }),
        lmsApi.getCategories(),
      ]);
      setCourses(coursesRes.data?.courses || []);
      setTotalPages(coursesRes.data?.pagination?.pages || 1);
      setCategories(categoriesRes.data || []);
    } catch (err: any) {
      console.error('Failed to load courses:', err);
      setError(err.response?.data?.message || 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      BEGINNER: 'bg-green-500/20 text-green-400',
      INTERMEDIATE: 'bg-yellow-500/20 text-yellow-400',
      ADVANCED: 'bg-red-500/20 text-red-400',
      ALL_LEVELS: 'bg-blue-500/20 text-blue-400',
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[level] || 'bg-slate-700'}`}>{level.replace('_', ' ')}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">Course Catalog</h1>
          <p className="text-base md:text-xl opacity-90">Expand your skills with our expert-led courses</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Error display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button onClick={loadData} className="mt-2 text-red-400 hover:text-red-300 underline transition-colors">Try Again</button>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <option value="">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
          <select value={filters.priceType} onChange={(e) => setFilters({ ...filters, priceType: e.target.value })}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <option value="">All Prices</option>
            <option value="FREE">Free</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No courses found</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link key={course.id} to={`/lms/course/${course.slug}`} className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all hover:scale-[1.02]">
                  <img
                    src={course.featuredImage || '/api/lms/courses/placeholder-image'}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/api/lms/courses/placeholder-image'; }}
                  />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getLevelBadge(course.level)}
                      {course.category && <span className="text-xs text-slate-400">{course.category}</span>}
                    </div>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 text-white">{course.title}</h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.shortDescription || course.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        {course._count?.lessons || 0} lessons
                      </div>
                      <div className="font-bold text-lg">
                        {course.priceType === 'PAID' ? (
                          <span className="text-white">${Number(course.priceAmount || 0).toFixed(2)}</span>
                        ) : (
                          <span className="text-green-400">Free</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-6 md:mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-700/50 rounded-xl text-slate-300 disabled:opacity-50 hover:bg-slate-800/50 transition-colors">Previous</button>
                <span className="px-4 py-2 text-slate-400 text-sm md:text-base">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-700/50 rounded-xl text-slate-300 disabled:opacity-50 hover:bg-slate-800/50 transition-colors">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

