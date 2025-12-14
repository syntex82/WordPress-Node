<div align="center">

<!-- Hero Banner -->
<img width="1281" height="745" alt="Screenshot 2025-12-14 043442" src="https://github.com/user-attachments/assets/4e5f2cac-30e2-4461-b519-ce90d1cce293" />
https://buymeacoffee.com/mickyblenkd
<br />
<br />

# 🚀 WordPress Node CMS

### **A Modern, Full-Featured Content Management System Built with Node.js**

<br />

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5+-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3+-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br />

<p align="center">
  <strong>A powerful, extensible CMS platform combining the flexibility of WordPress<br />with the performance and type-safety of modern JavaScript technologies.</strong>
</p>

<br />

[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Installation](#-installation) •
[Project Structure](#-project-structure) •
[API Documentation](#-api-documentation) •
[Screenshots](#-screenshots) •
[Contributing](#-contributing)

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

---

## 🛠 Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### 🔧 Backend

| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | JavaScript runtime |
| **NestJS 10+** | Enterprise-grade framework |
| **TypeScript 5+** | Type-safe development |
| **Prisma 5+** | Next-generation ORM |
| **PostgreSQL 15+** | Relational database |
| **Passport.js** | Authentication middleware |
| **JWT** | Stateless authentication |
| **Multer** | File upload handling |
| **Sharp** | Image processing & optimization |
| **Handlebars** | Server-side templating |

</td>
<td valign="top" width="50%">

### 💻 Frontend (Admin Panel)

| Technology | Purpose |
|------------|---------|
| **React 18+** | UI library |
| **TypeScript 5+** | Type-safe development |
| **Vite 5+** | Build tool & dev server |
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

### 🚀 Quick Start

```bash
# 1️⃣ Clone the repository
git clone https://github.com/yourusername/wordpress-node.git
cd wordpress-node

# 2️⃣ Install backend dependencies
npm install

# 3️⃣ Install admin panel dependencies
cd admin && npm install && cd ..

# 4️⃣ Set up environment variables
cp .env.example .env
# ⚠️ Edit .env with your database credentials (see below)

# 5️⃣ Generate Prisma client
npx prisma generate

# 6️⃣ Run database migrations
npx prisma migrate dev

# 7️⃣ Seed the database with initial data
npx prisma db seed

# 8️⃣ Start development servers
# Terminal 1 - Backend API (port 3000)
npm run start:dev

# Terminal 2 - Admin Panel (port 5173)
cd admin && npm run dev
```

<br />

### ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# ═══════════════════════════════════════════════════════════
# DATABASE CONFIGURATION
# ═══════════════════════════════════════════════════════════
DATABASE_URL="postgresql://username:password@localhost:5432/wordpress_node?schema=public"

# ═══════════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════════
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_EXPIRES_IN="7d"
SESSION_SECRET="your-session-secret-key"

# ═══════════════════════════════════════════════════════════
# ADMIN ACCOUNT (for seeding)
# ═══════════════════════════════════════════════════════════
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"

# ═══════════════════════════════════════════════════════════
# SERVER CONFIGURATION
# ═══════════════════════════════════════════════════════════
PORT=3000
NODE_ENV="development"

# ═══════════════════════════════════════════════════════════
# FILE UPLOADS
# ═══════════════════════════════════════════════════════════
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760  # 10MB in bytes

# ═══════════════════════════════════════════════════════════
# FRONTEND URL (for CORS)
# ═══════════════════════════════════════════════════════════
FRONTEND_URL="http://localhost:5173"
```

<br />

### 🌐 Access Points

Once running, access the application at:

| Service | URL | Description |
|---------|-----|-------------|
| **Public Site** | http://localhost:3000 | Public-facing website |
| **Admin Panel** | http://localhost:5173/admin | Administration dashboard |
| **API** | http://localhost:3000/api | RESTful API endpoints |
| **Storefront** | http://localhost:5173/admin/storefront | E-commerce storefront |
| **Course Catalog** | http://localhost:5173/admin/lms/catalog | LMS course browsing |

<br />

### 🔑 Default Login

After seeding the database, use these credentials:

```
Email:    admin@example.com
Password: admin123
```

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
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
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
  "email": "admin@example.com",
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
npm run start:dev          # Start backend in development mode
cd admin && npm run dev    # Start admin panel dev server

# ═══════════════════════════════════════════════════════════
# 🗄️ DATABASE
# ═══════════════════════════════════════════════════════════
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Run migrations (development)
npx prisma migrate deploy  # Run migrations (production)
npx prisma db seed         # Seed database
npx prisma studio          # Open Prisma Studio (database GUI)

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

Copyright (c) 2024 WordPress Node CMS

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

