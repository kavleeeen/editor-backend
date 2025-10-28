# syntax=docker/dockerfile:1

# ----------- Build stage -----------
FROM node:18-slim AS builder
WORKDIR /app

# Install build deps
COPY package*.json ./
RUN npm ci --omit=dev=false

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ----------- Runtime stage -----------
FROM node:18-slim AS runner
WORKDIR /app

# Install CA certificates for TLS connections (e.g., MongoDB Atlas)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && update-ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app and runtime files
COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT env var
ENV NODE_ENV=production
ENV PORT=8080

# Use non-root user for security
RUN useradd -u 1001 -m nodeuser
USER 1001

EXPOSE 8080
CMD ["node", "dist/index.js"]


