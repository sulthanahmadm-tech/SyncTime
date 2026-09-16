FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for both (using root package.json for workspace-like install)
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm run install:all

# Copy source code
COPY . .

# Build both client and server
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and package files
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/client/dist ./client/dist

# Install production dependencies for server
WORKDIR /app/server
RUN npm install --omit=dev

# SQLite database will be stored in this directory, map this to a volume
VOLUME ["/app/server/db_data"]

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/server/db_data/synctime.db

CMD ["npm", "start"]
