import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { listByTeamLead, listAll, create } from '../services/leadSourceService.js';

const router = Router();
router.use(authRequired);

/**
 * GET /lead-sources - Team lead: own sources. Admin: all sources (for dropdowns and management).
 */
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      const list = await listAll();
      return res.json(list);
    }
    if (req.user.role === 'team_lead') {
      const list = await listByTeamLead(req.user.user_id);
      return res.json(list);
    }
    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to list sources' });
  }
});

/**
 * POST /lead-sources - Admin only (or HR). Body: { name, team_lead_id, google_sheet_id, sheet_range? }.
 */
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Only Admin or HR can add sheets' });
    }
    const { name, team_lead_id, google_sheet_id, sheet_range } = req.body;
    if (!name || !team_lead_id || !google_sheet_id) {
      return res.status(400).json({ error: 'name, team_lead_id, google_sheet_id required' });
    }
    const source = await create({ name, team_lead_id, google_sheet_id, sheet_range: sheet_range || '' });
    return res.status(201).json(source);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create source' });
  }
});

export default router;
