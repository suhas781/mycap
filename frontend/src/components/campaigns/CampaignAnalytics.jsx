/**
 * CampaignAnalytics — Campaign completion rate, pipeline-style, bar + pie (FE only).
 * Orange/black theme. Data from GET /campaigns.
 */
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const COLORS = ['#FF7A00', '#ff9a33', '#ffb366', '#2A2A2A', '#404040'];
const LIGHT = { grid: '#94a3b8', axis: '#64748b', tick: '#1e293b', tooltipBg: '#fff', tooltipText: '#1e293b' };
const DARK = { grid: '#2A2A2A', axis: '#666', tick: '#fff', tooltipBg: '#1A1A1A', tooltipText: '#fff' };

function useChartTheme() {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return isDark ? DARK : LIGHT;
}

export default function CampaignAnalytics({ campaigns = [] }) {
  const c = useChartTheme();

  const { statusData, completionRate, pipelineRows } = useMemo(() => {
    const total = campaigns.length;
    const byStatus = {};
    campaigns.forEach((camp) => {
      const s = camp.status || 'ACTIVE';
      byStatus[s] = (byStatus[s] || 0) + 1;
    });
    const completed = byStatus.COMPLETED || 0;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const statusData = [
      ['Active', byStatus.ACTIVE || 0],
      ['Completed', byStatus.COMPLETED || 0],
      ['Closed', byStatus.CLOSED || 0],
    ].filter(([, n]) => n > 0);
    const pipelineRows = [
      { stage: 'Active', count: byStatus.ACTIVE || 0 },
      { stage: 'Completed', count: byStatus.COMPLETED || 0 },
      { stage: 'Closed', count: byStatus.CLOSED || 0 },
    ];
    return { statusData, completionRate, pipelineRows };
  }, [campaigns]);

  const barData = useMemo(() => statusData.map(([name, value]) => ({ name, count: value })), [statusData]);
  const pieData = useMemo(() => statusData.map(([name, value]) => ({ name, value })), [statusData]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Completion rate</h4>
        <p className="text-3xl font-bold text-primary-500">{completionRate}%</p>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Completed campaigns / total</p>
      </div>
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Campaigns by status (Bar)</h4>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="name" tick={{ fill: c.tick, fontSize: 11 }} stroke={c.axis} />
              <YAxis tick={{ fill: c.tick, fontSize: 11 }} stroke={c.axis} />
              <Tooltip
                contentStyle={{ backgroundColor: c.tooltipBg, border: '1px solid #FF7A00', borderRadius: 8, color: c.tooltipText }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500 dark:text-white/50">No campaign data</p>
        )}
      </div>
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Campaigns by status (Pie)</h4>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke={c.grid} strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: c.tooltipBg, border: '1px solid #FF7A00', borderRadius: 8, color: c.tooltipText }}
              />
              <Legend formatter={(value) => <span style={{ color: c.tick }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500 dark:text-white/50">No campaign data</p>
        )}
      </div>
    </div>
  );
}
