#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
# Reels Feature Deployment Script for Hostinger VPS
# 
# This script deploys the Reels feature to your NodePress installation
# 
# Usage:
#   chmod +x scripts/deploy-reels.sh
#   ./scripts/deploy-reels.sh
#═══════════════════════════════════════════════════════════════════════════════

set -e

# ══════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════
APP_DIR="/var/www/NodePress"
APP_USER="nodepress"
UPLOADS_DIR="$APP_DIR/public/uploads/reels"

# ══════════════════════════════════════════════════════════════
# COLORS
# ══════════════════════════════════════════════════════════════
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ══════════════════════════════════════════════════════════════
# FUNCTIONS
# ══════════════════════════════════════════════════════════════
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# ══════════════════════════════════════════════════════════════
# PRE-DEPLOYMENT CHECKS
# ══════════════════════════════════════════════════════════════
print_header "🎬 Reels Feature Deployment"
echo ""

print_info "Running pre-deployment checks..."

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    print_error "App directory not found: $APP_DIR"
    exit 1
fi

# Check disk space (need at least 5GB free)
AVAILABLE_SPACE=$(df "$APP_DIR" | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 5242880 ]; then
    print_warning "Low disk space! Less than 5GB available"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_success "Pre-deployment checks passed"
echo ""

# ══════════════════════════════════════════════════════════════
# PULL LATEST CODE
# ══════════════════════════════════════════════════════════════
print_info "Pulling latest code..."
cd "$APP_DIR"

# Stash any local changes
git stash > /dev/null 2>&1 || true

# Pull latest
if git pull origin main; then
    print_success "Code updated successfully"
else
    print_error "Failed to pull latest code"
    exit 1
fi
echo ""

# ══════════════════════════════════════════════════════════════
# INSTALL DEPENDENCIES
# ══════════════════════════════════════════════════════════════
print_info "Installing backend dependencies..."
if npm install; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
echo ""

# ══════════════════════════════════════════════════════════════
# DATABASE MIGRATION
# ══════════════════════════════════════════════════════════════
print_info "Running database migrations..."
if npx prisma migrate deploy; then
    print_success "Database migrations completed"
else
    print_error "Database migration failed"
    exit 1
fi

print_info "Generating Prisma client..."
if npx prisma generate; then
    print_success "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi
echo ""

# ══════════════════════════════════════════════════════════════
# BUILD BACKEND
# ══════════════════════════════════════════════════════════════
print_info "Building backend..."
if npm run build; then
    print_success "Backend built successfully"
else
    print_error "Backend build failed"
    exit 1
fi
echo ""

# ══════════════════════════════════════════════════════════════
# BUILD ADMIN PANEL
# ══════════════════════════════════════════════════════════════
print_info "Building admin panel..."
cd admin

if npm install; then
    print_success "Admin dependencies installed"
else
    print_error "Failed to install admin dependencies"
    exit 1
fi

if npm run build; then
    print_success "Admin panel built successfully"
else
    print_error "Admin panel build failed"
    exit 1
fi

cd ..
echo ""

# ══════════════════════════════════════════════════════════════
# SETUP UPLOADS DIRECTORY
# ══════════════════════════════════════════════════════════════
print_info "Setting up uploads directory..."

# Create directory
mkdir -p "$UPLOADS_DIR"

# Set permissions
chmod 755 "$UPLOADS_DIR"

# Set ownership (only if we have sudo access)
if sudo -n true 2>/dev/null; then
    sudo chown "$APP_USER:$APP_USER" "$UPLOADS_DIR"
    print_success "Uploads directory configured with proper ownership"
else
    print_warning "Could not set ownership (no sudo access)"
    print_info "Run manually: sudo chown $APP_USER:$APP_USER $UPLOADS_DIR"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# RESTART APPLICATION
# ══════════════════════════════════════════════════════════════
print_info "Restarting application..."

if pm2 restart nodepress; then
    print_success "Application restarted"
else
    print_error "Failed to restart application"
    exit 1
fi

if pm2 save; then
    print_success "PM2 configuration saved"
else
    print_warning "Failed to save PM2 configuration"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# RELOAD NGINX
# ══════════════════════════════════════════════════════════════
print_info "Reloading Nginx..."

if sudo -n systemctl reload nginx 2>/dev/null; then
    print_success "Nginx reloaded"
else
    print_warning "Could not reload Nginx (no sudo access)"
    print_info "Run manually: sudo systemctl reload nginx"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# DEPLOYMENT SUMMARY
# ══════════════════════════════════════════════════════════════
print_header "✅ Deployment Complete!"
echo ""

print_info "Application Status:"
pm2 status nodepress
echo ""

print_info "Recent Logs:"
pm2 logs nodepress --lines 10 --nostream
echo ""

print_info "Disk Usage:"
df -h "$APP_DIR/public/uploads"
echo ""

print_header "🎉 Reels Feature Deployed Successfully!"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Test the feature at: https://your-domain.com/reels"
echo "2. Create a test reel at: https://your-domain.com/reels/create"
echo "3. Monitor logs: pm2 logs nodepress"
echo "4. Check storage: du -sh $UPLOADS_DIR"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "- Ensure Nginx is configured for large uploads (100MB)"
echo "- Monitor disk space regularly"
echo "- Consider migrating to cloud storage for production"
echo ""

