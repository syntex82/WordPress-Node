# Development Guide

This guide covers development workflows, architecture decisions, and best practices for WordPress Node.

## Project Architecture

### Backend (NestJS)

```
src/
├── modules/              # Feature modules
│   ├── auth/            # Authentication & JWT
│   ├── users/           # User management
│   ├── content/         # Posts, Pages, Content Types
│   ├── media/           # Media library
│   ├── themes/          # Theme system
│   ├── plugins/         # Plugin system
│   ├── settings/        # Site settings
│   └── public/          # Public routes
├── common/              # Shared utilities
│   ├── decorators/      # Custom decorators
│   ├── guards/          # Auth guards
│   └── filters/         # Exception filters
├── database/            # Prisma service
├── main.ts              # Application entry
└── app.module.ts        # Root module
```

### Frontend (React + Vite)

```
admin/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── stores/          # Zustand stores
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── index.html
└── vite.config.ts
```

## Key Design Decisions

### Why NestJS over Express?

- **Modular architecture**: Better code organization for large applications
- **Dependency injection**: Easier testing and maintainability
- **TypeScript-first**: Better type safety and developer experience
- **Built-in features**: Guards, interceptors, pipes, filters
- **Scalability**: Easier to scale and maintain

### Why Prisma over TypeORM?

- **Better TypeScript support**: Auto-generated types
- **Cleaner schema definition**: More readable and maintainable
- **Better migrations**: More reliable migration system
- **Type safety**: Compile-time type checking
- **Developer experience**: Prisma Studio for database inspection

### Why Vite for Admin Panel?

- **Fast development**: Hot module replacement
- **Modern tooling**: ESBuild for fast builds
- **Simple configuration**: Less boilerplate
- **No SSR needed**: Admin panel doesn't need server-side rendering

### Why Handlebars for Themes?

- **Server-side rendering**: Better SEO for public pages
- **Familiar syntax**: Similar to WordPress themes
- **Logic-less templates**: Separation of concerns
- **Extensible**: Custom helpers for common tasks

## Development Workflows

### Adding a New API Endpoint

1. **Create DTO** (if needed):
```typescript
// src/modules/content/dto/create-post.dto.ts
export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  content: string;
}
```

2. **Add service method**:
```typescript
// src/modules/content/services/posts.service.ts
async create(data: CreatePostDto, authorId: string) {
  return this.prisma.post.create({
    data: { ...data, authorId },
  });
}
```

3. **Add controller endpoint**:
```typescript
// src/modules/content/controllers/posts.controller.ts
@Post()
@UseGuards(JwtAuthGuard)
async create(@Body() dto: CreatePostDto, @CurrentUser() user) {
  return this.postsService.create(dto, user.id);
}
```

### Adding a New Database Model

1. **Update Prisma schema**:
```prisma
model Comment {
  id        String   @id @default(uuid())
  content   String
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  createdAt DateTime @default(now())
}
```

2. **Generate migration**:
```bash
pnpm db:migrate
```

3. **Create service and controller** following the patterns above

### Creating a Custom Theme

See [README.md](./README.md#-creating-a-theme) for detailed instructions.

Quick example:

```
themes/my-theme/
├── theme.json
└── templates/
    ├── home.hbs
    ├── single-post.hbs
    ├── single-page.hbs
    └── archive.hbs
```

### Creating a Custom Plugin

See [README.md](./README.md#-creating-a-plugin) for detailed instructions.

Quick example:

```javascript
// plugins/my-plugin/index.js
module.exports = {
  onActivate: async () => {
    console.log('Plugin activated');
  },
  
  beforeSave: async (data) => {
    // Modify data before saving
    return data;
  },
};
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

### Writing Tests

```typescript
describe('PostsService', () => {
  let service: PostsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PostsService, PrismaService],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a post', async () => {
    const dto = { title: 'Test', content: 'Content' };
    const result = await service.create(dto, 'user-id');
    expect(result.title).toBe('Test');
  });
});
```

## Database Management

### Creating Migrations

```bash
# Create a new migration
pnpm db:migrate

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Deploy migrations to production
pnpm db:migrate:prod
```

### Seeding Data

Edit `prisma/seed.ts` and run:

```bash
pnpm db:seed
```

### Inspecting Database

```bash
pnpm db:studio
```

## Code Style

### TypeScript

- Use strict mode
- Prefer interfaces over types for objects
- Use enums for fixed sets of values
- Always type function parameters and return values

### Naming Conventions

- **Files**: kebab-case (e.g., `posts.service.ts`)
- **Classes**: PascalCase (e.g., `PostsService`)
- **Functions**: camelCase (e.g., `createPost`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

### Formatting

```bash
# Format code
pnpm format

# Lint code
pnpm lint
```

## Performance Optimization

### Database Queries

- Use `select` to fetch only needed fields
- Use `include` carefully to avoid N+1 queries
- Add indexes for frequently queried fields
- Use pagination for large datasets

### Caching

Consider adding Redis for:
- Session storage
- API response caching
- Theme/plugin metadata caching

## Security Best Practices

1. **Never commit secrets** - Use .env files
2. **Validate all inputs** - Use DTOs with class-validator
3. **Use parameterized queries** - Prisma handles this
4. **Implement rate limiting** - Add @nestjs/throttler
5. **Use HTTPS in production** - Configure reverse proxy
6. **Keep dependencies updated** - Run `pnpm update` regularly

## Deployment

### Environment Variables

Ensure these are set in production:

```env
NODE_ENV=production
DATABASE_URL=<production-database-url>
JWT_SECRET=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>
```

### Build Process

```bash
# Build backend
pnpm build

# Build admin panel
pnpm admin:build

# Run migrations
pnpm db:migrate:prod

# Start server
pnpm start:prod
```

### Recommended Hosting

- **Backend**: Railway, Render, DigitalOcean, AWS
- **Database**: Railway, Supabase, AWS RDS
- **Static files**: S3, Cloudflare R2

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

