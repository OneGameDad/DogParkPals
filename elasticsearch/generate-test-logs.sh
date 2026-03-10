#!/bin/bash
# Generate test logs for Elasticsearch verification
# Usage: bash elasticsearch/generate-test-logs.sh

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
LOG_COUNT="${LOG_COUNT:-20}"

echo "🔍 Generating test logs for Elasticsearch verification..."
echo "📍 Backend URL: $BACKEND_URL"
echo "📊 Log count: $LOG_COUNT"
echo ""

# Check if backend is reachable
if ! curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
  echo "❌ Error: Backend is not reachable at $BACKEND_URL"
  echo "   Make sure the backend container is running: docker compose ps backend"
  exit 1
fi

echo "✓ Backend is reachable"
echo ""
echo "Generating logs..."

# Generate logs by hitting various endpoints
for i in $(seq 1 $LOG_COUNT); do
  # Alternate between health and status endpoints
  if [ $((i % 2)) -eq 0 ]; then
    curl -s "$BACKEND_URL/health" > /dev/null
    echo "  [$i/$LOG_COUNT] Hit /health endpoint"
  else
    curl -s "$BACKEND_URL/status" > /dev/null
    echo "  [$i/$LOG_COUNT] Hit /status endpoint"
  fi
  
  # Small delay to avoid overwhelming the backend
  sleep 0.5
done

echo ""
echo "✅ Generated $LOG_COUNT test logs"
echo ""
echo "📋 Verification steps:"
echo ""
echo "1. Check log count in Elasticsearch:"
echo "   curl 'http://localhost:9200/dogparkpals-logs-*/_count'"
echo ""
echo "2. View recent logs:"
echo "   curl -s 'http://localhost:9200/dogparkpals-logs-*/_search?size=5&sort=@timestamp:desc' | jq '.hits.hits[]._source | {timestamp: .\"@timestamp\", severity, log_message}'"
echo ""
echo "3. Open Kibana to browse logs:"
echo "   http://localhost:5602"
echo ""
echo "⏱️  Note: Logs may take 5-10 seconds to appear in Elasticsearch/Kibana"
