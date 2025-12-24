# Fix Update Error - Vite Cache Permission Issues

## Problem
The update failed with permission errors when trying to remove Vite cache files:
```
rm: cannot remove 'node_modules/.vite/deps/...': Permission denied
```

## Solution

### Option 1: Use the Fix Script (Recommended)

SSH into your server and run:

```bash
cd /var/www/WordPress-Node
sudo bash scripts/fix-vite-cache.sh
```

This script will:
- Stop all PM2 processes
- Kill any running Vite/Node processes
- Clear the Vite cache
- Remove and reinstall admin dependencies

After running this, you can run the update again:

```bash
sudo bash scripts/update.sh
```

### Option 2: Manual Fix

If you prefer to fix it manually:

```bash
cd /var/www/WordPress-Node

# Stop all processes
pm2 stop all
pm2 delete all

# Kill any remaining processes
pkill -f "vite" || true
pkill -f "node.*admin" || true

# Wait a moment
sleep 2

# Clear Vite cache
cd admin
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Reinstall dependencies
npm install

# Build admin
npm run build

# Go back to root
cd ..

# Build backend
npm run build

# Restart application
pm2 start ecosystem.config.js
pm2 save
```

### Option 3: Quick Fix (If you just want to get it running)

```bash
cd /var/www/WordPress-Node/admin
sudo rm -rf node_modules/.vite
sudo rm -rf .vite
npm install
npm run build
cd ..
npm run build
pm2 restart all
```

## Prevention

The updated `scripts/update.sh` now automatically:
- Stops PM2 processes before updating
- Clears Vite cache before installing dependencies
- Provides better error messages

This should prevent this issue from happening in future updates.

## What Changed

The emoji fix has been successfully deployed! The changes include:
- ✅ Emoji font support added to CSS
- ✅ Tailwind config updated with emoji fonts
- ✅ HTML meta tags updated for proper UTF-8 encoding

Once you complete the update, emojis will display properly in messages! 🎉

