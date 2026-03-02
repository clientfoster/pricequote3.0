# ═══════════════════════════════════════════════════════════
# QuoteMaster Pro - Simple EXE Builder
# ═══════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

Clear-Host
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  QuoteMaster Pro - EXE Builder" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check for ps2exe
Write-Host "[1/4] Checking for ps2exe module..." -ForegroundColor Yellow
$module = Get-Module -ListAvailable -Name ps2exe

if (-not $module) {
    Write-Host "      ps2exe not found. Installing..." -ForegroundColor Yellow
    try {
        Install-Module -Name ps2exe -Scope CurrentUser -Force -AllowClobber -ErrorAction Stop
        Write-Host "      ✓ Installed successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "      ✗ Installation failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please run this command manually:" -ForegroundColor Yellow
        Write-Host "Install-Module -Name ps2exe -Scope CurrentUser" -ForegroundColor White
        Write-Host ""
        pause
        exit 1
    }
}
else {
    Write-Host "      ✓ Already installed" -ForegroundColor Green
}

# Import module
Write-Host ""
Write-Host "[2/4] Loading ps2exe module..." -ForegroundColor Yellow
try {
    Import-Module ps2exe -ErrorAction Stop
    Write-Host "      ✓ Module loaded" -ForegroundColor Green
}
catch {
    Write-Host "      ✗ Failed to load module" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

# Check input file
Write-Host ""
Write-Host "[3/4] Checking source file..." -ForegroundColor Yellow
$inputFile = Join-Path $scriptPath "start-app.ps1"
if (-not (Test-Path $inputFile)) {
    Write-Host "      ✗ start-app.ps1 not found!" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}
Write-Host "      ✓ Source file found" -ForegroundColor Green

# Build exe
Write-Host ""
Write-Host "[4/4] Building executable..." -ForegroundColor Yellow
$outputFile = Join-Path $scriptPath "QuoteMaster-Pro-Launcher.exe"

try {
    Invoke-ps2exe -inputFile $inputFile -outputFile $outputFile -noConsole:$false -noOutput:$false -noError:$false -requireAdmin:$false -title "QuoteMaster Pro Launcher" -description "Auto installer and server launcher" -version "1.0.0.0"
    
    if (Test-Path $outputFile) {
        Write-Host "      ✓ Build successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  SUCCESS!" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "Executable created: QuoteMaster-Pro-Launcher.exe" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "You can now double-click the .exe to launch the app!" -ForegroundColor Yellow
        Write-Host ""
    }
    else {
        Write-Host "      ✗ Build failed - file not created" -ForegroundColor Red
    }
}
catch {
    Write-Host "      ✗ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "See LAUNCHER-README.md for alternative methods" -ForegroundColor Yellow
}

Write-Host ""
pause
