# 🚀 Production Deployment - Hostinger VPS

This guide provides comprehensive instructions for deploying NodePress CMS to a Hostinger VPS (or any Ubuntu-based VPS) with a custom domain, SSL, and production optimizations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Step 1: Initial Server Setup](#step-1-initial-server-setup)
- [Step 2: Install System Dependencies](#step-2-install-system-dependencies)
- [Step 3: Install and Configure PostgreSQL](#step-3-install-and-configure-postgresql)
- [Step 4: Install and Configure Redis](#step-4-install-and-configure-redis)
- [Step 5: Clone and Configure the Application](#step-5-clone-and-configure-the-application)
- [Step 6: Build the Application](#step-6-build-the-application)
- [Step 7: Setup PM2 Process Manager](#step-7-setup-pm2-process-manager)
- [Step 8: Configure Nginx](#step-8-configure-nginx)
- [Step 9: Setup SSL with Let's Encrypt](#step-9-setup-ssl-with-lets-encrypt)
- [Step 10: Configure Firewall](#step-10-configure-firewall)
- [Step 11: Post-Deployment Configuration](#step-11-post-deployment-configuration)
- [Maintenance and Updates](#maintenance-and-updates)
- [Monitoring and Logs](#monitoring-and-logs)
- [Backup and Restore](#backup-and-restore)
- [Troubleshooting](#troubleshooting)
- [Security Hardening](#security-hardening)
- [Performance Optimization](#performance-optimization)

---

## Prerequisites

### Server Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **VPS Plan** | KVM 1 (1 vCPU, 4GB RAM) | KVM 2 (2 vCPU, 8GB RAM) |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **Storage** | 50 GB SSD | 100 GB+ SSD |
| **Bandwidth** | 1 TB/month | Unlimited |

### Domain Requirements

- A registered domain name (e.g., `yourdomain.com`)
- Access to domain DNS settings
- Domain pointed to your VPS IP address

### DNS Configuration

Before starting, configure your DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | Your VPS IP | 3600 |
| A | www | Your VPS IP | 3600 |
| AAAA | @ | Your VPS IPv6 (if available) | 3600 |

> 💡 DNS changes can take up to 48 hours to propagate, but typically complete within 1-4 hours.

---

## Architecture Overview

```
                     ┌─────────────────────────────────────────┐
                     │              Internet                   │
                     └─────────────────┬───────────────────────┘
                                       │
                     ┌─────────────────▼───────────────────────┐
                     │           Cloudflare (Optional)         │
                     │         CDN + DDoS Protection           │
                     └─────────────────┬───────────────────────┘
                                       │
                     ┌─────────────────▼───────────────────────┐
                     │              Nginx                      │
                     │      Reverse Proxy + SSL Termination    │
                     │           Port 80 → 443                 │
                     └─────────────────┬───────────────────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────────────┐
│                     Hostinger VPS (Ubuntu 24.04)                            │
│                                      │                                      │
│    ┌─────────────────────────────────▼─────────────────────────────────┐   │
│    │                     PM2 Process Manager                            │   │
│    │                    NodePress CMS                              │   │
│    │                       Port 3000                                    │   │
│    └─────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
│    ┌──────────────────┬──────────────┴──────────────┬──────────────────┐   │
│    │                  │                             │                  │   │
│    ▼                  ▼                             ▼                  │   │
│ ┌──────────┐    ┌──────────┐                 ┌──────────────┐          │   │
│ │PostgreSQL│    │  Redis   │                 │   Uploads    │          │   │
│ │   :5432  │    │  :6379   │                 │  /uploads/   │          │   │
│ └──────────┘    └──────────┘                 └──────────────┘          │   │
│                                                                         │   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Initial Server Setup

### Connect to Your VPS

```bash
# Connect via SSH
ssh root@your-vps-ip

# Or using SSH key
ssh -i ~/.ssh/your-key root@your-vps-ip
```

### Update System

```bash
apt update && apt upgrade -y
```

### Set Timezone

```bash
timedatectl set-timezone UTC
# Or your preferred timezone: timedatectl set-timezone Europe/London
```

### Create a Deploy User (Recommended)

```bash
# Create a new user for deployment
adduser deploy
usermod -aG sudo deploy

# Allow passwordless sudo (optional)
echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deploy

# Switch to deploy user
su - deploy
```

---

## Step 2: Install System Dependencies

### Install Node.js 20.x

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # v20.x.x
npm --version   # 10.x.x
```

### Install Build Tools

```bash
sudo apt install -y build-essential git curl wget nginx
```

### Install PM2 Globally

```bash
sudo npm install -g pm2
```

---

## Step 3: Install and Configure PostgreSQL

### Install PostgreSQL 16

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Production Database

```bash
# Generate a secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
echo "Database password: $DB_PASSWORD"
# SAVE THIS PASSWORD - you'll need it for .env

# Create database user
sudo -u postgres psql -c "CREATE USER nodepress WITH PASSWORD '$DB_PASSWORD';"

# Create database
sudo -u postgres createdb -O nodepress nodepress

# Verify
sudo -u postgres psql -c "\l" | grep nodepress
```

### Secure PostgreSQL

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Change the local connection method from "peer" to "scram-sha-256" for the nodepress user
# Find the line: local all all peer
# Add above it: local nodepress nodepress scram-sha-256

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Step 4: Install and Configure Redis

### Install Redis

```bash
sudo apt install -y redis-server

# Start and enable service
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Secure Redis

```bash
# Generate Redis password
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
echo "Redis password: $REDIS_PASSWORD"
# SAVE THIS PASSWORD

# Configure Redis
sudo nano /etc/redis/redis.conf

# Find and modify these lines:
# bind 127.0.0.1 ::1  (keep as is - only local connections)
# requirepass your_redis_password_here
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server
```

---

## Step 5: Clone and Configure the Application

### Clone the Repository

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/syntex82/NodePress.git
sudo chown -R $USER:$USER NodePress
cd NodePress
```

### Install Dependencies

```bash
# Install backend dependencies
npm ci --production=false

# Install admin dependencies
cd admin && npm ci && cd ..
```

### Create Environment Configuration

```bash
# Create .env file
nano .env
```

### Production Environment Variables

Copy and customize this configuration:

```env
# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://nodepress:YOUR_DB_PASSWORD@localhost:5432/nodepress?schema=public"

# ─────────────────────────────────────────────────────────────
# REDIS
# ─────────────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# ─────────────────────────────────────────────────────────────
# APPLICATION
# ─────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
HOST=127.0.0.1
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com/admin
TRUST_PROXY=true
ENABLE_COMPRESSION=true

# ─────────────────────────────────────────────────────────────
# AUTHENTICATION (Generate unique secrets!)
# ─────────────────────────────────────────────────────────────
JWT_SECRET=GENERATE_64_CHAR_SECRET
JWT_EXPIRES_IN=7d
SESSION_SECRET=GENERATE_64_CHAR_SECRET
ENCRYPTION_KEY=GENERATE_32_CHAR_SECRET

# ─────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────
CORS_ORIGIN=https://yourdomain.com

# ─────────────────────────────────────────────────────────────
# EMAIL (SMTP Configuration)
# ─────────────────────────────────────────────────────────────
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password
SMTP_FROM=noreply@yourdomain.com

# ─────────────────────────────────────────────────────────────
# STRIPE (Optional - for payments)
# ─────────────────────────────────────────────────────────────
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# STRIPE_PUBLISHABLE_KEY=pk_live_...

# ─────────────────────────────────────────────────────────────
# ADMIN SEED
# ─────────────────────────────────────────────────────────────
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=ChangeThisSecurePassword123!
```

### Generate Secure Secrets

```bash
# Generate JWT_SECRET (64 characters)
openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64

# Generate SESSION_SECRET (64 characters)
openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64

# Generate ENCRYPTION_KEY (32 characters)
openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32
```

---

## Step 6: Build the Application

### Generate Prisma Client

```bash
npx prisma generate
```

### Push Database Schema

```bash
npx prisma db push
```

### Seed Admin User

```bash
npx prisma db seed
```

### Build Admin Panel

```bash
cd admin && npm run build && cd ..
```

### Build Backend

```bash
npm run build
```

---

## Step 7: Setup PM2 Process Manager

### Start Application with PM2

```bash
pm2 start dist/main.js --name NodePress
```

### Configure PM2 for Production

```bash
# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs (starts with: sudo env PATH=...)

# Verify PM2 status
pm2 status
```

### PM2 Configuration File (Optional)

Create `ecosystem.config.js` for advanced configuration:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'NodePress',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/NodePress-error.log',
    out_file: '/var/log/pm2/NodePress-out.log',
    merge_logs: true,
    time: true,
  }]
};
```

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js
pm2 save
```

---

## Step 8: Configure Nginx

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

Add the following configuration:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream backend
upstream NodePress_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL is configured)
    # return 301 https://$server_name$request_uri;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml image/svg+xml;
    gzip_comp_level 6;

    # Client body size (for file uploads - 100MB)
    client_max_body_size 100M;

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://NodePress_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        access_log off;
    }

    # API endpoints with rate limiting
    location /api {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://NodePress_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Login with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login_limit burst=3 nodelay;

        proxy_pass http://NodePress_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket for real-time features
    location /socket.io/ {
        proxy_pass http://NodePress_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Static uploads with caching
    location /uploads {
        alias /var/www/NodePress/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Admin panel static files
    location /admin {
        alias /var/www/NodePress/admin/dist;
        try_files $uri $uri/ /admin/index.html;
        expires 1d;
        add_header Cache-Control "public";
    }

    # All other routes
    location / {
        proxy_pass http://NodePress_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 9: Setup SSL with Let's Encrypt

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate

```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Verify SSL Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# View certificate status
sudo certbot certificates
```

### Update Nginx for HTTPS

After Certbot runs, it automatically updates your Nginx config. Verify the changes:

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

Certbot adds SSL configuration and creates a redirect from HTTP to HTTPS.

---

## Step 10: Configure Firewall

### Setup UFW Firewall

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### Expected Output

```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80,443/tcp (Nginx Full)    ALLOW       Anywhere
22/tcp (v6)                ALLOW       Anywhere (v6)
80,443/tcp (Nginx Full (v6)) ALLOW     Anywhere (v6)
```

---

## Step 11: Post-Deployment Configuration

### Access Your Site

1. **Frontend:** https://yourdomain.com
2. **Admin Panel:** https://yourdomain.com/admin
3. **API:** https://yourdomain.com/api

### Login with Default Credentials

```
Email: admin@yourdomain.com
Password: ChangeThisSecurePassword123!
```

### Configure Domain Settings in Admin

1. Go to **Settings → Domain Configuration**
2. Update:
   - **Frontend URL:** https://yourdomain.com
   - **Admin URL:** https://yourdomain.com/admin
   - **Site Name:** Your Site Name
   - **Support Email:** support@yourdomain.com
3. Click **Save**

### Change Admin Password

**Important:** Change the default admin password immediately!

1. Go to **Settings → Profile**
2. Click **Change Password**
3. Enter a strong, unique password

### Configure Email Settings

1. Go to **Settings → Email Configuration**
2. Configure SMTP settings for your email provider
3. Send a test email to verify

---


## Maintenance and Updates

### Updating the Application

```bash
cd /var/www/NodePress

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production=false
cd admin && npm ci && cd ..

# Run database migrations
npx prisma db push

# Rebuild application
cd admin && npm run build && cd ..
npm run build

# Restart PM2
pm2 restart NodePress

# Verify status
pm2 status
```

### Automated Update Script

Create an update script:

```bash
nano /var/www/NodePress/scripts/update.sh
```

```bash
#!/bin/bash
set -e

APP_DIR="/var/www/NodePress"
cd $APP_DIR

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci --production=false
cd admin && npm ci && cd ..

echo "🗄️ Running database migrations..."
npx prisma db push

echo "🔨 Building application..."
cd admin && npm run build && cd ..
npm run build

echo "🔄 Restarting application..."
pm2 restart NodePress

echo "✅ Update complete!"
pm2 status
```

```bash
chmod +x /var/www/NodePress/scripts/update.sh
```

---

## Monitoring and Logs

### PM2 Monitoring

```bash
# View process status
pm2 status

# View real-time logs
pm2 logs NodePress

# View logs with timestamps
pm2 logs NodePress --lines 100

# Monitor CPU/Memory
pm2 monit
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL Logs

```bash
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Redis Logs

```bash
sudo tail -f /var/log/redis/redis-server.log
```

### System Resources

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Memory usage
free -h
```

### PM2 Web Dashboard (Optional)

```bash
# Install PM2 Plus for web monitoring
pm2 plus
```

---

## Backup and Restore

### Database Backup

```bash
# Create backup directory
sudo mkdir -p /var/backups/NodePress

# Backup database
pg_dump -U nodepress -d nodepress > /var/backups/NodePress/db_$(date +%Y%m%d_%H%M%S).sql
```

### Automated Daily Backups

Create a backup script:

```bash
sudo nano /var/www/NodePress/scripts/backup.sh
```

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/NodePress"
APP_DIR="/var/www/NodePress"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "📦 Backing up database..."
PGPASSWORD="YOUR_DB_PASSWORD" pg_dump -h localhost -U nodepress -d nodepress > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
echo "📁 Backing up uploads..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $APP_DIR uploads/

# Backup .env
echo "⚙️ Backing up configuration..."
cp $APP_DIR/.env $BACKUP_DIR/env_$DATE.bak

# Remove backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "✅ Backup complete: $BACKUP_DIR"
ls -la $BACKUP_DIR
```

```bash
chmod +x /var/www/NodePress/scripts/backup.sh
```

### Schedule Daily Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/NodePress/scripts/backup.sh >> /var/log/NodePress-backup.log 2>&1
```

### Restore from Backup

```bash
# Restore database
psql -U nodepress -d nodepress < /var/backups/NodePress/db_YYYYMMDD_HHMMSS.sql

# Restore uploads
tar -xzf /var/backups/NodePress/uploads_YYYYMMDD_HHMMSS.tar.gz -C /var/www/NodePress/

# Restart application
pm2 restart NodePress
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs NodePress --lines 50

# Check if port is in use
sudo lsof -i :3000

# Verify environment variables
cat /var/www/NodePress/.env

# Test database connection
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U nodepress -d nodepress -c "SELECT 1;"
```

### 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart NodePress
sudo systemctl restart nginx
```

### Database Connection Errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Verify database exists
sudo -u postgres psql -c "\l" | grep nodepress
```

### Redis Connection Errors

```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis connection
redis-cli -a YOUR_REDIS_PASSWORD ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

### High Memory Usage

```bash
# Check memory usage
free -h

# Check PM2 memory
pm2 monit

# Restart application to free memory
pm2 restart NodePress

# Check for memory leaks in logs
pm2 logs NodePress | grep -i "memory\|heap"
```

---

## Security Hardening

### SSH Security

```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no (if using SSH keys)

sudo systemctl restart sshd
```

### Fail2Ban (Brute Force Protection)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure for Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
```

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

### Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Enable automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### File Permissions

```bash
# Set proper ownership
sudo chown -R deploy:deploy /var/www/NodePress

# Set proper permissions
find /var/www/NodePress -type d -exec chmod 755 {} \;
find /var/www/NodePress -type f -exec chmod 644 {} \;

# Make scripts executable
chmod +x /var/www/NodePress/scripts/*.sh

# Protect .env file
chmod 600 /var/www/NodePress/.env
```

---

## Performance Optimization

### Enable Nginx Caching

Add to your Nginx configuration:

```nginx
# Cache zone for static files
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m max_size=1g inactive=60m use_temp_path=off;

# In your server block, add to static locations:
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
    proxy_cache static_cache;
    proxy_cache_valid 200 1d;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### PostgreSQL Tuning

```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Adjust based on your VPS RAM:

```ini
# For 4GB RAM VPS
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
work_mem = 16MB
max_connections = 100
```

```bash
sudo systemctl restart postgresql
```

### Redis Memory Optimization

```bash
sudo nano /etc/redis/redis.conf
```

```ini
maxmemory 512mb
maxmemory-policy allkeys-lru
```

```bash
sudo systemctl restart redis-server
```

### PM2 Cluster Mode

For multi-core VPS, use cluster mode:

```bash
pm2 delete NodePress
pm2 start dist/main.js --name NodePress -i max
pm2 save
```

---

## Quick Reference

### Service Commands

| Service | Start | Stop | Restart | Status |
|---------|-------|------|---------|--------|
| **App** | `pm2 start NodePress` | `pm2 stop NodePress` | `pm2 restart NodePress` | `pm2 status` |
| **Nginx** | `sudo systemctl start nginx` | `sudo systemctl stop nginx` | `sudo systemctl restart nginx` | `sudo systemctl status nginx` |
| **PostgreSQL** | `sudo systemctl start postgresql` | `sudo systemctl stop postgresql` | `sudo systemctl restart postgresql` | `sudo systemctl status postgresql` |
| **Redis** | `sudo systemctl start redis-server` | `sudo systemctl stop redis-server` | `sudo systemctl restart redis-server` | `sudo systemctl status redis-server` |

### Important Paths

| Item | Path |
|------|------|
| **Application** | `/var/www/NodePress` |
| **Nginx Config** | `/etc/nginx/sites-available/yourdomain.com` |
| **SSL Certificates** | `/etc/letsencrypt/live/yourdomain.com/` |
| **PM2 Logs** | `~/.pm2/logs/` |
| **Backups** | `/var/backups/NodePress/` |
| **Uploads** | `/var/www/NodePress/uploads/` |

### Useful Commands

```bash
# View all logs
pm2 logs

# Check disk space
df -h

# Check memory
free -h

# Test Nginx config
sudo nginx -t

# Renew SSL
sudo certbot renew

# Database backup
pg_dump -U nodepress -d nodepress > backup.sql

# Update application
/var/www/NodePress/scripts/update.sh
```

---

## Next Steps

- [Local Development Guide](./LOCAL-DEVELOPMENT.md) - Set up local development
- [API Documentation](../README.md#-api-documentation) - Explore the API
- [Plugin Development](../README.md#-plugin-architecture) - Create custom plugins

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review PM2 logs: `pm2 logs NodePress`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Open an issue on [GitHub](https://github.com/syntex82/NodePress/issues)


