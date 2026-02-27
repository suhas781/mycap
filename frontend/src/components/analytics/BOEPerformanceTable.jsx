/**
 * BOEPerformanceTable — BOE lead counts with horizontal bar chart. Date range supported.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { buildLeadsQuery } from './analyticsQuery';
import BOEBarChart from './BOEBarChart';

export default function BOEPerformanceTable({ teamLeadId, dateFrom, dateTo }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api(`/leads${buildLeadsQuery({ teamLeadId, dateFrom, dateTo })}`)
      .then(setLeads)
      .catch((err) => setError(err.message || 'Failed to load leads'))
      .finally(() => setLoading(false));
  }, [teamLeadId, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="p-6 min-h-[220px] flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-slate-600 dark:text-white/80 shadow-card dark:shadow-card-dark">
        <span className="inline-block w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-3" aria-hidden />
        <p className="text-sm font-medium">Loading BOE details…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 min-h-[120px] rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-primary-500 flex items-center justify-center shadow-card dark:shadow-card-dark" role="alert">
        {error}
      </div>
    );
  }

  const assigned = leads.filter((l) => l.assigned_boe_id != null);
  const byBoe = assigned.reduce((acc, lead) => {
    const name = lead.assigned_boe_name || `BOE #${lead.assigned_boe_id}`;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const rows = Object.entries(byBoe).sort((a, b) => b[1] - a[1]);
  const unassignedCount = leads.length - assigned.length;

  return (
    <div className="space-y-4">
      {rows.length > 0 && (
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4 shadow-card dark:shadow-card-dark">
          <h3 className="text-slate-900 dark:text-primary-500 font-semibold mb-3">BOE performance</h3>
          <BOEBarChart data={rows} height={Math.max(220, rows.length * 36)} />
        </div>
      )}
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface overflow-hidden shadow-card dark:shadow-card-dark">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-primary-500 text-black">
            <th className="px-4 py-3 font-semibold">BOE</th>
            <th className="px-4 py-3 font-semibold text-right">Assigned leads</th>
          </tr>
        </thead>
        <tbody className="text-slate-800 dark:text-white">
          {unassignedCount > 0 && (
            <tr className="border-t border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-surface-elevated">
              <td className="px-4 py-2 text-slate-500 dark:text-white/70">Unassigned</td>
              <td className="px-4 py-2 text-right font-medium">{unassignedCount}</td>
            </tr>
          )}
          {rows.map(([name, count]) => (
            <tr key={name} className="border-t border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-surface-elevated">
              <td className="px-4 py-2">{name}</td>
              <td className="px-4 py-2 text-right font-medium">{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && unassignedCount === 0 && (
        <p className="p-6 text-slate-500 dark:text-white/80 text-center">No assignment data.</p>
      )}
      </div>
    </div>
  );
}
