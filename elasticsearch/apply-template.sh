#!/bin/bash

# Apply Elasticsearch index template for DogParkPals logs
# This script should be run after Elasticsearch is running

ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
TEMPLATE_FILE="$(dirname "$0")/index-template.json"

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "Error: Template file not found at $TEMPLATE_FILE"
  exit 1
fi

echo "Applying Elasticsearch index template from $TEMPLATE_FILE"
echo "Elasticsearch URL: $ELASTICSEARCH_URL"

# Apply the template using the Elasticsearch REST API
curl -X PUT \
  -H "Content-Type: application/json" \
  "$ELASTICSEARCH_URL/_index_template/dogparkpals-logs" \
  -d @"$TEMPLATE_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Index template applied successfully"
  
  # Verify the template was applied
  echo ""
  echo "Verifying template..."
  curl -s "$ELASTICSEARCH_URL/_index_template/dogparkpals-logs" | jq '.index_templates[0].name'
else
  echo "✗ Failed to apply index template"
  exit 1
fi
