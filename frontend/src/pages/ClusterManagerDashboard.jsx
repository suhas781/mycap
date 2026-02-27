/**
 * Cluster Manager Dashboard. View ALL campaigns, analytics, performance charts. Read-only.
 * Orange/black theme.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getStoredUser, setToken, setStoredUser } from '../api';
import CampaignAnalytics from '../components/campaigns/CampaignAnalytics';
import TeamWiseCampaignSummary from '../components/campaigns/TeamWiseCampaignSummary';
import BOEPerformanceByCampaign from '../components/campaigns/BOEPerformanceByCampaign';

const MAX_CAMPAIGNS_FOR_ASSIGNMENTS = 50;

export default function ClusterManagerDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsWithAssignments, setCampaignsWithAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getStoredUser();

  useEffect(() => {
    api('/campaigns')
      .then((list) => {
        setCampaigns(list);
        const ids = (list || []).slice(0, MAX_CAMPAIGNS_FOR_ASSIGNMENTS).map((c) => c.id);
        if (ids.length === 0) {
          setCampaignsWithAssignments([]);
          return;
        }
        return Promise.all(ids.map((id) => api(`/campaigns/${id}`))).then((details) => {
          setCampaignsWithAssignments(details);
        });
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    setToken(null);
    setStoredUser(null);
    navigate('/login', { replace: true });
  }

  const total = campaigns.length;
  const byStatus = (campaigns || []).reduce((acc, c) => {
    const s = c.status || 'ACTIVE';
    acc[s] = (acc[s] || 0) + 1;
  }, {});
  const completed = byStatus.COMPLETED || 0;
  const active = byStatus.ACTIVE || 0;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-100/80 dark:bg-dark">
      <header className="bg-white dark:bg-surface border-b border-slate-200/80 dark:border-dark-border px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white tracking-tight">Cluster Manager — Campaigns</h1>
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

      <main className="flex-1 min-h-0 p-4 sm:p-6 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="inline-block w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-white/60">Loading campaigns…</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase">Total campaigns</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{total}</p>
              </div>
              <div className="rounded-xl border-2 border-primary-500/40 bg-primary-500/10 dark:bg-primary-500/20 p-4">
                <p className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase">Active</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{active}</p>
              </div>
              <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{completed}</p>
              </div>
              <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase">Completion rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{completionRate}%</p>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TeamWiseCampaignSummary campaigns={campaigns} />
              <BOEPerformanceByCampaign campaignsWithAssignments={campaignsWithAssignments} />
            </section>

            <section>
              <CampaignAnalytics campaigns={campaigns} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
