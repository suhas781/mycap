# Deploy: Supabase (DB) + Render (Backend) + Vercel (Frontend)

Step-by-step guide to deploy MyCaptain CRM using **Supabase**, **Render**, and **Vercel** (free tiers where available).

---

## What you’ll get

| Part      | Service   | Notes |
|-----------|-----------|--------|
| Database  | **Supabase** | Managed Postgres, connection pooler, free tier |
| Backend   | **Render**   | Web Service (free tier may sleep after ~15 min idle) |
| Frontend  | **Vercel**   | Static hosting, global CDN |

You need: a GitHub (or GitLab) repo with your `mycap` code, and accounts on **Supabase**, **Render**, and **Vercel**.

---

## Step 1: Database in Supabase

1. Go to **[supabase.com](https://supabase.com)** and sign up (GitHub is fine).
2. **New project** → choose or create an organization.
3. **Name:** e.g. `mycap`. **Database password:** set a strong password and **save it**. **Region:** choose closest to you and to Render. Click **Create new project**.
4. Wait for the project to be ready. Left sidebar → **Project Settings** (gear) → **Database**.
5. Under **Connection string** select **URI**. Copy the URI. It looks like:
   ```text
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the database password you set. Add `?sslmode=require` at the end if it’s not there.  
   Example:
   ```text
   postgresql://postgres.xxxxx:YourPassword@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
7. **Save this connection string** — you’ll use it for Render and for running migrations.

---

## Step 2: Backend on Render

1. Go to **[render.com](https://render.com)** and sign up / log in (GitHub is fine).
2. Dashboard → **New +** → **Web Service**.
3. **Connect a repository:** authorize Render for GitHub (or GitLab) and select the repo that contains your MyCaptain code (e.g. `mycap`).
4. **Configure the Web Service:**
   - **Name:** e.g. `mycap-backend`.
   - **Region:** choose closest to your Supabase region and users.
   - **Branch:** `main` (or your default branch).
   - **Root directory:** `backend`.
   - **Runtime:** `Node`.
   - **Build command:** `npm install`
   - **Start command:** `node index.js` (or `npm start` if that’s what your `backend/package.json` uses).
5. **Instance type:** Free.
6. **Environment variables** — add:

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | Full Supabase connection string from Step 1 (with password and `?sslmode=require`). |
   | `JWT_SECRET` | Long random string (e.g. 32+ chars). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |

   **Google Sheets sync (optional):**  
   On Render you can’t rely on a file path. Use the JSON option:
   - **Key:** `GOOGLE_CREDENTIALS_JSON`  
   - **Value:** Paste the **entire** contents of your service account JSON file (one line; escape internal quotes if needed), or use Render’s “secret file” / env group if you prefer.

   Do **not** set `PORT` — Render sets it automatically.

7. **Create Web Service**. Wait until the deploy is **Live**.
8. Copy the service URL (e.g. `https://mycap-backend.onrender.com`). Use it as the backend API URL for the frontend and for health checks: `https://mycap-backend.onrender.com/health` → `{"ok":true}`.

---

## Step 3: Frontend on Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign up / log in (GitHub is fine).
2. **Add New…** → **Project** → **Import** the same Git repository.
3. **Configure the project:**
   - **Project name:** e.g. `mycap` or `mycap-frontend`.
   - **Root directory:** set to `frontend`.
   - **Framework preset:** Vite (auto-detected).
   - **Build command:** default (`npm run build` or `vite build`).
   - **Output directory:** `dist`.
   - **Install command:** default `npm install`.
4. **Environment variables:**
   - **Name:** `VITE_API_URL`  
   - **Value:** Your Render backend URL from Step 2, **no trailing slash**, e.g. `https://mycap-backend.onrender.com`  
   Add for **Production** (and Preview/Development if you want).
5. **Deploy**. When it’s done, open the URL (e.g. `https://mycap-xxx.vercel.app`) — you should see the login page; the app will call the Render backend via `VITE_API_URL`.

---

## Step 4: Run database migrations (Supabase)

Your app needs tables. Run the SQL migrations **from your machine** against the **same** Supabase connection string you gave Render.

### 4.1 Install PostgreSQL client (if needed)

- **Windows:** [PostgreSQL](https://www.postgresql.org/download/windows/) or `psql` in WSL.
- **Mac:** `brew install libpq` then `brew link --force libpq`, or use Postgres.app.

Ensure `psql` is on your PATH.

### 4.2 Run migrations in order

Set `DATABASE_URL` to your Supabase (or Neon) connection string—the same value you use in Render. Then run each migration with `psql` using `DATABASE_URL`.

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL = "postgresql://postgres.xxxxx:YourPassword@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require"
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
export DATABASE_URL='postgresql://postgres.xxxxx:YourPassword@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require'
psql "$DATABASE_URL" -f database/init.sql
psql "$DATABASE_URL" -f database/lead_conversion_details.sql
psql "$DATABASE_URL" -f database/courses.sql
psql "$DATABASE_URL" -f database/leads_metadata.sql
psql "$DATABASE_URL" -f database/campaigns.sql
psql "$DATABASE_URL" -f database/boe_campaigns_flow.sql
psql "$DATABASE_URL" -f database/college_list_place.sql
psql "$DATABASE_URL" -f database/migration_hr_architect.sql
```

You can copy `DATABASE_URL` from your `backend/.env` (same value you give to Render). Run any other SQL files your app expects in an order that respects dependencies.

**First HR account:** The app does not seed an HR user. After migrations, open your Vercel frontend URL and you’ll see **“First time? Create first HR account”** on the login page. Go to **/setup** and create the first user with your **@mycaptain.in** email and a password. That user is created as HR and can then sign in and add others.

---

## Step 5: Verify and use the app

1. **Backend:** Open `https://<your-render-service>.onrender.com/health` → `{"ok":true}`.
2. **Frontend:** Open your Vercel URL → MyCaptain login page.
3. **Login:** Use a user from your seed (e.g. `seed.sql` or `backend/scripts/seedUsers.js` run against Supabase). If you haven’t seeded, create a user in Supabase (SQL Editor: insert into `users` with hashed password and role).
4. **CORS (optional):** To restrict API access to your frontend only, in `backend/index.js` set `cors({ origin: ['https://your-app.vercel.app'], credentials: true })` and redeploy the backend.

---

## Summary: URLs and env vars

| Where | What to set / use |
|-------|--------------------|
| **Supabase** | Create project → **Database** → Connection string **URI** (replace password, add `?sslmode=require`). |
| **Render (backend)** | Root: `backend`. Build: `npm install`. Start: `node index.js`. Env: `DATABASE_URL` = Supabase URI, `JWT_SECRET` = long random string; optional: `GOOGLE_CREDENTIALS_JSON` for sheet sync. |
| **Vercel (frontend)** | Root: `frontend`. Env: `VITE_API_URL` = Render backend URL (no trailing slash). |
| **Your PC (migrations)** | Set `DATABASE_URL` to your Supabase/Neon URI, then run `psql $env:DATABASE_URL -f database/<file>.sql` (PowerShell) or `psql "$DATABASE_URL" -f database/<file>.sql` (Mac/Linux) for each migration. |

---

## Troubleshooting

- **Backend “Application failed to respond” / 503:** Free tier can sleep; first request may take 1–2 minutes. Check Render **Logs** for crashes; ensure `DATABASE_URL` and `JWT_SECRET` are set and migrations have been run.
- **Frontend “Failed to fetch”:** Set `VITE_API_URL` to the exact Render URL (no trailing slash). Redeploy the frontend after changing env vars so the build picks them up.
- **Database connection errors:** Supabase URI must include `?sslmode=require`. Test from your PC: `psql "YOUR_URI" -c "SELECT 1"`.
- **Tables missing / 500 on API:** Run all migration files (Step 4) against the same database used in `DATABASE_URL`.

---

## Optional: CORS for production

In `backend/index.js`, replace:

```js
app.use(cors({ origin: true, credentials: true }));
```

with (use your real Vercel URL):

```js
app.use(cors({
  origin: ['https://mycap-xxx.vercel.app'],
  credentials: true,
}));
```

Redeploy the backend on Render after the change.
