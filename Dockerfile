FROM node:18-alpine AS builder

WORKDIR /app

# Build-time API URL for frontend (default: relative /api for same-origin)
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps && npm run build

WORKDIR /app

# Production image
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production --legacy-peer-deps

# Copy built application from builder
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/build ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 5001

ENTRYPOINT ["/sbin/dumb-init", "--"]

CMD ["npm", "start"]
