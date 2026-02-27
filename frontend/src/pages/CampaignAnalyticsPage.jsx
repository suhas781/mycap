/**
 * Campaign Analytics (read-only). For HR & Architect. Orange/black theme.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getStoredUser, setToken, setStoredUser } from '../api';
import CampaignAnalytics from '../components/campaigns/CampaignAnalytics';
import TeamWiseCampaignSummary from '../components/campaigns/TeamWiseCampaignSummary';
import BOEPerformanceByCampaign from '../components/campaigns/BOEPerformanceByCampaign';

const MAX_CAMPAIGNS_FOR_ASSIGNMENTS = 50;

export default function CampaignAnalyticsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsWithAssignments, setCampaignsWithAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getStoredUser();

  useEffect(() => {
    api('/campaigns')
      .then((list) => {
        setCampaigns(list || []);
        const ids = (list || []).slice(0, MAX_CAMPAIGNS_FOR_ASSIGNMENTS).map((c) => c.id);
        if (ids.length === 0) {
          setCampaignsWithAssignments([]);
          return;
        }
        return Promise.all(ids.map((id) => api(`/campaigns/${id}`))).then((details) => {
          setCampaignsWithAssignments(details || []);
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

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-100/80 dark:bg-dark">
      <header className="bg-white dark:bg-surface border-b border-slate-200/80 dark:border-dark-border px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white tracking-tight">Campaign analytics</h1>
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
            <p className="text-sm text-slate-500 dark:text-white/60">Loading…</p>
          </div>
        ) : (
          <div className="space-y-6">
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
