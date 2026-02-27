import * as courseService from '../services/courseService.js';
import { getLeadById } from '../services/leadService.js';

/** GET /courses - Team Lead: list their courses. Query: for_lead_id (BOE) → courses for that lead's team. */
export async function getCourses(req, res) {
  try {
    const forLeadId = req.query.for_lead_id != null ? Number(req.query.for_lead_id) : null;
    if (forLeadId != null) {
      const lead = await getLeadById(forLeadId);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      if (req.user.role === 'boe' && lead.assigned_boe_id !== req.user.user_id) {
        return res.status(403).json({ error: 'Not assigned to this lead' });
      }
      const teamLeadId = await courseService.getTeamLeadIdForLead(forLeadId);
      if (teamLeadId == null) return res.json([]);
      const list = await courseService.listByTeamLead(teamLeadId);
      return res.json(list);
    }
    if (req.user.role !== 'team_lead') return res.status(403).json({ error: 'Team Lead only' });
    const list = await courseService.listByTeamLead(req.user.user_id);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get courses' });
  }
}

/** POST /courses - Team Lead only. Body: { name }. */
export async function createCourse(req, res) {
  if (req.user.role !== 'team_lead') return res.status(403).json({ error: 'Team Lead only' });
  const name = req.body?.name;
  try {
    const row = await courseService.create(req.user.user_id, name);
    return res.status(201).json(row);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Invalid course' });
  }
}
