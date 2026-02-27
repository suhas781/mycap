# Import colleges from Excel into college_list

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

## Configure database

Set connection via environment variables (optional; defaults work for local Postgres):

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
