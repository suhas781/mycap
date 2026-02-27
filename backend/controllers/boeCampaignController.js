import * as boeCampaignService from '../services/boeCampaignService.js';

/** POST /campaigns/boe - BOE creates a campaign. Body: college_id (required) or college_name, branch, city, stream, campaign_date */
export async function createBoeCampaign(req, res) {
  if (req.user?.role !== 'boe') {
    return res.status(403).json({ error: 'BOE access required' });
  }
  try {
    const { college_id, college_name, branch, city, stream, campaign_date } = req.body;
    const id = college_id != null ? Number(college_id) : null;
    if (!id && !college_name?.trim()) return res.status(400).json({ error: 'college_id or college_name required' });
    const campaign = await boeCampaignService.createBoeCampaign(req.user.user_id, {
      college_id: id || undefined,
      college_name,
      branch,
      city,
      stream,
      campaign_date,
    });
    return res.status(201).json(campaign);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create campaign' });
  }
}

/** GET /campaigns/boe - BOE lists their campaigns */
export async function listBoeCampaigns(req, res) {
  if (req.user?.role !== 'boe') {
    return res.status(403).json({ error: 'BOE access required' });
  }
  try {
    const campaigns = await boeCampaignService.listBoeCampaigns(req.user.user_id);
    return res.json(campaigns);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to list campaigns' });
  }
}

/** GET /campaigns/team - Team Lead lists BOE campaigns */
export async function listTeamCampaigns(req, res) {
  if (req.user?.role !== 'team_lead') {
    return res.status(403).json({ error: 'Team Lead access required' });
  }
  try {
    const campaigns = await boeCampaignService.listTeamCampaigns(req.user.user_id);
    return res.json(campaigns);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to list campaigns' });
  }
}

/** GET /campaigns/:id - get one campaign (BOE own, Team Lead team) */
export async function getOne(req, res) {
  try {
    const campaign = await boeCampaignService.getBoeCampaignById(
      Number(req.params.id),
      req.user.user_id,
      req.user.role
    );
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    return res.json(campaign);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get campaign' });
  }
}

/** POST /campaigns/:id/leads - BOE adds leads */
export async function addLeads(req, res) {
  if (req.user?.role !== 'boe') {
    return res.status(403).json({ error: 'BOE access required' });
  }
  try {
    const leads = req.body.leads;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'leads array required' });
    }
    const inserted = await boeCampaignService.addCampaignLeads(
      Number(req.params.id),
      req.user.user_id,
      leads
    );
    if (!inserted) return res.status(404).json({ error: 'Campaign not found or access denied' });
    return res.status(201).json(inserted);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to add leads' });
  }
}

/** GET /campaigns/:id/leads - BOE or Team Lead */
export async function getLeads(req, res) {
  try {
    const leads = await boeCampaignService.getCampaignLeads(
      Number(req.params.id),
      req.user.user_id,
      req.user.role
    );
    if (leads === null) return res.status(404).json({ error: 'Campaign not found' });
    return res.json(leads);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get leads' });
  }
}
