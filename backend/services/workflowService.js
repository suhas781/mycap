/**
 * Workflow engine: allowed transitions, retry rules, terminal states.
 * All business rules here; no logic in routes.
 */

const RETRYABLE = ['DNR1', 'DNR2', 'DNR3', 'Cut Call', 'Call Back'];
const TERMINAL = ['DNR4', 'Not Interested', 'Denied'];
const PIPELINE_MOVE_CONVERTED = 'Converted';

const ALL_STATUSES = [
  'NEW',
  'DNR1', 'DNR2', 'DNR3', 'DNR4',
  'Cut Call', 'Call Back',
  'Not Interested', 'Denied',
  'Converted',
];

function isRetryable(status) {
  return RETRYABLE.includes(status);
}

function isTerminal(status) {
  return TERMINAL.includes(status);
}

/**
 * Forbidden: skip NEW -> DNR4; updating inactive; updating unassigned (for BOE); exceed retry limit.
 */
export function validateTransition(lead, newStatus, isTeamLead) {
  if (!lead.is_active) {
    return { allowed: false, reason: 'Cannot update inactive lead' };
  }
  if (!isTeamLead && lead.assigned_boe_id === null) {
    return { allowed: false, reason: 'Lead is not assigned' };
  }
  const current = lead.status;
  if (current === newStatus) {
    return { allowed: false, reason: 'Same status' };
  }
  if (current === 'NEW' && newStatus === 'DNR4') {
    return { allowed: false, reason: 'Cannot skip from NEW to DNR4' };
  }
  const retryCount = lead.retry_count ?? 0;
  if (newStatus === 'DNR1' && retryCount >= 1) return { allowed: false, reason: 'Retry limit for DNR1' };
  if (newStatus === 'DNR2' && retryCount >= 2) return { allowed: false, reason: 'Retry limit for DNR2' };
  if (newStatus === 'DNR3' && retryCount >= 3) return { allowed: false, reason: 'Retry limit for DNR3' };
  if (newStatus === 'DNR4') {
    // allowed when coming from DNR3 or equivalent
    return { allowed: true };
  }
  if (newStatus === 'Cut Call' || newStatus === 'Call Back') {
    return { allowed: true }; // Second occurrence handled in getUpdatesForNewStatus (is_active = false)
  }
  return { allowed: true };
}

/**
 * Returns updates to apply for lead when moving to newStatus.
 * - DNR1: retry_count = 1, next_followup_at set
 * - DNR2: retry_count = 2, next_followup_at set
 * - DNR3: retry_count = 3, next_followup_at set
 * - DNR4: is_active = false
 * - Cut Call / Call Back: one retry; second occurrence -> is_active = false (handled by validateTransition)
 * - Converted: is_active = false, pipeline = 'ENROLLED'
 * - Not Interested / Denied: is_active = false
 */
export function getUpdatesForNewStatus(lead, newStatus) {
  const updates = { status: newStatus };
  const retryCount = lead.retry_count ?? 0;
  if (newStatus === 'DNR1') {
    updates.retry_count = 1;
    updates.next_followup_at = nextFollowupDate();
  } else if (newStatus === 'DNR2') {
    updates.retry_count = 2;
    updates.next_followup_at = nextFollowupDate();
  } else if (newStatus === 'DNR3') {
    updates.retry_count = 3;
    updates.next_followup_at = nextFollowupDate();
  } else if (newStatus === 'DNR4' || newStatus === 'Not Interested' || newStatus === 'Denied') {
    updates.is_active = false;
    updates.next_followup_at = null;
  } else if (newStatus === 'Cut Call' || newStatus === 'Call Back') {
    updates.retry_count = retryCount + 1;
    if (updates.retry_count >= 2) {
      updates.is_active = false;
      updates.next_followup_at = null;
    } else {
      updates.next_followup_at = nextFollowupDate();
    }
  } else if (newStatus === 'Converted') {
    updates.is_active = false;
    updates.pipeline = 'ENROLLED';
    updates.next_followup_at = null;
  }
  return updates;
}

function nextFollowupDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

export function getAllStatuses() {
  return [...ALL_STATUSES];
}
