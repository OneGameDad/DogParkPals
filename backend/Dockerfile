FROM node:20-alpine

WORKDIR /app

# SSL/TLS Certificates Configuration
# Certificates should be mounted via Docker volumes:
#   -v ./certs:/app/certs
# Expected files:
#   - /app/certs/server.crt (certificate file)
#   - /app/certs/server.key (private key file)
# Or specify paths via environment variables:
#   - CERT_PATH=/app/certs/server.crt
#   - KEY_PATH=/app/certs/server.key

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client and build TypeScript
RUN npx prisma generate
RUN npm run build

# Create uploads, data, and certificates directories
RUN mkdir -p uploads data certs

# Expose HTTPS port
EXPOSE 3000

# Start application from compiled output
CMD ["node", "dist/server.js"]
