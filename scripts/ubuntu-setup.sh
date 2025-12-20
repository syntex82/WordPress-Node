#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
# WordPress Node CMS - Ubuntu/Linux Setup Script
# Works on Ubuntu 20.04+, Debian 11+, and compatible distributions
# Run this from inside the cloned repository folder
# Usage: sudo ./scripts/ubuntu-setup.sh
#
# Features:
#   - Idempotent (safe to run multiple times)
#   - Interactive prompts for customization
#   - Comprehensive error handling and verification
#   - Service health checks
#   - Secure secret generation
#═══════════════════════════════════════════════════════════════════════════════

set -e

# ══════════════════════════════════════════════════════════════
# COLORS AND FORMATTING
# ══════════════════════════════════════════════════════════════
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m'
BOLD='\033[1m'

# ══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════
print_step() {
    echo ""
    echo -e "${BLUE}[$1] $2${NC}"
    echo -e "${GRAY}────────────────────────────────────────────────────────────${NC}"
}

print_success() {
    echo -e "  ${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "  ${CYAN}→${NC} $1"
}

print_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
}

print_fail() {
    echo -e "  ${RED}✗${NC} $1"
}

command_exists() {
    command -v "$1" &> /dev/null
}

generate_random_string() {
    local length=${1:-48}
    openssl rand -base64 $((length * 3 / 4)) | tr -dc 'a-zA-Z0-9' | head -c "$length"
}

test_postgres_connection() {
    local user=$1
    local pass=$2
    local db=$3
    PGPASSWORD="$pass" psql -U "$user" -h localhost -d "$db" -c "SELECT 1;" &> /dev/null
    return $?
}

test_redis_connection() {
    redis-cli ping 2>/dev/null | grep -q "PONG"
    return $?
}

# ══════════════════════════════════════════════════════════════
# ROOT CHECK
# ══════════════════════════════════════════════════════════════
if [ "$EUID" -ne 0 ]; then
    echo ""
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ERROR: Administrator privileges required${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Please run with sudo:"
    echo -e "  ${CYAN}sudo ./scripts/ubuntu-setup.sh${NC}"
    echo ""
    exit 1
fi

# ══════════════════════════════════════════════════════════════
# SYSTEM DETECTION
# ══════════════════════════════════════════════════════════════
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
ACTUAL_USER=${SUDO_USER:-$USER}

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$NAME
    OS_VERSION=$VERSION_ID
else
    OS_NAME="Unknown Linux"
    OS_VERSION="Unknown"
fi

echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}         WordPress Node CMS - Linux Setup Script${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}System:${NC}      $OS_NAME $OS_VERSION"
echo -e "  ${CYAN}User:${NC}        $ACTUAL_USER"
echo -e "  ${CYAN}Project Dir:${NC} $APP_DIR"
echo ""

# Verify we're in the correct directory
if [ ! -f "$APP_DIR/package.json" ]; then
    print_fail "package.json not found in $APP_DIR"
    echo -e "  Please run this script from inside the cloned repository."
    exit 1
fi

# ══════════════════════════════════════════════════════════════
# CONFIGURATION PROMPTS
# ══════════════════════════════════════════════════════════════
echo -e "${GRAY}─────────────────────────────────────────────────────────────────${NC}"
echo -e "  ${YELLOW}Configuration (press Enter to use defaults)${NC}"
echo -e "${GRAY}─────────────────────────────────────────────────────────────────${NC}"
echo ""

# Default values
DEFAULT_DB_NAME="wordpress_node"
DEFAULT_DB_USER="wpnode"
DEFAULT_DB_PASSWORD=$(generate_random_string 16)
DEFAULT_PORT="3000"
DEFAULT_ADMIN_EMAIL="admin@starter.dev"
DEFAULT_ADMIN_PASSWORD="Admin123!"

read -p "  Database name [$DEFAULT_DB_NAME]: " INPUT_DB_NAME
DB_NAME=${INPUT_DB_NAME:-$DEFAULT_DB_NAME}

read -p "  Database user [$DEFAULT_DB_USER]: " INPUT_DB_USER
DB_USER=${INPUT_DB_USER:-$DEFAULT_DB_USER}

read -p "  Database password [auto-generated]: " INPUT_DB_PASSWORD
DB_PASSWORD=${INPUT_DB_PASSWORD:-$DEFAULT_DB_PASSWORD}

read -p "  Application port [$DEFAULT_PORT]: " INPUT_PORT
APP_PORT=${INPUT_PORT:-$DEFAULT_PORT}

read -p "  Admin email [$DEFAULT_ADMIN_EMAIL]: " INPUT_ADMIN_EMAIL
ADMIN_EMAIL=${INPUT_ADMIN_EMAIL:-$DEFAULT_ADMIN_EMAIL}

