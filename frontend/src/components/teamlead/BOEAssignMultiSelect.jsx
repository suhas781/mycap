/**
 * Team Lead: Assign BOE dropdown. Theme-aware.
 */
import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';

export default function BOEAssignMultiSelect({ lead, boes, anchorEl, onClose, onSaved }) {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    setSelected(lead?.assigned_boe_id ? [lead.assigned_boe_id] : []);
    setError('');
  }, [lead]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target) && anchorEl && !anchorEl.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [anchorEl, onClose]);

  function toggleBoe(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id]));
  }

  function selectAll() {
    setSelected(boes?.map((b) => b.id) ?? []);
  }

  function clearSelection() {
    setSelected([]);
  }

  async function handleSave() {
    const boeId = selected[0] ?? null;
    if (!boeId) {
      setError('Select one BOE.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api(`/leads/${lead.id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ boe_id: boeId }),
      });
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Assignment failed');
    } finally {
      setSaving(false);
    }
  }

  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[220px] rounded-lg shadow-xl border border-slate-200 dark:border-[#2A2A2A] bg-white dark:bg-[#121212] py-2"
      style={{ left: rect.left, top: rect.bottom + 4 }}
    >
      <div className="px-3 py-1.5 border-b border-slate-200 dark:border-[#2A2A2A] flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600 dark:text-white/80">Assign BOE</span>
        <button type="button" onClick={onClose} className="text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white text-lg leading-none" aria-label="Close">×</button>
      </div>
      <div className="px-2 py-1 flex gap-1">
        <button type="button" onClick={selectAll} className="text-xs px-2 py-1 rounded text-[#FF7A00] hover:bg-[#FF7A00]/15 font-medium">Select All</button>
        <button type="button" onClick={clearSelection} className="text-xs px-2 py-1 rounded text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10">Clear</button>
      </div>
      <ul className="max-h-48 overflow-y-auto py-1">
        {boes?.map((boe) => (
          <li key={boe.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5">
            <input
              type="checkbox"
              id={`boe-${lead?.id}-${boe.id}`}
              checked={selected.includes(boe.id)}
              onChange={() => toggleBoe(boe.id)}
              className="rounded border-slate-300 dark:border-[#2A2A2A] bg-white dark:bg-[#0E0E0E] text-[#FF7A00] focus:ring-[#FF7A00]"
            />
            <label htmlFor={`boe-${lead?.id}-${boe.id}`} className="text-sm text-slate-900 dark:text-white cursor-pointer flex-1">{boe.name}</label>
          </li>
        ))}
      </ul>
      {error && <p className="px-3 py-1 text-xs text-red-600 dark:text-[#FF7A00]" role="alert">{error}</p>}
      <div className="px-3 py-2 border-t border-slate-200 dark:border-[#2A2A2A]">
        <button type="button" onClick={handleSave} disabled={saving || selected.length === 0} className="w-full py-1.5 text-sm font-semibold rounded bg-[#FF7A00] text-black hover:bg-[#e66d00] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Assignment'}
        </button>
      </div>
    </div>
  );
}
