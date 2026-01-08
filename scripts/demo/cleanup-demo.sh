#!/bin/bash
# NodePress Demo Cleanup Script
# Removes a demo instance and all its resources

set -e

DEMO_SUBDOMAIN=$1

if [ -z "$DEMO_SUBDOMAIN" ]; then
    echo "Usage: $0 <subdomain>"
    exit 1
fi

# Load environment
source /etc/nodepress/demo.env 2>/dev/null || true

DEMO_BASE_PATH=${DEMO_BASE_PATH:-/var/demos}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}

echo "=== Cleaning Up Demo: $DEMO_SUBDOMAIN ==="

# 1. Stop PM2 process
echo "Stopping PM2 process..."
pm2 delete "demo-$DEMO_SUBDOMAIN" 2>/dev/null || true
pm2 save

# 2. Remove Nginx config
echo "Removing Nginx config..."
rm -f "/etc/nginx/sites-enabled/demo-$DEMO_SUBDOMAIN.conf"
rm -f "/etc/nginx/sites-available/demo-$DEMO_SUBDOMAIN.conf"
nginx -t && nginx -s reload 2>/dev/null || true

# 3. Drop database
DB_NAME="demo_${DEMO_SUBDOMAIN//-/_}"
echo "Dropping database: $DB_NAME"
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true

# 4. Remove demo directory
DEMO_PATH="$DEMO_BASE_PATH/$DEMO_SUBDOMAIN"
echo "Removing demo directory: $DEMO_PATH"
rm -rf "$DEMO_PATH"

echo "=== Demo Cleaned Up Successfully ==="

