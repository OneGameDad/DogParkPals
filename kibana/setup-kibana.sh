#!/bin/bash

# Setup Kibana index pattern, visualizations, and dashboards
# This script creates the index pattern, saved searches, and sample dashboards for DogParkPals logs

set -e

KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
SCRIPT_DIR="$(dirname "$0")"
SAVED_SEARCHES_FILE="$SCRIPT_DIR/saved_searches.ndjson"
DASHBOARDS_FILE="$SCRIPT_DIR/dashboards.ndjson"

echo "========================================="
echo "Setting up Kibana for DogParkPals"
echo "========================================="
echo "Kibana URL: $KIBANA_URL"
echo ""

# Wait for Kibana to be ready
echo "⏳ Waiting for Kibana to be ready..."
for i in {1..60}; do
  if curl -s "$KIBANA_URL/api/status" > /dev/null 2>&1; then
    echo "✓ Kibana is ready"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "✗ Kibana did not become ready in time"
    exit 1
  fi
  sleep 1
done

# Create index pattern
echo ""
echo "📊 Creating index pattern 'dogparkpals-logs-*'..."
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  "$KIBANA_URL/api/data_views" \
  -d '{
    "data_view": {
      "title": "dogparkpals-logs-*",
      "timeFieldName": "@timestamp",
      "allowNoIndex": false,
      "id": "dogparkpals-logs"
    }
  }' 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ] || [ "$http_code" = "409" ]; then
  echo "✓ Index pattern ready (409 = already exists, which is fine)"
else
  echo "⚠ Warning: Index pattern creation returned HTTP $http_code"
fi

# Wait for index pattern to be available
sleep 2

# Import saved searches
if [ -f "$SAVED_SEARCHES_FILE" ]; then
  echo ""
  echo "📌 Importing saved searches..."
  
  while IFS= read -r line; do
    if [ ! -z "$line" ]; then
      # Extract title for display
      title=$(echo "$line" | grep -oP '"title":\s*"\K[^"]+' || echo "search")
      
      # Import the search object
      http_code=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "kbn-xsrf: true" \
        "$KIBANA_URL/api/saved_objects/search" \
        -d "$line" 2>/dev/null -o /dev/null)
      
      if [ "$http_code" = "200" ]; then
        echo "  ✓ $title"
      else
        echo "  ⚠ $title (HTTP $http_code, may have failed)"
      fi
    fi
  done < "$SAVED_SEARCHES_FILE"
  
  echo "✓ Saved searches imported"
else
  echo "✗ Saved searches file not found: $SAVED_SEARCHES_FILE"
fi

# Import dashboards with visualizations
if [ -f "$DASHBOARDS_FILE" ]; then
  echo ""
  echo "📈 Importing dashboards and visualizations..."
  
  while IFS= read -r line; do
    if [ ! -z "$line" ]; then
      # Extract title for display
      title=$(echo "$line" | grep -oP '"title":\s*"\K[^"]+' || echo "object")
      obj_type=$(echo "$line" | grep -oP '"type":\s*"\K[^"]+' || echo "unknown")
      
      # Import the object
      http_code=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "kbn-xsrf: true" \
        "$KIBANA_URL/api/saved_objects/$obj_type?overwrite=true" \
        -d "$line" 2>/dev/null -o /dev/null)
      
      if [ "$http_code" = "200" ]; then
        echo "  ✓ $obj_type: $title"
      else
        echo "  ⚠ $obj_type: $title (HTTP $http_code)"
      fi
    fi
  done < "$DASHBOARDS_FILE"
  
  echo "✓ Dashboards and visualizations imported"
else
  echo "✗ Dashboards file not found: $DASHBOARDS_FILE"
fi

echo ""
echo "========================================="
echo "✓ Kibana setup complete!"
echo "========================================="
echo ""
echo "📍 Next steps:"
echo "1. Open Kibana: $KIBANA_URL"
echo "2. Go to Menu → Dashboards"
echo "3. View available dashboards:"
echo "   - Event Timeline"
echo "   - Error Analysis"
echo "   - User Activity Breakdown"
echo "   - System Health & Performance"
echo "   - Complete Audit Trail"
echo ""
echo "💡 Or click Discover to search logs directly using saved searches"
echo ""
