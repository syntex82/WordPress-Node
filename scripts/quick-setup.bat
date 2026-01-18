@echo off
REM ═══════════════════════════════════════════════════════════════════════════════
REM NodePress CMS - Quick Setup (No Admin Required)
REM For users who already have Node.js, PostgreSQL, and optionally Redis installed
REM ═══════════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion
color 0B

echo.
echo ===============================================================
echo       NodePress CMS - Quick Setup
echo       (Prerequisites: Node.js 18+, PostgreSQL)
echo ===============================================================
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
set APP_DIR=%SCRIPT_DIR%..

REM Verify package.json exists
if not exist "%APP_DIR%\package.json" (
    color 0C
    echo [ERROR] package.json not found!
    echo Please run this from inside the NodePress repository.
    pause
    exit /b 1
)

cd /d "%APP_DIR%"

REM Check Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo [ERROR] Node.js not found! Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check if .env exists, if not copy from example
if not exist "%APP_DIR%\.env" (
    if exist "%APP_DIR%\.env.example" (
        echo [INFO] Creating .env from .env.example...
        copy "%APP_DIR%\.env.example" "%APP_DIR%\.env" >nul
        echo [OK] .env file created - PLEASE EDIT IT WITH YOUR DATABASE SETTINGS!
        echo.
        echo IMPORTANT: Update the following in .env:
        echo   - DATABASE_URL with your PostgreSQL connection string
        echo   - ADMIN_PASSWORD with a secure password (12+ chars, uppercase, lowercase, number, special char)
        echo.
        pause
    ) else (
        echo [ERROR] No .env or .env.example found!
        pause
        exit /b 1
    )
)

echo.
echo [STEP 1/5] Installing backend dependencies...
call npm install
if %errorLevel% neq 0 (
    color 0E
    echo [WARNING] npm install had issues, trying to continue...
)

echo.
echo [STEP 2/5] Installing admin panel dependencies...
cd admin
call npm install
if %errorLevel% neq 0 (
    color 0E
    echo [WARNING] Admin npm install had issues, trying to continue...
)
cd ..

echo.
echo [STEP 3/5] Generating Prisma client...
call npx prisma generate
if %errorLevel% neq 0 (
    color 0C
    echo [ERROR] Prisma generate failed!
    pause
    exit /b 1
)

echo.
echo [STEP 4/5] Pushing database schema...
call npx prisma db push
if %errorLevel% neq 0 (
    color 0C
    echo [ERROR] Database schema push failed!
    echo Make sure PostgreSQL is running and DATABASE_URL in .env is correct.
    pause
    exit /b 1
)

echo.
echo [STEP 5/5] Seeding database...
call npx prisma db seed
if %errorLevel% neq 0 (
    color 0E
    echo [WARNING] Database seeding had issues.
    echo Check that ADMIN_PASSWORD in .env meets requirements:
    echo   - 12+ characters
    echo   - Uppercase letter
    echo   - Lowercase letter  
    echo   - Number
    echo   - Special character (!@#$%^&*...)
)

REM Create directories
if not exist "%APP_DIR%\uploads" mkdir "%APP_DIR%\uploads"
if not exist "%APP_DIR%\backups" mkdir "%APP_DIR%\backups"

color 0A
echo.
echo ===============================================================
echo       Setup Complete!
echo ===============================================================
echo.
echo To start the application:
echo   npm run dev
echo.
echo Access:
echo   Admin Panel: http://localhost:3000/admin
echo   API:         http://localhost:3000/api
echo.
echo Default login (check .env for actual values):
echo   Email:    admin@starter.dev
echo   Password: (your ADMIN_PASSWORD from .env)
echo.
pause

