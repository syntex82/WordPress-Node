# WordPress Node CMS

A self-hosted, WordPress-style CMS platform built with Node.js, TypeScript, and NestJS. Think of it as "WordPress for Node" with a powerful plugin system, theme system, and modern admin dashboard.

## 🚀 Features

- **Modern Tech Stack**: Built with Node.js, TypeScript, NestJS, PostgreSQL, and React
- **Content Management**: Posts, Pages, and Custom Content Types with rich text editing
- **User Management**: Role-based access control (Admin, Editor, Author, Viewer)
- **Media Library**: Upload and manage images and files with metadata
- **Theme System**: Server-side rendering with Handlebars templates
- **Plugin Architecture**: Extensible plugin system with lifecycle hooks
- **RESTful API**: Full API access for headless CMS usage
- **Admin Dashboard**: Modern React-based admin panel with Tailwind CSS

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 12+
- Git

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd wordpress-node
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and configure your database connection and other settings:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wordpress_node?schema=public"
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### 4. Set up the database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed the database with initial data
pnpm db:seed
```

### 5. Start the development server

```bash
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API**: http://localhost:3000/api

### 6. Login to admin panel

Use the credentials from your `.env` file:
- Email: admin@example.com
- Password: admin123

## 📁 Project Structure

```
wordpress-node/
├── src/                          # Backend source code
│   ├── modules/                  # Feature modules
│   │   ├── auth/                # Authentication & JWT
│   │   ├── users/               # User management
│   │   ├── content/             # Posts, Pages, Content Types
│   │   ├── media/               # Media library
│   │   ├── themes/              # Theme system
│   │   ├── plugins/             # Plugin system
│   │   ├── settings/            # Site settings
│   │   └── public/              # Public routes
│   ├── common/                   # Shared utilities
│   ├── database/                 # Prisma service
│   ├── main.ts                   # Application entry
│   └── app.module.ts             # Root module
├── admin/                        # React admin panel (to be built)
├── themes/                       # Theme directory
│   └── default/                 # Default theme
│       ├── theme.json
│       └── templates/
├── plugins/                      # Plugin directory
│   ├── seo/                     # SEO plugin
│   └── analytics/               # Analytics plugin
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma
│   └── seed.ts
└── uploads/                      # Media uploads
```

## 🎨 Creating a Theme

Themes are located in the `themes/` directory. Each theme must have:

### 1. Create theme directory

```bash
mkdir themes/my-theme
```

### 2. Create theme.json

```json
{
  "name": "My Theme",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A custom theme",
  "templates": ["home", "single-post", "single-page", "archive"]
}
```

### 3. Create templates

Create a `templates/` directory with Handlebars (.hbs) files:

- `home.hbs` - Home page template
- `single-post.hbs` - Single post template
- `single-page.hbs` - Single page template
- `archive.hbs` - Blog archive template

### 4. Available template variables

**Home template:**
- `posts` - Array of published posts
- `site.site_name` - Site name
- `site.site_description` - Site description

**Single post template:**
- `post` - Post object with title, content, author, etc.
- `site` - Site settings

**Single page template:**
- `page` - Page object
- `site` - Site settings

### 5. Handlebars helpers

- `{{formatDate date}}` - Format date
- `{{excerpt text length}}` - Create excerpt
- `{{eq a b}}` - Equality check
- `{{ne a b}}` - Inequality check

### 6. Activate your theme

1. Scan themes: `POST /api/themes/scan`
2. Activate: `POST /api/themes/:id/activate`

Or use the admin panel: Settings → Themes

## 🔌 Creating a Plugin

Plugins are located in the `plugins/` directory.

### 1. Create plugin directory

```bash
mkdir plugins/my-plugin
```

### 2. Create plugin.json

```json
{
  "name": "My Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Plugin description",
  "entry": "index.js",
  "hooks": ["onActivate", "beforeSave"]
}
```

### 3. Create index.js

