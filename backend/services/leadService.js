import pool from '../config/db.js';

const MAX_LENGTH = { name: 255, phone: 50, email: 255, college: 255, certification: 255 };

function truncate(str, max) {
  if (str == null || str === '') return str === '' ? '' : null;
  const s = String(str).trim();
  return s.length <= max ? s : s.slice(0, max);
}

/**
 * BOE creates a lead (manual add). Assigned to this BOE, source_id null, status NEW.
 */
export async function createLeadByBoe(boeId, { name, phone, email, college, certification }) {
  const r = await pool.query(
    `INSERT INTO leads (source_id, name, phone, email, college, certification, status, retry_count, assigned_boe_id, is_active, pipeline, next_followup_at)
     VALUES (NULL, $1, $2, $3, $4, $5, 'NEW', 0, $6, true, 'LEADS', NULL)
     RETURNING *`,
    [
      truncate(name ?? '', MAX_LENGTH.name) || '',
      truncate(phone ?? '', MAX_LENGTH.phone) || '',
      truncate(email, MAX_LENGTH.email) || null,
      truncate(college, MAX_LENGTH.college) || null,
      truncate(certification, MAX_LENGTH.certification) || null,
      boeId,
    ]
  );
  return r.rows[0] || null;
}

/**
 * Insert lead (sync). sourceId optional. Skips duplicate by (phone, source_id). Truncates values.
 * Supports metadata JSONB: row.metadata (object) stored as-is; extra sheet columns go there.
 */
export async function insertLead(row, sourceId = null) {
  const metadataJson =
    row.metadata != null && typeof row.metadata === 'object'
      ? JSON.stringify(row.metadata)
      : null;
  const r = await pool.query(
    `INSERT INTO leads (source_id, name, phone, email, college, certification, metadata, status, retry_count, assigned_boe_id, is_active, pipeline, next_followup_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'NEW', 0, NULL, true, 'LEADS', NULL)
     ON CONFLICT (phone, source_id) DO NOTHING
     RETURNING id`,
    [
      sourceId,
      truncate(row.name ?? '', MAX_LENGTH.name) || '',
      truncate(row.phone ?? '', MAX_LENGTH.phone) || '',
      truncate(row.email, MAX_LENGTH.email) || null,
      truncate(row.college, MAX_LENGTH.college) || null,
      truncate(row.certification, MAX_LENGTH.certification) || null,
      metadataJson,
    ]
  );
  return r.rows[0] || null;
}

export async function getLeadById(id) {
  const r = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
  return r.rows[0] || null;
}

