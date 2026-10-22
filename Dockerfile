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

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["npm", "start"]
