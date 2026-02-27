/**
 * Team Lead: Editable college list. Add/edit/delete with place + college_name. Table: Place, College Name, Actions.
 * GET /colleges, POST /colleges, PUT /colleges/:id, DELETE /colleges/:id. Orange/black theme.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function CollegeEditorTable() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPlace, setEditPlace] = useState('');
  const [editName, setEditName] = useState('');
  const [newPlace, setNewPlace] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setLoadError('');
    api('/colleges')
      .then((list) => setColleges(Array.isArray(list) ? list : []))
      .catch((err) => {
        setColleges([]);
        setLoadError(err.message || 'Could not load college list');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    setSaving(true);
    try {
      await api('/colleges', {
        method: 'POST',
        body: JSON.stringify({ college_name: newName.trim(), place: newPlace.trim() || null }),
      });
      setNewName('');
      setNewPlace('');
      load();
    } catch (err) {
      setError(err.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id) {
    if (editingId !== id) return;
    setError('');
    setSaving(true);
    try {
      await api(`/colleges/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ college_name: editName.trim(), place: editPlace.trim() || null }),
      });
      setEditingId(null);
      setEditPlace('');
      setEditName('');
      load();
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api(`/colleges/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-white/10 bg-[#0E0E0E] p-8">
        <p className="text-white/60">Loading colleges…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border-2 border-red-500/30 bg-red-500/10 p-6">
        <p className="text-red-400 font-medium">{loadError}</p>
        <button type="button" onClick={load} className="mt-3 px-4 py-2 rounded-xl bg-[#FF7A00] text-black font-semibold hover:opacity-90">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-white/10 bg-[#0E0E0E] p-6 shadow-xl">
        <h3 className="font-display font-semibold text-white mb-4">Add college</h3>
        <form onSubmit={handleAdd} className="flex gap-3 flex-wrap items-end">
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-white/60 mb-1">Place</label>
            <input
              type="text"
              value={newPlace}
              onChange={(e) => setNewPlace(e.target.value)}
              placeholder="e.g. Mumbai"
              className="w-full rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-2.5 placeholder:text-white/40 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-white/60 mb-1">College name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. ABC College"
              className="w-full rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-2.5 placeholder:text-white/40 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none"
            />
          </div>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#FF7A00] text-black font-bold hover:opacity-95 disabled:opacity-50 shadow-lg shadow-[#FF7A00]/20">
            {saving ? 'Adding…' : 'Add'}
          </button>
        </form>
      </div>
      {error && <p className="text-sm text-red-400 font-medium" role="alert">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border-2 border-white/10 bg-[#0E0E0E] shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#FF7A00] text-black">
              <th className="px-5 py-4 font-semibold">Place</th>
              <th className="px-5 py-4 font-semibold">College Name</th>
              <th className="px-5 py-4 font-semibold w-36 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-white">
            {colleges.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-white/50">No colleges yet. Add one above.</td>
              </tr>
            ) : (
              colleges.map((c) => (
                <tr key={c.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-5 py-3">
                    {editingId === c.id ? (
                      <input
                        type="text"
                        value={editPlace}
                        onChange={(e) => setEditPlace(e.target.value)}
                        className="w-full rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 focus:border-[#FF7A00] outline-none"
                        placeholder="Place"
                      />
                    ) : (
                      <span>{c.place ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {editingId === c.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 focus:border-[#FF7A00] outline-none"
                        placeholder="College name"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{c.college_name}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {editingId === c.id ? (
                      <>
                        <button type="button" onClick={() => handleUpdate(c.id)} disabled={saving} className="text-[#FF7A00] font-semibold hover:underline mr-2">Save</button>
                        <button type="button" onClick={() => { setEditingId(null); setEditPlace(''); setEditName(''); }} className="text-white/60 hover:underline">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => { setEditingId(c.id); setEditPlace(c.place ?? ''); setEditName(c.college_name ?? ''); }} className="text-[#FF7A00] font-semibold hover:underline mr-2">Edit</button>
                        <button type="button" onClick={() => handleDelete(c.id)} className="text-red-400 hover:underline">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
