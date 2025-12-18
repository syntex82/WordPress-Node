/**
 * LMS Course Categories Management Page
 * Displays categories extracted from courses with course counts
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lmsAdminApi, Course } from '../../services/api';
import { FiTag, FiBook, FiPlus, FiArrowRight, FiRefreshCw } from 'react-icons/fi';

interface CategoryInfo {
  name: string;
  courseCount: number;
  courses: { id: string; title: string; status: string }[];
}

export default function CourseCategories() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all courses to extract categories with counts
      const { data } = await lmsAdminApi.getCourses({ limit: 1000 });
      const courses = data?.courses || [];
      
      // Group courses by category
      const categoryMap = new Map<string, CategoryInfo>();
      
      courses.forEach((course: Course) => {
        const categoryName = course.category || 'Uncategorized';
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            name: categoryName,
            courseCount: 0,
            courses: [],
          });
        }
        const cat = categoryMap.get(categoryName)!;
        cat.courseCount++;
        cat.courses.push({
          id: course.id,
          title: course.title,
          status: course.status,
        });
      });
      
      // Sort by course count (descending), then by name
      const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => {
        if (b.courseCount !== a.courseCount) return b.courseCount - a.courseCount;
        return a.name.localeCompare(b.name);
      });
      
      setCategories(sortedCategories);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-500/20 text-green-400';
      case 'DRAFT': return 'bg-slate-500/20 text-slate-400';
      case 'ARCHIVED': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Course Categories</h1>
          <p className="text-sm text-slate-400 mt-1">
            Categories are automatically extracted from courses. Create a new course with a category to add it here.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadCategories}
            className="flex items-center gap-2 px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
          <Link
            to="/lms/courses/new"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition-all"
          >
            <FiPlus size={18} />
            New Course
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={loadCategories} className="mt-3 text-red-300 hover:text-red-200 font-medium transition-colors">
            Try Again
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-12 text-center">
          <FiTag className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-white mb-2">No categories yet</h3>
          <p className="text-slate-400 mb-4">
            Categories are created when you add a category to a course.
          </p>
          <Link
            to="/lms/courses/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition-all"
          >
            <FiPlus size={18} />
            Create Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.name} className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <FiTag className="text-blue-400" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{category.name}</h3>
                      <p className="text-sm text-slate-400">
                        {category.courseCount} {category.courseCount === 1 ? 'course' : 'courses'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Course list preview */}
                <div className="space-y-2 mb-4">
                  {category.courses.slice(0, 3).map((course) => (
                    <Link
                      key={course.id}
                      to={`/lms/courses/${course.id}`}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-700/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FiBook className="text-slate-500 flex-shrink-0" size={14} />
                        <span className="text-sm text-slate-300 truncate">{course.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(course.status)}`}>
                        {course.status}
                      </span>
                    </Link>
                  ))}
                  {category.courses.length > 3 && (
                    <p className="text-xs text-slate-500 pl-2">
                      +{category.courses.length - 3} more courses
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-slate-700/30 border-t border-slate-700/50">
                <Link
                  to={`/lms/courses?category=${encodeURIComponent(category.name)}`}
                  className="flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  View all courses
                  <FiArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

