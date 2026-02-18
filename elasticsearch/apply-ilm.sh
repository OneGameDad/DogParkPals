#!/bin/bash

# Apply ILM (Index Lifecycle Management) policy to Elasticsearch
# This script sets up automatic log retention and archiving

set -e

ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
ILM_POLICY_FILE="$(dirname "$0")/ilm-policy.json"

echo "========================================="
echo "Applying Elasticsearch ILM Policy"
echo "========================================="
echo "Elasticsearch URL: $ELASTICSEARCH_URL"
echo ""

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch to be ready..."
for i in {1..30}; do
  if curl -s "$ELASTICSEARCH_URL/_cluster/health" > /dev/null 2>&1; then
    echo "✓ Elasticsearch is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ Elasticsearch did not become ready in time"
    exit 1
  fi
  sleep 1
done

# Check if ILM policy file exists
if [ ! -f "$ILM_POLICY_FILE" ]; then
  echo "✗ ILM policy file not found: $ILM_POLICY_FILE"
  exit 1
fi

# Apply ILM policy
echo ""
echo "📋 Applying ILM policy 'dogparkpals-logs-ilm'..."
http_code=$(curl -s -w "%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  "$ELASTICSEARCH_URL/_ilm/policy/dogparkpals-logs-ilm" \
  -d @"$ILM_POLICY_FILE" 2>/dev/null -o /dev/null)

if [ "$http_code" = "200" ]; then
  echo "✓ ILM policy applied successfully"
else
  echo "✗ Failed to apply ILM policy (HTTP $http_code)"
  exit 1
fi

# Verify policy was applied
echo ""
echo "✓ Verifying ILM policy..."
curl -s "$ELASTICSEARCH_URL/_ilm/policy/dogparkpals-logs-ilm" | grep -q "dogparkpals-logs-ilm"
if [ $? -eq 0 ]; then
  echo "✓ Policy verified and active"
else
  echo "⚠ Warning: Could not verify policy"
fi

echo ""
echo "========================================="
echo "✓ ILM Policy Setup Complete"
echo "========================================="
echo ""
echo "📊 Policy Details:"
echo "  • Hot Phase: Active indexing, rollover at 50GB or 1 day"
echo "  • Warm Phase: After 7 days - read-only, reduced priority"
echo "  • Delete Phase: After 30 days - automatic deletion"
echo ""
echo "🔧 Configuration:"
echo "  • Policy Name: dogparkpals-logs-ilm"
echo "  • Hot Rollover: 50GB or 1 day"
echo "  • Warm Trigger: 7 days after creation"
echo "  • Delete Trigger: 30 days after creation"
echo ""
echo "💡 To customize retention:"
echo "  1. Edit elasticsearch/ilm-policy.json"
echo "  2. Change 'min_age' values (e.g., '14d' for 2 weeks)"
echo "  3. Run this script again to update"
echo ""
echo "📈 Monitor policy status:"
echo "  curl $ELASTICSEARCH_URL/_ilm/policy/dogparkpals-logs-ilm"
echo ""
