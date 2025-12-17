<div align="center">

<!-- Hero Banner -->
<img width="1281" height="745" alt="Screenshot 2025-12-14 043442" src="https://github.com/user-attachments/assets/4e5f2cac-30e2-4461-b519-ce90d1cce293" />

<br />

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mickyblenkd)

<br />

# 🚀 WordPress Node CMS

### **A Modern, Full-Featured Content Management System Built with Node.js**

*Enterprise-grade CMS • E-Commerce • LMS • Email Marketing • AI-Powered*

<br />

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11+-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5+-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3+-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br />

<p align="center">
  <strong>A powerful, extensible CMS platform combining the flexibility of WordPress<br />with the performance and type-safety of modern JavaScript technologies.</strong>
</p>

<br />

[✨ Features](#-features) •
[🛠 Tech Stack](#-tech-stack) •
[📦 Installation](#-installation) •
[⚙️ Configuration](#️-complete-configuration-guide) •
[📁 Project Structure](#-project-structure) •
[📡 API Docs](#-api-documentation) •
[📸 Screenshots](#-screenshots) •
[🤝 Contributing](#-contributing)

<br />

---

</div>

<br />

## ✨ Features

WordPress Node CMS provides a comprehensive set of features for building modern web applications, from simple blogs to complex e-commerce and e-learning platforms.

<br />

### 📝 Content Management

| Feature | Description |
|---------|-------------|
| **Pages & Posts** | Create and manage pages and blog posts with a rich text editor |
| **Media Library** | Upload, organize, and optimize images with automatic resizing and metadata |
| **SEO Management** | Built-in SEO tools with meta tags, Open Graph, Twitter Cards, and sitemap generation |
| **Categories & Tags** | Organize content with hierarchical categories and flexible tagging |
| **Content Revisions** | Track content changes with full version history and rollback support |
| **Custom Content Types** | Define custom content structures for specialized needs |

<br />

### 👥 User Management & Authentication

| Feature | Description |
|---------|-------------|
| **Role-Based Access Control** | Four granular user roles: **Admin**, **Editor**, **Author**, **Viewer** |
| **JWT Authentication** | Secure stateless API authentication with JSON Web Tokens |
| **User Profiles** | Rich user profiles with avatars, bios, social links, and activity tracking |
| **Direct Messaging** | Real-time private messaging system between users |
| **Session Management** | Secure session handling with automatic expiration |

<details>
<summary><strong>🔐 Click to view Role Permissions Matrix</strong></summary>

<br />

| Permission | 👑 Admin | ✏️ Editor | 📝 Author | 👁️ Viewer |
|------------|:--------:|:---------:|:---------:|:---------:|
| Manage Users & Roles | ✅ | ❌ | ❌ | ❌ |
| Manage System Settings | ✅ | ❌ | ❌ | ❌ |
| Install Themes & Plugins | ✅ | ❌ | ❌ | ❌ |
| Manage Shop & Orders | ✅ | ✅ | ❌ | ❌ |
| Manage LMS & Courses | ✅ | ✅ | ❌ | ❌ |
| Publish Any Content | ✅ | ✅ | ❌ | ❌ |
| Edit All Content | ✅ | ✅ | ❌ | ❌ |
| Create & Edit Own Content | ✅ | ✅ | ✅ | ❌ |
| Upload Media | ✅ | ✅ | ✅ | ❌ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Send Messages | ✅ | ✅ | ✅ | ✅ |

</details>

<br />

### 🎨 Theme System

| Feature | Description |
|---------|-------------|
| **Visual Theme Designer** | Drag-and-drop page builder with 30+ content blocks |
| **Live Preview** | Real-time preview of theme changes in an iframe |
| **Multi-Page Themes** | Create themes with multiple page templates (home, about, contact, etc.) |
| **Block-Based Editor** | Headers, heroes, galleries, testimonials, CTAs, forms, and more |
| **Responsive Controls** | Mobile-first design with breakpoint-specific styling |
| **Theme Customizer** | Colors, typography, spacing, and layout customization |
| **Handlebars Templates** | Server-side rendering with powerful template inheritance |

<br />

### 🔌 Plugin Architecture

| Feature | Description |
|---------|-------------|
| **Lifecycle Hooks** | `onInstall`, `onActivate`, `onDeactivate`, `onUninstall` events |
| **Content Hooks** | `beforeSave`, `afterSave`, `beforeDelete`, `afterDelete` |
| **Custom Routes** | Plugins can register their own API endpoints |
| **Admin Pages** | Plugins can add custom pages to the admin panel |
| **Custom Fields** | Register additional fields for content types |
| **ZIP Upload** | Install plugins via ZIP file upload from the admin panel |
| **Dependency Management** | Plugin requirements and dependency tracking |

<br />

### 🛒 E-Commerce / Shop Module

| Feature | Description |
|---------|-------------|
| **Product Management** | Create products with variants (size, color), SKUs, and inventory tracking |
| **Product Categories** | Hierarchical product categorization with images |
| **Shopping Cart** | Persistent cart with session-based and user-based tracking |
| **Checkout Flow** | Complete checkout with shipping address and payment |
| **Order Management** | Order processing, status updates, and order history |
| **Storefront** | Beautiful public-facing shop with product listings and filtering |
| **Product Search** | Full-text search across products |

<br />

### 📚 Learning Management System (LMS)

| Feature | Description |
|---------|-------------|
| **Course Builder** | Create courses with structured modules and lessons |
| **Video Lessons** | Video content hosting with progress tracking |
| **Rich Content** | Support for text, video, audio, and downloadable resources |
| **Quiz System** | Multiple question types (MCQ, true/false, short answer) with auto-grading |
| **Student Enrollment** | Free and paid course enrollment management |
| **Progress Tracking** | Track student progress through lessons and courses |
| **Certificates** | Automatic PDF certificate generation upon course completion |
| **Course Catalog** | Public course browsing with categories and filtering |
| **Instructor Dashboard** | Analytics, student management, and revenue tracking |
| **Course Categories** | Organize courses by topic or subject area |

<br />

### 📊 Analytics & Reporting

| Feature | Description |
|---------|-------------|
| **Analytics Plugin** | Track page views, unique visitors, and user behavior |
| **Dashboard Widgets** | Visual analytics charts on the admin dashboard |
| **Traffic Reports** | View traffic trends, popular pages, and referrers |
| **Export Reports** | Export analytics data in various formats |

<br />

### 📧 Email & Marketing System

| Feature | Description |
|---------|-------------|
| **Visual Email Designer** | Drag-and-drop email template builder with 12+ block types |
| **Media Library Integration** | Select images directly from your media library |
| **Email Templates** | Pre-built templates for welcome, password reset, order confirmation, etc. |
| **SMTP Configuration** | Support for Gmail, SendGrid, Mailgun, AWS SES, and custom SMTP |
| **Email Logs** | Track sent emails with delivery status and timestamps |
| **Template Variables** | Dynamic placeholders for personalization (`{{userName}}`, `{{orderNumber}}`, etc.) |
| **Mobile Preview** | Preview how emails look on desktop and mobile devices |
| **HTML Export** | Generate email-client compatible HTML with table-based layouts |

<br />

### 🛡️ Security Features

| Feature | Description |
|---------|-------------|
| **Two-Factor Authentication** | TOTP-based 2FA with authenticator app support |
| **Session Management** | View and revoke active sessions across devices |
| **Password Policies** | Configurable password strength requirements |
| **Rate Limiting** | Protect against brute force and DDoS attacks |
| **Audit Logging** | Track all admin actions with user, IP, and timestamp |
| **Login Activity** | Monitor successful/failed login attempts with location |
| **IP Blocking** | Block malicious IPs and IP ranges |
| **File Integrity Monitoring** | Detect unauthorized file changes |
| **Security Dashboard** | Centralized view of all security metrics and threats |

<br />

### 🤖 AI-Powered Features

| Feature | Description |
|---------|-------------|
| **AI Theme Designer** | Generate complete themes from text descriptions |
| **Color Palette Generation** | AI-suggested color schemes based on your brand |
| **Content Suggestions** | AI-assisted content block recommendations |
| **Multiple AI Providers** | Support for OpenAI (GPT-4) and Anthropic (Claude) |
| **Rate Limiting** | Configurable API usage limits to control costs |

<br />

### 💳 Payment Integration

| Feature | Description |
|---------|-------------|
| **Stripe Integration** | Full Stripe payment gateway support |
| **Webhook Handling** | Automatic order updates via Stripe webhooks |
| **Multiple Payment Methods** | Cards, Apple Pay, Google Pay (via Stripe) |
| **Secure Checkout** | PCI-compliant payment processing |

<br />

---

## 🛠 Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### 🔧 Backend

| Technology | Purpose |
|------------|---------|
| **Node.js 20+** | JavaScript runtime |
| **NestJS 11** | Enterprise-grade framework |
| **TypeScript 5.9** | Type-safe development |
| **Prisma 5** | Next-generation ORM |
| **PostgreSQL 15+** | Relational database |
| **Redis** | Caching, sessions, job queues |
| **BullMQ** | Background job processing |
| **Passport.js** | Authentication middleware |
| **JWT** | Stateless authentication |
| **Nodemailer** | Email sending |
| **AWS S3** | Cloud file storage |
| **Sharp** | Image processing & optimization |
| **Handlebars** | Server-side templating |
| **Stripe** | Payment processing |

</td>
<td valign="top" width="50%">

### 💻 Frontend (Admin Panel)

| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **TypeScript 5.9** | Type-safe development |
| **Vite 6** | Build tool & dev server |
| **Tailwind CSS 3+** | Utility-first styling |
| **Zustand** | State management |
| **React Router 6+** | Client-side routing |
| **Axios** | HTTP client |
| **React Icons** | Icon library (Feather) |
| **React Hot Toast** | Toast notifications |
| **TipTap** | Rich text editor |

</td>
</tr>
</table>

<br />

---

## 🏗️ Scaling Architecture

WordPress Node CMS is designed for **horizontal scaling** and production deployments. Run multiple instances behind a load balancer to handle increased traffic.

### Architecture Diagram

```
                                    ┌─────────────────┐
                                    │   CloudFlare    │
                                    │   (CDN + WAF)   │
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │     Nginx       │
                                    │ (Load Balancer) │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
     ┌────────▼────────┐            ┌────────▼────────┐            ┌────────▼────────┐
     │   App Instance  │            │   App Instance  │            │   App Instance  │
     │    (Port 3001)  │            │    (Port 3002)  │            │    (Port 3003)  │
     └────────┬────────┘            └────────┬────────┘            └────────┬────────┘
              │                              │                              │
              └──────────────────────────────┼──────────────────────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
     ┌────────▼────────┐            ┌────────▼────────┐            ┌────────▼────────┐
     │   PostgreSQL    │            │      Redis      │            │   S3 / R2       │
     │   (Database)    │            │ (Cache + Queue) │            │ (File Storage)  │
     └─────────────────┘            └─────────────────┘            └─────────────────┘
```

### Infrastructure Components

| Component | Purpose | Scaling Strategy |
|-----------|---------|------------------|
| **Load Balancer** | Distributes traffic across instances | Nginx, AWS ALB, or Cloudflare |
| **App Instances** | Handles API requests | Scale horizontally (add more instances) |
| **PostgreSQL** | Primary data store | Connection pooling, read replicas |
| **Redis** | Caching, sessions, rate limiting, job queues | Redis Cluster for HA |
| **S3/R2 Storage** | File uploads (shared across instances) | CDN for static assets |

### Key Scaling Features

| Feature | Description |
|---------|-------------|
| **Stateless Design** | JWT authentication, no server-side session state |
| **Redis Sessions** | Session data shared across all instances |
| **Redis Rate Limiting** | Distributed rate limiting across instances |
| **Cloud Storage** | S3-compatible storage for file uploads |
| **Background Jobs** | BullMQ queues for async processing |
| **Health Checks** | `/health` endpoints for load balancer probes |
| **Graceful Shutdown** | Clean shutdown on SIGTERM for zero-downtime deploys |
| **Response Compression** | Gzip/Brotli compression for smaller payloads |
| **Connection Pooling** | Optimized database connections |

### Quick Deploy with Docker

```bash
# Clone and configure
git clone https://github.com/syntex82/WordPress-Node.git
cd WordPress-Node
cp .env.example .env
# Edit .env with your configuration

# Deploy with 3 app instances
cd deploy
docker-compose up -d --scale app=3
```

### Health Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Basic liveness check (database connectivity) |
| `GET /health/ready` | Readiness check (all dependencies) |
| `GET /health/detailed` | Full health report with metrics |
| `GET /health/ping` | Simple ping for load balancer |
| `GET /health/info` | Runtime information (version, uptime) |

<br />

---

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| **Node.js** | 18.0+ | `node --version` |
| **npm** or **pnpm** | 9.0+ / 8.0+ | `npm --version` |
| **PostgreSQL** | 14.0+ | `psql --version` |
| **Git** | 2.0+ | `git --version` |

<br />

---

### 🐧 Ubuntu Server - One-Command Install
             sudo chmod +x ubuntu-setup.sh
             sudo bash ubuntu-setup.sh

<div align="center">

**Deploy WordPress Node CMS on Ubuntu Server with a single command!**

</div>



<details>
<summary><strong>📋 What the script installs automatically</strong></summary>

<br />

| Component | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20.x | JavaScript runtime |
| **npm** | Latest | Package manager |
| **PostgreSQL** | 16 | Database server |
| **Redis** | Latest | Caching & sessions |
| **Nginx** | Latest | Reverse proxy |
| **Git** | Latest | Repository cloning |

The script also:
- ✅ Clones the repository to `~/wordpress-node`
- ✅ Creates PostgreSQL database and user
- ✅ Generates secure secrets for JWT and sessions
- ✅ Creates `.env` file with all configuration
- ✅ Installs all npm dependencies (backend + admin)
- ✅ Pushes database schema (`npx prisma db push`)
- ✅ Seeds admin user with default credentials

</details>

<br />

**After installation completes:**

```bash
cd ~/wordpress-node
npm run dev
```

**Then open:** `http://your-server-ip:3000/admin`

**Login:** Use the email and password you entered during setup

<br />

---

### 🚀 Quick Start (Manual)

```bash
# 1️⃣ Clone the repository
git clone https://github.com/yourusername/wordpress-node.git
cd wordpress-node

# 2️⃣ Install all dependencies
npm install
cd admin && npm install && cd ..

# 3️⃣ Set up environment variables
cp .env.example .env
# ⚠️ Edit .env with your database credentials (see below)

# 4️⃣ Setup database (generate client, push schema, seed data)
npm run db:setup

# 5️⃣ Start the development server
npm run dev
```

> 💡 **One-liner alternative for step 4:** If you prefer individual commands, you can run:
> - `npx prisma generate` - Generate Prisma client
> - `npx prisma db push` - Push schema to database
> - `npx prisma db seed` - Seed with initial data (optional)

> 📝 **Note:** `npx prisma db push` syncs your database schema without creating migration files - perfect for development. For production with migration history, use `npx prisma migrate deploy` instead.

<br />

### ⚙️ Quick Environment Setup

Create a `.env` file in the root directory. Here's the minimum required:

```env
# Database (required)
DATABASE_URL="postgresql://user:password@localhost:5432/wordpress_node?schema=public"

# Authentication (required)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
SESSION_SECRET="your-session-secret-key"

# Admin Account for seeding (required)
ADMIN_EMAIL="admin@starter.dev"
ADMIN_PASSWORD="Admin123!"
```

> 💡 **See the [Complete Configuration Guide](#️-complete-configuration-guide) below for all available options including SMTP, Stripe, AI, and more.**

<br />

### 🌐 Access Points

Once running, access the application at:

| Service | URL | Description |
|---------|-----|-------------|
| **Admin Panel** | http://localhost:3000/admin | Administration dashboard |
| **API** | http://localhost:3000/api | RESTful API endpoints |
| **Public Site** | http://localhost:3000 | Public-facing website (with theme) |
| **Storefront** | http://localhost:3000/admin/storefront | E-commerce storefront |
| **Course Catalog** | http://localhost:3000/admin/lms/catalog | LMS course browsing |
| **Health Check** | http://localhost:3000/health | Server health status |

> 💡 **Development Mode:** If running `cd admin && npm run dev` separately, the admin panel will be on http://localhost:5173

<br />

### 🔑 Default Login

After seeding the database, use these default credentials:

```
📧 Email:    admin@starter.dev
🔑 Password: Admin123!
```

> 💡 **Tip:** You can customize these in your `.env` file using `ADMIN_EMAIL` and `ADMIN_PASSWORD` before running the seed command.

<br />

---

## 📁 Project Structure

```
wordpress-node/
│
├── 📂 src/                           # Backend source code (NestJS)
│   ├── 📂 modules/                   # Feature modules
│   │   ├── 📂 auth/                  # Authentication & JWT
│   │   ├── 📂 users/                 # User management
│   │   ├── 📂 content/               # Posts, Pages, Content Types
│   │   ├── 📂 media/                 # Media library & uploads
│   │   ├── 📂 themes/                # Theme system
│   │   ├── 📂 plugins/               # Plugin system
│   │   ├── 📂 settings/              # Site settings
│   │   ├── 📂 shop/                  # E-commerce module
│   │   │   ├── 📂 products/          # Product management
│   │   │   ├── 📂 categories/        # Product categories
│   │   │   ├── 📂 cart/              # Shopping cart
│   │   │   ├── 📂 orders/            # Order management
│   │   │   └── 📂 storefront/        # Public shop pages
│   │   ├── 📂 lms/                   # Learning Management System
│   │   │   ├── 📂 courses/           # Course management
│   │   │   ├── 📂 lessons/           # Lesson management
│   │   │   ├── 📂 quizzes/           # Quiz & questions
│   │   │   ├── 📂 enrollments/       # Student enrollments
│   │   │   ├── 📂 progress/          # Progress tracking
│   │   │   └── 📂 certificates/      # Certificate generation
│   │   ├── 📂 messages/              # Direct messaging
│   │   └── 📂 public/                # Public routes
│   ├── 📂 common/                    # Shared utilities & decorators
│   ├── 📂 database/                  # Prisma service
│   ├── 📄 main.ts                    # Application entry point
│   └── 📄 app.module.ts              # Root module
│
├── 📂 admin/                         # Frontend admin panel (React)
│   ├── 📂 src/
│   │   ├── 📂 components/            # Reusable UI components
│   │   │   ├── 📂 ThemeDesigner/     # Visual theme builder
│   │   │   └── 📂 layout/            # Layout components
│   │   ├── 📂 pages/                 # Page components
│   │   │   ├── 📂 shop/              # Shop admin pages
│   │   │   ├── 📂 lms/               # LMS admin pages
│   │   │   └── 📂 storefront/        # Public storefront pages
│   │   ├── 📂 services/              # API service layer
│   │   ├── 📂 stores/                # Zustand state stores
│   │   ├── 📂 config/                # Configuration files
│   │   └── 📄 App.tsx                # Root component
│   └── 📄 vite.config.ts             # Vite configuration
│
├── 📂 themes/                        # Theme directory
│   └── 📂 developer/                 # Default developer theme
│       ├── 📄 theme.json             # Theme metadata
│       └── 📂 templates/             # Handlebars templates
│
├── 📂 plugins/                       # Plugin directory
│   ├── 📂 seo/                       # SEO plugin
│   └── 📂 analytics/                 # Analytics plugin
│
├── 📂 prisma/                        # Database schema & migrations
│   ├── 📄 schema.prisma              # Prisma schema
│   ├── 📄 seed.ts                    # Database seeder
│   └── 📂 migrations/                # Migration history
│
├── 📂 uploads/                       # Media upload directory
│
├── 📄 .env.example                   # Environment template
├── 📄 package.json                   # Dependencies
└── 📄 README.md                      # This file
```

<br />

---

## ⚙️ Complete Configuration Guide

This section covers ALL environment variables available in the system. Copy `.env.example` to `.env` and configure as needed.

<br />

### 🗄️ Database Configuration

```env
# PostgreSQL connection string (required)
DATABASE_URL="postgresql://username:password@localhost:5432/wordpress_node?schema=public"
```

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string with schema |

<details>
<summary><strong>📖 Database Setup Examples</strong></summary>

<br />

**Local PostgreSQL:**
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/wordpress_node?schema=public"
```

**Docker PostgreSQL:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/wordpress_node?schema=public"
```

**Supabase:**
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?schema=public"
```

**Railway:**
```env
DATABASE_URL="postgresql://postgres:[password]@[host].railway.app:5432/railway?schema=public"
```

</details>

<br />

### 🔐 Authentication & Security

```env
# JWT Configuration (required)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_EXPIRES_IN=7d

# Session Configuration (required)
SESSION_SECRET="your-super-secret-session-key-change-in-production"

# Admin Account for Database Seeding (required for first run)
ADMIN_EMAIL="admin@starter.dev"
ADMIN_PASSWORD="Admin123!"
```

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `JWT_SECRET` | ✅ | - | Secret key for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | ❌ | `7d` | Token expiration (e.g., `1h`, `7d`, `30d`) |
| `SESSION_SECRET` | ✅ | - | Secret for session encryption |
| `ADMIN_EMAIL` | ✅ | - | Default admin email (used in seed) |
| `ADMIN_PASSWORD` | ✅ | - | Admin password |

> ⚠️ **Security Warning:** Always use strong, unique secrets in production. Never commit real secrets to version control!

<br />

### 🌐 Server Configuration

```env
# Application Settings
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Site Configuration
SITE_NAME="WordPress Node"
SITE_DESCRIPTION="A modern CMS built with Node.js"
ACTIVE_THEME=default
```

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `NODE_ENV` | ❌ | `development` | Environment: `development`, `production`, `test` |
| `PORT` | ❌ | `3000` | Server port |
| `APP_URL` | ❌ | `http://localhost:3000` | Public URL of your application |
| `MAX_FILE_SIZE` | ❌ | `10485760` | Max upload size in bytes (10MB) |
| `UPLOAD_DIR` | ❌ | `./uploads` | Directory for uploaded files |
| `SITE_NAME` | ❌ | `WordPress Node` | Site name displayed in UI |
| `SITE_DESCRIPTION` | ❌ | - | Site description for SEO |
| `ACTIVE_THEME` | ❌ | `default` | Currently active theme slug |

<br />

### 📧 Email / SMTP Configuration

Configure email sending for password resets, notifications, and marketing emails.

```env
# SMTP Server Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME="WordPress Node CMS"
```

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `SMTP_HOST` | ❌ | - | SMTP server hostname |
| `SMTP_PORT` | ❌ | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_SECURE` | ❌ | `false` | Use SSL (`true` for port 465) |
| `SMTP_USER` | ❌ | - | SMTP username/email |
| `SMTP_PASS` | ❌ | - | SMTP password or app password |
| `SMTP_FROM` | ❌ | - | Default sender email address |
| `SMTP_FROM_NAME` | ❌ | - | Default sender display name |

<details>
<summary><strong>📖 SMTP Provider Examples</strong></summary>

<br />

**Gmail (with App Password):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App Password from Google Account
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME="My Website"
```
> 📝 To use Gmail, enable 2FA and create an [App Password](https://myaccount.google.com/apppasswords)

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxx  # Your SendGrid API Key
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME="My Website"
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@mg.yourdomain.com
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME="My Website"
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-user
SMTP_PASS=your-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME="My Website"
```

**Mailtrap (Testing):**
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password
SMTP_FROM=test@example.com
SMTP_FROM_NAME="Test App"
```

</details>

<br />

### 💳 Stripe Payment Configuration

Configure Stripe for e-commerce payments.

```env
# Stripe API Keys
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

| Variable | Required | Description |
|----------|:--------:|-------------|
| `STRIPE_PUBLISHABLE_KEY` | ❌ | Stripe publishable key (starts with `pk_`) |
| `STRIPE_SECRET_KEY` | ❌ | Stripe secret key (starts with `sk_`) |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Webhook signing secret (starts with `whsec_`) |

> 📝 Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

> ⚠️ Use `pk_test_` and `sk_test_` keys for development. Switch to `pk_live_` and `sk_live_` for production.

<br />

### 🔴 Redis Configuration (Optional)

Redis is used for caching, session storage, rate limiting, and background job queues. The app works without Redis but with reduced performance.

```env
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `REDIS_HOST` | ❌ | `localhost` | Redis server hostname |
| `REDIS_PORT` | ❌ | `6379` | Redis server port |
| `REDIS_PASSWORD` | ❌ | - | Redis password (if required) |
| `REDIS_DB` | ❌ | `0` | Redis database number |

> 💡 **Local Development:** Install Redis locally or use Docker: `docker run -d -p 6379:6379 redis:alpine`

<br />

### 🤖 AI Theme Designer Configuration

Configure AI-powered theme generation.

```env
# AI Provider: 'openai' or 'anthropic'
AI_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic Configuration (alternative)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx

# Rate Limiting
AI_RATE_LIMIT=10
AI_RATE_LIMIT_WINDOW=3600
```

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `AI_PROVIDER` | ❌ | `openai` | AI provider: `openai` or `anthropic` |
| `OPENAI_API_KEY` | ❌ | - | OpenAI API key (for GPT-4) |
| `ANTHROPIC_API_KEY` | ❌ | - | Anthropic API key (for Claude) |
| `AI_RATE_LIMIT` | ❌ | `10` | Max AI requests per window |
| `AI_RATE_LIMIT_WINDOW` | ❌ | `3600` | Rate limit window in seconds (1 hour) |

> 📝 Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

> 📝 Get your Anthropic API key from [Anthropic Console](https://console.anthropic.com/)

<br />

### 📋 Complete `.env.example`

```env
# ═══════════════════════════════════════════════════════════════════════════
# 🗄️ DATABASE
# ═══════════════════════════════════════════════════════════════════════════
DATABASE_URL="postgresql://user:password@localhost:5432/wordpress_node?schema=public"

# ═══════════════════════════════════════════════════════════════════════════
# 🌐 APPLICATION
# ═══════════════════════════════════════════════════════════════════════════
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# ═══════════════════════════════════════════════════════════════════════════
# 🔐 AUTHENTICATION
# ═══════════════════════════════════════════════════════════════════════════
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# ═══════════════════════════════════════════════════════════════════════════
# 👤 ADMIN ACCOUNT (for seeding)
# ═══════════════════════════════════════════════════════════════════════════
ADMIN_EMAIL=admin@starter.dev
ADMIN_PASSWORD=Admin123!

# ═══════════════════════════════════════════════════════════════════════════
# 📁 FILE UPLOAD
# ═══════════════════════════════════════════════════════════════════════════
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# ═══════════════════════════════════════════════════════════════════════════
# 🌍 SITE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════
SITE_NAME=WordPress Node
SITE_DESCRIPTION=A modern CMS built with Node.js
ACTIVE_THEME=default

# ═══════════════════════════════════════════════════════════════════════════
# 📧 EMAIL / SMTP
# ═══════════════════════════════════════════════════════════════════════════
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=WordPress Node CMS

# ═══════════════════════════════════════════════════════════════════════════
# 💳 STRIPE PAYMENTS
# ═══════════════════════════════════════════════════════════════════════════
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# ═══════════════════════════════════════════════════════════════════════════
# 🤖 AI THEME DESIGNER
# ═══════════════════════════════════════════════════════════════════════════
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
AI_RATE_LIMIT=10
AI_RATE_LIMIT_WINDOW=3600
```

<br />

---

## 📸 Screenshots

<details>
<summary><strong>🖼️ Click to view screenshots</strong></summary>

<br />

### Admin Dashboard
> *Modern dashboard with analytics widgets and quick actions*


<img width="1901" height="946" alt="Screenshot 2025-12-14 045602" src="https://github.com/user-attachments/assets/2aa08167-e39c-4c30-a916-ac8575fd3631" />

<br />

### Theme Designer
> *Visual drag-and-drop page builder with live preview*

<img width="1880" height="881" alt="Screenshot 2025-12-14 044837" src="https://github.com/user-attachments/assets/45ef602a-8ff2-48ac-aa96-100dded7a848" />


<br />

### Shop Management
> *Complete e-commerce product and order management*

<img width="1896" height="868" alt="Screenshot 2025-12-14 045003" src="https://github.com/user-attachments/assets/8a96ea9d-cc1d-4148-85a4-fdc4a3c0e932" />


<br />

### LMS Course Builder
> *Create courses with lessons, quizzes, and curriculum*

<img width="1886" height="958" alt="Screenshot 2025-12-14 045048" src="https://github.com/user-attachments/assets/8bdb0129-8b58-4ada-b0fd-beb431ae0088" />


<br />

### Media Library
> *Upload and organize media with preview and metadata*

<img width="1886" height="898" alt="Screenshot 2025-12-14 045141" src="https://github.com/user-attachments/assets/a4a2b802-a7da-431f-ab95-f6bff7ecc3d4" />


</details>

<br />

---

## 📡 API Documentation

The WordPress Node CMS provides a comprehensive RESTful API for all functionality.

<br />

### 🔐 Authentication

<details>
<summary><strong>POST /api/auth/login</strong> - User login</summary>

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@starter.dev",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@starter.dev",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

</details>

<details>
<summary><strong>GET /api/auth/me</strong> - Get current user</summary>

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "admin@starter.dev",
  "name": "Admin User",
  "role": "ADMIN",
  "avatar": "/uploads/avatar.jpg"
}
```

</details>

<br />

### 📝 Content API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts` | List all posts |
| `GET` | `/api/posts/:id` | Get post by ID |
| `POST` | `/api/posts` | Create new post |
| `PATCH` | `/api/posts/:id` | Update post |
| `DELETE` | `/api/posts/:id` | Delete post |
| `GET` | `/api/pages` | List all pages |
| `GET` | `/api/pages/:id` | Get page by ID |
| `POST` | `/api/pages` | Create new page |
| `PATCH` | `/api/pages/:id` | Update page |
| `DELETE` | `/api/pages/:id` | Delete page |

<br />

### 📦 Media API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/media` | List all media |
| `GET` | `/api/media/:id` | Get media by ID |
| `POST` | `/api/media/upload` | Upload file |
| `DELETE` | `/api/media/:id` | Delete media |

<br />

### 🛒 Shop API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/shop/products` | List products |
| `GET` | `/api/shop/products/:id` | Get product |
| `POST` | `/api/shop/products` | Create product |
| `GET` | `/api/shop/categories` | List categories |
| `GET` | `/api/shop/cart` | Get cart |
| `POST` | `/api/shop/cart/add` | Add to cart |
| `GET` | `/api/shop/orders` | List orders |

<br />

### 📚 LMS API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/lms/courses` | List courses |
| `GET` | `/api/lms/courses/:id` | Get course |
| `POST` | `/api/lms/courses` | Create course |
| `GET` | `/api/lms/courses/:id/lessons` | List lessons |
| `POST` | `/api/lms/enroll/:courseId` | Enroll in course |
| `GET` | `/api/lms/my-courses` | Get enrolled courses |
| `POST` | `/api/lms/progress` | Update progress |

<br />

---

## 🧪 Development Commands

```bash
# ═══════════════════════════════════════════════════════════
# 🚀 DEVELOPMENT
# ═══════════════════════════════════════════════════════════
npm run dev                # Start backend in development mode (with watch)
cd admin && npm run dev    # Start admin panel dev server

# ═══════════════════════════════════════════════════════════
# 🗄️ DATABASE
# ═══════════════════════════════════════════════════════════
npm run db:setup           # ⚡ One command: generate + push + seed (recommended)
npm run db:generate        # Generate Prisma client only
npm run db:push            # Push schema to database (no migration files)
npm run db:migrate         # Create and run migrations (with history)
npm run db:migrate:prod    # Run migrations (production)
npm run db:seed            # Seed database with initial data
npm run db:studio          # Open Prisma Studio (database GUI)

# ═══════════════════════════════════════════════════════════
# 🏗️ BUILD
# ═══════════════════════════════════════════════════════════
npm run build              # Build backend
cd admin && npm run build  # Build admin panel

# ═══════════════════════════════════════════════════════════
# 🧪 TESTING
# ═══════════════════════════════════════════════════════════
npm run test               # Run tests
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# ═══════════════════════════════════════════════════════════
# 🔍 CODE QUALITY
# ═══════════════════════════════════════════════════════════
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
cd admin && npx tsc --noEmit  # Type check admin panel
```

<br />

---

## 🔧 Troubleshooting

Having issues? Check these common problems and solutions:

<br />

### ❌ 401 Unauthorized Errors

**Problem:** API requests return 401 Unauthorized after login, even though you're logged in.

**Solutions:**

| Issue | Solution |
|-------|----------|
| **Old JWT token in cookies** | Clear browser cookies: DevTools (F12) → Application → Cookies → Clear all |
| **Old token in localStorage** | Clear localStorage: DevTools (F12) → Console → `localStorage.clear()` → Refresh |
| **JWT_SECRET changed** | Restart the server after changing JWT_SECRET, then login again |
| **Server using cached secret** | Stop all node processes and restart: `Get-Process -Name node \| Stop-Process -Force` then `npm run dev` |

<br />

### ❌ ERR_CONNECTION_REFUSED

**Problem:** Browser shows "ERR_CONNECTION_REFUSED" when accessing the app.

**Solutions:**

| Issue | Solution |
|-------|----------|
| **Server not running** | Start the server: `npm run dev` |
| **Wrong port** | Check your `.env` PORT setting (default: 3000) |
| **Server crashed** | Check terminal for errors, restart with `npm run dev` |
| **Port already in use** | Kill existing process: `netstat -ano \| findstr :3000` then kill the PID |

<br />

### ❌ Database Connection Errors

**Problem:** Prisma errors or "Cannot connect to database" messages.

**Solutions:**

| Issue | Solution |
|-------|----------|
| **PostgreSQL not running** | Start PostgreSQL service |
| **Wrong DATABASE_URL** | Verify connection string in `.env` matches your database |
| **Database doesn't exist** | Create the database: `createdb wordpress_node` |
| **Migrations not run** | Run migrations: `npx prisma migrate dev` |
| **Prisma client outdated** | Regenerate: `npx prisma generate` |

<br />

### ❌ Admin Panel Not Loading

**Problem:** `/admin` shows blank page or errors.

**Solutions:**

| Issue | Solution |
|-------|----------|
| **Admin not built** | Build admin: `cd admin && npm run build` |
| **Dependencies missing** | Install: `cd admin && npm install` |
| **TypeScript errors** | Check types: `cd admin && npx tsc --noEmit` |
| **Vite dev server** | For development, run `cd admin && npm run dev` separately on port 5173 |

<br />

### ❌ File Upload Errors

**Problem:** Media uploads fail or show errors.

**Solutions:**

| Issue | Solution |
|-------|----------|
| **Upload folder missing** | Create it: `mkdir uploads` |
| **Permission denied** | Check folder permissions (chmod 755 on Linux/Mac) |
| **File too large** | Increase `MAX_FILE_SIZE` in `.env` (default: 10MB) |
| **Wrong upload path** | Verify `UPLOAD_DIR` in `.env` |

<br />

### ❌ Email Not Sending

**Problem:** Password reset or notification emails not arriving.

**Solutions:**

| Issue | Solution |
|-------|----------|
| **SMTP not configured** | Add SMTP settings to `.env` |
| **Gmail blocking** | Enable "Less secure apps" or use App Password with 2FA |
| **Wrong credentials** | Verify SMTP_USER and SMTP_PASS in `.env` |
| **Check spam folder** | Emails may be in recipient's spam/junk folder |

<br />

<br />

### 🔄 Quick Reset

If all else fails, try a complete reset:

```bash
# 1. Stop all processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force  # Windows
pkill -f node  # Linux/Mac

# 2. Clear browser data
# DevTools (F12) → Application → Clear Storage → Clear site data

# 3. Reset database
npx prisma migrate reset --force

# 4. Regenerate and seed
npx prisma generate
npx prisma db seed

# 5. Rebuild admin
cd admin && npm run build && cd ..

# 6. Start fresh
npm run dev
```

<br />

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/yourusername/wordpress-node.git`
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes
5. **Commit** your changes: `git commit -m 'Add amazing feature'`
6. **Push** to your fork: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Keep PRs focused and atomic

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🧪 Test coverage
- 🌐 Translations
- 🎨 UI/UX improvements

<br />

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 WordPress Node CMS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

<br />

---

## 🙏 Acknowledgments

- Inspired by [WordPress](https://wordpress.org/) - The world's most popular CMS
- Built with [NestJS](https://nestjs.com/) - A progressive Node.js framework
- Database powered by [Prisma](https://prisma.io/) - Next-generation ORM
- UI crafted with [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Feather Icons](https://feathericons.com/)

<br />

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

<br />

**Made with ❤️ by the WordPress Node CMS Team**

<br />

[Report Bug](https://github.com/yourusername/wordpress-node/issues) •
[Request Feature](https://github.com/yourusername/wordpress-node/issues) •
[Documentation](https://github.com/yourusername/wordpress-node/wiki)

<br />

---

<sub>🚀 Happy coding!</sub>

</div>

