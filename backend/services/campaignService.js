import pool from '../config/db.js';

/** Create campaign. Team lead only. */
export async function createCampaign(createdBy, { name, description, cluster_id, start_date, end_date }) {
  const r = await pool.query(
    `INSERT INTO campaigns (name, description, created_by, cluster_id, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name || '', description || null, createdBy, cluster_id || null, start_date || null, end_date || null]
  );
  return r.rows[0];
}

/** Get BOE IDs that report to this team lead. */
async function getTeamBoeIds(teamLeadId) {
  const r = await pool.query(
    'SELECT id FROM users WHERE role = $1 AND reports_to_id = $2',
    ['boe', teamLeadId]
  );
  return r.rows.map((row) => row.id);
}

/** List campaigns: filtered by role. cluster_manager => all; team_lead => created by me or assigned to my BOEs; boe => assigned to me; hr/admin/architect => all (read-only). */
export async function listCampaigns(userId, role) {
  if (role === 'cluster_manager' || role === 'hr' || role === 'admin' || role === 'architect') {
    const r = await pool.query(
      `SELECT c.*, u.name AS created_by_name
       FROM campaigns c
       LEFT JOIN users u ON u.id = c.created_by
       ORDER BY c.created_at DESC`
    );
    return r.rows;
  }
  if (role === 'boe') {
    const r = await pool.query(
      `SELECT c.*, u.name AS created_by_name, ca.status AS assignment_status, ca.completed_at AS assignment_completed_at
       FROM campaigns c
       JOIN campaign_assignments ca ON ca.campaign_id = c.id AND ca.boe_id = $1
       LEFT JOIN users u ON u.id = c.created_by
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return r.rows;
  }
  if (role === 'team_lead') {
    const teamBoeIds = await getTeamBoeIds(userId);
    const r = await pool.query(
      `SELECT c.*, u.name AS created_by_name
       FROM campaigns c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.created_by = $1
          OR EXISTS (SELECT 1 FROM campaign_assignments ca WHERE ca.campaign_id = c.id AND ca.boe_id = ANY($2::int[]))
       ORDER BY c.created_at DESC`,
      [userId, teamBoeIds.length ? teamBoeIds : [0]]
    );
    return r.rows;
  }
  return [];
}

/** Get one campaign by id. Visibility same as list. */
export async function getCampaignById(campaignId, userId, role) {
  const list = await listCampaigns(userId, role);
  const found = list.find((c) => c.id === Number(campaignId));
  if (!found) return null;
  const r = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
  const camp = r.rows[0] || null;
  if (!camp) return null;
  const createdBy = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [camp.created_by]);
  return { ...camp, created_by_name: createdBy.rows[0]?.name };
}

