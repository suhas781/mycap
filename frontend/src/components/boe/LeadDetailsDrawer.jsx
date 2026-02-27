/**
 * BOE: Centered popup modal. College (top), full details, status dropdown, Save, Cancel.
 * Save calls PUT /leads/:id/status; close and refresh. If status is Converted, opens conversion details modal first (required).
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import ConversionDetailsModal from '../ConversionDetailsModal';

const FALLBACK_STATUSES = ['NEW', 'DNR1', 'DNR2', 'DNR3', 'DNR4', 'Cut Call', 'Call Back', 'Not Interested', 'Denied', 'Converted'];

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function LeadDetailsDrawer({ lead, statusOptions, onClose, onSaved }) {
  const [status, setStatus] = useState(lead?.status ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [showUpdatePayment, setShowUpdatePayment] = useState(false);
  const [conversionDetails, setConversionDetails] = useState(null);
  const [updateAmountPaid, setUpdateAmountPaid] = useState('');
  const [updateDueAmount, setUpdateDueAmount] = useState('');
  const [updateSaving, setUpdateSaving] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    setStatus(lead?.status ?? '');
    setError('');
  }, [lead]);

  const hasDue = lead?.status === 'Converted' && Number(lead?.conversion_due_amount) > 0;

  async function openUpdatePayment() {
    setUpdateError('');
    setConversionDetails(null);
    setShowUpdatePayment(true);
    try {
      const d = await api(`/leads/${lead.id}/conversion-details`);
      if (!d) {
        setUpdateError('No conversion details found');
        return;
      }
      setConversionDetails(d);
      setUpdateAmountPaid(d.amount_paid != null ? String(d.amount_paid) : '');
      setUpdateDueAmount(d.due_amount != null ? String(d.due_amount) : '');
    } catch {
      setUpdateError('Could not load payment details');
    }
  }

  async function handleUpdatePayment(e) {
    e.preventDefault();
    setUpdateError('');
    const paid = updateAmountPaid === '' ? (conversionDetails?.amount_paid ?? 0) : parseFloat(updateAmountPaid);
    const due = updateDueAmount === '' ? (conversionDetails?.due_amount ?? 0) : parseFloat(updateDueAmount);
    if (Number.isNaN(paid) || paid < 0) {
      setUpdateError('Amount paid must be >= 0');
      return;
    }
    const fee = Number(conversionDetails?.course_fee) ?? 0;
    if (paid > fee) {
      setUpdateError('Amount paid cannot exceed course fee');
      return;
    }
    if (Number.isNaN(due) || due < 0) {
      setUpdateError('Due amount cannot be negative');
      return;
    }
    setUpdateSaving(true);
    try {
      await api(`/leads/${lead.id}/conversion-details`, {
        method: 'PUT',
        body: JSON.stringify({
          course_name: conversionDetails?.course_name,
          course_fee: conversionDetails?.course_fee,
          amount_paid: paid,
          due_amount: due,
        }),
      });
      setShowUpdatePayment(false);
      onSaved?.();
    } catch (err) {
      setUpdateError(err.message || 'Update failed');
    } finally {
      setUpdateSaving(false);
    }
  }

  if (!lead) return null;

  async function handleSave() {
    if (status === lead.status) {
      onClose();
      return;
    }
    if (status === 'Converted') {
      setShowConversionModal(true);
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
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#121212] rounded-xl shadow-xl border border-slate-200 dark:border-[#2A2A2A] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
      >
        <div className="p-4 border-b border-slate-200 dark:border-[#2A2A2A] flex items-center justify-between shrink-0">
          <h2 id="lead-modal-title" className="text-lg font-semibold text-slate-800 dark:text-white">Lead details</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white rounded" aria-label="Close"><span className="text-xl leading-none">×</span></button>
        </div>
        <div className="p-4 space-y-2 shrink-0 border-b border-slate-100 dark:border-[#2A2A2A]">
          <p className="font-medium text-slate-800 dark:text-white">{lead.college || '—'}</p>
          <p className="font-medium text-slate-800 dark:text-white inline-flex items-center gap-2 flex-wrap">
            {lead.name}
            {lead.status === 'Converted' && Number(lead.conversion_due_amount) > 0 && (
              <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40" title={`Due: ₹${Number(lead.conversion_due_amount).toLocaleString('en-IN')}`}>
                Due
              </span>
            )}
          </p>
          <p className="text-slate-600 dark:text-slate-400">{lead.phone}</p>
        </div>
        <dl className="p-4 space-y-3 text-sm flex-1">
          <div><dt className="text-slate-500 dark:text-slate-400">Email</dt><dd className="text-slate-800 dark:text-white">{lead.email || '—'}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">Certification</dt><dd className="text-slate-800 dark:text-white">{lead.certification || '—'}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">Current status</dt><dd className="text-slate-800 dark:text-white">{lead.status}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">Retry count</dt><dd className="text-slate-800 dark:text-white">{lead.retry_count ?? 0}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">Next follow-up</dt><dd className="text-slate-800 dark:text-white">{formatDate(lead.next_followup_at)}</dd></div>
        </dl>

        {hasDue && !showUpdatePayment && (
          <div className="px-4 pb-2">
            <button
              type="button"
              onClick={openUpdatePayment}
              className="w-full py-2.5 rounded-lg border-2 border-[#FF7A00] bg-[#FF7A00]/10 text-[#FF7A00] dark:bg-[#FF7A00]/20 font-semibold text-sm hover:bg-[#FF7A00]/20 dark:hover:bg-[#FF7A00]/30 transition-colors"
            >
              Update payment (mark due as paid)
            </button>
          </div>
        )}
        {hasDue && showUpdatePayment && conversionDetails && (
          <div className="p-4 border-t border-slate-200 dark:border-[#2A2A2A] bg-slate-50 dark:bg-[#1A1A1A] rounded-lg mx-4 mb-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-white mb-2">Update payment</p>
            <p className="text-xs text-slate-500 dark:text-white/50 mb-2">Course: {conversionDetails.course_name || '—'} · Fee: ₹{Number(conversionDetails.course_fee ?? 0).toLocaleString('en-IN')}</p>
            <form onSubmit={handleUpdatePayment} className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-white/80 mb-0.5">Amount paid</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={updateAmountPaid}
                  onChange={(e) => setUpdateAmountPaid(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0E0E0E] text-slate-900 dark:text-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-white/80 mb-0.5">Due amount (0 = fully paid)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={updateDueAmount}
                  onChange={(e) => setUpdateDueAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0E0E0E] text-slate-900 dark:text-white px-3 py-2 text-sm"
                />
              </div>
              {updateError && <p className="text-xs text-red-500" role="alert">{updateError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowUpdatePayment(false)} className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white/80">Cancel</button>
                <button type="submit" disabled={updateSaving} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-[#FF7A00] text-black disabled:opacity-50">{updateSaving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        )}
        {hasDue && showUpdatePayment && !conversionDetails && !updateError && (
          <div className="px-4 pb-2 text-sm text-slate-500 dark:text-white/50">Loading payment details…</div>
        )}
        <div className="p-4 border-t border-slate-200 dark:border-[#2A2A2A] space-y-3 shrink-0">
          <div>
            <label htmlFor="lead-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Update status</label>
            <select
              id="lead-status"
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setStatus(newStatus);
                if (newStatus === 'Converted') setShowConversionModal(true);
              }}
              className="w-full border border-slate-300 dark:border-dark-border bg-white dark:bg-dark rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {(statusOptions?.length ? statusOptions : FALLBACK_STATUSES).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-[#FF7A00]" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#2A2A2A] rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="flex-1 py-2 text-sm font-medium rounded-lg bg-blue-600 dark:bg-[#FF7A00] text-white dark:text-black hover:bg-blue-700 dark:hover:bg-[#e66d00] disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
      {showConversionModal && (
        <ConversionDetailsModal
          lead={lead}
          onClose={() => {
            setShowConversionModal(false);
            setStatus(lead.status);
          }}
          onSuccess={() => {
            onSaved?.();
            onClose();
          }}
        />
      )}
    </div>
  );
}
