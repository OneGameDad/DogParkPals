#!/bin/bash

# Setup Kibana index pattern and saved searches
# This script creates the index pattern and useful saved searches for DogParkPals logs

KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
SAVED_SEARCHES_FILE="$(dirname "$0")/saved_searches.json"

echo "Setting up Kibana for DogParkPals logs..."
echo "Kibana URL: $KIBANA_URL"

# Wait for Kibana to be ready
echo "Waiting for Kibana to be ready..."
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
echo "Creating index pattern..."
curl -X POST \
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
  }' 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✓ Index pattern created successfully"
else
  echo "⚠ Index pattern creation may have failed or already exists"
fi

# Wait a moment for index pattern to be available
sleep 2

# Create saved searches
if [ -f "$SAVED_SEARCHES_FILE" ]; then
  echo ""
  echo "Creating saved searches..."
  
  # Read and import each saved search
  while IFS= read -r line; do
    if [[ $line == *"\"title\""* ]]; then
      title=$(echo $line | grep -oP '"title":\s*"\K[^"]+')
      echo "  Creating saved search: $title"
    fi
  done < "$SAVED_SEARCHES_FILE"
  
  # Import all saved searches from file
  cat "$SAVED_SEARCHES_FILE" | while read -r search_json; do
    if [ ! -z "$search_json" ]; then
      curl -X POST \
        -H "Content-Type: application/json" \
        -H "kbn-xsrf: true" \
        "$KIBANA_URL/api/saved_objects/search" \
        -d "$search_json" 2>/dev/null
    fi
  done
  
  echo "✓ Saved searches imported"
else
  echo "⚠ Saved searches file not found: $SAVED_SEARCHES_FILE"
fi

echo ""
echo "Kibana setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Kibana: $KIBANA_URL"
echo "2. Go to Discover → Select 'dogparkpals-logs-*' index pattern"
echo "3. View saved searches in the sidebar"