export async function updateLeadStatus(leadId, updates) {
  const fields = [];
  const values = [];
  let i = 1;
  if (updates.status !== undefined) {
    fields.push(`status = $${i++}`);
    values.push(updates.status);
  }
  if (updates.retry_count !== undefined) {
    fields.push(`retry_count = $${i++}`);
    values.push(updates.retry_count);
  }
  if (updates.next_followup_at !== undefined) {
    fields.push(`next_followup_at = $${i++}`);
    values.push(updates.next_followup_at);
  }
  if (updates.is_active !== undefined) {
    fields.push(`is_active = $${i++}`);
    values.push(updates.is_active);
  }
  if (updates.pipeline !== undefined) {
    fields.push(`pipeline = $${i++}`);
    values.push(updates.pipeline);
  }
  if (fields.length === 0) return null;
  values.push(leadId);
  const r = await pool.query(
    `UPDATE leads SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return r.rows[0] || null;
}

export async function assignBoe(leadId, boeId) {
  const r = await pool.query(
    'UPDATE leads SET assigned_boe_id = $1 WHERE id = $2 RETURNING *',
    [boeId, leadId]
  );
  return r.rows[0] || null;
}

/** Update lead college (Team Lead only). */
export async function updateLeadCollege(leadId, college) {
  const val = truncate(college, MAX_LENGTH.college);
  const r = await pool.query(
    'UPDATE leads SET college = $1 WHERE id = $2 RETURNING *',
    [val || null, leadId]
  );
  return r.rows[0] || null;
}

/** Update lead name and/or phone (BOE: only assigned leads). */
export async function updateLeadNamePhone(leadId, { name, phone }) {
  const updates = [];
  const values = [];
  let i = 1;
  if (name !== undefined) {
    updates.push(`name = $${i++}`);
    values.push(truncate(name ?? '', MAX_LENGTH.name) || '');
  }
  if (phone !== undefined) {
    updates.push(`phone = $${i++}`);
    values.push(truncate(phone ?? '', MAX_LENGTH.phone) || '');
  }
  if (updates.length === 0) return null;
  values.push(leadId);
  const r = await pool.query(
    `UPDATE leads SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return r.rows[0] || null;
}

export async function insertStatusHistory(leadId, updatedBy, oldStatus, newStatus) {
  await pool.query(
    `INSERT INTO lead_status_history (lead_id, updated_by, old_status, new_status) VALUES ($1, $2, $3, $4)`,
    [leadId, updatedBy, oldStatus, newStatus]
  );
}

/**
 * Visibility: Team Lead sees only their sources; Admin sees all (or one source). Optional date range (created_at).
 */
function addDateFilter(conditions, params, dateFrom, dateTo) {
  if (dateFrom) {
    params.push(dateFrom);
    conditions.push(`l.created_at >= $${params.length}::date`);
  }
  if (dateTo) {
    params.push(dateTo);
    conditions.push(`l.created_at < ($${params.length}::date + interval '1 day')`);
  }
}

const LIST_BASE = `SELECT l.*, u.name AS assigned_boe_name, c.due_amount AS conversion_due_amount
  FROM leads l
  LEFT JOIN users u ON l.assigned_boe_id = u.id
  LEFT JOIN lead_conversion_details c ON c.lead_id = l.id`;

export async function listLeadsForUser({ role, userId, includeInactive = false, sourceId = null, allowedSourceIds = null, teamLeadId = null, dateFrom = null, dateTo = null }) {
  const base = LIST_BASE;
  const order = ' ORDER BY l.created_at DESC';

  if (role === 'admin') {
    const conditions = [];
    const params = [];
    if (teamLeadId != null) {
      conditions.push('l.source_id IN (SELECT id FROM lead_sources WHERE team_lead_id = $1)');
      params.push(teamLeadId);
    } else if (sourceId != null) {
      conditions.push('l.source_id = $1');
      params.push(sourceId);
    }
    addDateFilter(conditions, params, dateFrom, dateTo);
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const r = await pool.query(`${base}${where}${order}`, params.length ? params : undefined);
    return r.rows;
  }
  if (role === 'team_lead') {
    if (!allowedSourceIds || allowedSourceIds.length === 0) return [];
    const conditions = [];
    const params = [];
    if (sourceId != null && allowedSourceIds.includes(Number(sourceId))) {
      conditions.push('l.source_id = $1');
      params.push(sourceId);
    } else {
      conditions.push('l.source_id = ANY($1::int[])');
      params.push(allowedSourceIds);
    }
    // Default: active leads + Converted (so "Converted" category shows). includeInactive: all leads.
    if (!includeInactive) conditions.push("(l.is_active = true OR l.status = 'Converted')");
    addDateFilter(conditions, params, dateFrom, dateTo);
    const where = ' WHERE ' + conditions.join(' AND ');
    const r = await pool.query(`${base}${where}${order}`, params);
    return r.rows;
  }
  if (role === 'boe') {
    // Return assigned leads that are active OR converted, so BOE can see and filter by Converted in the sidebar.
    const conditions = ['l.assigned_boe_id = $1', "(l.is_active = true OR l.status = 'Converted')"];
    const params = [userId];
    addDateFilter(conditions, params, dateFrom, dateTo);
    const r = await pool.query(
      `${base} WHERE ${conditions.join(' AND ')} ${order}`,
      params
    );
    return r.rows;
  }
  return [];
}

/** Bulk assign: assign many leads to one BOE. Returns { assigned, failed }. Caller must ensure lead ids belong to team lead's sources. */
export async function bulkAssignBoe(leadIds, boeId, byUserId) {
  if (!leadIds?.length || !boeId) return { assigned: 0, failed: 0 };
  let assigned = 0;
  for (const leadId of leadIds) {
    const lead = await getLeadById(leadId);
    if (!lead || !lead.is_active || lead.pipeline === 'ENROLLED' || lead.status === 'Converted') continue;
    await assignBoe(leadId, boeId);
    await insertStatusHistory(leadId, byUserId, lead.status, lead.status);
    assigned += 1;
  }
  return { assigned, failed: leadIds.length - assigned };
}
