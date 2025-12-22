#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
# WordPress Node CMS - Hostinger VPS Production Setup Script
# Domain: wordpressnode.co.uk
# 
# Prerequisites:
#   1. Fresh Ubuntu 22.04+ VPS from Hostinger
#   2. SSH access as root
#   3. Domain DNS pointed to VPS IP (A record: wordpressnode.co.uk -> VPS_IP)
#
# Usage:
#   1. SSH into your VPS: ssh root@your-vps-ip
#   2. Clone repo: git clone https://github.com/syntex82/WordPress-Node.git /var/www/WordPress-Node
#   3. Run: cd /var/www/WordPress-Node && chmod +x scripts/hostinger-vps-setup.sh
#   4. Execute: ./scripts/hostinger-vps-setup.sh
#═══════════════════════════════════════════════════════════════════════════════

set -e

# ══════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════
DOMAIN="wordpressnode.co.uk"
APP_DIR="/var/www/WordPress-Node"
APP_USER="wpnode"
APP_PORT="3000"
NODE_VERSION="20"

# ══════════════════════════════════════════════════════════════
# COLORS AND FORMATTING
# ══════════════════════════════════════════════════════════════
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

print_step() { echo -e "\n${BLUE}[$1]${NC} $2\n${CYAN}────────────────────────────────────────────────────────────${NC}"; }
print_success() { echo -e "  ${GREEN}✓${NC} $1"; }
print_info() { echo -e "  ${CYAN}→${NC} $1"; }
print_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
print_fail() { echo -e "  ${RED}✗${NC} $1"; }

generate_secret() { openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c "$1"; }

# ══════════════════════════════════════════════════════════════
# ROOT CHECK
# ══════════════════════════════════════════════════════════════
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: This script must be run as root${NC}"
    echo -e "Usage: sudo ./scripts/hostinger-vps-setup.sh"
    exit 1
fi

# ══════════════════════════════════════════════════════════════
# BANNER
# ══════════════════════════════════════════════════════════════
clear
echo -e "${MAGENTA}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "        WordPress Node CMS - Hostinger VPS Production Setup"
echo "        Domain: ${DOMAIN}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# ══════════════════════════════════════════════════════════════
# PROMPTS
# ══════════════════════════════════════════════════════════════
echo -e "${YELLOW}Configuration (press Enter for defaults):${NC}\n"

read -p "  Admin email [admin@${DOMAIN}]: " INPUT_ADMIN_EMAIL
ADMIN_EMAIL=${INPUT_ADMIN_EMAIL:-"admin@${DOMAIN}"}

read -p "  Admin password [SecurePass123!]: " INPUT_ADMIN_PASSWORD
ADMIN_PASSWORD=${INPUT_ADMIN_PASSWORD:-"SecurePass123!"}

read -p "  Database name [wordpress_node]: " INPUT_DB_NAME
DB_NAME=${INPUT_DB_NAME:-"wordpress_node"}

read -p "  Database user [wpnode]: " INPUT_DB_USER
DB_USER=${INPUT_DB_USER:-"wpnode"}

DB_PASSWORD=$(generate_secret 24)
JWT_SECRET=$(generate_secret 64)
SESSION_SECRET=$(generate_secret 64)
ENCRYPTION_KEY=$(generate_secret 32)

echo ""
print_info "Database password will be auto-generated"
print_info "Starting installation..."
echo ""

# ══════════════════════════════════════════════════════════════
# STEP 1: System Update & Dependencies
# ══════════════════════════════════════════════════════════════
print_step "1/10" "Updating system and installing dependencies..."

apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git build-essential ca-certificates gnupg lsb-release \
    openssl software-properties-common ufw fail2ban htop

print_success "System packages installed"

# ══════════════════════════════════════════════════════════════
# STEP 2: Create application user
# ══════════════════════════════════════════════════════════════
print_step "2/10" "Creating application user..."

if id "$APP_USER" &>/dev/null; then
    print_info "User '$APP_USER' already exists"
else
    useradd -r -m -s /bin/bash "$APP_USER"
    print_success "Created user '$APP_USER'"
fi

# ══════════════════════════════════════════════════════════════
# STEP 3: Install Node.js 20 LTS
# ══════════════════════════════════════════════════════════════
print_step "3/10" "Installing Node.js ${NODE_VERSION} LTS..."

if command -v node &>/dev/null; then
    print_info "Node.js already installed: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs
    print_success "Node.js $(node -v) installed"
fi

# Install PM2 globally
npm install -g pm2 >/dev/null 2>&1
print_success "PM2 process manager installed"

# ══════════════════════════════════════════════════════════════
# STEP 4: Install PostgreSQL
# ══════════════════════════════════════════════════════════════
print_step "4/10" "Installing PostgreSQL..."

if command -v psql &>/dev/null; then
    print_info "PostgreSQL already installed"
