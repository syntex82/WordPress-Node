# Reels Feature Implementation Guide

## Overview
This guide documents the implementation of the Reels feature - a TikTok/Instagram Reels-style short-form video content system for the platform.

## Database Schema

### Models Added to Prisma Schema

1. **Reel** - Main reel model
   - Video URL, thumbnail, caption
   - Duration (15-60 seconds)
   - Engagement metrics (views, likes, comments, shares)
   - Audio/music information
   - Privacy settings

2. **ReelLike** - Like tracking
   - User-to-reel relationship
   - Unique constraint to prevent duplicate likes

3. **ReelComment** - Comments system
   - Nested replies support
   - Like count for comments
   - User relationship

4. **ReelView** - View tracking
   - Tracks watch time and completion
   - Supports both authenticated and anonymous users
   - IP-based tracking for anonymous views

5. **ReelHashtag** - Hashtag system
   - Links reels to hashtags
   - Reuses existing Hashtag model

## API Endpoints

### Reels Management

#### GET /api/reels
Get reels feed with pagination
- Query params: `page`, `limit`, `userId`
- Returns: Array of reels with user info and engagement counts
- Includes `isLiked` status for authenticated users

#### POST /api/reels
Create a new reel
- Requires authentication
- Body: video URL, thumbnail, caption, duration, hashtags, etc.
- Automatically processes hashtags

#### GET /api/reels/[id]
Get a single reel by ID
- Returns: Reel details with hashtags and engagement counts
- Includes `isLiked` status for authenticated users

#### PATCH /api/reels/[id]
Update a reel (caption, privacy)
- Requires authentication and ownership
- Only allows updating caption and isPublic fields

#### DELETE /api/reels/[id]
Delete a reel
- Requires authentication and ownership
- Cascade deletes all related data

### Engagement Endpoints

#### POST /api/reels/[id]/like
Like a reel
- Requires authentication
- Increments like count
- Prevents duplicate likes

#### DELETE /api/reels/[id]/like
Unlike a reel
- Requires authentication
- Decrements like count

#### GET /api/reels/[id]/comments
Get comments for a reel
- Pagination support
- Returns top-level comments with nested replies
- Shows first 3 replies per comment

#### POST /api/reels/[id]/comments
Create a comment or reply
- Requires authentication
- Supports nested replies via `parentId`
- Increments reel comment count

#### POST /api/reels/[id]/view
Track a view
- Tracks watch time and completion status
- Supports both authenticated and anonymous users
- Updates existing view or creates new one
- Increments view count on first view

### Upload Endpoint

#### POST /api/reels/upload
Upload video and thumbnail
- Requires authentication
- Accepts multipart/form-data
- Validates file type (MP4, MOV, WebM)
- Max file size: 100MB
- Saves to `/public/uploads/reels/`
- Returns video URL and metadata

## Frontend Components

### Pages

1. **app/(dashboard)/reels/page.tsx**
   - Main reels feed page
   - Vertical scrolling video player
   - TikTok-style UI with overlay controls
   - Auto-play current video
   - Like, comment, share buttons
   - Mute/unmute toggle
   - View tracking

2. **app/(dashboard)/reels/create/page.tsx**
   - Reel creation form
   - Video upload with preview
   - Optional thumbnail upload
   - Caption editor (max 2200 chars)
   - Hashtag input
   - Privacy toggle
   - Upload progress indicator

3. **app/(dashboard)/reels/[id]/comments/page.tsx**
   - Comments view for a reel
   - Nested comment threads
   - Reply functionality
   - Real-time comment posting

## Features

### Video Player
- Auto-play on scroll
- Loop playback
- Mute/unmute control
- Poster image support
- Watch time tracking

### Engagement
- Like/unlike with optimistic updates
- Comment with nested replies
- View tracking with completion status
- Share functionality (placeholder)

### Content Discovery
- Hashtag support
- User profile integration
- Public/private reels

