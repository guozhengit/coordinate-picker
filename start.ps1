Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Starting Coordinate Picker..." -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check and kill existing process on port 3001
Write-Host "Checking for running servers on port 3001..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    Write-Host "Found process using port 3001, stopping it..." -ForegroundColor Yellow
    $processes | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Green
Write-Host ""

node server.js
