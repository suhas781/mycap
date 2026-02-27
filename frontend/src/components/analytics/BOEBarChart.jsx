import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#FF7A00', '#ff9a33', '#ffb366', '#ffcc99', '#e66d00'];
const LIGHT = { grid: '#94a3b8', axis: '#64748b', tick: '#1e293b', tooltipBg: '#fff', tooltipText: '#1e293b' };
const DARK = { grid: '#2A2A2A', axis: '#666', tick: '#fff', tooltipBg: '#1A1A1A', tooltipText: '#fff' };

export default function BOEBarChart({ data, height = 280 }) {
  const { theme } = useTheme();
  const c = theme === 'dark' ? DARK : LIGHT;
  const chartData = data.map(([name, count]) => ({ name: name.length > 10 ? name.slice(0, 10) + '…' : name, fullName: name, count }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis type="number" tick={{ fill: c.tick, fontSize: 11 }} stroke={c.axis} />
        <YAxis type="category" dataKey="name" width={80} tick={{ fill: c.tick, fontSize: 11 }} stroke={c.axis} />
        <Tooltip
          contentStyle={{ backgroundColor: c.tooltipBg, border: '1px solid #FF7A00', borderRadius: 8, color: c.tooltipText }}
          formatter={(value) => [value, 'Leads']}
          labelFormatter={(_, payload) => payload[0]?.payload?.fullName}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
