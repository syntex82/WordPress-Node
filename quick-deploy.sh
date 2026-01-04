#!/bin/bash

# Quick Deployment Script - Matches your exact commands
# Run this on your server

echo "🚀 Quick Deploy - NodePress"
echo "============================"

cd /var/www/WordPress-Node
git pull
cd admin
rm -rf node_modules/.vite dist
npm run build
pm2 restart nodepress
sudo systemctl reload nginx

echo ""
echo "✅ Deployment complete!"
echo "Check status: pm2 status"

