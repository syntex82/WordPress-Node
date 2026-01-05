/**
 * LMS Courses List Page
 * Comprehensive course management with filtering, search, and bulk actions
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lmsAdminApi, Course } from '../../services/api';
import { useThemeClasses } from '../../contexts/SiteThemeContext';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiList, FiHelpCircle, FiUsers, FiBook, FiFolder } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Courses() {
  const theme = useThemeClasses();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadCourses();
  }, [page, statusFilter, categoryFilter, search]);

  const loadCategories = async () => {
    try {
      const { data } = await lmsAdminApi.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await lmsAdminApi.getCourses({
        page,
        limit: 10,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      // Filter by search client-side if API doesn't support it
      let filteredCourses = data?.courses || [];
      if (search) {
        const searchLower = search.toLowerCase();
        filteredCourses = filteredCourses.filter(c =>
          c.title.toLowerCase().includes(searchLower) ||
          c.shortDescription?.toLowerCase().includes(searchLower) ||
          c.instructor?.name?.toLowerCase().includes(searchLower)
        );
      }
      setCourses(filteredCourses);
      setTotalPages(data?.pagination?.pages || 1);
      setTotal(data?.pagination?.total || 0);
    } catch (err: any) {
      console.error('Failed to load courses:', err);
      if (err.response?.status === 401) {
        setError('Please log in to access courses.');
      } else {
        setError(err.response?.data?.message || 'Failed to load courses. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all lessons, quizzes, and enrollments.')) return;
    try {
      await lmsAdminApi.deleteCourse(id);
      toast.success('Course deleted successfully');
      loadCourses();
    } catch (error: any) {
      console.error('Failed to delete course:', error);
      const message = error.response?.data?.message || 'Failed to delete course';
      toast.error(message);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-slate-500/20 text-slate-300',
      PUBLISHED: 'bg-green-500/20 text-green-400',
      ARCHIVED: 'bg-yellow-500/20 text-yellow-400',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-slate-500/20 text-slate-300'}`}>{status}</span>;
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      BEGINNER: 'bg-blue-500/20 text-blue-400',
      INTERMEDIATE: 'bg-purple-500/20 text-purple-400',
      ADVANCED: 'bg-red-500/20 text-red-400',
      ALL_LEVELS: 'bg-teal-500/20 text-teal-400',
    };
    const labels: Record<string, string> = {
      BEGINNER: 'Beginner',
      INTERMEDIATE: 'Intermediate',
      ADVANCED: 'Advanced',
      ALL_LEVELS: 'All Levels',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[level] || 'bg-slate-500/20 text-slate-300'}`}>{labels[level] || level}</span>;
  };

  return (
    <div className={`min-h-screen p-6 ${theme.page}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${theme.titleGradient}`}>Courses</h1>
          <p className={`text-sm mt-1 ${theme.textMuted}`}>{total} courses total</p>
        </div>
        <Link
          to="/lms/courses/new"
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-500 hover:to-blue-400 flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          <FiPlus size={18} />
          Create Course
        </Link>
      </div>

      {/* Filters */}
      <div className={`backdrop-blur rounded-xl border p-4 mb-6 ${theme.card}`}>
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
            <input
              type="text"
              placeholder="Search courses by title, description, or instructor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`w-full rounded-xl pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${theme.input}`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={`rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${theme.select}`}
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className={`rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${theme.select}`}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            type="submit"
            className={`px-4 py-2 rounded-xl transition-colors ${theme.buttonSecondary}`}
          >
            Search
          </button>
        </form>
      </div>

      {/* Courses Table */}
      {loading ? (
        <div className={`backdrop-blur rounded-xl border p-8 flex justify-center ${theme.card}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={loadCourses} className="mt-3 text-red-300 hover:text-red-200 font-medium">Try Again</button>
        </div>
      ) : courses.length === 0 ? (
        <div className={`backdrop-blur rounded-xl border p-12 text-center ${theme.card}`}>
          <FiBook className={`mx-auto mb-4 ${theme.textMuted}`} size={48} />
          <h3 className={`text-lg font-medium mb-2 ${theme.textPrimary}`}>No courses found</h3>
          <p className={`mb-4 ${theme.textMuted}`}>
            {search || statusFilter || categoryFilter
              ? 'Try adjusting your filters or search terms'
              : 'Get started by creating your first course'}
          </p>
          {!search && !statusFilter && !categoryFilter && (
            <Link to="/lms/courses/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
              <FiPlus size={18} />
              Create Course
            </Link>
          )}
        </div>
      ) : (
        <div className={`backdrop-blur rounded-xl border overflow-hidden ${theme.card}`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${theme.border}`}>
              <thead className={theme.tableHeader}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Course</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Instructor</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Price</th>
                  <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Content</th>
                  <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Enrollments</th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border}`}>
                {courses.map((course) => (
                  <tr key={course.id} className={theme.tableRow}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden ${theme.isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                          <img
                            src={course.featuredImage || '/api/lms/courses/placeholder-image'}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/api/lms/courses/placeholder-image'; }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className={`font-medium ${theme.textPrimary}`}>{course.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${theme.textMuted}`}>{course.category || 'Uncategorized'}</span>
                            {course.level && getLevelBadge(course.level)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {course.instructor ? (
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium mr-2">
                            {course.instructor.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className={`text-sm ${theme.textPrimary}`}>{course.instructor.name}</span>
                        </div>
                      ) : (
                        <span className={`text-sm ${theme.textMuted}`}>No instructor</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                    <td className="px-6 py-4">
                      {course.priceType === 'PAID' ? (
                        <span className={`font-medium ${theme.textPrimary}`}>${Number(course.priceAmount || 0).toFixed(2)}</span>
                      ) : (
                        <span className="text-green-400 font-medium">Free</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center justify-center gap-4 text-sm ${theme.textMuted}`}>
                        <div className="flex items-center gap-1" title="Lessons">
                          <FiList size={14} />
                          <span>{course._count?.lessons || 0}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Quizzes">
                          <FiHelpCircle size={14} />
                          <span>{course._count?.quizzes || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`flex items-center justify-center gap-1 ${theme.textMuted}`}>
                        <FiUsers size={14} />
                        <span className="font-medium">{course._count?.enrollments || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/lms/courses/${course.id}`}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Edit Course"
                        >
                          <FiEdit2 size={16} />
                        </Link>
                        <Link
                          to={`/lms/courses/${course.id}/curriculum`}
                          className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                          title="Curriculum Builder"
                        >
                          <FiFolder size={16} />
                        </Link>
                        <Link
                          to={`/lms/courses/${course.id}/lessons`}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Manage Lessons"
                        >
                          <FiList size={16} />
                        </Link>
                        <Link
                          to={`/lms/courses/${course.id}/quizzes`}
                          className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                          title="Manage Quizzes"
                        >
                          <FiHelpCircle size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete Course"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`px-6 py-4 border-t flex items-center justify-between ${theme.border} ${theme.tableHeader}`}>
              <p className={`text-sm ${theme.textMuted}`}>
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} courses
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${theme.buttonSecondary}`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && page > 3) {
                      pageNum = Math.min(page - 2 + i, totalPages);
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl transition-colors ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : theme.buttonSecondary
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${theme.buttonSecondary}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

