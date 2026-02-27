import {
  listLeadsForUser,
  getLeadById,
  updateLeadStatus,
  assignBoe,
  updateLeadCollege,
  updateLeadNamePhone,
  insertStatusHistory,
  bulkAssignBoe,
  createLeadByBoe,
} from '../services/leadService.js';
import { listByTeamLead, getById } from '../services/leadSourceService.js';
import { validateTransition, getUpdatesForNewStatus, getAllStatuses } from '../services/workflowService.js';
import * as conversionDetailsService from '../services/conversionDetailsService.js';

/**
 * GET /leads - ?source_id=, ?inactive=1 (team_lead), ?team_lead_id= (admin), ?from=YYYY-MM-DD&to=YYYY-MM-DD (date range on created_at).
 */
export async function getLeads(req, res) {
  const { role, user_id } = req.user;
  const includeInactive = req.query.inactive === '1' && role === 'team_lead';
  const sourceId = req.query.source_id != null ? Number(req.query.source_id) : null;
  const teamLeadId = req.query.team_lead_id != null && role === 'admin' ? Number(req.query.team_lead_id) : null;
  const dateFrom = req.query.from && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from) ? req.query.from : null;
  const dateTo = req.query.to && /^\d{4}-\d{2}-\d{2}$/.test(req.query.to) ? req.query.to : null;
  let allowedSourceIds = null;
  if (role === 'team_lead') {
    const sources = await listByTeamLead(user_id);
    allowedSourceIds = sources.map((s) => s.id);
  }
  if (sourceId != null) {
    const source = await getById(sourceId);
    const connected = source && source.google_sheet_id != null && String(source.google_sheet_id).trim() !== '';
    if (!connected) return res.json([]);
  }
  const leads = await listLeadsForUser({
    role,
    userId: user_id,
    includeInactive: !!includeInactive,
    sourceId,
    allowedSourceIds,
    teamLeadId,
    dateFrom,
    dateTo,
  });
  return res.json(leads);
}

/**
 * POST /leads - BOE only. Create a lead (name, phone, email?, college?). Assigned to this BOE, status NEW. No date field.
 */
export async function createLead(req, res) {
  if (req.user.role !== 'boe') return res.status(403).json({ error: 'BOE only' });
  const { name, phone, email, college, certification } = req.body;
  if (!name?.trim() || !phone?.trim()) return res.status(400).json({ error: 'name and phone required' });
  try {
    const lead = await createLeadByBoe(req.user.user_id, { name, phone, email, college, certification });
    return res.status(201).json(lead);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create lead' });
  }
}

/**
 * GET /leads/statuses - Allowed status list for dropdown (same for both roles; backend enforces rules).
 */
export async function getStatuses(req, res) {
  return res.json(getAllStatuses());
}

/**
 * GET /leads/:id - Single lead. Team Lead: any; BOE: only assigned.
 */
export async function getLead(req, res) {
  const lead = await getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (req.user.role === 'boe') {
    if (lead.assigned_boe_id !== req.user.user_id) return res.status(403).json({ error: 'Not assigned to you' });
    if (!lead.is_active) return res.status(403).json({ error: 'Cannot view inactive lead' });
  }
  return res.json(lead);
}

/**
 * PUT /leads/:id/assign - Team Lead only. assigned_boe_id = body.boe_id. Cannot assign inactive or converted.
 */
export async function assignLead(req, res) {
  const lead = await getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.is_active) {
    return res.status(400).json({ error: 'Cannot assign inactive lead' });
  }
  if (lead.pipeline === 'ENROLLED' || lead.status === 'Converted') {
    return res.status(400).json({ error: 'Cannot assign converted lead' });
  }
  const boeId = req.body.boe_id;
  if (!boeId) return res.status(400).json({ error: 'boe_id required' });
  await assignBoe(lead.id, boeId);
  await insertStatusHistory(lead.id, req.user.user_id, lead.status, lead.status);
  const updated = await getLeadById(lead.id);
  return res.json(updated);
}

/**
 * POST /leads/bulk-assign - Team Lead only. Body: { lead_ids: number[], boe_id: number }. Only assigns leads that belong to team lead's sources and are assignable.
 */
export async function bulkAssign(req, res) {
  if (req.user.role !== 'team_lead') return res.status(403).json({ error: 'Team lead only' });
  const leadIds = Array.isArray(req.body.lead_ids) ? req.body.lead_ids.map(Number).filter(Boolean) : [];
  const boeId = req.body.boe_id ? Number(req.body.boe_id) : null;
  if (!leadIds.length || !boeId) return res.status(400).json({ error: 'lead_ids (array) and boe_id required' });
  const sources = await listByTeamLead(req.user.user_id);
  const allowedSourceIds = new Set(sources.map((s) => s.id));
  const toAssign = [];
  for (const id of leadIds) {
    const lead = await getLeadById(id);
    if (lead && (lead.source_id == null || allowedSourceIds.has(lead.source_id))) toAssign.push(id);
  }
  const { assigned, failed } = await bulkAssignBoe(toAssign, boeId, req.user.user_id);
  return res.json({ assigned, failed, total: leadIds.length });
}

/**
 * PUT /leads/:id/status - Update status. BOE: only assigned; Team Lead: any. Workflow engine applies.
 */
