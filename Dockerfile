FROM node:18-alpine

WORKDIR /app

# Install dependencies for Prisma, SSL, and git (needed for shopify CLI)
RUN apk add --no-cache \
  libc6-compat \
  openssl \
  git

# Install Shopify CLI
RUN npm install -g @shopify/cli @shopify/app

# Copy package files AND prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Copy TOML files for Shopify configuration
COPY shopify.app*.toml ./

# Install all dependencies (don't omit dev since we need them for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the app and deploy to Shopify
RUN npm run build && shopify app deploy

EXPOSE 8080

# Start the app with setup (migrations) and start
CMD npm run setup && npm run start