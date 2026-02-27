-- Add metadata JSONB to leads for universal sheet sync (extra columns stored as JSON).
-- Run: psql -d mycap -f database/leads_metadata.sql

ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_metadata ON leads USING GIN (metadata);
