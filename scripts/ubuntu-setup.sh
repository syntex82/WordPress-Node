#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
# WordPress Node CMS - Ubuntu Server Setup Script
# Run this from inside the cloned repository folder
# Usage: sudo ./scripts/ubuntu-setup.sh
#═══════════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

DB_NAME="wordpress_node"
DB_USER="wpnode"
DB_PASSWORD="wpnode123"
ADMIN_EMAIL="admin@starter.dev"
ADMIN_PASSWORD="Admin123!"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       WordPress Node CMS - Ubuntu Server Setup                ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: Run with sudo${NC}"
    exit 1
fi

# Get the directory where the script is located (the repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
ACTUAL_USER=${SUDO_USER:-$USER}

echo -e "${GREEN}Project directory: ${APP_DIR}${NC}"

# ══════════════════════════════════════════════════════════════
# STEP 1: System packages
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}[1/7] Installing system packages...${NC}"
apt update
apt install -y curl wget git build-essential ca-certificates gnupg lsb-release

# ══════════════════════════════════════════════════════════════
# STEP 2: Node.js 20
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}[2/7] Installing Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo -e "${GREEN}Node $(node -v), npm $(npm -v)${NC}"

# ══════════════════════════════════════════════════════════════
# STEP 3: PostgreSQL
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}[3/7] Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS ${DB_USER};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF
echo -e "${GREEN}✓ PostgreSQL ready (db: ${DB_NAME}, user: ${DB_USER})${NC}"

# ══════════════════════════════════════════════════════════════
# STEP 4: Redis
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}[4/7] Installing Redis...${NC}"
apt install -y redis-server
systemctl start redis-server
systemctl enable redis-server
echo -e "${GREEN}✓ Redis ready${NC}"

# ══════════════════════════════════════════════════════════════
# STEP 5: Nginx
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}[5/7] Installing Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx
echo -e "${GREEN}✓ Nginx ready${NC}"

# ══════════════════════════════════════════════════════════════
# STEP 6: Create .env file
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}[6/7] Creating .env file...${NC}"
cat > ${APP_DIR}/.env << 'ENVEOF'
DATABASE_URL="postgresql://wpnode:wpnode123@localhost:5432/wordpress_node?schema=public"
DIRECT_DATABASE_URL="postgresql://wpnode:wpnode123@localhost:5432/wordpress_node?schema=public"
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
APP_URL=http://localhost:3000
JWT_SECRET=supersecretjwtkey123456789012345678901234567890
JWT_EXPIRES_IN=7d
SESSION_SECRET=supersessionsecret12345678901234567890123456789
ADMIN_EMAIL="admin@starter.dev"
ADMIN_PASSWORD="Admin123!"
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
SITE_NAME="WordPress Node"
SITE_DESCRIPTION="A modern CMS built with Node.js"
ACTIVE_THEME=default
ENVEOF
chown ${ACTUAL_USER}:${ACTUAL_USER} ${APP_DIR}/.env
echo -e "${GREEN}✓ .env created${NC}"

# ══════════════════════════════════════════════════════════════
# STEP 7: Install dependencies and setup database
# ══════════════════════════════════════════════════════════════
echo -e "${BLUE}[7/7] Installing npm dependencies...${NC}"

cd ${APP_DIR}
chown -R ${ACTUAL_USER}:${ACTUAL_USER} ${APP_DIR}

# Backend npm install
echo -e "${BLUE}Installing backend dependencies...${NC}"
sudo -u ${ACTUAL_USER} bash -c "cd ${APP_DIR} && npm install"

# Generate Prisma client
echo -e "${BLUE}Generating Prisma client...${NC}"
sudo -u ${ACTUAL_USER} bash -c "cd ${APP_DIR} && npx prisma generate"

# Admin npm install
echo -e "${BLUE}Installing admin dependencies...${NC}"
sudo -u ${ACTUAL_USER} bash -c "cd ${APP_DIR}/admin && npm install"

# Push schema to database (simpler than migrations for fresh install)
echo -e "${BLUE}Pushing database schema...${NC}"
sudo -u ${ACTUAL_USER} bash -c "cd ${APP_DIR} && npx prisma db push"

# Seed database - source .env and run seed
echo -e "${BLUE}Seeding database...${NC}"
sudo -u ${ACTUAL_USER} bash -c "cd ${APP_DIR} && export \$(cat .env | grep -v '^#' | xargs) && npx prisma db seed"

# Uploads folder
mkdir -p ${APP_DIR}/uploads
chown -R ${ACTUAL_USER}:${ACTUAL_USER} ${APP_DIR}/uploads

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}              ✓ INSTALLATION COMPLETE!                         ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Run:       ${BLUE}npm run dev${NC}"
echo -e "Admin:     ${BLUE}http://localhost:3000/admin${NC}"
echo -e "Email:     ${BLUE}${ADMIN_EMAIL}${NC}"
echo -e "Password:  ${BLUE}${ADMIN_PASSWORD}${NC}"
echo ""

