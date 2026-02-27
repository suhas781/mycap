import * as collegeService from '../services/collegeListService.js';

/** GET /colleges - all (BOE for dropdown, Team Lead for list) */
export async function list(req, res) {
  try {
    const rows = await collegeService.listColleges();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to list colleges' });
  }
}

/** POST /colleges - Team Lead or HR. Body: { college_name, place } */
export async function create(req, res) {
  if (req.user?.role !== 'team_lead' && req.user?.role !== 'hr') {
    return res.status(403).json({ error: 'Team Lead or HR access required' });
  }
  try {
    const { college_name, place } = req.body;
    if (!college_name?.trim()) return res.status(400).json({ error: 'college_name required' });
    const row = await collegeService.createCollege({ college_name, place });
    return res.status(201).json(row);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create college' });
  }
}

/** PUT /colleges/:id - Team Lead or HR. Body: { college_name, place } */
export async function update(req, res) {
  if (req.user?.role !== 'team_lead' && req.user?.role !== 'hr') {
    return res.status(403).json({ error: 'Team Lead or HR access required' });
  }
  try {
    const { college_name, place } = req.body;
    const row = await collegeService.updateCollege(Number(req.params.id), { college_name, place });
    if (!row) return res.status(404).json({ error: 'College not found' });
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update college' });
  }
}

/** DELETE /colleges/:id - Team Lead or HR */
export async function remove(req, res) {
  if (req.user?.role !== 'team_lead' && req.user?.role !== 'hr') {
    return res.status(403).json({ error: 'Team Lead or HR access required' });
  }
  try {
    const ok = await collegeService.deleteCollege(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: 'College not found' });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete college' });
  }
}
