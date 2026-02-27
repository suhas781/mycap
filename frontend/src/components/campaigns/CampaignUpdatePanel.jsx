/**
 * CampaignUpdatePanel — BOE: mark started/completed, add notes (POST /campaigns/:id/logs).
 * Orange/black theme.
 */
import { useState } from 'react';
import { api } from '../../api';

const ACTIONS = [
  { value: 'started', label: 'Mark started' },
  { value: 'submitted_proof', label: 'Submit proof / update' },
  { value: 'completed', label: 'Mark completed' },
];

export default function CampaignUpdatePanel({ campaignId, onUpdated }) {
  const [action, setAction] = useState('started');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api(`/campaigns/${campaignId}/logs`, {
        method: 'POST',
        body: JSON.stringify({ action, notes: notes.trim() || null }),
      });
      setNotes('');
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Failed to submit');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-white/5 p-4">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Update progress</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-white/70 mb-1">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark text-slate-900 dark:text-white px-3 py-2 text-sm"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-white/70 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark text-slate-900 dark:text-white px-3 py-2 text-sm"
            placeholder="Add notes or field data"
          />
        </div>
        {error && <p className="text-sm text-red-500 dark:text-primary-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 rounded-lg bg-primary-500 text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
