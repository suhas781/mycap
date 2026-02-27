-- New Campaign Flow: BOE creates campaigns, campaign_leads, college_list.
-- Run after init/campaigns: psql -d mycap -f database/boe_campaigns_flow.sql

-- 1. College list (Team Lead edits; BOE uses for dropdown)
CREATE TABLE IF NOT EXISTS college_list (
  id SERIAL PRIMARY KEY,
  college_name VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_college_list_name ON college_list(college_name);

-- 2. BOE campaigns (created by BOE only)
CREATE TABLE IF NOT EXISTS boe_campaigns (
  id SERIAL PRIMARY KEY,
  boe_id INT NOT NULL REFERENCES users(id),
  college_name VARCHAR(255) NOT NULL,
  branch VARCHAR(255),
  city VARCHAR(255),
  stream VARCHAR(255),
  campaign_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_boe_campaigns_boe ON boe_campaigns(boe_id);
CREATE INDEX IF NOT EXISTS idx_boe_campaigns_date ON boe_campaigns(campaign_date);

-- 3. Campaign leads (leads added under a BOE campaign)
CREATE TABLE IF NOT EXISTS campaign_leads (
  id SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES boe_campaigns(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  course_selected VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign ON campaign_leads(campaign_id);
