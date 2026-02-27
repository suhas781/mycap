/**
 * CreateCampaign — Team Lead: create new campaign (name, description, start_date, end_date).
 * Orange/black theme.
 */
import { useState } from 'react';
import { api } from '../../api';

export default function CreateCampaign({ onCreated, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Campaign name is required');
      return;
    }
    setSaving(true);
    try {
      const campaign = await api('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });
      onCreated?.(campaign);
    } catch (err) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-6 shadow-lg">
      <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">Create campaign</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border-2 border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Campaign name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border-2 border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Optional description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border-2 border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border-2 border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500 dark:text-primary-400" role="alert">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-primary-500 text-black font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Creating…' : 'Create campaign'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-dark-border text-slate-700 dark:text-white/80 font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
