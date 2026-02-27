/**
 * OverviewDashboardPanel — Single fetch, grid of all key charts so the page is filled.
 */
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api';
import { buildLeadsQuery } from './analyticsQuery';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import PipelineDonutChart from './PipelineDonutChart';
import StatusBarChart from './StatusBarChart';
import BOEBarChart from './BOEBarChart';

const BAR_COLORS = ['#FF7A00', '#ff9a33', '#ffb366', '#ffcc99', '#e66d00', '#cc5c00', '#b34d00', '#993d00'];

const LIGHT_CHART = { gridStroke: '#94a3b8', axisStroke: '#64748b', tickFill: '#1e293b' };
const DARK_CHART = { gridStroke: '#2A2A2A', axisStroke: '#666', tickFill: '#fff' };

export default function OverviewDashboardPanel({ teamLeadId, dateFrom, dateTo }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chart = isDark ? DARK_CHART : LIGHT_CHART;
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/leads${buildLeadsQuery({ teamLeadId, dateFrom, dateTo })}`)
      .then(setLeads)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [teamLeadId, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="p-8 min-h-[400px] rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-slate-600 dark:text-white/80 flex items-center justify-center shadow-card dark:shadow-card-dark">
        <span className="inline-block w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" aria-hidden />
        <span className="ml-3">Loading overview…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface text-primary-500 shadow-card dark:shadow-card-dark" role="alert">
        {error}
      </div>
    );
  }

  const total = leads.length;
  const byDay = {};
  leads.forEach((l) => {
    const d = l.created_at ? l.created_at.slice(0, 10) : null;
    if (d) byDay[d] = (byDay[d] || 0) + 1;
  });
  const leadsOverTimeData = Object.entries(byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, leads: count, label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }));

  const byPipeline = leads.reduce((acc, l) => {
    const p = l.pipeline || 'Unknown';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const pipelineData = Object.entries(byPipeline);

  const byStatus = leads.reduce((acc, l) => {
    const s = l.status || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statusRows = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);

  const assigned = leads.filter((l) => l.assigned_boe_id != null);
  const byBoe = assigned.reduce((acc, l) => {
    const name = l.assigned_boe_name || `BOE #${l.assigned_boe_id}`;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const boeRows = Object.entries(byBoe).sort((a, b) => b[1] - a[1]);

  const byRetry = leads.reduce((acc, l) => {
    const r = l.retry_count ?? 0;
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});
  const retryRows = Object.entries(byRetry).sort((a, b) => Number(a[0]) - Number(b[0]));
  const retryChartData = retryRows.map(([retry, count]) => ({ name: `R${retry}`, fullName: `Retry ${retry}`, count }));

  const now = new Date().toISOString();
  const dueCount = leads.filter((l) => l.next_followup_at && l.next_followup_at <= now).length;
  const upcomingCount = leads.filter((l) => l.next_followup_at && l.next_followup_at > now).length;
  const followUpData = [
    { name: 'Overdue', count: dueCount, fill: '#FF7A00' },
    { name: 'Upcoming', count: upcomingCount, fill: '#ff9a33' },
  ];

  const inactive = leads.filter((l) => !l.is_active);
  const byInactiveStatus = inactive.reduce((acc, l) => {
    const s = l.status || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const termRows = Object.entries(byInactiveStatus).sort((a, b) => b[1] - a[1]);
  const termChartData = termRows.map(([status, count]) => ({ name: status.length > 8 ? status.slice(0, 8) + '…' : status, fullName: status, count }));

  const funnelData = statusRows.map(([status, count]) => ({
    name: status.length > 8 ? status.slice(0, 8) + '…' : status,
    fullName: status,
    count,
    pct: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  const card = 'rounded-xl border-2 border-slate-200 dark:border-dark-border dark:border-white/10 bg-white dark:bg-surface-elevated p-4 min-h-[180px] shadow-card dark:shadow-card-dark';
  const chartTitle = 'text-slate-900 dark:text-primary-500 font-semibold mb-3 text-sm';

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-white/60">
        Key metrics and charts at a glance. Switch views above to focus on one metric.
      </p>
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-slate-200 dark:border-primary-500/40 bg-primary-500 text-black p-4 min-h-[100px] shadow-card dark:shadow-card-dark">
          <p className="text-xs font-medium opacity-90">Total leads</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-surface-elevated text-slate-900 dark:text-white p-4 min-h-[100px] shadow-card dark:shadow-card-dark">
          <p className="text-xs font-medium text-primary-500">Pipelines</p>
          <p className="text-2xl font-bold">{pipelineData.length}</p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-surface-elevated text-slate-900 dark:text-white p-4 min-h-[100px] shadow-card dark:shadow-card-dark">
          <p className="text-xs font-medium text-slate-600 dark:text-white/70">Overdue follow-ups</p>
          <p className="text-2xl font-bold">{dueCount}</p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-surface-elevated text-slate-900 dark:text-white p-4 min-h-[100px] shadow-card dark:shadow-card-dark">
          <p className="text-xs font-medium text-slate-600 dark:text-white/70">Inactive / terminated</p>
          <p className="text-2xl font-bold">{inactive.length}</p>
        </div>
      </div>

      {/* Leads over time */}
      <div className={`${card} min-h-[240px]`}>
        <h3 className={chartTitle}>Leads over time</h3>
        {leadsOverTimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={leadsOverTimeData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="overviewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF7A00" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FF7A00" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.gridStroke} />
              <XAxis dataKey="label" tick={{ fill: chart.tickFill, fontSize: 10 }} stroke={chart.axisStroke} />
              <YAxis tick={{ fill: chart.tickFill, fontSize: 11 }} stroke={chart.axisStroke} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1A1A1A' : '#fff', border: '1px solid #FF7A00', borderRadius: 8, color: isDark ? '#fff' : '#1e293b' }} />
              <Area type="monotone" dataKey="leads" stroke="#FF7A00" fill="url(#overviewGrad)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 dark:text-white/60 text-sm">No date data</p>
        )}
      </div>

      {/* Pipeline + Status + BOE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={card}>
          <h3 className={chartTitle}>Pipeline mix</h3>
          {pipelineData.length > 0 ? <PipelineDonutChart data={pipelineData} height={200} /> : <p className="text-slate-500 dark:text-white/60 text-sm">No pipeline data</p>}
        </div>
        <div className={card}>
          <h3 className={chartTitle}>Status distribution</h3>
          {statusRows.length > 0 ? <StatusBarChart data={statusRows} height={200} /> : <p className="text-slate-500 dark:text-white/60 text-sm">No status data</p>}
        </div>
        <div className={card}>
          <h3 className={chartTitle}>BOE performance</h3>
          {boeRows.length > 0 ? <BOEBarChart data={boeRows} height={Math.max(200, boeRows.length * 32)} /> : <p className="text-slate-500 dark:text-white/60 text-sm">No BOE data</p>}
        </div>
      </div>

      {/* Retry + Follow-up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={card}>
          <h3 className={chartTitle}>Retry distribution</h3>
          {retryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={retryChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.gridStroke} />
                <XAxis dataKey="name" tick={{ fill: chart.tickFill, fontSize: 11 }} stroke={chart.axisStroke} />
                <YAxis tick={{ fill: chart.tickFill, fontSize: 11 }} stroke={chart.axisStroke} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1A1A1A' : '#fff', border: '1px solid #FF7A00', borderRadius: 8, color: isDark ? '#fff' : '#1e293b' }} formatter={(v) => [v, 'Leads']} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {retryChartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 dark:text-white/60 text-sm">No retry data</p>
          )}
        </div>
        <div className={card}>
          <h3 className={chartTitle}>Follow-up overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={followUpData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.gridStroke} />
              <XAxis dataKey="name" tick={{ fill: chart.tickFill, fontSize: 11 }} stroke={chart.axisStroke} />
              <YAxis tick={{ fill: chart.tickFill, fontSize: 11 }} stroke={chart.axisStroke} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1A1A1A' : '#fff', border: '1px solid #FF7A00', borderRadius: 8, color: isDark ? '#fff' : '#1e293b' }} formatter={(v) => [v, 'Leads']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {followUpData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Termination + Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={card}>
          <h3 className={chartTitle}>Terminated by status</h3>
          <ResponsiveContainer width="100%" height={Math.max(180, (termChartData.length || 1) * 28)}>
            <BarChart
              data={termChartData.length > 0 ? termChartData : [{ name: 'None', fullName: 'No inactive leads', count: 0 }]}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chart.gridStroke} />
              <XAxis dataKey="name" tick={{ fill: chart.tickFill, fontSize: 10 }} stroke={chart.axisStroke} />
              <YAxis tick={{ fill: chart.tickFill, fontSize: 11 }} stroke={chart.axisStroke} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1A1A1A' : '#fff', border: '1px solid #FF7A00', borderRadius: 8, color: isDark ? '#fff' : '#1e293b' }} formatter={(v) => [v, 'Count']} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(termChartData.length > 0 ? termChartData : [{ name: 'None', count: 0 }]).map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={card}>
          <h3 className={chartTitle}>Conversion funnel</h3>
          {funnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(180, funnelData.length * 28)}>
              <BarChart data={funnelData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.gridStroke} />
                <XAxis type="number" tick={{ fill: chart.tickFill, fontSize: 11 }} stroke={chart.axisStroke} />
                <YAxis type="category" dataKey="name" width={72} tick={{ fill: chart.tickFill, fontSize: 10 }} stroke={chart.axisStroke} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1A1A1A' : '#fff', border: '1px solid #FF7A00', borderRadius: 8, color: isDark ? '#fff' : '#1e293b' }} formatter={(v, _n, props) => [v + ' (' + (props.payload?.pct ?? 0) + '%)', 'Count']} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {funnelData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 dark:text-white/60 text-sm">No funnel data</p>
          )}
        </div>
      </div>
    </div>
  );
}
