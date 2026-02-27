/**
 * ConversionFunnelPanel — Funnel by status with horizontal bar chart + table.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { buildLeadsQuery } from './analyticsQuery';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#FF7A00', '#ff9a33', '#ffb366', '#ffcc99', '#e66d00', '#cc5c00', '#b34d00', '#993d00'];

export default function ConversionFunnelPanel({ teamLeadId, dateFrom, dateTo }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/leads${buildLeadsQuery({ teamLeadId, dateFrom, dateTo })}`).then(setLeads).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [teamLeadId, dateFrom, dateTo]);

  if (loading) return <div className="p-6 min-h-[200px] rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-slate-600 dark:text-white/80 flex items-center justify-center shadow-card dark:shadow-card-dark">Loading…</div>;
  if (error) return <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-primary-500 shadow-card dark:shadow-card-dark" role="alert">{error}</div>;

  const byStatus = leads.reduce((acc, l) => {
    const s = l.status || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const total = leads.length;
  const rows = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  const chartData = rows.map(([status, count]) => ({ name: status.length > 8 ? status.slice(0, 8) + '…' : status, fullName: status, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));

  return (
    <div className="space-y-4">
      {chartData.length > 0 && (
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4 shadow-card dark:shadow-card-dark">
          <h3 className="text-slate-900 dark:text-primary-500 font-semibold mb-3">Conversion funnel — Total: {total}</h3>
          <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 32)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis type="number" tick={{ fill: '#fff', fontSize: 11 }} stroke="#666" />
              <YAxis type="category" dataKey="name" width={72} tick={{ fill: '#fff', fontSize: 10 }} stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #FF7A00', borderRadius: 8 }} formatter={(v, name, props) => [v + ' (' + (props.payload?.pct ?? 0) + '%)', 'Count']} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface overflow-hidden shadow-card dark:shadow-card-dark">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-200 dark:bg-dark-border text-slate-800 dark:text-white">
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Count</th>
              <th className="px-4 py-2 font-medium text-right">%</th>
            </tr>
          </thead>
          <tbody className="text-slate-800 dark:text-white">
            {rows.map(([status, count]) => (
              <tr key={status} className="border-t border-slate-200 dark:border-dark-border">
                <td className="px-4 py-2">{status}</td>
                <td className="px-4 py-2 text-right">{count}</td>
                <td className="px-4 py-2 text-right">{total > 0 ? Math.round((count / total) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
