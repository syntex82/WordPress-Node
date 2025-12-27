<div align="center">

<!-- Hero Banner -->
<img width="1007" height="592" alt="Screenshot 2025-12-19 234046" src="https://github.com/user-attachments/assets/9c4a0cd6-d4aa-4d45-864f-48abb954e72b" />


<br />

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mickyblenkd)

https://github.com/sponsors/syntex82

<br />

# 🚀 WordPress Node CMS

### **A Modern, Full-Featured Content Management System Built with Node.js**


https://github.com/user-attachments/assets/bd8a8a34-a0d5-432d-8555-5d74f8ee886b




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
| **Password Reset** | Secure email-based password reset with expiring tokens (1 hour) |
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

### 📱 Mobile Responsiveness

| Feature | Description |
|---------|-------------|
| **Device Detection** | Automatic detection of mobile, tablet, and desktop devices (server-side + client-side) |
| **Responsive Breakpoints** | CSS breakpoints for 1024px, 768px, 480px (Galaxy A55), and 375px |
| **Mobile Navigation** | Hamburger menu with slide-out drawer and touch-friendly overlay |
| **Touch Optimizations** | Minimum 44px tap targets, disabled hover effects on touch devices |
| **iOS Input Handling** | 16px font inputs to prevent auto-zoom on iOS Safari |
| **Adaptive UI** | CSS classes (`device-mobile`, `device-tablet`, `touch-device`) for conditional styling |
| **Mobile Learning Player** | Collapsible sidebar with floating toggle button for course learning |

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

### 📱 Progressive Web App (PWA)

| Feature | Description |
|---------|-------------|
| **Install as App** | Install the site as a native-like app on mobile and desktop devices |
| **Offline Support** | Service worker caching ensures basic functionality when offline |
| **Web App Manifest** | Configurable app name, icons, theme colors, and display mode |
| **Offline Page** | Custom offline fallback page when network is unavailable |
| **Auto-Registration** | Service worker automatically registered on all theme pages |
| **Cross-Platform** | Works on Android (Chrome), iOS (Safari), Windows, macOS, and Linux |

> 💡 **Note:** PWA features require HTTPS in production. On localhost, HTTP is allowed for development.

<br />

### 💬 Real-Time Messaging & Media Sharing

| Feature | Description |
|---------|-------------|
| **Direct Messaging** | Real-time private messaging between users via WebSocket |
| **Group Chat** | Create and join group conversations with multiple users |
| **Media Sharing** | Send images and videos in direct messages and group chats |
| **Media Preview** | Preview images/videos with thumbnail and file size before sending |
| **Lightbox Viewer** | Full-screen media viewer with zoom support |
| **Online Status** | See which users are currently online |
| **Connection Indicator** | Visual WebSocket connection status in the UI |
| **Delivery Confirmation** | Messages confirmed as saved before showing success |

<br />

### 📹 Video Calling (WebRTC)

| Feature | Description |
|---------|-------------|
| **1-on-1 Video Calls** | Direct peer-to-peer video calling between users in DMs |
| **Incoming Call Notification** | Full-screen ringing modal with Accept/Decline buttons |
| **WebRTC Connection** | Direct browser-to-browser video/audio streaming |
| **WebSocket Signaling** | Real-time signaling via Socket.IO for call setup (offer/answer/ICE) |
| **TURN/STUN Servers** | NAT traversal with Google STUN + Metered TURN servers for reliable connections |
| **Call Controls** | Mute audio, toggle camera, switch camera (front/back), end call |
| **Picture-in-Picture** | Local video preview in corner while viewing remote video fullscreen |
| **Call Timer** | Duration displayed during active video calls |
| **Fullscreen Mode** | Toggle fullscreen for immersive video experience |
| **Permission Handling** | Graceful camera/microphone permission requests with retry support |
| **Connection Status** | Visual indicators for connecting, connected, and ended states |
| **Group Video Calls** | Multi-participant video meetings in group chats (via Metered rooms) |

> 💡 **1-on-1 Calls:** Admin Panel → Messages → Select a DM conversation → Click the 📞 phone icon (green when user is online)
>
> 💡 **Group Calls:** Admin Panel → Messages → Select a group conversation → Click the 📞 phone icon → All members can join

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
| **Encrypted Configuration** | AES-256-GCM encryption for sensitive database fields (SMTP passwords, API keys) |
| **Environment Validation** | Startup validation of required security variables in production |

<br />

### 🔄 Auto-Update System

| Feature | Description |
|---------|-------------|
| **Pull Latest** | One-click update from GitHub main branch for quick fixes (Admin Panel → Updates → Pull Latest) |
| **Check for Releases** | Check for official GitHub releases with compatibility info |
| **One-Click Updates** | Download, extract, and apply updates with progress tracking |
| **Pre-Update Backups** | Automatic backup creation before applying updates |
| **Database Migrations** | Automatic Prisma migration execution during updates |
| **Rollback Capability** | Revert to previous version if an update fails |
| **Update History** | Track all update attempts with status, errors, and timestamps |
| **Update Logs** | Real-time logs showing git pull, npm install, build, and migration output |

<br />

### 💾 Backup & Restore

| Feature | Description |
|---------|-------------|
| **Full Backups** | Create complete backups of database, media, themes, and plugins |
| **Selective Restore** | Choose what to restore: database, media, themes, or plugins |
| **Backup History** | View and manage all backup files with size and timestamp |
| **Download Backups** | Download backup ZIP files for off-site storage |
| **Quick Backups** | One-click backup creation from admin panel |
| **Database-Only Backups** | Create lightweight database-only backups |

<br />

### ⚙️ Admin Configuration & Setup

| Feature | Description |
|---------|-------------|
| **Setup Wizard** | Guided first-time installation with admin account creation and optional SMTP setup |
| **Email Settings Panel** | Configure SMTP server, credentials, and test email delivery via admin UI |
| **Domain Settings Panel** | Set frontend URL, admin URL, site name, and support email via admin UI |
| **Database-Driven Config** | Runtime-configurable settings stored in database (no server restart needed) |
| **Config Encryption** | All sensitive settings encrypted with AES-256-GCM before storage |
| **Environment Override** | Production environment variables override database config when needed |

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

### 👨‍💻 Developer Marketplace

| Feature | Description |
|---------|-------------|
| **Developer Profiles** | Rich developer profiles with skills, portfolio, hourly rates, and availability |
| **Hire a Developer** | Public page for clients to browse and hire developers |
| **Hiring Requests** | Workflow for submitting and responding to hiring requests |
| **Project Management** | Full project lifecycle with milestones, progress tracking, and messaging |
| **Escrow Payments** | Secure escrow system - funds held until work is completed |
| **Stripe Connect** | Developer payouts via Stripe Connect with automated transfers |
| **Rating & Reviews** | 5-star rating system with verified reviews after project completion |
| **Dispute Resolution** | Built-in dispute handling with admin mediation |
| **Developer Dashboard** | Analytics, earnings, and project management for developers |
| **Marketplace Admin** | Complete admin panel for managing developers, projects, and payments |

