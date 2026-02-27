# Deploy: Vercel (Frontend) + Render (Backend) + Neon (Database)

Free-tier deployment: **Frontend on Vercel → Backend on Render → Database on Neon.**

---

## Final architecture

```
Frontend (Vercel)
     │
     ▼
Backend API (Render Free Tier)
     │
     ▼
Database (Neon Postgres)
```

Everything is free. Production-friendly. Clean.

---

## Prerequisites

- GitHub repo with `mycap` code
- **Neon** database created; connection string in `backend/.env` as `DATABASE_URL`
- **Render** backend deployed; note the backend URL (e.g. `https://mycap-backend.onrender.com`)

---

## Step 1: Deploy Vite frontend on Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in (e.g. with GitHub).
2. **New Project** → **Import** your GitHub repo.
3. **Settings:**
   - **Root Directory:** `frontend` (so Vercel builds and deploys only the frontend app)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. SPA routing is handled by **`frontend/vercel.json`** (rewrites all routes to `/index.html` so `/login`, `/team-lead`, etc. don’t 404 on refresh or direct open).
5. Do **not** deploy yet — add the env var first (Step 2).

---

## Step 2: Add environment variable

In the Vercel project **Settings** → **Environment Variables**:

| Name            | Value                                      |
|-----------------|--------------------------------------------|
| `VITE_API_URL`  | Your Render backend URL **without** a trailing `/` |

**Example:**

```text
https://mycap-backend.onrender.com
```

Add it for **Production** (and optionally Preview/Development). Save.

---

## Step 3: Deploy

Click **Deploy** (or trigger a new deployment). Wait for the build to finish.

---

## Step 4: Test the frontend

1. Open your Vercel URL (e.g. `https://mycap-frontend.vercel.app`).
2. **Login page** should load.
3. **API calls** should hit the Render backend (login, health, etc.).

If the backend is on Render’s free tier and has been idle, the first request may take 1–2 minutes while the service wakes up.

---

## Summary

| Layer    | Service  | What to set |
|----------|----------|-------------|
| Frontend | Vercel   | Root: `frontend`. Env: `VITE_API_URL` = Render URL (no `/`). |
| Backend  | Render   | Root: `backend`. Env: `DATABASE_URL` (Neon), `JWT_SECRET`. |
| Database | Neon     | Connection string in `DATABASE_URL`; run migrations (e.g. `.\scripts\run-migrations.ps1`). |

For full backend and database setup, see **DEPLOYMENT-OPTION-B.md** (steps are the same; you can use Neon instead of Supabase for the database).
