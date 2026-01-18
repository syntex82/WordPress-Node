#===============================================================================
# NodePress CMS - Windows Setup Script
# Works on Windows 11 and Windows Server (2019, 2022)
# Run this from inside the cloned repository folder
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\windows-setup.ps1
#
# Features:
#   - Idempotent (safe to run multiple times)
#   - Interactive prompts for customization
#   - Comprehensive error handling and verification
#   - Service health checks
#   - Secure secret generation
#===============================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-Host "`n[$Step] $Message" -ForegroundColor Blue
    Write-Host ("-" * 60) -ForegroundColor DarkGray
}

function Write-Success {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  [..] $Message" -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host "  [!!] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  [XX] $Message" -ForegroundColor Red
}

function Test-CommandExists {
    param([string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Get-SecureRandomString {
    param([int]$Length = 48)
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($bytes)
    $result = ""
    foreach ($byte in $bytes) {
        $result += $chars[$byte % $chars.Length]
    }
    return $result
}

function Update-EnvironmentPath {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

function Test-PostgreSQLConnection {
    param([string]$DbUser, [string]$DbPass, [string]$Database)
    try {
        $env:PGPASSWORD = $DbPass
        $null = & psql -U $DbUser -h localhost -d $Database -c "SELECT 1;" 2>&1
        $env:PGPASSWORD = ""
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Test-RedisConnection {
    try {
        $result = & redis-cli ping 2>&1
        return $result -eq "PONG"
    } catch {
        return $false
    }
}

# ==============================================================================
# ADMIN CHECK
# ==============================================================================
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "`n================================================================" -ForegroundColor Red
    Write-Host "  ERROR: Administrator privileges required" -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host "`nPlease right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# ==============================================================================
# SYSTEM DETECTION
# ==============================================================================
$osInfo = Get-CimInstance Win32_OperatingSystem
$osName = $osInfo.Caption
$osVersion = $osInfo.Version
$isWindowsServer = $osName -match "Server"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "         NodePress CMS - Windows Setup Script" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  System:      $osName" -ForegroundColor Cyan
Write-Host "  Version:     $osVersion" -ForegroundColor Cyan
Write-Host "  Platform:    $(if ($isWindowsServer) { 'Windows Server' } else { 'Windows Desktop' })" -ForegroundColor Cyan
Write-Host ""

# Get the directory where the script is located
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$APP_DIR = Split-Path -Parent $SCRIPT_DIR

Write-Host "  Project Dir: $APP_DIR" -ForegroundColor Cyan
Write-Host ""

# Verify we are in the correct directory
if (-NOT (Test-Path "$APP_DIR\package.json")) {
    Write-Fail "package.json not found in $APP_DIR"
    Write-Host "  Please run this script from inside the cloned repository." -ForegroundColor Yellow
    exit 1
}

# ==============================================================================
# CONFIGURATION PROMPTS
# ==============================================================================
Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Configuration (press Enter to use defaults)" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Database configuration
$defaultDbName = "nodepress"
$defaultDbUser = "nodepress"
$defaultDbPassword = Get-SecureRandomString -Length 16
$defaultPort = "3000"
$defaultAdminEmail = "admin@starter.dev"
# Password must be 12+ chars with uppercase, lowercase, number, and special char
$defaultAdminPassword = "Admin@Secure2024!"

$promptDbName = Read-Host "  Database name [$defaultDbName]"
$DB_NAME = if ($promptDbName) { $promptDbName } else { $defaultDbName }

$promptDbUser = Read-Host "  Database user [$defaultDbUser]"
$DB_USER = if ($promptDbUser) { $promptDbUser } else { $defaultDbUser }

$promptDbPassword = Read-Host "  Database password [auto-generated]"
$DB_PASSWORD = if ($promptDbPassword) { $promptDbPassword } else { $defaultDbPassword }

$promptPort = Read-Host "  Application port [$defaultPort]"
$APP_PORT = if ($promptPort) { $promptPort } else { $defaultPort }

$promptAdminEmail = Read-Host "  Admin email [$defaultAdminEmail]"
$ADMIN_EMAIL = if ($promptAdminEmail) { $promptAdminEmail } else { $defaultAdminEmail }

$promptAdminPassword = Read-Host "  Admin password [$defaultAdminPassword]"
$ADMIN_PASSWORD = if ($promptAdminPassword) { $promptAdminPassword } else { $defaultAdminPassword }

Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Generate secure secrets
$JWT_SECRET = Get-SecureRandomString -Length 64
$SESSION_SECRET = Get-SecureRandomString -Length 64

# Track installation status
$installationErrors = @()
$totalSteps = 9
$currentStep = 0

# ==============================================================================
# STEP 1: Install Chocolatey Package Manager
# ==============================================================================
$currentStep++
Write-Step "$currentStep/$totalSteps" "Installing Chocolatey package manager..."

try {
    if (Test-CommandExists "choco") {
        Write-Success "Chocolatey already installed ($(choco --version))"
    } else {
        Write-Info "Installing Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Update-EnvironmentPath

        if (Test-CommandExists "choco") {
            Write-Success "Chocolatey installed successfully"
        } else {
            throw "Chocolatey installation failed"
        }
    }
} catch {
    Write-Fail "Failed to install Chocolatey: $_"
    $installationErrors += "Chocolatey: $_"
}

# ==============================================================================
# STEP 2: Install Node.js 20 LTS
# ==============================================================================
$currentStep++
Write-Step "$currentStep/$totalSteps" "Installing Node.js 20 LTS..."

try {
    if (Test-CommandExists "node") {
        $nodeVersion = node -v
        Write-Success "Node.js already installed ($nodeVersion)"

        # Check if version is 18+
        $versionNum = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($versionNum -lt 18) {
            Write-Warn "Node.js version $nodeVersion is outdated. Upgrading to v20..."
            choco upgrade nodejs-lts -y
            Update-EnvironmentPath
        }
    } else {
        Write-Info "Installing Node.js 20 LTS..."
        choco install nodejs-lts -y
        Update-EnvironmentPath
    }

    # Verify installation
    if (Test-CommandExists "node") {
        Write-Success "Node.js $(node -v) ready"
        Write-Success "npm $(npm -v) ready"
    } else {
        throw "Node.js installation verification failed"
    }
} catch {
    Write-Fail "Failed to install Node.js: $_"
    $installationErrors += "Node.js: $_"
}

# ==============================================================================
# STEP 3: Install PostgreSQL
# ==============================================================================
$currentStep++
Write-Step "$currentStep/$totalSteps" "Installing PostgreSQL 16..."

$POSTGRES_SUPERUSER_PASSWORD = "postgres"

try {
    if (Test-CommandExists "psql") {
        $pgVersion = (psql --version) -replace 'psql \(PostgreSQL\) ', ''
        Write-Success "PostgreSQL already installed (v$pgVersion)"
    } else {
        Write-Info "Installing PostgreSQL 16..."
        choco install postgresql16 -y --params "/Password:$POSTGRES_SUPERUSER_PASSWORD"
        Update-EnvironmentPath

        # Find and add PostgreSQL bin to path - check multiple versions
        $pgPaths = @(
            "C:\Program Files\PostgreSQL\16\bin",
            "C:\Program Files\PostgreSQL\15\bin",
            "C:\Program Files\PostgreSQL\14\bin",
            "C:\Program Files\PostgreSQL\17\bin"
        )
        foreach ($pgPath in $pgPaths) {
            if (Test-Path $pgPath) {
                $env:Path += ";$pgPath"
                Write-Info "Added PostgreSQL path: $pgPath"
                break
            }
        }

        Start-Sleep -Seconds 5  # Wait for service to initialize
    }

    # Verify PostgreSQL service is running
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        if ($pgService.Status -ne "Running") {
            Write-Info "Starting PostgreSQL service..."
            Start-Service $pgService.Name
            Start-Sleep -Seconds 3
        }
        Write-Success "PostgreSQL service is running"
    } else {
        Write-Warn "PostgreSQL service not found - manual start may be required"
    }

    # Create database and user (idempotent)
    Write-Info "Configuring database..."
    $env:PGPASSWORD = $POSTGRES_SUPERUSER_PASSWORD

    # Drop existing database and user if they exist (for fresh setup)
    & psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>$null
    & psql -U postgres -h localhost -c "DROP USER IF EXISTS $DB_USER;" 2>$null

    # Create user and database
    & psql -U postgres -h localhost -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    & psql -U postgres -h localhost -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    & psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

    $env:PGPASSWORD = ""

    # Verify database connection
    if (Test-PostgreSQLConnection -DbUser $DB_USER -DbPass $DB_PASSWORD -Database $DB_NAME) {
        Write-Success "Database '$DB_NAME' created and accessible"
        Write-Success "User '$DB_USER' configured"
    } else {
        throw "Database connection verification failed"
    }
} catch {
    Write-Fail "Failed to configure PostgreSQL: $_"
    $installationErrors += "PostgreSQL: $_"
}

# ==============================================================================
# STEP 4: Install Redis
# ==============================================================================
$currentStep++
Write-Step "$currentStep/$totalSteps" "Installing Redis..."

try {
    if (Test-CommandExists "redis-cli") {
        Write-Success "Redis already installed"
    } else {
        Write-Info "Installing Redis..."
        # Try multiple Redis packages as availability varies
        $redisInstalled = $false

        # First try Memurai (Redis-compatible for Windows)
        try {
            choco install memurai-developer -y 2>&1 | Out-Null
            Update-EnvironmentPath
            $redisInstalled = $true
            Write-Success "Memurai (Redis-compatible) installed"
        } catch {
            Write-Info "Memurai not available, trying redis-64..."
        }

        if (-not $redisInstalled) {
            try {
                choco install redis-64 -y 2>&1 | Out-Null
                Update-EnvironmentPath
                $redisInstalled = $true
            } catch {
                Write-Warn "Redis packages not available via Chocolatey"
            }
        }

        Start-Sleep -Seconds 3
    }

    # Start Redis/Memurai service if not running
    $redisService = Get-Service -Name "Redis", "Memurai" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($redisService) {
        if ($redisService.Status -ne "Running") {
            Write-Info "Starting $($redisService.Name) service..."
            Start-Service $redisService.Name -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
        Write-Success "$($redisService.Name) service is running"
    } else {
        # Try to start Redis manually on Windows Desktop
        Write-Info "Redis service not found, attempting to start manually..."
        $redisServer = Get-Command redis-server -ErrorAction SilentlyContinue
        if ($redisServer) {
            Start-Process -FilePath "redis-server" -WindowStyle Hidden -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }

    # Verify Redis connection
    if (Test-RedisConnection) {
        Write-Success "Redis is responding (PONG)"
    } else {
        Write-Warn "Redis may not be running - some features may be limited"
        Write-Info "You can install Redis manually or use Docker: docker run -d -p 6379:6379 redis"
    }
} catch {
    Write-Fail "Failed to install Redis: $_"
    Write-Warn "Redis is optional - continuing without it"
    Write-Info "You can install Redis later using Docker: docker run -d -p 6379:6379 redis"
}

# ==============================================================================
# STEP 5: Create .env configuration file
# ==============================================================================
$currentStep++
Write-Step "$currentStep/$totalSteps" "Creating environment configuration..."

$envPath = "$APP_DIR\.env"
$envBackupPath = "$APP_DIR\.env.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"

try {
    # Backup existing .env if it exists
    if (Test-Path $envPath) {
        Write-Info "Backing up existing .env to .env.backup..."
        Copy-Item $envPath $envBackupPath
        Write-Success "Backup created: $envBackupPath"
    }

    $envContent = @"
# ===========================================================================
# NodePress CMS - Environment Configuration
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ===========================================================================

# ---------------------------------------------------------------------------
# DATABASE (PostgreSQL)
# ---------------------------------------------------------------------------
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
DIRECT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

# ---------------------------------------------------------------------------
# APPLICATION
# ---------------------------------------------------------------------------
NODE_ENV=development
PORT=$APP_PORT
HOST=0.0.0.0
APP_URL=http://localhost:$APP_PORT
FRONTEND_URL=http://localhost:$APP_PORT/admin

# ---------------------------------------------------------------------------
# AUTHENTICATION (auto-generated secure secrets)
# ---------------------------------------------------------------------------
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
SESSION_SECRET=$SESSION_SECRET

# ---------------------------------------------------------------------------
# SUPER ADMIN ACCOUNT (for initial seeding)
# Created with SUPER_ADMIN role for full system access
# ---------------------------------------------------------------------------
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

# ---------------------------------------------------------------------------
# REDIS (caching, sessions, job queues)
# ---------------------------------------------------------------------------
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=nodepress:
CACHE_TTL=300

# ---------------------------------------------------------------------------
# FILE STORAGE
# ---------------------------------------------------------------------------
MAX_FILE_SIZE=104857600
UPLOAD_DIR=./uploads
STORAGE_PROVIDER=local
STORAGE_LOCAL_URL=/uploads

# ---------------------------------------------------------------------------
# SITE CONFIGURATION
# ---------------------------------------------------------------------------
SITE_NAME="NodePress"
SITE_DESCRIPTION="A modern CMS built with Node.js"
ACTIVE_THEME=my-theme
"@

    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-Success ".env file created successfully"
} catch {
    Write-Fail "Failed to create .env file: $_"
    $installationErrors += ".env creation: $_"
}

# ==============================================================================
# STEP 6: Install npm dependencies
# ==============================================================================
$currentStep++
Write-Step "$currentStep/$totalSteps" "Installing npm dependencies..."

try {
    Set-Location $APP_DIR

    # Backend dependencies
    Write-Info "Installing backend dependencies..."
    $npmOutput = npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host $npmOutput -ForegroundColor Yellow
        throw "npm install failed for backend"
    }
    Write-Success "Backend dependencies installed"

    # Rebuild native modules (bcrypt, sharp, etc.)
    Write-Info "Rebuilding native modules..."
    npm rebuild 2>&1 | Out-Null
    Write-Success "Native modules rebuilt"

    # Generate Prisma client
    Write-Info "Generating Prisma client..."
    $prismaOutput = npx prisma generate 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host $prismaOutput -ForegroundColor Yellow
        throw "Prisma generate failed"
    }
    Write-Success "Prisma client generated"

    # Admin panel dependencies
    Write-Info "Installing admin panel dependencies..."
    Set-Location "$APP_DIR\admin"
    $adminNpmOutput = npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host $adminNpmOutput -ForegroundColor Yellow
        throw "npm install failed for admin"
    }
    Write-Success "Admin dependencies installed"

    Set-Location $APP_DIR
} catch {
    Write-Fail "Failed to install dependencies: $_"
    $installationErrors += "Dependencies: $_"
    Set-Location $APP_DIR
}

# ==============================================================================
# STEP 7: Build applications
# ==============================================================================
$currentStep++
Write-Step "$currentStep/$totalSteps" "Building applications..."

try {
    # Build admin frontend
    Write-Info "Building admin frontend..."
    Set-Location "$APP_DIR\admin"
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Admin build failed"
        Write-Host ($buildOutput | Select-Object -Last 20) -ForegroundColor Yellow
        throw "Admin build failed"
    }

    # Verify admin dist exists
    if (Test-Path "$APP_DIR\admin\dist\index.html") {
        Write-Success "Admin frontend built"
    } else {
        Write-Fail "Admin build completed but dist\index.html not found"
        $installationErrors += "Admin build - missing output"
    }

    # Build backend
    Write-Info "Building backend..."
    Set-Location $APP_DIR
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Backend build failed"
        Write-Host ($buildOutput | Select-Object -Last 20) -ForegroundColor Yellow
        throw "Backend build failed"
    }

    # Verify backend dist exists
    if (Test-Path "$APP_DIR\dist\main.js") {
        Write-Success "Backend built"
    } else {
        Write-Fail "Backend build completed but dist\main.js not found"
        $installationErrors += "Backend build - missing output"
    }
} catch {
    Write-Fail "Failed to build applications: $_"
    $installationErrors += "Build: $_"
    Set-Location $APP_DIR
}

# ==============================================================================
# STEP 8: Setup database schema and seed
# ==============================================================================
$currentStep++
Write-Step "$currentStep/$totalSteps" "Setting up database schema..."

try {
    Set-Location $APP_DIR

    # Push schema to database
    Write-Info "Pushing database schema..."
    $dbPushOutput = npx prisma db push 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host $dbPushOutput -ForegroundColor Yellow
        throw "Prisma db push failed"
    }
    Write-Success "Database schema applied"

    # Seed database
    Write-Info "Seeding database with initial data..."
    $seedOutput = npx prisma db seed 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host $seedOutput -ForegroundColor Yellow
        throw "Database seeding failed"
    }
    Write-Success "Database seeded successfully"
} catch {
    Write-Fail "Failed to setup database: $_"
    $installationErrors += "Database setup: $_"
}

