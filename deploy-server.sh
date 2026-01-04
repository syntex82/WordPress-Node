#!/bin/bash

# NodePress Deployment Script
# Run this on your server to deploy the latest changes

set -e  # Exit on any error

echo "🚀 Starting NodePress deployment..."
echo "=================================="

# Step 1: Navigate to application directory
echo ""
echo "📁 Step 1: Navigating to application directory..."
cd /var/www/WordPress-Node || { echo "❌ Failed to navigate to /var/www/WordPress-Node"; exit 1; }
echo "✅ Current directory: $(pwd)"

# Step 2: Pull latest changes from Git
echo ""
echo "📥 Step 2: Pulling latest changes from Git..."
git pull || { echo "❌ Git pull failed"; exit 1; }
echo "✅ Git pull successful"

# Step 3: Install backend dependencies (if needed)
echo ""
echo "📦 Step 3: Installing backend dependencies..."
npm install || { echo "❌ Backend npm install failed"; exit 1; }
echo "✅ Backend dependencies installed"

# Step 4: Run database migration
echo ""
echo "🗄️ Step 4: Running database migration..."
npx prisma migrate deploy || { echo "❌ Database migration failed"; exit 1; }
echo "✅ Database migration successful"

# Step 5: Generate Prisma Client
echo ""
echo "🔧 Step 5: Generating Prisma Client..."
npx prisma generate || { echo "❌ Prisma generate failed"; exit 1; }
echo "✅ Prisma Client generated"

# Step 6: Build backend
echo ""
echo "🔨 Step 6: Building backend..."
npm run build || { echo "❌ Backend build failed"; exit 1; }
echo "✅ Backend build successful"

# Step 7: Navigate to admin directory
echo ""
echo "📁 Step 7: Navigating to admin directory..."
cd admin || { echo "❌ Failed to navigate to admin directory"; exit 1; }
echo "✅ Current directory: $(pwd)"

# Step 8: Clean admin build cache
echo ""
echo "🧹 Step 8: Cleaning admin build cache..."
rm -rf node_modules/.vite dist || { echo "⚠️ Warning: Failed to clean cache (may not exist)"; }
echo "✅ Admin cache cleaned"

# Step 9: Install admin dependencies
echo ""
echo "📦 Step 9: Installing admin dependencies..."
npm install || { echo "❌ Admin npm install failed"; exit 1; }
echo "✅ Admin dependencies installed"

# Step 10: Build admin frontend
echo ""
echo "🔨 Step 10: Building admin frontend..."
npm run build || { echo "❌ Admin build failed"; exit 1; }
echo "✅ Admin build successful"

# Step 11: Return to root directory
echo ""
echo "📁 Step 11: Returning to root directory..."
cd /var/www/WordPress-Node || { echo "❌ Failed to return to root"; exit 1; }
echo "✅ Current directory: $(pwd)"

# Step 12: Restart PM2
echo ""
echo "♻️ Step 12: Restarting PM2 application..."
pm2 restart nodepress || { echo "❌ PM2 restart failed"; exit 1; }
echo "✅ PM2 restarted successfully"

# Step 13: Reload Nginx
echo ""
echo "🔄 Step 13: Reloading Nginx..."
sudo systemctl reload nginx || { echo "❌ Nginx reload failed"; exit 1; }
echo "✅ Nginx reloaded successfully"

# Step 14: Check PM2 status
echo ""
echo "📊 Step 14: Checking PM2 status..."
pm2 status

# Step 15: Show recent logs
echo ""
echo "📝 Step 15: Recent application logs..."
pm2 logs nodepress --lines 20 --nostream

echo ""
echo "=================================="
echo "🎉 Deployment completed successfully!"
echo "=================================="
echo ""
echo "📋 Next steps:"
echo "  1. Visit your admin panel: https://your-domain.com/admin"
echo "  2. Test course pricing: LMS > Courses"
echo "  3. Test product variants: Shop > Products"
echo "  4. Test certificate templates: LMS > Certificate Templates"
echo ""
echo "🔍 To monitor logs: pm2 logs nodepress"
echo "📊 To check status: pm2 status"
echo ""

