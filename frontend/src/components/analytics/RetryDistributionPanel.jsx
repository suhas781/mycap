/**
 * RetryDistributionPanel — Retry count distribution with bar chart + table.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { buildLeadsQuery } from './analyticsQuery';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#FF7A00', '#ff9a33', '#ffb366', '#ffcc99', '#e66d00'];

export default function RetryDistributionPanel({ teamLeadId, dateFrom, dateTo }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/leads${buildLeadsQuery({ teamLeadId, dateFrom, dateTo })}`).then(setLeads).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [teamLeadId, dateFrom, dateTo]);

  if (loading) return <div className="p-6 min-h-[200px] rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface-elevated text-slate-600 dark:text-white/80 flex items-center justify-center shadow-card dark:shadow-card-dark">Loading…</div>;
  if (error) return <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface-elevated text-primary-500 shadow-card dark:shadow-card-dark" role="alert">{error}</div>;

  const byRetry = leads.reduce((acc, l) => {
    const r = l.retry_count ?? 0;
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});
  const rows = Object.entries(byRetry).sort((a, b) => Number(a[0]) - Number(b[0]));
  const chartData = rows.map(([retry, count]) => ({ name: `Retry ${retry}`, fullName: `Retry count ${retry}`, count }));

  return (
    <div className="space-y-4">
      {chartData.length > 0 && (
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface-elevated p-4 shadow-card dark:shadow-card-dark">
          <h3 className="text-slate-900 dark:text-primary-500 font-semibold mb-3">Retry distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 11 }} stroke="#666" />
              <YAxis tick={{ fill: '#fff', fontSize: 11 }} stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #FF7A00', borderRadius: 8 }} formatter={(v) => [v, 'Leads']} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface-elevated overflow-hidden shadow-card dark:shadow-card-dark">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-primary-500 text-black">
              <th className="px-4 py-3 font-semibold">Retry count</th>
              <th className="px-4 py-3 font-semibold text-right">Leads</th>
            </tr>
          </thead>
          <tbody className="text-slate-800 dark:text-white">
            {rows.map(([retry, count]) => (
              <tr key={retry} className="border-t border-dark-border">
                <td className="px-4 py-2">{retry}</td>
                <td className="px-4 py-2 text-right font-medium">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
