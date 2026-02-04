#!/bin/bash

# DogParkPals Docker Setup Script
# ================================

set -e

echo "🐕 DogParkPals Docker Setup"
echo "=========================="
echo ""

# Check if docker-secrets exists
if [ ! -f "docker-secrets" ]; then
    echo "⚠️  docker-secrets file not found!"
    echo ""
    echo "Creating docker-secrets from example..."
    cp docker-secrets-example docker-secrets
    echo ""
    echo "✅ docker-secrets created"
    echo ""
    echo "⚠️  IMPORTANT: Edit docker-secrets and fill in your actual credentials:"
    echo "   - JWT_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
    echo "   - GOOGLE_CLIENT_ID (if using OAuth)"
    echo "   - GOOGLE_CLIENT_SECRET (if using OAuth)"
    echo ""
    read -p "Press Enter when you've updated docker-secrets..."
fi

# Build and start containers
echo ""
echo "🔨 Building Docker images..."
docker compose build

echo ""
echo "🚀 Starting containers..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Docker setup complete!"
echo ""
echo "Services running:"
echo "  - Backend:  http://localhost:3000"
echo "  - Frontend: http://localhost:5173"
echo ""
echo "Useful commands:"
echo "  - View logs:     docker compose logs -f"
echo "  - Stop:          docker compose down"
echo "  - Restart:       docker compose restart"
echo "  - Shell access:  docker exec -it dogparkpals-backend sh"
echo ""