### Analytics
- View count
- Watch time tracking
- Completion rate
- Like and comment counts

## Migration

To apply the database changes:

```bash
npx prisma migrate dev --name add_reels_feature
npx prisma generate
```

## Next Steps

1. **Video Processing**
   - Integrate video transcoding service (e.g., Mux, Cloudinary)
   - Generate thumbnails automatically
   - Optimize video for mobile playback

2. **Enhanced Features**
   - Audio library for background music
   - Video effects and filters
   - Duet/stitch functionality
   - Trending reels algorithm

3. **Performance**
   - Implement CDN for video delivery
   - Add video preloading
   - Optimize mobile data usage

4. **Moderation**
   - Content reporting system
   - Automated content moderation
   - Admin review queue

5. **Navigation**
   - Add Reels link to main navigation
   - Create dedicated Reels icon/button
   - Add to user profile

## File Structure

```
src/modules/reels/
├── reels.module.ts              # NestJS module definition
├── reels.controller.ts          # API endpoints
├── reels.service.ts             # Business logic
└── dto/
    └── create-reel.dto.ts       # Data transfer objects

prisma/schema.prisma             # Database models (Reel, ReelLike, etc.)
public/uploads/reels/            # Video file storage
```

## API Endpoints (NestJS)

The Reels feature uses NestJS controllers matching the rest of the application:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reels` | Get reels feed (paginated) |
| GET | `/api/reels/:id` | Get single reel |
| POST | `/api/reels` | Create new reel |
| POST | `/api/reels/upload` | Upload video file |
| PATCH | `/api/reels/:id` | Update reel |
| DELETE | `/api/reels/:id` | Delete reel |
| POST | `/api/reels/:id/like` | Like a reel |
| DELETE | `/api/reels/:id/like` | Unlike a reel |
| GET | `/api/reels/:id/comments` | Get comments |
| POST | `/api/reels/:id/comments` | Create comment |
| POST | `/api/reels/:id/view` | Track view |

## Dependencies

All required dependencies are already installed:
- NestJS 11+
- Prisma
- NextAuth
- Zod (validation)
- date-fns (date formatting)
- Lucide React (icons)
- Sonner (toast notifications)

## Deployment on Hostinger VPS

### Prerequisites Check

Before deploying, verify your VPS has adequate resources:

```bash
# Check disk space (need at least 10GB free for videos)
df -h

# Check memory
free -h

# Check current app status
pm2 status
```

### Deployment Steps

#### 1. Update Nginx Configuration

Add support for large video uploads:

```bash
# Edit your Nginx site configuration
sudo nano /etc/nginx/sites-available/nodepress.co.uk

# Add these lines inside the server block:
client_max_body_size 100M;
client_body_timeout 300s;
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 2. Deploy the Code

```bash
# Navigate to your app directory
cd /var/www/NodePress

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Run database migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Build the backend
npm run build

# Build the admin panel
cd admin
npm install
npm run build
cd ..

# Create uploads directory for reels
mkdir -p public/uploads/reels
chmod 755 public/uploads/reels
chown nodepress:nodepress public/uploads/reels

# Restart the application
pm2 restart nodepress

# Save PM2 configuration
pm2 save
```

#### 3. Verify Deployment

```bash
# Check app status
pm2 status

# Check logs for errors
pm2 logs nodepress --lines 50

# Test the API endpoint
curl http://localhost:3000/api/reels

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Quick Deploy Script

Create a deployment script for easy updates:

```bash
# Create the script
nano ~/deploy-reels.sh
```

Add this content:

```bash
#!/bin/bash
#═══════════════════════════════════════════════════════════════
# Reels Feature Deployment Script for Hostinger VPS
#═══════════════════════════════════════════════════════════════

set -e

APP_DIR="/var/www/NodePress"
APP_USER="nodepress"

echo "🎬 Deploying Reels Feature..."
echo "================================"

