/**
 * StatusCountTable — Status counts from GET /leads with bar chart. Date range supported.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { buildLeadsQuery } from './analyticsQuery';
import StatusBarChart from './StatusBarChart';

export default function StatusCountTable({ teamLeadId, dateFrom, dateTo }) {
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
      <div className="p-6 bg-white dark:bg-surface rounded-xl border-2 border-slate-200 dark:border-dark-border text-slate-600 dark:text-white text-center shadow-card dark:shadow-card-dark">
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-surface rounded-xl border-2 border-slate-200 dark:border-dark-border text-primary-500 shadow-card dark:shadow-card-dark" role="alert">
        {error}
      </div>
    );
  }

  const byStatus = leads.reduce((acc, lead) => {
    const s = lead.status || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const rows = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4 shadow-card dark:shadow-card-dark">
        <h3 className="text-slate-900 dark:text-primary-500 font-semibold mb-3">Status distribution</h3>
        <StatusBarChart data={rows} height={260} />
      </div>
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface overflow-hidden shadow-card dark:shadow-card-dark">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-primary-500 text-black">
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Count</th>
          </tr>
        </thead>
        <tbody className="text-slate-800 dark:text-white">
          {rows.map(([status, count]) => (
            <tr key={status} className="border-t border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-surface-elevated">
              <td className="px-4 py-2">{status}</td>
              <td className="px-4 py-2 text-right font-medium">{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-6 text-slate-500 dark:text-white/80 text-center">No status data.</p>
      )}
      </div>
    </div>
  );
}
