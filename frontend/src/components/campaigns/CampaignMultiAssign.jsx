/**
 * CampaignMultiAssign — Team Lead: checkbox list of BOEs to assign to a campaign.
 * Orange/black theme.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function CampaignMultiAssign({ campaignId, initialBoeIds = [], onClose, onSaved }) {
  const [boes, setBoes] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set(initialBoeIds.map(Number)));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/users/boes')
      .then((list) => setBoes(list))
      .catch(() => setBoes([]))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      await api(`/campaigns/${campaignId}/assign-boes`, {
        method: 'POST',
        body: JSON.stringify({ boe_ids: [...selectedIds] }),
      });
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to assign BOEs');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border-2 border-dark-border bg-surface text-white/80 text-center">
        Loading BOEs…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-6 shadow-lg max-h-[80vh] overflow-hidden flex flex-col">
      <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">Assign BOEs to campaign</h2>
      <p className="text-sm text-slate-500 dark:text-white/60 mb-4">Select BOEs from your team to assign.</p>
      <div className="flex-1 overflow-auto space-y-2 mb-4">
        {boes.length === 0 ? (
          <p className="text-slate-500 dark:text-white/60">No BOEs in your team. Assign BOEs via HR → Reports to.</p>
        ) : (
          boes.map((boe) => (
            <label
              key={boe.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(boe.id)}
                onChange={() => toggle(boe.id)}
                className="rounded border-slate-300 dark:border-dark-border text-primary-500 focus:ring-primary-500"
              />
              <span className="font-medium text-slate-800 dark:text-white">{boe.name}</span>
              <span className="text-sm text-slate-500 dark:text-white/50">{boe.email}</span>
            </label>
          ))
        )}
      </div>
      {error && <p className="text-sm text-red-500 dark:text-primary-400 mb-2" role="alert">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-primary-500 text-black font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save assignments'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-dark-border text-slate-700 dark:text-white/80 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
