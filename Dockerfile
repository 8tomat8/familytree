# Use the official Node.js 20 image
FROM node:20-alpine AS base

# Install system dependencies required for canvas
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    python3 \
    make \
    g++

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage
FROM base AS dev-deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy all dependencies
COPY --from=dev-deps /app/node_modules ./node_modules
# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 
