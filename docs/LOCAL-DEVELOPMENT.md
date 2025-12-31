# 🐧 Local Development Setup - Ubuntu

This guide provides detailed instructions for setting up a local development environment for NodePress CMS on Ubuntu (22.04 or 24.04 LTS).

## Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Step 1: Install System Dependencies](#step-1-install-system-dependencies)
- [Step 2: Install PostgreSQL](#step-2-install-postgresql)
- [Step 3: Install Redis](#step-3-install-redis)
- [Step 4: Clone and Configure the Project](#step-4-clone-and-configure-the-project)
- [Step 5: Setup the Database](#step-5-setup-the-database)
- [Step 6: Build and Run](#step-6-build-and-run)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- Ubuntu 22.04 LTS or 24.04 LTS (Desktop or Server)
- Sudo/root access
- At least 4GB RAM (8GB recommended)
- At least 10GB free disk space
- Internet connection

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 4 GB | 8 GB+ |
| **CPU** | 2 cores | 4 cores+ |
| **Disk** | 10 GB | 20 GB+ |
| **Node.js** | 18.x | 20.x LTS |
| **PostgreSQL** | 14 | 16 |
| **Redis** | 6.x | 7.x |

---

## Step 1: Install System Dependencies

### Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 20.x (LTS)

```bash
# Install Node.js via NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x
```

### Install Essential Build Tools

```bash
sudo apt install -y build-essential git curl wget
```

---

## Step 2: Install PostgreSQL

### Install PostgreSQL 16

```bash
# Add PostgreSQL APT repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import repository signing key
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql -c "SELECT version();"
```

### Create Database and User

```bash
# Create a new database user
sudo -u postgres createuser --interactive --pwprompt nodepress
# Enter password when prompted (e.g., "password123")
# Answer: Superuser? n, Create databases? y, Create roles? n

# Create the database
sudo -u postgres createdb -O nodepress nodepress

# Verify database was created
sudo -u postgres psql -c "\l" | grep nodepress
```

### Test Database Connection

```bash
# Test connection with the new user
PGPASSWORD=password123 psql -h localhost -U nodepress -d nodepress -c "SELECT 1;"
```

---

## Step 3: Install Redis

### Install Redis Server

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis to start as a service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### (Optional) Configure Redis Password

For additional security, you can set a Redis password:

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Find and uncomment/modify this line:
# requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis-server
```

---

## Step 4: Clone and Configure the Project

### Clone the Repository

```bash
# Clone to your preferred location
cd ~
git clone https://github.com/syntex82/NodePress.git
cd NodePress
```

### Install Dependencies

```bash
# Install backend dependencies
npm install

# Install admin panel dependencies
cd admin && npm install && cd ..
```

### Create Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env
```

### Configure Environment Variables

Update the following values in your `.env` file:

```env
# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://nodepress:password123@localhost:5432/nodepress?schema=public"

# ─────────────────────────────────────────────────────────────
# REDIS (Optional for local development)
# ─────────────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password  # Uncomment if you set a password

# ─────────────────────────────────────────────────────────────
# AUTHENTICATION (Generate secure secrets)
# ─────────────────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
SESSION_SECRET=your-session-secret-key-also-32-characters-long

# ─────────────────────────────────────────────────────────────
# APPLICATION
# ─────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
HOST=localhost
APP_URL=http://localhost:3000

# ─────────────────────────────────────────────────────────────
# ADMIN SEED (Optional - for seeding default admin)
# ─────────────────────────────────────────────────────────────
ADMIN_EMAIL=admin@localhost.dev
ADMIN_PASSWORD=Admin123!
```

### Generate Secure Secrets

You can generate secure secrets using Node.js:

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate a secure session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 5: Setup the Database

### Generate Prisma Client

```bash
# Generate the Prisma client
npx prisma generate
```

### Push Database Schema

```bash
# Push the schema to the database (creates all tables)
npx prisma db push
```

### (Optional) Seed Default Admin User

```bash
# Create default admin user
npx prisma db seed
```

This creates an admin account with the credentials specified in your `.env` file.

### Verify Database Tables

```bash
# Connect to the database and list tables
PGPASSWORD=password123 psql -h localhost -U nodepress -d nodepress -c "\dt"
```

---

## Step 6: Build and Run

### Build the Admin Panel

```bash
cd admin && npm run build && cd ..
```

### Build the Backend

```bash
npm run build
```

### Start Development Server

**Option 1: Production-like Mode (Single Server)**

```bash
npm run dev
```

Access points:
- Frontend: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
- API: http://localhost:3000/api

**Option 2: Development Mode (Hot Reloading)**

Run two terminals:

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Admin Panel with Hot Reload
cd admin && npm run dev
```

Access points:
- Frontend: http://localhost:3000
- Admin Panel: http://localhost:5173 (with hot reload)
- API: http://localhost:3000/api

---

## Development Workflow

### Daily Development

```bash
cd ~/NodePress

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install
cd admin && npm install && cd ..

# Run migrations if schema changed
npx prisma db push

# Start development server
npm run dev
```

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes and test locally**

3. **Check for errors:**
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

5. **Push to your branch:**
   ```bash
   git push origin feature/my-new-feature
   ```

### Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma Studio (database GUI) |
| `npx prisma db push` | Push schema changes to database |
| `npx prisma migrate dev` | Create migration file |
| `npx prisma generate` | Regenerate Prisma client |

---

## Troubleshooting

### PostgreSQL Connection Refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Redis Connection Refused

```bash
# Check if Redis is running
sudo systemctl status redis-server

# Start Redis if not running
sudo systemctl start redis-server

# Test Redis connection
redis-cli ping
```

### Permission Denied on npm install

```bash
# Fix npm permissions (don't use sudo with npm)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/NodePress/node_modules
```

### Prisma Client Not Generated

```bash
# Regenerate Prisma client
npx prisma generate

# If schema changed, push to database
npx prisma db push
```

### Port 3000 Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Database "nodepress" Does Not Exist

```bash
# Create the database
sudo -u postgres createdb -O nodepress nodepress
```

### Native Module Build Errors (Sharp, bcrypt)

```bash
# Install build dependencies
sudo apt install -y build-essential libvips-dev

# Rebuild native modules
npm rebuild
```

---

## Running Without Redis (Optional)

For simplified local development without Redis:

1. Comment out Redis in `.env`:
   ```env
   # REDIS_HOST=localhost
   ```

2. The app will use in-memory fallbacks for:
   - Session storage (MemoryStore)
   - Rate limiting (in-memory)
   - Job queues (disabled)

> ⚠️ **Note:** Some features like background jobs and distributed rate limiting will be disabled without Redis.

---

## Next Steps

- [Production Deployment Guide](./PRODUCTION-DEPLOYMENT.md) - Deploy to Hostinger VPS
- [API Documentation](../README.md#-api-documentation) - Explore the API
- [Plugin Development](../README.md#-plugin-architecture) - Create custom plugins

---

## Quick Reference Card

```bash
# Start everything
cd ~/NodePress && npm run dev

# Open Prisma Studio (database GUI)
npx prisma studio

# Check service status
sudo systemctl status postgresql redis-server

# View logs
pm2 logs  # if using PM2
tail -f ~/.npm/_logs/*  # npm logs

# Database backup
pg_dump -U nodepress -d nodepress > backup.sql

# Database restore
psql -U nodepress -d nodepress < backup.sql
```


