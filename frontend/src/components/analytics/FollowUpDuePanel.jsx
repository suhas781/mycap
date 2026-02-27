/**
 * FollowUpDuePanel — Follow-up due vs upcoming with bar chart + cards.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api';
import { buildLeadsQuery } from './analyticsQuery';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FollowUpDuePanel({ teamLeadId, dateFrom, dateTo }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/leads${buildLeadsQuery({ teamLeadId, dateFrom, dateTo })}`).then(setLeads).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [teamLeadId, dateFrom, dateTo]);

  if (loading) return <div className="p-6 min-h-[200px] rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-slate-600 dark:text-white/80 flex items-center justify-center shadow-card dark:shadow-card-dark">Loading…</div>;
  if (error) return <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-primary-500 shadow-card dark:shadow-card-dark" role="alert">{error}</div>;

  const now = new Date().toISOString();
  const due = leads.filter((l) => l.next_followup_at && l.next_followup_at <= now);
  const upcoming = leads.filter((l) => l.next_followup_at && l.next_followup_at > now);
  const chartData = [
    { name: 'Overdue', count: due.length, fill: '#FF7A00' },
    { name: 'Upcoming', count: upcoming.length, fill: '#ff9a33' },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4 shadow-card dark:shadow-card-dark">
        <h3 className="text-slate-900 dark:text-primary-500 font-semibold mb-3">Follow-up overview</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 11 }} stroke="#666" />
            <YAxis tick={{ fill: '#fff', fontSize: 11 }} stroke="#666" />
            <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #FF7A00', borderRadius: 8 }} formatter={(v) => [v, 'Leads']} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-primary-500 text-black p-4 shadow-card dark:shadow-card-dark">
          <h3 className="font-semibold text-sm">Due / Overdue</h3>
          <p className="text-2xl font-bold mt-1">{due.length}</p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-slate-900 dark:text-white p-4 shadow-card dark:shadow-card-dark">
          <h3 className="font-semibold text-primary-500 text-sm">Upcoming</h3>
          <p className="text-2xl font-bold mt-1">{upcoming.length}</p>
        </div>
      </div>
    </div>
  );
}
