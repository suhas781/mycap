/**
 * Run all database migrations in order using DATABASE_URL from backend/.env.
 * Usage: node scripts/run-migrations.js
 * Or: DATABASE_URL="postgresql://..." node scripts/run-migrations.js
 */
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const backendEnv = path.join(root, 'backend', '.env');

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && existsSync(backendEnv)) {
  const content = readFileSync(backendEnv, 'utf8');
  const m = content.match(/^\s*DATABASE_URL=(.+)$/m);
  if (m) databaseUrl = m[1].trim().replace(/^["']|["']$/g, '');
}
if (!databaseUrl) {
  console.error('Set DATABASE_URL in backend/.env or in the environment.');
  process.exit(1);
}

const migrations = [
  'database/init.sql',
  'database/lead_conversion_details.sql',
  'database/courses.sql',
  'database/leads_metadata.sql',
  'database/campaigns.sql',
  'database/boe_campaigns_flow.sql',
  'database/college_list_place.sql',
  'database/migration_hr_architect.sql',
];

function run(file) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(root, file);
    const child = spawn('psql', [databaseUrl, '-f', fullPath], {
      stdio: 'inherit',
      shell: true,
      cwd: root,
    });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`psql exited ${code}`))));
  });
}

(async () => {
  console.log('Running migrations on', databaseUrl.replace(/:[^:@]+@/, ':****@'));
  for (const file of migrations) {
    console.log('\n---', file);
    await run(file);
  }
  console.log('\nDone.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
