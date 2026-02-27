/**
 * BOE: Read-only table of leads for a campaign. GET /campaigns/:id/leads.
 * Orange/black theme.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function CampaignLeadsTable({ campaignId, campaignLabel }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) {
      setLeads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api(`/campaigns/${campaignId}/leads`)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (!campaignId) {
    return (
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E] p-6 text-center text-white/50">
        Select a campaign to view leads
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E] overflow-hidden flex flex-col h-full min-h-0">
      <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-[#1A1A1A]">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white">Leads in campaign</h3>
        {campaignLabel && <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">{campaignLabel}</p>}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="p-6 text-center text-white/50">Loading…</div>
        ) : leads.length === 0 ? (
          <div className="p-6 text-center text-white/50">No leads yet. Add leads using the form on the right.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#FF7A00] text-black sticky top-0">
                <th className="px-3 py-2 font-semibold">Student</th>
                <th className="px-3 py-2 font-semibold">Phone</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Course</th>
                <th className="px-3 py-2 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-slate-200 dark:border-dark-border">
                  <td className="px-3 py-2">{l.student_name}</td>
                  <td className="px-3 py-2">{l.phone || '—'}</td>
                  <td className="px-3 py-2">{l.email || '—'}</td>
                  <td className="px-3 py-2">{l.course_selected || '—'}</td>
                  <td className="px-3 py-2 max-w-[180px] truncate" title={l.reason}>{l.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
