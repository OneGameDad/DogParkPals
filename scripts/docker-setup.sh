#!/bin/bash

# DogParkPals Docker Setup Script
# ================================

set -e

echo "🐕 DogParkPals Docker Setup"
echo "=========================="
echo ""

# Generate SSL certificates if they don't exist
if [ ! -f "certs/server.crt" ] || [ ! -f "certs/server.key" ]; then
    echo "🔐 Generating SSL certificates..."
    mkdir -p certs
    cd certs
    
    # Backend server certificate
    openssl req -x509 -newkey rsa:2048 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=localhost/O=DogParkPals/C=US" > /dev/null 2>&1
    
    # Observability services certificates
    openssl req -x509 -newkey rsa:2048 -keyout prometheus.key -out prometheus.crt -days 365 -nodes -subj "/CN=prometheus/O=DogParkPals/C=US" > /dev/null 2>&1
    openssl req -x509 -newkey rsa:2048 -keyout grafana.key -out grafana.crt -days 365 -nodes -subj "/CN=grafana/O=DogParkPals/C=US" > /dev/null 2>&1
    openssl req -x509 -newkey rsa:2048 -keyout elasticsearch.key -out elasticsearch.crt -days 365 -nodes -subj "/CN=elasticsearch/O=DogParkPals/C=US" > /dev/null 2>&1
    openssl req -x509 -newkey rsa:2048 -keyout kibana.key -out kibana.crt -days 365 -nodes -subj "/CN=kibana/O=DogParkPals/C=US" > /dev/null 2>&1
    openssl req -x509 -newkey rsa:2048 -keyout rabbitmq.key -out rabbitmq.crt -days 365 -nodes -subj "/CN=rabbitmq/O=DogParkPals/C=US" > /dev/null 2>&1
    
    cd ..
    echo "✅ SSL certificates generated (backend + observability)"
    echo ""
else
    echo "✅ SSL certificates already exist"
    echo ""
fi

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
echo "  - Backend:  https://localhost:3000"
echo "  - Frontend: https://localhost:5173"
echo ""
echo "Note: You'll see certificate warnings for self-signed certificates"
echo ""
echo "Useful commands:"
echo "  - View logs:     docker compose logs -f"
echo "  - Stop:          docker compose down"
echo "  - Restart:       docker compose restart"
echo "  - Shell access:  docker exec -it dogparkpals-backend sh"
echo ""
