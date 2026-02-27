import StatusDropdown from './StatusDropdown';
import AssignDropdown from './AssignDropdown';

export default function LeadTable({ leads, role, boes, onRefresh }) {
  if (!leads?.length) {
    return (
      <p className="text-slate-500 py-8 text-center">No leads to show.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Phone</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">College</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
            {role === 'team_lead' && (
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Assigned BOE</th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm text-slate-800">
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  <span>{lead.name}</span>
                  {lead.status === 'Converted' && Number(lead.conversion_due_amount) > 0 && (
                    <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300" title={`Due: ₹${Number(lead.conversion_due_amount).toLocaleString('en-IN')}`}>
                      Due
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">{lead.phone}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{lead.email || '—'}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{lead.college || '—'}</td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                  {lead.status}
                </span>
              </td>
              {role === 'team_lead' && (
                <td className="px-4 py-3 text-sm text-slate-700">
                  {lead.assigned_boe_name || '—'}
                </td>
              )}
              <td className="px-4 py-3 text-sm flex items-center gap-2 flex-wrap">
                <StatusDropdown lead={lead} onUpdated={onRefresh} />
                {role === 'team_lead' && (
                  <AssignDropdown lead={lead} boes={boes} onUpdated={onRefresh} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
