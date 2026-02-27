import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, setStoredUser } from '../api';
import { useToast } from '../context/ToastContext';

export default function SyncLeadsButton({ sources = [], onSynced }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [syncSourceId, setSyncSourceId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (sources.length && !syncSourceId) setSyncSourceId(sources[0].id);
    if (!sources.length) setSyncSourceId('');
  }, [sources]);

  async function sync() {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const body = sources.length && syncSourceId ? { source_id: Number(syncSourceId) } : undefined;
      const data = await api('/sync-leads', {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      setMessage(`Synced: ${data.synced} rows, ${data.inserted} new leads.`);
      if (data.inserted > 0) addToast(`${data.inserted} new lead${data.inserted !== 1 ? 's' : ''} synced`);
      onSynced?.();
    } catch (err) {
      let msg = err.message || 'Sync failed';
      if (msg.includes('Team Lead access required')) {
        setToken(null);
        setStoredUser(null);
        navigate('/login', { replace: true });
        return;
      }
      if (msg.includes('Google credentials not configured')) {
        msg = 'Sync is not set up. Add GOOGLE_CREDENTIALS_JSON or GOOGLE_CREDENTIALS_PATH in backend .env to sync from Google Sheets.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {sources.length > 0 && (
        <select
          value={syncSourceId}
          onChange={(e) => setSyncSourceId(e.target.value)}
          className="w-full rounded border border-slate-300 dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-2 py-1.5 text-sm"
        >
          {sources.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={sync}
          disabled={loading}
          className="cursor-pointer px-4 py-2.5 bg-[#FF7A00] text-black text-sm font-semibold rounded-lg hover:bg-[#e66d00] disabled:opacity-50 shadow-md shadow-[#FF7A00]/25"
        >
          {loading ? 'Syncing…' : sources.length ? 'Sync from sheet' : 'Sync leads from sheet'}
        </button>
        {message && <span className="text-sm text-slate-600 dark:text-white/80">{message}</span>}
        {error && <span className="text-sm text-red-600 dark:text-[#FF7A00]" role="alert">{error}</span>}
      </div>
    </div>
  );
}
