# Run all database migrations using DATABASE_URL from backend/.env
# Usage: .\scripts\run-migrations.ps1   (from project root)

$envFile = Join-Path $PSScriptRoot "..\backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Error "backend/.env not found. Add DATABASE_URL there."
    exit 1
}
$line = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL=(.+)$' } | Select-Object -First 1
if (-not $line) {
    Write-Error "DATABASE_URL not found in backend/.env"
    exit 1
}
$env:DATABASE_URL = $line -replace '^\s*DATABASE_URL=', '' -replace '^["'']|["'']\s*$', '' -replace '\s*#.*$', '' -replace '\s+$', ''

$root = Join-Path $PSScriptRoot ".."
$migrations = @(
    "database/init.sql",
    "database/lead_conversion_details.sql",
    "database/courses.sql",
    "database/leads_metadata.sql",
    "database/campaigns.sql",
    "database/boe_campaigns_flow.sql",
    "database/college_list_place.sql",
    "database/migration_hr_architect.sql"
)

Write-Host "Running migrations (DATABASE_URL from backend/.env)..." -ForegroundColor Cyan
foreach ($f in $migrations) {
    $path = Join-Path $root $f
    Write-Host "  $f" -ForegroundColor Gray
    & psql "$env:DATABASE_URL" -f $path
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed: $f"
        exit 1
    }
}
Write-Host "Done." -ForegroundColor Green
