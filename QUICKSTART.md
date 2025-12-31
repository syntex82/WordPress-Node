# Quick Start Guide

Get NodePress up and running in 5 minutes!

## Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL

## Installation

```bash
# 1. Install dependencies
pnpm install
pnpm admin:install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Set up database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 4. Start development servers
# Terminal 1:
pnpm dev

# Terminal 2:
pnpm admin:dev
```

## Access

- **Frontend**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **Login**: admin@example.com / admin123

## What's Included

✅ Complete backend API with NestJS  
✅ React admin dashboard  
✅ PostgreSQL database with Prisma  
✅ JWT authentication  
✅ Role-based access control  
✅ Posts and Pages management  
✅ Media library  
✅ Theme system with default theme  
✅ Plugin system with 2 example plugins  
✅ Sample content and users  

## Next Steps

1. **Login** to the admin panel
2. **Create** your first post
3. **Upload** some media
4. **Explore** themes and plugins
5. **Read** the full [README.md](./README.md) for detailed documentation

## Need Help?

- [Full Setup Guide](./SETUP.md)
- [Development Guide](./DEVELOPMENT.md)
- [README](./README.md)

Happy coding! 🚀

