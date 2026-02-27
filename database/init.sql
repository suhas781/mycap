-- Database: mycap (create manually if needed: CREATE DATABASE mycap;)

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('team_lead', 'boe', 'hr', 'admin')),
  reports_to_id INT REFERENCES users(id),
  employment_status VARCHAR(50) DEFAULT 'active' CHECK (employment_status IN ('active', 'notice_period', 'resigned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead sources: each sheet assigned to a team lead (one DB, logical separation + combined view)
CREATE TABLE IF NOT EXISTS lead_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  team_lead_id INT NOT NULL REFERENCES users(id),
  google_sheet_id VARCHAR(255) NOT NULL,
  sheet_range VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_team_lead ON lead_sources(team_lead_id);

-- Leads (source_id = which sheet/source; same phone can exist in different sources)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  source_id INT REFERENCES lead_sources(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  college VARCHAR(255),
  certification VARCHAR(255),
  status VARCHAR(100) NOT NULL,
  retry_count INT DEFAULT 0,
  next_followup_at TIMESTAMP WITH TIME ZONE,
  assigned_boe_id INT REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  pipeline VARCHAR(100) DEFAULT 'LEADS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone, source_id)
);

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_boe ON leads(assigned_boe_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_is_active ON leads(is_active);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline ON leads(pipeline);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_followup_at);

-- Lead status history
CREATE TABLE IF NOT EXISTS lead_status_history (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL REFERENCES leads(id),
  updated_by INT NOT NULL REFERENCES users(id),
  old_status VARCHAR(100),
  new_status VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead ON lead_status_history(lead_id);

-- Assignment history (optional but useful for audit; spec says "Logs assignment in history table" - we log status; assignment change can be inferred or we add a simple log; spec says "lead_status_history" for status. Assignment logging: "Logs assignment in history table" - interpreted as we can log in lead_status_history with a special note or add assignment_log; spec says "lead_status_history" has old_status, new_status. So assignment is just updating assigned_boe_id; "Logs assignment in history table" could mean we log something. I'll keep only lead_status_history and on assign we can log a status history entry with old_status = new_status = current status with a note, or we don't have an assignment_history table. Re-reading: "Logs assignment in history table" - I'll add one row to lead_status_history when assignment changes: old_status and new_status could both be the current status, and we use the table to record "assignment changed". Actually the spec only defines lead_status_history with old_status, new_status. So "Logs assignment" might mean we log in application logs or we add a comment. To keep strict, I won't add extra tables. We'll just update assigned_boe_id and not add a separate assignment log table unless we use lead_status_history with a convention. I'll leave init as is.
