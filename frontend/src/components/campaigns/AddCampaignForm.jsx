/**
 * BOE: Add Campaign Details. College = searchable dropdown (College Name — Place), value = college_list.id.
 * POST /campaigns/boe with college_id. Orange/black theme.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import CollegeSearchableDropdown from './CollegeSearchableDropdown';

export default function AddCampaignForm({ onSuccess, onCancel }) {
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [collegesError, setCollegesError] = useState('');
  const [collegeId, setCollegeId] = useState(null);
  const [branch, setBranch] = useState('');
  const [city, setCity] = useState('');
  const [stream, setStream] = useState('');
  const [campaignDate, setCampaignDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCollegesLoading(true);
    setCollegesError('');
    api('/colleges')
      .then((list) => setColleges(Array.isArray(list) ? list : []))
      .catch((err) => {
        setColleges([]);
        setCollegesError(err.message || 'Could not load college list');
      })
      .finally(() => setCollegesLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (collegeId == null) {
      setError('Please select a college');
      return;
    }
    setLoading(true);
    try {
      const campaign = await api('/campaigns/boe', {
        method: 'POST',
        body: JSON.stringify({
          college_id: collegeId,
          branch: branch.trim() || null,
          city: city.trim() || null,
          stream: stream.trim() || null,
          campaign_date: campaignDate || null,
        }),
      });
      onSuccess?.(campaign);
    } catch (err) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-white/10 bg-[#0E0E0E] p-8 shadow-2xl shadow-black/30">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-white tracking-tight">Add Campaign Details</h2>
        <p className="text-sm text-white/50 mt-1">Choose a college and fill in the campaign info.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-2">College *</label>
          {collegesLoading ? (
            <div className="rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white/50 text-sm">Loading colleges…</div>
          ) : collegesError ? (
            <div className="rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">{collegesError}</div>
          ) : colleges.length === 0 ? (
            <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-400 text-sm">No colleges in the list yet. Ask your team lead to add colleges.</div>
          ) : (
            <CollegeSearchableDropdown
              colleges={colleges}
              value={collegeId}
              onChange={setCollegeId}
              placeholder="Type to search by college name or place…"
            />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">Branch</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-3 placeholder:text-white/40 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none transition-all"
              placeholder="e.g. Main"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-3 placeholder:text-white/40 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none transition-all"
              placeholder="e.g. Mumbai"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-2">Stream</label>
          <input
            type="text"
            value={stream}
            onChange={(e) => setStream(e.target.value)}
            className="w-full rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-3 placeholder:text-white/40 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none transition-all"
            placeholder="e.g. Engineering"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-2">Campaign Date</label>
          <input
            type="date"
            value={campaignDate}
            onChange={(e) => setCampaignDate(e.target.value)}
            className="w-full rounded-xl border-2 border-white/10 bg-white/5 text-white px-4 py-3 [color-scheme:dark] min-h-[48px] cursor-pointer focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/30 outline-none transition-all"
            aria-label="Pick campaign date"
          />
        </div>
        {error && <p className="text-sm text-red-400 font-medium" role="alert">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || collegesLoading || colleges.length === 0}
            className="px-6 py-3 rounded-xl bg-[#FF7A00] text-black font-bold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#FF7A00]/20"
          >
            {loading ? 'Saving…' : 'Save Campaign'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border-2 border-white/20 text-white/80 font-semibold hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
