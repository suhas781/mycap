# Setup on a New System — All Commands

Use this guide to install and run the MyCaptain Lead Management CRM from scratch on a new machine.

---

## Prerequisites (install these first)

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **PostgreSQL** — [postgresql.org](https://www.postgresql.org/download/)
- **Git** (optional) — to clone the repo

---

## 1. Get the project

If you have the code already, skip to step 2. Otherwise:

```bash
# Clone (replace with your repo URL if different)
git clone <your-repo-url> mycap
cd mycap
```

---

## 2. Database setup

### 2.1 Create the database and user (if needed)

**Windows (PowerShell or Command Prompt):**

```bash
# Open psql or use pgAdmin. Or from command line if psql is in PATH:
psql -U postgres -c "CREATE DATABASE mycap;"
```

**macOS / Linux:**

```bash
# Create database (uses default postgres user)
createdb mycap

# Or with explicit user:
createdb -U postgres mycap
```

If you use a different DB user, create it first and grant privileges:

```sql
-- In psql as superuser:
CREATE USER mycap_user WITH PASSWORD 'your_password';
CREATE DATABASE mycap OWNER mycap_user;
GRANT ALL PRIVILEGES ON DATABASE mycap TO mycap_user;
```

### 2.2 Run the schema (init.sql)

From the **project root** `mycap/`:

```bash
psql -U postgres -d mycap -f database/init.sql
```

Or with a specific host/port:

```bash
psql -h localhost -p 5432 -U postgres -d mycap -f database/init.sql
```

**Windows:** If `psql` is not in PATH, use the full path, e.g.:

```bash
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d mycap -f database/init.sql
```

---

## 3. Backend setup

### 3.1 Install dependencies

```bash
cd backend
npm install
```

### 3.2 Create environment file

Create a file named `.env` in the `backend/` folder with at least:

```env
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=mycap
DB_USER=postgres
DB_PASSWORD=your_db_password_here

JWT_SECRET=your_long_random_secret_here_at_least_32_chars
```

- Replace `your_db_password_here` with your PostgreSQL password for `DB_USER`.
- Replace `JWT_SECRET` with a long random string (e.g. 64 chars). You can generate one with:
  - **Node:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - **OpenSSL:** `openssl rand -hex 32`

**Optional — Google Sheets sync (only if Team Leads will use “Sync from sheet”):**

```env
# Option A: path to service account JSON file
GOOGLE_CREDENTIALS_PATH=./service-account.json

# Option B: or paste full JSON as one line
# GOOGLE_CREDENTIALS_JSON={"type":"service_account", ...}
```

See `backend/SYNC_SETUP.md` for how to get the service account key.

### 3.3 Seed example users

From the `backend/` directory:

```bash
node scripts/seedUsers.js
```

This creates example users you can log in with (e.g. Team Lead, BOE). Default password is usually `password` — check the script or README for exact emails.

### 3.4 Start the backend

```bash
npm run dev
```

Backend will run at **http://localhost:3001**.

---

## 4. Frontend setup

Open a **new terminal**. From the **project root** `mycap/`:

### 4.1 Install dependencies

```bash
cd frontend
npm install
```

### 4.2 Start the frontend

```bash
npm run dev
```

Frontend will run at **http://localhost:5173**. API requests to `/api` are proxied to the backend.

---

## 5. Open the app

1. In the browser go to: **http://localhost:5173**
2. Log in with one of the seeded users, for example:
   - **Team Lead:** `lead@example.com` / `password`
   - **BOE:** `boe@example.com` / `password`  
   (Check `backend/scripts/seedUsers.js` for the exact list.)

---

## Quick copy-paste summary (from project root)

Assumes PostgreSQL is installed, database user is `postgres`, and you’re in `mycap/`:

```bash
# 1. Database
createdb mycap
psql -d mycap -f database/init.sql

# 2. Backend
cd backend
npm install
# Create .env (see step 3.2 above), then:
node scripts/seedUsers.js
npm run dev
```

In a **second terminal**:

```bash
cd mycap/frontend
npm install
npm run dev
```

Then open **http://localhost:5173**.

---

## Optional: migrations (only if DB was created from an older schema)

If you have an existing DB that was created **before** `init.sql` had `lead_sources` and `reports_to_id`, run from **project root**:

```bash
node backend/scripts/migrateReportsTo.js
node backend/scripts/migrateLeadSources.js
node backend/scripts/migrateRoles.js
```

On a **brand-new** database created from the current `database/init.sql`, you do **not** need these.

---

## Optional: production build (frontend)

To build the frontend for production (e.g. to serve with nginx or a static host):

```bash
cd frontend
npm run build
```

Output is in `frontend/dist/`. Point your server at that folder and configure the API URL if the backend is on a different host (see `frontend/src/api.js` and `VITE_API_URL`).

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| `createdb: command not found` | Use full path to `psql` and run `CREATE DATABASE mycap;` in psql, then run `psql -d mycap -f database/init.sql`. |
| `connection refused` (DB) | Start PostgreSQL; check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in `backend/.env`. |
| `ECONNREFUSED` from frontend | Ensure backend is running on port 3001 (`npm run dev` in `backend/`). |
| Login fails / 401 | Run `node backend/scripts/seedUsers.js` again; confirm `JWT_SECRET` is set in `backend/.env`. |
