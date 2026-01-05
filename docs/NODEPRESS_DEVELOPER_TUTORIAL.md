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

