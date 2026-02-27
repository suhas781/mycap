# Project structure

Keep the repo layout in this format:

```
mycap/
   backend/
      package.json
      index.js
      config/
      controllers/
      middleware/
      routes/
      services/
      utils/
      scripts/
   frontend/
      package.json
      vite.config.js
      index.html
      src/
         App.jsx
         main.jsx
         api.js
         index.css
         components/
         context/
         pages/
   database/
      *.sql
   scripts/
      run-migrations.ps1
```

- **backend/** — Node API (Express). Entry: `index.js`. Run: `cd backend && npm run dev`
- **frontend/** — Vite + React. Entry: `index.html` / `src/main.jsx`. Run: `cd frontend && npm run dev`
- **database/** — SQL migrations. Run via `.\scripts\run-migrations.ps1` or `psql $env:DATABASE_URL -f database/<file>.sql`
- **scripts/** — One-off scripts (e.g. migrations runner). Root-level docs (README, RUN.md, DEPLOYMENT-OPTION-B.md, etc.) stay at repo root.
