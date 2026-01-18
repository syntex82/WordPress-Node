# Setting Up NodePress CMS on Windows with Docker: A Complete Guide

**Published:** January 2026  
**Author:** NodePress Team  
**Reading Time:** 10 minutes

---

## Introduction

NodePress is a modern, self-hosted CMS platform built with Node.js, TypeScript, and NestJS. In this comprehensive guide, you'll learn how to set up NodePress on Windows using Docker, making deployment simple and consistent across different environments.

### What You'll Learn

- Installing Docker Desktop on Windows
- Setting up NodePress with Docker Compose
- Configuring PostgreSQL and Redis
- Accessing the admin panel and creating your first content
- Troubleshooting common issues

---

## Prerequisites

Before we begin, ensure you have the following installed on your Windows machine:

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| **Windows** | 10/11 (64-bit) or Windows Server 2019+ | - |
| **Docker Desktop** | Latest | [Download](https://www.docker.com/products/docker-desktop/) |
| **Git** | 2.0+ | [Download](https://git-scm.com/downloads) |

### System Requirements

- **RAM:** 8GB minimum (16GB recommended)
- **Disk Space:** 10GB free space
- **CPU:** 64-bit processor with virtualization support

---

## Step 1: Install Docker Desktop

Docker Desktop provides everything you need to run containerized applications on Windows.

### Installation Steps

1. **Download Docker Desktop** from the [official website](https://www.docker.com/products/docker-desktop/)

2. **Run the installer** and follow the setup wizard

3. **Enable WSL 2** (Windows Subsystem for Linux) when prompted
   - Docker Desktop will guide you through this process
   - You may need to restart your computer

4. **Verify Installation**
   
   Open PowerShell or Command Prompt and run:
   ```powershell
   docker --version
   docker-compose --version
   ```
   
   You should see version information for both commands.

---

## Step 2: Clone the NodePress Repository

Open PowerShell or Command Prompt and navigate to where you want to install NodePress:

```powershell
# Navigate to your desired directory
cd C:\Users\YourUsername\Desktop

# Clone the repository
git clone https://github.com/yourusername/nodepress.git
cd nodepress
```

---

## Step 3: Configure Environment Variables

NodePress uses environment variables for configuration. Let's set them up:

1. **Copy the example environment file:**
   ```powershell
   copy .env.example .env
   ```

2. **Edit the `.env` file** with your preferred text editor (Notepad, VS Code, etc.)

3. **Update the following critical settings:**

```env
# Application Settings
NODE_ENV=production
PORT=3000
APP_URL=http://localhost:3000

# Database Configuration (Docker will use these)
DATABASE_URL=postgresql://nodepress:nodepress123@postgres:5432/nodepress

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Security (IMPORTANT: Change these!)
JWT_SECRET=your-super-secret-jwt-key-change-this-now
SESSION_SECRET=your-super-secret-session-key-change-this-now

# Admin Account
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!

# Site Configuration
SITE_NAME=My NodePress Site
SITE_DESCRIPTION=A modern CMS built with Node.js
ACTIVE_THEME=default
```

> **⚠️ Security Note:** Always change the `JWT_SECRET` and `SESSION_SECRET` to random, secure values in production!

---

## Step 4: Start NodePress with Docker Compose

NodePress includes a development Docker Compose configuration that runs PostgreSQL and Redis in containers.

### Using the Development Setup

The `docker-compose.dev.yml` file runs PostgreSQL and Redis in Docker, while your NodePress app runs directly on Windows for easier development.

**Start the Docker services:**

```powershell
docker-compose -f docker-compose.dev.yml up -d
```

This command will:
- ✅ Download PostgreSQL 16 and Redis 7 images
- ✅ Create persistent volumes for data storage
- ✅ Start both services in the background
- ✅ Expose PostgreSQL on port 5432 and Redis on port 6379

**Verify services are running:**

```powershell
docker-compose -f docker-compose.dev.yml ps
```

You should see both `nodepress-dev-postgres` and `nodepress-dev-redis` with status "Up".

---

## Step 5: Install NodePress Dependencies

Now that Docker services are running, let's set up the NodePress application:

```powershell
# Install backend dependencies
npm install

# Install admin panel dependencies
cd admin
npm install
cd ..
```

---

## Step 6: Initialize the Database

NodePress uses Prisma as its ORM. Let's set up the database schema:

```powershell
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed the database with initial data (optional)
npx prisma db seed
```

The seed command creates:
- A default admin account (using credentials from your `.env` file)
- Sample posts and pages
- Default theme configuration

---

## Step 7: Build the Application

Build both the backend and admin panel:

```powershell
# Build the backend
npm run build

# Build the admin panel
cd admin
npm run build
cd ..
```

---

## Step 8: Start NodePress

You're ready to launch NodePress! You have two options:

### Option 1: Production Mode (Recommended)

Runs the built application with optimized performance:

```powershell
npm run start:prod
```

### Option 2: Development Mode

Runs with hot-reload for development:

```powershell
npm run dev
```

You should see output similar to:

```
[Nest] 12345  - 01/18/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/18/2026, 10:30:01 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 01/18/2026, 10:30:02 AM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 01/18/2026, 10:30:02 AM     LOG Application is running on: http://localhost:3000
```

---

## Step 9: Access Your NodePress Site

Open your web browser and navigate to:

| Service | URL | Description |
|---------|-----|-------------|
| **Admin Panel** | http://localhost:3000/admin | Dashboard for managing content |
| **Public Site** | http://localhost:3000 | Your public-facing website |
| **API** | http://localhost:3000/api | RESTful API endpoints |
| **Health Check** | http://localhost:3000/health | Server status |

### First-Time Login

If you ran the seed command, use these credentials:
- **Email:** The email from your `.env` file (default: `admin@yourdomain.com`)
- **Password:** The password from your `.env` file

If you didn't seed the database, you'll see the **Setup Wizard** at http://localhost:3000/admin/setup

---

## Step 10: Create Your First Content

Once logged in to the admin panel:

1. **Navigate to Posts** → Click "New Post"
2. **Write your content** using the rich text editor
3. **Add a featured image** from the media library
4. **Publish** your post

Your post will now be visible on the public site!

---

## Full Production Deployment with Docker

For a complete production setup with load balancing and multiple app instances, use the production Docker Compose configuration:

### Create Production Docker Compose File

Create a new file `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: nodepress-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: nodepress
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: nodepress
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nodepress"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - nodepress-network

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: nodepress-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - nodepress-network

  # NodePress Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://nodepress:${DB_PASSWORD}@postgres:5432/nodepress
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
      SESSION_SECRET: ${SESSION_SECRET}
    ports:
      - "3000:3000"
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - nodepress-network

volumes:
  postgres_data:
  redis_data:
  uploads_data:

networks:
  nodepress-network:
    driver: bridge
```

### Deploy Production Stack

```powershell
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop all services
docker-compose -f docker-compose.prod.yml down
```

---

## Useful Docker Commands

Here are some helpful commands for managing your NodePress Docker setup:

```powershell
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs for a specific service
docker-compose -f docker-compose.dev.yml logs postgres
docker-compose -f docker-compose.dev.yml logs redis

# Restart a service
docker-compose -f docker-compose.dev.yml restart postgres

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove all data (⚠️ WARNING: This deletes your database!)
docker-compose -f docker-compose.dev.yml down -v

# Access PostgreSQL shell
docker exec -it nodepress-dev-postgres psql -U nodepress -d nodepress

# Access Redis CLI
docker exec -it nodepress-dev-redis redis-cli
```

---

## Troubleshooting

### Issue: Docker services won't start

**Solution:**
```powershell
# Check if ports are already in use
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# If ports are in use, stop the conflicting services or change ports in docker-compose.dev.yml
```

### Issue: "Cannot connect to database"

**Solution:**
```powershell
# Verify PostgreSQL is running
docker-compose -f docker-compose.dev.yml ps

# Check PostgreSQL logs
docker-compose -f docker-compose.dev.yml logs postgres

# Ensure DATABASE_URL in .env matches Docker configuration
# Should be: postgresql://nodepress:nodepress123@localhost:5432/nodepress
```

### Issue: "Port 3000 already in use"

**Solution:**
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change the port in your .env file
# PORT=3001
```

### Issue: Prisma client errors

**Solution:**
```powershell
# Regenerate Prisma client
npx prisma generate

# Reset database (⚠️ WARNING: This deletes all data!)
npx prisma db push --force-reset
```

### Issue: Admin panel shows blank page

**Solution:**
```powershell
# Rebuild the admin panel
cd admin
npm run build
cd ..

# Clear browser cache and hard refresh (Ctrl + Shift + R)
```

---

## Performance Optimization

### Enable Redis Caching

Redis significantly improves performance. Ensure these settings in your `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=300
```

### Adjust Docker Resource Limits

In Docker Desktop:
1. Click the **Settings** icon
2. Go to **Resources**
3. Allocate at least:
   - **CPUs:** 2
   - **Memory:** 4GB
   - **Swap:** 1GB

---

## Backup and Restore

### Backup Database

```powershell
# Create backup
docker exec nodepress-dev-postgres pg_dump -U nodepress nodepress > backup.sql

# With timestamp
docker exec nodepress-dev-postgres pg_dump -U nodepress nodepress > backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
```

### Restore Database

```powershell
# Restore from backup
type backup.sql | docker exec -i nodepress-dev-postgres psql -U nodepress -d nodepress
```

### Backup Uploads

```powershell
# Copy uploads folder
xcopy /E /I uploads uploads_backup
```

---

## Next Steps

Congratulations! You now have NodePress running on Windows with Docker. Here's what to explore next:

1. **Customize Your Theme**
   - Navigate to `themes/default`
   - Modify templates and styles
   - See [THEME_CUSTOMIZER_GUIDE.md](./THEME_CUSTOMIZER_GUIDE.md)

2. **Install Plugins**
   - Check out `plugins/` directory
   - Enable SEO, Analytics, or PWA plugins
   - Create custom plugins

3. **Configure Email**
   - Set up SMTP in `.env` for password resets and notifications
   - Test with Gmail or your email provider

4. **Set Up SSL**
   - Use a reverse proxy like Nginx
   - Get free SSL certificates with Let's Encrypt

5. **Deploy to Production**
   - See [PRODUCTION-DEPLOYMENT.md](./docs/PRODUCTION-DEPLOYMENT.md)
   - Consider cloud hosting (AWS, DigitalOcean, Hostinger)

---

## Additional Resources

- **Official Documentation:** [README.md](./README.md)
- **Development Guide:** [DEVELOPMENT.md](./DEVELOPMENT.md)
- **API Documentation:** http://localhost:3000/api/docs (when running)
- **GitHub Repository:** https://github.com/yourusername/nodepress
- **Community Support:** [Discord/Forum Link]

---

## Conclusion

You've successfully set up NodePress CMS on Windows using Docker! This setup provides a robust, scalable foundation for your content management needs. Docker ensures consistency across development and production environments, making deployment and scaling straightforward.

Whether you're building a blog, corporate website, or complex web application, NodePress gives you the flexibility and power of a modern CMS with the simplicity of WordPress.

Happy publishing! 🚀

---

**About NodePress**

NodePress is an open-source, self-hosted CMS platform built with modern technologies:
- **Backend:** Node.js, NestJS, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Caching:** Redis
- **Admin Panel:** React, TypeScript, Vite
- **Features:** Posts, Pages, Media Library, Themes, Plugins, User Management, SEO, PWA support

**License:** MIT
**Version:** 1.0.1
**Last Updated:** January 2026

