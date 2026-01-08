# 📚 NodePress Developer Tutorial

**Official Learning Guide for NodePress CMS Development**

Welcome to the official NodePress Developer Tutorial! This comprehensive guide will teach you how to develop with NodePress CMS - a modern, full-featured content management system built with Node.js, NestJS, React, and PostgreSQL.

---

## 📋 Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites & Setup](#2-prerequisites--setup)
3. [Architecture Overview](#3-architecture-overview)
4. [Project Structure](#4-project-structure)
5. [Backend Development](#5-backend-development)
6. [Frontend Development](#6-frontend-development)
7. [Database & Prisma](#7-database--prisma)
8. [Theme Development](#8-theme-development)
9. [Plugin Development](#9-plugin-development)
10. [API Reference](#10-api-reference)
11. [Module Deep Dives](#11-module-deep-dives)
12. [Testing & Quality](#12-testing--quality)
13. [Deployment](#13-deployment)
14. [Advanced Topics](#14-advanced-topics)
15. [Production Cheatsheet](#15-production-cheatsheet---linux-database--server-management)
16. [Demo System](#16-demo-system)
17. [Client Deployment](#17-client-deployment)

---

## 1. Introduction

### What is NodePress?

NodePress is an enterprise-grade CMS platform that combines:

| Component | Description |
|-----------|-------------|
| **Content Management** | Pages, posts, media library, SEO tools |
| **E-Commerce** | Products, orders, payments (Stripe) |
| **LMS (Learning)** | Courses, lessons, quizzes, certificates |
| **Developer Marketplace** | Freelancer profiles, hiring, projects |
| **Real-time Features** | Messaging, video calls (WebRTC), notifications |
| **Social Features** | Timeline, profiles, follow system |

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js 20+, NestJS 11, TypeScript 5.9, Prisma 5 |
| **Frontend** | React 18, Vite 6, Tailwind CSS, Zustand |
| **Database** | PostgreSQL 15+, Redis (caching) |
| **Real-time** | Socket.IO, WebRTC |
| **Payments** | Stripe |
| **AI** | OpenAI GPT-4, Anthropic Claude |

---

## 2. Prerequisites & Setup

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 4 GB | 8 GB+ |
| **CPU** | 2 cores | 4 cores+ |
| **Disk** | 10 GB | 20 GB+ |
| **Node.js** | 18.x | 20.x LTS |
| **PostgreSQL** | 14 | 16 |
| **Redis** | 6.x | 7.x (optional for local dev) |

### Quick Setup (Ubuntu/Linux)

```bash
# Clone the repository
git clone https://github.com/syntex82/NodePress.git
cd NodePress

# Run the automated setup script
chmod +x scripts/ubuntu-setup.sh
sudo ./scripts/ubuntu-setup.sh
```

### Quick Setup (Windows)

```powershell
# Clone the repository
git clone https://github.com/syntex82/NodePress.git
cd NodePress

# Run the automated setup script (PowerShell as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\windows-setup.ps1
```

### Using and Customizing Setup Scripts

NodePress provides several automated setup scripts to streamline local development. These scripts handle dependency installation, database configuration, and environment setup.

#### Available Setup Scripts

| Script | Platform | Purpose |
|--------|----------|---------|
| `scripts/ubuntu-setup.sh` | Ubuntu/Linux | Full development environment setup |
| `scripts/windows-setup.ps1` | Windows | PowerShell-based development setup |
| `scripts/windows-setup.bat` | Windows | Batch file alternative |
| `scripts/quick-install.sh` | Linux/macOS | Minimal quick installation |
| `scripts/hostinger-setup.sh` | Linux VPS | Production deployment on Hostinger |
| `scripts/hostinger-vps-setup.sh` | Linux VPS | Extended VPS configuration |
| `scripts/update.sh` | Linux | Update existing installation |

#### What the Setup Scripts Do

The main setup scripts (`ubuntu-setup.sh` and `windows-setup.ps1`) automate:

1. **System Dependencies** - Install Node.js, npm, build tools
2. **Database Setup** - Install and configure PostgreSQL
3. **Redis Installation** - Set up Redis for caching (optional)
4. **Environment Configuration** - Generate `.env` with secure secrets
5. **NPM Dependencies** - Install backend and admin dependencies
6. **Database Schema** - Run Prisma migrations and seed data
7. **Build Process** - Build the admin panel and backend
8. **Directory Structure** - Create required folders (uploads, themes, backups)

#### Customizing Setup Scripts

You can customize the setup scripts for your specific needs:

**1. Change Database Credentials**

Edit the script to use your preferred database settings:

```bash
# In ubuntu-setup.sh, find and modify:
DB_NAME="my_custom_db"
DB_USER="my_user"
DB_PASSWORD="my_secure_password"
```

**2. Skip Optional Components**

Comment out sections you don't need:

```bash
# Skip Redis installation (not required for local dev)
# ((CURRENT_STEP++))
# print_step "$CURRENT_STEP/$TOTAL_STEPS" "Installing Redis..."
# ... redis installation code ...
```

**3. Add Custom Environment Variables**

Extend the `.env` generation section:

```bash
# Add to the environment file generation
cat >> "$APP_DIR/.env" << EOF

# Custom additions
MY_API_KEY=your-api-key
FEATURE_FLAG_NEW_UI=true
EOF
```

**4. Create Your Own Setup Script**

Create a custom script for your team's workflow:

```bash
#!/bin/bash
# custom-setup.sh - Team-specific setup

# Run base setup
./scripts/ubuntu-setup.sh

# Add team-specific configurations
echo "Setting up team configurations..."

# Install additional dev tools
npm install -g @nestjs/cli prisma

# Copy team's shared .env overrides
cp /shared/team-config/.env.local .env.local

# Run custom seed data
npm run db:seed:team-data

echo "Team setup complete!"
```

**5. Environment-Specific Scripts**

Create separate scripts for different environments:

```bash
# scripts/setup-dev.sh - Development with debug settings
# scripts/setup-staging.sh - Staging with production-like config
# scripts/setup-ci.sh - CI/CD pipeline optimized
```

#### Utility Scripts

NodePress includes additional utility scripts:

| Script | Purpose |
|--------|---------|
| `scripts/seed-plans.ts` | Seed subscription plans into database |
| `scripts/create-test-developer.ts` | Create test developer accounts |
| `scripts/generate-sitemap.ts` | Generate XML sitemap |
| `scripts/preview-email-templates.ts` | Preview email templates locally |
| `scripts/fix-vite-cache.sh` | Clear Vite build cache issues |

Run TypeScript utility scripts with:

```bash
npx ts-node scripts/seed-plans.ts
npx ts-node scripts/create-test-developer.ts
```

#### Troubleshooting Setup Scripts

**Permission Denied**
```bash
chmod +x scripts/ubuntu-setup.sh
sudo ./scripts/ubuntu-setup.sh
```

**Script Fails Midway**
```bash
# Check logs for specific error
# Re-run with verbose output
bash -x scripts/ubuntu-setup.sh
```

**Database Connection Issues**
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection manually
psql -U nodepress -d nodepress -h localhost
```

### Manual Setup

```bash
# 1. Clone the repository
git clone https://github.com/syntex82/NodePress.git
cd NodePress

# 2. Install dependencies
npm install
cd admin && npm install && cd ..

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Setup database
npx prisma generate
npx prisma db push

# 5. Build admin panel
cd admin && npm run build && cd ..

# 6. Start the server
npm run dev
```

### Environment Configuration

Create a `.env` file with these essential settings:

```env
# Database (required)
DATABASE_URL="postgresql://user:password@localhost:5432/nodepress?schema=public"

# Authentication (required)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
SESSION_SECRET="your-session-secret-key"

# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Admin Seed (optional)
ADMIN_EMAIL="admin@starter.dev"
ADMIN_PASSWORD="Admin123!"
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Setup Wizard** | http://localhost:3000/admin/setup | First-time setup |
| **Admin Panel** | http://localhost:3000/admin | Administration |
| **Public Site** | http://localhost:3000 | Frontend |
| **API** | http://localhost:3000/api | REST API |
| **Health Check** | http://localhost:3000/health | Status |

---

## 3. Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
├─────────────────────────────────────────────────────────────┤
│  React Admin Panel  │  Public Theme  │  Mobile PWA          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NestJS Backend                            │
├─────────────────────────────────────────────────────────────┤
│  REST API  │  WebSocket (Socket.IO)  │  Theme Renderer       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │PostgreSQL│   │  Redis   │   │  S3/R2   │
        │ Database │   │  Cache   │   │ Storage  │
        └──────────┘   └──────────┘   └──────────┘
```

### Module Architecture

NodePress follows NestJS modular architecture:

```
src/modules/
├── auth/          # Authentication & JWT
├── users/         # User management & profiles
├── content/       # Posts, pages, categories
├── media/         # File uploads & processing
├── themes/        # Theme system & customization
├── plugins/       # Plugin loader & marketplace
├── shop/          # E-commerce
├── lms/           # Learning management
├── marketplace/   # Developer marketplace
├── messages/      # Real-time messaging
├── timeline/      # Social timeline
├── email/         # Email templates & sending
├── security/      # 2FA, audit logs, IP blocking
├── settings/      # Site configuration
├── backup/        # Backup & restore
└── updates/       # Auto-update system
```

---

## 4. Project Structure

### Root Directory

```
NodePress/
├── src/                    # Backend source code
│   ├── modules/            # Feature modules
│   ├── common/             # Shared utilities
│   ├── config/             # Configuration
│   └── main.ts             # Application entry
├── admin/                  # React admin panel
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   ├── services/       # API services
│   │   └── hooks/          # Custom hooks
│   └── package.json
├── themes/                 # Handlebars themes
│   └── default/            # Default theme
├── plugins/                # Plugin directory
├── prisma/
│   └── schema.prisma       # Database schema
├── scripts/                # Utility scripts
├── docs/                   # Documentation
└── package.json
```

### Backend Module Structure

Each NestJS module follows this pattern:

```
src/modules/[module-name]/
├── [module].module.ts      # Module definition
├── [module].controller.ts  # HTTP endpoints
├── [module].service.ts     # Business logic
├── [module].gateway.ts     # WebSocket (if needed)
├── dto/                    # Data Transfer Objects
│   ├── create-[entity].dto.ts
│   └── update-[entity].dto.ts
├── entities/               # Type definitions
└── guards/                 # Route guards
```

---

## 5. Backend Development

### Creating a New Module

```bash
# Generate a new module
npx nest g module modules/my-feature
npx nest g controller modules/my-feature
npx nest g service modules/my-feature
```

### Example: Creating a Custom API Endpoint

**1. Create the DTO (Data Transfer Object):**

```typescript
// src/modules/my-feature/dto/create-item.dto.ts
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```

**2. Create the Service:**

```typescript
// src/modules/my-feature/my-feature.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class MyFeatureService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateItemDto, userId: string) {
    return this.prisma.item.create({
      data: {
        ...dto,
        authorId: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.item.findMany({
      include: { author: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.item.findUnique({
      where: { id },
      include: { author: true },
    });
  }
}
```

**3. Create the Controller:**

```typescript
// src/modules/my-feature/my-feature.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MyFeatureService } from './my-feature.service';
import { CreateItemDto } from './dto/create-item.dto';

@Controller('api/my-feature')
export class MyFeatureController {
  constructor(private readonly service: MyFeatureService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateItemDto, @Request() req) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
```

### Authentication & Guards

NodePress uses JWT authentication. Protect routes with guards:

```typescript
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {

  @Get('dashboard')
  @Roles('ADMIN', 'EDITOR')
  getDashboard() {
    return { message: 'Admin dashboard' };
  }
}
```

### Available Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full system access |
| `EDITOR` | Content management |
| `AUTHOR` | Create/edit own content |
| `SUBSCRIBER` | Read-only access |
| `DEVELOPER` | Marketplace developer |

---

## 6. Frontend Development

### Admin Panel Architecture

The admin panel is built with React + Vite + Tailwind CSS:

```
admin/src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   └── forms/           # Form components
├── pages/               # Route pages
├── stores/              # Zustand state stores
├── services/            # API service layer
├── hooks/               # Custom React hooks
└── lib/                 # Utilities
```

### State Management with Zustand

NodePress uses Zustand for state management:

```typescript
// admin/src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        set({
          user: response.data.user,
          token: response.data.access_token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-storage' }
  )
);
```

### Creating a New Admin Page

**1. Create the page component:**

```tsx
// admin/src/pages/MyFeaturePage.tsx
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';

export default function MyFeaturePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await api.get('/my-feature');
      setItems(response.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Feature</h1>
        <Button>Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**2. Add the route:**

```tsx
// admin/src/App.tsx
import MyFeaturePage from './pages/MyFeaturePage';

// Add to routes
<Route path="/my-feature" element={<MyFeaturePage />} />
```

### API Service Layer

```typescript
// admin/src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const api = axios.create({
  baseURL: '/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 7. Database & Prisma

### Schema Overview

The Prisma schema is located at `prisma/schema.prisma`. Key models include:

```prisma
// User model
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  password          String
  name              String?
  role              Role      @default(SUBSCRIBER)
  avatar            String?
  posts             Post[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

// Post model
model Post {
  id          String    @id @default(uuid())
  title       String
  slug        String    @unique
  content     String?
  excerpt     String?
  status      PostStatus @default(DRAFT)
  author      User      @relation(fields: [authorId], references: [id])
  authorId    String
  categories  Category[]
  tags        Tag[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishedAt DateTime?
}
```

### Adding a New Model

**1. Add to schema.prisma:**

```prisma
model Item {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Float    @default(0)
  author      User     @relation(fields: [authorId], references: [id])
  authorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**2. Run migrations:**

```bash
# Development (no migration files)
npx prisma db push

# Production (with migration history)
npx prisma migrate dev --name add_item_model
```

**3. Generate client:**

```bash
npx prisma generate
```

### Common Prisma Operations

```typescript
// Create
const item = await prisma.item.create({
  data: { name: 'Test', price: 9.99, authorId: userId },
});

// Find many with relations
const items = await prisma.item.findMany({
  include: { author: true },
  where: { price: { gte: 5 } },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
});

// Update
await prisma.item.update({
  where: { id: itemId },
  data: { name: 'Updated Name' },
});

// Delete
await prisma.item.delete({
  where: { id: itemId },
});

// Transaction
await prisma.$transaction([
  prisma.item.create({ data: { ... } }),
  prisma.user.update({ where: { id }, data: { ... } }),
]);
```

---

## 8. Theme Development

### Theme Structure

Themes use Handlebars templating and are located in `themes/`:

```
themes/my-theme/
├── theme.json           # Theme metadata
├── layouts/
│   └── main.hbs         # Main layout wrapper
├── templates/
│   ├── home.hbs         # Homepage
│   ├── single-post.hbs  # Single post
│   ├── single-page.hbs  # Single page
│   ├── archive.hbs      # Post archive
│   ├── category.hbs     # Category archive
│   ├── search.hbs       # Search results
│   └── 404.hbs          # Not found
├── partials/
│   ├── header.hbs       # Site header
│   ├── footer.hbs       # Site footer
│   ├── sidebar.hbs      # Sidebar
│   └── post-card.hbs    # Post card component
└── assets/
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
```

### theme.json Configuration

```json
{
  "name": "My Custom Theme",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A custom theme for NodePress",
  "templates": ["home", "single-post", "single-page", "archive"],
  "settings": {
    "primaryColor": "#3B82F6",
    "darkMode": true,
    "showAuthor": true,
    "showDate": true,
    "postsPerPage": 10
  }
}
```

### Creating a Theme Template

**Main Layout (layouts/main.hbs):**

```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}} - {{site.name}}</title>
  <link rel="stylesheet" href="/themes/{{site.activeTheme}}/assets/css/style.css">
  {{{head}}}
</head>
<body class="{{bodyClass}}">
  {{> header}}

  <main class="container">
    {{{body}}}
  </main>

  {{> footer}}

  <script src="/themes/{{site.activeTheme}}/assets/js/main.js"></script>
</body>
</html>
```

**Homepage Template (templates/home.hbs):**

```handlebars
<section class="hero">
  <h1>Welcome to {{site.name}}</h1>
  <p>{{site.description}}</p>
</section>

<section class="posts">
  <h2>Latest Posts</h2>
  <div class="post-grid">
    {{#each posts}}
      {{> post-card this}}
    {{/each}}
  </div>

  {{#if pagination}}
    <nav class="pagination">
      {{#if pagination.hasPrev}}
        <a href="?page={{pagination.prevPage}}">← Previous</a>
      {{/if}}
      <span>Page {{pagination.currentPage}} of {{pagination.totalPages}}</span>
      {{#if pagination.hasNext}}
        <a href="?page={{pagination.nextPage}}">Next →</a>
      {{/if}}
    </nav>
  {{/if}}
</section>
```

**Post Card Partial (partials/post-card.hbs):**

```handlebars
<article class="post-card">
  {{#if featuredImage}}
    <img src="{{featuredImage}}" alt="{{title}}">
  {{/if}}
  <div class="post-content">
    <h3><a href="/post/{{slug}}">{{title}}</a></h3>
    <p class="excerpt">{{excerpt}}</p>
    <div class="meta">
      {{#if ../settings.showAuthor}}
        <span class="author">By {{author.name}}</span>
      {{/if}}
      {{#if ../settings.showDate}}
        <time datetime="{{publishedAt}}">{{formatDate publishedAt}}</time>
      {{/if}}
    </div>
  </div>
</article>
```

### Available Handlebars Helpers

| Helper | Usage | Description |
|--------|-------|-------------|
| `formatDate` | `{{formatDate date "MMMM D, YYYY"}}` | Format dates |
| `truncate` | `{{truncate text 100}}` | Truncate text |
| `eq` | `{{#if (eq status "published")}}` | Equality check |
| `hasPlan` | `{{#if (hasPlan "pro")}}` | Check subscription |
| `hasFeature` | `{{#if (hasFeature "video_calls")}}` | Check feature access |
| `json` | `{{json data}}` | Output JSON |

### Theme Context Variables

Templates receive these context variables:

```javascript
{
  site: {
    name: "Site Name",
    description: "Site description",
    url: "https://example.com",
    activeTheme: "default",
    logo: "/uploads/logo.png"
  },
  user: {
    id: "uuid",
    name: "User Name",
    email: "user@example.com",
    role: "SUBSCRIBER"
  },
  settings: {
    // Theme settings from theme.json
  },
  // Page-specific data (posts, post, page, etc.)
}
```

---

## 9. Plugin Development

### Plugin Structure

Plugins extend NodePress functionality:

```
plugins/my-plugin/
├── plugin.json          # Plugin metadata
├── index.js             # Main entry point
├── routes/              # Custom routes (optional)
├── views/               # Custom views (optional)
└── assets/              # Static assets (optional)
```

### plugin.json Configuration

```json
{
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Adds custom functionality to NodePress",
  "entry": "index.js",
  "hooks": [
    "onActivate",
    "onDeactivate",
    "beforeSave",
    "afterSave",
    "beforeDelete",
    "afterDelete",
    "registerFields",
    "registerRoutes"
  ],
  "settings": {
    "enableFeature": {
      "type": "boolean",
      "default": true,
      "label": "Enable Feature"
    },
    "apiKey": {
      "type": "string",
      "default": "",
      "label": "API Key"
    }
  }
}
```

### Plugin Entry Point

```javascript
// plugins/my-plugin/index.js
module.exports = {
  /**
   * Called when the plugin is activated
   */
  onActivate: async () => {
    console.log('My Plugin activated');
    // Initialize database tables, settings, etc.
  },

  /**
   * Called when the plugin is deactivated
   */
  onDeactivate: async () => {
    console.log('My Plugin deactivated');
    // Clean up resources
  },

  /**
   * Register custom fields for posts
   */
  registerFields: () => {
    return [
      {
        name: 'customField',
        label: 'Custom Field',
        type: 'string',
        defaultValue: '',
      },
      {
        name: 'enableFeature',
        label: 'Enable Feature',
        type: 'boolean',
        defaultValue: false,
      },
    ];
  },

  /**
   * Hook: Before saving a post
   */
  beforeSave: async (data) => {
    console.log('Before save:', data.title);
    // Validate or modify data
    return data;
  },

  /**
   * Hook: After saving a post
   */
  afterSave: async (post) => {
    console.log('After save:', post.id);
    // Send notifications, update cache, etc.
  },

  /**
   * Register custom API routes
   */
  registerRoutes: (app) => {
    app.get('/api/plugins/my-plugin/status', (req, res) => {
      res.json({ status: 'active', version: '1.0.0' });
    });

    app.post('/api/plugins/my-plugin/action', (req, res) => {
      const { action } = req.body;
      res.json({ success: true, action });
    });
  },
};
```

### Available Plugin Hooks

| Hook | Parameters | Description |
|------|------------|-------------|
| `onActivate` | - | Plugin activated |
| `onDeactivate` | - | Plugin deactivated |
| `beforeSave` | `data` | Before content save |
| `afterSave` | `entity` | After content save |
| `beforeDelete` | `id` | Before content delete |
| `afterDelete` | `id` | After content delete |
| `registerFields` | - | Register custom fields |
| `registerRoutes` | `app` | Register API routes |

### Installing & Managing Plugins

```bash
# Via Admin Panel
# Navigate to: Admin → Plugins → Scan for Plugins

# Via API
POST /api/plugins/scan
POST /api/plugins/:id/activate
POST /api/plugins/:id/deactivate
```

---

## 10. API Reference

### Authentication

All protected endpoints require a JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

**Login:**
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

### Content API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/api/posts` | List all posts | ❌ |
| `GET` | `/api/posts/:id` | Get post by ID | ❌ |
| `POST` | `/api/posts` | Create new post | ✅ |
| `PATCH` | `/api/posts/:id` | Update post | ✅ |
| `DELETE` | `/api/posts/:id` | Delete post | ✅ |
| `GET` | `/api/pages` | List all pages | ❌ |
| `GET` | `/api/pages/:id` | Get page by ID | ❌ |
| `POST` | `/api/pages` | Create new page | ✅ |
| `PATCH` | `/api/pages/:id` | Update page | ✅ |
| `DELETE` | `/api/pages/:id` | Delete page | ✅ |

### Media API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/api/media` | List all media | ✅ |
| `GET` | `/api/media/:id` | Get media by ID | ✅ |
| `POST` | `/api/media/upload` | Upload file | ✅ |
| `DELETE` | `/api/media/:id` | Delete media | ✅ |

### Shop API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/api/shop/products` | List products | ❌ |
| `GET` | `/api/shop/products/:id` | Get product | ❌ |
| `POST` | `/api/shop/products` | Create product | ✅ |
| `GET` | `/api/shop/categories` | List categories | ❌ |
| `GET` | `/api/shop/cart` | Get cart | ✅ |
| `POST` | `/api/shop/cart/add` | Add to cart | ✅ |
| `GET` | `/api/shop/orders` | List orders | ✅ |

### LMS API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/api/lms/courses` | List courses | ❌ |
| `GET` | `/api/lms/courses/:id` | Get course | ❌ |
| `POST` | `/api/lms/courses` | Create course | ✅ |
| `GET` | `/api/lms/courses/:id/lessons` | List lessons | ❌ |
| `POST` | `/api/lms/enroll/:courseId` | Enroll in course | ✅ |
| `GET` | `/api/lms/my-courses` | Get enrolled courses | ✅ |
| `POST` | `/api/lms/progress` | Update progress | ✅ |

### Marketplace API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/api/marketplace/developers` | List developers | ❌ |
| `GET` | `/api/marketplace/developers/:id` | Get developer profile | ❌ |
| `POST` | `/api/marketplace/developers` | Apply as developer | ✅ |
| `GET` | `/api/marketplace/hiring-requests` | List hiring requests | ✅ |
| `POST` | `/api/marketplace/hiring-requests` | Create hiring request | ✅ |
| `GET` | `/api/marketplace/projects` | List projects | ✅ |
| `POST` | `/api/marketplace/projects` | Create project | ✅ |

### System APIs

**Backups:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/backups` | List all backups |
| `POST` | `/api/backups` | Create full backup |
| `POST` | `/api/backups/quick` | Create quick backup |
| `GET` | `/api/backups/:id/download` | Download backup |
| `POST` | `/api/backups/:id/restore` | Restore from backup |

**Updates:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/updates/status` | Get update status |
| `GET` | `/api/updates/check` | Check for updates |
| `POST` | `/api/updates/apply` | Apply update |
| `POST` | `/api/updates/rollback/:id` | Rollback version |

---

## 11. Module Deep Dives

### Authentication Module

The auth module handles user authentication, JWT tokens, and session management.

**Key Files:**
- `src/modules/auth/auth.service.ts` - Authentication logic
- `src/modules/auth/guards/jwt-auth.guard.ts` - JWT protection
- `src/modules/auth/guards/roles.guard.ts` - Role-based access
- `src/modules/auth/strategies/jwt.strategy.ts` - JWT validation

**Features:**
- JWT-based authentication
- Refresh tokens
- Password hashing (bcrypt)
- Account lockout after failed attempts
- Two-factor authentication (2FA)

### E-Commerce Module

The shop module provides complete e-commerce functionality.

**Key Files:**
- `src/modules/shop/shop.service.ts` - Product management
- `src/modules/shop/cart.service.ts` - Shopping cart
- `src/modules/shop/order.service.ts` - Order processing
- `src/modules/shop/payment.service.ts` - Stripe integration

**Features:**
- Product catalog with variants
- Shopping cart (session-based)
- Stripe checkout integration
- Order management
- Inventory tracking

### LMS Module

A complete Learning Management System for creating, selling, and delivering online courses with quizzes, progress tracking, and certificates.

**Key Files:**

*Backend Services:*
- `src/modules/lms/services/courses.service.ts` - Course CRUD and catalog
- `src/modules/lms/services/lessons.service.ts` - Lesson management
- `src/modules/lms/services/modules.service.ts` - Course module/section organization
- `src/modules/lms/services/quizzes.service.ts` - Quiz creation and grading
- `src/modules/lms/services/enrollments.service.ts` - Student enrollment handling
- `src/modules/lms/services/progress.service.ts` - Learning progress tracking
- `src/modules/lms/services/certificates.service.ts` - Certificate issuance
- `src/modules/lms/services/certificate-generator.service.ts` - PDF generation

*Controllers:*
- `src/modules/lms/controllers/courses.controller.ts` - Admin course management
- `src/modules/lms/controllers/learning.controller.ts` - Student learning experience
- `src/modules/lms/controllers/enrollments.controller.ts` - Enrollment handling
- `src/modules/lms/controllers/quizzes.controller.ts` - Quiz administration
- `src/modules/lms/controllers/certificates.controller.ts` - Certificate endpoints

*Frontend Pages:*
- `admin/src/pages/lms/CourseCatalog.tsx` - Public course browsing
- `admin/src/pages/lms/CourseLanding.tsx` - Course sales page
- `admin/src/pages/lms/CourseEditor.tsx` - Course creation/editing
- `admin/src/pages/lms/CurriculumBuilder.tsx` - Module and lesson organization
- `admin/src/pages/lms/LearningPlayer.tsx` - Video player with progress tracking
- `admin/src/pages/lms/QuizPlayer.tsx` - Student quiz interface
- `admin/src/pages/lms/StudentDashboard.tsx` - Student's enrolled courses
- `admin/src/pages/lms/Certificate.tsx` - Certificate display and download

**Features:**
- Course creation with rich descriptions and featured images
- Course modules/sections for organizing curriculum
- Multiple lesson types: VIDEO, ARTICLE, QUIZ, ASSIGNMENT
- Video hosting: Self-hosted, YouTube, Vimeo support
- Quiz system with multiple question types
- Automatic and manual progress tracking
- PDF certificate generation
- Enrollment management with payment integration
- Admin dashboard with analytics

#### Course Structure

Courses in NodePress follow a hierarchical structure:

```
Course
├── Module 1 (Section)
│   ├── Lesson 1.1 (VIDEO)
│   ├── Lesson 1.2 (ARTICLE)
│   └── Lesson 1.3 (QUIZ)
├── Module 2
│   ├── Lesson 2.1
│   └── Lesson 2.2
└── Final Quiz (standalone)
```

#### Course DTOs

```typescript
// Creating a course
interface CreateCourseDto {
  title: string;                    // Required
  slug?: string;                    // Auto-generated if not provided
  description?: string;             // Rich text description
  shortDescription?: string;        // For cards/previews
  category?: string;                // Course category
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  featuredImage?: string;           // Cover image URL
  priceType?: 'FREE' | 'PAID';
  priceAmount?: number;             // Price in cents
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  passingScorePercent?: number;     // Required score for quizzes
  certificateEnabled?: boolean;     // Issue certificates on completion
  estimatedHours?: number;
  whatYouLearn?: string[];          // Learning outcomes
  requirements?: string[];          // Prerequisites
}

// Querying courses
interface CourseQueryDto {
  search?: string;                  // Search title/description
  category?: string;
  level?: CourseLevel;
  priceType?: 'FREE' | 'PAID';
  status?: CourseStatus;
  instructorId?: string;
  page?: number;
  limit?: number;
}
```

#### Lesson Types & DTOs

```typescript
enum LessonType {
  VIDEO = 'VIDEO',           // Video content with player
  ARTICLE = 'ARTICLE',       // Rich text content
  QUIZ = 'QUIZ',             // Interactive quiz
  ASSIGNMENT = 'ASSIGNMENT', // Homework/project
}

interface CreateLessonDto {
  title: string;
  content?: string;          // Rich text content
  orderIndex?: number;       // Position in curriculum
  type?: LessonType;
  videoAssetId?: string;     // Link to video asset
  moduleId?: string;         // Parent module
  estimatedMinutes?: number;
  isPreview?: boolean;       // Free preview for unenrolled users
  isRequired?: boolean;      // Required for completion
}

// Video asset for lessons
interface CreateVideoAssetDto {
  provider?: 'UPLOAD' | 'HLS' | 'YOUTUBE' | 'VIMEO';
  url?: string;
  playbackId?: string;       // Provider-specific ID
  filePath?: string;         // For uploads
  durationSeconds?: number;
  isProtected?: boolean;
  thumbnailUrl?: string;
}
```

#### Quiz System

The quiz system supports multiple question types with automatic grading:

```typescript
enum QuestionType {
  MCQ = 'MCQ',               // Multiple choice (single answer)
  MCQ_MULTI = 'MCQ_MULTI',   // Multiple choice (multiple answers)
  TRUE_FALSE = 'TRUE_FALSE', // Boolean
  SHORT_ANSWER = 'SHORT_ANSWER', // Text matching
  ESSAY = 'ESSAY',           // Long form (manual grading)
}

interface CreateQuizDto {
  title: string;
  description?: string;
  lessonId?: string;           // Attach to lesson
  timeLimitSeconds?: number;   // Optional time limit
  attemptsAllowed?: number;    // Max retakes
  shuffleQuestions?: boolean;  // Randomize order
  passingScorePercent?: number;
  isRequired?: boolean;        // Required for certificate
  questions?: CreateQuestionDto[];
}

interface CreateQuestionDto {
  type: QuestionType;
  prompt: string;              // Question text
  optionsJson?: string[];      // Answer options for MCQ
  correctAnswerJson: any;      // Correct answer
  explanation?: string;        // Shown after answering
  points?: number;             // Point value
  orderIndex?: number;
}

// Submitting quiz answers
interface SubmitQuizDto {
  answers: Array<{
    questionId: string;
    answer: any;  // string, string[], or boolean
  }>;
}
```

**Quiz Flow:**
1. Student starts quiz: `POST /api/lms/learn/:courseId/quizzes/:quizId/start`
2. Receives questions (without correct answers)
3. Submits answers: `POST /api/lms/learn/:courseId/quizzes/:quizId/attempts/:attemptId/submit`
4. Receives results with score and explanations

#### Progress Tracking

```typescript
interface UpdateProgressDto {
  videoWatchedSeconds?: number;  // For video lessons
  lessonCompleted?: boolean;     // Mark complete
}
```

**Auto-completion:**
- Video lessons auto-complete at 90% watched
- Progress is tracked every 10 seconds during video playback
- Quiz lessons complete when passing score is achieved

**Progress Response:**
```typescript
interface CourseProgress {
  lessons: Array<{
    id: string;
    title: string;
    completed: boolean;
    progress?: { videoWatchedSeconds: number; lastAccessedAt: Date };
  }>;
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
  nextLesson?: Lesson;
  requiredQuizzes: Array<{ id: string; title: string; passed: boolean }>;
  allRequiredQuizzesPassed: boolean;
  isComplete: boolean;  // True when eligible for certificate
}
```

#### Enrollment System

```typescript
// Enroll in a course
interface EnrollCourseDto {
  paymentId?: string;  // Required for paid courses
}

// Enrollment statuses
enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}
```

#### Certificate Generation

Certificates are automatically issued when:
1. All lessons are completed
2. All required quizzes are passed
3. Course has `certificateEnabled: true`

**Certificate Features:**
- Unique certificate number
- Verification hash for public verification
- PDF download with custom template
- Public verification URL

```typescript
// Certificate data
interface Certificate {
  id: string;
  certificateNumber: string;
  verificationHash: string;
  pdfUrl?: string;
  issuedAt: Date;
  course: { title: string };
  user: { name: string };
}

// Verify a certificate
GET /api/lms/certificates/verify/:hash
// Returns: { valid: true, certificate: {...} } or { valid: false, message: '...' }
```

#### API Endpoints Summary

**Public Endpoints:**
```typescript
GET  /api/lms/courses                    // Course catalog
GET  /api/lms/courses/categories         // Get all categories
GET  /api/lms/courses/:slug              // Course details by slug
GET  /api/lms/certificates/verify/:hash  // Verify certificate
```

**Student Endpoints (Authenticated):**
```typescript
POST /api/lms/courses/:id/enroll         // Enroll in course
GET  /api/lms/my-courses                 // Enrolled courses
GET  /api/lms/dashboard                  // Student dashboard

// Learning
GET  /api/lms/learn/:courseId            // Course with progress
GET  /api/lms/learn/:courseId/lessons/:lessonId  // Lesson content
PUT  /api/lms/learn/:courseId/lessons/:lessonId/progress  // Update progress
POST /api/lms/learn/:courseId/lessons/:lessonId/complete  // Mark complete

// Quizzes
GET  /api/lms/learn/:courseId/quizzes/:quizId  // Quiz info
POST /api/lms/learn/:courseId/quizzes/:quizId/start  // Start attempt
POST /api/lms/learn/:courseId/quizzes/:quizId/attempts/:attemptId/submit  // Submit

// Certificates
GET  /api/lms/my-certificates            // User's certificates
POST /api/lms/courses/:id/certificate    // Request certificate
```

**Admin Endpoints:**
```typescript
// Course management
POST   /api/admin/lms/courses            // Create course
PUT    /api/admin/lms/courses/:id        // Update course
DELETE /api/admin/lms/courses/:id        // Delete course

// Modules (curriculum sections)
POST   /api/admin/lms/courses/:courseId/modules      // Create module
PUT    /api/admin/lms/modules/:id                    // Update module
DELETE /api/admin/lms/modules/:id                    // Delete module
PUT    /api/admin/lms/courses/:courseId/modules/reorder  // Reorder

// Lessons
POST   /api/admin/lms/courses/:courseId/lessons      // Create lesson
PUT    /api/admin/lms/lessons/:id                    // Update lesson
DELETE /api/admin/lms/lessons/:id                    // Delete lesson

// Quizzes
POST   /api/admin/lms/courses/:courseId/quizzes      // Create quiz
PUT    /api/admin/lms/quizzes/:id                    // Update quiz
POST   /api/admin/lms/quizzes/:id/questions          // Add question
PUT    /api/admin/lms/questions/:id                  // Update question

// Enrollments
GET    /api/admin/lms/courses/:courseId/enrollments  // Course enrollments
PUT    /api/admin/lms/enrollments/:id                // Update enrollment

// Dashboard
GET    /api/admin/lms/dashboard                      // Admin stats
```

#### Frontend Routes

```typescript
// Student routes
/lms/catalog              // Course catalog
/lms/course/:slug         // Course landing page
/lms/learn/:courseId      // Learning player
/lms/learn/:courseId/lesson/:lessonId  // Specific lesson
/lms/quiz/:courseId/:quizId  // Quiz player
/lms/certificate/:courseId   // Certificate view
/lms/my-courses           // Student dashboard

// Admin routes
/admin/lms                    // LMS dashboard
/admin/lms/courses            // Course list
/admin/lms/courses/new        // Create course
/admin/lms/courses/:id        // Edit course
/admin/lms/courses/:id/curriculum  // Curriculum builder
/admin/lms/courses/:id/quizzes     // Course quizzes
/admin/lms/courses/:id/quizzes/:quizId/questions  // Quiz questions
```

### Real-time Messaging

WebSocket-based messaging system.

**Key Files:**
- `src/modules/messages/messages.gateway.ts` - Socket.IO gateway
- `src/modules/messages/messages.service.ts` - Message handling

**Events:**
```typescript
// Client → Server
socket.emit('sendMessage', { conversationId, content });
socket.emit('joinConversation', conversationId);
socket.emit('typing', { conversationId, isTyping: true });

// Server → Client
socket.on('newMessage', (message) => { ... });
socket.on('userTyping', ({ userId, isTyping }) => { ... });
```

### Video Calls (WebRTC)

Peer-to-peer video calling.

**Key Files:**
- `src/modules/video-calls/video-calls.gateway.ts` - Signaling server
- `admin/src/components/VideoCall.tsx` - React component

**Flow:**
1. Caller initiates call via WebSocket
2. Callee receives call notification
3. WebRTC signaling (offer/answer/ICE)
4. Direct peer-to-peer connection established

### Timeline & Social Module

A complete social networking module with posts, comments, likes, shares, and real-time updates.

**Key Files:**
- `src/modules/timeline/timeline.service.ts` - Post creation and feed management
- `src/modules/timeline/timeline.controller.ts` - REST API endpoints
- `src/modules/timeline/timeline.gateway.ts` - Real-time WebSocket events
- `admin/src/pages/feed/Timeline.tsx` - Main timeline feed page
- `admin/src/components/PostCard.tsx` - Post display component
- `admin/src/components/CommentModal.tsx` - Full-screen comments view
- `admin/src/components/CreatePostForm.tsx` - Post creation form
- `admin/src/components/MobileMediaRecorder.tsx` - Video/audio recording

**Features:**
- Timeline posts with text, images, and videos
- Real-time likes, comments, and shares
- Hashtag detection and trending topics
- @mention support with notifications
- Follow/unfollow system
- Discover feed for public posts
- Full-screen comment modal with post preview
- Video and audio recording for comments

**API Endpoints:**
```typescript
POST /api/timeline/posts              // Create a new post
GET  /api/timeline/feed               // Get personalized feed
GET  /api/timeline/discover           // Get public discover feed
GET  /api/timeline/posts/:id          // Get single post
POST /api/timeline/posts/:id/like     // Like a post
DELETE /api/timeline/posts/:id/like   // Unlike a post
POST /api/timeline/posts/:id/share    // Share/repost
GET  /api/timeline/posts/:id/comments // Get post comments
POST /api/timeline/posts/:id/comments // Add comment
GET  /api/timeline/hashtags/trending  // Get trending hashtags
GET  /api/timeline/hashtags/:tag/posts // Posts by hashtag
GET  /api/timeline/users/:id/posts    // Get user's posts
```

**WebSocket Events:**
```typescript
// Real-time timeline updates
socket.on('timeline:newPost', (post) => { ... });
socket.on('timeline:postLiked', ({ postId, userId, count }) => { ... });
socket.on('timeline:newComment', ({ postId, comment }) => { ... });
socket.on('timeline:postShared', ({ postId, userId }) => { ... });
```

### Frontend Components

#### CommentModal Component

A full-screen modal for viewing and adding comments on posts. Features:

- **Full Post Preview**: Shows the original post with author, content, and media
- **Comments Feed**: Scrollable list of all comments with replies
- **Reply Support**: Nested replies to comments
- **Video/Audio Recording**: Record video or voice note comments
- **Mobile Optimized**: Safe area insets for notched devices
- **Real-time Updates**: Comments appear instantly via WebSocket

```typescript
// Usage in PostCard or Timeline
<CommentModal
  postId={post.id}
  post={post}  // Optional: pass post data to avoid loading
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onCommentAdded={() => updateCommentCount()}
/>
```

#### MobileMediaRecorder Component

A modern, TikTok-inspired media recording component for video and audio capture.

**Features:**
- Video recording with front/back camera toggle
- Audio-only recording with waveform visualization
- Screen recording with microphone commentary
- Permission handling with user-friendly prompts
- Upload progress with visual feedback
- Preview before saving
- Haptic feedback on mobile devices

```typescript
// Usage for video recording
<MobileMediaRecorder
  isOpen={showRecorder}
  onClose={() => setShowRecorder(false)}
  onMediaCaptured={(media) => {
    // media: { type: 'VIDEO' | 'AUDIO', url: string, thumbnail?: string }
    console.log('Recorded:', media.url);
  }}
  mode="video"  // 'video' | 'audio' | 'screen'
/>
```

#### PostCard Component

Displays a timeline post with full interaction support.

**Props:**
```typescript
interface PostCardProps {
  post: TimelinePost;
  onDelete?: (postId: string) => void;
  onCommentClick?: (postId: string, post: TimelinePost) => void;
  onHashtagClick?: (tag: string) => void;
  onPostShared?: (post: TimelinePost) => void;
}
```

**Features:**
- Author avatar and name with link to profile
- Post content with hashtag and mention highlighting
- Media gallery with lightbox
- Like button with real-time count
- Comment button opening full-screen modal
- Share/repost functionality
- Delete option for own posts

#### CreatePostForm Component

Rich post creation with media upload support.

**Features:**
- Text input with character count
- Drag-and-drop media upload
- Video recording integration
- Audio voice note recording
- Hashtag auto-detection
- @mention autocomplete
- Post visibility toggle

---

## 12. Testing & Quality

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e

# Run specific test file
npm run test -- --testPathPattern=auth

# Watch mode
npm run test:watch
```

### Writing Unit Tests

```typescript
// src/modules/posts/posts.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: {
            post: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of posts', async () => {
      const mockPosts = [{ id: '1', title: 'Test Post' }];
      jest.spyOn(prisma.post, 'findMany').mockResolvedValue(mockPosts);

      const result = await service.findAll();
      expect(result).toEqual(mockPosts);
    });
  });
});
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint -- --fix

# Format code with Prettier
npm run format

# Type check admin panel
cd admin && npx tsc --noEmit
```

---

## 13. Deployment

### Render.com Deployment

NodePress is optimized for Render.com deployment:

**1. Create a PostgreSQL database on Render**

**2. Create a Web Service:**
- Build Command: `npm install && cd admin && npm install && npm run build && cd .. && npx prisma generate && npx prisma db push`
- Start Command: `npm run start:prod`

**3. Environment Variables:**
```env
DATABASE_URL=<your-render-postgres-url>
JWT_SECRET=<generate-secure-key>
SESSION_SECRET=<generate-secure-key>
NODE_ENV=production
PORT=3000
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN cd admin && npm ci && npm run build && cd ..
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/nodepress
      - JWT_SECRET=your-secret
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=nodepress
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 14. Advanced Topics

### Custom Middleware

```typescript
// src/common/middleware/logging.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });

    next();
  }
}
```

### Event Emitters

```typescript
// Using NestJS EventEmitter
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PostsService {
  constructor(private eventEmitter: EventEmitter2) {}

  async create(dto: CreatePostDto) {
    const post = await this.prisma.post.create({ data: dto });

    // Emit event
    this.eventEmitter.emit('post.created', post);

    return post;
  }
}

// Listen for events
@Injectable()
export class NotificationService {
  @OnEvent('post.created')
  handlePostCreated(post: Post) {
    console.log('New post created:', post.title);
    // Send notifications, update cache, etc.
  }
}
```

### Caching with Redis

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PostsService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async findAll() {
    // Check cache first
    const cached = await this.cache.get('posts:all');
    if (cached) return cached;

    // Fetch from database
    const posts = await this.prisma.post.findMany();

    // Cache for 5 minutes
    await this.cache.set('posts:all', posts, 300);

    return posts;
  }
}
```

### Rate Limiting

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('api/auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

---

## 15. Production Cheatsheet - Linux, Database & Server Management

> ⚠️ **CRITICAL WARNING:** Always backup your database before running ANY destructive commands. The commands in the "DANGEROUS" sections can permanently delete data.

### 15.1 Essential Linux Commands

#### File System Navigation

```bash
# Current directory
pwd

# List files (detailed)
ls -la

# List files with human-readable sizes
ls -lah

# Change directory
cd /var/www/WordPress-Node

# Go back one directory
cd ..

# Go to home directory
cd ~

# Create directory
mkdir -p /path/to/new/directory

# Remove empty directory
rmdir directory_name

# Remove directory with contents (CAREFUL!)
rm -rf directory_name

# Copy file
cp source.txt destination.txt

# Copy directory recursively
cp -r source_dir destination_dir

# Move/rename file
mv old_name.txt new_name.txt

# View file contents
cat file.txt

# View file with line numbers
cat -n file.txt

# View large file (paginated)
less file.txt

# View first 50 lines
head -50 file.txt

# View last 50 lines
tail -50 file.txt

# Follow log file in real-time
tail -f /var/log/nginx/error.log

# Search in file
grep "search_term" file.txt

# Search recursively in directory
grep -r "search_term" /path/to/directory

# Search with line numbers
grep -n "search_term" file.txt

# Find files by name
find /var/www -name "*.js"

# Find files modified in last 24 hours
find /var/www -mtime -1

# Find and delete (CAREFUL!)
find /tmp -name "*.log" -delete

# Check disk usage
df -h

# Check directory size
du -sh /var/www/WordPress-Node

# Check directory sizes (sorted)
du -sh /var/www/* | sort -h
```

#### File Permissions

```bash
# View permissions
ls -la file.txt

# Change owner
chown user:group file.txt

# Change owner recursively
chown -R www-data:www-data /var/www/WordPress-Node

# Change permissions (read/write/execute for owner)
chmod 755 script.sh

# Common permission patterns:
# 755 - rwxr-xr-x (directories, executables)
# 644 - rw-r--r-- (regular files)
# 600 - rw------- (sensitive files like .env)

# Make file executable
chmod +x script.sh

# Secure .env file
chmod 600 .env
```

#### Process Management

```bash
# View running processes
ps aux

# Find specific process
ps aux | grep node

# Find process by port
lsof -i :3000

# Kill process by PID
kill 12345

# Force kill process
kill -9 12345

# Kill process by name
pkill -f "node"

# View real-time process info
htop

# View memory usage
free -h

# View CPU info
lscpu

# System uptime
uptime
```

#### Network Commands

```bash
# Check open ports
netstat -tulpn

# Check specific port
netstat -tulpn | grep 3000

# Test connection to host:port
nc -zv localhost 5432

# Check DNS
nslookup nodepress.co.uk

# Download file
wget https://example.com/file.zip

# Download with curl
curl -O https://example.com/file.zip

# Test HTTP endpoint
curl -I https://nodepress.co.uk

# Check firewall status
sudo ufw status

# Allow port through firewall
sudo ufw allow 3000

# Check active connections
ss -tulpn
```

### 15.2 Systemd Service Management

```bash
# Start a service
sudo systemctl start nginx

# Stop a service
sudo systemctl stop nginx

# Restart a service
sudo systemctl restart nginx

# Reload config without restart
sudo systemctl reload nginx

# Check service status
sudo systemctl status nginx

# Enable service on boot
sudo systemctl enable nginx

# Disable service on boot
sudo systemctl disable nginx

# View service logs
sudo journalctl -u nginx

# View service logs (follow)
sudo journalctl -u nginx -f

# View last 100 log lines
sudo journalctl -u nginx -n 100

# List all services
systemctl list-units --type=service

# List failed services
systemctl list-units --type=service --state=failed
```

### 15.3 PM2 Process Manager

```bash
# ═══════════════════════════════════════════════════════════════
# PM2 BASIC COMMANDS
# ═══════════════════════════════════════════════════════════════

# Start application
pm2 start dist/main.js --name nodepress

# Start with ecosystem file
pm2 start ecosystem.config.js

# List all processes
pm2 list

# Show detailed info
pm2 show nodepress

# Restart application
pm2 restart nodepress

# Restart with env update
pm2 restart nodepress --update-env

# Stop application
pm2 stop nodepress

# Delete application from PM2
pm2 delete nodepress

# Restart all applications
pm2 restart all

# Stop all applications
pm2 stop all

# ═══════════════════════════════════════════════════════════════
# PM2 LOGS
# ═══════════════════════════════════════════════════════════════

# View all logs
pm2 logs

# View specific app logs
pm2 logs nodepress

# View last 200 lines
pm2 logs nodepress --lines 200

# Clear all logs
pm2 flush

# ═══════════════════════════════════════════════════════════════
# PM2 MONITORING
# ═══════════════════════════════════════════════════════════════

# Real-time monitoring dashboard
pm2 monit

# Show memory/CPU usage
pm2 status

# ═══════════════════════════════════════════════════════════════
# PM2 STARTUP & SAVE
# ═══════════════════════════════════════════════════════════════

# Save current process list
pm2 save

# Generate startup script
pm2 startup

# Remove startup script
pm2 unstartup

# Resurrect saved processes
pm2 resurrect

# ═══════════════════════════════════════════════════════════════
# PM2 CLUSTER MODE (Scaling)
# ═══════════════════════════════════════════════════════════════

# Start with multiple instances
pm2 start dist/main.js -i max --name nodepress

# Start with specific number of instances
pm2 start dist/main.js -i 4 --name nodepress

# Scale up/down
pm2 scale nodepress 4

# Reload with zero downtime
pm2 reload nodepress
```

### 15.4 PostgreSQL Database Management

```bash
# ═══════════════════════════════════════════════════════════════
# CONNECTION & ACCESS
# ═══════════════════════════════════════════════════════════════

# Connect to PostgreSQL as postgres user
sudo -u postgres psql

# Connect to specific database
sudo -u postgres psql -d wordpress_node

# Connect with user/password
PGPASSWORD=your_password psql -h localhost -U wpnode -d wordpress_node

# Connect using DATABASE_URL
psql "postgresql://wpnode:password@localhost:5432/wordpress_node"

# Exit psql
\q

# ═══════════════════════════════════════════════════════════════
# POSTGRESQL SERVICE
# ═══════════════════════════════════════════════════════════════

# Start PostgreSQL
sudo systemctl start postgresql

# Stop PostgreSQL
sudo systemctl stop postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# ═══════════════════════════════════════════════════════════════
# DATABASE OPERATIONS (Run inside psql)
# ═══════════════════════════════════════════════════════════════

# List all databases
\l

# Connect to database
\c wordpress_node

# List all tables
\dt

# List tables with sizes
\dt+

# Describe table structure
\d users

# Describe table with details
\d+ users

# List all schemas
\dn

# Show current user
SELECT current_user;

# Show current database
SELECT current_database();

# ═══════════════════════════════════════════════════════════════
# USER MANAGEMENT
# ═══════════════════════════════════════════════════════════════

# Create user
CREATE USER wpnode WITH PASSWORD 'secure_password';

# Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE wordpress_node TO wpnode;

# Grant schema privileges
GRANT ALL ON SCHEMA public TO wpnode;

# Grant table privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wpnode;

# Grant sequence privileges
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wpnode;

# Alter user password
ALTER USER wpnode WITH PASSWORD 'new_password';

# List users
\du

# ═══════════════════════════════════════════════════════════════
# BACKUP & RESTORE (CRITICAL!)
# ═══════════════════════════════════════════════════════════════

# ⚠️ ALWAYS BACKUP BEFORE ANY MAJOR CHANGES!

# Backup single database (recommended)
pg_dump -U wpnode -h localhost wordpress_node > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
pg_dump -U wpnode -h localhost wordpress_node | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup specific tables only
pg_dump -U wpnode -h localhost -t users -t posts wordpress_node > tables_backup.sql

# Backup all databases
pg_dumpall -U postgres > all_databases_backup.sql

# Backup in custom format (allows selective restore)
pg_dump -U wpnode -h localhost -Fc wordpress_node > backup.dump

# Restore from SQL file
psql -U wpnode -h localhost -d wordpress_node < backup.sql

# Restore from compressed file
gunzip -c backup.sql.gz | psql -U wpnode -h localhost -d wordpress_node

# Restore from custom format
pg_restore -U wpnode -h localhost -d wordpress_node backup.dump

# Restore specific table from custom format
pg_restore -U wpnode -h localhost -d wordpress_node -t users backup.dump

# ═══════════════════════════════════════════════════════════════
# USEFUL QUERIES
# ═══════════════════════════════════════════════════════════════

# Count rows in table
SELECT COUNT(*) FROM users;

# Show table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Show database size
SELECT pg_size_pretty(pg_database_size('wordpress_node'));

# Show active connections
SELECT * FROM pg_stat_activity WHERE datname = 'wordpress_node';

# Kill a specific connection
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = 12345;

# Show running queries
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE state != 'idle' AND datname = 'wordpress_node';

# ═══════════════════════════════════════════════════════════════
# ⚠️ DANGEROUS OPERATIONS - USE WITH EXTREME CAUTION!
# ═══════════════════════════════════════════════════════════════

# Drop database (DESTROYS ALL DATA!)
# DROP DATABASE wordpress_node;

# Truncate table (DELETES ALL ROWS!)
# TRUNCATE TABLE users CASCADE;

# Delete all rows (slower but logs each row)
# DELETE FROM users;

# Drop table (DESTROYS TABLE!)
# DROP TABLE users CASCADE;
```

### 15.5 Prisma ORM Commands

```bash
# ═══════════════════════════════════════════════════════════════
# PRISMA SAFE COMMANDS (Non-destructive)
# ═══════════════════════════════════════════════════════════════

# Generate Prisma Client (safe - no DB changes)
npx prisma generate

# Open Prisma Studio (database GUI - READ operations safe)
npx prisma studio

# Validate schema file
npx prisma validate

# Format schema file
npx prisma format

# Pull database schema into Prisma (reads existing DB)
npx prisma db pull

# Show current migration status
npx prisma migrate status

# ═══════════════════════════════════════════════════════════════
# PRISMA DEVELOPMENT COMMANDS
# ═══════════════════════════════════════════════════════════════

# Create and apply migration (development only)
npx prisma migrate dev --name migration_name

# Apply pending migrations
npx prisma migrate deploy

# Push schema changes (no migration file - DEV ONLY!)
npx prisma db push

# Seed database
npx prisma db seed

# ═══════════════════════════════════════════════════════════════
# ⚠️ DANGEROUS PRISMA COMMANDS - BACKUP FIRST!
# ═══════════════════════════════════════════════════════════════

# Reset database (DELETES ALL DATA!)
# npx prisma migrate reset

# Reset and re-seed (DELETES ALL DATA!)
# npx prisma migrate reset --force

# Push with force (can drop columns!)
# npx prisma db push --force-reset

# ═══════════════════════════════════════════════════════════════
# PRISMA TROUBLESHOOTING
# ═══════════════════════════════════════════════════════════════

# Clear Prisma cache
rm -rf node_modules/.prisma
npx prisma generate

# Regenerate client after schema change
npx prisma generate

# Check Prisma version
npx prisma --version

# Debug Prisma queries (add to code)
# const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
```

### 15.6 Redis Management

```bash
# ═══════════════════════════════════════════════════════════════
# REDIS SERVICE
# ═══════════════════════════════════════════════════════════════

# Start Redis
sudo systemctl start redis-server

# Stop Redis
sudo systemctl stop redis-server

# Restart Redis
sudo systemctl restart redis-server

# Check status
sudo systemctl status redis-server

# ═══════════════════════════════════════════════════════════════
# REDIS CLI COMMANDS
# ═══════════════════════════════════════════════════════════════

# Connect to Redis
redis-cli

# Connect with password
redis-cli -a your_password

# Connect to remote Redis
redis-cli -h hostname -p 6379 -a password

# Test connection
redis-cli ping
# Should return: PONG

# ═══════════════════════════════════════════════════════════════
# REDIS DATA OPERATIONS
# ═══════════════════════════════════════════════════════════════

# Set a key
SET mykey "Hello"

# Get a key
GET mykey

# Delete a key
DEL mykey

# Check if key exists
EXISTS mykey

# Set key with expiration (seconds)
SETEX mykey 3600 "Hello"

# Get all keys (CAREFUL in production!)
KEYS *

# Get keys matching pattern
KEYS wpnode:*

# Get key type
TYPE mykey

# Get key TTL (time to live)
TTL mykey

# ═══════════════════════════════════════════════════════════════
# REDIS MONITORING
# ═══════════════════════════════════════════════════════════════

# Server info
INFO

# Memory info
INFO memory

# Connected clients
INFO clients

# Monitor all commands (CAREFUL - performance impact)
MONITOR

# Slow log
SLOWLOG GET 10

# Database size (number of keys)
DBSIZE

# ═══════════════════════════════════════════════════════════════
# REDIS CACHE MANAGEMENT
# ═══════════════════════════════════════════════════════════════

# Clear specific database
SELECT 0
FLUSHDB

# Clear ALL databases (CAREFUL!)
FLUSHALL

# Delete keys matching pattern
redis-cli KEYS "wpnode:cache:*" | xargs redis-cli DEL

# ═══════════════════════════════════════════════════════════════
# REDIS CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# Edit Redis config
sudo nano /etc/redis/redis.conf

# Key settings:
# maxmemory 256mb
# maxmemory-policy allkeys-lru
# requirepass your_password

# Reload config
redis-cli CONFIG REWRITE
```

### 15.7 Nginx Web Server

```bash
# ═══════════════════════════════════════════════════════════════
# NGINX SERVICE
# ═══════════════════════════════════════════════════════════════

# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx
sudo systemctl restart nginx

# Reload config (no downtime)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# ═══════════════════════════════════════════════════════════════
# NGINX CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# Main config file
sudo nano /etc/nginx/nginx.conf

# Site config
sudo nano /etc/nginx/sites-available/nodepress

# Enable site (create symlink)
sudo ln -s /etc/nginx/sites-available/nodepress /etc/nginx/sites-enabled/

# Disable site (remove symlink)
sudo rm /etc/nginx/sites-enabled/nodepress

# List enabled sites
ls -la /etc/nginx/sites-enabled/

# ═══════════════════════════════════════════════════════════════
# NGINX LOGS
# ═══════════════════════════════════════════════════════════════

# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log

# Site-specific logs
sudo tail -f /var/log/nginx/nodepress.access.log
sudo tail -f /var/log/nginx/nodepress.error.log

# ═══════════════════════════════════════════════════════════════
# SAMPLE NODEPRESS NGINX CONFIG
# ═══════════════════════════════════════════════════════════════

# Save to: /etc/nginx/sites-available/nodepress
#
# server {
#     listen 80;
#     server_name nodepress.co.uk www.nodepress.co.uk;
#     return 301 https://$server_name$request_uri;
# }
#
# server {
#     listen 443 ssl http2;
#     server_name nodepress.co.uk www.nodepress.co.uk;
#
#     ssl_certificate /etc/letsencrypt/live/nodepress.co.uk/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/nodepress.co.uk/privkey.pem;
#
#     client_max_body_size 500M;
#
#     location / {
#         proxy_pass http://127.0.0.1:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#     }
#
#     location /socket.io {
#         proxy_pass http://127.0.0.1:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection "upgrade";
#     }
# }
```

### 15.8 SSL/TLS with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (interactive)
sudo certbot --nginx -d nodepress.co.uk -d www.nodepress.co.uk

# Get certificate (non-interactive)
sudo certbot --nginx --non-interactive --agree-tos --email admin@nodepress.co.uk -d nodepress.co.uk

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# List certificates
sudo certbot certificates

# Delete certificate
sudo certbot delete --cert-name nodepress.co.uk

# Auto-renewal is handled by systemd timer
sudo systemctl status certbot.timer
```

### 15.9 Docker Management

```bash
# ═══════════════════════════════════════════════════════════════
# DOCKER SERVICE
# ═══════════════════════════════════════════════════════════════

# Start Docker
sudo systemctl start docker

# Stop Docker
sudo systemctl stop docker

# Check status
sudo systemctl status docker

# Docker version
docker --version

# ═══════════════════════════════════════════════════════════════
# DOCKER IMAGES
# ═══════════════════════════════════════════════════════════════

# List images
docker images

# Pull image
docker pull node:20-alpine

# Build image from Dockerfile
docker build -t nodepress:latest .

# Remove image
docker rmi nodepress:latest

# Remove unused images
docker image prune

# ═══════════════════════════════════════════════════════════════
# DOCKER CONTAINERS
# ═══════════════════════════════════════════════════════════════

# List running containers
docker ps

# List all containers
docker ps -a

# Run container
docker run -d --name nodepress -p 3000:3000 nodepress:latest

# Run with environment file
docker run -d --name nodepress --env-file .env -p 3000:3000 nodepress:latest

# Stop container
docker stop nodepress

# Start stopped container
docker start nodepress

# Restart container
docker restart nodepress

# Remove container
docker rm nodepress

# Force remove running container
docker rm -f nodepress

# View container logs
docker logs nodepress

# Follow container logs
docker logs -f nodepress

# Execute command in container
docker exec -it nodepress /bin/sh

# ═══════════════════════════════════════════════════════════════
# DOCKER COMPOSE
# ═══════════════════════════════════════════════════════════════

# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Scale service
docker-compose up -d --scale nodepress=3

# ═══════════════════════════════════════════════════════════════
# DOCKER CLEANUP
# ═══════════════════════════════════════════════════════════════

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a

# Check disk usage
docker system df
```

### 15.10 Storage Management

```bash
# ═══════════════════════════════════════════════════════════════
# DISK USAGE
# ═══════════════════════════════════════════════════════════════

# Check disk space
df -h

# Check specific partition
df -h /var/www

# Check directory sizes
du -sh /var/www/WordPress-Node/*

# Find largest files
find /var/www -type f -exec du -h {} + | sort -rh | head -20

# Find largest directories
du -h /var/www --max-depth=2 | sort -rh | head -20

# ═══════════════════════════════════════════════════════════════
# UPLOADS DIRECTORY
# ═══════════════════════════════════════════════════════════════

# Check uploads size
du -sh /var/www/WordPress-Node/uploads

# List uploads by size
ls -lahS /var/www/WordPress-Node/uploads

# Find files larger than 100MB
find /var/www/WordPress-Node/uploads -size +100M -type f

# ═══════════════════════════════════════════════════════════════
# CLEANUP OLD FILES
# ═══════════════════════════════════════════════════════════════

# Find files older than 30 days
find /var/www/WordPress-Node/backups -mtime +30 -type f

# Delete files older than 30 days (CAREFUL!)
find /var/www/WordPress-Node/backups -mtime +30 -type f -delete

# Clean npm cache
npm cache clean --force

# Clean PM2 logs
pm2 flush

# Clear system logs older than 7 days
sudo journalctl --vacuum-time=7d

# ═══════════════════════════════════════════════════════════════
# BACKUP UPLOADS
# ═══════════════════════════════════════════════════════════════

# Create uploads backup
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz /var/www/WordPress-Node/uploads

# Restore uploads backup
tar -xzvf uploads_backup_20250106.tar.gz -C /

# Sync to remote (rsync)
rsync -avz /var/www/WordPress-Node/uploads user@backup-server:/backups/uploads/
```

### 15.11 Git Version Control

```bash
# ═══════════════════════════════════════════════════════════════
# BASIC GIT COMMANDS
# ═══════════════════════════════════════════════════════════════

# Check status
git status

# View changes
git diff

# Add files
git add .

# Commit
git commit -m "feat: description"

# Push to remote
git push origin main

# Pull latest
git pull origin main

# ═══════════════════════════════════════════════════════════════
# BRANCHES
# ═══════════════════════════════════════════════════════════════

# List branches
git branch -a

# Create branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# ═══════════════════════════════════════════════════════════════
# STASHING (Save work temporarily)
# ═══════════════════════════════════════════════════════════════

# Stash changes
git stash

# Stash with message
git stash save "Work in progress on feature X"

# List stashes
git stash list

# Apply stash
git stash pop

# Apply specific stash
git stash apply stash@{0}

# ═══════════════════════════════════════════════════════════════
# VIEWING HISTORY
# ═══════════════════════════════════════════════════════════════

# View commit log
git log --oneline -20

# View specific file history
git log --oneline -20 -- path/to/file

# Show specific commit
git show abc1234

# View who changed what
git blame path/to/file

# ═══════════════════════════════════════════════════════════════
# ⚠️ DANGEROUS GIT COMMANDS - UNDERSTAND BEFORE USING!
# ═══════════════════════════════════════════════════════════════

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - CAREFUL!
git reset --hard HEAD~1

# Discard all local changes - CAREFUL!
git checkout -- .

# Force push (VERY CAREFUL - can overwrite remote!)
# git push --force origin main

# Reset to remote state (LOSES LOCAL CHANGES!)
# git fetch origin
# git reset --hard origin/main
```

### 15.12 Complete Backup Strategy

```bash
# ═══════════════════════════════════════════════════════════════
# FULL BACKUP SCRIPT
# ═══════════════════════════════════════════════════════════════

#!/bin/bash
# Save as: /var/www/WordPress-Node/scripts/full-backup.sh

BACKUP_DIR="/var/www/WordPress-Node/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/WordPress-Node"

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup database
echo "Backing up database..."
PGPASSWORD=your_password pg_dump -U wpnode -h localhost wordpress_node > "$BACKUP_DIR/$DATE/database.sql"

# Backup uploads
echo "Backing up uploads..."
tar -czvf "$BACKUP_DIR/$DATE/uploads.tar.gz" "$APP_DIR/uploads"

# Backup .env
echo "Backing up configuration..."
cp "$APP_DIR/.env" "$BACKUP_DIR/$DATE/.env"

# Backup themes
tar -czvf "$BACKUP_DIR/$DATE/themes.tar.gz" "$APP_DIR/themes"

echo "Backup complete: $BACKUP_DIR/$DATE"

# ═══════════════════════════════════════════════════════════════
# RESTORE SCRIPT
# ═══════════════════════════════════════════════════════════════

#!/bin/bash
# Save as: /var/www/WordPress-Node/scripts/restore-backup.sh

BACKUP_PATH=$1
APP_DIR="/var/www/WordPress-Node"

if [ -z "$BACKUP_PATH" ]; then
    echo "Usage: ./restore-backup.sh /path/to/backup/directory"
    exit 1
fi

# Stop application
pm2 stop nodepress

# Restore database
echo "Restoring database..."
PGPASSWORD=your_password psql -U wpnode -h localhost -d wordpress_node < "$BACKUP_PATH/database.sql"

# Restore uploads
echo "Restoring uploads..."
tar -xzvf "$BACKUP_PATH/uploads.tar.gz" -C /

# Restore .env
cp "$BACKUP_PATH/.env" "$APP_DIR/.env"

# Restart application
pm2 restart nodepress

echo "Restore complete!"

# ═══════════════════════════════════════════════════════════════
# AUTOMATED BACKUP CRON
# ═══════════════════════════════════════════════════════════════

# Edit crontab
crontab -e

# Add daily backup at 3 AM
# 0 3 * * * /var/www/WordPress-Node/scripts/full-backup.sh >> /var/log/nodepress-backup.log 2>&1

# Add weekly cleanup (remove backups older than 30 days)
# 0 4 * * 0 find /var/www/WordPress-Node/backups -mtime +30 -type d -exec rm -rf {} \;
```

### 15.13 Scaling & Performance

```bash
# ═══════════════════════════════════════════════════════════════
# PM2 CLUSTER MODE
# ═══════════════════════════════════════════════════════════════

# Start with all CPU cores
pm2 start dist/main.js -i max --name nodepress

# Start with specific number of instances
pm2 start dist/main.js -i 4 --name nodepress

# Scale up
pm2 scale nodepress +2

# Scale down
pm2 scale nodepress 2

# Zero-downtime reload
pm2 reload nodepress

# ═══════════════════════════════════════════════════════════════
# ECOSYSTEM FILE FOR SCALING
# ═══════════════════════════════════════════════════════════════

# ecosystem.config.js
# module.exports = {
#   apps: [{
#     name: 'nodepress',
#     script: 'dist/main.js',
#     instances: 'max',
#     exec_mode: 'cluster',
#     max_memory_restart: '500M',
#     env: {
#       NODE_ENV: 'production',
#       PORT: 3000
#     }
#   }]
# };

# Start with ecosystem file
pm2 start ecosystem.config.js

# ═══════════════════════════════════════════════════════════════
# PERFORMANCE MONITORING
# ═══════════════════════════════════════════════════════════════

# Real-time monitoring
pm2 monit

# Memory usage
free -h

# CPU usage
top
htop

# Disk I/O
iostat -x 1

# Network connections
ss -s

# ═══════════════════════════════════════════════════════════════
# POSTGRESQL PERFORMANCE
# ═══════════════════════════════════════════════════════════════

# Check slow queries (requires pg_stat_statements extension)
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

# Check table bloat
SELECT
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Vacuum tables (reclaim space)
VACUUM ANALYZE;

# ═══════════════════════════════════════════════════════════════
# NGINX PERFORMANCE
# ═══════════════════════════════════════════════════════════════

# Enable gzip (in nginx.conf)
# gzip on;
# gzip_types text/plain text/css application/json application/javascript;
# gzip_min_length 1000;

# Enable caching for static files
# location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
#     expires 30d;
#     add_header Cache-Control "public, immutable";
# }
```

### 15.14 Security Hardening

```bash
# ═══════════════════════════════════════════════════════════════
# FIREWALL (UFW)
# ═══════════════════════════════════════════════════════════════

# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status verbose

# Deny specific IP
sudo ufw deny from 1.2.3.4

# ═══════════════════════════════════════════════════════════════
# SSH SECURITY
# ═══════════════════════════════════════════════════════════════

# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
# MaxAuthTries 3

# Restart SSH
sudo systemctl restart sshd

# ═══════════════════════════════════════════════════════════════
# FAIL2BAN (Brute force protection)
# ═══════════════════════════════════════════════════════════════

# Install
sudo apt install fail2ban

# Start
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status

# Check SSH jail
sudo fail2ban-client status sshd

# Unban IP
sudo fail2ban-client set sshd unbanip 1.2.3.4

# ═══════════════════════════════════════════════════════════════
# FILE PERMISSIONS
# ═══════════════════════════════════════════════════════════════

# Secure .env file
chmod 600 /var/www/WordPress-Node/.env

# Secure private keys
chmod 600 ~/.ssh/id_rsa

# Set proper ownership
chown -R www-data:www-data /var/www/WordPress-Node/uploads
```

### 15.15 Troubleshooting Quick Reference

```bash
# ═══════════════════════════════════════════════════════════════
# APPLICATION NOT STARTING
# ═══════════════════════════════════════════════════════════════

# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs nodepress --lines 100

# Check if port is in use
lsof -i :3000

# Kill process on port
kill $(lsof -t -i:3000)

# Check Node.js version
node --version

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build

# ═══════════════════════════════════════════════════════════════
# DATABASE ISSUES
# ═══════════════════════════════════════════════════════════════

# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -50 /var/log/postgresql/postgresql-16-main.log

# Test connection
PGPASSWORD=password psql -h localhost -U wpnode -d wordpress_node -c "SELECT 1"

# Regenerate Prisma client
npx prisma generate

# ═══════════════════════════════════════════════════════════════
# NGINX ISSUES
# ═══════════════════════════════════════════════════════════════

# Test config
sudo nginx -t

# Check error log
sudo tail -50 /var/log/nginx/error.log

# Check if running
sudo systemctl status nginx

# ═══════════════════════════════════════════════════════════════
# SSL ISSUES
# ═══════════════════════════════════════════════════════════════

# Check certificate expiry
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check SSL with openssl
openssl s_client -connect nodepress.co.uk:443 -servername nodepress.co.uk

# ═══════════════════════════════════════════════════════════════
# DISK SPACE ISSUES
# ═══════════════════════════════════════════════════════════════

# Check disk usage
df -h

# Find large files
find / -type f -size +100M 2>/dev/null | head -20

# Clean PM2 logs
pm2 flush

# Clean npm cache
npm cache clean --force

# Clean old journals
sudo journalctl --vacuum-size=100M

# ═══════════════════════════════════════════════════════════════
# MEMORY ISSUES
# ═══════════════════════════════════════════════════════════════

# Check memory
free -h

# Find memory-hungry processes
ps aux --sort=-%mem | head -10

# Restart PM2 to free memory
pm2 restart all

# Clear Redis cache
redis-cli FLUSHDB
```

---

## 16. Demo System

NodePress includes a complete demo hosting system for letting potential clients try the platform before purchasing. The demo system creates isolated, time-limited instances with all features enabled.

### 16.1 Demo System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    DEMO HOSTING SERVER                            │
│                    (demo.nodepress.io)                            │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   Main App      │  │  Orchestrator   │  │   Cleanup       │   │
│  │   (NestJS)      │  │   Service       │  │   Service       │   │
│  │                 │  │                 │  │                 │   │
│  │  • /try-demo    │  │  • Provision    │  │  • Expire demos │   │
│  │  • /api/demos   │  │  • Start/Stop   │  │  • Drop DBs     │   │
│  │  • Analytics    │  │  • Health check │  │  • Clean orphans│   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              Demo Instances (Docker Containers)            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ demo-abc │  │ demo-def │  │ demo-ghi │  │   ...    │   │   │
│  │  │ :4001    │  │ :4002    │  │ :4003    │  │          │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 16.2 Demo Components

| Component | Location | Description |
|-----------|----------|-------------|
| Demo Module | `src/modules/demo/` | Demo API, provisioning, notifications |
| Demo Controller | `src/modules/demo/demo.controller.ts` | REST endpoints for demo management |
| Demo Service | `src/modules/demo/demo.service.ts` | Business logic for demos |
| Provisioning Service | `src/modules/demo/demo-provisioning.service.ts` | Container/database provisioning |
| Notification Service | `src/modules/demo/demo-notification.service.ts` | Email notifications |
| Sample Data Seeder | `src/modules/demo/sample-data-seeder.service.ts` | Populate demo with sample content |
| Docker Orchestrator | `docker/demo/orchestrator/` | Container orchestration |
| Cleanup Service | `docker/demo/cleanup/` | Expired demo cleanup |
| Try Demo Page | `themes/default/templates/try-demo.hbs` | Demo request landing page |
| Floating Widget | `themes/default/templates/footer.hbs` | "Try Demo" floating button |
| Analytics Tracker | `public/demo-tracker.js` | Feature usage tracking |

### 16.3 Demo API Endpoints

**Public Endpoints:**
```typescript
POST /api/demos/request          // Request a new demo
POST /api/demos/access           // Access an existing demo
POST /api/demos/upgrade          // Request upgrade from demo
POST /api/demos/track            // Track feature usage
```

**Admin Endpoints (require ADMIN role):**
```typescript
GET    /api/demos                // List all demos (paginated)
GET    /api/demos/analytics      // Demo analytics & metrics
GET    /api/demos/:id            // Get demo details
POST   /api/demos/:id/extend     // Extend demo expiration
DELETE /api/demos/:id            // Terminate a demo
```

### 16.4 Demo Request Flow

1. **User visits `/try-demo`** - Fills out name, email, optional company
2. **API creates demo** - `POST /api/demos/request`
3. **Provisioning service**:
   - Creates isolated database
   - Spins up Docker container
   - Seeds sample data (posts, products, courses)
   - Generates unique subdomain
4. **Email sent** - Welcome email with credentials and links
5. **User accesses demo** - Full NodePress with all features
6. **Auto-expiration** - Demo terminates after 24-72 hours
7. **Cleanup service** - Removes database, container, and files

### 16.5 Demo Email Notifications

| Template | Trigger | Description |
|----------|---------|-------------|
| `demo-welcome` | Demo created | Welcome email with credentials |
| `demo-expiring` | 2 hours before expiry | Warning notification |
| `demo-expired` | Demo expired | Follow-up with upgrade CTA |
| `demo-extension` | Demo extended | Confirmation email |
| `feature-usage-report` | Weekly | Admin report on demo activity |
| `admin-notification` | Various | Admin alerts for upgrades, issues |

### 16.6 Running the Demo System

```bash
# Start with Docker Compose (includes orchestrator + cleanup)
cd docker/demo
docker-compose up -d

# Or run components separately
node docker/demo/orchestrator/index.js  # Provisioning service
node docker/demo/cleanup/index.js       # Cleanup service
```

### 16.7 Demo Configuration

Add to `.env`:
```env
# Demo System
DEMO_ENABLED=true
DEMO_DURATION_HOURS=24
DEMO_MAX_CONCURRENT=50
DEMO_BASE_URL=https://demo.nodepress.io
DEMO_ADMIN_EMAIL=admin@nodepress.io

# Demo Database
DEMO_DB_HOST=localhost
DEMO_DB_PORT=5432
DEMO_DB_USER=demo_admin
DEMO_DB_PASSWORD=secure_password

# Demo Container
DEMO_CONTAINER_IMAGE=nodepress:latest
DEMO_PORT_RANGE_START=4001
DEMO_PORT_RANGE_END=4100
```

---

## 17. Client Deployment

When deploying NodePress to a client's production server, they should receive the complete CMS platform **without** any demo hosting infrastructure.

### 17.1 Build for Client Deployment

```bash
# Build client-ready package (excludes demo infrastructure)
npm run build:client
```

This creates a `dist-client/` folder ready for deployment.

### 17.2 What's Included vs Excluded

**✅ INCLUDED (Full NodePress CMS):**
| Feature | Included |
|---------|----------|
| Posts, Pages, Media | ✅ |
| LMS (courses, quizzes, certificates) | ✅ |
| eCommerce (products, orders, shipping) | ✅ |
| AI Theme Generator | ✅ |
| Theme Designer & Customizer | ✅ |
| User Management & Roles | ✅ |
| SEO & Analytics | ✅ |
| Email System | ✅ |
| Security Features | ✅ |
| Messaging & Video Calls | ✅ |
| Developer Marketplace | ✅ |
| Plugin System | ✅ |
| Admin Panel | ✅ |
| All 21 Theme Presets | ✅ |

**❌ EXCLUDED (Demo Infrastructure):**
| Item | Excluded |
|------|----------|
| `docker/demo/` | ✅ Demo orchestration |
| `src/modules/demo/` | ✅ Demo API & services |
| `themes/*/templates/try-demo.hbs` | ✅ Demo request page |
| `public/demo-tracker.js` | ✅ Analytics tracker |
| Floating demo widget | ✅ Stripped from footer |
| "Try Free Demo" buttons | ✅ Replaced with "Get Started" |

### 17.3 Client Build Output Structure

```
dist-client/
├── dist/                    # Compiled backend (NO demo module)
├── admin/dist/              # Built admin React app
├── themes/                  # Themes (NO demo widget, NO try-demo.hbs)
├── prisma/                  # Database schema & migrations
├── package.json             # Production dependencies only
├── Dockerfile               # Production Docker config
├── docker-compose.yml       # Production compose file
├── install.sh               # Linux/Mac install script
├── install.bat              # Windows install script
└── .env.example             # Configuration template
```

### 17.4 Client Installation Steps

**Option 1: Manual Installation**

```bash
# On your development machine
npm run build:client

# Copy to client server
scp -r dist-client/* user@client-server:/opt/nodepress/

# SSH into client server
ssh user@client-server
cd /opt/nodepress

# Run installation
./install.sh

# Configure environment
nano .env

# Run database migrations
npx prisma migrate deploy

# Start the application
npm start
```

**Option 2: Docker Installation**

```bash
# Copy dist-client to server, then:
cd /opt/nodepress
docker-compose up -d
```

### 17.5 Client Environment Configuration

The client should configure `.env` with these essential settings:

```env
# ===========================================
# REQUIRED SETTINGS
# ===========================================

# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/nodepress"

# JWT secret key (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# ===========================================
# RECOMMENDED SETTINGS
# ===========================================

# Server settings
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Site settings
SITE_URL=https://client-domain.com
SITE_NAME="Client Site Name"

# Redis (for caching and queues)
REDIS_URL=redis://localhost:6379

# ===========================================
# OPTIONAL INTEGRATIONS
# ===========================================

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM="Site Name <noreply@client-domain.com>"

# Stripe (for payments)
# STRIPE_SECRET_KEY=sk_live_xxx
# STRIPE_WEBHOOK_SECRET=whsec_xxx

# OpenAI (for AI features)
# OPENAI_API_KEY=sk-xxx

# Storage (S3/R2)
# STORAGE_PROVIDER=s3
# AWS_ACCESS_KEY_ID=xxx
# AWS_SECRET_ACCESS_KEY=xxx
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=bucket-name
```

### 17.6 Deployment Checklist

Before deploying to a client:

- [ ] Run `npm run build:client` to create clean build
- [ ] Verify `dist-client/` contains no demo files
- [ ] Test the build locally with a fresh database
- [ ] Prepare client-specific `.env` configuration
- [ ] Set up SSL certificate (Let's Encrypt recommended)
- [ ] Configure reverse proxy (Nginx/Caddy)
- [ ] Set up automated backups
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Set up PM2 or systemd for process management
- [ ] Test all features after deployment

### 17.7 Production Nginx Configuration

```nginx
server {
    listen 80;
    server_name client-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name client-domain.com;

    ssl_certificate /etc/letsencrypt/live/client-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/client-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Static files
    location /uploads/ {
        alias /opt/nodepress/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /themes/ {
        alias /opt/nodepress/themes/;
        expires 7d;
    }

    # Proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 17.8 PM2 Process Management

```bash
# Install PM2
npm install -g pm2

# Start NodePress
pm2 start dist/main.js --name nodepress

# Auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit

# View logs
pm2 logs nodepress
```

### 17.9 Comparison: Demo Server vs Client Server

| Aspect | Demo Server | Client Server |
|--------|-------------|---------------|
| Purpose | Try before buy | Production site |
| Demo module | ✅ Included | ❌ Excluded |
| `/try-demo` page | ✅ Available | ❌ Not available |
| Floating widget | ✅ Shows on all pages | ❌ Removed |
| Docker orchestrator | ✅ Running | ❌ Not included |
| Multi-tenant | ✅ Many demos | ❌ Single instance |
| Build command | `npm run build` | `npm run build:client` |

---

## 📚 Additional Resources

- **GitHub Repository:** https://github.com/syntex82/NodePress
- **Local Development Guide:** [./LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md)
- **API Documentation:** See README.md API section
- **NestJS Documentation:** https://docs.nestjs.com
- **Prisma Documentation:** https://www.prisma.io/docs
- **React Documentation:** https://react.dev

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feature/my-feature`
7. Create a Pull Request

---

**Happy coding with NodePress! 🚀**
```

