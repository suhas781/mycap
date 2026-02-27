/**
 * Revenue by course table: Course Name, Units Sold, Total Revenue, Average Fee, Total Due. Orange + Black theme.
 */
export default function RevenueTable({ revenueByCourse }) {
  const rows = revenueByCourse ?? [];
  const formatMoney = (n) => (typeof n === 'number' ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—');

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0E0E0E] p-6 text-center text-white/60">
        No conversion data to show.
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-white/10 bg-[#0E0E0E] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 font-semibold text-white/90">Course Name</th>
              <th className="px-4 py-3 font-semibold text-white/90 text-right">Units Sold</th>
              <th className="px-4 py-3 font-semibold text-white/90 text-right">Total Revenue</th>
              <th className="px-4 py-3 font-semibold text-white/90 text-right">Average Fee</th>
              <th className="px-4 py-3 font-semibold text-white/90 text-right">Total Due</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-white">{r.course_name ?? '—'}</td>
                <td className="px-4 py-3 text-white text-right tabular-nums">{r.units ?? 0}</td>
                <td className="px-4 py-3 text-[#FF7A00] text-right tabular-nums font-medium">{formatMoney(r.total_revenue)}</td>
                <td className="px-4 py-3 text-white/80 text-right tabular-nums">{formatMoney(r.avg_fee)}</td>
                <td className="px-4 py-3 text-white/80 text-right tabular-nums">{formatMoney(r.total_due)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
