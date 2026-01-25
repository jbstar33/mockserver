# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Install all dependencies (frontend + backend)
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/build ./frontend/build

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start command with file listing for debugging
CMD ["sh", "-c", "ls -la /app && ls -R /app/backend && node backend/index.js"]
