import { listBoes, listTeamLeads, listAllUsers, updateUserRole, updateReportsTo, updateEmploymentStatus } from '../services/userService.js';

/**
 * GET /users/team-leads - Admin or HR. List team leads (id, name) for analytics team filter.
 */
export async function getTeamLeads(req, res) {
  const list = await listTeamLeads();
  return res.json(list);
}

/**
 * GET /users/boes - Team Lead only. List BOEs that report to this team lead.
 */
export async function getBoes(req, res) {
  const teamLeadId = req.user?.user_id;
  const list = await listBoes(teamLeadId);
  return res.json(list);
}

/**
 * GET /users - HR only. List all users for role assignment.
 */
export async function getAllUsers(req, res) {
  const list = await listAllUsers();
  return res.json(list);
}

/**
 * PUT /users/:id/role - HR only. Body: { role }. Assign role (team_lead, boe, hr, admin).
 */
export async function setUserRole(req, res) {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'role required' });
    const updated = await updateUserRole(userId, role);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update role' });
  }
}

/**
 * PUT /users/:id/reports-to - HR only. Body: { team_lead_id }. Assign BOE to a team lead (team_lead_id can be null).
 */
export async function setReportsTo(req, res) {
  try {
    const userId = Number(req.params.id);
    const teamLeadId = req.body.team_lead_id != null ? Number(req.body.team_lead_id) : null;
    const updated = await updateReportsTo(userId, teamLeadId);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update reports-to' });
  }
}

/**
 * PUT /users/:id/employment-status - HR only. Body: { employment_status }. Values: active, notice_period, resigned.
 */
export async function setEmploymentStatus(req, res) {
  try {
    const userId = Number(req.params.id);
    const { employment_status } = req.body;
    if (!employment_status) return res.status(400).json({ error: 'employment_status required' });
    const updated = await updateEmploymentStatus(userId, employment_status);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update status' });
  }
}
