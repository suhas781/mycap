/**
 * Admin Team Performance — Per-team (team lead) performance: leads, campaigns, status breakdown.
 * Compare teams and see who is doing better. Respects date range and team filter.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function AdminTeamPerformancePanel({ teamLeadId, dateFrom, dateTo }) {
  const [data, setData] = useState({ teams: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('lead_count'); // lead_count | converted | campaign_count | total_campaign_leads

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (teamLeadId != null) params.set('team_lead_id', teamLeadId);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    const query = params.toString() ? `?${params.toString()}` : '';
    api(`/analytics/team-performance${query}`)
      .then((res) => setData(res?.teams ? res : { teams: [] }))
      .catch((err) => setError(err.message || 'Failed to load team performance'))
      .finally(() => setLoading(false));
  }, [teamLeadId, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="p-6 min-h-[220px] flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-slate-600 dark:text-white/80">
        <span className="inline-block w-8 h-8 border-2 border-[#FF7A00]/30 border-t-[#FF7A00] rounded-full animate-spin mb-3" aria-hidden />
        <p className="text-sm font-medium">Loading team performance…</p>
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

  const teams = [...(data.teams || [])];
  const sortKeys = {
    lead_count: (a, b) => (b.lead_count || 0) - (a.lead_count || 0),
    converted: (a, b) => (b.converted || 0) - (a.converted || 0),
    campaign_count: (a, b) => (b.campaign_count || 0) - (a.campaign_count || 0),
    total_campaign_leads: (a, b) => (b.total_campaign_leads || 0) - (a.total_campaign_leads || 0),
  };
  teams.sort(sortKeys[sortBy] || sortKeys.lead_count);

  const topLeadCount = Math.max(...teams.map((t) => t.lead_count || 0), 1);
  const topConverted = Math.max(...teams.map((t) => t.converted || 0), 1);

  if (teams.length === 0) {
    return (
      <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-slate-500 dark:text-white/60 text-center">
        No team data. Use filters above or ensure team leads and sources exist.
      </div>
    );
  }

  const isSingleTeam = teams.length === 1;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-white/70">
        {isSingleTeam
          ? "Your team's leads, campaigns, and conversions. Use the date range above. Sorted by your choice below."
          : "Compare each team's leads, campaigns, and conversions. Use the date range and team filter above. Sorted by your choice below."}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-white/50">Sort by:</span>
        {[
          { key: 'lead_count', label: 'Total leads' },
          { key: 'converted', label: 'Converted' },
          { key: 'campaign_count', label: 'Campaigns' },
          { key: 'total_campaign_leads', label: 'Campaign leads' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortBy(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortBy === key
                ? 'bg-[#FF7A00] text-black'
                : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-surface">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white/90">
              <th className="px-4 py-3 font-semibold">Team (Team Lead)</th>
              <th className="px-4 py-3 font-semibold text-right">BOEs</th>
              <th className="px-4 py-3 font-semibold text-right">Leads</th>
              <th className="px-4 py-3 font-semibold text-right">Unassigned</th>
              <th className="px-4 py-3 font-semibold text-right">NEW</th>
              <th className="px-4 py-3 font-semibold text-right">Call Back</th>
              <th className="px-4 py-3 font-semibold text-right">Converted</th>
              <th className="px-4 py-3 font-semibold text-right">Campaigns</th>
              <th className="px-4 py-3 font-semibold text-right">Campaign leads</th>
            </tr>
          </thead>
          <tbody className="text-slate-800 dark:text-white">
            {teams.map((team, index) => {
              const isTopLeads = topLeadCount > 0 && team.lead_count === topLeadCount;
              const isTopConverted = topConverted > 0 && team.converted === topConverted;
              return (
                <tr
                  key={team.team_lead_id}
                  className={`border-t border-slate-100 dark:border-white/5 ${
                    index === 0 ? 'bg-[#FF7A00]/10 dark:bg-[#FF7A00]/15' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <td className="px-4 py-3 font-medium">
                    {index === 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF7A00] text-black text-xs font-bold mr-2" title="Top by current sort">
                        #1
                      </span>
                    )}
                    {team.team_lead_name}
                  </td>
                  <td className="px-4 py-3 text-right">{team.boe_count ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={isTopLeads ? 'font-semibold text-[#FF7A00]' : ''}>{team.lead_count ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-white/60">{team.unassigned_count ?? 0}</td>
                  <td className="px-4 py-3 text-right">{team.new ?? 0}</td>
                  <td className="px-4 py-3 text-right">{team.call_back ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={isTopConverted ? 'font-semibold text-[#FF7A00]' : ''}>{team.converted ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{team.campaign_count ?? 0}</td>
                  <td className="px-4 py-3 text-right">{team.total_campaign_leads ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 dark:text-white/50">
        #1 and orange numbers show the top team by current sort. Lead counts use the selected date range and team filter.
      </p>
    </div>
  );
}
