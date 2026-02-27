/**
 * Revenue charts: Bar (revenue per course), Line (revenue over time), Pie (units by course). Client-side Recharts, orange/black theme.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

const ORANGE = '#FF7A00';
const ORANGE_SHADES = ['#FF7A00', '#ff9a33', '#ffb366', '#ffcc99', '#2A2A2A', '#404040'];
const GRID_STROKE = '#2A2A2A';
const AXIS_STROKE = '#666';
const TICK_FILL = '#fff';

function formatMoney(n) {
  return typeof n === 'number' ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '';
}

export default function RevenueCharts({ revenueByCourse = [], revenueOverTime = [] }) {
  const barData = revenueByCourse.map((r) => ({
    name: (r.course_name || '(Unnamed)').slice(0, 16) + ((r.course_name || '').length > 16 ? '…' : ''),
    fullName: r.course_name || '(Unnamed)',
    revenue: Number(r.total_revenue) || 0,
    units: Number(r.units) || 0,
  }));

  const lineData = revenueOverTime.map((r) => ({
    date: r.date,
    revenue: Number(r.revenue) || 0,
    label: r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : r.date,
  }));

  const pieData = revenueByCourse.map((r) => ({
    name: (r.course_name || '(Unnamed)').slice(0, 12) + ((r.course_name || '').length > 12 ? '…' : ''),
    value: Number(r.units) || 0,
  })).filter((d) => d.value > 0);

  const tooltipStyle = { backgroundColor: '#0E0E0E', border: '1px solid #FF7A00', borderRadius: 8, color: '#fff' };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Revenue per Course</h3>
        {barData.length > 0 ? (
          <div className="h-[280px] rounded-xl border border-white/10 bg-[#0E0E0E] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="name" tick={{ fill: TICK_FILL, fontSize: 10 }} stroke={AXIS_STROKE} />
                <YAxis tick={{ fill: TICK_FILL, fontSize: 11 }} stroke={AXIS_STROKE} tickFormatter={(v) => (v >= 1e5 ? `${v / 1e5}L` : String(v))} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatMoney(value), 'Revenue']} labelFormatter={(label) => barData.find((d) => d.name === label)?.fullName ?? label} />
                <Bar dataKey="revenue" fill={ORANGE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-white/50 text-sm py-4">No course data</p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Revenue Over Time</h3>
        {lineData.length > 0 ? (
          <div className="h-[260px] rounded-xl border border-white/10 bg-[#0E0E0E] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis dataKey="label" tick={{ fill: TICK_FILL, fontSize: 10 }} stroke={AXIS_STROKE} />
                <YAxis tick={{ fill: TICK_FILL, fontSize: 11 }} stroke={AXIS_STROKE} tickFormatter={(v) => (v >= 1e5 ? `${v / 1e5}L` : String(v))} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatMoney(value), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke={ORANGE} strokeWidth={2} dot={{ fill: ORANGE }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-white/50 text-sm py-4">No time-series data</p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Units Sold by Course</h3>
        {pieData.length > 0 ? (
          <div className="h-[280px] rounded-xl border border-white/10 bg-[#0E0E0E] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={ORANGE_SHADES[i % ORANGE_SHADES.length]} stroke="#0E0E0E" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, 'Units']} />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span className="text-white">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-white/50 text-sm py-4">No units data</p>
        )}
      </div>
    </div>
  );
}
