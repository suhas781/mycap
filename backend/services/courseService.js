import pool from '../config/db.js';

export async function listByTeamLead(teamLeadId) {
  const r = await pool.query(
    'SELECT id, team_lead_id, name, created_at FROM courses WHERE team_lead_id = $1 ORDER BY name',
    [teamLeadId]
  );
  return r.rows;
}

export async function create(teamLeadId, name) {
  const n = (name && String(name).trim()) || '';
  if (!n) throw new Error('Course name is required');
  const r = await pool.query(
    'INSERT INTO courses (team_lead_id, name) VALUES ($1, $2) RETURNING *',
    [teamLeadId, n]
  );
  return r.rows[0];
}

export async function getTeamLeadIdForLead(leadId) {
  const r = await pool.query(
    'SELECT ls.team_lead_id FROM leads l JOIN lead_sources ls ON ls.id = l.source_id WHERE l.id = $1',
    [leadId]
  );
  return r.rows[0]?.team_lead_id ?? null;
}
