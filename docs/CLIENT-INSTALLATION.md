# NodePress Client Installation Guide

This guide explains how to install NodePress CMS for your clients without including the demo hosting infrastructure.

## Overview

NodePress has two modes:
1. **Demo Hosting Mode** - For running nodepress.io demo system (includes orchestrator, cleanup, demo API)
2. **Client/Production Mode** - Clean installation for end-users (no demo infrastructure)

## Building for Client Installation

### Option 1: Using the Build Script

```bash
# From the NodePress root directory
npm run build:client

# This creates a dist-client/ folder ready for deployment
```

### Option 2: Manual Build

```bash
# Build the backend
npm run build

# Build the admin panel
cd admin && npm run build && cd ..

# Copy only production files (see .clientignore for exclusions)
```

## What's Excluded from Client Builds

The following files and features are **NOT** included in client installations:

| Excluded | Reason |
|----------|--------|
| `docker/demo/` | Demo orchestration Docker configs |
| `src/modules/demo/` | Demo API, services, and provisioning |
| `themes/default/templates/try-demo.hbs` | Demo request page |
| `public/demo-tracker.js` | Analytics tracker for demos |
| `**/*.spec.ts` | Test files |

**Additionally, the build script automatically:**
- Removes the floating "Try Demo" widget from `footer.hbs`
- Replaces "Try Free Demo" buttons with "Get Started" buttons linking to `/register`
- Strips all `/try-demo` links from templates

## What IS Included

| Included | Purpose |
|----------|---------|
| `dist/` | Compiled backend code |
| `admin/dist/` | Compiled admin panel |
| `themes/` | All theme templates (except try-demo.hbs) |
| `prisma/` | Database schema and migrations |
| `Dockerfile` | Production Docker configuration |
| `docker-compose.yml` | Easy deployment setup |

## Installation on Client Server

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis (optional, for caching)

### Quick Install

```bash
# 1. Copy the dist-client folder to client server
scp -r dist-client/ user@client-server:/opt/nodepress

# 2. SSH into the server
ssh user@client-server

# 3. Navigate to NodePress directory
cd /opt/nodepress

# 4. Run the install script
./install.sh   # Linux/Mac
# or
install.bat    # Windows

# 5. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 6. Run database migrations
npx prisma migrate deploy

# 7. Start the server
npm start
```

### Docker Installation

```bash
# 1. Copy dist-client to server
# 2. Build and run with Docker Compose:

cd /opt/nodepress
docker-compose up -d

# The app will be available at http://localhost:3000
```

## Environment Configuration

Required environment variables for client installation:

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/nodepress"

# Security (REQUIRED)
JWT_SECRET="generate-a-secure-random-string-here"

# Server
PORT=3000
SITE_URL=https://client-domain.com
SITE_NAME="Client Site Name"

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=password

# Payments (optional)
STRIPE_SECRET_KEY=sk_live_xxx

# AI Features (optional)
OPENAI_API_KEY=sk-xxx
```

## Updating Client Installations

To update an existing client installation:

```bash
# 1. Build new client package
npm run build:client

# 2. Stop the running server on client
ssh user@client-server "pm2 stop nodepress"

# 3. Backup client's data
ssh user@client-server "pg_dump nodepress > backup.sql"

# 4. Copy new files (preserve .env and uploads)
rsync -av --exclude='.env' --exclude='uploads/' dist-client/ user@client-server:/opt/nodepress/

# 5. Run migrations
ssh user@client-server "cd /opt/nodepress && npx prisma migrate deploy"

# 6. Restart server
ssh user@client-server "pm2 restart nodepress"
```

## Support

For issues with client installations:
- Check the logs: `pm2 logs nodepress` or `docker-compose logs`
- Verify database connection
- Ensure all environment variables are set

