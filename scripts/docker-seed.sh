#!/bin/bash

# Seed production database in Docker
# ===================================

set -e

echo "🌱 Seeding production database..."
echo ""

# Check if backend container is running
if ! docker ps | grep -q dogparkpals-backend; then
    echo "❌ Backend container is not running!"
    echo "   Start it with: docker compose up -d"
    exit 1
fi

# Run seed script inside container
if [ -t 0 ]; then
    docker exec -it dogparkpals-backend sh -c "cd /app && npx tsx prisma/seedProduction.ts"
else
    docker exec -i dogparkpals-backend sh -c "cd /app && npx tsx prisma/seedProduction.ts"
fi

echo ""
echo "✅ Database seeded successfully!"
