/**
 * LMS Admin Dashboard - Overview of courses, enrollments, and revenue
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lmsAdminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { FiBook, FiUsers, FiDollarSign, FiTrendingUp, FiPlus, FiEye, FiEdit } from 'react-icons/fi';

interface DashboardStats {
  courses: { total: number; published: number; draft: number };
  enrollments: { total: number; active: number; completed: number };
  revenue: number;
  recentEnrollments: any[];
  topCourses: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const { data } = await lmsAdminApi.getDashboardStats();
      setStats(data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 flex items-center justify-center min-h-[400px]">Loading...</div>;
  if (!stats) return <div className="p-6 text-center text-red-600">Failed to load dashboard</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">LMS Dashboard</h1>
        <Link to="/lms/courses/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <FiPlus /> Create Course
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Courses</p>
              <p className="text-3xl font-bold">{stats.courses.total}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.courses.published} published, {stats.courses.draft} draft</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg"><FiBook size={24} /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Enrollments</p>
              <p className="text-3xl font-bold">{stats.enrollments.total}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.enrollments.active} active, {stats.enrollments.completed} completed</p>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-lg"><FiUsers size={24} /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold">${stats.revenue.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg"><FiDollarSign size={24} /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-3xl font-bold">{stats.enrollments.total > 0 ? ((stats.enrollments.completed / stats.enrollments.total) * 100).toFixed(0) : 0}%</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg"><FiTrendingUp size={24} /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Courses */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold">Top Courses</h2>
            <Link to="/lms/courses" className="text-blue-600 text-sm hover:underline">View All</Link>
          </div>
          <div className="divide-y">
            {stats.topCourses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No courses yet</div>
            ) : stats.topCourses.map((course: any) => (
              <div key={course.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="font-medium">{course.title}</h3>
                  <p className="text-sm text-gray-500">{course._count?.lessons || 0} lessons • {course._count?.enrollments || 0} students</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/lms/course/${course.slug}`} className="p-2 text-gray-400 hover:text-blue-600"><FiEye /></Link>
                  <Link to={`/lms/courses/${course.id}`} className="p-2 text-gray-400 hover:text-green-600"><FiEdit /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b"><h2 className="font-bold">Recent Enrollments</h2></div>
          <div className="divide-y">
            {stats.recentEnrollments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No enrollments yet</div>
            ) : stats.recentEnrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                  {enrollment.user?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{enrollment.user?.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-500">Enrolled in {enrollment.course?.title}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

