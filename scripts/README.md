# Reels Management Scripts

This directory contains utility scripts for deploying, monitoring, and maintaining the Reels feature on Hostinger VPS.

## Available Scripts

### 🚀 deploy-reels.sh
**Purpose:** Deploy the Reels feature to your Hostinger VPS

**Usage:**
```bash
chmod +x scripts/deploy-reels.sh
./scripts/deploy-reels.sh
```

**What it does:**
- Pulls latest code from Git
- Installs dependencies
- Runs database migrations
- Builds backend and admin panel
- Sets up uploads directory
- Restarts the application
- Reloads Nginx

**When to use:**
- Initial deployment of Reels feature
- Updating to latest version
- After making code changes

---

### 📊 monitor-reels.sh
**Purpose:** Monitor storage, system health, and performance

**Usage:**
```bash
chmod +x scripts/monitor-reels.sh
./scripts/monitor-reels.sh
```

**What it shows:**
- Disk usage and alerts
- Reels directory size
- File statistics (count, types)
- Largest files
- Recently added files
- Application status
- System memory usage
- Recommendations

**When to use:**
- Daily health checks
- Before/after cleanup
- Capacity planning
- Troubleshooting performance issues

---

### 🧹 cleanup-old-reels.sh
**Purpose:** Remove old reel files to free up disk space

**Usage:**
```bash
chmod +x scripts/cleanup-old-reels.sh

# Delete files older than 90 days (default)
./scripts/cleanup-old-reels.sh

# Delete files older than 60 days
./scripts/cleanup-old-reels.sh 60

# Preview without deleting (dry run)
DRY_RUN=true ./scripts/cleanup-old-reels.sh 90
```

**What it does:**
- Finds files older than specified days
- Shows preview of files to be deleted
- Asks for confirmation
- Deletes old files
- Removes empty directories
- Creates backup list of deleted files

**When to use:**
- Disk space is running low
- Regular maintenance (scheduled with cron)
- Before major updates

**Safety features:**
- Dry run mode for preview
- Confirmation prompt
- Backup list of deleted files
- Minimum 30-day warning

---

### 💾 backup-reels.sh
**Purpose:** Create compressed backups of the reels directory

**Usage:**
```bash
chmod +x scripts/backup-reels.sh
./scripts/backup-reels.sh
```

**What it does:**
- Checks disk space availability
- Creates compressed tar.gz backup
- Shows compression statistics
- Removes backups older than 7 days
- Lists all current backups

**When to use:**
- Before major updates
- Before cleanup operations
- Regular scheduled backups
- Before migrating to cloud storage

**Backup location:** `/var/backups/reels/`

---

## Quick Start Guide

### First Time Setup

1. **Make all scripts executable:**
```bash
cd /var/www/NodePress
chmod +x scripts/*.sh
```

2. **Deploy the Reels feature:**
```bash
./scripts/deploy-reels.sh
```

3. **Verify deployment:**
```bash
./scripts/monitor-reels.sh
```

### Regular Maintenance

**Daily:**
```bash
# Check system health
./scripts/monitor-reels.sh
```

**Weekly:**
```bash
# Create backup
./scripts/backup-reels.sh

# Check for old files (dry run)
DRY_RUN=true ./scripts/cleanup-old-reels.sh 90
```

**Monthly:**
```bash
# Clean up old files
./scripts/cleanup-old-reels.sh 90
```

## Automation with Cron

### Set up automatic backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * /var/www/NodePress/scripts/backup-reels.sh >> /var/log/reels-backup.log 2>&1
```

### Set up automatic cleanup

```bash
# Edit crontab
crontab -e

# Add weekly cleanup on Sunday at 2 AM (files older than 90 days)
0 2 * * 0 /var/www/NodePress/scripts/cleanup-old-reels.sh 90 >> /var/log/reels-cleanup.log 2>&1
```

### Set up monitoring alerts

```bash
# Edit crontab
crontab -e

# Add monitoring check every 6 hours
0 */6 * * * /var/www/NodePress/scripts/monitor-reels.sh >> /var/log/reels-monitor.log 2>&1
```

## Troubleshooting

### Script fails with "Permission denied"

**Solution:**
```bash
chmod +x scripts/*.sh
```

### Cannot create backup directory

**Solution:**
```bash
sudo mkdir -p /var/backups/reels
sudo chown nodepress:nodepress /var/backups/reels
```

### Cleanup script won't delete files

**Solution:**
```bash
# Check file permissions
ls -la /var/www/NodePress/public/uploads/reels

# Fix permissions if needed
sudo chown -R nodepress:nodepress /var/www/NodePress/public/uploads/reels
```

### Deploy script fails at Nginx reload

**Solution:**
```bash
# Test Nginx configuration
sudo nginx -t

# If errors, check your site config
sudo nano /etc/nginx/sites-available/nodepress.co.uk

# Reload manually
sudo systemctl reload nginx
```

## Best Practices

1. **Always run dry run first** before cleanup:
   ```bash
   DRY_RUN=true ./scripts/cleanup-old-reels.sh 90
   ```

2. **Create backup before major operations:**
   ```bash
   ./scripts/backup-reels.sh
   ```

3. **Monitor regularly:**
   ```bash
   ./scripts/monitor-reels.sh
   ```

4. **Schedule automated tasks** with cron for hands-off maintenance

5. **Keep logs** of all operations for troubleshooting

## Environment Variables

### deploy-reels.sh
- `APP_DIR` - Application directory (default: `/var/www/NodePress`)
- `APP_USER` - Application user (default: `nodepress`)

### cleanup-old-reels.sh
- `DRY_RUN` - Preview mode (default: `false`)
- Set to `true` to preview without deleting

### backup-reels.sh
- `RETENTION_DAYS` - How long to keep backups (default: `7`)

## Support

For issues or questions:
1. Check the logs: `pm2 logs nodepress`
2. Run monitoring: `./scripts/monitor-reels.sh`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Refer to main documentation: `docs/REELS_DEPLOYMENT_HOSTINGER.md`

## Related Documentation

- [Reels Feature Guide](../REELS_FEATURE_GUIDE.md)
- [Hostinger Deployment Guide](../docs/REELS_DEPLOYMENT_HOSTINGER.md)

