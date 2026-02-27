/**
 * Admin Dashboard — Analytics with charts, date range, team filter. Calendar/trend view.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getStoredUser, setToken, setStoredUser } from '../api';
import ToolSelector from '../components/analytics/ToolSelector';
import DateRangePicker from '../components/analytics/DateRangePicker';
import OverviewDashboardPanel from '../components/analytics/OverviewDashboardPanel';
import PipelinePercentagePanel from '../components/analytics/PipelinePercentagePanel';
import StatusCountTable from '../components/analytics/StatusCountTable';
import BOEPerformanceTable from '../components/analytics/BOEPerformanceTable';
import RetryDistributionPanel from '../components/analytics/RetryDistributionPanel';
import FollowUpDuePanel from '../components/analytics/FollowUpDuePanel';
import TerminationAnalysisPanel from '../components/analytics/TerminationAnalysisPanel';
import ConversionFunnelPanel from '../components/analytics/ConversionFunnelPanel';
import LeadsOverTimePanel from '../components/analytics/LeadsOverTimePanel';
import AdminCampaignPanel from '../components/analytics/AdminCampaignPanel';
import AdminTeamPerformancePanel from '../components/analytics/AdminTeamPerformancePanel';
import SuggestionsPanel from '../components/analytics/SuggestionsPanel';
import RevenueAnalytics from '../components/analytics/RevenueAnalytics';

const VIEW_MAP = {
  overview: OverviewDashboardPanel,
  calendar: LeadsOverTimePanel,
  campaign: AdminCampaignPanel,
  teamperf: AdminTeamPerformancePanel,
  revenue: RevenueAnalytics,
  pipeline: PipelinePercentagePanel,
  status: StatusCountTable,
  boe: BOEPerformanceTable,
  retry: RetryDistributionPanel,
  followup: FollowUpDuePanel,
  termination: TerminationAnalysisPanel,
  funnel: ConversionFunnelPanel,
};

export default function AdminDashboard() {
  const [activeTool, setActiveTool] = useState('overview');
  const [teamLeads, setTeamLeads] = useState([]);
  const [selectedTeamLeadId, setSelectedTeamLeadId] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const user = getStoredUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    api('/users/team-leads').then(setTeamLeads).catch(() => setTeamLeads([]));
  }, []);

  function handleLogout() {
    setToken(null);
    setStoredUser(null);
    navigate('/login', { replace: true });
  }

  const ActiveView = VIEW_MAP[activeTool] || OverviewDashboardPanel;
  const teamLeadId = selectedTeamLeadId === '' ? null : selectedTeamLeadId;

  const viewLabels = {
    overview: 'Overview',
    calendar: 'Leads Over Time',
    campaign: 'Campaign',
    teamperf: 'Team Performance',
    revenue: 'Revenue Generated',
    pipeline: 'Pipeline',
    status: 'Status',
    boe: 'BOE Performance',
    retry: 'Retry',
    followup: 'Follow-Up Due',
    termination: 'Termination',
    funnel: 'Funnel',
  };
  const currentViewLabel = viewLabels[activeTool] ?? 'Overview';

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-100/80 dark:bg-dark">
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200/80 dark:border-dark-border bg-white dark:bg-surface shadow-sm">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white tracking-tight">Analytics</h1>
          <span className="text-sm text-slate-500 dark:text-white/60 hidden sm:inline">Admin · Lead insights</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5">
            <span className="text-sm font-medium text-slate-600 dark:text-white/80 truncate max-w-[140px] sm:max-w-none">{user?.name}</span>
            <span className="text-slate-400 dark:text-white/40">·</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-slate-500 dark:text-white/60 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 overflow-hidden">
        <section className="shrink-0 mb-4" aria-label="Filters">
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface border border-slate-200/80 dark:border-dark-border shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-white/50">Filters</span>
            <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
            <div className="h-4 w-px bg-slate-200 dark:bg-dark-border hidden sm:block" />
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-white/80">Team</span>
              <select
                value={selectedTeamLeadId ?? ''}
                onChange={(e) => setSelectedTeamLeadId(e.target.value === '' ? null : Number(e.target.value))}
                className="min-w-[180px] rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:[color-scheme:dark]"
                aria-label="Filter by team"
              >
                <option value="">All teams</option>
                {teamLeads.map((tl) => (
                  <option key={tl.id} value={tl.id}>{tl.name}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="shrink-0 mb-3" aria-label="View">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-2">View</p>
          <ToolSelector activeTool={activeTool} onSelect={setActiveTool} />
        </section>

        <div className="flex-1 min-h-0 overflow-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 min-h-[400px] flex flex-col">
            <div className="flex-1 min-h-0 rounded-2xl border border-slate-200/80 dark:border-dark-border bg-white dark:bg-surface shadow-sm overflow-hidden flex flex-col">
              <div className="shrink-0 px-5 py-3 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-white/5">
                <h2 className="font-display font-semibold text-slate-800 dark:text-white">{currentViewLabel}</h2>
                <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">Data for selected date range and team</p>
              </div>
              <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-auto">
                <ActiveView teamLeadId={teamLeadId} dateFrom={dateFrom} dateTo={dateTo} />
              </div>
            </div>
          </div>
          <div className="min-h-[300px] flex flex-col">
            <div className="flex-1 min-h-0 rounded-2xl border border-slate-200/80 dark:border-dark-border bg-white dark:bg-surface shadow-sm overflow-hidden flex flex-col">
              <div className="shrink-0 px-5 py-3 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-white/5">
                <h2 className="font-display font-semibold text-slate-800 dark:text-white">Suggestions</h2>
                <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">Actions based on pipeline balance</p>
              </div>
              <div className="flex-1 min-h-0 p-4 overflow-auto">
                <SuggestionsPanel teamLeadId={teamLeadId} dateFrom={dateFrom} dateTo={dateTo} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