<details>
<summary><strong>🔧 Click to view Developer Marketplace Routes</strong></summary>

<br />

**Public Routes:**
| Route | Description |
|-------|-------------|
| `/hire-developer` | Browse and search available developers |
| `/developer-marketplace` | Full marketplace with filters and categories |
| `/developer/:slug` | Individual developer profile page |

**API Endpoints:**
| Endpoint | Description |
|----------|-------------|
| `GET /api/marketplace/developers` | List all developers |
| `POST /api/marketplace/developers` | Apply as developer |
| `GET /api/marketplace/hiring-requests` | List hiring requests |
| `POST /api/marketplace/hiring-requests` | Create hiring request |
| `GET /api/marketplace/projects` | List projects |
| `POST /api/marketplace/projects` | Create project |
| `GET /api/marketplace/payments/transactions` | Transaction history |
| `POST /api/marketplace/payments/payout` | Request payout |

</details>

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

<div align="center">

**Deploy WordPress Node CMS on Ubuntu Server with a single command!**

</div>

#### Fresh Installation

```bash
# Clone the repository
git clone https://github.com/syntex82/WordPress-Node.git
cd WordPress-Node

# Run the setup script
chmod +x scripts/ubuntu-setup.sh
sudo ./scripts/ubuntu-setup.sh
```

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
- ✅ Installs all npm dependencies (backend + admin)
- ✅ **Builds the admin frontend** (`npm run build`)
- ✅ **Builds the backend** (`npm run build`)
- ✅ Creates PostgreSQL database and user
- ✅ Generates secure secrets for JWT and sessions
- ✅ Creates `.env` file with all configuration
- ✅ Pushes database schema (`npx prisma db push`)
- ✅ Seeds admin user with default credentials
- ✅ Sets up systemd service for auto-start
- ✅ Includes pre-built themes: **my-theme** (default) and **tester**

</details>

<br />

#### 🔄 Updating Existing Installation

To update an existing Ubuntu installation with the latest fixes and features:

```bash
cd /home/WordPress-Node

# Discard any local changes to scripts (required before pulling)
git checkout scripts/

# Pull latest code
git pull origin main

# Run the update script
chmod +x scripts/update.sh
sudo ./scripts/update.sh
```

The update script will:
- ✅ Create a backup before updating
- ✅ Install new dependencies
- ✅ Rebuild admin panel and backend
- ✅ Apply database migrations
- ✅ Restart the systemd service

<br />

**Access the application:**

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `http://your-server-ip:3000` | Public-facing website with theme |
| **Admin Panel** | `http://your-server-ip:3000/admin` | Administration dashboard |
| **API** | `http://your-server-ip:3000/api` | RESTful API endpoints |
| **Health Check** | `http://your-server-ip:3000/health` | Server health status |

**Default Login Credentials:**
```
📧 Email:    admin@starter.dev
🔑 Password: Admin123!
```

> 💡 **Tip:** You can customize the admin email and password in the script before running it.

<br />

---

### 🌐 Hostinger VPS - Complete Production Deployment

<div align="center">

**Deploy WordPress Node CMS on Hostinger VPS with a custom domain and SSL!**

</div>

This guide covers deploying to a Hostinger VPS with a custom domain (e.g., `wordpressnode.co.uk`).

#### Prerequisites

- A Hostinger VPS with Ubuntu 22.04/24.04
- A domain name pointed to your VPS IP address
- SSH access to your VPS

#### Step 1: Initial Server Setup

```bash
# Connect to your VPS via SSH
ssh root@your-vps-ip

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clone the repository
git clone https://github.com/syntex82/WordPress-Node.git /var/www/WordPress-Node
cd /var/www/WordPress-Node

# Run the Ubuntu setup script
chmod +x scripts/ubuntu-setup.sh
sudo ./scripts/ubuntu-setup.sh
```

#### Step 2: Configure Nginx for Your Domain

Create nginx configuration for your domain:

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

Add this configuration (replace `yourdomain.com` with your actual domain):

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # API routes with rate limiting
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        send_timeout 600s;
    }

    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io WebSocket connections (for real-time chat)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # All other routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
```

Enable the site and test configuration:

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### Step 3: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify firewall status
sudo ufw status
```

#### Step 4: Setup PM2 Process Manager

```bash
cd /var/www/WordPress-Node

# Build the application
npm run build

# Start with PM2
pm2 start dist/main.js --name wordpress-node

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs (starts with sudo env PATH=...)
```

#### Step 5: Install SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Reload nginx with new SSL config
sudo systemctl reload nginx
```

Certbot will automatically:
- Obtain a free Let's Encrypt SSL certificate
- Configure nginx for HTTPS
- Set up automatic certificate renewal

#### Step 6: Configure Domain Settings in Admin Panel

After SSL is installed, update your domain configuration:

1. Go to: `https://yourdomain.com/admin`
2. Navigate to: **Settings → Domain Configuration**
3. Update the URLs:
   - **Frontend URL:** `https://yourdomain.com`
   - **Admin URL:** `https://yourdomain.com/admin`
   - **Site Name:** Your site name
   - **Support Email:** Your support email
4. Click **Save**

#### Step 7: Update Admin Password (Recommended)

```bash
cd /var/www/WordPress-Node

# Connect to PostgreSQL and update password
# First, generate a bcrypt hash for your new password
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourNewSecurePassword123!', 10).then(h => console.log(h));"

# Update password in database (replace HASH with the output above)
sudo -u postgres psql -d wordpress_node -c "UPDATE \"User\" SET password = '\$2b\$10\$YOUR_HASH_HERE' WHERE email = 'admin@starter.dev';"
```

#### Verification Commands

```bash
# Check nginx status
sudo systemctl status nginx

# Check PM2 processes
pm2 status

# Check application logs
pm2 logs wordpress-node

# Test nginx configuration
sudo nginx -t

# Check SSL certificate
sudo certbot certificates

# Test DNS resolution
dig yourdomain.com
nslookup yourdomain.com
```

#### Updating Your Installation

Use the built-in update feature in the admin panel:

1. Go to: `https://yourdomain.com/admin`
2. Navigate to: **Settings → Updates**
3. Click: **Pull Latest**

Or update manually via SSH:

```bash
cd /var/www/WordPress-Node
git pull origin main
cd admin && npm install && npm run build && cd ..
npm install && npm run build
npx prisma migrate deploy
pm2 restart wordpress-node
```

