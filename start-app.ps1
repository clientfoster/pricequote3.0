# QuoteMaster Pro - Auto Launcher
# Installs dependencies and starts both servers

$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "           QUOTEMASTER PRO - AUTO LAUNCHER" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "Checking prerequisites..." -ForegroundColor Cyan
try {
    $nodeVer = node --version
    $npmVer = npm --version
    Write-Host "Node.js: $nodeVer" -ForegroundColor Green
    Write-Host "npm: $npmVer" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Node.js or npm not found!" -ForegroundColor Red
    Write-Host "Install from: https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""

# Backend
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "BACKEND SETUP" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $scriptPath "backend"
if (Test-Path $backendPath) {
    Set-Location $backendPath
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
        npm install
    }
    else {
        Write-Host "Backend dependencies OK" -ForegroundColor Green
    }
}
else {
    Write-Host "ERROR: Backend folder not found!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""

# Frontend
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "FRONTEND SETUP" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $scriptPath
$frontendPath = Join-Path $scriptPath "frontend"
if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
    }
    else {
        Write-Host "Frontend dependencies OK" -ForegroundColor Green
    }
}
else {
    Write-Host "ERROR: Frontend folder not found!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""

# Start servers
Write-Host "================================================================" -ForegroundColor Green
Write-Host "STARTING SERVERS" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend will open in a new window" -ForegroundColor Cyan
Write-Host "Backend logs will appear below" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop servers" -ForegroundColor Yellow
Write-Host ""

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

# Wait a moment
Start-Sleep -Seconds 2

# Start backend in current window
Set-Location $backendPath
npm run dev
