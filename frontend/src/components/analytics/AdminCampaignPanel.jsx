/**
 * Admin Campaign panel — Campaign performance per team. Fetches GET /analytics/campaigns/admin.
 * Respects team filter: when a team is selected, shows only that team; otherwise all teams.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function AdminCampaignPanel({ teamLeadId, dateFrom, dateTo }) {
  const [data, setData] = useState({ teams: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    const query = teamLeadId != null ? `?team_lead_id=${teamLeadId}` : '';
    api(`/analytics/campaigns/admin${query}`)
      .then((res) => setData(res?.teams ? res : { teams: [] }))
      .catch((err) => setError(err.message || 'Failed to load campaign data'))
      .finally(() => setLoading(false));
  }, [teamLeadId]);

  if (loading) {
    return (
      <div className="p-6 min-h-[220px] flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-slate-600 dark:text-white/80">
        <span className="inline-block w-8 h-8 border-2 border-[#FF7A00]/30 border-t-[#FF7A00] rounded-full animate-spin mb-3" aria-hidden />
        <p className="text-sm font-medium">Loading campaign performance…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 min-h-[120px] rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-red-500 dark:text-red-400 flex items-center justify-center" role="alert">
        {error}
      </div>
    );
  }

  const teams = data.teams || [];

  if (teams.length === 0) {
    return (
      <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-slate-500 dark:text-white/60 text-center">
        No team data. Select a team or use &quot;All teams&quot; to see campaign performance.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-white/70">
        BOE campaign counts and leads added per campaign, by team. Use the team filter above to focus on one team.
      </p>
      <div className="space-y-3">
        {teams.map((team) => (
          <div
            key={team.team_lead_id}
            className="rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-surface overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedTeamId(expandedTeamId === team.team_lead_id ? null : team.team_lead_id)}
              className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold text-slate-900 dark:text-white">{team.team_lead_name}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-600 dark:text-white/70">
                  <strong className="text-slate-800 dark:text-white">{team.boe_count}</strong> BOE{team.boe_count !== 1 ? 's' : ''}
                </span>
                <span className="text-slate-600 dark:text-white/70">
                  <strong className="text-[#FF7A00]">{team.campaign_count}</strong> campaigns
                </span>
                <span className="text-slate-600 dark:text-white/70">
                  <strong className="text-slate-800 dark:text-white">{team.total_campaign_leads}</strong> leads
                </span>
              </div>
              <span className="text-slate-400 dark:text-white/40 text-xs" aria-hidden>
                {expandedTeamId === team.team_lead_id ? '▼' : '▶'}
              </span>
            </button>
            {expandedTeamId === team.team_lead_id && team.boes?.length > 0 && (
              <div className="border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 dark:text-white/50">
                      <th className="px-4 py-2 font-medium">BOE</th>
                      <th className="px-4 py-2 font-medium text-right">Campaigns</th>
                      <th className="px-4 py-2 font-medium text-right">Leads</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800 dark:text-white">
                    {team.boes.map((boe) => (
                      <tr key={boe.boe_id} className="border-t border-slate-100 dark:border-white/5">
                        <td className="px-4 py-2">{boe.boe_name || `BOE #${boe.boe_id}`}</td>
                        <td className="px-4 py-2 text-right">{boe.campaign_count ?? 0}</td>
                        <td className="px-4 py-2 text-right">{boe.lead_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
