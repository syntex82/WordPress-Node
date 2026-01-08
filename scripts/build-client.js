#!/usr/bin/env node
/**
 * NodePress Client Build Script
 * 
 * Creates a clean production build for client installation.
 * Excludes demo hosting infrastructure (orchestrator, cleanup, demo API, etc.)
 * 
 * Usage: node scripts/build-client.js [--output dist-client]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const outputDir = args.includes('--output') 
  ? args[args.indexOf('--output') + 1] 
  : 'dist-client';

// Files and directories to EXCLUDE from client builds
const EXCLUDE_PATTERNS = [
  // Demo hosting infrastructure
  'docker/demo/',
  'src/modules/demo/',
  'themes/default/templates/try-demo.hbs',
  'public/demo-tracker.js',

  // Test files
  '**/*.spec.ts',
  '**/*.test.ts',
  '**/__tests__/',

  // Development files
  '.github/',
  'examples/',
  '.env.example',
  'jest.config.js',

  // Demo-specific templates
  'src/modules/demo/templates/',
];

// Files to INCLUDE (override exclusions)
const INCLUDE_PATTERNS = [
  // Keep demo-mode middleware for when clients run their own demos
  'src/modules/demo/middleware/demo-mode.middleware.ts',
];

console.log('🚀 NodePress Client Build');
console.log('========================\n');

