/**
 * BOE Leads page: drawer to add a new lead. Fields match table: Name, Phone, Email, College. No date.
 * POST /leads. Orange/black theme.
 */
import { useState } from 'react';
import { api } from '../../api';

export default function AddLeadDrawer({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const n = name?.trim();
    const p = phone?.trim();
    if (!n || !p) {
      setError('Name and Phone are required');
      return;
    }
    setSaving(true);
    try {
      await api('/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: n,
          phone: p,
          email: email?.trim() || null,
          college: college?.trim() || null,
        }),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add lead');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#121212] rounded-xl shadow-xl border border-slate-200 dark:border-[#2A2A2A]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-lead-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-[#2A2A2A] flex items-center justify-between shrink-0">
          <h2 id="add-lead-title" className="text-lg font-semibold text-slate-800 dark:text-white">Add lead</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-white rounded" aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border-2 border-slate-200 dark:border-[#2A2A2A] bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-3 py-2"
              placeholder="Student name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">Phone (mobile) *</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-lg border-2 border-slate-200 dark:border-[#2A2A2A] bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-3 py-2"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border-2 border-slate-200 dark:border-[#2A2A2A] bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-3 py-2"
              placeholder="Email (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">College</label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full rounded-lg border-2 border-slate-200 dark:border-[#2A2A2A] bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-3 py-2"
              placeholder="College (optional)"
            />
          </div>
          {error && <p className="text-sm text-red-500 dark:text-red-400" role="alert">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#FF7A00] text-black font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save lead'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2A2A2A] text-slate-700 dark:text-white/80 font-medium">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
