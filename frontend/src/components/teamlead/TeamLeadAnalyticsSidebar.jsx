/**
 * Team Lead Analytics: DNR breakdown sidebar (same categories as BOE). Counts from GET /leads.
 * NEW, OLD, DNR1-4, CALLBACK, FOLLOW-UP DUE, CONVERTED, TERMINATED. Orange/black theme.
 */
const DNR_STATUSES = ['DNR1', 'DNR2', 'DNR3', 'DNR4'];

function getCategoryCounts(leads) {
  const now = new Date();
  return {
    new: leads.filter((l) => l.status === 'NEW').length,
    old: leads.filter(
      (l) =>
        l.status !== 'NEW' &&
        !DNR_STATUSES.includes(l.status) &&
        l.status !== 'Call Back' &&
        l.status !== 'Cut Call' &&
        l.status !== 'Converted' &&
        l.status !== 'Not Interested' &&
        l.status !== 'Denied'
    ).length,
    dnr1: leads.filter((l) => l.status === 'DNR1').length,
    dnr2: leads.filter((l) => l.status === 'DNR2').length,
    dnr3: leads.filter((l) => l.status === 'DNR3').length,
    dnr4: leads.filter((l) => l.status === 'DNR4').length,
    callback: leads.filter((l) => l.status === 'Call Back').length,
    followUpDue: leads.filter((l) => l.next_followup_at && new Date(l.next_followup_at) <= now).length,
    converted: leads.filter((l) => l.status === 'Converted').length,
    terminated: leads.filter((l) => l.status === 'Not Interested' || l.status === 'Denied').length,
  };
}

export default function TeamLeadAnalyticsSidebar({ leads }) {
  const counts = getCategoryCounts(leads || []);
  const itemClass = 'w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between text-slate-600 dark:text-white/80';

  return (
    <aside className="w-52 shrink-0 bg-white dark:bg-[#1A1A1A] border-r border-slate-200 dark:border-[#2A2A2A] flex flex-col">
      <div className="p-3 border-b border-slate-200 dark:border-[#2A2A2A]">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Lead breakdown</h2>
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        <ul className="space-y-0.5">
          <li><div className={itemClass}><span>NEW</span><span className="tabular-nums">{counts.new}</span></div></li>
          <li><div className={itemClass}><span>OLD</span><span className="tabular-nums">{counts.old}</span></div></li>
          <li className="pt-2">
            <div className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">DNR</div>
            <ul className="mt-1 space-y-0.5">
              {['dnr1', 'dnr2', 'dnr3', 'dnr4'].map((key) => (
                <li key={key}><div className={itemClass}><span>{key.toUpperCase()}</span><span className="tabular-nums">{counts[key]}</span></div></li>
              ))}
            </ul>
          </li>
          <li><div className={itemClass}><span>CALLBACK</span><span className="tabular-nums">{counts.callback}</span></div></li>
          <li><div className={itemClass}><span>FOLLOW-UP DUE</span><span className="tabular-nums">{counts.followUpDue}</span></div></li>
          <li><div className={itemClass}><span>CONVERTED</span><span className="tabular-nums">{counts.converted}</span></div></li>
          <li><div className={itemClass}><span>TERMINATED</span><span className="tabular-nums">{counts.terminated}</span></div></li>
        </ul>
      </nav>
    </aside>
  );
}
