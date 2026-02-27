/**
 * UploadProofComponent — BOE: notes + file_url (POST /campaigns/:id/logs with action submitted_proof).
 * Orange/black theme. File upload can be extended later; for now we send file_url as text or leave null.
 */
import { useState } from 'react';
import { api } from '../../api';

export default function UploadProofComponent({ campaignId, onUploaded }) {
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api(`/campaigns/${campaignId}/logs`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'submitted_proof',
          notes: notes.trim() || null,
          file_url: fileUrl.trim() || null,
        }),
      });
      setNotes('');
      setFileUrl('');
      onUploaded?.();
    } catch (err) {
      setError(err.message || 'Failed to upload proof');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-white/5 p-4">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Upload proof / evidence</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-white/70 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark text-slate-900 dark:text-white px-3 py-2 text-sm"
            placeholder="Describe the proof or field data"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-white/70 mb-1">File URL (optional)</label>
          <input
            type="url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark text-slate-900 dark:text-white px-3 py-2 text-sm"
            placeholder="https://… (link to image or document)"
          />
        </div>
        {error && <p className="text-sm text-red-500 dark:text-primary-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 rounded-lg bg-primary-500 text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Submitting…' : 'Submit proof'}
        </button>
      </form>
    </div>
  );
}
