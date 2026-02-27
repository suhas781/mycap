/**
 * Google Sheets API config for sync. Sheet IDs come from lead_sources in DB.
 * Requires: GOOGLE_CREDENTIALS_JSON or GOOGLE_CREDENTIALS_PATH when using sync.
 */
const raw = (process.env.GOOGLE_CREDENTIALS_JSON || '').trim();
const credentialsJson = raw && (raw.startsWith("'") ? raw.slice(1, -1) : raw);

export const sheetsConfig = {
  sheetId: (process.env.GOOGLE_SHEET_ID || '').trim(),
  /** Optional. Sheet tab name or range (e.g. "Form Responses 1"). If unset, first sheet is used. */
  sheetRange: (process.env.GOOGLE_SHEET_RANGE || '').trim(),
  credentialsPath: (process.env.GOOGLE_CREDENTIALS_PATH || '').trim(),
  credentialsJson,
};
