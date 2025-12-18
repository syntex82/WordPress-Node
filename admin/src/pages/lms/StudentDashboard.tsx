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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadDashboard}
            className="mt-2 text-red-400 hover:text-red-300 underline transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6 text-slate-400">No data available</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-6">My Learning Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
          <div className="text-3xl font-bold text-blue-400">{data.stats.totalCourses}</div>
          <div className="text-slate-400">Enrolled Courses</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
          <div className="text-3xl font-bold text-green-400">{data.stats.completedCourses}</div>
          <div className="text-slate-400">Completed</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
          <div className="text-3xl font-bold text-yellow-400">{data.stats.totalCertificates}</div>
          <div className="text-slate-400">Certificates</div>
        </div>
      </div>

      {/* My Courses */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 mb-8">
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">My Courses</h2>
          <Link to="/lms/catalog" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">Browse More</Link>
        </div>
        {data.enrollments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            You haven't enrolled in any courses yet.
            <Link to="/lms/catalog" className="text-blue-400 hover:text-blue-300 ml-2 transition-colors">Browse courses</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {data.enrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="p-4 flex items-center gap-4 hover:bg-slate-700/30 transition-colors">
                {enrollment.course.featuredImage ? (
                  <img src={enrollment.course.featuredImage} alt="" className="w-20 h-14 object-cover rounded-lg" />
                ) : (
                  <div className="w-20 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">📚</div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-white">{enrollment.course.title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex-1 max-w-xs">
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${enrollment.progress?.percent || 0}%` }} />
                      </div>
                    </div>
                    <span className="text-sm text-slate-400">{enrollment.progress?.percent || 0}% complete</span>
                  </div>
                </div>
                <Link to={`/lms/learn/${enrollment.courseId}`}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-600 text-sm transition-colors shadow-lg shadow-blue-500/20">
                  {enrollment.status === 'COMPLETED' ? 'Review' : 'Continue'}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      {data.certificates.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-bold text-white">My Certificates</h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            {data.certificates.map((cert: any) => (
              <div key={cert.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <h3 className="font-medium text-white">{cert.course?.title}</h3>
                    <p className="text-sm text-slate-400">Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/lms/certificate/${cert.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors">View</Link>
                  {cert.pdfUrl && (
                    <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 text-sm transition-colors">Download</a>
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

