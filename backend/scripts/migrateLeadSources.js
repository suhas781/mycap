/**
 * Adds lead_sources and leads.source_id for multi-sheet support.
 * Run once: node scripts/migrateLeadSources.js
 */
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        team_lead_id INT NOT NULL REFERENCES users(id),
        google_sheet_id VARCHAR(255) NOT NULL,
        sheet_range VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_lead_sources_team_lead ON lead_sources(team_lead_id)');

    await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_id INT REFERENCES lead_sources(id) ON DELETE SET NULL');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source_id)');

    await pool.query('ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_phone_key');
    await pool.query('ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_phone_source_id_key');
    try {
      await pool.query('ALTER TABLE leads ADD CONSTRAINT leads_phone_source_id_key UNIQUE (phone, source_id)');
    } catch (e) {
      if (e.code !== '42710') throw e;
    }
    console.log('Migration done: lead_sources and leads.source_id ready.');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
