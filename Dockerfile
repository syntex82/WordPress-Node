# WordPress Node CMS - Production Dockerfile
FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates wget && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Build admin panel
WORKDIR /app/admin
RUN npm ci && npm run build

# Back to app directory
WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node /app

# Use non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/ping || exit 1

# Start: run migrations then start app
CMD ["sh", "-c", "echo 'Running migrations...' && npx prisma migrate deploy --schema=./prisma/schema.prisma && echo 'Migrations complete. Starting app...' && node dist/main.js"]

