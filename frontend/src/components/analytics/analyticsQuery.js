/** Build query string for GET /leads for analytics (admin or team lead). */
export function buildLeadsQuery({ teamLeadId, dateFrom, dateTo } = {}) {
  const p = new URLSearchParams();
  if (teamLeadId != null) p.set('team_lead_id', teamLeadId);
  if (dateFrom) p.set('from', dateFrom);
  if (dateTo) p.set('to', dateTo);
  const q = p.toString();
  return q ? `?${q}` : '';
}