```javascript
module.exports = {
  // Called when plugin is activated
  onActivate: async () => {
    console.log('Plugin activated');
  },

  // Called when plugin is deactivated
  onDeactivate: async () => {
    console.log('Plugin deactivated');
  },

  // Hook: Before saving content
  beforeSave: async (data) => {
    // Modify data before saving
    return data;
  },

  // Hook: After saving content
  afterSave: async (data) => {
    // Perform actions after save
  },

  // Register custom fields
  registerFields: () => {
    return [
      {
        name: 'customField',
        label: 'Custom Field',
        type: 'text',
      },
    ];
  },
};
```

### 4. Available hooks

- `onActivate()` - Called when plugin is activated
- `onDeactivate()` - Called when plugin is deactivated
- `beforeSave(data)` - Called before saving content
- `afterSave(data)` - Called after saving content
- `beforeDelete(id)` - Called before deleting content
- `afterDelete(id)` - Called after deleting content
- `registerFields()` - Register custom fields
- `registerRoutes(app)` - Register custom routes

### 5. Activate your plugin

1. Scan plugins: `POST /api/plugins/scan`
2. Activate: `POST /api/plugins/:id/activate`

Or use the admin panel: Settings → Plugins

## 📡 API Documentation

### Authentication

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Get current user**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Posts

**Get all posts**
```http
GET /api/posts?page=1&limit=10&status=PUBLISHED
```

**Get post by ID**
```http
GET /api/posts/:id
```

**Create post**
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Post",
  "content": "<p>Post content</p>",
  "excerpt": "Short description",
  "status": "DRAFT"
}
```

**Update post**
```http
PATCH /api/posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "PUBLISHED"
}
```

**Delete post**
```http
DELETE /api/posts/:id
Authorization: Bearer <token>
```

### Pages

Similar endpoints to Posts:
- `GET /api/pages`
- `GET /api/pages/:id`
- `POST /api/pages`
- `PATCH /api/pages/:id`
- `DELETE /api/pages/:id`

### Media

**Upload file**
```http
POST /api/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

**Get all media**
```http
GET /api/media?page=1&limit=20
Authorization: Bearer <token>
```

### Users

**Get all users** (Admin/Editor only)
```http
GET /api/users
Authorization: Bearer <token>
```

**Create user** (Admin only)
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name",
  "password": "password123",
  "role": "AUTHOR"
}
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run tests in watch mode
pnpm test:watch
```

## 🏗️ Building for Production

```bash
# Build the backend
pnpm build

# Build the admin panel
pnpm admin:build

# Run migrations in production
pnpm db:migrate:prod

# Start production server
pnpm start:prod
```

## 🔧 Development Scripts

```bash
# Start development server
pnpm dev

# Generate Prisma client
pnpm db:generate

# Create a new migration
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio

# Lint code
pnpm lint

# Format code
pnpm format
```

## 🏛️ Architecture

### Backend Architecture

The backend follows NestJS modular architecture with:

- **Modules**: Feature-based modules (Auth, Users, Content, etc.)
- **Services**: Business logic layer
- **Controllers**: HTTP request handlers
- **Guards**: Authentication and authorization
- **Decorators**: Custom decorators for common patterns
- **Filters**: Exception handling

### Database Schema

- **User**: User accounts with role-based access
- **Post**: Blog posts with SEO fields
- **Page**: Static pages with hierarchy support
- **Media**: Uploaded files with metadata
- **ContentType**: Custom content type definitions
- **Theme**: Installed themes
- **Plugin**: Installed plugins
- **Setting**: Site-wide settings
- **Session**: User sessions
- **PageView**: Analytics data

### Plugin System

Plugins can:
- Hook into lifecycle events (beforeSave, afterSave, etc.)
- Register custom fields
- Register custom routes
- Extend functionality without modifying core code

### Theme System

Themes use Handlebars templates for server-side rendering:
- Separation of presentation and logic
- Template inheritance and partials
- Custom helpers for common tasks
- Easy theme switching

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by WordPress
- Built with NestJS, Prisma, and React
- Uses Handlebars for templating

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Happy coding! 🚀**

