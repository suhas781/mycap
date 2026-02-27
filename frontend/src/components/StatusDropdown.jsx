import { useState } from 'react';
import { api } from '../api';
import ConversionDetailsModal from './ConversionDetailsModal';

export default function StatusDropdown({ lead, onUpdated }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [showConversionModal, setShowConversionModal] = useState(false);

  async function openDropdown() {
    if (!open && statuses.length === 0) {
      try {
        const list = await api('/leads/statuses');
        setStatuses(list);
      } catch {
        setStatuses([]);
      }
    }
    setOpen(!open);
    setError('');
  }

  async function selectStatus(newStatus) {
    if (newStatus === lead.status) {
      setOpen(false);
      return;
    }
    if (newStatus === 'Converted') {
      setOpen(false);
      setShowConversionModal(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api(`/leads/${lead.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setOpen(false);
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={openDropdown}
        disabled={loading}
        className="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-200 disabled:opacity-50"
      >
        Update status
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1 max-h-60 overflow-auto">
            {error && (
              <p className="px-3 py-1 text-xs text-red-600">{error}</p>
            )}
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => selectStatus(s)}
                className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
      {showConversionModal && (
        <ConversionDetailsModal
          lead={lead}
          onClose={() => setShowConversionModal(false)}
          onSuccess={() => onUpdated?.()}
        />
      )}
    </div>
  );
}