else
    apt-get install -y -qq postgresql postgresql-contrib
fi

systemctl start postgresql
systemctl enable postgresql >/dev/null 2>&1

# Create database and user
sudo -u postgres psql <<EOF >/dev/null 2>&1
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS ${DB_USER};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

print_success "PostgreSQL configured (database: ${DB_NAME}, user: ${DB_USER})"

# ══════════════════════════════════════════════════════════════
# STEP 5: Install Redis
# ══════════════════════════════════════════════════════════════
print_step "5/10" "Installing Redis..."

if command -v redis-cli &>/dev/null; then
    print_info "Redis already installed"
else
    apt-get install -y -qq redis-server
fi

systemctl start redis-server
systemctl enable redis-server >/dev/null 2>&1
print_success "Redis installed and running"

# ══════════════════════════════════════════════════════════════
# STEP 6: Install Nginx
# ══════════════════════════════════════════════════════════════
print_step "6/10" "Installing Nginx..."

if command -v nginx &>/dev/null; then
    print_info "Nginx already installed"
else
    apt-get install -y -qq nginx
fi

systemctl start nginx
systemctl enable nginx >/dev/null 2>&1
print_success "Nginx installed and running"

# ══════════════════════════════════════════════════════════════
# STEP 7: Configure Firewall
# ══════════════════════════════════════════════════════════════
print_step "7/10" "Configuring firewall..."

ufw --force reset >/dev/null 2>&1
ufw default deny incoming >/dev/null 2>&1
ufw default allow outgoing >/dev/null 2>&1
ufw allow ssh >/dev/null 2>&1
ufw allow 'Nginx Full' >/dev/null 2>&1
ufw --force enable >/dev/null 2>&1

print_success "Firewall configured (SSH, HTTP, HTTPS allowed)"

# ══════════════════════════════════════════════════════════════
# STEP 8: Setup Application
# ══════════════════════════════════════════════════════════════
print_step "8/10" "Setting up application..."

# Ensure app directory exists and has correct permissions
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_fail "package.json not found in $APP_DIR"
    echo -e "  Please clone the repository first:"
    echo -e "  git clone https://github.com/syntex82/WordPress-Node.git $APP_DIR"
    exit 1
fi

# Create .env file
print_info "Creating production environment configuration..."
cat > "$APP_DIR/.env" << ENVEOF
# ═══════════════════════════════════════════════════════════════════════════
# WordPress Node CMS - Production Configuration
# Generated: $(date '+%Y-%m-%d %H:%M:%S')
# Domain: ${DOMAIN}
# ═══════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────
# DATABASE (PostgreSQL)
# ─────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
DIRECT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

# ─────────────────────────────────────────────────────────────
# APPLICATION
# ─────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=${APP_PORT}
HOST=127.0.0.1
APP_URL=https://${DOMAIN}
FRONTEND_URL=https://${DOMAIN}/admin
TRUST_PROXY=true
ENABLE_COMPRESSION=true

