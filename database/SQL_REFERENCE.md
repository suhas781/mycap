# Database SQL reference

All SQL used in the project, grouped by purpose. Parameters are shown as `$1`, `$2`, etc.

---

## 1. Schema (database/init.sql)

Run once: `psql -d mycap -f database/init.sql`

```sql
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

-- Lead sources
CREATE TABLE IF NOT EXISTS lead_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  team_lead_id INT NOT NULL REFERENCES users(id),
  google_sheet_id VARCHAR(255) NOT NULL,
  sheet_range VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_team_lead ON lead_sources(team_lead_id);

-- Leads
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
```

---

## 2. User service (backend/services/userService.js)

### Login / lookup

```sql
-- findByEmail($1)
SELECT id, name, email, password, role FROM users WHERE email = $1;

-- findById($1)
SELECT id, name, email, role, reports_to_id, employment_status, created_at FROM users WHERE id = $1;
```

### Create user

```sql
-- createUser: $1=name, $2=email, $3=password_hash, $4=role
INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)
RETURNING id, name, email, role, created_at;
```

### List BOEs

```sql
-- listBoes(teamLeadId): BOEs that report to team lead, exclude resigned
SELECT id, name, email, role, reports_to_id FROM users
WHERE role = $1 AND reports_to_id = $2
  AND (employment_status IS NULL OR employment_status <> 'resigned')
ORDER BY name;
-- Params: ['boe', teamLeadId]

-- listBoes(): all BOEs (no team lead filter)
SELECT id, name, email, role, reports_to_id FROM users
WHERE role = $1
  AND (employment_status IS NULL OR employment_status <> 'resigned')
ORDER BY name;
-- Params: ['boe']

-- Fallback if employment_status column missing:
SELECT id, name, email, role FROM users WHERE role = $1 ORDER BY name;
```

### List team leads (Admin analytics)

```sql
-- listTeamLeads()
SELECT id, name FROM users WHERE role = 'team_lead' ORDER BY name;
```

### List all users (HR)

```sql
-- listAllUsers()
SELECT id, name, email, role, reports_to_id, employment_status FROM users ORDER BY name;

-- Fallback if columns missing:
SELECT id, name, email, role FROM users ORDER BY name;
```

### Update role

```sql
-- updateUserRole($1=role, $2=userId)
UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role;

-- Clear reports_to_id when role is not boe
UPDATE users SET reports_to_id = NULL WHERE id = $1;

-- Fetch full user after update
SELECT id, name, email, role, reports_to_id, employment_status FROM users WHERE id = $1;
```

### Update reports-to (HR)

```sql
-- updateReportsTo($1=teamLeadId_or_null, $2=userId)
UPDATE users SET reports_to_id = $1 WHERE id = $2
RETURNING id, name, email, role, reports_to_id, employment_status;
```

### Update employment status (HR)

```sql
-- updateEmploymentStatus($1=status, $2=userId)
UPDATE users SET employment_status = $1 WHERE id = $2
RETURNING id, name, email, role, reports_to_id, employment_status;
```

---

## 3. Lead service (backend/services/leadService.js)

### Insert lead (sync)

```sql
-- insertLead: $1=source_id, $2=name, $3=phone, $4=email, $5=college, $6=certification
INSERT INTO leads (source_id, name, phone, email, college, certification, status, retry_count, assigned_boe_id, is_active, pipeline, next_followup_at)
VALUES ($1, $2, $3, $4, $5, $6, 'NEW', 0, NULL, true, 'LEADS', NULL)
ON CONFLICT (phone, source_id) DO NOTHING
RETURNING id;
```

### Get single lead

```sql
-- getLeadById($1)
SELECT * FROM leads WHERE id = $1;
```

### Update lead status (dynamic SET)

```sql
-- updateLeadStatus: dynamic fields (status, retry_count, next_followup_at, is_active, pipeline)
UPDATE leads SET status = $1, retry_count = $2, ... WHERE id = $N RETURNING *;
```

### Assign BOE

```sql
-- assignBoe($1=boeId, $2=leadId)
UPDATE leads SET assigned_boe_id = $1 WHERE id = $2 RETURNING *;
```

### Status history

```sql
-- insertStatusHistory($1=lead_id, $2=updated_by, $3=old_status, $4=new_status)
INSERT INTO lead_status_history (lead_id, updated_by, old_status, new_status) VALUES ($1, $2, $3, $4);
```

### List leads (by role)

