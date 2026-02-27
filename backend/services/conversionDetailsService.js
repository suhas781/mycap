import pool from '../config/db.js';
import { getLeadById } from './leadService.js';

/**
 * Insert conversion details for a lead. Caller must ensure lead is eligible (active, not already converted).
 * Validation: course_fee >= 0, amount_paid >= 0 and <= course_fee, due_amount >= 0 (auto = course_fee - amount_paid if missing).
 */
export async function createConversionDetails(leadId, { course_name, course_fee, amount_paid, due_amount }) {
  const fee = course_fee != null && course_fee !== '' ? Number(course_fee) : null;
  const paid = amount_paid != null && amount_paid !== '' ? Number(amount_paid) : 0;
  let due = due_amount != null && due_amount !== '' ? Number(due_amount) : null;
  if (due === null && fee != null && !isNaN(fee)) due = Math.max(0, Number(fee) - paid);

  if (fee == null || isNaN(fee)) throw new Error('course_fee is required');
  if (fee < 0) throw new Error('course_fee must be >= 0');
  if (paid < 0) throw new Error('amount_paid must be >= 0');
  if (fee != null && paid > fee) throw new Error('amount_paid cannot exceed course_fee');
  if (due != null && due < 0) throw new Error('due_amount cannot be negative');

  const r = await pool.query(
    `INSERT INTO lead_conversion_details (lead_id, course_name, course_fee, amount_paid, due_amount)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [leadId, course_name?.trim() || null, fee, paid, due]
  );
  return r.rows[0];
}

export async function getConversionDetailsByLeadId(leadId) {
  const r = await pool.query(
    'SELECT * FROM lead_conversion_details WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1',
    [leadId]
  );
  return r.rows[0] || null;
}

export async function hasConversionDetails(leadId) {
  const r = await pool.query('SELECT 1 FROM lead_conversion_details WHERE lead_id = $1 LIMIT 1', [leadId]);
  return r.rows.length > 0;
}

/**
 * Update conversion details (e.g. when due is paid). Caller must ensure row exists.
 * Body can include amount_paid, due_amount; optional course_name, course_fee. Same validation as create.
 */
export async function updateConversionDetails(leadId, { course_name, course_fee, amount_paid, due_amount }) {
  const existing = await getConversionDetailsByLeadId(leadId);
  if (!existing) throw new Error('Conversion details not found for this lead');

  const fee = course_fee != null && course_fee !== '' ? Number(course_fee) : Number(existing.course_fee) ?? null;
  const paid = amount_paid != null && amount_paid !== '' ? Number(amount_paid) : Number(existing.amount_paid) ?? 0;
  let due = due_amount != null && due_amount !== '' ? Number(due_amount) : null;
  if (due === null && fee != null && !isNaN(fee)) due = Math.max(0, fee - paid);

  if (fee != null && (isNaN(fee) || fee < 0)) throw new Error('course_fee must be >= 0');
  if (paid < 0) throw new Error('amount_paid must be >= 0');
  if (fee != null && !isNaN(fee) && paid > fee) throw new Error('amount_paid cannot exceed course_fee');
  if (due != null && due < 0) throw new Error('due_amount cannot be negative');

  const nameVal = course_name !== undefined && course_name !== null ? (course_name?.trim() || null) : existing.course_name;
  const feeVal = fee ?? existing.course_fee;
  const r = await pool.query(
    `UPDATE lead_conversion_details SET course_name = $2, course_fee = $3, amount_paid = $4, due_amount = $5 WHERE lead_id = $1 RETURNING *`,
    [leadId, nameVal, feeVal, paid, due]
  );
  return r.rows[0];
}
