/**
 * BOE table: #, Name, Phone, College, Status, Next Followup.
 * Edit option for Name and Phone (inline: inputs + Save/Cancel). Row click opens lead details modal.
 */
import { useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

const borderCls = 'border-slate-200 dark:border-[#2A2A2A]';

export default function BOELeadTable({ leads, onRowClick, onRefresh }) {
  const { addToast } = useToast();
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  if (!leads?.length) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-8 text-center text-slate-500 dark:text-white/60 bg-white dark:bg-[#121212]">
        No leads to show.
      </div>
    );
  }

  function startEdit(lead, e) {
    e.stopPropagation();
    setEditingLeadId(lead.id);
    setEditName(lead.name ?? '');
    setEditPhone(lead.phone ?? '');
  }

  function cancelEdit(e) {
    e?.stopPropagation();
    setEditingLeadId(null);
    setEditName('');
    setEditPhone('');
  }

  async function saveEdit(leadId, e) {
    e?.stopPropagation();
    if (editingLeadId !== leadId) return;
    const name = editName?.trim();
    const phone = editPhone?.trim();
    if (!name || !phone) {
      addToast('Name and phone are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await api(`/leads/${leadId}/name-phone`, {
        method: 'PUT',
        body: JSON.stringify({ name, phone }),
      });
      setEditingLeadId(null);
      setEditName('');
      setEditPhone('');
      onRefresh?.();
      addToast('Lead updated');
    } catch (err) {
      addToast(err.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto overscroll-contain" style={{ minHeight: 0 }}>
      <table className="w-full border-collapse text-sm min-w-[600px]">
        <thead className="sticky top-0 bg-slate-50 dark:bg-[#1A1A1A] z-10 shadow-sm">
          <tr>
            <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white w-12`}>#</th>
            <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white`}>Name</th>
            <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white`}>Phone</th>
            <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white`}>College</th>
            <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white`}>Status</th>
            <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white`}>Next Followup</th>
            <th className={`border ${borderCls} px-2 py-2.5 text-center font-semibold text-slate-700 dark:text-white w-16`} title="Edit name and phone">Edit</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => (
            <tr
              key={lead.id}
              onClick={() => !editingLeadId && onRowClick?.(lead)}
              className="bg-white dark:bg-[#121212] hover:bg-slate-50 dark:hover:bg-[#1A1A1A] transition-colors border-b border-slate-200 dark:border-[#2A2A2A] cursor-pointer"
            >
              <td className={`border ${borderCls} px-3 py-2 text-slate-600 dark:text-white/80 tabular-nums`}>{index + 1}</td>
              <td className={`border ${borderCls} px-3 py-2 text-slate-900 dark:text-white`} onClick={(e) => editingLeadId === lead.id && e.stopPropagation()}>
                {editingLeadId === lead.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded border border-[#FF7A00]/50 bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#FF7A00] outline-none"
                    placeholder="Name"
                    autoFocus
                  />
                ) : (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span>{lead.name}</span>
                    {lead.status === 'Converted' && Number(lead.conversion_due_amount) > 0 && (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40" title={`Due: ₹${Number(lead.conversion_due_amount).toLocaleString('en-IN')}`}>
                        Due
                      </span>
                    )}
                  </span>
                )}
              </td>
              <td className={`border ${borderCls} px-3 py-2 text-slate-900 dark:text-white`} onClick={(e) => editingLeadId === lead.id && e.stopPropagation()}>
                {editingLeadId === lead.id ? (
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(lead.id, e);
                      if (e.key === 'Escape') cancelEdit(e);
                    }}
                    className="w-full rounded border border-[#FF7A00]/50 bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#FF7A00] outline-none"
                    placeholder="Phone"
                  />
                ) : (
                  lead.phone
                )}
              </td>
              <td className={`border ${borderCls} px-3 py-2 text-slate-900 dark:text-white`}>{lead.college || '—'}</td>
              <td className={`border ${borderCls} px-3 py-2`}>
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-[#FF7A00]/20 text-slate-800 dark:text-[#FF7A00]">
                  {lead.status}
                </span>
              </td>
              <td className={`border ${borderCls} px-3 py-2 text-slate-600 dark:text-white/80`}>{formatDate(lead.next_followup_at)}</td>
              <td className={`border ${borderCls} px-2 py-2 text-center`} onClick={(e) => e.stopPropagation()}>
                {editingLeadId === lead.id ? (
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => saveEdit(lead.id, e)}
                      disabled={saving}
                      className="px-2 py-1 rounded bg-[#FF7A00] text-black text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? '…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="px-2 py-1 rounded border border-slate-300 dark:border-white/20 text-slate-600 dark:text-white/70 text-xs hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => startEdit(lead, e)}
                    className="p-1.5 rounded text-slate-500 dark:text-white/50 hover:bg-[#FF7A00]/15 hover:text-[#FF7A00] transition-colors"
                    title="Edit name and phone"
                    aria-label="Edit name and phone"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
