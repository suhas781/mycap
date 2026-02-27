# Internal Lead Management CRM

PostgreSQL-backed CRM for managing leads from Google Sheets: sync by sheet, assign to BOEs (Team Lead), status updates and follow-ups (BOE). JWT auth, role-based visibility, workflow engine in backend only. Multiple lead sources (sheets) per team lead; HR manages users and sheetâ€“team lead links.

---


## Stack

| Layer    | Tech |
|----------|------|
| Backend  | Node.js, Express, PostgreSQL, JWT, Google Sheets API (optional) |
| Frontend | React, Vite, Tailwind CSS |
| Analytics| Metabase (read-only DB connection; optional) |

---

## Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** (create database `mycap`)
- For **Sync from sheet**: Google Cloud project, Sheets API enabled, service account JSON key (see [Google Sheets sync](#google-sheets-sync-optional))

---

## Quick run

1. **Database:** Create and init.
   ```bash
   createdb mycap
   psql -d mycap -f database/init.sql
   ```

2. **Backend** (terminal 1):
   ```bash
   cd backend
   npm install
   cp .env.example .env   # then edit .env (see [Environment variables](#environment-variables))
   node scripts/seedUsers.js   # creates example users
   npm run dev
   ```
   Backend runs at **http://localhost:3001**.

3. **Frontend** (terminal 2):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs at **http://localhost:5173**. API calls are proxied from `/api` to the backend.

4. **Login:** Open http://localhost:5173 and sign in, e.g.:
   - Team Lead: `lead@example.com` / `password`
   - BOE: `boe@example.com` / `password`
   - HR: create via seed or set role in HR dashboard
   - Admin: set role to admin for a user

---

## Setup (detailed)

### 1. Database

```bash
createdb mycap
psql -d mycap -f database/init.sql
```

If you use existing migrations (e.g. `reports_to_id`, `lead_sources`), run them as needed:

- `node backend/scripts/migrateReportsTo.js` â€” adds BOE â†’ team lead reporting
- `node backend/scripts/migrateLeadSources.js` â€” adds lead_sources and leads.source_id
- `node backend/scripts/seedUsers.js` â€” seeds example users (team lead, BOEs, etc.)

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (copy from `.env.example` if present) with at least:

- `PORT` (default 3001)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (long random string)
- Optional: `GOOGLE_CREDENTIALS_PATH` or `GOOGLE_CREDENTIALS_JSON` for sync (see [Google Sheets sync](#google-sheets-sync-optional))

Then:

```bash
node scripts/seedUsers.js
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Uses Vite proxy: requests to `/api/*` go to `http://localhost:3001/*`. Set `VITE_API_URL` only if the backend is elsewhere.

### 4. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Backend port (default 3001) |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | Yes | PostgreSQL port |
| `DB_NAME` | Yes | Database name (e.g. mycap) |
| `DB_USER` | Yes | DB user |
| `DB_PASSWORD` | Yes | DB password |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `GOOGLE_CREDENTIALS_PATH` | No* | Path to service account JSON file (e.g. `./service-account.json`) |
| `GOOGLE_CREDENTIALS_JSON` | No* | Full service account JSON string (alternative to path) |

\* One of the Google credentials vars is required only if you use **Sync from sheet**. Sheet IDs are stored per lead source in the DB; there is no global `GOOGLE_SHEET_ID` in .env.

---

## Roles and permissions

| Role       | Dashboard        | Leads visibility                    | Sync | Assign BOE | Update status   | Users / Sheets management |
|------------|------------------|-------------------------------------|------|------------|-----------------|----------------------------|
| **Team Lead** | Team Lead        | Only their lead sources (one sheet at a time) | Yes (own sources) | Yes        | Any lead in view | No (only sees own BOEs list) |
| **BOE**    | BOE              | Only assigned, active, LEADS, follow-up due or none | No   | No         | Only assigned   | No |
| **HR**     | HR               | â€”                                   | No   | No         | No              | Yes: roles, reports-to, employment status; **Sheets** tab: add sheet, view sheet â†’ team lead |
| **Admin**  | Admin            | All leads (or filter by source)     | No   | No         | No              | Analytics; full lead list |

- **Team Lead:** Sees only lead sources (sheets) linked to them (with non-empty Google Sheet ID). Views one sheet at a time; no â€œcombinedâ€ view. Can sync from that sheet and assign leads to BOEs who report to them.
- **BOE:** Sees only leads where `assigned_boe_id` = self, `is_active = true`, `pipeline = 'LEADS'`, and `next_followup_at IS NULL OR next_followup_at <= NOW()`. Can update status only for those leads; workflow rules (e.g. retry limits, NEWâ†’DNR4) apply.
- **HR:** Two tabs â€” **Users & roles** (roles, reports-to, employment status) and **Sheets** (add sheet, see which sheet is linked to which team lead).
- **Admin:** Full lead list and analytics; no sync/assign in app (sync is Team Lead only).

---

## Features by role

### Team Lead

- **View sheet:** Dropdown of connected sheets (each has a Google Sheet ID). One sheet at a time; no combined view.
- **Sync from sheet:** Syncs leads from the selected sheet (requires Google credentials in backend .env). New rows inserted; duplicates skipped by (phone, source_id).
- **Leads table:** Checkboxes, bulk assign to BOE; per-row â€œAssignâ€ for single lead. Include inactive leads (checkbox).
- **BOEs:** Dropdown of users who report to this team lead (from HR â€œReports toâ€).

### BOE

- **Categories sidebar:** New, Old, DNR1â€“4, Callback, Follow-Up Due, Completed (from lead status).
- **Leads table:** #, Name, Phone, College, Status, Next Followup. Click row to open lead details.
- **Lead details drawer:** View details; change status (dropdown); Save. Only assigned leads; backend enforces workflow.

### HR

- **Users & roles tab:** Table of users â€” Name, Email, Role, Change role, Reports to (Team Lead), Employment status. Assign BOEs to a team lead; set role (Team Leader, BOE, HR, Admin).
- **Sheets tab:** Add new sheet (name, team leader, Google Sheet ID, optional range). Table of all sheets with: Sheet name, Team lead, Google Sheet ID, Range.

### Admin

- **Analytics:** BOE performance, pipeline %, conversion funnel, follow-up due, retry distribution, termination analysis, suggestions. Reads lead data via API.

---

## API summary

| Method | Path | Who | Description |
|--------|------|-----|-------------|
| POST | /auth/login | â€” | Login; body `{ email, password }`; returns token + user |
| GET | /leads | Team Lead, BOE, Admin | List leads (visibility by role) |
| GET | /leads?source_id=N | Team Lead, Admin | Filter by lead source |
| GET | /leads?inactive=1 | Team Lead | Include inactive leads |
| GET | /leads/statuses | All auth | All statuses for dropdown |
| GET | /leads/:id | Team Lead, BOE, Admin | One lead (BOE: only if assigned) |
| PUT | /leads/:id/assign | Team Lead | Set assigned_boe_id; body `{ boe_id }` |
| PUT | /leads/:id/status | Team Lead, BOE | Update status; body `{ status }`; workflow rules apply |
| POST | /sync-leads | Team Lead | Sync from Google Sheet; body `{ source_id }` |
| GET | /lead-sources | Team Lead, Admin, HR | List sources (Team Lead: own connected only; Admin/HR: all) |
| POST | /lead-sources | HR, Admin | Create source; body `{ name, team_lead_id, google_sheet_id, sheet_range? }` |
| GET | /users | HR, Admin | List all users |
| GET | /users/boes | Team Lead | List BOEs (that report to this team lead) |
| PUT | /users/:id/role | HR | Set role |
| PUT | /users/:id/reports-to | HR | Set reports_to_id (team lead for BOE) |
| PUT | /users/:id/employment-status | HR | Set employment_status |

---

## Database (main tables)

- **users** â€” id, name, email, password, role (team_lead, boe, hr, admin), reports_to_id, employment_status, created_at
- **lead_sources** â€” id, name, team_lead_id, google_sheet_id, sheet_range, created_at
- **leads** â€” id, source_id, name, phone, email, college, certification, status, retry_count, next_followup_at, assigned_boe_id, is_active, pipeline, created_at; UNIQUE(phone, source_id)
- **lead_status_history** â€” id, lead_id, updated_by, old_status, new_status, updated_at

---

## Google Sheets sync (optional)

Required only if team leads use **Sync from sheet**.

1. Create a Google Cloud project, enable **Google Sheets API**, create a **service account**, download its JSON key.
2. Share each Google Sheet with the service account **client_email** (Viewer).
3. In `backend/.env`, set either:
   - `GOOGLE_CREDENTIALS_PATH=./service-account.json`, or  
   - `GOOGLE_CREDENTIALS_JSON='...'` (full JSON in one line).
4. In the app, **HR â†’ Sheets tab**: add a sheet (name, team leader, **Google Sheet ID** from the sheet URL).
5. Team lead: select that sheet in **View sheet**, then **Sync from sheet**.

Full step-by-step: **[backend/SYNC_SETUP.md](backend/SYNC_SETUP.md)**.

If credentials are not set, sync is disabled and the UI shows a message; rest of the app works without sync.

---

## Project layout

```
mycap/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ config/          # DB, sheets config
â”‚   â”œâ”€â”€ controllers/     # leadController, syncController, userController
â”‚   â”œâ”€â”€ middleware/     # auth, teamLeadOnly, hrOnly
â”‚   â”œâ”€â”€ routes/         # auth, leads, leadSources, sync, users
â”‚   â”œâ”€â”€ services/       # leadService, leadSourceService, userService, workflowService, sheetsService
â”‚   â”œâ”€â”€ scripts/        # seedUsers, migrateLeadSources, etc.
â”‚   â”œâ”€â”€ .env            # PORT, DB_*, JWT_SECRET, optional Google credentials
â”‚   â”œâ”€â”€ SYNC_SETUP.md   # Google Sheets setup guide
â”‚   â””â”€â”€ index.js
â”œâ”€â”€ frontend/
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ api.js      # API_BASE, getStoredUser, setToken, api()
â”‚       â”œâ”€â”€ App.jsx     # Routes, PrivateRoute by role
â”‚       â”œâ”€â”€ pages/      # Login, TeamLeadDashboard, BOEDashboard, HRDashboard, AdminDashboard
â”‚       â””â”€â”€ components/ # boe/, teamlead/, analytics/, SyncLeadsButton, etc.
â”œâ”€â”€ database/
â”‚   â”œâ”€â”€ init.sql        # Schema (users, lead_sources, leads, lead_status_history)
â”‚   â””â”€â”€ seed.sql        # Optional seed reference
â””â”€â”€ README.md
```

---

## Security notes

- Do not commit `.env` or `service-account.json`; add them to `.gitignore`.
- JWT is used for API auth; store token (e.g. in memory/localStorage) and send in `Authorization` header.
- Sync and lead-source management are restricted by role (Team Lead / HR / Admin as above).

---

## Metabase (optional)

Create a read-only PostgreSQL user and connect Metabase to the `mycap` database. Use tables `leads`, `lead_status_history`, `users`, `lead_sources` for dashboards (e.g. by status, BOE performance, conversion, follow-up due).
