import pool from '../config/db.js';

/** Only returns sources that are connected (have non-empty google_sheet_id). */
export async function listByTeamLead(teamLeadId) {
  const r = await pool.query(
    `SELECT id, name, team_lead_id, google_sheet_id, sheet_range, created_at
     FROM lead_sources
     WHERE team_lead_id = $1 AND google_sheet_id IS NOT NULL AND TRIM(google_sheet_id) != ''
     ORDER BY name`,
    [teamLeadId]
  );
  return r.rows;
}

export async function listAll() {
  const r = await pool.query(
    'SELECT s.id, s.name, s.team_lead_id, s.google_sheet_id, s.sheet_range, s.created_at, u.name AS team_lead_name FROM lead_sources s JOIN users u ON u.id = s.team_lead_id ORDER BY s.name'
  );
  return r.rows;
}

export async function getById(id) {
  const r = await pool.query('SELECT * FROM lead_sources WHERE id = $1', [id]);
  return r.rows[0] || null;
}

export async function create({ name, team_lead_id, google_sheet_id, sheet_range = '' }) {
  const r = await pool.query(
    'INSERT INTO lead_sources (name, team_lead_id, google_sheet_id, sheet_range) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, team_lead_id, (google_sheet_id || '').trim(), (sheet_range || '').trim()]
  );
  return r.rows[0];
}
