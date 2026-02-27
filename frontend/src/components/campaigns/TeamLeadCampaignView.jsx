/**
 * Team Lead: Read-only view of BOE campaigns and their leads. GET /campaigns/team, GET /campaigns/:id/leads.
 * Orange/black theme.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function TeamLeadCampaignView() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  function load() {
    setLoading(true);
    api('/campaigns/team')
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!expandedId) {
      setLeads([]);
      return;
    }
    setLeadsLoading(true);
    api(`/campaigns/${expandedId}/leads`)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLeadsLoading(false));
  }, [expandedId]);

  if (loading) return <p className="text-white/60">Loading campaigns…</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-white">Campaigns (read-only)</h3>
      {campaigns.length === 0 ? (
        <div className="rounded-xl border-2 border-dark-border bg-[#0E0E0E] p-6 text-center text-white/50">
          No campaigns from your BOEs yet.
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E] overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-white/5"
              >
                <span className="font-medium text-white">{c.college_name} – {c.boe_name}</span>
                <span className="text-white/50 text-sm">{c.city || ''} {c.stream || ''}</span>
              </button>
              {expandedId === c.id && (
                <div className="border-t border-dark-border px-4 py-3 bg-[#1A1A1A]">
                  {leadsLoading ? (
                    <p className="text-white/50">Loading leads…</p>
                  ) : leads.length === 0 ? (
                    <p className="text-white/50">No leads in this campaign.</p>
                  ) : (
                    <table className="w-full text-sm text-white">
                      <thead>
                        <tr className="text-white/70">
                          <th className="px-2 py-1 text-left">Student</th>
                          <th className="px-2 py-1 text-left">Phone</th>
                          <th className="px-2 py-1 text-left">Email</th>
                          <th className="px-2 py-1 text-left">Course</th>
                          <th className="px-2 py-1 text-left">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((l) => (
                          <tr key={l.id} className="border-t border-white/10">
                            <td className="px-2 py-1">{l.student_name}</td>
                            <td className="px-2 py-1">{l.phone || '—'}</td>
                            <td className="px-2 py-1">{l.email || '—'}</td>
                            <td className="px-2 py-1">{l.course_selected || '—'}</td>
                            <td className="px-2 py-1 max-w-[200px] truncate" title={l.reason}>{l.reason || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
