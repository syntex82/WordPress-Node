#!/bin/bash
# NodePress Expired Demo Cleanup Script
# Run via cron to clean up expired demos

set -e

# Load environment
source /etc/nodepress/demo.env 2>/dev/null || true

DEMO_BASE_PATH=${DEMO_BASE_PATH:-/var/demos}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}
DATABASE_URL=${DATABASE_URL:-}

echo "=== Cleaning Up Expired Demos: $(date) ==="

# Get list of expired demos from the main database
EXPIRED_DEMOS=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d nodepress -t -c "
    SELECT subdomain FROM \"DemoInstance\" 
    WHERE status = 'RUNNING' 
    AND \"expiresAt\" < NOW()
    ORDER BY \"expiresAt\" ASC;
" 2>/dev/null || echo "")

if [ -z "$EXPIRED_DEMOS" ]; then
    echo "No expired demos found."
    exit 0
fi

CLEANUP_COUNT=0

for SUBDOMAIN in $EXPIRED_DEMOS; do
    SUBDOMAIN=$(echo "$SUBDOMAIN" | tr -d ' ')
    if [ -n "$SUBDOMAIN" ]; then
        echo "Cleaning up expired demo: $SUBDOMAIN"
        
        # Run cleanup script
        /opt/nodepress/scripts/demo/cleanup-demo.sh "$SUBDOMAIN"
        
        # Update status in main database
        PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d nodepress -c "
            UPDATE \"DemoInstance\" 
            SET status = 'EXPIRED' 
            WHERE subdomain = '$SUBDOMAIN';
        " 2>/dev/null || true
        
        CLEANUP_COUNT=$((CLEANUP_COUNT + 1))
    fi
done

echo "=== Cleaned Up $CLEANUP_COUNT Expired Demos ==="

# Also clean up demos that have been expired for more than 7 days
echo "Removing old expired demo records..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d nodepress -c "
    DELETE FROM \"DemoInstance\" 
    WHERE status IN ('EXPIRED', 'TERMINATED') 
    AND \"expiresAt\" < NOW() - INTERVAL '7 days';
" 2>/dev/null || true

echo "=== Cleanup Complete ==="

