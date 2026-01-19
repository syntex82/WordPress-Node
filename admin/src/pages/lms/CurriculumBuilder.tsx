/**
 * LMS Curriculum Builder - Advanced course structure with modules and lessons
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lmsAdminApi, CourseModule, Lesson, Course } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight,
  FiVideo, FiFileText, FiHelpCircle, FiClipboard, FiMove,
  FiX, FiFolder, FiFolderPlus
} from 'react-icons/fi';

interface ModuleWithLessons extends CourseModule { lessons?: Lesson[]; isExpanded?: boolean; }

export default function CurriculumBuilder() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [unassignedLessons, setUnassignedLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Partial<CourseModule> | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> & { targetModuleId?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [courseId]);

  const loadData = async () => {
    try {
      const [courseRes, modulesRes, lessonsRes] = await Promise.all([
        lmsAdminApi.getCourse(courseId!), lmsAdminApi.getModules(courseId!), lmsAdminApi.getLessons(courseId!),
      ]);
      setCourse(courseRes.data);
      const modulesData = modulesRes.data.map(m => ({ ...m, isExpanded: true }));
      setModules(modulesData);
      const assignedIds = new Set(modulesData.flatMap(m => m.lessons?.map(l => l.id) || []));
      setUnassignedLessons(lessonsRes.data.filter(l => !l.moduleId && !assignedIds.has(l.id)));
    } catch (error) {
      toast.error('Failed to load curriculum');
    } finally { setLoading(false); }
  };

  const toggleModule = (id: string) => setModules(p => p.map(m => m.id === id ? { ...m, isExpanded: !m.isExpanded } : m));

  const handleSaveModule = async () => {
    if (!editingModule?.title?.trim()) { toast.error('Module title required'); return; }
    setSaving(true);
    try {
      // Only send allowed DTO fields
      const moduleData = { title: editingModule.title, description: editingModule.description, orderIndex: editingModule.orderIndex, isPublished: editingModule.isPublished };
      if (editingModule.id) await lmsAdminApi.updateModule(courseId!, editingModule.id, moduleData);
      else await lmsAdminApi.createModule(courseId!, moduleData);
      toast.success(editingModule.id ? 'Module updated!' : 'Module created!');
      setShowModuleModal(false); setEditingModule(null); loadData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to save module'); }
    finally { setSaving(false); }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm('Delete module? Lessons become unassigned.')) return;
    try { await lmsAdminApi.deleteModule(courseId!, id); toast.success('Deleted'); loadData(); }
    catch { toast.error('Failed'); }
  };

  const handleSaveLesson = async () => {
    if (!editingLesson?.title?.trim()) { toast.error('Lesson title required'); return; }
    setSaving(true);
    try {
      const data = { ...editingLesson, moduleId: editingLesson.targetModuleId || undefined };
      delete (data as any).targetModuleId;
      if (editingLesson.id) await lmsAdminApi.updateLesson(courseId!, editingLesson.id, data);
      else await lmsAdminApi.createLesson(courseId!, data);
      toast.success(editingLesson.id ? 'Lesson updated!' : 'Lesson created!');
      setShowLessonModal(false); setEditingLesson(null); loadData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to save lesson'); }
    finally { setSaving(false); }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Delete lesson?')) return;
    try { await lmsAdminApi.deleteLesson(courseId!, id); toast.success('Deleted'); loadData(); }
    catch { toast.error('Failed'); }
  };

  const handleMoveLesson = async (lessonId: string, moduleId: string | null) => {
    try { await lmsAdminApi.moveLessonToModule(courseId!, lessonId, moduleId); toast.success('Moved!'); loadData(); }
    catch { toast.error('Failed'); }
  };

  const getLessonIcon = (type: string) => ({
    VIDEO: <FiVideo className="text-purple-400" />, ARTICLE: <FiFileText className="text-blue-400" />,
    QUIZ: <FiHelpCircle className="text-amber-400" />, ASSIGNMENT: <FiClipboard className="text-green-400" />,
  }[type] || <FiFileText />);

  if (loading) return <div className="p-4 md:p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500" /></div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Link to="/lms/courses" className="text-blue-400 hover:text-blue-300 text-sm">← Back to Courses</Link>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent line-clamp-2">Curriculum: {course?.title}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button onClick={() => { setEditingModule({ title: '', description: '', isPublished: true }); setShowModuleModal(true); }} className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm"><FiFolderPlus /> <span className="hidden sm:inline">Add</span> Module</button>
          <button onClick={() => { setEditingLesson({ title: '', type: 'VIDEO', isPreview: false, isRequired: true }); setShowLessonModal(true); }} className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 rounded-xl text-sm"><FiPlus /> <span className="hidden sm:inline">Add</span> Lesson</button>
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((mod) => (
          <div key={mod.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 border-b border-slate-700/50">
              <div className="flex items-center gap-2 md:gap-3 flex-1 cursor-pointer min-w-0" onClick={() => toggleModule(mod.id)}>
                {mod.isExpanded ? <FiChevronDown className="flex-shrink-0" /> : <FiChevronRight className="flex-shrink-0" />}<FiFolder className="text-emerald-400 flex-shrink-0" />
                <div className="min-w-0"><h3 className="font-semibold text-white truncate">{mod.title}</h3><p className="text-xs text-slate-400">{mod.lessons?.length || 0} lessons</p></div>
              </div>
              <div className="flex gap-1 items-center ml-auto sm:ml-0">
                <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${mod.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'}`}>{mod.isPublished ? 'Published' : 'Draft'}</span>
                <button onClick={() => { setEditingModule(mod); setShowModuleModal(true); }} className="p-2 hover:text-blue-400"><FiEdit2 /></button>
                <button onClick={() => handleDeleteModule(mod.id)} className="p-2 hover:text-red-400"><FiTrash2 /></button>
              </div>
            </div>
            {mod.isExpanded && (
              <div className="divide-y divide-slate-700/30">
                {!mod.lessons?.length ? <div className="p-4 text-center text-slate-500 text-sm">No lessons</div> : mod.lessons.map(l => (
                  <div key={l.id} className="p-3 pl-6 md:pl-12 flex flex-col sm:flex-row justify-between gap-2 hover:bg-slate-700/20 group">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0"><FiMove className="text-slate-600 opacity-0 group-hover:opacity-100 hidden sm:block flex-shrink-0" />{getLessonIcon(l.type)}<span className="text-white truncate">{l.title}</span>{l.isPreview && <span className="text-xs bg-green-500/20 text-green-400 px-1 rounded whitespace-nowrap">Preview</span>}</div>
                    <div className="flex gap-1 sm:opacity-0 group-hover:opacity-100 ml-auto sm:ml-0">
                      <select onChange={e => handleMoveLesson(l.id, e.target.value || null)} className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 max-w-[100px] sm:max-w-none"><option value="">Move...</option><option value="">Unassigned</option>{modules.filter(m => m.id !== mod.id).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select>
                      <button onClick={() => { setEditingLesson({ ...l, targetModuleId: l.moduleId }); setShowLessonModal(true); }} className="p-1 hover:text-blue-400"><FiEdit2 size={14} /></button>
                      <button onClick={() => handleDeleteLesson(l.id)} className="p-1 hover:text-red-400"><FiTrash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                <button onClick={() => { setEditingLesson({ title: '', type: 'VIDEO', isPreview: false, isRequired: true, targetModuleId: mod.id }); setShowLessonModal(true); }} className="w-full p-3 pl-6 md:pl-12 text-slate-500 hover:text-blue-400 flex items-center gap-2 text-sm"><FiPlus /> Add lesson</button>
              </div>
            )}
          </div>
        ))}

        {unassignedLessons.length > 0 && (
          <div className="bg-slate-800/30 rounded-xl border border-dashed border-slate-600/50 overflow-hidden">
            <div className="p-3 md:p-4 flex items-center gap-3 bg-slate-800/50 border-b border-slate-700/30"><FiFolder className="text-slate-500" /><h3 className="font-medium text-slate-400">Unassigned Lessons</h3><span className="text-xs text-slate-500">{unassignedLessons.length}</span></div>
            <div className="divide-y divide-slate-700/20">
              {unassignedLessons.map(l => (
                <div key={l.id} className="p-3 pl-6 md:pl-12 flex flex-col sm:flex-row justify-between gap-2 hover:bg-slate-700/20 group">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">{getLessonIcon(l.type)}<span className="text-slate-300 truncate">{l.title}</span></div>
                  <div className="flex gap-1 sm:opacity-0 group-hover:opacity-100 ml-auto sm:ml-0">
                    <select onChange={e => e.target.value && handleMoveLesson(l.id, e.target.value)} className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 max-w-[100px] sm:max-w-none"><option value="">Move to...</option>{modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select>
                    <button onClick={() => { setEditingLesson({ ...l }); setShowLessonModal(true); }} className="p-1 hover:text-blue-400"><FiEdit2 size={14} /></button>
                    <button onClick={() => handleDeleteLesson(l.id)} className="p-1 hover:text-red-400"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Module Modal */}
      {showModuleModal && editingModule && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{editingModule.id ? 'Edit Module' : 'New Module'}</h2>
              <button onClick={() => setShowModuleModal(false)} className="p-2 hover:bg-slate-700 rounded-lg"><FiX /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1">Title</label><input value={editingModule.title || ''} onChange={e => setEditingModule({ ...editingModule, title: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Description</label><textarea value={editingModule.description || ''} onChange={e => setEditingModule({ ...editingModule, description: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white h-20" /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editingModule.isPublished ?? true} onChange={e => setEditingModule({ ...editingModule, isPublished: e.target.checked })} className="rounded" /><span className="text-slate-300">Published</span></label>
            </div>
            <div className="p-4 border-t border-slate-700 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button onClick={() => setShowModuleModal(false)} className="w-full sm:w-auto px-4 py-2.5 text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleSaveModule} disabled={saving} className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Module'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && editingLesson && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{editingLesson.id ? 'Edit Lesson' : 'New Lesson'}</h2>
              <button onClick={() => setShowLessonModal(false)} className="p-2 hover:bg-slate-700 rounded-lg"><FiX /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm text-slate-400 mb-1">Title</label><input value={editingLesson.title || ''} onChange={e => setEditingLesson({ ...editingLesson, title: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
              <div><label className="block text-sm text-slate-400 mb-1">Type</label><select value={editingLesson.type || 'VIDEO'} onChange={e => setEditingLesson({ ...editingLesson, type: e.target.value as any })} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white"><option value="VIDEO">Video</option><option value="ARTICLE">Article</option><option value="QUIZ">Quiz</option><option value="ASSIGNMENT">Assignment</option></select></div>
              <div><label className="block text-sm text-slate-400 mb-1">Module</label><select value={editingLesson.targetModuleId || ''} onChange={e => setEditingLesson({ ...editingLesson, targetModuleId: e.target.value || undefined })} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white"><option value="">No module (unassigned)</option>{modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
              <div><label className="block text-sm text-slate-400 mb-1">Content</label><textarea value={editingLesson.content || ''} onChange={e => setEditingLesson({ ...editingLesson, content: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white h-24" /></div>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={editingLesson.isPreview ?? false} onChange={e => setEditingLesson({ ...editingLesson, isPreview: e.target.checked })} className="rounded" /><span className="text-slate-300">Free Preview</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editingLesson.isRequired ?? true} onChange={e => setEditingLesson({ ...editingLesson, isRequired: e.target.checked })} className="rounded" /><span className="text-slate-300">Required</span></label>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button onClick={() => setShowLessonModal(false)} className="w-full sm:w-auto px-4 py-2.5 text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleSaveLesson} disabled={saving} className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Lesson'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
