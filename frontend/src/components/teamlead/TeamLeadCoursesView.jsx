/**
 * Team Lead: Add courses and list them. BOEs can only select from these when converting.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function TeamLeadCoursesView() {
  const [courses, setCourses] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function loadCourses() {
    setLoading(true);
    api('/courses')
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const name = newName?.trim();
    if (!name) {
      setError('Enter a course name');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api('/courses', { method: 'POST', body: JSON.stringify({ name }) });
      setNewName('');
      loadCourses();
    } catch (err) {
      setError(err.message || 'Failed to add course');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-slate-500 dark:text-white/60">
        <span className="inline-block w-8 h-8 border-2 border-[#FF7A00]/30 border-t-[#FF7A00] rounded-full animate-spin" aria-hidden />
        <span className="ml-3">Loading courses…</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Courses</h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-0.5">
          Add courses here. BOEs will only be able to select from this list when marking a lead as Converted.
        </p>
      </div>
      <form onSubmit={handleAdd} className="rounded-2xl border-2 border-[#FF7A00]/30 bg-[#0E0E0E] p-5 space-y-3">
        <label className="block text-sm font-semibold text-white/90">Add course</label>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Full Stack Development"
            className="flex-1 min-w-[200px] rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-3 placeholder:text-white/40 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none"
            disabled={saving}
          />
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-3 rounded-xl bg-[#FF7A00] text-black font-bold hover:opacity-95 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add course'}
          </button>
        </div>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      </form>
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
          <h3 className="font-semibold text-slate-800 dark:text-white">Your courses ({courses.length})</h3>
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-white/10">
          {courses.length === 0 ? (
            <li className="px-4 py-6 text-center text-slate-500 dark:text-white/50 text-sm">
              No courses yet. Add one above.
            </li>
          ) : (
            courses.map((c) => (
              <li key={c.id} className="px-4 py-3 text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF7A00]" aria-hidden />
                {c.name}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