#### Troubleshooting

<details>
<summary><strong>🔧 Common Issues and Solutions</strong></summary>

<br />

**Site not loading / Connection timeout:**
```bash
# Check if nginx is running
sudo systemctl status nginx

# Check if app is running
pm2 status

# Check firewall
sudo ufw status

# Check if ports are listening
sudo ss -tlnp | grep -E ':80|:443'
```

**502 Bad Gateway:**
```bash
# Check PM2 process
pm2 status
pm2 logs wordpress-node --lines 50

# Restart the app
pm2 restart wordpress-node
```

**504 Gateway Timeout:**
```bash
# Increase nginx timeouts in your config
sudo nano /etc/nginx/sites-available/yourdomain.com
# Add/update: proxy_read_timeout 600s;
sudo nginx -t && sudo systemctl reload nginx
```

**SSL Certificate Issues:**
```bash
# Renew certificate manually
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

**Database Connection Issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d wordpress_node -c "SELECT 1;"
```

**Git Permission Issues:**
```bash
# Fix git ownership
git config --global --add safe.directory /var/www/WordPress-Node
```

</details>

<br />

#### Access Points

| Service | URL |
|---------|-----|
| **Frontend** | `https://yourdomain.com` |
| **Admin Panel** | `https://yourdomain.com/admin` |
| **API** | `https://yourdomain.com/api` |
| **Health Check** | `https://yourdomain.com/health` |

<br />

---

### ☁️ Render.com - Cloud Deployment

<div align="center">

**Deploy WordPress Node CMS to Render.com with automatic builds from GitHub!**

</div>

Render provides a simple way to deploy Docker-based applications with free SSL, automatic deploys, and managed PostgreSQL.

#### Prerequisites

