FROM node:20-alpine

WORKDIR /app

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

# Create uploads and data directories
RUN mkdir -p uploads data

# Expose port
EXPOSE 3000

# Start application from compiled output
CMD ["node", "dist/server.js"]
