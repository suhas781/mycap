# Get the app running

Do these in order.

## 1. Database (one time)

Make sure PostgreSQL is running. Then:

```bash
createdb mycap
psql -d mycap -f database/init.sql
psql -d mycap -f database/leads_metadata.sql
```
(The second file adds the `metadata` JSONB column to `leads` for universal sheet sync.)

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
2. Log in:
   - **Team Lead:** `lead@example.com` / `password`
   - **BOE:** `boe@example.com` / `password`

If the page is blank, open DevTools (F12) → Console and check for errors.  
If login fails, make sure the backend is running on port 3001 and your `backend/.env` has the correct `DB_*` and `JWT_SECRET` values.
