/**
 * TeamWiseCampaignSummary — Campaigns by Team Lead (created_by). Bar chart.
 * Orange/black theme. Data from GET /campaigns.
 */
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#FF7A00', '#ff9a33', '#ffb366', '#ffcc99', '#e66d00'];
const LIGHT = { grid: '#94a3b8', axis: '#64748b', tick: '#1e293b', tooltipBg: '#fff', tooltipText: '#1e293b' };
const DARK = { grid: '#2A2A2A', axis: '#666', tick: '#fff', tooltipBg: '#1A1A1A', tooltipText: '#fff' };

export default function TeamWiseCampaignSummary({ campaigns = [] }) {
  const c = typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? DARK : LIGHT;

  const teamRows = useMemo(() => {
    const byLead = {};
    campaigns.forEach((camp) => {
      const name = camp.created_by_name || `User #${camp.created_by}` || 'Unknown';
      byLead[name] = (byLead[name] || 0) + 1;
    });
    return Object.entries(byLead).map(([name, count]) => ({ name, count }));
  }, [campaigns]);

  if (teamRows.length === 0) {
    return (
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Campaigns by Team Lead</h4>
        <p className="text-sm text-slate-500 dark:text-white/50">No data</p>
      </div>
    );
  }

  const chartData = teamRows.map((r) => ({
    ...r,
    shortName: r.name.length > 12 ? r.name.slice(0, 12) + '…' : r.name,
  }));

  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-surface p-4">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Campaigns by Team Lead</h4>
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis type="number" tick={{ fill: c.tick, fontSize: 11 }} stroke={c.axis} />
          <YAxis type="category" dataKey="shortName" width={100} tick={{ fill: c.tick, fontSize: 11 }} stroke={c.axis} />
          <Tooltip
            contentStyle={{ backgroundColor: c.tooltipBg, border: '1px solid #FF7A00', borderRadius: 8, color: c.tooltipText }}
            labelFormatter={(_, payload) => payload[0]?.payload?.name}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
