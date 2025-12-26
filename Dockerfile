# WordPress Node CMS - Production Dockerfile
# Multi-stage build for optimized image size

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production=false

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
FROM node:20-alpine AS production

# Install OpenSSL 1.1 compatibility for Prisma
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
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

# Start the application
CMD ["node", "dist/main.js"]

