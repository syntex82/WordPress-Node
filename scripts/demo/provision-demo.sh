#!/bin/bash
# NodePress Demo Provisioning Script
# Creates an isolated demo instance with its own database and storage

set -e

# Configuration
DEMO_SUBDOMAIN=$1
DEMO_PORT=$2
ADMIN_EMAIL=$3
ADMIN_PASSWORD_HASH=$4

if [ -z "$DEMO_SUBDOMAIN" ] || [ -z "$DEMO_PORT" ]; then
    echo "Usage: $0 <subdomain> <port> [admin_email] [admin_password_hash]"
    exit 1
fi

# Load environment
source /etc/nodepress/demo.env 2>/dev/null || true

DEMO_BASE_PATH=${DEMO_BASE_PATH:-/var/demos}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}
DEMO_BASE_DOMAIN=${DEMO_BASE_DOMAIN:-demo.nodepress.io}
TEMPLATE_PATH=${TEMPLATE_PATH:-/opt/nodepress}

echo "=== Provisioning Demo: $DEMO_SUBDOMAIN ==="

# 1. Create database
DB_NAME="demo_${DEMO_SUBDOMAIN//-/_}"
echo "Creating database: $DB_NAME"

PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    echo "Database already exists or creation failed"
}

# 2. Create demo directory structure
DEMO_PATH="$DEMO_BASE_PATH/$DEMO_SUBDOMAIN"
echo "Creating demo directory: $DEMO_PATH"

mkdir -p "$DEMO_PATH"/{uploads,themes,logs,config}

# 3. Generate environment file
cat > "$DEMO_PATH/config/.env" << EOF
# Demo Instance: $DEMO_SUBDOMAIN
# Generated: $(date -Iseconds)

NODE_ENV=production
PORT=$DEMO_PORT

# Database
DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:5432/$DB_NAME"

# Demo Mode
DEMO_MODE=true
DEMO_SUBDOMAIN=$DEMO_SUBDOMAIN
DEMO_EXPIRES_AT=$(date -d "+24 hours" -Iseconds)

# Disable external services
SMTP_HOST=
OPENAI_API_KEY=demo-disabled
ANTHROPIC_API_KEY=demo-disabled
STRIPE_SECRET_KEY=demo-disabled

# Security
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

# URLs
FRONTEND_URL=https://$DEMO_SUBDOMAIN.$DEMO_BASE_DOMAIN
ADMIN_URL=https://$DEMO_SUBDOMAIN.$DEMO_BASE_DOMAIN/admin

# Storage
UPLOAD_PATH=$DEMO_PATH/uploads
THEME_PATH=$DEMO_PATH/themes
EOF

# 4. Run database migrations
echo "Running database migrations..."
cd $TEMPLATE_PATH
DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:5432/$DB_NAME" \
    npx prisma db push --skip-generate

# 5. Seed sample data
echo "Seeding sample data..."
DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:5432/$DB_NAME" \
    node dist/scripts/seed-demo.js "$ADMIN_EMAIL" "$ADMIN_PASSWORD_HASH"

# 6. Copy default theme assets
echo "Copying theme assets..."
cp -r "$TEMPLATE_PATH/themes/default" "$DEMO_PATH/themes/" 2>/dev/null || true

# 7. Generate Nginx config
NGINX_CONF="/etc/nginx/sites-available/demo-$DEMO_SUBDOMAIN.conf"
echo "Generating Nginx config: $NGINX_CONF"

cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    server_name $DEMO_SUBDOMAIN.$DEMO_BASE_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DEMO_SUBDOMAIN.$DEMO_BASE_DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DEMO_BASE_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DEMO_BASE_DOMAIN/privkey.pem;

    access_log $DEMO_PATH/logs/access.log;
    error_log $DEMO_PATH/logs/error.log;

    # Rate limiting for demo
    limit_req zone=demo burst=20 nodelay;
    limit_conn demo_conn 10;

    location / {
        proxy_pass http://127.0.0.1:$DEMO_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Demo-Mode 'true';
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files
    location /uploads {
        alias $DEMO_PATH/uploads;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/" 2>/dev/null || true
nginx -t && nginx -s reload 2>/dev/null || true

# 8. Create PM2 ecosystem file
cat > "$DEMO_PATH/config/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'demo-$DEMO_SUBDOMAIN',
    script: '$TEMPLATE_PATH/dist/main.js',
    cwd: '$TEMPLATE_PATH',
    env_file: '$DEMO_PATH/config/.env',
    instances: 1,
    max_memory_restart: '256M',
    log_file: '$DEMO_PATH/logs/app.log',
    error_file: '$DEMO_PATH/logs/error.log',
    out_file: '$DEMO_PATH/logs/out.log',
  }]
};
EOF

# 9. Start the demo instance
echo "Starting demo instance..."
pm2 start "$DEMO_PATH/config/ecosystem.config.js"
pm2 save

echo "=== Demo Provisioned Successfully ==="
echo "URL: https://$DEMO_SUBDOMAIN.$DEMO_BASE_DOMAIN"
echo "Admin: https://$DEMO_SUBDOMAIN.$DEMO_BASE_DOMAIN/admin"
echo "Port: $DEMO_PORT"
echo "Database: $DB_NAME"

