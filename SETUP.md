# NodePress - Complete Setup Guide

This guide will walk you through setting up the NodePress CMS from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **pnpm** package manager ([Install](https://pnpm.io/installation))
- **PostgreSQL** 12 or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd NodePress
```

## Step 2: Install Backend Dependencies

```bash
pnpm install
```

## Step 3: Install Admin Panel Dependencies

```bash
pnpm admin:install
```

## Step 4: Set Up PostgreSQL Database

### Option A: Using PostgreSQL locally

1. Start PostgreSQL service
2. Create a new database:

```bash
createdb nodepress
```

Or using psql:

```sql
CREATE DATABASE nodepress;
```

### Option B: Using Docker

```bash
docker run --name NodePress-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nodepress \
  -p 5432:5432 \
  -d postgres:15
```

## Step 5: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and update the values:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nodepress?schema=public"

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-change-this

# Admin User (will be created during seeding)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Server
PORT=3000
NODE_ENV=development
```

**Important**: Change the JWT_SECRET and SESSION_SECRET to random, secure strings in production!

## Step 6: Set Up the Database

### Generate Prisma Client

```bash
pnpm db:generate
```

### Run Migrations

```bash
pnpm db:migrate
```

This will create all the necessary tables in your database.

### Seed the Database

```bash
pnpm db:seed
```

This will create:
- Admin user (admin@example.com / admin123)
- Author user (author@example.com / author123)
- Sample posts and pages
- Default theme
- Example plugins (SEO, Analytics)
- Site settings

## Step 7: Start the Development Servers

### Option A: Start both backend and admin panel

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
pnpm dev
```

**Terminal 2 - Admin Panel:**
```bash
pnpm admin:dev
```

### Option B: Use a process manager (recommended)

Install `concurrently`:
```bash
pnpm add -D concurrently
```

Add to package.json scripts:
```json
"dev:all": "concurrently \"pnpm dev\" \"pnpm admin:dev\""
```

Then run:
```bash
pnpm dev:all
```

## Step 8: Access the Application

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin (or http://localhost:5173 during development)
- **API**: http://localhost:3000/api

### Default Login Credentials

- **Email**: admin@example.com
- **Password**: admin123

**Important**: Change these credentials after first login!

## Step 9: Verify Installation

1. Visit http://localhost:3000 - You should see the default theme with sample posts
2. Visit http://localhost:3000/admin - You should see the login page
3. Login with the default credentials
4. You should see the admin dashboard with statistics

## Optional: Open Prisma Studio

To visually inspect and edit your database:

```bash
pnpm db:studio
```

This will open Prisma Studio at http://localhost:5555

## Building for Production

### 1. Build the backend

```bash
pnpm build
```

### 2. Build the admin panel

```bash
pnpm admin:build
```

### 3. Run migrations in production

```bash
pnpm db:migrate:prod
```

### 4. Start the production server

```bash
pnpm start:prod
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env
- Ensure the database exists
- Check PostgreSQL logs

### Port Already in Use

If port 3000 is already in use, change it in .env:
```env
PORT=3001
```

### Prisma Client Not Generated

Run:
```bash
pnpm db:generate
```

### Admin Panel Not Loading

- Ensure both backend and admin dev servers are running
- Check browser console for errors
- Verify proxy configuration in admin/vite.config.ts

### Authentication Issues

- Clear browser localStorage
- Check JWT_SECRET in .env
- Verify token expiration settings

## Next Steps

1. **Change default credentials** in the admin panel
2. **Configure site settings** (name, description, etc.)
3. **Create your first post** or page
4. **Upload media** to the media library
5. **Explore themes** and activate a different one
6. **Try plugins** - activate/deactivate SEO and Analytics plugins
7. **Create custom theme** - See README.md for theme development guide
8. **Create custom plugin** - See README.md for plugin development guide

## Additional Resources

- [README.md](./README.md) - Full documentation
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [React Documentation](https://react.dev)

## Support

If you encounter any issues, please check:
1. This setup guide
2. The main README.md
3. GitHub Issues

Happy coding! 🚀