/** Update campaign. Team lead only; must own or manage (created_by or BOEs in team). */
export async function updateCampaign(campaignId, userId, role, body) {
  if (role !== 'team_lead') return null;
  const camp = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
  if (!camp.rows[0]) return null;
  const c = camp.rows[0];
  const teamBoeIds = await getTeamBoeIds(userId);
  const canEdit = c.created_by === userId || (teamBoeIds.length && await hasAnyAssignedBoeInTeam(campaignId, teamBoeIds));
  if (!canEdit) return null;
  const { name, description, cluster_id, start_date, end_date, status } = body;
  const updates = [];
  const values = [];
  let i = 1;
  if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
  if (description !== undefined) { updates.push(`description = $${i++}`); values.push(description); }
  if (cluster_id !== undefined) { updates.push(`cluster_id = $${i++}`); values.push(cluster_id); }
  if (start_date !== undefined) { updates.push(`start_date = $${i++}`); values.push(start_date); }
  if (end_date !== undefined) { updates.push(`end_date = $${i++}`); values.push(end_date); }
  if (status !== undefined) { updates.push(`status = $${i++}`); values.push(status); }
  if (updates.length === 0) return c;
  values.push(campaignId);
  const r = await pool.query(
    `UPDATE campaigns SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return r.rows[0] || null;
}

async function hasAnyAssignedBoeInTeam(campaignId, teamBoeIds) {
  const r = await pool.query(
    'SELECT 1 FROM campaign_assignments WHERE campaign_id = $1 AND boe_id = ANY($2::int[]) LIMIT 1',
    [campaignId, teamBoeIds]
  );
  return r.rows.length > 0;
}

/** Delete campaign. Team lead only; must have created it. */
export async function deleteCampaign(campaignId, userId, role) {
  if (role !== 'team_lead') return false;
  const r = await pool.query('DELETE FROM campaigns WHERE id = $1 AND created_by = $2 RETURNING id', [campaignId, userId]);
  return r.rowCount > 0;
}

/** Assign BOEs to campaign. Team lead only; campaign must be created by them or have team BOEs. */
export async function assignBoes(campaignId, boeIds, userId, role) {
  if (role !== 'team_lead') return null;
  const camp = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
  if (!camp.rows[0]) return null;
  const teamBoeIds = await getTeamBoeIds(userId);
  const canManage = camp.rows[0].created_by === userId || (await hasAnyAssignedBoeInTeam(campaignId, teamBoeIds));
  if (!canManage) return null;
  const validBoeIds = Array.isArray(boeIds) ? boeIds.filter((id) => teamBoeIds.includes(Number(id))) : [];
  await pool.query('DELETE FROM campaign_assignments WHERE campaign_id = $1', [campaignId]);
  for (const boeId of validBoeIds) {
    await pool.query(
      'INSERT INTO campaign_assignments (campaign_id, boe_id, status) VALUES ($1, $2, $3) ON CONFLICT (campaign_id, boe_id) DO NOTHING',
      [campaignId, boeId, 'ASSIGNED']
    );
  }
  const r = await pool.query('SELECT * FROM campaign_assignments WHERE campaign_id = $1', [campaignId]);
  return r.rows;
}

/** Update campaign status (ACTIVE, COMPLETED, CLOSED). Team lead only. */
export async function updateCampaignStatus(campaignId, status, userId, role) {
  if (role !== 'team_lead') return null;
  const r = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
  if (!r.rows[0]) return null;
  const c = r.rows[0];
  const teamBoeIds = await getTeamBoeIds(userId);
  const canEdit = c.created_by === userId || (await hasAnyAssignedBoeInTeam(campaignId, teamBoeIds));
  if (!canEdit) return null;
  const up = await pool.query(
    "UPDATE campaigns SET status = $1 WHERE id = $2 AND status IN ('ACTIVE','COMPLETED','CLOSED') RETURNING *",
    [status, campaignId]
  );
  return up.rows[0] || null;
}

/** BOE-only list: campaigns assigned to this BOE. */
export async function listCampaignsForBoe(boeId) {
  const r = await pool.query(
    `SELECT c.*, u.name AS created_by_name, ca.status AS assignment_status, ca.assigned_at, ca.completed_at
     FROM campaigns c
     JOIN campaign_assignments ca ON ca.campaign_id = c.id AND ca.boe_id = $1
     LEFT JOIN users u ON u.id = c.created_by
     ORDER BY c.created_at DESC`,
    [boeId]
  );
  return r.rows;
}

/** Add log entry. BOE only; must be assigned to campaign. */
export async function addCampaignLog(campaignId, boeId, { action, notes, file_url }) {
  const assign = await pool.query(
    'SELECT 1 FROM campaign_assignments WHERE campaign_id = $1 AND boe_id = $2',
    [campaignId, boeId]
  );
  if (!assign.rows.length) return null;
  const r = await pool.query(
    `INSERT INTO campaign_logs (campaign_id, boe_id, action, notes, file_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [campaignId, boeId, action, notes || null, file_url || null]
  );
  if (action === 'started') {
    await pool.query(
      "UPDATE campaign_assignments SET status = 'IN_PROGRESS' WHERE campaign_id = $1 AND boe_id = $2",
      [campaignId, boeId]
    );
  }
  if (action === 'completed') {
    await pool.query(
      "UPDATE campaign_assignments SET status = 'COMPLETED', completed_at = NOW() WHERE campaign_id = $1 AND boe_id = $2",
      [campaignId, boeId]
    );
  }
  return r.rows[0];
}

/** Get logs for a campaign. Team lead or cluster_manager (or BOE for own). */
export async function getCampaignLogs(campaignId, userId, role) {
  const allowed = ['team_lead', 'cluster_manager', 'boe'];
  if (!allowed.includes(role)) return [];
  const r = await pool.query(
    `SELECT cl.*, u.name AS boe_name
     FROM campaign_logs cl
     JOIN users u ON u.id = cl.boe_id
     WHERE cl.campaign_id = $1
     ORDER BY cl.timestamp DESC`,
    [campaignId]
  );
  let rows = r.rows;
  if (role === 'boe') {
    rows = rows.filter((log) => log.boe_id === userId);
  }
  return rows;
}

/** Get assignments for a campaign. */
export async function getCampaignAssignments(campaignId) {
  const r = await pool.query(
    `SELECT ca.*, u.name AS boe_name
     FROM campaign_assignments ca
     JOIN users u ON u.id = ca.boe_id
     WHERE ca.campaign_id = $1
     ORDER BY u.name`,
    [campaignId]
  );
  return r.rows;
}
