#!/bin/bash

# Setup Kibana index pattern, visualizations, and dashboards
# This script creates the index pattern, saved searches, and sample dashboards for DogParkPals logs
# Also applies Elasticsearch index template and ILM policy

set -e

KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-https://localhost:9200}"
SCRIPT_DIR="$(dirname "$0")"
SAVED_SEARCHES_FILE="$SCRIPT_DIR/saved_searches.ndjson"
DASHBOARDS_FILE="$SCRIPT_DIR/dashboards.ndjson"
ES_TEMPLATE_SCRIPT="$(dirname "$SCRIPT_DIR")/elasticsearch/apply-template.sh"

CURL_FLAGS="-s"
if [[ "$KIBANA_URL" == https://* ]]; then
  CURL_FLAGS="-s -k"
fi

echo "========================================="
echo "Setting up DogParkPals Observability"
echo "========================================="
echo "Elasticsearch URL: $ELASTICSEARCH_URL"
echo "Kibana URL: $KIBANA_URL"
echo ""

# Step 1: Apply Elasticsearch template and ILM policy
if [ -f "$ES_TEMPLATE_SCRIPT" ]; then
  echo "🔧 Applying Elasticsearch configuration..."
  bash "$ES_TEMPLATE_SCRIPT" || echo "⚠ Elasticsearch setup had issues, continuing..."
  echo ""
else
  echo "⚠ Elasticsearch setup script not found: $ES_TEMPLATE_SCRIPT"
  echo ""
fi

# Step 2: Wait for Kibana to be ready
echo "⏳ Waiting for Kibana to be ready (this can take 2-3 minutes on first run)..."
for i in {1..180}; do
  # Check if Kibana status endpoint returns valid response
  response=$(curl $CURL_FLAGS "$KIBANA_URL/api/status" 2>&1)
  
  # Check for either "state" (ready) or "status" (any state) in response
  if echo "$response" | grep -qE '(state|status)'; then
    # Make sure it's not just an error page
    if ! echo "$response" | grep -q "error"; then
      echo "✓ Kibana is ready"
      break
    fi
  fi
  
  # Show progress every 30 seconds
  if [ $((i % 30)) -eq 0 ]; then
    echo "  Still waiting... ($i/180 seconds)"
  fi
  
  if [ $i -eq 180 ]; then
    echo "✗ Kibana did not become ready after 3 minutes"
    echo "  Check: docker compose logs kibana"
    exit 1
  fi
  sleep 1
done

# Step 2b: Wait for Kibana saved objects API to be available
echo "⏳ Waiting for Kibana API to be ready..."
for i in {1..60}; do
  http_code=$(curl $CURL_FLAGS -w "%{http_code}" -o /dev/null "$KIBANA_URL/api/saved_objects/search")
  if [ "$http_code" != "000" ] && [ "$http_code" != "503" ] && [ "$http_code" != "504" ]; then
    echo "✓ Kibana API is ready"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "⚠ Kibana API not fully ready after 60s, but continuing (may retry requests)..."
    break
  fi
  sleep 1
done

# Step 3: Create index pattern (optional - logs will auto-discover)
echo ""
echo "📊 Creating index pattern 'dogparkpals-logs-*'..."

# Try primary endpoint
http_code=$(curl $CURL_FLAGS -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  "$KIBANA_URL/api/index_patterns/index_pattern" \
  -d '{"index_pattern":{"title":"dogparkpals-logs-*","timeFieldName":"@timestamp"}}' \
  -o /dev/null 2>/dev/null)

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
  echo "✓ Index pattern created"
elif [ "$http_code" = "409" ]; then
  echo "✓ Index pattern already exists"
else
  # Try fallback endpoint for data views
  http_code=$(curl $CURL_FLAGS -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "kbn-xsrf: true" \
    "$KIBANA_URL/api/data_views" \
    -d '{"data_view":{"title":"dogparkpals-logs-*","timeFieldName":"@timestamp"}}' \
    -o /dev/null 2>/dev/null)
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "409" ]; then
    echo "✓ Index pattern created with fallback endpoint"
  else
    echo "⚠ Could not create index pattern (HTTP $http_code) - logs will be discoverable when data arrives"
  fi
fi

# Import saved searches
if [ -f "$SAVED_SEARCHES_FILE" ]; then
  echo ""
  echo "📌 Importing saved searches from: $SAVED_SEARCHES_FILE"
  
  # Check file is not empty
  line_count=$(wc -l < "$SAVED_SEARCHES_FILE")
  echo "   Found $line_count lines in file"
  
  count=0
  imported=0
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip completely empty lines
    if [ -z "$line" ]; then
      continue
    fi
    
    count=$((count + 1))
    
    # Extract title and id for display
    title=$(echo "$line" | grep -oP '"title":\s*"\K[^"]+' || echo "search")
    id=$(echo "$line" | grep -oP '"id":\s*"\K[^"]+' | head -n1 || echo "unknown")
    
    # Extract attributes and references by removing type and id fields
    body=$(echo "$line" | sed 's/"type":"search",//g' | sed 's/"id":"[^"]*",//g')
    
    if [ ! -z "$body" ] && [ "$body" != "{}" ]; then
      # Import the search object with id in URL
      http_code=$(curl $CURL_FLAGS -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "kbn-xsrf: true" \
        "$KIBANA_URL/api/saved_objects/search/$id?overwrite=true" \
        -d "$body" 2>/dev/null -o /dev/null)
      
      if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "  ✓ $title"
        imported=$((imported + 1))
      else
        echo "  ⚠ $title (HTTP $http_code)"
      fi
    else
      echo "  ⚠ Could not parse $title"
    fi
  done < "$SAVED_SEARCHES_FILE"
  
  echo "✓ Saved searches: $imported/$count imported"
else
  echo "✗ Saved searches file not found: $SAVED_SEARCHES_FILE"
  echo "   Expected at: $(cd "$SCRIPT_DIR" 2>/dev/null && pwd)/saved_searches.ndjson || echo 'Cannot resolve path'"
fi

# Import dashboards with visualizations
if [ -f "$DASHBOARDS_FILE" ]; then
  echo ""
  echo "📈 Importing dashboards and visualizations..."
  
  while IFS= read -r line; do
    if [ ! -z "$line" ]; then
      # Extract title for display
      title=$(echo "$line" | grep -oP '"title":\s*"\K[^"]+' || echo "object")
      obj_type=$(echo "$line" | grep -oP '"type":\s*"\K[^"]+' | head -n1 || echo "unknown")
      
      # Import the object
      http_code=$(curl $CURL_FLAGS -w "%{http_code}" -X POST \
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
