-- Campaign Tracking System: add cluster_manager + architect roles and campaign tables.
-- Run after init.sql: psql -d mycap -f database/campaigns.sql

-- 1. Allow new roles in users (drop existing check, add new one)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('team_lead', 'boe', 'hr', 'admin', 'cluster_manager', 'architect'));

-- 2. Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT NOT NULL REFERENCES users(id),
  cluster_id INT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CLOSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- 3. Campaign assignments (BOE assigned to campaign)
CREATE TABLE IF NOT EXISTS campaign_assignments (
  id SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  boe_id INT NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')),
  UNIQUE(campaign_id, boe_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_assignments_campaign ON campaign_assignments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_boe ON campaign_assignments(boe_id);

-- 4. Campaign logs (BOE actions: started, submitted_proof, completed)
CREATE TABLE IF NOT EXISTS campaign_logs (
  id SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  boe_id INT NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL CHECK (action IN ('started', 'submitted_proof', 'completed')),
  notes TEXT,
  file_url VARCHAR(1024),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign ON campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_boe ON campaign_logs(boe_id);
