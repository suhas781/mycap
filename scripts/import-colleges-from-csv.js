/**
 * Import colleges from colleges.csv into college_list (Neon or any Postgres).
 * CSV columns: Place, College Name. Skips duplicates (same place + college_name).
 * Uses DATABASE_URL (Neon) or DB_* env vars. Load .env from backend if present.
 *
 * Run from project root:
 *   node scripts/import-colleges-from-csv.js
 * Or with env:
 *   $env:DATABASE_URL = "postgresql://user:pass@host/db?sslmode=require"
 *   node scripts/import-colleges-from-csv.js
 */
import pg from 'pg';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Load backend/.env if present (for DATABASE_URL)
const envPath = join(projectRoot, 'backend', '.env');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      const val = m[2].replace(/^["']|["']$/g, '').trim();
      process.env[m[1]] = val;
    }
  }
}

const csvPath = process.env.CSV_PATH || join(projectRoot, 'colleges.csv');

const url = process.env.DATABASE_URL;
const poolConfig = url
  ? {
      connectionString: url,
      ssl: /^postgres(ql)?:\/\//i.test(url) ? { rejectUnauthorized: false } : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'mycap',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new pg.Pool(poolConfig);

function normalize(val) {
  if (val == null) return '';
  return String(val).trim();
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

function parseCsv(path) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = createReadStream(path, { encoding: 'utf8' });
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
    stream.pipe(parser);
    parser.on('data', (row) => rows.push(row));
    parser.on('error', reject);
    parser.on('end', () => resolve(rows));
    stream.on('error', reject);
  });
}

async function main() {
  let rows;
  try {
    rows = await parseCsv(csvPath);
  } catch (e) {
    console.error('Failed to read CSV:', csvPath, e.message);
    process.exit(1);
  }

  const first = rows[0] || {};
  const placeKey = Object.keys(first).find((k) => /place/i.test(k)) || 'Place';
  const nameKey = Object.keys(first).find((k) => /college\s*name|college_name/i.test(k)) || 'College Name';

  const data = rows.map((row) => ({
    place: normalize(row[placeKey]),
    college_name: normalize(row[nameKey]),
  }));

  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;

  try {
    for (const row of data) {
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
