#!/bin/bash

# Fix Vite Cache Permission Issues
# This script stops the dev server, clears Vite cache, and reinstalls admin dependencies

set -e

echo "🔧 Fixing Vite cache permission issues..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADMIN_DIR="$PROJECT_ROOT/admin"

echo -e "${YELLOW}Project root: $PROJECT_ROOT${NC}"

# Stop any running PM2 processes that might be locking files
echo "Stopping PM2 processes..."
pm2 stop all || true
pm2 delete all || true

# Kill any node processes that might be running
echo "Killing any remaining node processes..."
pkill -f "vite" || true
pkill -f "node.*admin" || true

# Wait a moment for processes to fully stop
sleep 2

# Navigate to admin directory
cd "$ADMIN_DIR"

# Remove Vite cache with force
echo "Removing Vite cache..."
rm -rf node_modules/.vite || true
rm -rf .vite || true
rm -rf dist || true

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Remove node_modules completely
echo "Removing node_modules..."
rm -rf node_modules || true

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install --quiet --no-progress 2>&1 | tail -n 20

echo -e "${GREEN}✓ Vite cache fixed successfully!${NC}"
echo ""
echo "You can now run the update again or start the application."

