/**
 * SuggestionsPanel — Read-only suggestions based on pipeline insights (FE).
 * Orange/black theme.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { buildLeadsQuery } from './analyticsQuery';
import { getPipelineInsight } from './pipelineInsights';

export default function SuggestionsPanel({ teamLeadId, dateFrom, dateTo }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/leads${buildLeadsQuery({ teamLeadId, dateFrom, dateTo })}`)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [teamLeadId, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-white/5 px-4 py-3 border border-slate-100 dark:border-dark-border">
        <span className="inline-block w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" aria-hidden />
        <span className="text-sm text-slate-500 dark:text-white/60">Loading suggestions…</span>
      </div>
    );
  }

  const total = leads.length;
  const byPipeline = leads.reduce((acc, lead) => {
    const p = lead.pipeline || 'Unknown';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const suggestions = Object.entries(byPipeline)
    .map(([name, count]) => ({
      pipeline: name,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      insight: getPipelineInsight(name, total > 0 ? (count / total) * 100 : 0),
    }))
    .filter((s) => s.insight && !s.insight.includes('Healthy'))
    .slice(0, 8);

  return (
    <div className="space-y-4">
      {suggestions.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-white/60 rounded-lg bg-slate-50 dark:bg-white/5 px-4 py-3 border border-slate-100 dark:border-dark-border">
          Pipelines look balanced. No actions needed right now.
        </p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li
              key={s.pipeline}
              className="flex gap-3 rounded-lg border border-slate-100 dark:border-dark-border bg-slate-50/80 dark:bg-white/5 px-4 py-3 border-l-4 border-l-primary-500"
            >
              <span className="font-semibold text-slate-800 dark:text-white shrink-0">{s.pipeline}</span>
              <span className="text-sm text-slate-600 dark:text-white/80">{s.insight}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
