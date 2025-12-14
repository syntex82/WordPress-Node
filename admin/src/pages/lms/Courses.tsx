/**
 * LMS Courses List Page
 * Comprehensive course management with filtering, search, and bulk actions
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lmsAdminApi, Course } from '../../services/api';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiList, FiHelpCircle, FiUsers, FiBook } from 'react-icons/fi';

export default function Courses() {
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
      loadCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-yellow-100 text-yellow-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      BEGINNER: 'bg-blue-100 text-blue-800',
      INTERMEDIATE: 'bg-purple-100 text-purple-800',
      ADVANCED: 'bg-red-100 text-red-800',
      ALL_LEVELS: 'bg-teal-100 text-teal-800',
    };
    const labels: Record<string, string> = {
      BEGINNER: 'Beginner',
      INTERMEDIATE: 'Intermediate',
      ADVANCED: 'Advanced',
      ALL_LEVELS: 'All Levels',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[level] || 'bg-gray-100'}`}>{labels[level] || level}</span>;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500 mt-1">{total} courses total</p>
        </div>
        <Link
          to="/lms/courses/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <FiPlus size={18} />
          Create Course
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses by title, description, or instructor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Courses Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={loadCourses} className="mt-3 text-red-700 hover:underline font-medium">Try Again</button>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FiBook className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-500 mb-4">
            {search || statusFilter || categoryFilter
              ? 'Try adjusting your filters or search terms'
              : 'Get started by creating your first course'}
          </p>
          {!search && !statusFilter && !categoryFilter && (
            <Link to="/lms/courses/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <FiPlus size={18} />
              Create Course
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden bg-gray-100">
                          {course.featuredImage ? (
                            <img src={course.featuredImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <FiBook size={20} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{course.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{course.category || 'Uncategorized'}</span>
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
                          <span className="text-sm text-gray-900">{course.instructor.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No instructor</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                    <td className="px-6 py-4">
                      {course.priceType === 'FREE' ? (
                        <span className="text-green-600 font-medium">Free</span>
                      ) : (
                        <span className="font-medium">${Number(course.priceAmount || 0).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
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
                      <div className="flex items-center justify-center gap-1 text-gray-600">
                        <FiUsers size={14} />
                        <span className="font-medium">{course._count?.enrollments || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/lms/courses/${course.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Course"
                        >
                          <FiEdit2 size={16} />
                        </Link>
                        <Link
                          to={`/lms/courses/${course.id}/lessons`}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Manage Lessons"
                        >
                          <FiList size={16} />
                        </Link>
                        <Link
                          to={`/lms/courses/${course.id}/quizzes`}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Manage Quizzes"
                        >
                          <FiHelpCircle size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} courses
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
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
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-white border'
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
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
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

