FROM node:18-alpine

WORKDIR /app

# Install dependencies for Prisma and SSL
RUN apk add --no-cache \
  libc6-compat \
  openssl

# Copy package files AND prisma schema first
COPY package*.json ./
COPY prisma ./prisma/
COPY shopify.app*.toml ./

# Install all dependencies (don't omit dev since we need them for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

# Start the app with setup (migrations) and start
CMD npm run setup && npm run start