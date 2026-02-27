import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { sheetsConfig } from '../config/sheets.js';
import { buildMappedRows } from '../utils/sheetHeaderMapping.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve credentials path: relative paths tried from backend root then cwd. */
function resolveCredentialsPath(credentialsPath, fs) {
  const normalized = path.normalize(credentialsPath.trim());
  if (path.isAbsolute(normalized)) {
    return fs.existsSync(normalized) ? normalized : null;
  }
  const backendRoot = path.resolve(__dirname, '..');
  const baseName = path.basename(normalized) || 'service-account.json';
  const tries = [
    path.resolve(backendRoot, normalized),
    path.resolve(backendRoot, baseName),
    path.resolve(process.cwd(), normalized),
    path.resolve(process.cwd(), 'backend', baseName),
    path.resolve(process.cwd(), 'backend', normalized),
  ];
  for (const p of tries) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return null;
}

async function getAuthClient() {
  let credentials;
  if (sheetsConfig.credentialsJson) {
    credentials = JSON.parse(sheetsConfig.credentialsJson);
  } else if (sheetsConfig.credentialsPath) {
    const fs = await import('fs');
    const resolved = resolveCredentialsPath(sheetsConfig.credentialsPath, fs);
    if (!resolved) {
      const backendRoot = path.resolve(__dirname, '..');
      const tried1 = path.resolve(backendRoot, path.normalize((sheetsConfig.credentialsPath || '').trim()));
      throw new Error(
        `Google credentials file not found. Tried: ${tried1} and others. ` +
        'Ensure service-account.json is in the backend/ folder (same folder as package.json), or set GOOGLE_CREDENTIALS_JSON in .env instead.'
      );
    }
    credentials = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } else {
    throw new Error('Google credentials not configured. Set GOOGLE_CREDENTIALS_PATH or GOOGLE_CREDENTIALS_JSON in .env');
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return auth;
}

/**
 * Resolves the range to use: GOOGLE_SHEET_RANGE if set, otherwise first sheet's title from API.
 */
async function getSheetRange(sheets, sheetId) {
  if (sheetsConfig.sheetRange) {
    const name = sheetsConfig.sheetRange;
    return name.includes('!') ? name : `'${name}'`;
  }
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    fields: 'sheets(properties(title))',
  });
  const first = meta.data.sheets?.[0]?.properties?.title;
  if (!first) throw new Error('Spreadsheet has no sheets');
  return `'${first}'`;
}

function parseRowsToLeads(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h || '').trim().toLowerCase());
  const nameIdx = headers.findIndex((h) => h === 'name' || h === 'nome');
  const phoneIdx = headers.findIndex((h) => h === 'phone' || h === 'telefone' || h === 'mobile');
  const emailIdx = headers.findIndex((h) => h === 'email' || h === 'e-mail');
  const collegeIdx = headers.findIndex((h) => h === 'college' || h === 'college/university');
  const certIdx = headers.findIndex((h) => h === 'certification' || h === 'cert');
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const get = (idx) => (idx >= 0 && row[idx] !== undefined ? String(row[idx]).trim() : '');
    const phone = get(phoneIdx);
    if (!phone) continue;
    out.push({
      name: get(nameIdx),
      phone,
      email: get(emailIdx) || null,
      college: get(collegeIdx) || null,
      certification: get(certIdx) || null,
    });
  }
  return out;
}

/**
 * Fetch raw rows from a specific sheet (first row = headers). For use with universal header mapping.
 */
async function fetchSheetRawRowsForSource(sheetId, sheetRange = '') {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  if (!sheetId) throw new Error('Sheet ID required');
  let range = (sheetRange || '').trim();
  if (!range) {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'sheets(properties(title))',
    });
    const first = meta.data.sheets?.[0]?.properties?.title;
    if (!first) throw new Error('Spreadsheet has no sheets');
    range = `'${first}'`;
  } else if (!range.includes('!')) {
    range = `'${range}'`;
  }
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values || [];
}

/**
 * Fetch rows from a specific sheet (for a lead source). sheetId and sheetRange required.
 * @param {string} sheetId - Google Sheet ID
 * @param {string} [sheetRange] - Range (e.g. 'Sheet1' or 'Sheet1!A:Z')
 * @param {{ useUniversalMapping?: boolean }} [options] - If useUniversalMapping true, normalizes headers and returns { name, email, phone, college, certification, metadata }; otherwise legacy parse (no metadata).
 */
export async function fetchSheetRowsForSource(sheetId, sheetRange = '', options = {}) {
  const rawRows = await fetchSheetRawRowsForSource(sheetId, sheetRange);
  if (options.useUniversalMapping) {
    const { rows } = buildMappedRows(rawRows);
    return rows;
  }
  return parseRowsToLeads(rawRows);
}

/**
 * Reads default sheet from env (legacy). Expects first row as header.
 */
export async function fetchSheetRows() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetId = sheetsConfig.sheetId;
  if (!sheetId) throw new Error('GOOGLE_SHEET_ID not set');
  const range = await getSheetRange(sheets, sheetId);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  const rows = res.data.values || [];
  return parseRowsToLeads(rows);
}
