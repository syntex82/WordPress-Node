#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
# WordPress Node CMS - Ubuntu Server Setup Script
# Clones repo & installs everything. Then just run: npm run dev
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/syntex82/WordPress-Node/main/scripts/ubuntu-setup.sh | sudo bash
#═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_URL="https://github.com/syntex82/WordPress-Node.git"
NODE_VERSION="20"
POSTGRES_VERSION="16"
APP_DIR="/home/${SUDO_USER:-$USER}/wordpress-node"
DB_NAME="wordpress_node"
DB_USER="wpnode"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       WordPress Node CMS - Ubuntu Server Setup                ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: Run as root (sudo ./ubuntu-setup.sh)${NC}"
    exit 1
fi

ACTUAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(eval echo ~$ACTUAL_USER)
APP_DIR="${USER_HOME}/wordpress-node"

echo -e "${GREEN}Installing to: ${APP_DIR}${NC}"
echo ""

# Generate passwords
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)
SESSION_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)

echo -e "${GREEN}Starting installation...${NC}"
echo ""

# 1: Update System
echo -e "${BLUE}[1/7] Updating system & installing build tools...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential ca-certificates gnupg lsb-release

# 2: Install Node.js
echo -e "${BLUE}[2/7] Installing Node.js ${NODE_VERSION}...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
fi
echo -e "${GREEN}✓ Node $(node -v), npm $(npm -v)${NC}"

# 3: Install PostgreSQL
echo -e "${BLUE}[3/7] Installing PostgreSQL ${POSTGRES_VERSION}...${NC}"
if ! command -v psql &> /dev/null; then
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    apt update && apt install -y postgresql-${POSTGRES_VERSION}
fi
systemctl start postgresql && systemctl enable postgresql
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null || true
echo -e "${GREEN}✓ PostgreSQL configured (user: ${DB_USER}, db: ${DB_NAME})${NC}"

# 4: Install Redis
echo -e "${BLUE}[4/7] Installing Redis...${NC}"
apt install -y redis-server
sed -i "s/supervised no/supervised systemd/" /etc/redis/redis.conf
systemctl restart redis-server && systemctl enable redis-server
echo -e "${GREEN}✓ Redis installed${NC}"

# 5: Install Nginx
echo -e "${BLUE}[5/7] Installing Nginx...${NC}"
apt install -y nginx
systemctl start nginx && systemctl enable nginx
echo -e "${GREEN}✓ Nginx installed${NC}"

# 6: Clone Repository
echo -e "${BLUE}[6/7] Cloning WordPress Node repository...${NC}"
if [ -d "${APP_DIR}" ]; then
    echo -e "${YELLOW}Directory exists. Pulling latest...${NC}"
    cd ${APP_DIR}
    git pull origin main || true
else
    git clone ${REPO_URL} ${APP_DIR}
fi
chown -R ${ACTUAL_USER}:${ACTUAL_USER} ${APP_DIR}
echo -e "${GREEN}✓ Repository cloned${NC}"

# 7: Install npm dependencies & setup
echo -e "${BLUE}[7/7] Installing npm dependencies...${NC}"
cd ${APP_DIR}

# Create .env file
cat > ${APP_DIR}/.env << ENVEOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
DIRECT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
APP_URL=http://localhost:3000
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
SESSION_SECRET=${SESSION_SECRET}
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecureAdmin@2024!
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
SITE_NAME=WordPress Node
SITE_DESCRIPTION=A modern CMS built with Node.js
ACTIVE_THEME=default
ENVEOF

chown ${ACTUAL_USER}:${ACTUAL_USER} ${APP_DIR}/.env

# Install as actual user
su - ${ACTUAL_USER} -c "cd '${APP_DIR}' && npm install"
su - ${ACTUAL_USER} -c "cd '${APP_DIR}' && npm run db:generate"
su - ${ACTUAL_USER} -c "cd '${APP_DIR}/admin' && npm install"

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Run migrations
echo -e "${BLUE}Running database migrations...${NC}"
su - ${ACTUAL_USER} -c "cd '${APP_DIR}' && npx prisma migrate deploy"
su - ${ACTUAL_USER} -c "cd '${APP_DIR}' && npm run db:seed"
echo -e "${GREEN}✓ Database ready${NC}"

# Create uploads directory
mkdir -p ${APP_DIR}/uploads
chown -R ${ACTUAL_USER}:${ACTUAL_USER} ${APP_DIR}/uploads

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}       ✓ Installation Complete!                                ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Project location: ${BLUE}${APP_DIR}${NC}"
echo ""
echo -e "${YELLOW}To start the application:${NC}"
echo -e "  cd ${APP_DIR}"
echo -e "  ${BLUE}npm run dev${NC}"
echo ""
echo -e "${YELLOW}Admin Panel:${NC} http://localhost:3000/admin"
echo -e "${YELLOW}Login:${NC} admin@example.com / SecureAdmin@2024!"
echo ""
echo -e "${YELLOW}Installed:${NC}"
echo -e "  • Node.js $(node -v)"
echo -e "  • PostgreSQL ${POSTGRES_VERSION}"
echo -e "  • Redis"
echo -e "  • Nginx"
echo ""

