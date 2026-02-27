/**
 * Calendar / trend: leads created per day in the selected date range. Shows ratio and trend.
 */
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api';
import { buildLeadsQuery } from './analyticsQuery';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LIGHT_CHART = { gridStroke: '#94a3b8', axisStroke: '#64748b', tickFill: '#1e293b' };
const DARK_CHART = { gridStroke: '#2A2A2A', axisStroke: '#666', tickFill: '#fff' };

export default function LeadsOverTimePanel({ teamLeadId, dateFrom, dateTo }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chart = isDark ? DARK_CHART : LIGHT_CHART;
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api(`/leads${buildLeadsQuery({ teamLeadId, dateFrom, dateTo })}`)
      .then(setLeads)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [teamLeadId, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-surface rounded-xl border-2 border-slate-200 dark:border-dark-border text-slate-600 dark:text-white text-center min-h-[200px] flex items-center justify-center shadow-card dark:shadow-card-dark">
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

  const byDay = {};
  leads.forEach((l) => {
    const d = l.created_at ? l.created_at.slice(0, 10) : null;
    if (d) {
      byDay[d] = (byDay[d] || 0) + 1;
    }
  });
  const sortedDays = Object.keys(byDay).sort();
  const chartData = sortedDays.map((d) => ({ date: d, leads: byDay[d], label: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) }));
  const total = leads.length;
  const avgPerDay = chartData.length ? (total / chartData.length).toFixed(1) : 0;
  const maxInDay = chartData.length ? Math.max(...chartData.map((x) => x.leads)) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-primary-500 text-black p-4 shadow-card dark:shadow-card-dark">
          <p className="text-xs font-medium opacity-90">Total in range</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-dark-border text-slate-900 dark:text-white p-4 shadow-card dark:shadow-card-dark">
          <p className="text-xs font-medium text-primary-500">Avg per day</p>
          <p className="text-2xl font-bold">{avgPerDay}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-dark-border text-slate-900 dark:text-white p-4 shadow-card dark:shadow-card-dark">
          <p className="text-xs font-medium text-slate-600 dark:text-white/70">Peak day</p>
          <p className="text-2xl font-bold">{maxInDay}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-dark-border text-slate-900 dark:text-white p-4 shadow-card dark:shadow-card-dark">
          <p className="text-xs font-medium text-slate-600 dark:text-white/70">Days with data</p>
          <p className="text-2xl font-bold">{chartData.length}</p>
        </div>
      </div>
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4 shadow-card dark:shadow-card-dark">
        <h3 className="text-slate-900 dark:text-primary-500 font-semibold mb-3">Leads created over time</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF7A00" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FF7A00" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.gridStroke} />
              <XAxis dataKey="label" tick={{ fill: chart.tickFill, fontSize: 10 }} stroke={chart.axisStroke} />
              <YAxis tick={{ fill: chart.tickFill, fontSize: 11 }} stroke={chart.axisStroke} />
              <Tooltip
                contentStyle={{ backgroundColor: isDark ? '#1A1A1A' : '#fff', border: '1px solid #FF7A00', borderRadius: 8, color: isDark ? '#fff' : '#1e293b' }}
                labelFormatter={(_, payload) => payload[0]?.payload?.date}
                formatter={(value) => [value, 'Leads']}
              />
              <Area type="monotone" dataKey="leads" stroke="#FF7A00" strokeWidth={3} fill="url(#leadGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 dark:text-white/70 text-center py-8">No leads in this date range. Select a range or clear dates for all time.</p>
        )}
      </div>
    </div>
  );
}
