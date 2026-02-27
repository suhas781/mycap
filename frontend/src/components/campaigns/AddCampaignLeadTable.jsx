/**
 * BOE: Table-format form to add multiple leads for a campaign. Submit all at once.
 * POST /campaigns/:id/leads. Orange/black theme.
 */
import { useState } from 'react';
import { api } from '../../api';

const emptyRow = () => ({ student_name: '', phone: '', email: '', course_selected: '', reason: '' });

export default function AddCampaignLeadTable({ campaignId, campaignLabel, onSuccess, onCancel }) {
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addRow() {
    setRows((r) => [...r, emptyRow()]);
  }

  function removeRow(i) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  function updateRow(i, field, value) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const leads = rows
      .map((r) => ({
        student_name: (r.student_name || '').trim(),
        phone: (r.phone || '').trim() || null,
        email: (r.email || '').trim() || null,
        course_selected: (r.course_selected || '').trim() || null,
        reason: (r.reason || '').trim() || null,
      }))
      .filter((r) => r.student_name);
    if (leads.length === 0) {
      setError('Add at least one lead with Student Name');
      return;
    }
    setSaving(true);
    try {
      await api(`/campaigns/${campaignId}/leads`, {
        method: 'POST',
        body: JSON.stringify({ leads }),
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to add leads');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E] p-6 shadow-lg overflow-x-auto">
      <h2 className="font-display text-lg font-bold text-white mb-2">Add Leads</h2>
      {campaignLabel && <p className="text-sm text-white/60 mb-4">{campaignLabel}</p>}
      <form onSubmit={handleSubmit}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FF7A00] text-black">
              <th className="px-3 py-2 font-semibold text-sm">Student Name</th>
              <th className="px-3 py-2 font-semibold text-sm">Phone</th>
              <th className="px-3 py-2 font-semibold text-sm">Email</th>
              <th className="px-3 py-2 font-semibold text-sm">Course Selected</th>
              <th className="px-3 py-2 font-semibold text-sm">Reason for Selection</th>
              <th className="px-3 py-2 w-12" />
            </tr>
          </thead>
          <tbody className="text-white">
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-200 dark:border-dark-border">
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={row.student_name}
                    onChange={(e) => updateRow(i, 'student_name', e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-2 py-1 text-sm"
                    placeholder="Name"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={row.phone}
                    onChange={(e) => updateRow(i, 'phone', e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-2 py-1 text-sm"
                    placeholder="Phone"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="email"
                    value={row.email}
                    onChange={(e) => updateRow(i, 'email', e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-2 py-1 text-sm"
                    placeholder="Email"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={row.course_selected}
                    onChange={(e) => updateRow(i, 'course_selected', e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-2 py-1 text-sm"
                    placeholder="Course"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <textarea
                    value={row.reason}
                    onChange={(e) => updateRow(i, 'reason', e.target.value)}
                    rows={1}
                    className="w-full rounded border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-2 py-1 text-sm"
                    placeholder="Reason"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-red-400 hover:text-red-300 text-sm"
                    aria-label="Remove row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-white/80 text-sm font-medium"
          >
            + Add row
          </button>
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        </div>
        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-[#FF7A00] text-black font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Submitting…' : 'Submit all leads'}
          </button>
          {onCancel != null && (
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-white/30 text-white/80 font-medium">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
