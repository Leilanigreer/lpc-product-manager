FROM node:18-alpine

WORKDIR /app

# Install all required dependencies for Prisma
RUN apk add --no-cache \
  libc6-compat \
  openssl \
  openssl-dev \
  openssl-libs-static \
  ca-certificates

# Copy package files AND prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (don't omit dev since we need them for build)
RUN npm ci

# Generate Prisma Client with explicit OpenSSL configuration
ENV PRISMA_QUERY_ENGINE_LIBRARY=/usr/lib/libquery_engine.so
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

# Start the app with setup (migrations) and start
CMD npm run setup && npm run start