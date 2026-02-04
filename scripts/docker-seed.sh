#!/bin/bash

# Seed production database in Docker
# ===================================

set -e

echo "🌱 Seeding production database..."
echo ""

# Check if backend container is running
if ! docker ps | grep -q dogparkpals-backend; then
    echo "❌ Backend container is not running!"
    echo "   Start it with: docker-compose up -d"
    exit 1
fi

# Run seed script inside container
docker exec -it dogparkpals-backend sh -c "cd /app && npx ts-node prisma/seedProduction.ts"

echo ""
echo "✅ Database seeded successfully!"
