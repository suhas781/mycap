/**
 * Team Lead: Grid with bulk assign — assign selected, assign all unassigned, or distribute among BOEs.
 * Team Lead only: edit college name inline via dropdown of colleges from database.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../EmptyState';
import BOEAssignMultiSelect from './BOEAssignMultiSelect';

const borderCls = 'border-slate-200 dark:border-[#2A2A2A]';
const headerCls = `bg-slate-50 dark:bg-[#1A1A1A] ${borderCls}`;
const cellCls = `border ${borderCls} px-3 py-2 text-slate-900 dark:text-white`;
const cellMutedCls = `border ${borderCls} px-3 py-2 text-slate-600 dark:text-white/80`;

export default function TeamLeadLeadTable({ leads, boes, onRefresh }) {
  const { addToast } = useToast();
  const [assignAnchor, setAssignAnchor] = useState({ lead: null, el: null });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkBoeId, setBulkBoeId] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [distributeBoes, setDistributeBoes] = useState(new Set());
  const [showDistribute, setShowDistribute] = useState(false);
  const [editingCollegeId, setEditingCollegeId] = useState(null);
  const [editingCollegeValue, setEditingCollegeValue] = useState('');
  const [collegeSaving, setCollegeSaving] = useState(false);
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    api('/colleges')
      .then((list) => setColleges(Array.isArray(list) ? list : []))
      .catch(() => setColleges([]));
  }, []);

  if (!leads?.length) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-8">
        <EmptyState
          icon="📊"
          title="No leads yet"
          description="Select a sheet and sync from Google Sheets, or add leads from another source."
        />
      </div>
    );
  }

  // Unassigned first, assigned last
  const sortedLeads = [...leads].sort((a, b) => {
    const aUnassigned = a.assigned_boe_id == null;
    const bUnassigned = b.assigned_boe_id == null;
    if (aUnassigned && !bUnassigned) return -1;
    if (!aUnassigned && bUnassigned) return 1;
    return 0;
  });

  const allIds = sortedLeads.map((l) => l.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  }

  async function assignSelectedToBoe() {
    const boeId = bulkBoeId ? Number(bulkBoeId) : null;
    if (!boeId || selectedIds.size === 0) return;
    setBulkError('');
    setBulkSaving(true);
    const ids = Array.from(selectedIds);
    try {
      const res = await api('/leads/bulk-assign', { method: 'POST', body: JSON.stringify({ lead_ids: ids, boe_id: boeId }) });
      setSelectedIds(new Set());
      onRefresh?.();
      if (res.failed > 0) {
        setBulkError(`${res.failed} of ${ids.length} could not be assigned.`);
      } else {
        addToast(`${res.assigned} lead${res.assigned !== 1 ? 's' : ''} assigned`);
      }
    } catch (err) {
      setBulkError(err.message || 'Bulk assign failed');
    } finally {
      setBulkSaving(false);
    }
  }

  const unassignedLeads = sortedLeads.filter((l) => l.assigned_boe_id == null);
  const unassignedIds = unassignedLeads.map((l) => l.id);

  async function assignAllUnassignedToBoe() {
    const boeId = bulkBoeId ? Number(bulkBoeId) : null;
    if (!boeId || unassignedIds.length === 0) return;
    setBulkError('');
    setBulkSaving(true);
    try {
      const res = await api('/leads/bulk-assign', { method: 'POST', body: JSON.stringify({ lead_ids: unassignedIds, boe_id: boeId }) });
      setSelectedIds(new Set());
      onRefresh?.();
      if (res.failed > 0) {
        setBulkError(`${res.failed} of ${unassignedIds.length} could not be assigned.`);
      } else {
        setBulkError('');
        addToast(`${res.assigned} unassigned lead${res.assigned !== 1 ? 's' : ''} assigned`);
      }
    } catch (err) {
      setBulkError(err.message || 'Bulk assign failed');
    } finally {
      setBulkSaving(false);
    }
  }

  async function distributeUnassignedAmongBoes() {
    const boeIds = Array.from(distributeBoes).map(Number).filter(Boolean);
    if (boeIds.length === 0 || unassignedIds.length === 0) return;
    setBulkError('');
    setBulkSaving(true);
    const chunkSize = Math.ceil(unassignedIds.length / boeIds.length);
    let assigned = 0;
    try {
      for (let i = 0; i < boeIds.length; i++) {
        const chunk = unassignedIds.slice(i * chunkSize, (i + 1) * chunkSize);
        if (chunk.length === 0) continue;
        const res = await api('/leads/bulk-assign', { method: 'POST', body: JSON.stringify({ lead_ids: chunk, boe_id: boeIds[i] }) });
        assigned += res.assigned || 0;
      }
      setDistributeBoes(new Set());
      setShowDistribute(false);
      setSelectedIds(new Set());
      onRefresh?.();
      addToast(`Distributed ${unassignedIds.length} leads among ${boeIds.length} BOE${boeIds.length !== 1 ? 's' : ''}`);
    } catch (err) {
      setBulkError(err.message || 'Distribute failed');
    } finally {
      setBulkSaving(false);
    }
  }

  function toggleDistributeBoe(boeId) {
    setDistributeBoes((prev) => {
      const next = new Set(prev);
      if (next.has(boeId)) next.delete(boeId);
      else next.add(boeId);
      return next;
    });
  }

  function openAssign(e, lead) {
    e.stopPropagation();
    setAssignAnchor({ lead, el: e.currentTarget });
  }

  function closeAssign() {
    setAssignAnchor({ lead: null, el: null });
  }

  async function saveCollege(leadId) {
    if (editingCollegeId !== leadId) return;
    setCollegeSaving(true);
    try {
      await api(`/leads/${leadId}/college`, {
        method: 'PUT',
        body: JSON.stringify({ college: editingCollegeValue.trim() || null }),
      });
      setEditingCollegeId(null);
      setEditingCollegeValue('');
      onRefresh?.();
      addToast('College name updated');
    } catch (err) {
      addToast(err.message || 'Failed to update college', 'error');
    } finally {
      setCollegeSaving(false);
    }
  }

  function startEditCollege(lead) {
    setEditingCollegeId(lead.id);
    setEditingCollegeValue(lead.college ?? '');
  }

  function cancelEditCollege() {
    setEditingCollegeId(null);
    setEditingCollegeValue('');
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-[#1A1A1A] border-b border-slate-200 dark:border-[#2A2A2A]">
        <span className="text-sm font-medium text-slate-700 dark:text-white">
          {someSelected ? `${selectedIds.size} selected` : `${unassignedIds.length} unassigned`}
        </span>
        <select
          value={bulkBoeId}
          onChange={(e) => setBulkBoeId(e.target.value)}
          className="rounded-lg border-2 border-slate-300 dark:border-[#2A2A2A] bg-white dark:bg-[#0E0E0E] text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF7A00]"
        >
          <option value="">Choose BOE…</option>
          {boes?.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {someSelected && (
          <button
            type="button"
            onClick={assignSelectedToBoe}
            disabled={bulkSaving || !bulkBoeId}
            className="px-4 py-2 rounded-lg bg-[#FF7A00] text-black text-sm font-semibold hover:bg-[#e66d00] disabled:opacity-50 transition-colors"
          >
            {bulkSaving ? 'Assigning…' : 'Assign selected'}
          </button>
        )}
        {unassignedIds.length > 0 && (
          <button
            type="button"
            onClick={assignAllUnassignedToBoe}
            disabled={bulkSaving || !bulkBoeId}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {bulkSaving ? '…' : `Assign all ${unassignedIds.length} unassigned`}
          </button>
        )}
        {unassignedIds.length > 0 && boes?.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowDistribute((v) => !v)}
              className="px-4 py-2 rounded-lg border-2 border-[#FF7A00] text-[#FF7A00] text-sm font-semibold hover:bg-[#FF7A00]/10 transition-colors"
            >
              Distribute among BOEs
            </button>
            {showDistribute && (
              <div className="flex flex-wrap items-center gap-2">
                {boes.map((b) => (
                  <label key={b.id} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={distributeBoes.has(b.id)}
                      onChange={() => toggleDistributeBoe(b.id)}
                      className="rounded border-slate-300 text-[#FF7A00] focus:ring-[#FF7A00]"
                    />
                    <span className="text-sm text-slate-700 dark:text-white">{b.name}</span>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={distributeUnassignedAmongBoes}
                  disabled={bulkSaving || distributeBoes.size === 0}
                  className="px-3 py-1.5 rounded bg-[#FF7A00] text-black text-sm font-medium disabled:opacity-50"
                >
                  Distribute {unassignedIds.length} leads
                </button>
              </div>
            )}
          </>
        )}
        {someSelected && (
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-slate-600 dark:text-white/70 hover:text-[#FF7A00]"
          >
            Clear selection
          </button>
        )}
        {bulkError && <span className="text-sm text-red-600 dark:text-red-400">{bulkError}</span>}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className={`sticky top-0 z-10 ${headerCls}`}>
            <tr>
              <th className={`border ${borderCls} px-2 py-2.5 text-left w-10`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                  className="rounded border-slate-300 dark:border-[#2A2A2A] bg-white dark:bg-[#0E0E0E] text-[#FF7A00] focus:ring-[#FF7A00]"
                />
              </th>
              <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white w-12`}>#</th>
              <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white`}>College</th>
              <th className={`border ${borderCls} px-2 py-2.5 text-center font-semibold text-slate-700 dark:text-white w-16`} title="Edit college (Team Lead)">Edit</th>
              <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white`}>Name</th>
              <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white`}>Phone</th>
              <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white`}>Status</th>
              <th className={`border ${borderCls} px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-white`}>Assigned BOE</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead, index) => (
              <tr
                key={lead.id}
                className={`border-b border-slate-200 dark:border-dark-border transition-colors ${selectedIds.has(lead.id) ? 'ring-1 ring-primary-500 ring-inset bg-primary-50/50 dark:bg-primary-500/10' : index % 2 === 0 ? 'bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-surface/50' : 'bg-slate-50/50 dark:bg-dark-card/80 hover:bg-slate-100 dark:hover:bg-surface/50'}`}
              >
                <td className={`border ${borderCls} px-2 py-2`} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    aria-label={`Select ${lead.name}`}
                    className="rounded border-slate-300 dark:border-[#2A2A2A] bg-white dark:bg-[#0E0E0E] text-[#FF7A00] focus:ring-[#FF7A00]"
                  />
                </td>
                <td className={`${cellMutedCls} tabular-nums`}>{index + 1}</td>
                <td className={cellCls}>
                  {editingCollegeId === lead.id ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={editingCollegeValue}
                        onChange={(e) => setEditingCollegeValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCollege(lead.id);
                          if (e.key === 'Escape') cancelEditCollege();
                        }}
                        className="min-w-[200px] max-w-full rounded-lg border-2 border-[#FF7A00]/50 bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] outline-none"
                        autoFocus
                      >
                        <option value="">— Select college —</option>
                        {lead.college?.trim() && !colleges.some((c) => (c.college_name ?? '').trim() === lead.college?.trim()) && (
                          <option value={lead.college}>{lead.college} (current)</option>
                        )}
                        {colleges.map((c) => (
                          <option key={c.id} value={c.college_name ?? ''}>
                            {c.place?.trim() ? `${c.college_name ?? ''} — ${c.place}` : (c.college_name ?? '')}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => saveCollege(lead.id)}
                        disabled={collegeSaving}
                        className="shrink-0 px-3 py-2 rounded-lg bg-[#FF7A00] text-black text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        {collegeSaving ? '…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditCollege}
                        disabled={collegeSaving}
                        className="shrink-0 px-3 py-2 rounded-lg border border-slate-300 dark:border-white/20 text-slate-600 dark:text-white/70 text-xs hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span>{lead.college || '—'}</span>
                  )}
                </td>
                <td className={`border ${borderCls} px-2 py-2 text-center`}>
                  {editingCollegeId === lead.id ? null : (
                    <button
                      type="button"
                      onClick={() => startEditCollege(lead)}
                      className="p-1.5 rounded text-slate-500 dark:text-white/50 hover:bg-[#FF7A00]/15 hover:text-[#FF7A00] transition-colors"
                      title="Edit college name"
                      aria-label="Edit college name"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </td>
                <td className={cellCls}>
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  <span>{lead.name}</span>
                  {lead.status === 'Converted' && Number(lead.conversion_due_amount) > 0 && (
                    <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40" title={`Due: ₹${Number(lead.conversion_due_amount).toLocaleString('en-IN')}`}>
                      Due
                    </span>
                  )}
                </span>
              </td>
                <td className={cellCls}>{lead.phone}</td>
                <td className={`border ${borderCls} px-3 py-2`}>
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/50">
                    {lead.status}
                  </span>
                </td>
                <td className={`border ${borderCls} px-3 py-2 relative`}>
                  <button
                    type="button"
                    onClick={(e) => openAssign(e, lead)}
                    className="text-left w-full text-[#FF7A00] hover:underline focus:outline-none focus:ring-1 focus:ring-[#FF7A00] rounded font-medium"
                  >
                    {lead.assigned_boe_name || 'Assign'}
                  </button>
                  {assignAnchor.lead?.id === lead.id && (
                    <BOEAssignMultiSelect
                      lead={lead}
                      boes={boes}
                      anchorEl={assignAnchor.el}
                      onClose={closeAssign}
                      onSaved={() => { onRefresh?.(); closeAssign(); }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
