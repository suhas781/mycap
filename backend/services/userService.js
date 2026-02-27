import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

/** Count users (for one-time setup: first HR is created when count is 0). */
export async function countUsers() {
  const r = await pool.query('SELECT COUNT(*) AS n FROM users');
  return parseInt(r.rows[0]?.n || '0', 10);
}

/** Used by login – only columns that always exist (no migration required). */
export async function findByEmail(email) {
  const r = await pool.query(
    'SELECT id, name, email, password, role FROM users WHERE email = $1',
    [email]
  );
  return r.rows[0] || null;
}

export async function findById(id) {
  const r = await pool.query(
    'SELECT id, name, email, role, reports_to_id, employment_status, created_at FROM users WHERE id = $1',
    [id]
  );
  return r.rows[0] || null;
}

export async function createUser({ name, email, password, role }) {
  const hashed = await bcrypt.hash(password, 10);
  const r = await pool.query(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, hashed, role]
  );
  return r.rows[0];
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/** Get user by id including password (for change-password). */
export async function findByIdWithPassword(id) {
  const r = await pool.query(
    'SELECT id, name, email, password, role FROM users WHERE id = $1',
    [id]
  );
  return r.rows[0] || null;
}

/** Update password. Verifies current password, then sets new one. */
export async function updatePassword(userId, currentPassword, newPassword) {
  const user = await findByIdWithPassword(userId);
  if (!user) throw new Error('User not found');
  const ok = await comparePassword(currentPassword, user.password);
  if (!ok) throw new Error('Current password is incorrect');
  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);
}

/** List BOEs. If teamLeadId is set, only BOEs that report to that team lead. Excludes resigned. */
export async function listBoes(teamLeadId = null) {
  const statusFilter = "AND (employment_status IS NULL OR employment_status <> 'resigned')";
  try {
    if (teamLeadId != null) {
      const r = await pool.query(
        `SELECT id, name, email, role, reports_to_id FROM users WHERE role = $1 AND reports_to_id = $2 ${statusFilter} ORDER BY name`,
        ['boe', teamLeadId]
      );
      return r.rows;
    }
    const r = await pool.query(
      `SELECT id, name, email, role, reports_to_id FROM users WHERE role = $1 ${statusFilter} ORDER BY name`,
      ['boe']
    );
    return r.rows;
  } catch (e) {
    if (e.code === '42703') {
      const r = await pool.query(
        'SELECT id, name, email, role FROM users WHERE role = $1 ORDER BY name',
        ['boe']
      );
      return r.rows;
    }
    throw e;
  }
}

/** List team leads (id, name) for Admin analytics team filter. */
export async function listTeamLeads() {
  const r = await pool.query(
    "SELECT id, name FROM users WHERE role = 'team_lead' ORDER BY name"
  );
  return r.rows;
}

/** List all users for HR. Tries full schema first; falls back to base columns if migration not run. */
export async function listAllUsers() {
  try {
    const r = await pool.query(
      'SELECT id, name, email, role, reports_to_id, employment_status FROM users ORDER BY name'
    );
    return r.rows;
  } catch (e) {
    if (e.code === '42703') {
      const r = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
      return r.rows.map((row) => ({ ...row, reports_to_id: null, employment_status: 'active' }));
    }
    throw e;
  }
}

/** Update a user's role. Allowed roles: team_lead, boe, hr, admin, cluster_manager, architect. */
export async function updateUserRole(userId, role) {
  const allowed = ['team_lead', 'boe', 'hr', 'admin', 'cluster_manager', 'architect'];
  if (!allowed.includes(role)) {
    throw new Error('Invalid role');
  }
  const r = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
    [role, userId]
  );
  const row = r.rows[0] || null;
  if (!row) return null;
  if (role !== 'boe') {
    try {
      await pool.query('UPDATE users SET reports_to_id = NULL WHERE id = $1', [userId]);
    } catch (_) {}
  }
  try {
    const full = await pool.query(
      'SELECT id, name, email, role, reports_to_id, employment_status FROM users WHERE id = $1',
      [userId]
    );
    return full.rows[0] || { ...row, reports_to_id: null, employment_status: 'active' };
  } catch (_) {
    return { ...row, reports_to_id: null, employment_status: 'active' };
  }
}

/** Set which team lead a BOE reports to. HR only. teamLeadId can be null to unassign. */
export async function updateReportsTo(userId, teamLeadId) {
  try {
    const r = await pool.query(
      'UPDATE users SET reports_to_id = $1 WHERE id = $2 RETURNING id, name, email, role, reports_to_id, employment_status',
      [teamLeadId || null, userId]
    );
    return r.rows[0] || null;
  } catch (e) {
    if (e.code === '42703') throw new Error('Reports-to not available. Run: node scripts/seedUsers.js');
    throw e;
  }
}