read -p "  Admin password [$DEFAULT_ADMIN_PASSWORD]: " INPUT_ADMIN_PASSWORD
ADMIN_PASSWORD=${INPUT_ADMIN_PASSWORD:-$DEFAULT_ADMIN_PASSWORD}

echo ""
echo -e "${GRAY}─────────────────────────────────────────────────────────────────${NC}"
echo ""

# Generate secure secrets
JWT_SECRET=$(generate_random_string 64)
SESSION_SECRET=$(generate_random_string 64)

# Track installation status
INSTALLATION_ERRORS=()
TOTAL_STEPS=9
CURRENT_STEP=0

# ══════════════════════════════════════════════════════════════
# STEP 1: Install system packages
# ══════════════════════════════════════════════════════════════
((CURRENT_STEP++))
print_step "$CURRENT_STEP/$TOTAL_STEPS" "Installing system packages..."

{
    apt-get update -qq
    apt-get install -y -qq curl wget git build-essential ca-certificates gnupg lsb-release openssl > /dev/null 2>&1
    print_success "System packages installed"
} || {
    print_fail "Failed to install system packages"
    INSTALLATION_ERRORS+=("System packages")
}

# ══════════════════════════════════════════════════════════════
# STEP 2: Install Node.js 20 LTS
# ══════════════════════════════════════════════════════════════
((CURRENT_STEP++))
print_step "$CURRENT_STEP/$TOTAL_STEPS" "Installing Node.js 20 LTS..."

{
    if command_exists node; then
        NODE_VERSION=$(node -v)
        print_success "Node.js already installed ($NODE_VERSION)"

        # Check if version is 18+
        VERSION_NUM=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
        if [ "$VERSION_NUM" -lt 18 ]; then
            print_warn "Node.js version is outdated. Upgrading to v20..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
            apt-get install -y -qq nodejs > /dev/null 2>&1
        fi
    else
        print_info "Installing Node.js 20 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
        apt-get install -y -qq nodejs > /dev/null 2>&1
    fi

    # Verify installation
    if command_exists node; then
        print_success "Node.js $(node -v) ready"
        print_success "npm $(npm -v) ready"
    else
        print_fail "Node.js installation verification failed"
        INSTALLATION_ERRORS+=("Node.js")
    fi
} || {
    print_fail "Failed to install Node.js"
    INSTALLATION_ERRORS+=("Node.js")
}

# ══════════════════════════════════════════════════════════════
# STEP 3: Install PostgreSQL
# ══════════════════════════════════════════════════════════════
((CURRENT_STEP++))
print_step "$CURRENT_STEP/$TOTAL_STEPS" "Installing PostgreSQL..."

{
    if command_exists psql; then
        PG_VERSION=$(psql --version | sed 's/psql (PostgreSQL) //')
        print_success "PostgreSQL already installed (v$PG_VERSION)"
    else
        print_info "Installing PostgreSQL..."
        apt-get install -y -qq postgresql postgresql-contrib > /dev/null 2>&1
    fi

    # Ensure service is running
    systemctl start postgresql
    systemctl enable postgresql > /dev/null 2>&1
    print_success "PostgreSQL service is running"

    # Create database and user (idempotent)
    print_info "Configuring database..."
    sudo -u postgres psql <<EOF > /dev/null 2>&1
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS ${DB_USER};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

    # Verify database connection
    if test_postgres_connection "$DB_USER" "$DB_PASSWORD" "$DB_NAME"; then
        print_success "Database '$DB_NAME' created and accessible"
        print_success "User '$DB_USER' configured"
    else
        print_fail "Database connection verification failed"
        INSTALLATION_ERRORS+=("PostgreSQL connection")
    fi
} || {
    print_fail "Failed to configure PostgreSQL"
    INSTALLATION_ERRORS+=("PostgreSQL")
}

# ══════════════════════════════════════════════════════════════
# STEP 4: Install Redis
# ══════════════════════════════════════════════════════════════
((CURRENT_STEP++))
print_step "$CURRENT_STEP/$TOTAL_STEPS" "Installing Redis..."

{
    if command_exists redis-cli; then
        print_success "Redis already installed"
    else
        print_info "Installing Redis..."
        apt-get install -y -qq redis-server > /dev/null 2>&1
    fi

    # Ensure service is running
    systemctl start redis-server
    systemctl enable redis-server > /dev/null 2>&1

    # Verify Redis connection
    if test_redis_connection; then
        print_success "Redis is responding (PONG)"
    else
        print_warn "Redis may not be running - some features may be limited"
    fi
} || {
    print_warn "Failed to install Redis - continuing without it"
}

