#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SECRETS_FILE="$ROOT_DIR/docker-secrets"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
COMPOSE_CMD=()

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo "[PASS] $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo "[FAIL] $1"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  echo "[WARN] $1"
}

has_nonempty_secret() {
  local key="$1"
  local file="$2"
  local value
  value=$(grep -E "^${key}=" "$file" 2>/dev/null | tail -n1 | cut -d'=' -f2- | tr -d '"' | xargs || true)
  [ -n "$value" ]
}

secret_value() {
  local key="$1"
  local file="$2"
  grep -E "^${key}=" "$file" 2>/dev/null | tail -n1 | cut -d'=' -f2- | tr -d '"' | xargs || true
}

detect_compose_cmd() {
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose)
  elif docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
  else
    COMPOSE_CMD=()
  fi
}

compose() {
  "${COMPOSE_CMD[@]}" "$@"
}

echo "DogParkPals deployment verifier"
echo "=============================="

if [ ! -f "$SECRETS_FILE" ]; then
  echo "[FAIL] Missing docker-secrets file: $SECRETS_FILE"
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "[FAIL] Missing docker-compose.yml file: $COMPOSE_FILE"
  exit 1
fi

# 1) ELASTIC_PASSWORD present
if has_nonempty_secret "ELASTIC_PASSWORD" "$SECRETS_FILE"; then
  pass "ELASTIC_PASSWORD is set"
else
  fail "ELASTIC_PASSWORD is missing or empty"
fi

# 2) Kibana auth configuration sanity
TOKEN_VALUE=$(secret_value "ELASTICSEARCH_SERVICEACCOUNTTOKEN" "$SECRETS_FILE")
KIBANA_USER=$(secret_value "ELASTICSEARCH_USERNAME" "$SECRETS_FILE")
KIBANA_PASS=$(secret_value "ELASTICSEARCH_PASSWORD" "$SECRETS_FILE")

if [ -n "$TOKEN_VALUE" ]; then
  if printf '%s' "$TOKEN_VALUE" | grep -q '[[:space:]]'; then
    fail "ELASTICSEARCH_SERVICEACCOUNTTOKEN contains whitespace"
  else
    pass "Kibana service account token is configured"
  fi
else
  if [ -n "$KIBANA_USER" ] && [ -n "$KIBANA_PASS" ]; then
    if [ "$KIBANA_USER" = "kibana_system" ] || [ "$KIBANA_USER" = "elastic" ]; then
      pass "Kibana credentials are configured"
    else
      warn "Kibana username is '$KIBANA_USER' (expected kibana_system or elastic in this stack)"
    fi
  else
    fail "Kibana auth is not configured (set service account token or kibana_system credentials)"
  fi
fi

# 3) Healthcheck hardening present
if grep -Fq 'curl -s -f -k -u elastic:$$ELASTIC_PASSWORD https://localhost:9200' "$COMPOSE_FILE"; then
  pass "Elasticsearch healthcheck uses curl -f and auth"
else
  fail "Elasticsearch healthcheck is missing curl -f and/or auth"
fi

if grep -Fq 'curl -s -f -k https://localhost:5601/api/status' "$COMPOSE_FILE"; then
  pass "Kibana healthcheck uses curl -f"
else
  fail "Kibana healthcheck is missing curl -f"
fi

# 3b) RabbitMQ exporter TLS safety checks in compose
if grep -Fq 'RABBIT_URL=https://rabbitmq:15671' "$COMPOSE_FILE"; then
  pass "rabbitmq-exporter targets RabbitMQ HTTPS management endpoint"
else
  warn "rabbitmq-exporter is not configured for RabbitMQ HTTPS endpoint"
fi

if grep -Fq 'CAFILE=/etc/rabbitmq-exporter/ca.pem' "$COMPOSE_FILE"; then
  pass "rabbitmq-exporter is configured with CA file"
else
  fail "rabbitmq-exporter is missing CAFILE configuration"
fi

if grep -Fq 'SKIPVERIFY=false' "$COMPOSE_FILE"; then
  pass "rabbitmq-exporter enforces TLS verification"
else
  warn "rabbitmq-exporter is not enforcing TLS verification (SKIPVERIFY=false not found)"
fi

# 4) Runtime checks (if containers are running)
detect_compose_cmd
if command -v docker >/dev/null 2>&1 && [ ${#COMPOSE_CMD[@]} -gt 0 ]; then
  KIBANA_CID=$(compose ps -q kibana 2>/dev/null || true)
  RABBIT_EXPORTER_CID=$(compose ps -q rabbitmq-exporter 2>/dev/null || true)
  if [ -n "$KIBANA_CID" ]; then
    if docker inspect "$KIBANA_CID" >/dev/null 2>&1; then
      if docker exec "$KIBANA_CID" env 2>/dev/null | grep -q '^ELASTICSEARCH_USERNAME='; then
        pass "Running Kibana container has ELASTICSEARCH_USERNAME set"
      else
        warn "Running Kibana container is missing ELASTICSEARCH_USERNAME"
      fi

      KIBANA_HEALTH=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$KIBANA_CID" 2>/dev/null || true)
      case "$KIBANA_HEALTH" in
        healthy)
          pass "Kibana container health is healthy"
          ;;
        starting)
          warn "Kibana health is starting (warm-up can take 2-5 minutes)"
          ;;
        unhealthy)
          fail "Kibana health is unhealthy"
          ;;
        *)
          warn "Kibana health status unavailable"
          ;;
      esac
    else
      warn "Kibana container not inspectable"
    fi
  else
    warn "Kibana container not running (runtime checks skipped)"
  fi

  if [ -n "$RABBIT_EXPORTER_CID" ]; then
    if docker inspect "$RABBIT_EXPORTER_CID" >/dev/null 2>&1; then
      EXPORTER_HEALTH=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$RABBIT_EXPORTER_CID" 2>/dev/null || true)
      case "$EXPORTER_HEALTH" in
        healthy)
          pass "rabbitmq-exporter container health is healthy"
          ;;
        starting)
          warn "rabbitmq-exporter health is starting"
          ;;
        unhealthy)
          fail "rabbitmq-exporter health is unhealthy"
          ;;
        *)
          warn "rabbitmq-exporter health status unavailable"
          ;;
      esac
    else
      warn "rabbitmq-exporter container not inspectable"
    fi
  else
    warn "rabbitmq-exporter container not running (runtime checks skipped)"
  fi
else
  warn "Docker Compose not available; runtime checks skipped"
fi

echo ""
echo "Summary: ${PASS_COUNT} passed, ${FAIL_COUNT} failed, ${WARN_COUNT} warnings"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
