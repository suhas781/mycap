import { fetchSheetRowsForSource } from '../services/sheetsService.js';
import { insertLead } from '../services/leadService.js';
import { getById } from '../services/leadSourceService.js';

/**
 * POST /sync-leads - Team Lead only. Body: { source_id } required; syncs that lead source's Google Sheet.
 */
export async function syncLeads(req, res) {
  try {
    const sourceId = req.body?.source_id != null ? Number(req.body.source_id) : null;
    if (!sourceId) return res.status(400).json({ error: 'source_id required' });
    const source = await getById(sourceId);
    if (!source) return res.status(404).json({ error: 'Lead source not found' });
    if (source.team_lead_id !== req.user.user_id) return res.status(403).json({ error: 'Not your sheet' });
    const rows = await fetchSheetRowsForSource(source.google_sheet_id, source.sheet_range || '', {
      useUniversalMapping: true,
    });
    let inserted = 0;
    for (const row of rows) {
      const result = await insertLead(row, sourceId);
      if (result) inserted++;
    }
    return res.json({ synced: rows.length, inserted });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Sync failed' });
  }
}
