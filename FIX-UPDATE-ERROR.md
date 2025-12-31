# Fix Update Errors

## Common Update Errors

### Error 1: Vite Cache Permission Issues
```
rm: cannot remove 'node_modules/.vite/deps/...': Permission denied
```

### Error 2: stderr maxBuffer length exceeded
```
Error: stderr maxBuffer length exceeded
```
This happens when npm install produces too much output.

## Solution for Both Errors

### Option 1: Pull Latest Fix and Run Update (Recommended)

The latest update includes fixes for both errors. SSH into your server and run:

```bash
cd /var/www/NodePress

# Pull the latest fixes
git pull origin main

# Run the update (now with fixes for both errors)
sudo bash scripts/update.sh
```

The updated script now:
- Suppresses verbose npm output (fixes maxBuffer error)
- Stops PM2 processes before updating
- Clears Vite cache automatically
- Shows only relevant output

### Option 2: Use the Fix Script First (If update still fails)

```bash
cd /var/www/NodePress
sudo bash scripts/fix-vite-cache.sh
sudo bash scripts/update.sh
```

### Option 3: Manual Fix

If you prefer to fix it manually:

```bash
cd /var/www/NodePress

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

### Option 4: Quick Fix (If you just want to get it running)

```bash
cd /var/www/NodePress/admin
sudo rm -rf node_modules/.vite
sudo rm -rf .vite
npm install --quiet --no-progress
npm run build
cd ..
npm run build
pm2 restart all
```

## Prevention

The updated `scripts/update.sh` (commit 7aab6c1) now automatically:
- ✅ Suppresses verbose npm output (fixes maxBuffer error)
- ✅ Stops PM2 processes before updating
- ✅ Clears Vite cache before installing dependencies
- ✅ Shows only last 10-20 lines of output
- ✅ Provides better error messages

This should prevent both errors from happening in future updates.

## What Changed

The emoji fix has been successfully deployed! The changes include:
- ✅ Emoji font support added to CSS
- ✅ Tailwind config updated with emoji fonts
- ✅ HTML meta tags updated for proper UTF-8 encoding

Once you complete the update, emojis will display properly in messages! 🎉

