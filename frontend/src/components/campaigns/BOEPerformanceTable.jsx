/**
 * Team Lead: BOE performance table (campaigns completed, leads added, avg quality, DNR/Callback/Follow-up).
 * Orange/black theme.
 */
export default function BOEPerformanceTable({ boes = [], leadStatusByBoe = [] }) {
  const statusByBoeId = {};
  leadStatusByBoe.forEach((s) => { statusByBoeId[s.boe_id] = s; });

  const rows = boes.map((b) => ({
    ...b,
    NEW: statusByBoeId[b.boe_id]?.NEW ?? 0,
    DNR1: statusByBoeId[b.boe_id]?.DNR1 ?? 0,
    DNR2: statusByBoeId[b.boe_id]?.DNR2 ?? 0,
    DNR3: statusByBoeId[b.boe_id]?.DNR3 ?? 0,
    DNR4: statusByBoeId[b.boe_id]?.DNR4 ?? 0,
    callback: statusByBoeId[b.boe_id]?.['Call Back'] ?? 0,
    followUpDue: statusByBoeId[b.boe_id]?.follow_up_due ?? 0,
    converted: statusByBoeId[b.boe_id]?.Converted ?? 0,
    terminated: statusByBoeId[b.boe_id]?.Terminated ?? 0,
  }));

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E] p-6 text-center text-white/60">
        No BOE data
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border-2 border-slate-200 dark:border-dark-border bg-white dark:bg-[#0E0E0E]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-[#FF7A00] text-black">
            <th className="px-3 py-2 font-semibold">BOE</th>
            <th className="px-3 py-2 font-semibold">Campaigns</th>
            <th className="px-3 py-2 font-semibold">Leads added</th>
            <th className="px-3 py-2 font-semibold">NEW</th>
            <th className="px-3 py-2 font-semibold">DNR1-4</th>
            <th className="px-3 py-2 font-semibold">Callback</th>
            <th className="px-3 py-2 font-semibold">Follow-up due</th>
            <th className="px-3 py-2 font-semibold">Converted</th>
            <th className="px-3 py-2 font-semibold">Terminated</th>
          </tr>
        </thead>
        <tbody className="text-white">
          {rows.map((r) => (
            <tr key={r.boe_id} className="border-t border-slate-200 dark:border-dark-border">
              <td className="px-3 py-2 font-medium">{r.boe_name}</td>
              <td className="px-3 py-2">{r.campaign_count}</td>
              <td className="px-3 py-2">{r.lead_count}</td>
              <td className="px-3 py-2">{r.NEW}</td>
              <td className="px-3 py-2">{(r.DNR1 || 0) + (r.DNR2 || 0) + (r.DNR3 || 0) + (r.DNR4 || 0)}</td>
              <td className="px-3 py-2">{r.callback}</td>
              <td className="px-3 py-2">{r.followUpDue}</td>
              <td className="px-3 py-2">{r.converted}</td>
              <td className="px-3 py-2">{r.terminated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