async function build() {
  try {
    // Step 1: Clean output directory
    console.log(`📁 Preparing output directory: ${outputDir}`);
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // Step 2: Build TypeScript
    console.log('📦 Building TypeScript...');
    execSync('npx tsc --project tsconfig.build.json', { stdio: 'inherit' });

    // Step 3: Build admin panel
    console.log('🎨 Building admin panel...');
    execSync('cd admin && npm run build', { stdio: 'inherit' });

    // Step 4: Copy necessary files
    console.log('📋 Copying production files...');
    
    const filesToCopy = [
      { src: 'dist', dest: `${outputDir}/dist` },
      { src: 'admin/dist', dest: `${outputDir}/admin/dist` },
      { src: 'themes', dest: `${outputDir}/themes`, exclude: ['try-demo.hbs'] },
      { src: 'prisma', dest: `${outputDir}/prisma` },
      { src: 'package.json', dest: `${outputDir}/package.json` },
      { src: 'package-lock.json', dest: `${outputDir}/package-lock.json` },
    ];

    for (const item of filesToCopy) {
      if (fs.existsSync(item.src)) {
        copyRecursive(item.src, item.dest, item.exclude || []);
      }
    }

    // Step 5: Create production package.json (remove dev dependencies)
    console.log('📝 Creating production package.json...');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    delete pkg.devDependencies;
    delete pkg.scripts.test;
    delete pkg.scripts['test:watch'];
    delete pkg.scripts['test:cov'];
    pkg.scripts.start = 'node dist/main.js';
    fs.writeFileSync(`${outputDir}/package.json`, JSON.stringify(pkg, null, 2));

    // Step 6: Remove demo module from dist
    console.log('🧹 Removing demo hosting files...');
    const demoDistPath = path.join(outputDir, 'dist/modules/demo');
    if (fs.existsSync(demoDistPath)) {
      // Keep only middleware subdirectory
      const files = fs.readdirSync(demoDistPath);
      for (const file of files) {
        if (file !== 'middleware') {
          const filePath = path.join(demoDistPath, file);
          fs.rmSync(filePath, { recursive: true });
        }
      }
    }

    // Step 6b: Remove demo widget and try-demo links from templates
    console.log('🧹 Removing demo elements from templates...');
    stripDemoFromTemplates(outputDir)

    // Step 7: Create installation script
    console.log('📜 Creating installation script...');
    createInstallScript(outputDir);

    // Step 8: Create Docker files for production
    console.log('🐳 Creating Docker configuration...');
    createDockerFiles(outputDir);

    // Step 9: Create .env.example for clients
    createEnvExample(outputDir);

    console.log('\n✅ Client build complete!');
    console.log(`\n📂 Output: ${path.resolve(outputDir)}`);
    console.log('\nTo install on client server:');
    console.log(`  1. Copy ${outputDir}/ to client server`);
    console.log('  2. Run: ./install.sh (or install.bat on Windows)');
    console.log('  3. Configure .env file');
    console.log('  4. Run: npm start');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

function copyRecursive(src, dest, exclude = []) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
      if (!exclude.includes(file) && !EXCLUDE_PATTERNS.some(p => 
        path.join(src, file).includes(p.replace('**/', ''))
      )) {
        copyRecursive(path.join(src, file), path.join(dest, file), exclude);
      }
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function createInstallScript(outputDir) {
  // Bash script for Linux/Mac
  const bashScript = `#!/bin/bash
# NodePress Installation Script

echo "🚀 Installing NodePress CMS..."

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ is required. Please install Node.js first."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Setup environment
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Created .env file - please configure it before starting"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Configure your .env file with database and other settings"
echo "  2. Run database migrations: npx prisma migrate deploy"
echo "  3. Start the server: npm start"
echo ""
`;

  // Windows batch script
  const batScript = `@echo off
REM NodePress Installation Script for Windows

echo 🚀 Installing NodePress CMS...

REM Install dependencies
echo 📦 Installing dependencies...
call npm ci --production

REM Setup environment
if not exist .env (
  copy .env.example .env
  echo 📝 Created .env file - please configure it before starting
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
call npx prisma generate

echo.
echo ✅ Installation complete!
echo.
echo Next steps:
echo   1. Configure your .env file with database and other settings
echo   2. Run database migrations: npx prisma migrate deploy
echo   3. Start the server: npm start
echo.
`;

  fs.writeFileSync(path.join(outputDir, 'install.sh'), bashScript);
  fs.writeFileSync(path.join(outputDir, 'install.bat'), batScript);
  
  // Make bash script executable
  if (process.platform !== 'win32') {
    fs.chmodSync(path.join(outputDir, 'install.sh'), '755');
  }
}

function createDockerFiles(outputDir) {
  const dockerfile = `# NodePress Production Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies
RUN npm ci --production

# Generate Prisma client
RUN npx prisma generate

# Copy application files
COPY dist ./dist
COPY admin/dist ./admin/dist
COPY themes ./themes

# Create uploads directory
RUN mkdir -p uploads

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]
`;

  const dockerCompose = `version: '3.8'

services:
  nodepress:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://nodepress:password@postgres:5432/nodepress
      - JWT_SECRET=\${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=nodepress
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=nodepress
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  uploads:
  postgres_data:
  redis_data:
`;

  fs.writeFileSync(path.join(outputDir, 'Dockerfile'), dockerfile);
  fs.writeFileSync(path.join(outputDir, 'docker-compose.yml'), dockerCompose);
}

function stripDemoFromTemplates(outputDir) {
  const themesDir = path.join(outputDir, 'themes');

  // Process all .hbs files in themes
  function processDir(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        processDir(itemPath);
      } else if (item.endsWith('.hbs')) {
        let content = fs.readFileSync(itemPath, 'utf8');
        let modified = false;

        // Remove floating demo widget from footer (between <!-- Floating Demo Widget --> and closing {{/unless}})
        const demoWidgetPattern = /<!-- Floating Demo Widget -->[\s\S]*?{{\/unless}}\s*{{\/unless}}/g;
        if (demoWidgetPattern.test(content)) {
          content = content.replace(demoWidgetPattern, '');
          modified = true;
        }

        // Replace "Try Free Demo" button with "Get Started" button linking to /register
        const tryDemoPattern = /<a href="\/try-demo"[^>]*>[\s\S]*?Try Free Demo[\s\S]*?<\/a>/g;
        if (tryDemoPattern.test(content)) {
          content = content.replace(tryDemoPattern,
            '<a href="/register" class="wp-btn wp-btn-primary">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z"/></svg>' +
            'Get Started</a>');
          modified = true;
        }

        // Remove any remaining /try-demo links
        if (content.includes('/try-demo')) {
          content = content.replace(/\/try-demo/g, '/register');
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(itemPath, content);
          console.log(`   ✓ Cleaned: ${path.relative(outputDir, itemPath)}`);
        }
      }
    }
  }

  processDir(themesDir);
}

function createEnvExample(outputDir) {
  const envExample = `# NodePress Configuration
# Copy this file to .env and configure for your environment

# ===========================================
# REQUIRED SETTINGS
# ===========================================

# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/nodepress"

# JWT secret key (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# ===========================================
# OPTIONAL SETTINGS
# ===========================================

# Server settings
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Site settings
SITE_URL=https://your-domain.com
SITE_NAME="Your Site Name"

# Redis (for caching and queues)
REDIS_URL=redis://localhost:6379

# Email settings (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM="NodePress <noreply@your-domain.com>"

# Storage (local or s3)
STORAGE_PROVIDER=local
# For S3:
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=your-bucket-name

# Stripe (for payments)
# STRIPE_SECRET_KEY=sk_live_xxx
# STRIPE_WEBHOOK_SECRET=whsec_xxx

# OpenAI (for AI features)
# OPENAI_API_KEY=sk-xxx

# Security
# ENABLE_RATE_LIMITING=true
# CORS_ORIGINS=https://your-domain.com
`;

  fs.writeFileSync(path.join(outputDir, '.env.example'), envExample);
}

build();

