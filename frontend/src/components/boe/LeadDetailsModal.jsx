/**
 * BOE lead details: view + status update. Backend validates; frontend sends selected status.
 * Save calls PUT /leads/:id/status then closes and triggers refresh.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function LeadDetailsModal({ lead, statusOptions, onClose, onSaved }) {
  const [status, setStatus] = useState(lead?.status ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(lead?.status ?? '');
    setError('');
  }, [lead]);

  if (!lead) return null;

  async function handleSave() {
    if (status === lead.status) {
      onClose();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api(`/leads/${lead.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-details-title"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <h2 id="lead-details-title" className="text-lg font-semibold text-slate-800">
            Lead details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-700 rounded"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <dl className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{lead.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-medium text-slate-900">{lead.phone}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-900">{lead.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">College</dt>
              <dd className="text-slate-900">{lead.college || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Certification</dt>
              <dd className="text-slate-900">{lead.certification || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Current status</dt>
              <dd className="text-slate-900">{lead.status}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Retry count</dt>
              <dd className="text-slate-900">{lead.retry_count ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Next follow-up</dt>
              <dd className="text-slate-900">{formatDate(lead.next_followup_at)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Assigned BOE</dt>
              <dd className="text-slate-900">{lead.assigned_boe_name || '—'}</dd>
            </div>
          </dl>

          <div>
            <label htmlFor="lead-status" className="block text-sm font-medium text-slate-700 mb-1">
              Update status
            </label>
            <select
              id="lead-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
