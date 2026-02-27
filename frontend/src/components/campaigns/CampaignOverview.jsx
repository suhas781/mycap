/**
 * CampaignOverview — Team Lead: summary cards + pipeline-style progress from GET /campaigns.
 * Orange/black theme. FE-only charts (Recharts if available).
 */
import { useMemo } from 'react';

function PipelineBar({ completed, total, label }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700 dark:text-white/80">{label}</span>
        <span className="font-medium text-primary-500">{completed}/{total} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CampaignOverview({ campaigns }) {
  const stats = useMemo(() => {
    const total = campaigns.length;
    const byStatus = (campaigns || []).reduce((acc, c) => {
      const s = c.status || 'ACTIVE';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const completed = byStatus.COMPLETED || 0;
    const active = byStatus.ACTIVE || 0;
    const closed = byStatus.CLOSED || 0;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, closed, completionRate, byStatus };
  }, [campaigns]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase">Total campaigns</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border-2 border-primary-500/40 bg-primary-500/10 dark:bg-primary-500/20 p-4">
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase">Active</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.active}</p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.completed}</p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase">Completion rate</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.completionRate}%</p>
        </div>
      </div>
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Progress</h4>
        <div className="space-y-3">
          <PipelineBar completed={stats.completed} total={stats.total} label="Completed" />
          <PipelineBar completed={stats.active} total={stats.total} label="Active" />
          <PipelineBar completed={stats.closed} total={stats.total} label="Closed" />
        </div>
      </div>
    </div>
  );
}
