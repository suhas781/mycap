/**
 * BOE sidebar: categories from lead status. Backend filters leads; frontend only groups.
 * Clicking a category filters the table. Active category is highlighted.
 */
const DNR_STATUSES = ['DNR1', 'DNR2', 'DNR3', 'DNR4'];
const CALLBACK_STATUSES = ['Cut Call', 'Call Back'];
const COMPLETED_STATUSES = ['Converted', 'Not Interested', 'Denied'];

function getCategoryCounts(leads) {
  const now = new Date();
  const newLeads = leads.filter((l) => l.status === 'NEW');
  const dnr1 = leads.filter((l) => l.status === 'DNR1');
  const dnr2 = leads.filter((l) => l.status === 'DNR2');
  const dnr3 = leads.filter((l) => l.status === 'DNR3');
  const dnr4 = leads.filter((l) => l.status === 'DNR4');
  const callbackCut = leads.filter((l) => CALLBACK_STATUSES.includes(l.status));
  const followUpDue = leads.filter(
    (l) => l.next_followup_at && new Date(l.next_followup_at) <= now
  );
  const completed = leads.filter((l) => COMPLETED_STATUSES.includes(l.status));
  const oldLeads = leads.filter(
    (l) =>
      l.status !== 'NEW' &&
      !DNR_STATUSES.includes(l.status) &&
      !CALLBACK_STATUSES.includes(l.status) &&
      !COMPLETED_STATUSES.includes(l.status)
  );

  return {
    new: newLeads.length,
    old: oldLeads.length,
    dnr1: dnr1.length,
    dnr2: dnr2.length,
    dnr3: dnr3.length,
    dnr4: dnr4.length,
    callbackCut: callbackCut.length,
    followUpDue: followUpDue.length,
    completed: completed.length,
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
          !CALLBACK_STATUSES.includes(l.status) &&
          !COMPLETED_STATUSES.includes(l.status)
      );
    case 'dnr1':
      return leads.filter((l) => l.status === 'DNR1');
    case 'dnr2':
      return leads.filter((l) => l.status === 'DNR2');
    case 'dnr3':
      return leads.filter((l) => l.status === 'DNR3');
    case 'dnr4':
      return leads.filter((l) => l.status === 'DNR4');
    case 'callback':
      return leads.filter((l) => CALLBACK_STATUSES.includes(l.status));
    case 'followup':
      return leads.filter(
        (l) => l.next_followup_at && new Date(l.next_followup_at) <= now
      );
    case 'completed':
      return leads.filter((l) => COMPLETED_STATUSES.includes(l.status));
    default:
      return leads;
  }
}

export default function Sidebar({ leads, activeCategory, onSelectCategory }) {
  const counts = getCategoryCounts(leads);
  const isActive = (key) => activeCategory === key;

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-800">Categories</h2>
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => onSelectCategory('new')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                isActive('new')
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>NEW Leads</span>
              <span className="tabular-nums">{counts.new}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onSelectCategory('old')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                isActive('old')
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>OLD Leads</span>
              <span className="tabular-nums">{counts.old}</span>
            </button>
          </li>
          <li className="pt-2">
            <div className="px-3 py-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
              DNR Leads
            </div>
            <ul className="mt-1 space-y-0.5">
              {['dnr1', 'dnr2', 'dnr3', 'dnr4'].map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(key)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center justify-between ${
                      isActive(key)
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{key.toUpperCase()}</span>
                    <span className="tabular-nums">{counts[key]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onSelectCategory('callback')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                isActive('callback')
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>CALLBACK / CUT CALL</span>
              <span className="tabular-nums">{counts.callbackCut}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onSelectCategory('followup')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                isActive('followup')
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>FOLLOW-UP DUE</span>
              <span className="tabular-nums">{counts.followUpDue}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onSelectCategory('completed')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                isActive('completed')
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>COMPLETED / CLOSED</span>
              <span className="tabular-nums">{counts.completed}</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
