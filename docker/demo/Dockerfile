# NodePress Demo Instance Dockerfile
# Optimized for quick startup and minimal resource usage

FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
FROM base AS deps
RUN pnpm install --frozen-lockfile --prod

# Build stage
FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Generate Prisma client
RUN npx prisma generate

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodepress

# Copy necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./

# Create directories for demo data
RUN mkdir -p /app/uploads /app/themes /app/logs && \
    chown -R nodepress:nodejs /app

# Switch to non-root user
USER nodepress

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV DEMO_MODE=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]

