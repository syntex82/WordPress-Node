# Reels Feature - Hostinger VPS Deployment Guide

## Quick Start

This guide will help you deploy the Reels feature to your Hostinger VPS running NodePress.

## Prerequisites

- Hostinger VPS with Ubuntu 22.04+
- NodePress already installed and running
- At least 10GB free disk space
- SSH access to your VPS
- Domain configured with SSL

## Pre-Deployment Checklist

Run these commands to verify your system is ready:

```bash
# Check disk space (need at least 10GB free)
df -h

# Check memory
free -h

# Check Node.js version (should be 20+)
node --version

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql
```

## Step-by-Step Deployment

### Step 1: Update Nginx Configuration

```bash
# Edit your Nginx site configuration
sudo nano /etc/nginx/sites-available/nodepress.co.uk
```

Add these lines inside the `server` block (before any `location` blocks):

```nginx
# Support for large video uploads
client_max_body_size 100M;
client_body_timeout 300s;
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;

# Video file caching
location /uploads/reels {
    alias /var/www/NodePress/public/uploads/reels;
    expires 7d;
    add_header Cache-Control "public, immutable";
    add_header Accept-Ranges bytes;
    access_log off;
}
```

Test and reload Nginx:

```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

### Step 2: Deploy the Code

```bash
# Navigate to your app directory
cd /var/www/NodePress

# Stash any local changes
git stash

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run database migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Build the backend
npm run build

# Build admin panel
cd admin
npm install
npm run build
cd ..
```

### Step 3: Set Up Uploads Directory

```bash
# Create reels upload directory
mkdir -p public/uploads/reels

# Set proper permissions
chmod 755 public/uploads/reels
chown nodepress:nodepress public/uploads/reels

# Verify permissions
ls -la public/uploads/
```

### Step 4: Restart Application

```bash
# Restart PM2 process
pm2 restart nodepress

# Save PM2 configuration
pm2 save

# Check status
pm2 status

# View logs to ensure no errors
pm2 logs nodepress --lines 50
```

### Step 5: Verify Deployment

```bash
# Test API endpoint
curl http://localhost:3000/api/reels

# Check if endpoint returns JSON (should see empty array or reels)
# Expected: {"reels":[],"pagination":{...}}

# Test from external domain
curl https://nodepress.co.uk/api/reels
```

## Post-Deployment Configuration

### Set Up Monitoring

Create a monitoring script:

```bash
# Create script
nano ~/monitor-reels.sh
```

Add this content:

```bash
#!/bin/bash
echo "🎬 Reels System Status"
echo "======================"
echo ""
echo "💾 Disk Usage:"
df -h /var/www/NodePress/public/uploads
echo ""
echo "📁 Reels Directory:"
du -sh /var/www/NodePress/public/uploads/reels
echo ""
echo "📊 File Count:"
find /var/www/NodePress/public/uploads/reels -type f | wc -l
echo ""
echo "🔄 PM2 Status:"
pm2 status nodepress
```

Make it executable:

```bash
chmod +x ~/monitor-reels.sh
```

Run it anytime:

```bash
~/monitor-reels.sh
```

### Set Up Automatic Backups

```bash
# Create backup script
nano ~/backup-reels.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/reels"
SOURCE_DIR="/var/www/NodePress/public/uploads/reels"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/reels_$DATE.tar.gz" "$SOURCE_DIR"

# Keep only last 7 days
find "$BACKUP_DIR" -name "reels_*.tar.gz" -mtime +7 -delete

echo "✅ Backup complete: reels_$DATE.tar.gz"
```

Make executable and schedule:

```bash
chmod +x ~/backup-reels.sh

