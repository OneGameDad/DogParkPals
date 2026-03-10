#!/bin/bash

# Apply Elasticsearch index template and ILM policy for DogParkPals logs
# This script should be run after Elasticsearch is running

set -e

ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
ELASTICSEARCH_USERNAME="${ELASTICSEARCH_USERNAME:-elastic}"
ELASTICSEARCH_PASSWORD="${ELASTICSEARCH_PASSWORD:-${ELASTIC_PASSWORD:-}}"
TEMPLATE_FILE="$(dirname "$0")/index-template.json"
ILM_POLICY_FILE="$(dirname "$0")/ilm-policy.json"
SCRIPT_DIR="$(dirname "$0")"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SECRETS_FILE="$ROOT_DIR/docker-secrets"

load_env_file() {
  local file="$1"

  [ -f "$file" ] || return 0

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
    esac

    case "$line" in
      *=*) ;;
      *) continue ;;
    esac

    local key value
    key="${line%%=*}"
    value="${line#*=}"
    key="$(printf '%s' "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

    if [[ "$value" =~ ^\".*\"$ ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" =~ ^\'.*\'$ ]]; then
      value="${value:1:${#value}-2}"
    fi

    export "$key=$value"
  done < "$file"
}

load_env_file "$SECRETS_FILE"

ELASTICSEARCH_USERNAME="${ELASTICSEARCH_USERNAME:-elastic}"
ELASTICSEARCH_PASSWORD="${ELASTICSEARCH_PASSWORD:-${ELASTIC_PASSWORD:-}}"

CURL_FLAGS="-s -f"
if [[ "$ELASTICSEARCH_URL" == https://* ]]; then
  CURL_FLAGS="-s -f -k"
fi
if [ -n "$ELASTICSEARCH_USERNAME" ] && [ -n "$ELASTICSEARCH_PASSWORD" ]; then
  CURL_FLAGS="$CURL_FLAGS -u ${ELASTICSEARCH_USERNAME}:${ELASTICSEARCH_PASSWORD}"
fi

echo "========================================="
echo "Elasticsearch Setup: Template & ILM"
echo "========================================="
echo "Elasticsearch URL: $ELASTICSEARCH_URL"
echo ""

# Check files exist
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "✗ Template file not found at $TEMPLATE_FILE"
  exit 1
fi

if [ ! -f "$ILM_POLICY_FILE" ]; then
  echo "✗ ILM policy file not found at $ILM_POLICY_FILE"
  exit 1
fi

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch to be ready..."
for i in {1..30}; do
  if curl $CURL_FLAGS "$ELASTICSEARCH_URL/_cluster/health" > /dev/null 2>&1; then
    echo "✓ Elasticsearch is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ Elasticsearch did not become ready in time"
    exit 1
  fi
  sleep 1
done

echo ""
echo "📋 Applying ILM policy..."
http_code=$(curl $CURL_FLAGS -w "%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  "$ELASTICSEARCH_URL/_ilm/policy/dogparkpals-logs-ilm" \
  -d @"$ILM_POLICY_FILE" 2>/dev/null -o /dev/null || true)

if [ "$http_code" = "200" ]; then
  echo "✓ ILM policy applied"
else
  echo "⚠ ILM policy application returned HTTP $http_code"
fi

echo ""
echo "📋 Applying index template..."
http_code=$(curl $CURL_FLAGS -w "%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  "$ELASTICSEARCH_URL/_index_template/dogparkpals-logs" \
  -d @"$TEMPLATE_FILE" 2>/dev/null -o /dev/null || true)

if [ "$http_code" = "200" ]; then
  echo "✓ Index template applied"
else
  echo "✗ Template application failed (HTTP $http_code)"
  exit 1
fi

# Verify template was applied
echo ""
echo "✓ Verifying template..."
curl $CURL_FLAGS "$ELASTICSEARCH_URL/_index_template/dogparkpals-logs" | grep -q "dogparkpals-logs"
if [ $? -eq 0 ]; then
  echo "✓ Template verified"
else
  echo "⚠ Template verification incomplete"
fi

echo ""
echo "========================================="
echo "✓ Setup Complete"
echo "========================================="
echo ""
echo "📊 Configuration Applied:"
echo "  • ILM Policy: dogparkpals-logs-ilm"
echo "  • Index Template: dogparkpals-logs"
echo "  • Rollover: 50GB or 1 day"
echo "  • Warm Phase: 7 days"
echo "  • Delete Phase: 30 days"
echo ""
echo "💡 To reapply after editing files:"
echo "  bash elasticsearch/apply-template.sh"
echo ""