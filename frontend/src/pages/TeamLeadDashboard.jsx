/**
 * Team Lead Dashboard. Leads table + Team analytics (BOE performance, pipeline, trend). Bulk assignment.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getStoredUser, setToken, setStoredUser } from '../api';
import SyncLeadsButton from '../components/SyncLeadsButton';
import TeamLeadLeadTable from '../components/teamlead/TeamLeadLeadTable';
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
import SuggestionsPanel from '../components/analytics/SuggestionsPanel';
import RevenueAnalytics from '../components/analytics/RevenueAnalytics';
import AdminTeamPerformancePanel from '../components/analytics/AdminTeamPerformancePanel';
import CampaignAnalyticsDashboard from '../components/campaigns/CampaignAnalyticsDashboard';
import CollegeEditorTable from '../components/campaigns/CollegeEditorTable';
import TeamLeadCampaignView from '../components/campaigns/TeamLeadCampaignView';
import TeamLeadAnalyticsSidebar from '../components/teamlead/TeamLeadAnalyticsSidebar';
import TeamLeadCategoriesSidebar from '../components/teamlead/TeamLeadCategoriesSidebar';
import TeamLeadCoursesView from '../components/teamlead/TeamLeadCoursesView';
import { getFilteredLeads } from '../components/boe/BOESidebar';

const VIEW_MAP = {
  overview: OverviewDashboardPanel,
  calendar: LeadsOverTimePanel,
  campaign: CampaignAnalyticsDashboard,
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

export default function TeamLeadDashboard() {
  const [view, setView] = useState('leads'); // 'leads' | 'analytics' | 'campaigns' | 'colleges'
  const [activeTool, setActiveTool] = useState('overview');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [leads, setLeads] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [boes, setBoes] = useState([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaignTab, setCampaignTab] = useState('analytics'); // 'analytics' | 'colleges' | 'view'
  const navigate = useNavigate();
  const user = getStoredUser();

  function loadSources() {
    api('/lead-sources')
      .then((list) => {
        setSources(list);
        if (list.length > 0 && selectedSourceId === null) setSelectedSourceId(list[0].id);
      })
      .catch(() => setSources([]));
  }

  function loadLeads() {
    setLoading(true);
    const params = new URLSearchParams();
    if (includeInactive) params.set('inactive', '1');
    if (selectedSourceId != null && selectedSourceId !== '') params.set('source_id', selectedSourceId);
    const query = params.toString() ? `?${params.toString()}` : '';
    api(`/leads${query}`)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }

  function loadBoes() {
    api('/users/boes').then(setBoes).catch(() => setBoes([]));
  }

  useEffect(() => {
    loadSources();
  }, []);

  useEffect(() => {
    loadLeads();
  }, [includeInactive, selectedSourceId]);

  useEffect(() => {
    loadBoes();
  }, []);

  useEffect(() => {
    if (view === 'analytics') loadLeads();
  }, [view]);

  function handleLogout() {
    setToken(null);
    setStoredUser(null);
    navigate('/login', { replace: true });
  }

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
    <div className="h-full w-full flex overflow-hidden bg-slate-100/80 dark:bg-dark">
      <aside className="w-60 shrink-0 bg-white dark:bg-surface border-r border-slate-200/80 dark:border-dark-border flex flex-col shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-dark-border">
          <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white tracking-tight">Team Lead</h1>
          <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Lead management & analytics</p>
        </div>
        <nav className="p-3 flex-1 flex flex-col gap-4" aria-label="Main navigation">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2 px-2">Section</p>
            <div className="flex flex-col gap-1 rounded-xl bg-slate-100 dark:bg-white/5 p-1">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setView('leads')}
                  className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all ${view === 'leads' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 dark:text-white/70 hover:bg-slate-200/80 dark:hover:bg-white/10'}`}
                >
                  Leads
                </button>
                <button
                  type="button"
                  onClick={() => setView('analytics')}
                  className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all ${view === 'analytics' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 dark:text-white/70 hover:bg-slate-200/80 dark:hover:bg-white/10'}`}
                >
                  Analytics
                </button>
              </div>
              <button
                type="button"
                onClick={() => setView('campaigns')}
                className={`py-2.5 px-3 text-sm font-semibold rounded-lg transition-all ${view === 'campaigns' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 dark:text-white/70 hover:bg-slate-200/80 dark:hover:bg-white/10'}`}
              >
                Campaigns
              </button>
              <button
                type="button"
                onClick={() => setView('courses')}
                className={`py-2.5 px-3 text-sm font-semibold rounded-lg transition-all ${view === 'courses' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 dark:text-white/70 hover:bg-slate-200/80 dark:hover:bg-white/10'}`}
              >
                Courses
              </button>
              <button
                type="button"
                onClick={() => setView('colleges')}
                className={`py-2.5 px-3 text-sm font-semibold rounded-lg transition-all ${view === 'colleges' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 dark:text-white/70 hover:bg-slate-200/80 dark:hover:bg-white/10'}`}
              >
                College list
              </button>
            </div>
          </div>
          {view === 'leads' && (
            <>
              {sources.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2 px-2">Source</p>
                  <select
                    value={selectedSourceId ?? sources[0]?.id ?? ''}
                    onChange={(e) => setSelectedSourceId(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    aria-label="Lead source"
                  >
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <SyncLeadsButton sources={sources} onSynced={() => { loadLeads(); loadSources(); }} />
              </div>
              <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="rounded border-slate-300 dark:border-dark-border bg-white dark:bg-white/5 text-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-white/80">Include inactive leads</span>
              </label>
            </>
          )}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="bg-white dark:bg-surface border-b border-slate-200/80 dark:border-dark-border px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {view === 'leads' ? 'Leads' : view === 'campaigns' ? 'Campaigns' : view === 'courses' ? 'Courses' : view === 'colleges' ? 'College list' : 'Team analytics'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600 dark:text-white/80">{user?.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-slate-500 dark:text-white/60 hover:text-primary-500 transition-colors"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col overflow-hidden">
          {view === 'leads' ? (
            <div className="flex-1 min-h-0 flex min-w-0 rounded-2xl border border-slate-200/80 dark:border-dark-border bg-white dark:bg-surface shadow-sm overflow-hidden">
              <TeamLeadCategoriesSidebar
                leads={leads}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
              />
              <div className="flex-1 min-h-0 flex flex-col min-w-0">
                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
                    <span className="inline-block w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" aria-hidden />
                    <p className="text-sm font-medium text-slate-500 dark:text-white/60">Loading leads…</p>
                  </div>
                ) : (
                  <TeamLeadLeadTable leads={getFilteredLeads(leads, activeCategory)} boes={boes} onRefresh={loadLeads} />
                )}
              </div>
            </div>
          ) : view === 'courses' ? (
            <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
              <TeamLeadCoursesView />
            </div>
          ) : view === 'colleges' ? (
            <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
              <p className="text-slate-500 dark:text-white/50 text-sm mb-4">View and manage the college list (ID, Place, College name). Used in campaigns and lead assignment.</p>
              <CollegeEditorTable />
            </div>
          ) : view === 'campaigns' ? (
            <div className="flex-1 min-h-0 overflow-auto flex flex-col">
              <div className="shrink-0 flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setCampaignTab('analytics')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${campaignTab === 'analytics' ? 'bg-[#FF7A00] text-black' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70'}`}
                >
                  Campaign analytics
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignTab('colleges')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${campaignTab === 'colleges' ? 'bg-[#FF7A00] text-black' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70'}`}
                >
                  College list
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignTab('view')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${campaignTab === 'view' ? 'bg-[#FF7A00] text-black' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70'}`}
                >
                  Campaigns (read-only)
                </button>
              </div>
              {campaignTab === 'analytics' && <CampaignAnalyticsDashboard />}
              {campaignTab === 'colleges' && <CollegeEditorTable />}
              {campaignTab === 'view' && <TeamLeadCampaignView />}
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex overflow-hidden">
              <TeamLeadAnalyticsSidebar leads={leads} />
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <section className="shrink-0 mb-4" aria-label="Filters">
                  <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface border border-slate-200/80 dark:border-dark-border shadow-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-white/50">Filters</span>
                    <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
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
                        <h3 className="font-display font-semibold text-slate-800 dark:text-white">{currentViewLabel}</h3>
                        <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">Your team data for the selected period</p>
                      </div>
                      <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-auto">
                        {(() => {
                          const ActiveView = VIEW_MAP[activeTool] || OverviewDashboardPanel;
                          return <ActiveView teamLeadId={user?.id ?? null} dateFrom={dateFrom} dateTo={dateTo} />;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="min-h-[300px] flex flex-col">
                    <div className="flex-1 min-h-0 rounded-2xl border border-slate-200/80 dark:border-dark-border bg-white dark:bg-surface shadow-sm overflow-hidden flex flex-col">
                      <div className="shrink-0 px-5 py-3 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-white/5">
                        <h3 className="font-display font-semibold text-slate-800 dark:text-white">Suggestions</h3>
                        <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">Actions based on pipeline balance</p>
                      </div>
                      <div className="flex-1 min-h-0 p-4 overflow-auto">
                        <SuggestionsPanel teamLeadId={user?.id ?? null} dateFrom={dateFrom} dateTo={dateTo} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