**Admin – all or filter by team_lead_id or source_id:**

```sql
-- Base
SELECT l.*, u.name AS assigned_boe_name FROM leads l
LEFT JOIN users u ON l.assigned_boe_id = u.id
ORDER BY l.created_at DESC;

-- With team filter (teamLeadId):
WHERE l.source_id IN (SELECT id FROM lead_sources WHERE team_lead_id = $1)

-- With source filter (sourceId):
WHERE l.source_id = $1
```

**Team lead – only their sources:**

```sql
SELECT l.*, u.name AS assigned_boe_name FROM leads l
LEFT JOIN users u ON l.assigned_boe_id = u.id
WHERE l.source_id = ANY($1::int[])   -- $1 = allowedSourceIds
  AND l.is_active = true             -- unless includeInactive
ORDER BY l.created_at DESC;

-- Single source:
WHERE l.source_id = $1 AND l.is_active = true ...
```

**BOE – only assigned, active, LEADS, follow-up due or null:**

```sql
SELECT l.*, u.name AS assigned_boe_name FROM leads l
LEFT JOIN users u ON l.assigned_boe_id = u.id
WHERE l.assigned_boe_id = $1
  AND l.is_active = true
  AND l.pipeline = 'LEADS'
  AND (l.next_followup_at IS NULL OR l.next_followup_at <= NOW())
ORDER BY l.created_at DESC;
-- Params: [userId]
```

---

## 4. Lead source service (backend/services/leadSourceService.js)

### List by team lead (connected only)

```sql
-- listByTeamLead($1)
SELECT id, name, team_lead_id, google_sheet_id, sheet_range, created_at
FROM lead_sources
WHERE team_lead_id = $1
  AND google_sheet_id IS NOT NULL AND TRIM(google_sheet_id) != ''
ORDER BY name;
```

### List all (with team lead name)

```sql
-- listAll()
SELECT s.id, s.name, s.team_lead_id, s.google_sheet_id, s.sheet_range, s.created_at, u.name AS team_lead_name
FROM lead_sources s
JOIN users u ON u.id = s.team_lead_id
ORDER BY s.name;
```

### Get by ID

```sql
-- getById($1)
SELECT * FROM lead_sources WHERE id = $1;
```

### Create source

```sql
-- create: $1=name, $2=team_lead_id, $3=google_sheet_id, $4=sheet_range
INSERT INTO lead_sources (name, team_lead_id, google_sheet_id, sheet_range) VALUES ($1, $2, $3, $4) RETURNING *;
```

---

## 5. Migrations (backend/scripts/)

### migrateRoles.js

```sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE users SET role = 'admin' WHERE role = 'architect' RETURNING id;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('team_lead', 'boe', 'hr', 'admin'));
```

### migrateReportsTo.js

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reports_to_id INT REFERENCES users(id);
```

### migrateLeadSources.js

```sql
CREATE TABLE IF NOT EXISTS lead_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  team_lead_id INT NOT NULL REFERENCES users(id),
  google_sheet_id VARCHAR(255) NOT NULL,
  sheet_range VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_team_lead ON lead_sources(team_lead_id);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_id INT REFERENCES lead_sources(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source_id);

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_phone_key;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_phone_source_id_key;
ALTER TABLE leads ADD CONSTRAINT leads_phone_source_id_key UNIQUE (phone, source_id);
```

### seedUsers.js

Uses `userService.createUser()` (see **User service – Create user** above). No raw SQL in the script; it calls the service which runs the INSERT.

---

## 6. Table summary

| Table                | Purpose |
|----------------------|---------|
| `users`              | Login, roles (team_lead, boe, hr, admin), reports_to_id, employment_status |
| `lead_sources`       | Sheets per team lead (name, google_sheet_id, sheet_range) |
| `leads`              | Leads; source_id, assigned_boe_id, status, pipeline, next_followup_at |
| `lead_status_history` | Audit log of status changes (lead_id, updated_by, old_status, new_status) |

---

## 7. Indexes

- `users`: (none beyond PK and unique email)
- `lead_sources`: `idx_lead_sources_team_lead` on `team_lead_id`
- `leads`: `idx_leads_source`, `idx_leads_assigned_boe`, `idx_leads_status`, `idx_leads_is_active`, `idx_leads_pipeline`, `idx_leads_next_followup`; unique on `(phone, source_id)`
- `lead_status_history`: `idx_lead_status_history_lead` on `lead_id`