# ==============================================================================
# STEP 9: Create directories and verify installation
# ==============================================================================
$currentStep++
Write-Step "$currentStep/$totalSteps" "Finalizing installation..."

try {
    # Create required directories
    $directories = @("uploads", "themes", "backups", "uploads\videos", "uploads\placeholders")
    foreach ($dir in $directories) {
        $dirPath = "$APP_DIR\$dir"
        if (-NOT (Test-Path $dirPath)) {
            New-Item -ItemType Directory -Force -Path $dirPath | Out-Null
            Write-Success "Created directory: $dir"
        }
    }

    # Verify key files exist
    $requiredFiles = @(
        "package.json",
        ".env",
        "prisma\schema.prisma",
        "dist\main.js",
        "admin\dist\index.html"
    )

    Write-Info "Verifying installation..."
    foreach ($file in $requiredFiles) {
        $filePath = "$APP_DIR\$file"
        if (Test-Path $filePath) {
            Write-Success "Verified: $file"
        } else {
            Write-Warn "Missing: $file"
        }
    }
} catch {
    Write-Fail "Failed to finalize installation: $_"
}

# ==============================================================================
# INSTALLATION SUMMARY
# ==============================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor $(if ($installationErrors.Count -eq 0) { "Green" } else { "Yellow" })

