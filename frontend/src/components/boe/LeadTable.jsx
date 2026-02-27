/**
 * BOE Excel-like table: #, Name, Phone, Status, Next Followup, Updated At.
 * Row click opens lead details modal. No business logic; backend rules apply.
 */
function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function LeadTable({ leads, onRowClick }) {
  if (!leads?.length) {
    return (
      <div className="p-8 text-center text-slate-500 border border-slate-200 rounded-b-lg">
        No leads to show.
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[calc(100vh-12rem)]">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-50 z-10">
          <tr>
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700 w-12">
              #
            </th>
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
              Name
            </th>
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
              Phone
            </th>
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
              Status
            </th>
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
              Next Followup
            </th>
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
              Updated At
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => (
            <tr
              key={lead.id}
              onClick={() => onRowClick(lead)}
              className="hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <td className="border border-slate-200 px-3 py-2 text-slate-700 tabular-nums">
                {index + 1}
              </td>
              <td className="border border-slate-200 px-3 py-2 text-slate-900">
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  <span>{lead.name}</span>
                  {lead.status === 'Converted' && Number(lead.conversion_due_amount) > 0 && (
                    <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300" title={`Due: ₹${Number(lead.conversion_due_amount).toLocaleString('en-IN')}`}>
                      Due
                    </span>
                  )}
                </span>
              </td>
              <td className="border border-slate-200 px-3 py-2 text-slate-900">
                {lead.phone}
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                  {lead.status}
                </span>
              </td>
              <td className="border border-slate-200 px-3 py-2 text-slate-700">
                {formatDate(lead.next_followup_at)}
              </td>
              <td className="border border-slate-200 px-3 py-2 text-slate-700">
                {formatDate(lead.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