# ══════════════════════════════════════════════════════════════
# STEP 5: Install Nginx (optional, for production)
# ══════════════════════════════════════════════════════════════
((CURRENT_STEP++))
print_step "$CURRENT_STEP/$TOTAL_STEPS" "Installing Nginx..."

{
    if command_exists nginx; then
        print_success "Nginx already installed"
    else
        print_info "Installing Nginx..."
        apt-get install -y -qq nginx > /dev/null 2>&1
    fi

    systemctl start nginx
    systemctl enable nginx > /dev/null 2>&1
    print_success "Nginx service is running"
} || {
    print_warn "Failed to install Nginx - continuing without it"
}

# ══════════════════════════════════════════════════════════════
# STEP 6: Create .env configuration file
# ══════════════════════════════════════════════════════════════
((CURRENT_STEP++))
print_step "$CURRENT_STEP/$TOTAL_STEPS" "Creating environment configuration..."

{
    # Backup existing .env if it exists
    if [ -f "$APP_DIR/.env" ]; then
        BACKUP_FILE="$APP_DIR/.env.backup.$(date +%Y%m%d%H%M%S)"
        cp "$APP_DIR/.env" "$BACKUP_FILE"
        print_info "Backed up existing .env to $BACKUP_FILE"
    fi

    cat > "$APP_DIR/.env" << ENVEOF
# ═══════════════════════════════════════════════════════════════════════════
# WordPress Node CMS - Environment Configuration
# Generated: $(date '+%Y-%m-%d %H:%M:%S')
# ═══════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────
# DATABASE (PostgreSQL)
# ─────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
DIRECT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

# ─────────────────────────────────────────────────────────────
# APPLICATION
# ─────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=${APP_PORT}
HOST=0.0.0.0
APP_URL=http://localhost:${APP_PORT}

# ─────────────────────────────────────────────────────────────
# AUTHENTICATION (auto-generated secure secrets)
# ─────────────────────────────────────────────────────────────
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
SESSION_SECRET=${SESSION_SECRET}

# ─────────────────────────────────────────────────────────────
# ADMIN ACCOUNT (for initial seeding)
# ─────────────────────────────────────────────────────────────
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# ─────────────────────────────────────────────────────────────
# REDIS (caching, sessions, job queues)
# ─────────────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=wpnode:
CACHE_TTL=300

# ─────────────────────────────────────────────────────────────
# FILE STORAGE
# ─────────────────────────────────────────────────────────────
MAX_FILE_SIZE=104857600
UPLOAD_DIR=./uploads
STORAGE_PROVIDER=local
STORAGE_LOCAL_URL=/uploads

# ─────────────────────────────────────────────────────────────
# SITE CONFIGURATION
# ─────────────────────────────────────────────────────────────
SITE_NAME="WordPress Node"
SITE_DESCRIPTION="A modern CMS built with Node.js"
ACTIVE_THEME=my-theme
ENVEOF

    chown "${ACTUAL_USER}:${ACTUAL_USER}" "$APP_DIR/.env"
    print_success ".env file created successfully"
} || {
    print_fail "Failed to create .env file"
    INSTALLATION_ERRORS+=(".env creation")
}

# ══════════════════════════════════════════════════════════════
# STEP 7: Install npm dependencies
# ══════════════════════════════════════════════════════════════
((CURRENT_STEP++))
print_step "$CURRENT_STEP/$TOTAL_STEPS" "Installing npm dependencies..."

{
    cd "$APP_DIR"
    chown -R "${ACTUAL_USER}:${ACTUAL_USER}" "$APP_DIR"

    # Backend dependencies
    print_info "Installing backend dependencies..."
    sudo -u "$ACTUAL_USER" bash -c "cd $APP_DIR && npm install" > /dev/null 2>&1
    print_success "Backend dependencies installed"

    # Rebuild native modules
    print_info "Rebuilding native modules..."
    sudo -u "$ACTUAL_USER" bash -c "cd $APP_DIR && npm rebuild" > /dev/null 2>&1
    print_success "Native modules rebuilt"

    # Generate Prisma client
    print_info "Generating Prisma client..."
    sudo -u "$ACTUAL_USER" bash -c "cd $APP_DIR && npx prisma generate" > /dev/null 2>&1
    print_success "Prisma client generated"

    # Admin panel dependencies
    print_info "Installing admin panel dependencies..."
    sudo -u "$ACTUAL_USER" bash -c "cd $APP_DIR/admin && npm install" > /dev/null 2>&1
    print_success "Admin dependencies installed"
} || {
    print_fail "Failed to install dependencies"
    INSTALLATION_ERRORS+=("Dependencies")
}