# Navigate to app directory
cd "$APP_DIR"

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy
npx prisma generate

# Build backend
echo "🔨 Building backend..."
npm run build

# Build admin panel
echo "🎨 Building admin panel..."
cd admin
npm install
npm run build
cd ..

# Create uploads directory
echo "📁 Setting up uploads directory..."
mkdir -p public/uploads/reels
chmod 755 public/uploads/reels
chown "$APP_USER:$APP_USER" public/uploads/reels

# Restart application
echo "🔄 Restarting application..."
pm2 restart nodepress
pm2 save

# Reload Nginx
echo "🌐 Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Reels feature deployed successfully!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "🔍 Recent Logs:"
pm2 logs nodepress --lines 10 --nostream

echo ""
echo "💾 Disk Usage:"
df -h "$APP_DIR/public/uploads"

echo ""
echo "🎉 Deployment Complete!"
```

Make it executable:

```bash
chmod +x ~/deploy-reels.sh
```

Run it:

```bash
~/deploy-reels.sh
```

### Storage Management

#### Monitor Disk Usage

Create a monitoring script:

```bash
nano ~/monitor-reels-storage.sh
```

Add this content:

```bash
#!/bin/bash
#═══════════════════════════════════════════════════════════════
# Reels Storage Monitoring Script
#═══════════════════════════════════════════════════════════════

UPLOADS_DIR="/var/www/NodePress/public/uploads/reels"
THRESHOLD=80  # Alert if disk usage exceeds 80%

echo "🎬 Reels Storage Report"
echo "================================"
echo ""

# Disk usage
echo "💾 Disk Usage:"
df -h "$UPLOADS_DIR"
echo ""

# Reels directory size
echo "📁 Reels Directory Size:"
du -sh "$UPLOADS_DIR"
echo ""

# Number of files
echo "📊 File Count:"
find "$UPLOADS_DIR" -type f | wc -l
echo ""

# Largest files
echo "📈 Top 10 Largest Files:"
find "$UPLOADS_DIR" -type f -exec ls -lh {} \; | sort -k5 -hr | head -10
echo ""

