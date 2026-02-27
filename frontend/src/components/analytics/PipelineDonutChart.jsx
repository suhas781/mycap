import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#FF7A00', '#ff9a33', '#ffb366', '#2A2A2A', '#404040', '#666'];

export default function PipelineDonutChart({ data, height = 280 }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const legendColor = isDark ? '#fff' : '#1e293b';
  const tooltipBg = isDark ? '#1A1A1A' : '#fff';
  const tooltipText = isDark ? '#fff' : '#1e293b';
  const chartData = data.map(([name, count]) => ({ name, value: count }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke={isDark ? '#0E0E0E' : '#e2e8f0'} strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: tooltipBg, border: '1px solid #FF7A00', borderRadius: 8, color: tooltipText }}
          formatter={(value, name) => [value, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span style={{ color: legendColor }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