/** Set employment status: active, notice_period, resigned. HR only. */
export async function updateEmploymentStatus(userId, status) {
  const allowed = ['active', 'notice_period', 'resigned'];
  if (!allowed.includes(status)) throw new Error('Invalid employment status');
  try {
    const r = await pool.query(
      'UPDATE users SET employment_status = $1 WHERE id = $2 RETURNING id, name, email, role, reports_to_id, employment_status',
      [status, userId]
    );
    return r.rows[0] || null;
  } catch (e) {
    if (e.code === '42703') throw new Error('Status not available. Run: node scripts/seedUsers.js');
    throw e;
  }
}

/**
 * Delete a single user. Cleans FKs (same as bulk). reassignCampaignsToId: user id to assign campaigns to (e.g. current HR).
 * Returns deleted user id or null if not found.
 */
export async function deleteUser(userId, reassignCampaignsToId = null) {
  const id = Number(userId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM lead_sources WHERE team_lead_id = $1', [id]);
    await client.query('UPDATE leads SET assigned_boe_id = NULL WHERE assigned_boe_id = $1', [id]);
    await client.query('DELETE FROM lead_status_history WHERE updated_by = $1', [id]);
    await client.query('UPDATE users SET reports_to_id = NULL WHERE reports_to_id = $1', [id]);
    try {
      await client.query('DELETE FROM campaign_assignments WHERE boe_id = $1', [id]);
    } catch (_) {}
    try {
      await client.query('DELETE FROM campaign_logs WHERE boe_id = $1', [id]);
    } catch (_) {}
    try {
      if (reassignCampaignsToId) {
        await client.query('UPDATE campaigns SET created_by = $1 WHERE created_by = $2', [reassignCampaignsToId, id]);
      } else {
        const fallback = await client.query('SELECT id FROM users WHERE id != $1 AND role IN (\'hr\', \'admin\') LIMIT 1', [id]);
        if (fallback.rows[0]) {
          await client.query('UPDATE campaigns SET created_by = $1 WHERE created_by = $2', [fallback.rows[0].id, id]);
        }
      }
    } catch (_) {}
    try {
      await client.query('DELETE FROM boe_campaigns WHERE boe_id = $1', [id]);
    } catch (_) {}
    try {
      await client.query('DELETE FROM courses WHERE team_lead_id = $1', [id]);
    } catch (_) {}
    const del = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    await client.query('COMMIT');
    return del.rowCount ? del.rows[0].id : null;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Remove all users except keepUserId. HR only. Cleans FKs: lead_sources, leads, lead_status_history,
 * campaign_assignments, campaign_logs, campaigns (reassign created_by), boe_campaigns, courses.
 */
export async function removeAllUsersExcept(keepUserId) {
  const keepId = Number(keepUserId);
  const r = await pool.query('SELECT id FROM users WHERE id != $1', [keepId]);
  const ids = r.rows.map((row) => row.id);
  if (ids.length === 0) return { removed: 0 };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM lead_sources WHERE team_lead_id = ANY($1::int[])', [ids]);
    await client.query('UPDATE leads SET assigned_boe_id = NULL WHERE assigned_boe_id = ANY($1::int[])', [ids]);
    await client.query('DELETE FROM lead_status_history WHERE updated_by = ANY($1::int[])', [ids]);
    await client.query('UPDATE users SET reports_to_id = NULL WHERE reports_to_id = ANY($1::int[])', [ids]);
    try {
      await client.query('DELETE FROM campaign_assignments WHERE boe_id = ANY($1::int[])', [ids]);
    } catch (_) {}
    try {
      await client.query('DELETE FROM campaign_logs WHERE boe_id = ANY($1::int[])', [ids]);
    } catch (_) {}
    try {
      await client.query('UPDATE campaigns SET created_by = $1 WHERE created_by = ANY($2::int[])', [keepId, ids]);
    } catch (_) {}
    try {
      await client.query('DELETE FROM boe_campaigns WHERE boe_id = ANY($1::int[])', [ids]);
    } catch (_) {}
    try {
      await client.query('DELETE FROM courses WHERE team_lead_id = ANY($1::int[])', [ids]);
    } catch (_) {}
    const del = await client.query('DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id', [ids]);
    await client.query('COMMIT');
    return { removed: del.rowCount || 0 };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
