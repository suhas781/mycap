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
      name: 'Team Lead',
      email: 'lead@example.com',
      password: 'password',
      role: 'team_lead',
    });
    console.log('Created team_lead: lead@example.com');
  } catch (e) {
    if (e.code === '23505') console.log('Team lead already exists');
    else console.error(e);
  }
  for (const [name, email] of [
    ['Team Lead 2', 'lead2@example.com'],
    ['Team Lead 3', 'lead3@example.com'],
  ]) {
    try {
      await createUser({ name, email, password: 'password', role: 'team_lead' });
      console.log('Created team_lead:', email);
    } catch (e) {
      if (e.code === '23505') console.log('Team lead already exists:', email);
      else console.error(e);
    }
  }
  try {
    await createUser({
      name: 'BOE One',
      email: 'boe@example.com',
      password: 'password',
      role: 'boe',
    });
    console.log('Created boe: boe@example.com');
  } catch (e) {
    if (e.code === '23505') console.log('BOE already exists');
    else console.error(e);
  }
  for (const [name, email] of [
    ['BOE Two', 'boe2@example.com'],
    ['BOE Three', 'boe3@example.com'],
    ['BOE Four', 'boe4@example.com'],
    ['BOE Five', 'boe5@example.com'],
  ]) {
    try {
      await createUser({ name, email, password: 'password', role: 'boe' });
      console.log('Created boe:', email);
    } catch (e) {
      if (e.code === '23505') console.log('BOE already exists:', email);
      else console.error(e);
    }
  }
  try {
    await createUser({ name: 'HR User', email: 'hr@example.com', password: 'password', role: 'hr' });
    console.log('Created hr: hr@example.com');
  } catch (e) {
    if (e.code === '23505') console.log('HR already exists');
    else console.error(e);
  }
  try {
    await createUser({ name: 'Admin', email: 'admin@example.com', password: 'password', role: 'admin' });
    console.log('Created admin: admin@example.com');
  } catch (e) {
    if (e.code === '23505') console.log('Admin already exists');
    else console.error(e);
  }
  await pool.end();
  process.exit(0);
}

seed();
