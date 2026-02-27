/**
 * BOE sidebar: categories (New, Old, DNR, Cut Call, Call Back, Follow-Up Due, Converted).
 */
const DNR_STATUSES = ['DNR1', 'DNR2', 'DNR3', 'DNR4'];
const CUT_CALL_OR_CALL_BACK = ['Cut Call', 'Call Back'];
const TERMINATED_OR_CONVERTED = ['Converted', 'Not Interested', 'Denied'];

export function getCategoryCounts(leads) {
  const now = new Date();
  return {
    new: leads.filter((l) => l.status === 'NEW').length,
    old: leads.filter(
      (l) =>
        l.status !== 'NEW' &&
        !DNR_STATUSES.includes(l.status) &&
        !CUT_CALL_OR_CALL_BACK.includes(l.status) &&
        !TERMINATED_OR_CONVERTED.includes(l.status)
    ).length,
    dnr1: leads.filter((l) => l.status === 'DNR1').length,
    dnr2: leads.filter((l) => l.status === 'DNR2').length,
    dnr3: leads.filter((l) => l.status === 'DNR3').length,
    dnr4: leads.filter((l) => l.status === 'DNR4').length,
    cutCall: leads.filter((l) => l.status === 'Cut Call').length,
    callBack: leads.filter((l) => l.status === 'Call Back').length,
    followUpDue: leads.filter(
      (l) => l.next_followup_at && new Date(l.next_followup_at) <= now
    ).length,
    converted: leads.filter((l) => l.status === 'Converted').length,
  };
}

export function getFilteredLeads(leads, activeCategory) {
  if (!activeCategory) return leads;
  const now = new Date();
  switch (activeCategory) {
    case 'new':
      return leads.filter((l) => l.status === 'NEW');
    case 'old':
      return leads.filter(
        (l) =>
          l.status !== 'NEW' &&
          !DNR_STATUSES.includes(l.status) &&
          !CUT_CALL_OR_CALL_BACK.includes(l.status) &&
          !TERMINATED_OR_CONVERTED.includes(l.status)
      );
    case 'dnr1':
    case 'dnr2':
    case 'dnr3':
    case 'dnr4':
      return leads.filter((l) => l.status === activeCategory.toUpperCase());
    case 'cutcall':
      return leads.filter((l) => l.status === 'Cut Call');
    case 'callback':
      return leads.filter((l) => l.status === 'Call Back');
    case 'followup':
      return leads.filter(
        (l) => l.next_followup_at && new Date(l.next_followup_at) <= now
      );
    case 'converted':
      return leads.filter((l) => l.status === 'Converted');
    default:
      return leads;
  }
}

export default function BOESidebar({ leads, activeCategory, onSelectCategory }) {
  const counts = getCategoryCounts(leads);
  const isActive = (key) => activeCategory === key;

  const btnBase = 'w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between';
  const btnActive = 'bg-slate-100 dark:bg-[#2A2A2A] text-slate-900 dark:text-white font-medium';
  const btnInactive = 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5';

  return (
    <aside className="w-56 shrink-0 bg-white dark:bg-[#1A1A1A] border-r border-slate-200 dark:border-[#2A2A2A] flex flex-col">
      <div className="p-3 border-b border-slate-200 dark:border-[#2A2A2A]">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Categories</h2>
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        <ul className="space-y-0.5">
          <li>
            <button type="button" onClick={() => onSelectCategory('new')} className={`${btnBase} ${isActive('new') ? btnActive : btnInactive}`}>
              <span>New</span><span className="tabular-nums">{counts.new}</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => onSelectCategory('old')} className={`${btnBase} ${isActive('old') ? btnActive : btnInactive}`}>
              <span>Old</span><span className="tabular-nums">{counts.old}</span>
            </button>
          </li>
          <li className="pt-2">
            <div className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">DNR</div>
            <ul className="mt-1 space-y-0.5">
              {['dnr1', 'dnr2', 'dnr3', 'dnr4'].map((key) => (
                <li key={key}>
                  <button type="button" onClick={() => onSelectCategory(key)} className={`${btnBase} py-1.5 ${isActive(key) ? btnActive : btnInactive}`}>
                    <span>{key.toUpperCase()}</span><span className="tabular-nums">{counts[key]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <button type="button" onClick={() => onSelectCategory('cutcall')} className={`${btnBase} ${isActive('cutcall') ? btnActive : btnInactive}`}>
              <span>Cut Call</span><span className="tabular-nums">{counts.cutCall}</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => onSelectCategory('callback')} className={`${btnBase} ${isActive('callback') ? btnActive : btnInactive}`}>
              <span>Call Back</span><span className="tabular-nums">{counts.callBack}</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => onSelectCategory('followup')} className={`${btnBase} ${isActive('followup') ? btnActive : btnInactive}`}>
              <span>Follow-Up Due</span><span className="tabular-nums">{counts.followUpDue}</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => onSelectCategory('converted')} className={`${btnBase} ${isActive('converted') ? btnActive : btnInactive}`}>
              <span>Converted</span><span className="tabular-nums">{counts.converted}</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
