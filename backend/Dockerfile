# Builder Stage
FROM node:18-slim AS builder
WORKDIR /app

# Install OpenSSL 3 and wget (healthcheck dependency)
RUN apt-get update && apt-get install -y openssl libssl3 wget && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

# Production Stage
FROM node:18-slim
WORKDIR /app

# Install OpenSSL 3 and wget (healthcheck dependency)
RUN apt-get update && apt-get install -y openssl libssl3 wget && rm -rf /var/lib/apt/lists/*

# Copy package files and install production dependencies
COPY package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
