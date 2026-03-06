#!/bin/bash

# One-shot deployment initializer for DogParkPals
# Runs seed + observability setup in sequence.

set -e

BACKEND_URL="${BACKEND_URL:-https://localhost:3000}"
ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-https://localhost:9200}"
KIBANA_URL="${KIBANA_URL:-https://localhost:5601}"
ELASTICSEARCH_USERNAME="${ELASTICSEARCH_USERNAME:-elastic}"
ELASTICSEARCH_PASSWORD="${ELASTICSEARCH_PASSWORD:-${ELASTIC_PASSWORD:-}}"
WAIT_INTERVAL_SECONDS="${WAIT_INTERVAL_SECONDS:-5}"
CERT_RENEWAL_WARNING_DAYS="${CERT_RENEWAL_WARNING_DAYS:-30}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SECRETS_FILE="$ROOT_DIR/docker-secrets"

load_env_file() {
  local file="$1"

  [ -f "$file" ] || return 0

  while IFS= read -r line || [ -n "$line" ]; do
    # Ignore blanks and comments.
    case "$line" in
      ''|\#*)
        continue
        ;;
    esac

    # Ignore non-assignment lines.
    case "$line" in
      *=*)
        ;;
      *)
        continue
        ;;
    esac

    local key value
    key="${line%%=*}"
    value="${line#*=}"

    # Trim surrounding whitespace in key only.
    key="$(printf '%s' "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

    # Strip matching quotes around value.
    if [[ "$value" =~ ^\".*\"$ ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" =~ ^\'.*\'$ ]]; then
      value="${value:1:${#value}-2}"
    fi

    export "$key=$value"
  done < "$file"
}

load_env_file "$SECRETS_FILE"

generate_cert_with_san() {
  local cert_name="$1"
  local common_name="$2"
  local san_list="$3"
  local config_file

  config_file="$(mktemp)"
  cat > "$config_file" <<EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = ${common_name}
O = DogParkPals
C = US

[v3_req]
subjectAltName = ${san_list}
EOF

  openssl req -x509 -newkey rsa:2048 \
    -keyout "${cert_name}.key" \
    -out "${cert_name}.crt" \
    -days 365 \
    -nodes \
    -config "$config_file" > /dev/null 2>&1

  rm -f "$config_file"
}

server_cert_has_san() {
  if [ ! -f "$ROOT_DIR/certs/server.crt" ]; then
    return 1
  fi

  openssl x509 -in "$ROOT_DIR/certs/server.crt" -noout -text 2>/dev/null | grep -q "DNS:localhost"
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local timeout="${3:-120}"
  local interval="${4:-$WAIT_INTERVAL_SECONDS}"
  local auth_user="${5:-}"
  local auth_password="${6:-}"
  local elapsed=0

  echo "⏳ Waiting for $name at $url ..."
  # Use -k for self-signed HTTPS and optional basic auth for secured endpoints.
  local curl_flags="-s -f"
  if [[ "$url" == https://* ]]; then
    curl_flags="-s -f -k"
  fi

  if [ -n "$auth_user" ] && [ -n "$auth_password" ]; then
    curl_flags="$curl_flags -u ${auth_user}:${auth_password}"
  fi

  until curl $curl_flags "$url" > /dev/null 2>&1; do
    if [ "$name" = "Elasticsearch" ]; then
      local status_code
      status_code=$(curl $curl_flags -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || true)
      if [ "$status_code" = "401" ] || [ "$status_code" = "403" ]; then
        echo "❌ Elasticsearch credentials are invalid (HTTP $status_code)."
        echo "   Check ELASTICSEARCH_USERNAME/ELASTICSEARCH_PASSWORD in docker-secrets."
        exit 1
      fi
    fi

    echo "   ... still waiting for $name (${elapsed}s/${timeout}s)"
    sleep "$interval"
    elapsed=$((elapsed + interval))
    if [ "$elapsed" -ge "$timeout" ]; then
      echo "❌ Timeout waiting for $name ($timeout seconds)"
      exit 1
    fi
  done
  echo "✅ $name is ready"
}

warn_if_cert_expiring() {
  local cert_path="$1"
  local cert_name="$2"
  local warning_days="${3:-$CERT_RENEWAL_WARNING_DAYS}"
  local check_seconds=$((warning_days * 24 * 60 * 60))

  if [ ! -f "$cert_path" ]; then
    return
  fi

  if ! openssl x509 -in "$cert_path" -checkend "$check_seconds" -noout > /dev/null 2>&1; then
    echo "⚠️  Certificate $cert_name expires in less than $warning_days days: $cert_path"
  fi
}

if [ ! -f "$ROOT_DIR/docker-compose.yml" ]; then
  echo "❌ Run this script from the repository (or keep default folder structure)"
  exit 1
fi

echo "🚀 DogParkPals deployment initializer"
echo "===================================="
echo ""

# Generate SSL certificates if they don't exist or are missing SAN
if [ ! -f "$ROOT_DIR/certs/server.crt" ] || [ ! -f "$ROOT_DIR/certs/server.key" ] || ! server_cert_has_san; then
  echo "🔐 Generating SSL certificates for HTTPS..."
  rm -rf "$ROOT_DIR/certs"
  mkdir -p "$ROOT_DIR/certs"
  cd "$ROOT_DIR/certs"
  
  # Backend server certificate
  generate_cert_with_san "server" "localhost" "DNS:localhost,IP:127.0.0.1"
  
  # Observability services certificates
  generate_cert_with_san "prometheus" "prometheus" "DNS:prometheus,DNS:localhost,IP:127.0.0.1"
  generate_cert_with_san "grafana" "grafana" "DNS:grafana,DNS:localhost,IP:127.0.0.1"
  generate_cert_with_san "elasticsearch" "elasticsearch" "DNS:elasticsearch,DNS:localhost,IP:127.0.0.1"
  generate_cert_with_san "kibana" "kibana" "DNS:kibana,DNS:localhost,IP:127.0.0.1"
  generate_cert_with_san "rabbitmq" "rabbitmq" "DNS:rabbitmq,DNS:localhost,IP:127.0.0.1"

  chmod 644 *.key *.crt
  
  cd "$ROOT_DIR"
  echo "✅ SSL certificates generated (backend + observability)"
else
  echo "✅ SSL certificates already exist"
fi

warn_if_cert_expiring "$ROOT_DIR/certs/server.crt" "server"
warn_if_cert_expiring "$ROOT_DIR/certs/prometheus.crt" "prometheus"
warn_if_cert_expiring "$ROOT_DIR/certs/grafana.crt" "grafana"
warn_if_cert_expiring "$ROOT_DIR/certs/elasticsearch.crt" "elasticsearch"
warn_if_cert_expiring "$ROOT_DIR/certs/kibana.crt" "kibana"
warn_if_cert_expiring "$ROOT_DIR/certs/rabbitmq.crt" "rabbitmq"

echo ""

if ! docker ps | grep -q "dogparkpals-backend"; then
  echo "❌ Backend container is not running."
  echo "   Start services first: docker compose --env-file docker-secrets up -d"
  exit 1
fi

wait_for_url "Backend" "$BACKEND_URL/health" 180
wait_for_url "Elasticsearch" "$ELASTICSEARCH_URL/_cluster/health" 600 "$WAIT_INTERVAL_SECONDS" "$ELASTICSEARCH_USERNAME" "$ELASTICSEARCH_PASSWORD"
wait_for_url "Kibana" "$KIBANA_URL/api/status" 900

echo ""
echo "1) Seeding production database"
bash "$SCRIPT_DIR/docker-seed.sh"

echo ""
echo "2) Initializing Kibana + Elasticsearch template/ILM"
bash "$ROOT_DIR/kibana/setup-kibana.sh"

echo ""
echo "✅ Deployment initialization complete"
echo ""
echo "Quick checks:"
echo "  - Backend health:    curl -k $BACKEND_URL/health"
echo "  - Elasticsearch:     curl -k $ELASTICSEARCH_URL/_cluster/health"
echo "  - Kibana dashboards: $KIBANA_URL"
echo ""
echo "Note: -k flag required for self-signed certificates"
