/**
 * Universal header mapping for Google Sheet → CRM sync.
 * Normalizes sheet headers and maps to stable CRM fields: name, email, phone, college, certification.
 * All other columns go into metadata JSON.
 */

// --- Alias groups: normalized header (or variant) → CRM field name ---
const ALIAS_GROUPS = {
  name: [
    'name',
    'full name',
    'student name',
    'candidate name',
    'staff full name',
  ],
  email: [
    'email',
    'email id',
    'email id :',
    'gmail',
  ],
  phone: [
    'phone',
    'phone number',
    'phone no',
    'mobile',
    'mobile number',
  ],
  college: [
    'college',
    'college name',
    'institute',
  ],
  certification: [
    'choose the courses you are interested in',
    'apart from psychology choose another course',
    'other business courses',
    'additional courses for your professional development',
    'select your goal',
    'admission type',
  ],
};

// Build a Set of normalized aliases for each CRM field (for fast lookup)
const NORMALIZED_ALIAS_MAP = new Map(); // normalizedAlias -> 'name' | 'email' | 'phone' | 'college' | 'certification'
for (const [crmField, aliases] of Object.entries(ALIAS_GROUPS)) {
  for (const a of aliases) {
    const norm = normalizeHeader(a);
    NORMALIZED_ALIAS_MAP.set(norm, crmField);
  }
}

/**
 * Normalize a sheet header for matching: lowercase, remove symbols, trim.
 * @param {string} header - Raw header string
 * @returns {string} Normalized header
 */
function normalizeHeader(header) {
  if (header == null) return '';
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // replace symbols with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get the CRM field name for a normalized header, or null if it should go to metadata.
 * @param {string} normalizedHeader - Already normalized header
 * @returns {string|null} 'name' | 'email' | 'phone' | 'college' | 'certification' | null
 */
function getCrmFieldForHeader(normalizedHeader) {
  if (!normalizedHeader) return null;
  return NORMALIZED_ALIAS_MAP.get(normalizedHeader) || null;
}

/**
 * Build header-to-CRM mapping. For duplicate headers (same CRM field), first occurrence wins.
 * Returns: { crmByIndex: Map<columnIndex, 'name'|'email'|...>, originalHeaders: string[] }
 * @param {string[]} rawHeaderRow - First row from sheet (raw strings)
 */
function buildHeaderMap(rawHeaderRow) {
  const crmByIndex = new Map();
  const originalHeaders = rawHeaderRow.map((h) => String(h ?? '').trim());
  const seen = new Set(); // normalized headers we've already mapped (for "first non-empty" duplicate rule we handle per row)
  for (let i = 0; i < originalHeaders.length; i++) {
    const normalized = normalizeHeader(originalHeaders[i]);
    if (!normalized) continue;
    const crmField = getCrmFieldForHeader(normalized);
    if (crmField) crmByIndex.set(i, crmField);
  }
  return { crmByIndex, originalHeaders };
}

/**
 * Build one CRM row from a data row using the header map. First non-empty wins for duplicate CRM fields.
 * @param {Map<number, string>} crmByIndex - Column index → CRM field name
 * @param {string[]} originalHeaders - Original header strings (for metadata keys)
 * @param {any[]} dataRow - One row of cell values
 * @returns {{ name: string, email: string|null, phone: string, college: string|null, certification: string|null, metadata: object }}
 */
function buildRowFromSheetRow(crmByIndex, originalHeaders, dataRow) {
  const crm = { name: '', email: null, phone: '', college: null, certification: null };
  const metadata = {};
  const assigned = { name: false, email: false, phone: false, college: false, certification: false };
  for (let i = 0; i < dataRow.length; i++) {
    const raw = dataRow[i];
    const value = raw != null ? String(raw).trim() : '';
    const origHeader = originalHeaders[i] != null ? String(originalHeaders[i]).trim() : `column_${i}`;
    const crmField = crmByIndex.get(i);
    if (crmField && !assigned[crmField]) {
      if (value !== '') {
        crm[crmField] = value;
        assigned[crmField] = true;
      }
    } else if (crmField && assigned[crmField]) {
      // Duplicate header → first non-empty already set; store this in metadata as provided
      metadata[origHeader] = raw != null ? raw : '';
    } else {
      // Not a mapped CRM field → metadata (store as provided)
      metadata[origHeader] = raw != null ? raw : '';
    }
  }
  return {
    name: crm.name,
    email: crm.email || null,
    phone: crm.phone,
    college: crm.college || null,
    certification: crm.certification || null,
    metadata: Object.keys(metadata).length ? metadata : null,
  };
}

/**
 * Build array of CRM-shaped rows from raw sheet rows (first row = headers).
 * Skips rows with empty phone. Duplicate headers: first non-empty value used for CRM field.
 * @param {any[][]} rawRows - Rows from sheet (values array), first row = headers
 * @returns {{ headers: string[], rows: Array<{ name, email, phone, college, certification, metadata }> }}
 */
function buildMappedRows(rawRows) {
  if (!rawRows || rawRows.length < 2) return { headers: [], rows: [] };
  const headerRow = rawRows[0].map((c) => (c != null ? String(c) : ''));
  const { crmByIndex, originalHeaders } = buildHeaderMap(headerRow);
  const rows = [];
  for (let i = 1; i < rawRows.length; i++) {
    const dataRow = rawRows[i] || [];
    const row = buildRowFromSheetRow(crmByIndex, originalHeaders, dataRow);
    if (!row.phone) continue; // skip rows without phone (same as legacy)
    rows.push(row);
  }
  return { headers: originalHeaders, rows };
}

export {
  normalizeHeader,
  getCrmFieldForHeader,
  buildHeaderMap,
  buildRowFromSheetRow,
  buildMappedRows,
  ALIAS_GROUPS,
};