- A [Render.com](https://render.com) account (free tier available)
- Your code pushed to GitHub

#### Step 1: Create a PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Configure:
   - **Name:** `wordpress-node-db`
   - **Database:** `wordpress_node`
   - **User:** `wordpress_node`
   - **Region:** Oregon (or closest to your users)
   - **Plan:** Free (or Starter for production)
4. Click **Create Database**
5. Copy the **Internal Database URL** (for connecting from your web service)

#### Step 2: Create a Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `wordpress-node` |
| **Region** | Same as database (e.g., Oregon) |
| **Branch** | `main` |
| **Runtime** | Docker |
| **Instance Type** | Free (suspends after inactivity) or Starter ($7/mo - always on) |

#### Step 3: Set Environment Variables

Add these environment variables in the Render dashboard:

| Variable | Value | Required |
|----------|-------|:--------:|
| `DATABASE_URL` | Your PostgreSQL Internal URL | ✅ |
| `JWT_SECRET` | A random 32+ character string | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `SESSION_SECRET` | A random secret string | ✅ |
| `CORS_ORIGIN` | `https://your-app.onrender.com` | Optional |

> 💡 **Tip:** Click "Generate" next to JWT_SECRET and SESSION_SECRET to create secure random values.

#### Step 4: Deploy

1. Click **Create Web Service**
2. Wait for the Docker build (5-15 minutes for first deploy)
3. Once deployed, access your app at `https://your-app.onrender.com`

#### Render-Specific Notes

| Topic | Details |
|-------|---------|
| **Free Tier Limits** | Service suspends after 15 minutes of inactivity; 750 hours/month |
| **Cold Starts** | Free tier takes 30-60 seconds to wake up after suspension |
| **Database** | Free PostgreSQL expires after 90 days; Starter plan is $7/month |
| **Custom Domains** | Add custom domains in the service settings |
| **Auto-Deploy** | Enabled by default - pushes to `main` trigger redeploys |
| **Health Checks** | Render automatically checks `/health` endpoint |

#### Using render.yaml (Blueprint)

For automated infrastructure setup, create a `render.yaml` in your repo root:

```yaml
services:
  - type: web
    name: wordpress-node
    runtime: docker
    region: oregon
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: wordpress-node-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: SESSION_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production

databases:
  - name: wordpress-node-db
    plan: starter
    region: oregon
```

Then click **New** → **Blueprint** in Render dashboard and connect your repo.

#### Troubleshooting Render Deployments

<details>
<summary><strong>🔧 Common Issues and Solutions</strong></summary>

<br />

**Build Failed - Docker Error:**
- Check the build logs for specific errors
- Ensure `Dockerfile` exists in the repository root
- Verify all dependencies are listed in `package.json`

**502 Bad Gateway:**
- Check if the service is still deploying
- View logs for application errors
- Ensure DATABASE_URL is correct

**Service Suspended:**
- Free tier services suspend after inactivity
- Visit your app URL to wake it up
- Upgrade to Starter plan ($7/mo) for always-on

**Database Connection Failed:**
- Use the **Internal Database URL** (not External)
- Ensure database and web service are in the same region
- Check that the database is running

</details>

<br />

---

### 📱 Google Play Store - PWA to Android App

<div align="center">

**Publish WordPress Node CMS as a native Android app on the Google Play Store!**

</div>

WordPress Node CMS includes full PWA (Progressive Web App) support, which means you can package it as a native Android app using Trusted Web Activity (TWA).

#### Prerequisites

- Your app deployed and running (e.g., on Render.com)
- A [Google Play Developer account](https://play.google.com/console) ($25 one-time fee)
- The app must be served over HTTPS

#### Step 1: Verify PWA Requirements

Your deployment must have:

| Requirement | Status | Location |
|-------------|:------:|----------|
| HTTPS | ✅ | Automatic on Render.com |
| Web App Manifest | ✅ | `/api/pwa/manifest.json` |
| Service Worker | ✅ | `/service-worker.js` |
| Icons (192x192 & 512x512) | ✅ | `/api/pwa/icons/` |
| Offline Support | ✅ | Built-in |

Test your PWA at: https://pwabuilder.com

#### Step 2: Generate Android Package with PWABuilder

**Option A: PWABuilder Website**

1. Go to [pwabuilder.com](https://pwabuilder.com)
2. Enter your app URL: `https://your-app.onrender.com`
3. Click **Start** and wait for analysis
4. Click **Package for stores** → **Android**
5. Configure:
   - **Package ID:** `com.yourcompany.wpnode`
   - **App name:** `WP Node`
   - **App version:** `1.0.0`
6. **Generate signing key** (save securely - you'll need it for updates!)
7. Download the **AAB file** (Android App Bundle)

**Option B: PWABuilder Studio (VS Code Extension)**

1. Install "PWABuilder Studio" extension in VS Code
2. Press `Ctrl+Shift+P` → "PWABuilder Studio"
3. Enter your app URL
4. Follow the wizard to generate the Android package

#### Step 3: Set Up Digital Asset Links

For TWA to work, you need to verify ownership of your domain:

1. After generating the AAB, PWABuilder provides a `assetlinks.json` file
2. The file is automatically served at `/.well-known/assetlinks.json` in WordPress Node
3. Update it with your signing key fingerprint:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.yourcompany.wpnode",
    "sha256_cert_fingerprints": ["YOUR:SHA256:FINGERPRINT:HERE"]
  }
}]
```

> 💡 PWABuilder provides the fingerprint when you generate the signing key.

#### Step 4: Create Google Play Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay the $25 one-time registration fee
3. Complete identity verification
4. Accept the Developer Distribution Agreement

#### Step 5: Create App Listing

In Google Play Console:

1. Click **Create app**
2. Fill in app details:
   - **App name:** WP Node
   - **Default language:** English
   - **App or game:** App
   - **Free or paid:** Free

3. Complete all required sections:

| Section | What to Add |
|---------|-------------|
| **Store listing** | Description, screenshots, feature graphic |
| **App content** | Privacy policy, content ratings, target audience |
| **Main store listing** | Short & full descriptions |

#### Step 6: Upload App Bundle

1. Go to **Production** → **Create new release**
2. Upload your `.aab` file
3. Add release notes
4. Review and roll out

#### Store Listing Content

Use this for your app listing:

**Short Description (80 chars):**
```
Modern CMS with real-time messaging, video calls, and collaboration tools.
```

**Full Description:**
```
WP Node is a powerful, modern content management system that brings
real-time collaboration to your fingertips.

🚀 KEY FEATURES

📱 Real-Time Messaging
• Instant messaging with other users
• Rich media support (images, files, emojis)
• Push notifications for new messages

📹 Video Calling
• One-on-one video calls
• Crystal clear audio and video
• Works on WiFi and mobile data

📝 Content Management
• Create and edit posts with rich text editor
• Media library for images and files
• SEO-friendly URLs

🛒 E-Commerce Ready
• Product catalog management
• Shopping cart and checkout
• Stripe payment integration

📚 Learning Management (LMS)
• Create online courses
• Video lessons and quizzes
• Student progress tracking

Download WP Node today!
```

**Screenshots Needed:**
1. Dashboard view
2. Messages/chat interface
3. Video calling
4. Post editor
5. Shop/products page
6. Course catalog

#### App Permissions

In your app manifest, these permissions are requested:

| Permission | Reason |
|------------|--------|
| Camera | For video calls |
| Microphone | For audio in video calls |
| Notifications | For message alerts |

> 💡 These are declared in the TWA manifest and prompted at runtime.

#### After Submission

- Google review takes 1-3 days for new apps
- You'll receive an email when approved
- Once approved, your app appears in the Play Store within hours

#### Updating Your App

1. Increment version in PWABuilder
2. Generate new AAB with same signing key
3. Upload to Play Console → Create new release
4. Roll out update

<br />

---

### 🪟 Windows 11 & Windows Server - One-Command Install

<div align="center">

**Deploy WordPress Node CMS on Windows 11 or Windows Server with a single command!**

</div>

#### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/syntex82/WordPress-Node.git
cd WordPress-Node
```

2. **Run the setup script:**
   - **Option A (Easiest):** Double-click `scripts/windows-setup.bat`
   - **Option B (Manual):** Open PowerShell as Administrator and run:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows-setup.ps1
```

<details>
<summary><strong>📋 What the script installs automatically</strong></summary>

<br />

| Component | Version | Purpose |
|-----------|---------|---------|
| **Chocolatey** | Latest | Windows package manager |
| **Node.js** | 20.x | JavaScript runtime |
| **npm** | Latest | Package manager |
| **PostgreSQL** | 15 | Database server |
| **Redis** | Latest | Caching & sessions |
| **Git** | Latest | Repository cloning |

The script also:
- ✅ Installs all npm dependencies (backend + admin)
- ✅ Rebuilds native modules for Windows
- ✅ **Builds the admin frontend** (`npm run build`)
- ✅ **Builds the backend** (`npm run build`)
- ✅ Creates PostgreSQL database and user
- ✅ Generates secure secrets for JWT and sessions
- ✅ Creates `.env` file with all configuration
- ✅ Pushes database schema (`npx prisma db push`)
- ✅ Creates uploads and themes directories
- ✅ Includes pre-built themes: **my-theme** (default) and **tester**

</details>

<br />

#### 🚀 Starting the Servers

After setup completes, you need to start the servers:

**Option 1: Production Mode (Recommended)**

Start from the `WordPress-Node` directory - this serves both backend and the pre-built admin panel:

```powershell
cd WordPress-Node
npm run dev
```

**Option 2: Development Mode (Hot Reloading for Admin)**

For frontend development with hot reloading, run both servers:

```powershell
# Terminal 1 - Backend Server (from WordPress-Node directory)
cd WordPress-Node
npm run dev

# Terminal 2 - Admin Frontend with Hot Reload (from admin directory)
cd WordPress-Node\admin
npm run dev
```

| Mode | Backend URL | Admin URL | Use Case |
|------|-------------|-----------|----------|
| **Production** | `http://localhost:3000` | `http://localhost:3000/admin` | Normal usage |
| **Development** | `http://localhost:3000` | `http://localhost:5173` | Admin panel development |

<br />

#### 🧙 Setup Wizard (Fresh Install)

For fresh installations without a seeded admin account, use the **Setup Wizard**:

1. **Navigate to:** `http://localhost:3000/admin/setup`
2. **Step 1 - Welcome:** Click "Get Started"
3. **Step 2 - Admin Account:** Enter your name, email, and password (min 8 characters)
4. **Step 3 - Email Settings:** Configure SMTP or skip for later
5. **Step 4 - Complete:** Click "Go to Login" to finish

> 💡 **Note:** The Setup Wizard only appears on fresh installations. If you ran the seed script, an admin already exists and you'll be redirected to login.

**To reset and use the Setup Wizard:**
```powershell
# Delete existing users and setup status to trigger wizard
npx prisma db execute --stdin <<< "DELETE FROM ""SetupStatus""; DELETE FROM ""User"";"
```

Then navigate to `http://localhost:3000/admin/setup`

<br />

#### 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Setup Wizard** | `http://localhost:3000/admin/setup` | First-time installation wizard |
| **Admin Panel** | `http://localhost:3000/admin` | Administration dashboard |
| **Frontend** | `http://localhost:3000` | Public-facing website with theme |
| **API** | `http://localhost:3000/api` | RESTful API endpoints |
| **Health Check** | `http://localhost:3000/health` | Server health status |

**Default Login Credentials (if seeded):**
```
📧 Email:    admin@starter.dev
🔑 Password: Admin123!
```

> 💡 **Tip:** The script automatically installs Chocolatey if not already installed. Make sure to run PowerShell as Administrator.

#### 📝 Environment Configuration File Location

The setup script automatically creates a `.env` file in your project root directory with all the necessary configuration:

```
c:\Users\<YourUsername>\WordPress-Node\.env
```

**To modify the admin password or email after setup:**
1. Open the `.env` file in your project root
2. Find the lines:
   ```env
   ADMIN_EMAIL=admin@starter.dev
   ADMIN_PASSWORD=Admin123!
   ```
3. Edit these values as needed
4. Save the file
5. Re-run the seed: `npx prisma db seed`
6. Restart the application with `npm run dev`

<br />

---

### 🚀 Quick Start (Manual)

```bash
# 1️⃣ Clone the repository
git clone https://github.com/syntex82/WordPress-Node.git
cd WordPress-Node

# 2️⃣ Install all dependencies
npm install
cd admin && npm install && cd ..

# 3️⃣ Set up environment variables
cp .env.example .env
# ⚠️ Edit .env with your database credentials (see below)

# 4️⃣ Setup database (generate client, push schema)
npx prisma generate
npx prisma db push

# 5️⃣ Build the admin panel
cd admin && npm run build && cd ..

# 6️⃣ Start the server
npm run dev
```

> 💡 **Optional:** Run `npx prisma db seed` to create a default admin account. Otherwise, use the Setup Wizard.

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

# Optional - Only needed if using seed script
ADMIN_EMAIL="admin@starter.dev"
ADMIN_PASSWORD="Admin123!"
```

> 💡 **See the [Complete Configuration Guide](#️-complete-configuration-guide) below for all available options including SMTP, Stripe, AI, and more.**

<br />

### 🚀 Starting the Servers

After setup, you have two options for running the application:

#### Option 1: Production Mode (Single Server)

Run from the `WordPress-Node` directory - serves both backend API and pre-built admin panel:

```bash
cd WordPress-Node
npm run dev
```

#### Option 2: Development Mode (Hot Reloading)

For frontend development with hot reloading, run two terminals:

```bash
# Terminal 1 - Backend Server
cd WordPress-Node
npm run dev

# Terminal 2 - Admin Frontend (Hot Reload)
cd WordPress-Node/admin
npm run dev
```

| Mode | Backend | Admin Panel | Best For |
|------|---------|-------------|----------|
| **Production** | `http://localhost:3000` | `http://localhost:3000/admin` | Normal usage |
| **Development** | `http://localhost:3000` | `http://localhost:5173` | Admin panel development |

<br />

### 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Setup Wizard** | http://localhost:3000/admin/setup | First-time installation wizard |
| **Admin Panel** | http://localhost:3000/admin | Administration dashboard |
| **Public Site** | http://localhost:3000 | Public-facing website (with theme) |
| **API** | http://localhost:3000/api | RESTful API endpoints |
| **Health Check** | http://localhost:3000/health | Server health status |

<br />

### 🧙 First-Time Setup Wizard

For **fresh installations** (no seeded admin), use the **Setup Wizard** for a guided configuration:

1. **Navigate to:** `http://localhost:3000/admin/setup`
2. **Welcome:** Click "Get Started"
3. **Create Admin:** Enter your name, email, and password (minimum 8 characters)
4. **Email Settings:** Configure SMTP or click "Skip" to set up later
5. **Complete:** Click "Go to Login" to finish setup

> 💡 **Note:** The Setup Wizard only appears when no admin account exists. If you ran `npx prisma db seed`, an admin already exists and you'll be redirected to login.

**To reset and use the Setup Wizard:**
```bash
# Delete users and setup status to trigger the wizard
npx prisma db execute --stdin <<< 'DELETE FROM "SetupStatus"; DELETE FROM "User";'
```

<br />

### 🔑 Default Login (If Seeded)

If you ran `npx prisma db seed`, use these credentials:

```
📧 Email:    admin@starter.dev
🔑 Password: Admin123!
```

> 💡 **Tip:** You can customize these in your `.env` file using `ADMIN_EMAIL` and `ADMIN_PASSWORD` before running the seed command.

<br />

### 🔓 Troubleshooting: Reset Admin Password & Unlock Account

If you're locked out of the admin account or forgot your password, use these commands:

#### Unlock Account (Remove Lockout)

If you've been locked out due to too many failed login attempts:

```bash
# PowerShell (Windows)
echo 'UPDATE "User" SET "failedLoginAttempts" = 0, "accountLockedUntil" = NULL WHERE email = $$admin@starter.dev$$;' | npx prisma db execute --stdin

# Bash (Linux/Mac)
echo 'UPDATE "User" SET "failedLoginAttempts" = 0, "accountLockedUntil" = NULL WHERE email = '\''admin@starter.dev'\'';' | npx prisma db execute --stdin
```

#### Reset Admin Password

To reset the admin password to a new value:

```bash
# Step 1: Generate a new password hash
npx ts-node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourNewPassword123!', 10).then(h => console.log(h));"

# Step 2: Update the password in the database (replace HASH with the output from step 1)
echo 'UPDATE "User" SET "password" = $$HASH$$, "failedLoginAttempts" = 0, "accountLockedUntil" = NULL WHERE email = $$admin@starter.dev$$;' | npx prisma db execute --stdin
```

**Example (reset to `Admin@Secure20024!`):**

```bash
# PowerShell (Windows) - One command to reset password and unlock
echo 'UPDATE "User" SET "password" = $$$2b$10$O0AS5ZlFsDjhz7OUIMEjPOindSGdiZj9gRVpujYpKKQwpf0v8c9hq$$, "failedLoginAttempts" = 0, "accountLockedUntil" = NULL WHERE email = $$admin@starter.dev$$;' | npx prisma db execute --stdin
```

#### Change Admin Email

To change the admin email address:

```bash
echo 'UPDATE "User" SET "email" = $$newemail@example.com$$ WHERE email = $$admin@starter.dev$$;' | npx prisma db execute --stdin
```

#### Complete Account Reset (Delete and Re-seed)

To completely reset the admin account:

```bash
# Delete all users and re-run seed
echo 'DELETE FROM "User";' | npx prisma db execute --stdin
npx prisma db seed
```

> ⚠️ **Warning:** This deletes ALL users. Use with caution!

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
│   │   ├── 📂 settings/              # Site settings & configuration
│   │   │   ├── 📄 encryption.service.ts      # AES-256-GCM encryption
│   │   │   ├── 📄 system-config.service.ts   # Database config management
│   │   │   ├── 📄 system-config.controller.ts # Config API endpoints
│   │   │   └── 📄 setup-wizard.controller.ts  # First-time setup API
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
│   │   ├── 📂 marketplace/           # Developer Marketplace
│   │   │   ├── 📂 controllers/       # API endpoints
│   │   │   ├── 📂 services/          # Business logic
│   │   │   └── 📂 dto/               # Data transfer objects
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
│   │   │   ├── 📄 SetupWizard.tsx    # First-time installation wizard
│   │   │   ├── 📄 Settings.tsx       # Settings with Email/Domain tabs
│   │   │   ├── 📂 shop/              # Shop admin pages
│   │   │   ├── 📂 lms/               # LMS admin pages
│   │   │   ├── 📂 marketplace/       # Developer marketplace admin
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

### 👨‍💻 Marketplace API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/marketplace/developers` | List developers |
| `GET` | `/api/marketplace/developers/:id` | Get developer profile |
| `POST` | `/api/marketplace/developers` | Apply as developer |
| `GET` | `/api/marketplace/hiring-requests` | List hiring requests |
| `POST` | `/api/marketplace/hiring-requests` | Create hiring request |
| `PATCH` | `/api/marketplace/hiring-requests/:id/status` | Update request status |
| `GET` | `/api/marketplace/projects` | List projects |
| `POST` | `/api/marketplace/projects` | Create project |
| `POST` | `/api/marketplace/projects/:id/review` | Submit review |
| `GET` | `/api/marketplace/payments/transactions` | Transaction history |
| `POST` | `/api/marketplace/payments/payout` | Request payout |

<br />

### 🔄 Updates API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/updates/status` | Get current update status |
| `GET` | `/api/updates/check` | Check for available updates |
| `GET` | `/api/updates/available` | Get available update details |
| `GET` | `/api/updates/history` | Get update history |
| `GET` | `/api/updates/compatibility/:version` | Check compatibility for a version |
| `POST` | `/api/updates/download` | Download an update |
| `POST` | `/api/updates/apply` | Apply downloaded update |
| `POST` | `/api/updates/pull-latest` | Pull latest from GitHub main branch and rebuild |
| `POST` | `/api/updates/rollback/:id` | Rollback to previous version |
| `GET` | `/api/updates/version` | Get current version info |

<br />

### 💾 Backups API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/backups` | List all backups |
| `GET` | `/api/backups/:id` | Get backup details |
| `POST` | `/api/backups` | Create full backup |
| `POST` | `/api/backups/quick` | Create quick backup |
| `POST` | `/api/backups/database` | Create database-only backup |
| `GET` | `/api/backups/:id/download` | Download backup file |
| `POST` | `/api/backups/:id/restore` | Restore from backup |
| `DELETE` | `/api/backups/:id` | Delete backup |
| `GET` | `/api/backups/stats` | Get backup statistics |

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

## 🚀 Quick Start Commands

Copy and paste these commands to get up and running quickly:

### 🪟 Windows (PowerShell as Administrator)

```powershell
# Fresh installation
git clone https://github.com/syntex82/WordPress-Node.git
cd WordPress-Node
powershell -ExecutionPolicy Bypass -File .\scripts\windows-setup.ps1

# Start the server
npm run dev
```

### 🐧 Ubuntu/Linux

```bash
# Fresh installation
git clone https://github.com/syntex82/WordPress-Node.git
cd WordPress-Node
chmod +x scripts/ubuntu-setup.sh
sudo ./scripts/ubuntu-setup.sh
```

### 🔄 Updating Existing Installations

```bash
# Ubuntu/Linux - Update to latest version
cd /home/WordPress-Node
git checkout scripts/          # Reset any local script changes
git pull origin main           # Pull latest code
chmod +x scripts/update.sh
sudo ./scripts/update.sh       # Rebuild and restart

# Windows - Update to latest version
cd WordPress-Node
git checkout scripts/
git pull origin main
cd admin; npm install; npm run build; cd ..
npm install
npm run build
```

### 🔑 Default Login Credentials

```
📧 Email:    admin@starter.dev
🔑 Password: Admin123!
```

### 📍 Access URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Admin Panel** | http://localhost:3000/admin |
| **API** | http://localhost:3000/api |
| **Health Check** | http://localhost:3000/health |

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
| **SMTP not configured** | Configure via **Settings → Email** in admin panel, or add SMTP settings to `.env` |
| **Gmail blocking** | Enable 2FA and use App Password from [Google Account Settings](https://myaccount.google.com/apppasswords) |
| **Wrong credentials** | Verify SMTP settings in admin panel or `.env` file |
| **Check spam folder** | Emails may be in recipient's spam/junk folder |
| **Test email fails** | Use the "Send Test Email" button in **Settings → Email** to diagnose issues |

<br />

### ❌ Setup Script Issues

**Problem:** The Windows or Ubuntu setup script fails or gets stuck.

**Solutions:**

| Issue | Solution |
|-------|----------|
| **Script permission denied (Linux)** | Run: `chmod +x scripts/ubuntu-setup.sh && sudo bash scripts/ubuntu-setup.sh` |
| **PowerShell execution policy (Windows)** | Run as Admin: `powershell -ExecutionPolicy Bypass -File .\scripts\windows-setup.ps1` |
| **PostgreSQL won't start** | Check if service is running: `sudo service postgresql status` (Linux) or `Get-Service postgresql*` (Windows) |
| **PostgreSQL password rejected** | Default superuser password is `postgres`. Reset with: `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'newpassword';"` |
| **Redis connection failed** | Redis is optional. The app works without it. Start Redis: `sudo service redis-server start` (Linux) or `redis-server` (Windows) |
| **npm install fails** | Clear npm cache: `npm cache clean --force` then retry `npm install` |
| **Prisma generate fails** | Ensure DATABASE_URL is correct in `.env`, then run `npx prisma generate` |
| **Database seed fails** | Check database connection: `npx prisma db push` first, then `npx prisma db seed` |
| **Port 3000 already in use** | Kill the process: `npx kill-port 3000` or change PORT in `.env` |

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

### 🖥️ VPS/Server Troubleshooting Commands

Essential commands for managing and troubleshooting your WordPress Node CMS on a production VPS.

<br />

#### 🔐 Reset 2FA for a User

If a user is locked out due to 2FA issues, reset it with this command:

```bash
cd /var/www/WordPress-Node && node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.update({ where: { email: 'user@example.com' }, data: { twoFactorEnabled: false, twoFactorSecret: null, recoveryCodes: [] } }).then(u => console.log('✓ 2FA disabled for:', u.email)).catch(console.error).finally(() => p.\$disconnect());"
```

> 💡 Replace `user@example.com` with the actual user's email address.

<br />

#### 🔓 Unlock User Account

If a user is locked out due to too many failed login attempts:

```bash
cd /var/www/WordPress-Node && node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.update({ where: { email: 'user@example.com' }, data: { failedLoginAttempts: 0, accountLockedUntil: null } }).then(u => console.log('✓ Account unlocked for:', u.email)).catch(console.error).finally(() => p.\$disconnect());"
```

<br />

#### 🔑 Reset User Password

```bash
cd /var/www/WordPress-Node && node -e "const bcrypt = require('bcrypt'); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); bcrypt.hash('NewPassword123!', 10).then(hash => p.user.update({ where: { email: 'user@example.com' }, data: { password: hash } })).then(u => console.log('✓ Password reset for:', u.email)).catch(console.error).finally(() => p.\$disconnect());"
```

> ⚠️ Replace `NewPassword123!` with a strong password.

<br />

#### 📁 Fix Permission Issues

If you get `EACCES: permission denied` errors (backup creation, file uploads, etc.):

```bash
# Check current ownership
ls -la /var/www/WordPress-Node

# Check what user the app is running as
ps aux | grep node

# Fix ownership (replace 'wpnode' with your app user)
sudo chown -R wpnode:wpnode /var/www/WordPress-Node

# Or fix specific directories only
sudo chown -R wpnode:wpnode /var/www/WordPress-Node/backups
sudo chown -R wpnode:wpnode /var/www/WordPress-Node/uploads
sudo chown -R wpnode:wpnode /var/www/WordPress-Node/updates
```

<br />

#### 🔄 PM2 Management Commands

```bash
# Check app status
pm2 status

# View logs (live)
pm2 logs wordpress-node

# View last 100 lines of logs
pm2 logs wordpress-node --lines 100

# Restart the app
pm2 restart wordpress-node

# Reload with zero-downtime
pm2 reload wordpress-node

# Stop the app
pm2 stop wordpress-node

# Start the app
pm2 start wordpress-node

# Delete and re-add the app
pm2 delete wordpress-node
pm2 start ecosystem.config.js

# Save PM2 configuration (persists across reboots)
pm2 save

# Monitor CPU/Memory in real-time
pm2 monit
```

<br />

#### 🗄️ Database Commands

```bash
# Open Prisma Studio (database GUI)
cd /var/www/WordPress-Node && npx prisma studio --browser none --hostname 0.0.0.0
# Then access via http://your-vps-ip:5555 (close immediately after use!)

# Run database migrations
cd /var/www/WordPress-Node && npx prisma migrate deploy

# Reset database (WARNING: destroys all data)
cd /var/www/WordPress-Node && npx prisma migrate reset --force

# Check database connection
cd /var/www/WordPress-Node && node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => console.log('✓ Database connected')).catch(console.error).finally(() => p.\$disconnect());"

# PostgreSQL direct access
sudo -u postgres psql -d wordpress_node
```

<br />

#### 🌐 Nginx Commands

```bash
# Test nginx configuration
sudo nginx -t

# Reload nginx (apply config changes)
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx

# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# View nginx access logs
sudo tail -f /var/log/nginx/access.log
```

<br />

#### 🔥 Service Status Checks

```bash
# Check all services at once
echo "=== NGINX ===" && sudo systemctl status nginx --no-pager
echo "=== POSTGRESQL ===" && sudo systemctl status postgresql --no-pager
echo "=== REDIS ===" && sudo systemctl status redis-server --no-pager
echo "=== PM2 ===" && pm2 status

# Check if app is responding
curl -s http://localhost:3000/health | jq .

# Check listening ports
sudo netstat -tlnp | grep -E '3000|5432|6379|80|443'
```

<br />

#### 🔄 Manual Update Commands

```bash
cd /var/www/WordPress-Node

# Pull latest changes
git pull origin main

# Install dependencies
npm install
cd admin && npm install && cd ..

# Build
npm run build
cd admin && npm run build && cd ..

# Run migrations
npx prisma migrate deploy

# Restart app
pm2 restart wordpress-node
```

<br />

#### 📊 System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check CPU and process info
htop  # or 'top' if htop not installed

# Check app memory usage
pm2 monit

# View system logs
sudo journalctl -f
```

<br />

---

## 🚀 Production Deployment

This section covers deploying WordPress Node CMS to a production environment.

<br />

### 🧙 Setup Wizard (First-Time Installation)

When deploying to production for the first time, WordPress Node CMS includes a **Setup Wizard** that guides you through initial configuration:

1. **Access the Setup Wizard**: Navigate to `https://yourdomain.com/admin/setup`
2. **Create Admin Account**: Set up your administrator account with a secure password
3. **Configure Email (Optional)**: Set up SMTP settings for email delivery
4. **Complete Setup**: Finalize installation and start using your CMS

> 💡 **Note:** The Setup Wizard only runs on fresh installations. It automatically detects if setup has been completed.

<br />

### ⚙️ Admin Settings Panel

After setup, administrators can configure system settings through the admin panel:

| Setting | Location | Description |
|---------|----------|-------------|
| **Email Settings** | Settings → Email | Configure SMTP server, credentials, and test email delivery |
| **Domain Settings** | Settings → Domain | Set frontend URL, admin URL, site name, and support email |
| **General Settings** | Settings → General | Theme selection, site title, and basic configuration |

> 🔒 **Security:** All sensitive settings (like SMTP passwords) are encrypted with AES-256-GCM before storage in the database.

<br />

### 🔐 Production Environment Variables

For production deployments, these environment variables are **required**:

```env
# Required for production
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Security - MUST use secure values (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=<secure-random-64-char-string>
ENCRYPTION_KEY=<secure-random-32-char-string>
SESSION_SECRET=<secure-random-64-char-string>

# Optional - Can be configured via admin panel instead
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-smtp-password
FRONTEND_URL=https://yourdomain.com
ADMIN_URL=https://yourdomain.com/admin
```

| Variable | Required | Description |
|----------|:--------:|-------------|
| `NODE_ENV` | ✅ | Set to `production` for production deployments |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | 64+ character random string for JWT signing |
| `ENCRYPTION_KEY` | ✅ | 32 character key for encrypting sensitive database fields |
| `SESSION_SECRET` | ✅ | 64+ character random string for session encryption |

> ⚠️ **Warning:** The application will refuse to start in production mode without proper security variables configured.

<br />

### 📋 Production Checklist

Before going live, ensure you've completed these steps:

- [ ] Set `NODE_ENV=production`
- [ ] Configure secure `JWT_SECRET`, `ENCRYPTION_KEY`, and `SESSION_SECRET`
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Build the admin panel: `cd admin && npm run build`
- [ ] Build the backend: `npm run build`
- [ ] Configure SMTP (via `.env` or admin panel)
- [ ] Set up SSL/HTTPS (via reverse proxy like Nginx)
- [ ] Configure CORS origins if needed
- [ ] Set up Redis for caching and session storage (recommended)
- [ ] Configure backup strategy for database and uploads

<br />

### 🐳 Docker Deployment

```bash
# Clone and configure
git clone https://github.com/syntex82/WordPress-Node.git
cd WordPress-Node
cp .env.example .env
# Edit .env with production values

# Build and run with Docker Compose
docker-compose up -d --build

# Run database migrations
docker-compose exec app npx prisma migrate deploy

# Access at http://localhost:3000
```

<br />

### ☁️ Cloud Platform Deployment

<details>
<summary><strong>📦 Railway</strong></summary>

1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Railway auto-detects and builds the Node.js app
4. Add a PostgreSQL database from Railway's marketplace
5. Set `DATABASE_URL` from Railway's provided connection string

</details>

<details>
<summary><strong>📦 Render</strong></summary>

1. Create a new Web Service from your GitHub repo
2. Set build command: `npm install && cd admin && npm install && npm run build && cd .. && npm run build`
3. Set start command: `npm run start:prod`
4. Add environment variables in Render dashboard
5. Add a PostgreSQL database from Render's marketplace

</details>

<details>
<summary><strong>📦 DigitalOcean App Platform</strong></summary>

1. Create a new App from GitHub repository
2. Configure build and run commands
3. Add a managed PostgreSQL database
4. Configure environment variables
5. Set up custom domain and SSL

</details>

<br />

---

## 🔧 Troubleshooting Guide

This section covers common issues and their solutions.

<br />

### 📱 PWA Not Installing / "Add to Home Screen" Not Appearing

**Symptoms:** No install prompt, manifest not loading, service worker not registering

| Check | Solution |
|-------|----------|
| **HTTPS Required** | PWA features require HTTPS in production. Localhost works with HTTP for development. |
| **Manifest Not Loading** | Visit `https://yoursite.com/manifest.json` - should return JSON. If 404, update server. |
| **Service Worker Failed** | Check browser console for errors. Visit `https://yoursite.com/sw.js` to verify. |
| **Icons Missing** | Default SVG icons are generated. For custom icons, add PNGs to `public/pwa/icons/`. |
| **Already Installed** | If previously installed, you won't see the prompt again. Uninstall and retry. |

**Debug Steps:**
```bash
# Chrome DevTools → Application → Manifest → Check for errors
# Chrome DevTools → Application → Service Workers → Check registration status

# Test manifest endpoint
curl https://yoursite.com/manifest.json

# Test service worker endpoint
curl https://yoursite.com/sw.js
```

<br />

### 💬 Messages Not Sending / Not Receiving

**Symptoms:** Messages appear to send but don't arrive, WebSocket disconnected

| Check | Solution |
|-------|----------|
| **WebSocket Status** | Look for the green/red connection indicator in the Messages page header |
| **Server Running** | Ensure the backend is running: `pm2 status` or `npm run dev` |
| **Nginx Config** | WebSocket requires special Nginx config (see installation section) |
| **Firewall** | Ensure WebSocket port is not blocked by firewall |

**Nginx WebSocket Configuration (Required):**
```nginx
location /socket.io/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
}
```

**Debug Steps:**
```bash
# Check if WebSocket endpoint is accessible
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://yoursite.com/socket.io/

# Check server logs for WebSocket errors
pm2 logs wordpress-node --lines 50
```

<br />

### 📹 Video Call Button Disabled / Not Working

**Symptoms:** Phone icon is gray/disabled, calls not connecting

| Issue | Solution |
|-------|----------|
| **Button is Gray** | Other user must be online (have Messages page open) |
| **WebSocket Disconnected** | Check connection indicator; refresh the page |
| **Call Not Connecting** | Both users need modern browsers with WebRTC support |
| **Audio/Video Not Working** | Grant camera/microphone permissions when prompted |
| **NAT/Firewall Issues** | Some corporate networks block WebRTC; use a different network |

**Requirements for Video Calling:**
- ✅ Both users must be logged in and have Messages page open
- ✅ WebSocket must be connected (green indicator)
- ✅ Other user must be online (shown in online users list)
- ✅ HTTPS required (except localhost)
- ✅ Camera/microphone permissions granted

<br />

### 🔌 WebSocket Connection Issues

**Symptoms:** "Disconnected" status, messages not real-time, features not working

**Check Your Nginx Configuration:**

Ensure your Nginx config includes WebSocket support with proper headers and timeouts:

```nginx
# Required for WebSocket connections
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 86400s;  # 24 hours for long-lived connections
```

**Common Causes:**
| Cause | Fix |
|-------|-----|
| Missing Nginx upgrade headers | Add WebSocket config block (see above) |
| Timeout too short | Increase `proxy_read_timeout` to at least 86400s |
| Cloudflare/CDN | Enable WebSocket support in CDN settings |
| HTTP instead of HTTPS | Use HTTPS in production for secure WebSocket (wss://) |

**Test WebSocket Connection:**
```javascript
// Open browser console and run:
const ws = new WebSocket('wss://yoursite.com/socket.io/?EIO=4&transport=websocket');
ws.onopen = () => console.log('WebSocket connected!');
ws.onerror = (e) => console.error('WebSocket error:', e);
```

<br />

### 🖼️ Media Upload Not Working

**Symptoms:** Images/videos not uploading in messages, upload fails silently

| Check | Solution |
|-------|----------|
| **Upload Directory** | Ensure `uploads/messages/` directory exists and is writable |
| **File Size Limit** | Default max is 10MB. Check `MAX_FILE_SIZE` in `.env` |
| **Nginx Upload Limit** | Add `client_max_body_size 100M;` to Nginx config |
| **Disk Space** | Ensure server has sufficient disk space |

**Create Upload Directory:**
```bash
mkdir -p uploads/messages
chmod 755 uploads/messages
```

**Nginx File Size Config:**
```nginx
http {
    client_max_body_size 100M;  # Allow up to 100MB uploads
}
```

<br />

### 🗄️ Database Connection Issues

**Symptoms:** 500 errors, "Cannot connect to database", Prisma errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d wordpress_node -c "SELECT 1;"

# Reset Prisma client
npx prisma generate

# Push schema changes
npx prisma db push
```

<br />

### 🔄 After Pulling Updates

After running `git pull origin main`, always:

```bash
# 1. Install any new dependencies
npm install
cd admin && npm install && cd ..

# 2. Apply database schema changes
npx prisma db push

# 3. Rebuild admin panel (if frontend changes)
cd admin && npm run build && cd ..

# 4. Rebuild backend
npm run build

# 5. Restart the server
pm2 restart wordpress-node
# or for development:
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

