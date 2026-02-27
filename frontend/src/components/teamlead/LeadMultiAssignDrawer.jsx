/**
 * Team Lead: Drawer for assigning a lead to a BOE. Orange/black theme.
 * Lead quick info on top, multi-select BOE list (single assign per backend), Save.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function LeadMultiAssignDrawer({ lead, boes, onClose, onSaved }) {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelected(lead?.assigned_boe_id ? [lead.assigned_boe_id] : []);
    setError('');
  }, [lead]);

  if (!lead) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" aria-hidden onClick={onClose} />
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#121212] border-l border-slate-200 dark:border-[#2A2A2A] shadow-2xl flex flex-col h-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-drawer-title"
      >
        <div className="p-4 border-b border-slate-200 dark:border-[#2A2A2A] flex items-center justify-between">
          <h2 id="assign-drawer-title" className="text-lg font-semibold text-slate-800 dark:text-white">Assign lead</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white rounded" aria-label="Close"><span className="text-xl leading-none">×</span></button>
        </div>
        <div className="p-4 border-b border-slate-200 dark:border-[#2A2A2A] space-y-1 text-sm">
          <p className="text-slate-800 dark:text-white font-medium">{lead.name}</p>
          <p className="text-slate-600 dark:text-white/70">{lead.college || '—'}</p>
          <p className="text-slate-600 dark:text-white/70">{lead.phone}</p>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={selectAll} className="text-xs px-2 py-1 rounded bg-[#FF7A00]/20 text-[#FF7A00] hover:bg-[#FF7A00]/30 font-medium">Select All</button>
            <button type="button" onClick={clearSelection} className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-[#2A2A2A] text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5">Clear Selection</button>
          </div>
          <ul className="space-y-2">
            {boes?.map((boe) => (
              <li key={boe.id} className="flex items-center gap-2">
                <input type="checkbox" id={`drawer-boe-${lead.id}-${boe.id}`} checked={selected.includes(boe.id)} onChange={() => toggleBoe(boe.id)} className="rounded border-slate-300 dark:border-[#2A2A2A] bg-white dark:bg-[#0E0E0E] text-[#FF7A00] focus:ring-[#FF7A00]" />
                <label htmlFor={`drawer-boe-${lead.id}-${boe.id}`} className="text-slate-900 dark:text-white cursor-pointer">{boe.name}</label>
              </li>
            ))}
          </ul>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-[#FF7A00]" role="alert">{error}</p>}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-[#2A2A2A]">
          <button type="button" onClick={handleSave} disabled={saving || selected.length === 0} className="w-full py-2.5 font-semibold rounded bg-[#FF7A00] text-black hover:bg-[#e66d00] disabled:opacity-50">{saving ? 'Saving…' : 'Save Assignment'}</button>
        </div>
      </div>
    </div>
  );
}
