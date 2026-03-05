#!/bin/bash

# One-shot deployment initializer for DogParkPals
# Runs seed + observability setup + test log generation in sequence.

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

wait_for_url() {
  local name="$1"
  local url="$2"
  local timeout="${3:-120}"
  local elapsed=0

  echo "⏳ Waiting for $name at $url ..."
  until curl -s -f "$url" > /dev/null 2>&1; do
    sleep 2
    elapsed=$((elapsed + 2))
    if [ "$elapsed" -ge "$timeout" ]; then
      echo "❌ Timeout waiting for $name ($timeout seconds)"
      exit 1
    fi
  done
  echo "✅ $name is ready"
}

if [ ! -f "$ROOT_DIR/docker-compose.yml" ]; then
  echo "❌ Run this script from the repository (or keep default folder structure)"
  exit 1
fi

echo "🚀 DogParkPals deployment initializer"
echo "===================================="
echo ""

if ! docker ps | grep -q "dogparkpals-backend"; then
  echo "❌ Backend container is not running."
  echo "   Start services first: docker compose up -d"
  exit 1
fi

wait_for_url "Backend" "$BACKEND_URL/health" 120
wait_for_url "Elasticsearch" "$ELASTICSEARCH_URL/_cluster/health" 180
wait_for_url "Kibana" "$KIBANA_URL/api/status" 240

echo ""
echo "1) Seeding production database"
bash "$SCRIPT_DIR/docker-seed.sh"

echo ""
echo "2) Initializing Kibana + Elasticsearch template/ILM"
bash "$ROOT_DIR/kibana/setup-kibana.sh"

echo ""
echo "3) Generating test logs for evaluation"
bash "$ROOT_DIR/elasticsearch/generate-test-logs.sh"

echo ""
echo "✅ Deployment initialization complete"
echo ""
echo "Quick checks:"
echo "  - Backend health:    $BACKEND_URL/health"
echo "  - Elasticsearch:     $ELASTICSEARCH_URL/dogparkpals-logs-*/_count"
echo "  - Kibana dashboards: $KIBANA_URL"
