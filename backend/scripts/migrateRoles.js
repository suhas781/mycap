/**
 * Updates users_role_check to allow: team_lead, boe, hr, admin.
 * Run once: node scripts/migrateRoles.js
 */
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

async function migrate() {
  try {
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
    const r = await pool.query("UPDATE users SET role = 'admin' WHERE role = 'architect' RETURNING id");
    if (r.rowCount > 0) console.log('Updated', r.rowCount, 'architect user(s) to admin.');
    await pool.query(
      "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('team_lead', 'boe', 'hr', 'admin'))"
    );
    console.log('Migration done: users_role_check now allows team_lead, boe, hr, admin.');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
