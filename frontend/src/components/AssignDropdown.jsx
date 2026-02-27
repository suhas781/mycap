import { useState } from 'react';
import { api } from '../api';

export default function AssignDropdown({ lead, boes, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  async function assign(boeId) {
    setLoading(true);
    setError('');
    try {
      await api(`/leads/${lead.id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ boe_id: boeId }),
      });
      setOpen(false);
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Assign failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => { setOpen(!open); setError(''); }}
        disabled={loading}
        className="inline-flex items-center px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-200 disabled:opacity-50"
      >
        Assign
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
            {error && (
              <p className="px-3 py-1 text-xs text-red-600">{error}</p>
            )}
            {boes?.length ? (
              boes.map((boe) => (
                <button
                  key={boe.id}
                  type="button"
                  onClick={() => assign(boe.id)}
                  className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  {boe.name}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-slate-500">No BOEs</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
