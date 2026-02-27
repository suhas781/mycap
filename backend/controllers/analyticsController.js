import * as boeCampaignService from '../services/boeCampaignService.js';
import * as revenueAnalyticsService from '../services/revenueAnalyticsService.js';

/** GET /analytics/campaigns/team - Team Lead campaign analytics */
export async function teamCampaignAnalytics(req, res) {
  if (req.user?.role !== 'team_lead') {
    return res.status(403).json({ error: 'Team Lead access required' });
  }
  try {
    const data = await boeCampaignService.getTeamCampaignAnalytics(req.user.user_id);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get analytics' });
  }
}

/** GET /analytics/campaigns/admin - Admin: campaign performance per team. Query: team_lead_id (optional). */
export async function adminCampaignAnalytics(req, res) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const teamLeadId = req.query.team_lead_id != null ? Number(req.query.team_lead_id) : null;
    const data = await boeCampaignService.getAdminCampaignPerformance(teamLeadId);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get campaign analytics' });
  }
}

/** GET /analytics/team-performance - Admin: all teams or filter by team_lead_id. Team Lead: own team only. Query: team_lead_id? (admin), from?, to? */
export async function teamPerformance(req, res) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'team_lead') {
    return res.status(403).json({ error: 'Admin or Team Lead access required' });
  }
  try {
    let teamLeadId = req.query.team_lead_id != null ? Number(req.query.team_lead_id) : null;
    if (req.user?.role === 'team_lead') teamLeadId = req.user.user_id;
    const dateFrom = req.query.from && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from) ? req.query.from : null;
    const dateTo = req.query.to && /^\d{4}-\d{2}-\d{2}$/.test(req.query.to) ? req.query.to : null;
    const data = await boeCampaignService.getAdminTeamPerformance(teamLeadId, dateFrom, dateTo);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get team performance' });
  }
}

const REVENUE_ALLOWED_ROLES = ['admin', 'team_lead', 'cluster_manager', 'architect', 'hr'];

/** GET /analytics/revenue - Revenue from conversion details. Admin: all; Team Lead: own team; optional read-only for cluster_manager, architect, hr. */
export async function revenueAnalytics(req, res) {
  if (!REVENUE_ALLOWED_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const dateFrom = req.query.from && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from) ? req.query.from : null;
    const dateTo = req.query.to && /^\d{4}-\d{2}-\d{2}$/.test(req.query.to) ? req.query.to : null;
    const data = await revenueAnalyticsService.getRevenueAnalytics({
      userId: req.user.user_id,
      role: req.user.role,
      dateFrom,
      dateTo,
    });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get revenue analytics' });
  }
}
