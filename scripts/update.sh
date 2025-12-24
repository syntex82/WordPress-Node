#!/bin/bash
#
# WordPress Node CMS - Update Script
# Updates the installation to the latest version from GitHub
#
# Usage: sudo ./scripts/update.sh
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       WordPress Node CMS - Update Script                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$APP_DIR"

# Check current version
CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
echo -e "${YELLOW}Current version: ${CURRENT_VERSION}${NC}"

# Create backup before update
echo -e "${BLUE}[1/6]${NC} Creating backup before update..."
BACKUP_DIR="$APP_DIR/backups/pre-update-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r dist "$BACKUP_DIR/dist" 2>/dev/null || true
cp -r admin/dist "$BACKUP_DIR/admin-dist" 2>/dev/null || true
cp .env "$BACKUP_DIR/.env" 2>/dev/null || true
cp package.json "$BACKUP_DIR/package.json"
echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"

# Pull latest changes
echo -e "${BLUE}[2/6]${NC} Pulling latest changes from GitHub..."
git stash 2>/dev/null || true
if git pull origin main; then
    echo -e "${GREEN}✓ Code updated${NC}"
else
    echo -e "${RED}✗ Failed to pull changes${NC}"
    exit 1
fi

# Check new version
NEW_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
echo -e "${YELLOW}New version: ${NEW_VERSION}${NC}"

# Install backend dependencies
echo -e "${BLUE}[3/6]${NC} Installing backend dependencies..."
if npm install --production=false --quiet --no-progress 2>&1 | tail -n 20; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi

# Install admin dependencies
echo -e "${BLUE}[4/6]${NC} Installing admin dependencies..."
cd admin

# Stop any processes that might be locking files
echo "Stopping any running processes..."
pm2 stop all 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Clear Vite cache to avoid permission issues
echo "Clearing Vite cache..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf .vite 2>/dev/null || true

if npm install --quiet --no-progress 2>&1 | tail -n 20; then
    echo -e "${GREEN}✓ Admin dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install admin dependencies${NC}"
    echo -e "${YELLOW}Tip: If you see permission errors, run: sudo bash scripts/fix-vite-cache.sh${NC}"
    exit 1
fi

# Build admin panel
echo -e "${BLUE}[5/6]${NC} Building admin panel..."

# Clear build cache
rm -rf dist 2>/dev/null || true

if npm run build 2>&1 | grep -E "(built|error|warning)" | tail -n 10; then
    if [ -f "dist/index.html" ]; then
        echo -e "${GREEN}✓ Admin panel built${NC}"
    else
        echo -e "${RED}✗ Admin build output missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Failed to build admin panel${NC}"
    exit 1
fi

# Build backend
cd "$APP_DIR"
echo -e "${BLUE}[6/6]${NC} Building backend..."
if npm run build 2>&1 | grep -E "(Compiled|error|warning)" | tail -n 10; then
    if [ -f "dist/main.js" ]; then
        echo -e "${GREEN}✓ Backend built${NC}"
    else
        echo -e "${RED}✗ Backend build output missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Failed to build backend${NC}"
    exit 1
fi

# Run database migrations
echo -e "${BLUE}[+]${NC} Applying database migrations..."
npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push
echo -e "${GREEN}✓ Database schema updated${NC}"

# Restart service if running as systemd
if systemctl is-active --quiet wordpress-node 2>/dev/null; then
    echo -e "${BLUE}[+]${NC} Restarting service..."
    sudo systemctl restart wordpress-node
    echo -e "${GREEN}✓ Service restarted${NC}"
else
    echo -e "${YELLOW}Note: Restart the server manually to apply changes${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Update Complete!                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo -e "Updated from ${YELLOW}${CURRENT_VERSION}${NC} to ${GREEN}${NEW_VERSION}${NC}"
echo -e "Backup saved at: ${BLUE}${BACKUP_DIR}${NC}"
echo ""