if ($installationErrors.Count -eq 0) {
    Write-Host "              [OK] INSTALLATION COMPLETE!" -ForegroundColor Green
} else {
    Write-Host "         [!!] INSTALLATION COMPLETED WITH WARNINGS" -ForegroundColor Yellow
}

Write-Host "================================================================" -ForegroundColor $(if ($installationErrors.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

# Show any errors
if ($installationErrors.Count -gt 0) {
    Write-Host "  Issues encountered:" -ForegroundColor Yellow
    foreach ($errorItem in $installationErrors) {
        Write-Host "    * $errorItem" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Quick start instructions
Write-Host "  ----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  QUICK START" -ForegroundColor Cyan
Write-Host "  ----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "    To start the application:" -ForegroundColor White
Write-Host "      cd $APP_DIR" -ForegroundColor Gray
Write-Host "      npm run dev" -ForegroundColor Green
Write-Host ""

Write-Host "  ----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  ACCESS URLs" -ForegroundColor Cyan
Write-Host "  ----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "    Frontend:     http://localhost:$APP_PORT" -ForegroundColor White
Write-Host "    Admin Panel:  http://localhost:$APP_PORT/admin" -ForegroundColor White
Write-Host "    API Docs:     http://localhost:$APP_PORT/api" -ForegroundColor White
Write-Host "    Health Check: http://localhost:$APP_PORT/health" -ForegroundColor White
Write-Host ""

Write-Host "  ----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  SUPER ADMIN CREDENTIALS" -ForegroundColor Cyan
Write-Host "  ----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "    Role:     SUPER_ADMIN (full system access)" -ForegroundColor Yellow
Write-Host "    Email:    $ADMIN_EMAIL" -ForegroundColor White
Write-Host "    Password: $ADMIN_PASSWORD" -ForegroundColor White
Write-Host ""

Write-Host "  ----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  DATABASE CREDENTIALS" -ForegroundColor Cyan
Write-Host "  ----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "    Database: $DB_NAME" -ForegroundColor White
Write-Host "    User:     $DB_USER" -ForegroundColor White
Write-Host "    Password: $DB_PASSWORD" -ForegroundColor White
Write-Host ""

Write-Host "  ----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  INCLUDED THEMES" -ForegroundColor Cyan
Write-Host "  ----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "    * my-theme (default)" -ForegroundColor White
Write-Host "    * default" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""

# Return exit code based on errors
if ($installationErrors.Count -eq 0) {
    exit 0
} else {
    exit 1
}

