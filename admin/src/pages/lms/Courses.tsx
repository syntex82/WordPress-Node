/**
 * LMS Courses List Page
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lmsAdminApi, Course } from '../../services/api';

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCourses();
  }, [page, statusFilter]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await lmsAdminApi.getCourses({ page, limit: 10, status: statusFilter || undefined });
      setCourses(data?.courses || []);
      setTotalPages(data?.pagination?.pages || 1);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await lmsAdminApi.deleteCourse(id);
      loadCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-yellow-100 text-yellow-800',
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Link to="/lms/courses/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Create Course
        </Link>
      </div>

      <div className="mb-4 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button onClick={loadCourses} className="mt-2 text-red-700 hover:underline">Try Again</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lessons</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollments</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {course.featuredImage && (
                        <img src={course.featuredImage} alt="" className="w-12 h-12 rounded object-cover mr-3" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{course.title}</div>
                        <div className="text-sm text-gray-500">{course.category || 'Uncategorized'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                  <td className="px-6 py-4">
                    {course.priceType === 'FREE' ? 'Free' : `$${course.priceAmount?.toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4">{course._count?.lessons || 0}</td>
                  <td className="px-6 py-4">{course._count?.enrollments || 0}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link to={`/lms/courses/${course.id}`} className="text-blue-600 hover:text-blue-800">Edit</Link>
                    <Link to={`/lms/courses/${course.id}/lessons`} className="text-green-600 hover:text-green-800">Lessons</Link>
                    <Link to={`/lms/courses/${course.id}/quizzes`} className="text-purple-600 hover:text-purple-800">Quizzes</Link>
                    <button onClick={() => handleDelete(course.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-6 py-4 flex justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <span className="px-3 py-1">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

