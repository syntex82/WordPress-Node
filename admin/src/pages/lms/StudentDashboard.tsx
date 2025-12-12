/**
 * LMS Student Dashboard
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lmsApi } from '../../services/api';

interface DashboardData {
  enrollments: any[];
  certificates: any[];
  stats: {
    totalCourses: number;
    completedCourses: number;
    totalCertificates: number;
  };
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setError(null);
      const response = await lmsApi.getDashboard();
      setData(response.data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view your learning dashboard.');
      } else {
        setError(err.response?.data?.message || 'Failed to load dashboard. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadDashboard}
            className="mt-2 text-red-700 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6">No data available</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Learning Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{data.stats.totalCourses}</div>
          <div className="text-gray-600">Enrolled Courses</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">{data.stats.completedCourses}</div>
          <div className="text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-yellow-600">{data.stats.totalCertificates}</div>
          <div className="text-gray-600">Certificates</div>
        </div>
      </div>

      {/* My Courses */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">My Courses</h2>
          <Link to="/lms/catalog" className="text-blue-600 hover:underline text-sm">Browse More</Link>
        </div>
        {data.enrollments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            You haven't enrolled in any courses yet.
            <Link to="/lms/catalog" className="text-blue-600 hover:underline ml-2">Browse courses</Link>
          </div>
        ) : (
          <div className="divide-y">
            {data.enrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                {enrollment.course.featuredImage ? (
                  <img src={enrollment.course.featuredImage} alt="" className="w-20 h-14 object-cover rounded" />
                ) : (
                  <div className="w-20 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white">📚</div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{enrollment.course.title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex-1 max-w-xs">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${enrollment.progress?.percent || 0}%` }} />
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{enrollment.progress?.percent || 0}% complete</span>
                  </div>
                </div>
                <Link to={`/lms/learn/${enrollment.courseId}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                  {enrollment.status === 'COMPLETED' ? 'Review' : 'Continue'}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      {data.certificates.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">My Certificates</h2>
          </div>
          <div className="divide-y">
            {data.certificates.map((cert: any) => (
              <div key={cert.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <h3 className="font-medium">{cert.course?.title}</h3>
                    <p className="text-sm text-gray-500">Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/lms/certificate/${cert.id}`}
                    className="text-blue-600 hover:underline text-sm">View</Link>
                  {cert.pdfUrl && (
                    <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="text-green-600 hover:underline text-sm">Download</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

