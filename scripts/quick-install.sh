#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
# NodePress CMS - Quick Install (Development)
# Lightweight script for quick development setup
#
# Usage:
#   chmod +x scripts/quick-install.sh
#   sudo ./scripts/quick-install.sh
#
# After running, just do: npm run dev
#
# Features:
#   - Idempotent (safe to run multiple times)
#   - Auto-generates secure secrets
#   - Minimal prompts for quick setup
#═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m'

# Helper functions
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

command_exists() {
    command -v "$1" &> /dev/null
}

generate_random_string() {
    local length=${1:-48}
    openssl rand -base64 $((length * 3 / 4)) | tr -dc 'a-zA-Z0-9' | head -c "$length"
}

echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}       NodePress CMS - Quick Install${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: Run as root: sudo ./scripts/quick-install.sh${NC}"
    exit 1
fi

# Get the actual user who ran sudo
ACTUAL_USER=${SUDO_USER:-$USER}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "  ${CYAN}User:${NC}        $ACTUAL_USER"
echo -e "  ${CYAN}Project Dir:${NC} $PROJECT_DIR"
echo ""

# Verify we're in the correct directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${RED}ERROR: package.json not found. Run from inside the repository.${NC}"
    exit 1
fi

# Generate secure values
DB_NAME="nodepress"
DB_USER="wpnode"
DB_PASS=$(generate_random_string 16)
JWT_SECRET=$(generate_random_string 64)
SESSION_SECRET=$(generate_random_string 64)
ADMIN_EMAIL="admin@starter.dev"
ADMIN_PASSWORD="Admin123!"
APP_PORT="3000"

# ══════════════════════════════════════════════════════════════
# STEP 1: System packages
# ══════════════════════════════════════════════════════════════
print_step "1/5" "Installing system packages..."
{
    apt-get update -qq
    apt-get install -y -qq curl wget git build-essential openssl lsb-release > /dev/null 2>&1
    print_success "System packages installed"
} || print_warn "Some packages may have failed"

# ══════════════════════════════════════════════════════════════
# STEP 2: Node.js 20
# ══════════════════════════════════════════════════════════════
print_step "2/5" "Installing Node.js 20..."
{
    if command_exists node; then
        print_success "Node.js already installed ($(node -v))"
    else
        print_info "Installing Node.js 20 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
        apt-get install -y -qq nodejs > /dev/null 2>&1
        print_success "Node.js $(node -v) installed"
    fi
}

# ══════════════════════════════════════════════════════════════
# STEP 3: PostgreSQL
# ══════════════════════════════════════════════════════════════
print_step "3/5" "Installing PostgreSQL..."
{
    if command_exists psql; then
        print_success "PostgreSQL already installed"
    else
        print_info "Installing PostgreSQL..."
        apt-get install -y -qq postgresql postgresql-contrib > /dev/null 2>&1
    fi

    systemctl start postgresql
    systemctl enable postgresql > /dev/null 2>&1

    # Create database (idempotent)
    sudo -u postgres psql <<EOF > /dev/null 2>&1
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS ${DB_USER};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF
    print_success "PostgreSQL configured (db: $DB_NAME, user: $DB_USER)"
}

# ══════════════════════════════════════════════════════════════
# STEP 4: Redis
# ══════════════════════════════════════════════════════════════
print_step "4/5" "Installing Redis..."
{
    if command_exists redis-cli; then
        print_success "Redis already installed"
    else
        apt-get install -y -qq redis-server > /dev/null 2>&1
    fi
    systemctl start redis-server
    systemctl enable redis-server > /dev/null 2>&1
    print_success "Redis is running"
}

# ══════════════════════════════════════════════════════════════
# STEP 5: Project setup
# ══════════════════════════════════════════════════════════════
print_step "5/5" "Setting up project..."

cd "$PROJECT_DIR"

# Create .env file
print_info "Creating .env configuration..."
if [ -f .env ]; then
    cp .env ".env.backup.$(date +%Y%m%d%H%M%S)"
    print_info "Backed up existing .env"
fi

cat > .env << EOF
# NodePress CMS - Quick Install Configuration
# Generated: $(date '+%Y-%m-%d %H:%M:%S')

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
DIRECT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
NODE_ENV=development
PORT=${APP_PORT}
HOST=0.0.0.0
APP_URL=http://localhost:${APP_PORT}
FRONTEND_URL=http://localhost:${APP_PORT}/admin
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
SESSION_SECRET=${SESSION_SECRET}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=wpnode:
CACHE_TTL=300
MAX_FILE_SIZE=104857600
UPLOAD_DIR=./uploads
STORAGE_PROVIDER=local
STORAGE_LOCAL_URL=/uploads
SITE_NAME="NodePress"
SITE_DESCRIPTION="A modern CMS built with Node.js"
ACTIVE_THEME=my-theme
EOF
chown "$ACTUAL_USER:$ACTUAL_USER" .env
print_success ".env created"

# Fix ownership
chown -R "$ACTUAL_USER:$ACTUAL_USER" "$PROJECT_DIR"

# Install dependencies
print_info "Installing backend dependencies..."
sudo -u "$ACTUAL_USER" bash -c "cd '$PROJECT_DIR' && npm install" > /dev/null 2>&1
print_success "Backend dependencies installed"

print_info "Generating Prisma client..."
sudo -u "$ACTUAL_USER" bash -c "cd '$PROJECT_DIR' && npx prisma generate" > /dev/null 2>&1
print_success "Prisma client generated"

print_info "Installing admin dependencies..."
sudo -u "$ACTUAL_USER" bash -c "cd '$PROJECT_DIR/admin' && npm install" > /dev/null 2>&1
print_success "Admin dependencies installed"

print_info "Pushing database schema..."
sudo -u "$ACTUAL_USER" bash -c "cd '$PROJECT_DIR' && npx prisma db push" > /dev/null 2>&1
print_success "Database schema applied"

print_info "Seeding database..."
sudo -u "$ACTUAL_USER" bash -c "cd '$PROJECT_DIR' && export \$(cat .env | grep -v '^#' | xargs) && npx prisma db seed" > /dev/null 2>&1
print_success "Database seeded"

# Create directories
mkdir -p "$PROJECT_DIR/uploads" "$PROJECT_DIR/themes" "$PROJECT_DIR/backups"
chown -R "$ACTUAL_USER:$ACTUAL_USER" "$PROJECT_DIR/uploads" "$PROJECT_DIR/themes" "$PROJECT_DIR/backups"

# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}              ✓ Quick Install Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}To start development:${NC}"
echo -e "    cd $PROJECT_DIR"
echo -e "    ${GREEN}npm run dev${NC}"
echo ""
echo -e "  ${CYAN}Access URLs:${NC}"
echo -e "    Frontend:     http://localhost:${APP_PORT}"
echo -e "    Admin Panel:  http://localhost:${APP_PORT}/admin"
echo ""
echo -e "  ${CYAN}Admin Credentials:${NC}"
echo -e "    Email:    ${ADMIN_EMAIL}"
echo -e "    Password: ${ADMIN_PASSWORD}"
echo ""
echo -e "  ${CYAN}Database Credentials:${NC}"
echo -e "    Database: ${DB_NAME}"
echo -e "    User:     ${DB_USER}"
echo -e "    Password: ${DB_PASS}"
echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo ""
