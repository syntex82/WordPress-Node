# WordPress Node CMS - Production Dockerfile
# Multi-stage build for optimized image size

# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Build admin panel
WORKDIR /app/admin
COPY admin/package*.json ./
RUN npm ci
COPY admin/ .
RUN npm run build

# Stage 2: Production image
FROM node:20-slim AS production

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/admin/dist ./admin/dist
COPY --from=builder /app/themes ./themes

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node /app

# Use non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/ping || exit 1

# Start script: run migrations then start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

