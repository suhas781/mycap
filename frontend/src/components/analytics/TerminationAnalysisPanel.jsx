/**
 * TerminationAnalysisPanel — Inactive/terminated by status with bar chart + table.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { buildLeadsQuery } from './analyticsQuery';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#FF7A00', '#ff9a33', '#e66d00', '#cc5c00', '#993d00'];

export default function TerminationAnalysisPanel({ teamLeadId, dateFrom, dateTo }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/leads${buildLeadsQuery({ teamLeadId, dateFrom, dateTo })}`).then(setLeads).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [teamLeadId, dateFrom, dateTo]);

  if (loading) return <div className="p-6 min-h-[200px] rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-slate-600 dark:text-white/80 flex items-center justify-center shadow-card dark:shadow-card-dark">Loading…</div>;
  if (error) return <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-primary-500 shadow-card dark:shadow-card-dark" role="alert">{error}</div>;

  const inactive = leads.filter((l) => !l.is_active);
  const byStatus = inactive.reduce((acc, l) => {
    const s = l.status || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const rows = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  const chartData = rows.map(([status, count]) => ({ name: status.length > 10 ? status.slice(0, 10) + '…' : status, fullName: status, count }));

  return (
    <div className="space-y-4">
      {chartData.length > 0 && (
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4 shadow-card dark:shadow-card-dark">
          <h3 className="text-slate-900 dark:text-primary-500 font-semibold mb-3">Terminated by status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 10 }} stroke="#666" />
              <YAxis tick={{ fill: '#fff', fontSize: 11 }} stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #FF7A00', borderRadius: 8 }} formatter={(v) => [v, 'Count']} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface overflow-hidden shadow-card dark:shadow-card-dark">
        <div className="bg-primary-500 text-black px-4 py-3 font-semibold">Inactive / terminated: {inactive.length}</div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-200 dark:bg-dark-border text-slate-800 dark:text-white">
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Count</th>
            </tr>
          </thead>
          <tbody className="text-slate-800 dark:text-white">
            {rows.map(([status, count]) => (
              <tr key={status} className="border-t border-slate-200 dark:border-dark-border">
                <td className="px-4 py-2">{status}</td>
                <td className="px-4 py-2 text-right">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && inactive.length === 0 && <p className="p-6 text-slate-600 dark:text-white/80 text-center rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface shadow-card dark:shadow-card-dark">No inactive leads.</p>}
    </div>
  );
}
