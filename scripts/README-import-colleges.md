# Import colleges into college_list

Two options: **CSV** (e.g. `colleges.csv`) or **Excel** (`Book1.xlsx`). Both insert into `college_list(place, college_name)` and skip duplicates (same place + college_name).

---

## Option A: Import from CSV (Neon / any Postgres)

Use `colleges.csv` at project root with columns **Place** and **College Name**. Works with **Neon** via `DATABASE_URL`.

### 1. Install dependencies

From project root:

```bash
cd scripts
npm install
```

### 2. Set database connection

**Neon (or any Postgres URL):**

```powershell
$env:DATABASE_URL = "postgresql://user:password@host/dbname?sslmode=require"
```

The script also loads `backend/.env` if present, so you can put `DATABASE_URL` there and run without setting the env each time.

**Or use individual vars (local Postgres):** `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` (see Option B below).

### 3. Run

From project root:

```bash
node scripts/import-colleges-from-csv.js
```

Custom CSV path:

```powershell
$env:CSV_PATH = "C:\path\to\colleges.csv"
node scripts/import-colleges-from-csv.js
```

Output: `Inserted: N, Skipped: M`.

---

## Option B: Import from Excel

Imports rows from `Book1.xlsx` (Place + College Name) into the `college_list` table. Skips duplicates (same place + same college_name). Does not change table structure.

## Prerequisites

- Node.js 18+
- PostgreSQL with database `mycap` and table `college_list(place, college_name)` (and optional `id`).
- Excel file at project root: `Book1.xlsx`, with columns **Place** and **College Name** (first row = header).

## Install dependencies

From project root:

```bash
cd scripts
npm install pg xlsx
```

## Configure database (for Excel script)

Set connection via environment variables (optional; defaults work for local Postgres). For **Neon**, use `DATABASE_URL` in `backend/.env` and run the CSV script instead (Option A).

- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5432)
- `DB_NAME` (default: mycap)
- `DB_USER` (default: postgres)
- `DB_PASSWORD` (default: '')
- `DB_SSL` (default: false; set to 'true' for SSL)

Example (PowerShell):

```powershell
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "yourpassword"
```

## Run the script

From project root:

```bash
cd scripts
node import-colleges-from-excel.js
```

Or with a custom Excel path:

```bash
$env:EXCEL_PATH = "C:\path\to\Book1.xlsx"
node import-colleges-from-excel.js
```

The script reads `Book1.xlsx` from the project root by default (parent of `scripts/`).

## Output

- **Inserted**: number of new rows added.
- **Skipped**: duplicate (same place + college_name) or empty college name.

Duplicate detection uses a per-row check: no unique constraint is added to the table.