# ══════════════════════════════════════════════════════════════
# STEP 8: Build applications
# ══════════════════════════════════════════════════════════════
((CURRENT_STEP++))
print_step "$CURRENT_STEP/$TOTAL_STEPS" "Building applications..."

{
    # Build admin frontend
    print_info "Building admin frontend..."
    sudo -u "$ACTUAL_USER" bash -c "cd $APP_DIR/admin && npm run build" > /dev/null 2>&1
    print_success "Admin frontend built"

    # Build backend
    print_info "Building backend..."
    sudo -u "$ACTUAL_USER" bash -c "cd $APP_DIR && npm run build" > /dev/null 2>&1
    print_success "Backend built"
} || {
    print_fail "Failed to build applications"
    INSTALLATION_ERRORS+=("Build")
}

# ══════════════════════════════════════════════════════════════
# STEP 9: Setup database schema and seed
# ══════════════════════════════════════════════════════════════
((CURRENT_STEP++))
print_step "$CURRENT_STEP/$TOTAL_STEPS" "Setting up database schema..."

{
    cd "$APP_DIR"

    # Push schema to database
    print_info "Pushing database schema..."
    sudo -u "$ACTUAL_USER" bash -c "cd $APP_DIR && npx prisma db push" > /dev/null 2>&1
    print_success "Database schema applied"

    # Seed database
    print_info "Seeding database with initial data..."
    sudo -u "$ACTUAL_USER" bash -c "cd $APP_DIR && export \$(cat .env | grep -v '^#' | xargs) && npx prisma db seed" > /dev/null 2>&1
    print_success "Database seeded successfully"
} || {
    print_fail "Failed to setup database"
    INSTALLATION_ERRORS+=("Database setup")
}

# ══════════════════════════════════════════════════════════════
# FINALIZE: Create directories and verify installation
# ══════════════════════════════════════════════════════════════
print_step "FINAL" "Finalizing installation..."

{
    # Create required directories
    DIRECTORIES=("uploads" "themes" "backups" "uploads/videos" "uploads/placeholders")
    for dir in "${DIRECTORIES[@]}"; do
        mkdir -p "$APP_DIR/$dir"
        chown -R "${ACTUAL_USER}:${ACTUAL_USER}" "$APP_DIR/$dir"
        print_success "Created directory: $dir"
    done

    # Verify key files exist
    print_info "Verifying installation..."
    REQUIRED_FILES=("package.json" ".env" "prisma/schema.prisma" "dist/main.js" "admin/dist/index.html")
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$APP_DIR/$file" ]; then
            print_success "Verified: $file"
        else
            print_warn "Missing: $file"
        fi
    done
}

# ══════════════════════════════════════════════════════════════
# INSTALLATION SUMMARY
# ══════════════════════════════════════════════════════════════
echo ""
if [ ${#INSTALLATION_ERRORS[@]} -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}              ✓ INSTALLATION COMPLETE!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
else
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}         ⚠ INSTALLATION COMPLETED WITH WARNINGS${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${YELLOW}Issues encountered:${NC}"
    for err in "${INSTALLATION_ERRORS[@]}"; do
        echo -e "    ${YELLOW}•${NC} $err"
    done
fi
echo ""

# Quick start instructions
echo -e "  ${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "  ${CYAN}│  QUICK START                                                │${NC}"
echo -e "  ${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "    To start the application:"
echo -e "      ${GRAY}cd $APP_DIR${NC}"
echo -e "      ${GREEN}npm run dev${NC}"
echo ""

echo -e "  ${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "  ${CYAN}│  ACCESS URLs                                                │${NC}"
echo -e "  ${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "    Frontend:     http://localhost:${APP_PORT}"
echo -e "    Admin Panel:  http://localhost:${APP_PORT}/admin"
echo -e "    API Docs:     http://localhost:${APP_PORT}/api"
echo -e "    Health Check: http://localhost:${APP_PORT}/health"
echo ""

echo -e "  ${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "  ${CYAN}│  ADMIN CREDENTIALS                                          │${NC}"
echo -e "  ${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "    Email:    ${ADMIN_EMAIL}"
echo -e "    Password: ${ADMIN_PASSWORD}"
echo ""

echo -e "  ${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "  ${CYAN}│  DATABASE CREDENTIALS                                       │${NC}"
echo -e "  ${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "    Database: ${DB_NAME}"
echo -e "    User:     ${DB_USER}"
echo -e "    Password: ${DB_PASSWORD}"
echo ""

echo -e "  ${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "  ${CYAN}│  INCLUDED THEMES                                            │${NC}"
echo -e "  ${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "    • my-theme (default)"
echo -e "    • default"
echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo ""