# Schedule daily at 3 AM
crontab -e
# Add: 0 3 * * * /home/nodepress/backup-reels.sh >> /var/log/reels-backup.log 2>&1
```

## Testing the Feature

### 1. Access the Reels Page

Open your browser and navigate to:
```
https://nodepress.co.uk/reels
```

### 2. Create a Test Reel

Navigate to:
```
https://nodepress.co.uk/reels/create
```

Upload a short video (under 100MB) and test the upload functionality.

### 3. Test API Endpoints

```bash
# List reels
curl https://nodepress.co.uk/api/reels

# Get specific reel (replace ID)
curl https://nodepress.co.uk/api/reels/REEL_ID
```

## Common Issues and Solutions

### Issue: 413 Request Entity Too Large

**Cause:** Nginx upload size limit too small

**Solution:**
```bash
sudo nano /etc/nginx/sites-available/nodepress.co.uk
# Add: client_max_body_size 100M;
sudo nginx -t && sudo systemctl reload nginx
```

### Issue: Upload Timeout

**Cause:** Timeout values too low

**Solution:**
```bash
sudo nano /etc/nginx/sites-available/nodepress.co.uk
# Add timeout directives (see Step 1)
sudo systemctl reload nginx
```

### Issue: Permission Denied

**Cause:** Wrong file permissions

**Solution:**
```bash
sudo chown -R nodepress:nodepress /var/www/NodePress/public/uploads/reels
sudo chmod -R 755 /var/www/NodePress/public/uploads/reels
```

### Issue: Videos Not Playing

**Cause:** MIME types not configured

**Solution:**
```bash
# Check Nginx MIME types
sudo nano /etc/nginx/mime.types
# Ensure these are present:
# video/mp4    mp4;
# video/webm   webm;
# video/quicktime mov;
```

### Issue: Out of Disk Space

**Solution:**
```bash
# Check usage
df -h

# Find large files
du -sh /var/www/NodePress/public/uploads/reels/*

# Clean up if needed
# (Be careful - this deletes files!)
find /var/www/NodePress/public/uploads/reels -type f -mtime +90 -delete
```

## Performance Optimization

### Enable PM2 Cluster Mode

```bash
# Edit ecosystem config
nano /var/www/NodePress/ecosystem.config.js
```

Update to use cluster mode:

```javascript
module.exports = {
  apps: [{
    name: 'nodepress',
    script: 'dist/main.js',
    cwd: '/var/www/NodePress',
    instances: 2,  // Use 2 CPU cores
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Restart:

```bash
pm2 delete nodepress
pm2 start ecosystem.config.js
pm2 save
```

## Upgrading to Cloud Storage (Recommended)

For better scalability, use cloud storage instead of local storage.

### Option 1: Cloudflare R2 (Recommended)

1. Create R2 bucket at dash.cloudflare.com
2. Generate API token
3. Update `.env`:

```bash
nano /var/www/NodePress/.env
```

Add:

```env
STORAGE_PROVIDER=s3
S3_BUCKET=your-bucket-name
S3_REGION=auto
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

Restart:

```bash
pm2 restart nodepress
```

## Maintenance

### Weekly Tasks

```bash
# Check disk usage
~/monitor-reels.sh

# Check logs
pm2 logs nodepress --lines 100

# Check for errors
sudo tail -f /var/log/nginx/error.log
```

### Monthly Tasks

```bash
# Update dependencies
cd /var/www/NodePress
npm update
cd admin && npm update && cd ..

# Rebuild
npm run build
cd admin && npm run build && cd ..

# Restart
pm2 restart nodepress
```

## Support

If you encounter issues:

1. Check logs: `pm2 logs nodepress`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify disk space: `df -h`
4. Check permissions: `ls -la /var/www/NodePress/public/uploads/reels`

## Next Steps

- Set up CDN for video delivery (Cloudflare)
- Implement video transcoding (Mux, Cloudinary)
- Add content moderation
- Set up analytics tracking
- Configure automatic cleanup policies

---

**Deployment Complete!** 🎉

Your Reels feature is now live at: `https://nodepress.co.uk/reels`

