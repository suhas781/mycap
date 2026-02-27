# Get the app running

Do these in order.

## 1. Database (one time)

**Option A – local Postgres**

Make sure PostgreSQL is running. Then:

```bash
createdb mycap
psql -d mycap -f database/init.sql
psql -d mycap -f database/leads_metadata.sql
```

**Option B – remote DB (Neon, Supabase, etc.)**

Put your connection string in `backend/.env` as `DATABASE_URL`. Then run migrations:

**Windows (PowerShell) – easiest:** run the script (it reads `DATABASE_URL` from `backend/.env`):
```powershell
.\scripts\run-migrations.ps1
```

**Windows (PowerShell) – manual:** you must use **`$env:DATABASE_URL`** (the variable), not the literal text `"DATABASE_URL"`:
```powershell
# Load DATABASE_URL from backend/.env
$env:DATABASE_URL = (Get-Content backend\.env | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { ($_ -replace '^DATABASE_URL=','').Trim() })
# Then run (note: $env:DATABASE_URL without quotes so it expands)
psql $env:DATABASE_URL -f database/init.sql
psql $env:DATABASE_URL -f database/lead_conversion_details.sql
psql $env:DATABASE_URL -f database/courses.sql
psql $env:DATABASE_URL -f database/leads_metadata.sql
psql $env:DATABASE_URL -f database/campaigns.sql
psql $env:DATABASE_URL -f database/boe_campaigns_flow.sql
psql $env:DATABASE_URL -f database/college_list_place.sql
psql $env:DATABASE_URL -f database/migration_hr_architect.sql
```

**Mac/Linux:**
```bash
export DATABASE_URL="your-connection-string-here"   # or copy from backend/.env
psql "$DATABASE_URL" -f database/init.sql
# ... same files as above
```

The `leads_metadata.sql` file adds the `metadata` JSONB column to `leads` for universal sheet sync.

## 2. Backend

```bash
cd backend
npm install
```

Create users (one time):

```bash
node scripts/seedUsers.js
```

Start the server:

```bash
npm run dev
```

Leave this running. You should see: `Server running on port 3001`.

## 3. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Leave this running. You should see the local URL (e.g. `http://localhost:5173`).

## 4. Use the app

1. Open **http://localhost:5173** in your browser.
2. **First HR account:** If no users exist yet, click **“First time? Create first HR account”** on the login page (or go to `/setup`). Enter your **name** and **@mycaptain.in email** and a password. That creates the first HR; only @mycaptain.in emails can sign in.
3. Log in:
   - **Your HR account:** the @mycaptain.in email and password you set in setup.
   - **Local dev (after seed):** Team Lead `lead@example.com` / `password`, BOE `boe@example.com` / `password` (these use example.com and will not work if you have restricted login to @mycaptain.in).

If the page is blank, open DevTools (F12) → Console and check for errors.  
If login fails, make sure the backend is running on port 3001 and your `backend/.env` has the correct `DB_*` and `JWT_SECRET` values.
