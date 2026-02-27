/**
 * BOE: Campaigns list + two-column layout: Leads table (left), Add Leads form (right).
 * Orange/black theme.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import AddCampaignForm from './AddCampaignForm';
import AddCampaignLeadTable from './AddCampaignLeadTable';
import CampaignLeadsTable from './CampaignLeadsTable';

export default function BOECampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null); // campaign to view leads & add leads

  function load() {
    setLoading(true);
    api('/campaigns/boe')
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  // Auto-select first campaign when list loads so Add Leads is visible right away
  useEffect(() => {
    if (campaigns.length > 0 && selectedCampaignId == null) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns.length, selectedCampaignId]);

  const selectedCampaign = selectedCampaignId ? campaigns.find((c) => c.id === selectedCampaignId) : null;
  const campaignLabel = selectedCampaign
    ? `${selectedCampaign.college_name}${selectedCampaign.city ? ` – ${selectedCampaign.city}` : ''}`
    : '';

  return (
    <div className="space-y-4 flex flex-col min-h-0">
      {/* Two primary buttons always visible */}
      <div className="flex flex-wrap gap-3 items-center shrink-0">
        <button
          type="button"
          onClick={() => setShowAddCampaign(true)}
          className="px-4 py-2.5 rounded-xl bg-[#FF7A00] text-black font-semibold hover:opacity-90 shadow-sm"
        >
          Add Campaign Details
        </button>
        <button
          type="button"
          onClick={() => campaigns.length > 0 && setSelectedCampaignId(campaigns[0].id)}
          disabled={campaigns.length === 0}
          title={campaigns.length === 0 ? 'Create a campaign first' : 'View leads and add new leads'}
          className="px-4 py-2.5 rounded-xl bg-[#FF7A00] text-black font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          Add Leads
        </button>
        {campaigns.length > 0 && (
          <>
            <span className="text-slate-500 dark:text-white/50 text-sm ml-1">Campaign:</span>
            <select
              value={selectedCampaignId ?? ''}
              onChange={(e) => setSelectedCampaignId(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border-2 border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white px-3 py-2 text-sm min-w-[200px]"
              aria-label="Select campaign to view leads and add leads"
            >
              <option value="">Select campaign…</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.college_name}{c.city ? ` – ${c.city}` : ''}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {showAddCampaign && (
        <AddCampaignForm
          onSuccess={() => { setShowAddCampaign(false); load(); }}
          onCancel={() => setShowAddCampaign(false)}
        />
      )}

      {selectedCampaign ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 flex flex-col lg:flex-row">
          <div className="min-h-[280px] lg:min-h-0 flex-1 flex flex-col overflow-hidden">
            <CampaignLeadsTable campaignId={selectedCampaign.id} campaignLabel={campaignLabel} />
          </div>
          <div className="min-h-[280px] lg:min-h-0 flex-1 flex flex-col overflow-hidden">
            <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E] overflow-auto flex flex-col h-full min-h-0">
              <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-[#1A1A1A]">
                <h3 className="font-display font-semibold text-slate-800 dark:text-white">Add Leads</h3>
                <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">{campaignLabel}</p>
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-4">
                <AddCampaignLeadTable
                  campaignId={selectedCampaign.id}
                  campaignLabel={null}
                  onSuccess={load}
                  onCancel={undefined}
                />
              </div>
            </div>
          </div>
        </div>
      ) : !showAddCampaign && (
        <>
          <h3 className="font-display font-semibold text-slate-800 dark:text-white shrink-0">My Campaigns</h3>
          {loading ? (
            <p className="text-slate-500 dark:text-white/50">Loading…</p>
          ) : campaigns.length === 0 ? (
            <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-white/5 p-6 text-center text-slate-600 dark:text-white/70">
              <p className="font-medium text-white/90 mb-2">No campaigns yet.</p>
              <p className="text-sm mb-4">Use <strong>Add Campaign Details</strong> above to create a campaign, then use <strong>Add Leads</strong> to add students to it.</p>
              <p className="text-xs text-white/50">Both buttons are at the top of this page.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E] shrink-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FF7A00] text-black">
                    <th className="px-4 py-3 font-semibold">College</th>
                    <th className="px-4 py-3 font-semibold">Branch</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold">Stream</th>
                    <th className="px-4 py-3 font-semibold">Campaign Date</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-t border-slate-200 dark:border-dark-border">
                      <td className="px-4 py-3">{c.college_name}</td>
                      <td className="px-4 py-3">{c.branch || '—'}</td>
                      <td className="px-4 py-3">{c.city || '—'}</td>
                      <td className="px-4 py-3">{c.stream || '—'}</td>
                      <td className="px-4 py-3">{c.campaign_date || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCampaignId(c.id)}
                          className="text-sm font-medium text-[#FF7A00] hover:underline"
                        >
                          View leads & add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
