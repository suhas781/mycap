import {
  createCampaign,
  listCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  assignBoes,
  updateCampaignStatus,
  listCampaignsForBoe,
  addCampaignLog,
  getCampaignLogs,
  getCampaignAssignments,
} from '../services/campaignService.js';

/** POST /campaigns - team_lead only */
export async function create(req, res) {
  if (req.user?.role !== 'team_lead') {
    return res.status(403).json({ error: 'Team Lead access required' });
  }
  try {
    const { name, description, cluster_id, start_date, end_date } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const campaign = await createCampaign(req.user.user_id, { name, description, cluster_id, start_date, end_date });
    return res.status(201).json(campaign);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create campaign' });
  }
}

/** GET /campaigns - all roles; filtered by role */
export async function list(req, res) {
  try {
    const campaigns = await listCampaigns(req.user.user_id, req.user.role);
    return res.json(campaigns);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to list campaigns' });
  }
}

/** GET /campaigns/boe - boe only; list assigned to this BOE */
export async function listBoe(req, res) {
  if (req.user?.role !== 'boe') {
    return res.status(403).json({ error: 'BOE access required' });
  }
  try {
    const campaigns = await listCampaignsForBoe(req.user.user_id);
    return res.json(campaigns);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to list campaigns' });
  }
}

/** GET /campaigns/:id - one campaign; visibility by role */
export async function getOne(req, res) {
  try {
    const campaign = await getCampaignById(Number(req.params.id), req.user.user_id, req.user.role);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const assignments = await getCampaignAssignments(Number(req.params.id));
    return res.json({ ...campaign, assignments });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get campaign' });
  }
}

/** PUT /campaigns/:id - team_lead only */
export async function update(req, res) {
  if (req.user?.role !== 'team_lead') {
    return res.status(403).json({ error: 'Team Lead access required' });
  }
  try {
    const updated = await updateCampaign(Number(req.params.id), req.user.user_id, req.user.role, req.body);
    if (!updated) return res.status(404).json({ error: 'Campaign not found or access denied' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update campaign' });
  }
}

/** DELETE /campaigns/:id - team_lead only (creator) */
export async function remove(req, res) {
  if (req.user?.role !== 'team_lead') {
    return res.status(403).json({ error: 'Team Lead access required' });
  }
  try {
    const ok = await deleteCampaign(Number(req.params.id), req.user.user_id, req.user.role);
    if (!ok) return res.status(404).json({ error: 'Campaign not found or access denied' });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete campaign' });
  }
}

/** POST /campaigns/:id/assign-boes - team_lead. Body: { boe_ids: number[] } */
export async function assignBoesToCampaign(req, res) {
  if (req.user?.role !== 'team_lead') {
    return res.status(403).json({ error: 'Team Lead access required' });
  }
  try {
    const assignments = await assignBoes(
      Number(req.params.id),
      req.body.boe_ids || [],
      req.user.user_id,
      req.user.role
    );
    if (assignments === null) return res.status(404).json({ error: 'Campaign not found or access denied' });
    return res.json(assignments);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to assign BOEs' });
  }
}

/** PUT /campaigns/:id/status - team_lead. Body: { status: 'ACTIVE'|'COMPLETED'|'CLOSED' } */
export async function setStatus(req, res) {
  if (req.user?.role !== 'team_lead') {
    return res.status(403).json({ error: 'Team Lead access required' });
  }
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });
    const updated = await updateCampaignStatus(Number(req.params.id), status, req.user.user_id, req.user.role);
    if (!updated) return res.status(404).json({ error: 'Campaign not found or access denied' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update status' });
  }
}

/** POST /campaigns/:id/logs - boe. Body: { action, notes?, file_url? } */
export async function addLog(req, res) {
  if (req.user?.role !== 'boe') {
    return res.status(403).json({ error: 'BOE access required' });
  }
  try {
    const { action, notes, file_url } = req.body;
    if (!action || !['started', 'submitted_proof', 'completed'].includes(action)) {
      return res.status(400).json({ error: 'action must be started, submitted_proof, or completed' });
    }
    const log = await addCampaignLog(Number(req.params.id), req.user.user_id, { action, notes, file_url });
    if (!log) return res.status(404).json({ error: 'Campaign not found or you are not assigned' });
    return res.status(201).json(log);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to add log' });
  }
}

/** GET /campaigns/:id/logs - team_lead or cluster_manager (or boe for own logs) */
export async function getLogs(req, res) {
  const role = req.user?.role;
  if (!['team_lead', 'cluster_manager', 'boe'].includes(role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const logs = await getCampaignLogs(Number(req.params.id), req.user.user_id, role);
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get logs' });
  }
}
