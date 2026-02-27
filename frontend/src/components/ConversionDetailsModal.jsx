/**
 * Modal: "Enter Conversion Details". Required when setting lead status to Converted.
 * On submit: POST /leads/:id/conversion-details then PUT /leads/:id/status { status: 'Converted' }. Orange/black theme.
 */
import { useState } from 'react';
import { api } from '../api';
import ConversionDetailsForm from './ConversionDetailsForm';

export default function ConversionDetailsModal({ lead, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(payload) {
    if (!lead?.id) return;
    setError('');
    setSaving(true);
    try {
      await api(`/leads/${lead.id}/conversion-details`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await api(`/leads/${lead.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Converted' }),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save conversion');
    } finally {
      setSaving(false);
    }
  }

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl border-2 border-white/10 bg-[#0E0E0E] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversion-modal-title"
      >
        <h2 id="conversion-modal-title" className="text-xl font-bold text-white mb-1">
          Enter Conversion Details
        </h2>
        <p className="text-sm text-white/60 mb-4">Required before marking this lead as Converted.</p>
        {error && <p className="text-sm text-red-400 font-medium mb-3" role="alert">{error}</p>}
        <ConversionDetailsForm
          leadId={lead.id}
          onSubmit={handleSubmit}
          onCancel={onClose}
          disabled={saving}
        />
      </div>
    </div>
  );
}
