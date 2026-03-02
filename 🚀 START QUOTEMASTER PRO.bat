@echo off
REM ═══════════════════════════════════════════════════════════
REM QuoteMaster Pro - One-Click Launcher
REM ═══════════════════════════════════════════════════════════

title QuoteMaster Pro Launcher

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║           QUOTEMASTER PRO - LAUNCHER                      ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-app.ps1"

if %errorlevel% neq 0 (
    echo.
    echo An error occurred. Press any key to exit...
    pause >nul
)
