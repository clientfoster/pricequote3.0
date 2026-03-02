@echo off
REM QuoteMaster Pro - Batch Launcher
REM This batch file launches the PowerShell script

echo.
echo ========================================================
echo   QuoteMaster Pro - Starting Application...
echo ========================================================
echo.

REM Get the directory where this batch file is located
cd /d "%~dp0"

REM Check if PowerShell is available
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not available on this system!
    echo Please ensure PowerShell is installed.
    pause
    exit /b 1
)

REM Run the PowerShell script with execution policy bypass
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-app.ps1"

REM If PowerShell script exits, pause to show any error messages
if %errorlevel% neq 0 (
    echo.
    echo An error occurred while running the application.
    pause
)
