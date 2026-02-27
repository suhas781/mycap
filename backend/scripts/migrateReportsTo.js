/**
 * Adds reports_to_id to users so BOEs can be assigned to a team lead.
 * Run once: node scripts/migrateReportsTo.js
 */
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reports_to_id INT REFERENCES users(id)
    `);
    console.log('Migration done: users.reports_to_id added (BOE → team lead).');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