# Check if threshold exceeded
USAGE=$(df "$UPLOADS_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "⚠️  WARNING: Disk usage is at ${USAGE}%!"
    echo "Consider cleaning up old files or upgrading storage."
fi

echo ""
echo "✅ Report Complete"
```

Make it executable:

```bash
chmod +x ~/monitor-reels-storage.sh
```

Run it:

```bash
~/monitor-reels-storage.sh
```

#### Set Up Automatic Cleanup (Optional)

Create a cleanup script for old reels:

```bash
nano ~/cleanup-old-reels.sh
```

Add this content:

```bash
#!/bin/bash
#═══════════════════════════════════════════════════════════════
# Cleanup Old Reels (older than 90 days)
#═══════════════════════════════════════════════════════════════

UPLOADS_DIR="/var/www/NodePress/public/uploads/reels"
DAYS_OLD=90

echo "🧹 Cleaning up reels older than $DAYS_OLD days..."

# Find and delete files older than specified days
find "$UPLOADS_DIR" -type f -mtime +$DAYS_OLD -delete

echo "✅ Cleanup complete!"
```

Schedule it with cron:

```bash
# Edit crontab
crontab -e

# Add this line to run cleanup weekly on Sunday at 2 AM
0 2 * * 0 /home/nodepress/cleanup-old-reels.sh >> /var/log/reels-cleanup.log 2>&1
```

### Performance Optimization

#### 1. Enable Nginx Caching for Videos

Add to your Nginx configuration:

```nginx
# Video caching
location /uploads/reels {
    alias /var/www/NodePress/public/uploads/reels;
    expires 7d;
    add_header Cache-Control "public, immutable";
    access_log off;

    # Enable range requests for video seeking
    add_header Accept-Ranges bytes;
}
```

#### 2. Enable Gzip Compression

Add to Nginx configuration:

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript
           application/json application/javascript application/xml+rss;
```

#### 3. PM2 Cluster Mode

Update your PM2 ecosystem file for better performance:

```javascript
// /var/www/NodePress/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'nodepress',
    script: 'dist/main.js',
    cwd: '/var/www/NodePress',
    instances: 2,  // Use 2 instances for better performance
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/nodepress/error.log',
    out_file: '/var/log/nodepress/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Restart with new config:

```bash
pm2 delete nodepress
pm2 start ecosystem.config.js
pm2 save
```

### Troubleshooting

#### Issue: Upload fails with 413 error

**Solution:** Increase Nginx upload size limit

```bash
sudo nano /etc/nginx/sites-available/nodepress.co.uk
# Add: client_max_body_size 100M;
sudo nginx -t
sudo systemctl reload nginx
```

#### Issue: Upload times out

**Solution:** Increase timeout values

```bash
sudo nano /etc/nginx/sites-available/nodepress.co.uk
# Add these lines:
# client_body_timeout 300s;
# proxy_read_timeout 300s;
sudo systemctl reload nginx
```

#### Issue: Out of disk space

**Solution:** Check and clean up

```bash
# Check disk usage
df -h

# Find large files
du -sh /var/www/NodePress/public/uploads/reels/*

# Clean up old files
~/cleanup-old-reels.sh
```

#### Issue: Videos not playing

**Solution:** Check file permissions

```bash
# Fix permissions
sudo chown -R nodepress:nodepress /var/www/NodePress/public/uploads/reels
sudo chmod -R 755 /var/www/NodePress/public/uploads/reels
```

#### Issue: Migration fails

**Solution:** Check database connection

```bash
# Test database connection
npx prisma db pull

# Check database status
sudo systemctl status postgresql

# View migration status
npx prisma migrate status
```

### Cloud Storage Migration (Recommended for Production)

For better scalability, migrate to cloud storage:

#### Option 1: Cloudflare R2 (Recommended - No Egress Fees)

1. Create R2 bucket at Cloudflare
2. Get API credentials
3. Update `.env`:

```bash
STORAGE_PROVIDER=s3
S3_BUCKET=your-bucket-name
S3_REGION=auto
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

#### Option 2: AWS S3

```bash
STORAGE_PROVIDER=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

#### Option 3: DigitalOcean Spaces

```bash
STORAGE_PROVIDER=s3
S3_BUCKET=your-space-name
S3_REGION=nyc3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

After updating `.env`, restart the app:

```bash
pm2 restart nodepress
```

### Monitoring and Alerts

#### Set Up Disk Space Alerts

Create an alert script:

```bash
nano ~/disk-alert.sh
```

Add:

```bash
#!/bin/bash
THRESHOLD=85
USAGE=$(df /var/www/NodePress | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "⚠️ ALERT: Disk usage is at ${USAGE}%!" | mail -s "Disk Space Alert" your-email@example.com
fi
```

Schedule with cron:

```bash
crontab -e
# Add: 0 */6 * * * /home/nodepress/disk-alert.sh
```

### Backup Strategy

#### Backup Reels Directory

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
tar -czf "$BACKUP_DIR/reels_backup_$DATE.tar.gz" "$SOURCE_DIR"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "reels_backup_*.tar.gz" -mtime +7 -delete

echo "✅ Backup complete: reels_backup_$DATE.tar.gz"
```

Schedule daily backups:

```bash
crontab -e
# Add: 0 3 * * * /home/nodepress/backup-reels.sh
```

## Notes

- Video files are stored locally in `/public/uploads/reels/` by default
- For production, **strongly recommend** using cloud storage (S3, Cloudflare R2, etc.)
- The migration may take time depending on database size
- Ensure adequate storage space for video uploads (minimum 10GB recommended)
- Monitor disk usage regularly with the provided monitoring scripts
- Set up automatic backups of the uploads directory
- Consider implementing a CDN for better video delivery performance

