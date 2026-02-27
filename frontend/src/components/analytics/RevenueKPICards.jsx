/**
 * Revenue analytics KPI cards: Total Revenue, Total Units, Avg Revenue/Unit, Total Due. Orange + Black theme.
 */
export default function RevenueKPICards({ data }) {
  const totalRevenue = data?.total_revenue ?? 0;
  const totalUnits = data?.total_units ?? 0;
  const avgPerUnit = data?.avg_revenue_per_unit ?? 0;
  const totalDue = data?.total_due ?? 0;

  const formatMoney = (n) => (typeof n === 'number' ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0');

  const cards = [
    { label: 'Total Revenue', value: formatMoney(totalRevenue), sub: 'Sum of amount paid' },
    { label: 'Total Units Sold', value: String(totalUnits), sub: 'Converted leads' },
    { label: 'Avg Revenue per Unit', value: formatMoney(avgPerUnit), sub: 'Revenue ÷ units' },
    { label: 'Total Due Amount', value: formatMoney(totalDue), sub: 'Outstanding' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border-2 border-[#FF7A00]/30 bg-[#0E0E0E] p-5 shadow-lg"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">{card.label}</p>
          <p className="text-2xl font-bold text-white">{card.value}</p>
          <p className="text-xs text-white/40 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
