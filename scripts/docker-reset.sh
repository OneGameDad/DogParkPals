#!/bin/bash

# Reset Docker environment
# ========================

set -e

echo "⚠️  This will stop all containers and remove volumes (including database)"
read -p "Are you sure? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🛑 Stopping containers..."
docker compose down -v

echo ""
echo "🗑️  Removing images..."
docker compose rm -f

echo ""
echo "✅ Docker environment reset complete!"
echo ""
echo "To start fresh, run: ./scripts/docker-setup.sh"
