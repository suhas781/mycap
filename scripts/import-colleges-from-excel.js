/**
 * Import colleges from Book1.xlsx into college_list.
 * Columns: Place, College Name. Skips duplicates (same place + college_name).
 * Run from project root: node scripts/import-colleges-from-excel.js
 * Requires: npm install pg xlsx (from scripts dir or root).
 */
import pg from 'pg';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const excelPath = process.env.EXCEL_PATH || join(projectRoot, 'Book1.xlsx');

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'mycap',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

function normalize(val) {
  if (val == null) return '';
  const s = String(val).trim();
  return s;
}

async function exists(client, place, collegeName) {
  const placeVal = place === '' ? null : place;
  const r = await client.query(
    `SELECT 1 FROM college_list WHERE (place IS NOT DISTINCT FROM $1) AND (college_name = $2) LIMIT 1`,
    [placeVal, collegeName]
  );
  return r.rows.length > 0;
}

async function insertRow(client, place, collegeName) {
  const placeVal = place === '' ? null : place;
  await client.query(
    `INSERT INTO college_list (place, college_name) VALUES ($1, $2)`,
    [placeVal, collegeName]
  );
}

async function main() {
  let workbook;
  try {
    workbook = XLSX.read(readFileSync(excelPath), { type: 'buffer' });
  } catch (e) {
    console.error('Failed to read Excel file:', excelPath, e.message);
    process.exit(1);
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (raw.length < 2) {
    console.log('No data rows (need at least a header and one row).');
    process.exit(0);
  }

  const header = raw[0].map((h) => normalize(h));
  const placeIdx = header.findIndex((h) => /place/i.test(h));
  const nameIdx = header.findIndex((h) => /college\s*name|college_name/i.test(h));

  if (placeIdx === -1 || nameIdx === -1) {
    console.error('Expected columns "Place" and "College Name". Header:', header);
    process.exit(1);
  }

  const rows = raw.slice(1).map((row) => ({
    place: normalize(row[placeIdx]),
    college_name: normalize(row[nameIdx]),
  }));

  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;

  try {
    for (const row of rows) {
      if (!row.college_name) {
        skipped++;
        continue;
      }
      const already = await exists(client, row.place, row.college_name);
      if (already) {
        skipped++;
        continue;
      }
      await insertRow(client, row.place, row.college_name);
      inserted++;
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log('Done. Inserted:', inserted, 'Skipped (duplicate or empty name):', skipped);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
