import dotenv from 'dotenv';
import pool from '../config/db.js';
import { createUser } from '../services/userService.js';

dotenv.config();

async function ensureRoleConstraint() {
  await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
  await pool.query(
    "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('team_lead', 'boe', 'hr', 'admin'))"
  );
}

async function ensureReportsToColumn() {
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS reports_to_id INT REFERENCES users(id)
  `);
}

async function ensureEmploymentStatusColumn() {
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'active'
  `);
}

async function seed() {
  try {
    await ensureRoleConstraint();
    console.log('Ensured users_role_check allows: team_lead, boe, hr, admin.');
  } catch (e) {
    console.warn('Constraint update skipped (may already be correct):', e.message);
  }
  try {
    await ensureReportsToColumn();
    console.log('Ensured users.reports_to_id exists.');
  } catch (e) {
    console.warn('reports_to_id column skipped:', e.message);
  }
  try {
    await ensureEmploymentStatusColumn();
    console.log('Ensured users.employment_status exists.');
  } catch (e) {
    console.warn('employment_status column skipped:', e.message);
  }
  try {
    await createUser({
      name: 'Suhas G',
      email: 'suhas.g@mycaptain.in',
      password: 'password',
      role: 'hr',
    });
    console.log('Created hr: suhas.g@mycaptain.in');
  } catch (e) {
    if (e.code === '23505') console.log('HR suhas.g@mycaptain.in already exists');
    else console.error(e);
  }
  await pool.end();
  process.exit(0);
}

seed();
