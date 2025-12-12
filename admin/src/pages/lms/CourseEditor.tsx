/**
 * LMS Course Editor Page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lmsAdminApi, Course } from '../../services/api';

const defaultCourse: Partial<Course> = {
  title: '',
  description: '',
  shortDescription: '',
  category: '',
  level: 'BEGINNER',
  priceType: 'FREE',
  priceAmount: 0,
  passingScorePercent: 80,
  certificateEnabled: true,
  estimatedHours: 0,
  whatYouLearn: [],
  requirements: [],
  status: 'DRAFT',
};

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [course, setCourse] = useState<Partial<Course>>(defaultCourse);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [whatYouLearnText, setWhatYouLearnText] = useState('');
  const [requirementsText, setRequirementsText] = useState('');

  useEffect(() => {
    if (!isNew && id) loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const { data } = await lmsAdminApi.getCourse(id!);
      setCourse(data);
      setWhatYouLearnText((data.whatYouLearn || []).join('\n'));
      setRequirementsText((data.requirements || []).join('\n'));
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...course,
        whatYouLearn: whatYouLearnText.split('\n').filter(Boolean),
        requirements: requirementsText.split('\n').filter(Boolean),
      };
      if (isNew) {
        const { data: newCourse } = await lmsAdminApi.createCourse(data);
        navigate(`/lms/courses/${newCourse.id}`);
      } else {
        await lmsAdminApi.updateCourse(id!, data);
      }
      alert('Course saved successfully!');
    } catch (error) {
      console.error('Failed to save course:', error);
      alert('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{isNew ? 'Create Course' : 'Edit Course'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input type="text" value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Short Description</label>
            <input type="text" value={course.shortDescription || ''} onChange={(e) => setCourse({ ...course, shortDescription: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" maxLength={200} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={course.description || ''} onChange={(e) => setCourse({ ...course, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 h-32" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input type="text" value={course.category || ''} onChange={(e) => setCourse({ ...course, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <select value={course.level} onChange={(e) => setCourse({ ...course, level: e.target.value as any })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="ALL_LEVELS">All Levels</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price Type</label>
              <select value={course.priceType} onChange={(e) => setCourse({ ...course, priceType: e.target.value as any })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            {course.priceType === 'PAID' && (
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input type="number" value={course.priceAmount || 0} onChange={(e) => setCourse({ ...course, priceAmount: parseFloat(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2" min="0" step="0.01" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={course.status} onChange={(e) => setCourse({ ...course, status: e.target.value as any })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Passing Score (%)</label>
              <input type="number" value={course.passingScorePercent} onChange={(e) => setCourse({ ...course, passingScorePercent: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2" min="0" max="100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Hours</label>
              <input type="number" value={course.estimatedHours || 0} onChange={(e) => setCourse({ ...course, estimatedHours: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2" min="0" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="certificateEnabled" checked={course.certificateEnabled}
              onChange={(e) => setCourse({ ...course, certificateEnabled: e.target.checked })} />
            <label htmlFor="certificateEnabled" className="text-sm">Enable Certificate on Completion</label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">What You'll Learn (one per line)</label>
            <textarea value={whatYouLearnText} onChange={(e) => setWhatYouLearnText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 h-24" placeholder="Learn to build web apps&#10;Master React..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Requirements (one per line)</label>
            <textarea value={requirementsText} onChange={(e) => setRequirementsText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 h-24" placeholder="Basic JavaScript knowledge&#10;A computer..." />
          </div>
        </div>
        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Course'}
          </button>
          <button type="button" onClick={() => navigate('/lms/courses')} className="border px-6 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}