# ─────────────────────────────────────────────────────────────
# AUTHENTICATION (auto-generated secure secrets)
# ─────────────────────────────────────────────────────────────
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
SESSION_SECRET=${SESSION_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

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

print_success ".env file created"

# Create required directories
mkdir -p "$APP_DIR"/{uploads,themes,backups,plugins,uploads/videos,uploads/placeholders}

# Set ownership
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
print_success "Directory permissions set"

# Install dependencies as app user
print_info "Installing backend dependencies..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm ci --production=false" >/dev/null 2>&1
print_success "Backend dependencies installed"

print_info "Generating Prisma client..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npx prisma generate" >/dev/null 2>&1
print_success "Prisma client generated"

print_info "Installing admin panel dependencies..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR/admin && npm ci" >/dev/null 2>&1
print_success "Admin dependencies installed"

print_info "Building admin panel..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR/admin && npm run build" >/dev/null 2>&1
print_success "Admin panel built"

print_info "Building backend..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm run build" >/dev/null 2>&1
print_success "Backend built"

print_info "Setting up database schema..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npx prisma db push" >/dev/null 2>&1
print_success "Database schema applied"

print_info "Seeding database..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npx prisma db seed" >/dev/null 2>&1
print_success "Database seeded"

# ══════════════════════════════════════════════════════════════
# STEP 9: Configure Nginx for Domain
# ══════════════════════════════════════════════════════════════
print_step "9/10" "Configuring Nginx for ${DOMAIN}..."

# Remove default config
rm -f /etc/nginx/sites-enabled/default

# Create nginx config for the domain (Hostinger handles SSL termination)
cat > /etc/nginx/sites-available/${DOMAIN} << 'NGINXEOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream backend
upstream wpnode_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml image/svg+xml;
    gzip_comp_level 6;

    # Client body size (for file uploads - 100MB)
    client_max_body_size 100M;

    # Health check endpoint
    location /health {
        proxy_pass http://wpnode_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        access_log off;
    }

    # API endpoints with rate limiting
    location /api {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://wpnode_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Connection "";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Login with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login_limit burst=5 nodelay;

        proxy_pass http://wpnode_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Connection "";
    }

    # Static uploads with caching
    location /uploads {
        alias /var/www/WordPress-Node/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Admin panel (SPA)
    location /admin {
        alias /var/www/WordPress-Node/admin/dist;
        try_files $uri $uri/ /admin/index.html;
        expires 1d;
        add_header Cache-Control "public";
    }

    # Theme assets
    location /themes {
        alias /var/www/WordPress-Node/themes;
        expires 1d;
        add_header Cache-Control "public";
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://wpnode_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # Default - proxy to backend
    location / {
        proxy_pass http://wpnode_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINXEOF

# Replace placeholder with actual domain
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" /etc/nginx/sites-available/${DOMAIN}

# Enable the site
ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/

print_success "Nginx configured for ${DOMAIN}"

# ══════════════════════════════════════════════════════════════
# STEP 10: Setup PM2 & Start Application
# ══════════════════════════════════════════════════════════════
print_step "10/10" "Setting up PM2 and starting application..."

# Test nginx configuration
print_info "Testing Nginx configuration..."
if nginx -t 2>/dev/null; then
    print_success "Nginx configuration valid"
    systemctl reload nginx
    print_success "Nginx reloaded"
else
    print_warn "Nginx configuration has errors - check with: nginx -t"
fi

# Setup PM2
print_info "Configuring PM2 process manager..."

# Create PM2 ecosystem file
cat > "$APP_DIR/ecosystem.config.js" << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'wpnode',
    script: 'dist/main.js',
    cwd: '/var/www/WordPress-Node',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/wpnode/error.log',
    out_file: '/var/log/wpnode/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
PM2EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/ecosystem.config.js"

# Create log directory
mkdir -p /var/log/wpnode
chown "$APP_USER:$APP_USER" /var/log/wpnode

# Start with PM2
sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 start ecosystem.config.js"
sudo -u "$APP_USER" pm2 save

# Setup PM2 startup
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null 2>&1
print_success "PM2 configured and application started"

# Final nginx reload
systemctl reload nginx

# ══════════════════════════════════════════════════════════════
# INSTALLATION COMPLETE
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    ✓ INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  ACCESS URLS                                                                │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo -e "    Website:       https://${DOMAIN}"
echo -e "    Admin Panel:   https://${DOMAIN}/admin"
echo -e "    API:           https://${DOMAIN}/api"
echo -e "    Health Check:  https://${DOMAIN}/health"
echo ""

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  ADMIN CREDENTIALS                                                          │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo -e "    Email:         ${ADMIN_EMAIL}"
echo -e "    Password:      ${ADMIN_PASSWORD}"
echo ""

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  DATABASE CREDENTIALS                                                       │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo -e "    Database:      ${DB_NAME}"
echo -e "    User:          ${DB_USER}"
echo -e "    Password:      ${DB_PASSWORD}"
echo ""

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  USEFUL COMMANDS                                                            │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo -e "    View logs:     sudo -u ${APP_USER} pm2 logs wpnode"
echo -e "    Restart app:   sudo -u ${APP_USER} pm2 restart wpnode"
echo -e "    Stop app:      sudo -u ${APP_USER} pm2 stop wpnode"
echo -e "    App status:    sudo -u ${APP_USER} pm2 status"
echo -e "    Nginx logs:    tail -f /var/log/nginx/error.log"
echo ""

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  IMPORTANT: SAVE THESE CREDENTIALS SECURELY!                                │${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
echo ""

# Save credentials to a file
cat > "$APP_DIR/CREDENTIALS.txt" << CREDSEOF
═══════════════════════════════════════════════════════════════════════════════
WordPress Node CMS - Production Credentials
Domain: ${DOMAIN}
Generated: $(date '+%Y-%m-%d %H:%M:%S')
═══════════════════════════════════════════════════════════════════════════════

ADMIN PANEL
-----------
URL: https://${DOMAIN}/admin
Email: ${ADMIN_EMAIL}
Password: ${ADMIN_PASSWORD}

DATABASE
--------
Host: localhost
Port: 5432
Database: ${DB_NAME}
User: ${DB_USER}
Password: ${DB_PASSWORD}

CONNECTION STRING
-----------------
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

IMPORTANT: Delete this file after saving credentials securely!
═══════════════════════════════════════════════════════════════════════════════
CREDSEOF

chmod 600 "$APP_DIR/CREDENTIALS.txt"
chown root:root "$APP_DIR/CREDENTIALS.txt"

echo -e "${YELLOW}Credentials saved to: $APP_DIR/CREDENTIALS.txt${NC}"
echo -e "${YELLOW}DELETE THIS FILE after saving credentials securely!${NC}"
echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

