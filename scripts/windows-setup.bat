@echo off
REM ═══════════════════════════════════════════════════════════════════════════════
REM WordPress Node CMS - Windows Setup Batch File
REM Works on Windows 11 and Windows Server (2019, 2022)
REM This batch file launches the PowerShell setup script with proper permissions
REM
REM Usage: Double-click this file or run from Command Prompt as Administrator
REM ═══════════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion
color 0B

REM Store the start time
set START_TIME=%TIME%

echo.
echo ===============================================================
echo       WordPress Node CMS - Windows Setup Launcher
echo ===============================================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] This script requires Administrator privileges
    echo.
    echo To run this script:
    echo   1. Right-click on this file
    echo   2. Select "Run as Administrator"
    echo.
    echo Or run from an elevated Command Prompt:
    echo   ^> cd %~dp0
    echo   ^> windows-setup.bat
    echo.
    pause
    exit /b 1
)

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
set APP_DIR=%SCRIPT_DIR%..

REM Verify PowerShell script exists
if not exist "%SCRIPT_DIR%windows-setup.ps1" (
    color 0C
    echo.
    echo [ERROR] PowerShell setup script not found!
    echo.
    echo Expected location: %SCRIPT_DIR%windows-setup.ps1
    echo.
    echo Please ensure you're running this from the scripts directory
    echo inside the WordPress Node CMS repository.
    echo.
    pause
    exit /b 1
)

REM Verify package.json exists (we're in the right repo)
if not exist "%APP_DIR%\package.json" (
    color 0C
    echo.
    echo [ERROR] package.json not found in parent directory!
    echo.
    echo This script must be run from inside the cloned repository.
    echo.
    echo Please:
    echo   1. Clone the repository first
    echo   2. Navigate to the scripts folder
    echo   3. Run this batch file
    echo.
    pause
    exit /b 1
)

echo  Project: %APP_DIR%
echo  Script:  %SCRIPT_DIR%windows-setup.ps1
echo.
echo ---------------------------------------------------------------
echo  Starting installation...
echo ---------------------------------------------------------------
echo.

REM Run the PowerShell script with proper execution policy
REM -NoLogo: Cleaner output
REM -NonInteractive: Prevent PowerShell from prompting (we handle prompts in the script)
REM -ExecutionPolicy Bypass: Allow running unsigned scripts
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%windows-setup.ps1"

set SCRIPT_ERROR=%errorLevel%

echo.
echo ===============================================================

if %SCRIPT_ERROR% equ 0 (
    color 0A
    echo       [SUCCESS] Installation Completed Successfully!
    echo ===============================================================
    echo.
    echo  The WordPress Node CMS has been installed and configured.
    echo.
    echo  Next Steps:
    echo    1. Open a new terminal in: %APP_DIR%
    echo    2. Run: npm run dev
    echo    3. Open: http://localhost:3000/admin
    echo.
) else (
    color 0E
    echo       [WARNING] Installation Completed With Issues
    echo ===============================================================
    echo.
    echo  The setup encountered some issues (Error code: %SCRIPT_ERROR%)
    echo.
    echo  Please review the output above for details.
    echo.
    echo  Common solutions:
    echo    - Ensure you have a stable internet connection
    echo    - Check if PostgreSQL and Redis services are running
    echo    - Run the script again (it's safe to re-run)
    echo.
    echo  For manual troubleshooting, run:
    echo    cd %APP_DIR%
    echo    npm install
    echo    npx prisma db push
    echo    npm run dev
    echo.
)

echo  Start Time: %START_TIME%
echo  End Time:   %TIME%
echo.
echo ===============================================================
echo.

pause