export async function updateStatus(req, res) {
  const lead = await getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (req.user.role === 'boe' && lead.assigned_boe_id !== req.user.user_id) {
    return res.status(403).json({ error: 'Not assigned to you' });
  }
  const newStatus = req.body.status;
  if (!newStatus) return res.status(400).json({ error: 'status required' });
  const validation = validateTransition(lead, newStatus, req.user.role === 'team_lead');
  if (!validation.allowed) {
    return res.status(400).json({ error: validation.reason || 'Transition not allowed' });
  }
  const updates = getUpdatesForNewStatus(lead, newStatus);
  const oldStatus = lead.status;
  await updateLeadStatus(lead.id, updates);
  await insertStatusHistory(lead.id, req.user.user_id, oldStatus, newStatus);
  const updated = await getLeadById(lead.id);
  return res.json(updated);
}

/**
 * PUT /leads/:id/college - Team Lead only. Body: { college }. Updates only the lead's college name.
 */
export async function updateCollege(req, res) {
  if (req.user.role !== 'team_lead') return res.status(403).json({ error: 'Team lead only' });
  const lead = await getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const college = req.body.college;
  if (college !== undefined && college !== null && typeof college !== 'string') {
    return res.status(400).json({ error: 'college must be a string' });
  }
  try {
    const updated = await updateLeadCollege(lead.id, college ?? '');
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update college' });
  }
}

/**
 * POST /leads/:id/conversion-details - BOE (own lead) or Team Lead. Body: { course_name, course_fee, amount_paid?, due_amount? }.
 * Lead must be active and not already converted. Inserts into lead_conversion_details.
 */
export async function createConversionDetails(req, res) {
  const lead = await getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (req.user.role === 'boe') {
    if (lead.assigned_boe_id !== req.user.user_id) return res.status(403).json({ error: 'Not assigned to you' });
  } else if (req.user.role !== 'team_lead') {
    return res.status(403).json({ error: 'BOE or Team Lead only' });
  }
  if (!lead.is_active) return res.status(400).json({ error: 'Lead is inactive' });
  if (lead.status === 'Converted') return res.status(400).json({ error: 'Lead is already converted' });
  const existing = await conversionDetailsService.getConversionDetailsByLeadId(lead.id);
  if (existing) return res.status(400).json({ error: 'Conversion details already exist for this lead' });

  const { course_name, course_fee, amount_paid, due_amount } = req.body;
  try {
    const row = await conversionDetailsService.createConversionDetails(lead.id, {
      course_name,
      course_fee,
      amount_paid,
      due_amount,
    });
    return res.status(201).json(row);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Invalid conversion details' });
  }
}

/**
 * GET /leads/:id/conversion-details - Return conversion details for a lead (BOE own, Team Lead any).
 */
export async function getConversionDetails(req, res) {
  const lead = await getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (req.user.role === 'boe' && lead.assigned_boe_id !== req.user.user_id) {
    return res.status(403).json({ error: 'Not assigned to you' });
  }
  if (req.user.role !== 'boe' && req.user.role !== 'team_lead' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const details = await conversionDetailsService.getConversionDetailsByLeadId(lead.id);
  return res.json(details || null);
}

/**
 * PUT /leads/:id/conversion-details - Update conversion details (e.g. mark due as paid). BOE (own lead) or Team Lead. Details must exist.
 */
export async function updateConversionDetails(req, res) {
  const lead = await getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (req.user.role === 'boe') {
    if (lead.assigned_boe_id !== req.user.user_id) return res.status(403).json({ error: 'Not assigned to you' });
  } else if (req.user.role !== 'team_lead') {
    return res.status(403).json({ error: 'BOE or Team Lead only' });
  }
  if (lead.status !== 'Converted') return res.status(400).json({ error: 'Lead is not converted' });
  const existing = await conversionDetailsService.getConversionDetailsByLeadId(lead.id);
  if (!existing) return res.status(404).json({ error: 'Conversion details not found' });

  const { course_name, course_fee, amount_paid, due_amount } = req.body;
  try {
    const row = await conversionDetailsService.updateConversionDetails(lead.id, {
      course_name,
      course_fee,
      amount_paid,
      due_amount,
    });
    return res.json(row);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Invalid conversion details' });
  }
}

/**
 * PUT /leads/:id/name-phone - BOE only (assigned leads). Body: { name?, phone? }. Updates name and/or phone.
 */
export async function updateNamePhone(req, res) {
  if (req.user.role !== 'boe') return res.status(403).json({ error: 'BOE only' });
  const lead = await getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (lead.assigned_boe_id !== req.user.user_id) {
    return res.status(403).json({ error: 'Not assigned to you' });
  }
  const { name, phone } = req.body;
  if (name !== undefined && (typeof name !== 'string')) return res.status(400).json({ error: 'name must be a string' });
  if (phone !== undefined && (typeof phone !== 'string')) return res.status(400).json({ error: 'phone must be a string' });
  if (!name?.trim() && name !== undefined && name !== '') return res.status(400).json({ error: 'name cannot be empty' });
  if (!phone?.trim() && phone !== undefined && phone !== '') return res.status(400).json({ error: 'phone cannot be empty' });
  try {
    const updated = await updateLeadNamePhone(lead.id, { name, phone });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update' });
  }
}
