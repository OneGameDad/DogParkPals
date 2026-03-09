#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
SECRETS_FILE="$ROOT_DIR/docker-secrets"
SECRETS_EXAMPLE_FILE="$ROOT_DIR/docker-secrets-example"

OBS_SERVICES=(elasticsearch logstash kibana prometheus grafana rabbitmq-exporter)
COMPOSE_CMD=()

# Deployment initialization variables
BACKEND_URL="${BACKEND_URL:-https://localhost:3000}"
ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-https://localhost:9200}"
KIBANA_URL="${KIBANA_URL:-https://localhost:5601}"
ELASTICSEARCH_USERNAME="${ELASTICSEARCH_USERNAME:-elastic}"
ELASTICSEARCH_PASSWORD="${ELASTICSEARCH_PASSWORD:-${ELASTIC_PASSWORD:-}}"
WAIT_INTERVAL_SECONDS="${WAIT_INTERVAL_SECONDS:-5}"
CERT_RENEWAL_WARNING_DAYS="${CERT_RENEWAL_WARNING_DAYS:-30}"

# Error trap for better error reporting
trap 'echo "❌ Command failed on line $LINENO"; exit 1' ERR

# Detect sed variant once for portability
if sed --version 2>&1 | grep -q GNU; then
  SED_INPLACE="sed -i"
else
  SED_INPLACE="sed -i ''"
fi

# ==============================================================================
# Utility Functions (inlined from deployment-init.sh)
# ==============================================================================

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

check_container_health() {
  local container_name="$1"
  local max_attempts="${2:-20}"
  local attempt=0
  
  while [ "$attempt" -lt "$max_attempts" ]; do
    local health_status
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
    local running_status
    running_status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "not_found")
    
    # Container crashed or died - fail immediately
    if [ "$running_status" = "exited" ] || [ "$running_status" = "dead" ]; then
      echo "❌ Container $container_name has stopped running (status: $running_status)"
      echo "   Check logs: docker logs $container_name"
      return 1
    fi
    
    # Container is healthy - success
    if [ "$health_status" = "healthy" ]; then
      return 0
    fi
    
    # Container has no health check but is running - success
    if [ "$health_status" = "none" ] && [ "$running_status" = "running" ]; then
      return 0
    fi
    
    # Still starting, wait and retry
    if [ "$attempt" -eq 0 ]; then
      echo "⏳ Waiting for $container_name to be ready..."
    fi
    sleep 2
    attempt=$((attempt + 1))
  done
  
  # Final check after timeout
  local final_status
  final_status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "not_found")
  
  if [ "$final_status" = "running" ]; then
    echo "⚠️  Timeout waiting for $container_name health check, but container is running"
    return 0
  else
    echo "❌ Container $container_name not ready after timeout (status: $final_status)"
    echo "   Check logs: docker logs $container_name"
    return 1
  fi
}

wait_for_running_container() {
  local container_name="$1"
  local timeout_seconds="${2:-180}"
  local interval_seconds="${3:-3}"
  local elapsed=0

  echo "⏳ Waiting for container $container_name to start..."

  while [ "$elapsed" -lt "$timeout_seconds" ]; do
    local running_status
    running_status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "not_found")

    if [ "$running_status" = "running" ]; then
      echo "✅ $container_name is running"
      return 0
    fi

    if [ "$running_status" = "exited" ] || [ "$running_status" = "dead" ]; then
      echo "❌ $container_name exited during startup (status: $running_status)"
      echo "   Check logs: docker logs $container_name"
      return 1
    fi

    sleep "$interval_seconds"
    elapsed=$((elapsed + interval_seconds))
  done

  echo "❌ Timed out waiting for $container_name to start (${timeout_seconds}s)"
  echo "   Note: db-init is expected to stop after migrations; this check targets backend only."
  return 1
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local timeout="${3:-120}"
  local interval="${4:-$WAIT_INTERVAL_SECONDS}"
  local auth_user="${5:-}"
  local auth_password="${6:-}"
  local is_optional="${7:-false}"
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

    if [ "$elapsed" -ge "$timeout" ]; then
      if [ "$is_optional" = "true" ]; then
        echo "⚠️  Timeout waiting for $name ($timeout seconds) - continuing anyway"
        return 1
      else
        echo "❌ Timeout waiting for $name ($timeout seconds)"
        echo "   Check logs: docker logs dogparkpals-$(echo "$name" | tr '[:upper:]' '[:lower:]')"
        exit 1
      fi
    fi
    
    # Only show progress every 10 seconds to reduce noise
    if [ $((elapsed % 10)) -eq 0 ]; then
      echo "   ... still waiting for $name (${elapsed}s/${timeout}s)"
    fi
    
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done
  echo "✅ $name is ready"
  return 0
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

all_required_certs_exist() {
  local required=(
    server.crt server.key
    rabbitmq.crt rabbitmq.key
    prometheus.crt prometheus.key
    grafana.crt grafana.key
    elasticsearch.crt elasticsearch.key
    kibana.crt kibana.key
  )

  for cert in "${required[@]}"; do
    if [ ! -f "$ROOT_DIR/certs/$cert" ]; then
      return 1
    fi
  done

  return 0
}

normalize_cert_permissions() {
  local certs_dir="$ROOT_DIR/certs"
  local required=(
    server.crt server.key
    rabbitmq.crt rabbitmq.key
    prometheus.crt prometheus.key
    grafana.crt grafana.key
    elasticsearch.crt elasticsearch.key
    kibana.crt kibana.key
  )

  for cert in "${required[@]}"; do
    if [ -f "$certs_dir/$cert" ]; then
      if ! chmod a+r "$certs_dir/$cert" 2>/dev/null; then
        echo "❌ Cannot set read permission on $certs_dir/$cert"
        echo "   RabbitMQ/Grafana/Prometheus may fail to start without readable cert files."
        exit 1
      fi
    fi
  done
}

create_kibana_service_account_token() {
  local es_url="$1"
  local es_user="$2"
  local es_password="$3"
  local secrets_file="$4"
  
  # Check if token already exists and is valid
  if grep -q "^KIBANA_SERVICE_ACCOUNT_TOKEN=" "$secrets_file" 2>/dev/null; then
    local existing_token
    existing_token=$(grep "^KIBANA_SERVICE_ACCOUNT_TOKEN=" "$secrets_file" | cut -d= -f2-)
    if [ -n "$existing_token" ]; then
      echo "✅ Kibana service account token already configured"
      return 0
    fi
  fi
  
  echo "Creating new Kibana service account token..."
  
  # Create token for built-in kibana service account
  local token_response
  token_response=$(curl -s -k -X POST \
    -u "${es_user}:${es_password}" \
    -H "Content-Type: application/json" \
    "$es_url/_security/service/elastic/kibana/credential/token/dogparkpals_$(date +%s)" 2>/dev/null)
  
  local token
  token=$(echo "$token_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$token" ]; then
    echo "❌ Failed to create Kibana service account token"
    echo "   Response: $token_response"
    return 1
  fi
  
  # Add token to docker-secrets
  echo "KIBANA_SERVICE_ACCOUNT_TOKEN=$token" >> "$secrets_file"
  echo "✅ Kibana service account token created and saved"
  return 0
}

# ==============================================================================
# Stack Control Functions
# ==============================================================================

print_usage() {
  cat <<EOF
DogParkPals Stack Control (All-in-One)

Usage:
  ./scripts/stack.sh --fresh       Start full stack with deployment initialization + seeding
  ./scripts/stack.sh --core-only   Start core app only (backend, frontend, no observability)
  ./scripts/stack.sh --obs-down    Stop observability services only
  ./scripts/stack.sh --clean       Stop all services and remove app volumes/images
  ./scripts/stack.sh --help

This script handles certificate generation, seeding, and observability setup inline.
No external scripts required (docker-seed.sh and deployment-init.sh are integrated).
EOF
}

check_requirements() {
  local missing=0
  
  for cmd in docker openssl curl; do
    if ! command -v "$cmd" &> /dev/null; then
      echo "❌ Missing required command: $cmd"
      missing=1
    fi
  done

  # Support both legacy docker-compose binary and Docker Compose v2 plugin.
  if ! command -v docker-compose &> /dev/null; then
    if ! docker compose version > /dev/null 2>&1; then
      echo "❌ Missing required Docker Compose command (docker-compose or docker compose)"
      missing=1
    fi
  fi
  
  if [ "$missing" -eq 1 ]; then
    echo ""
    echo "Please install missing dependencies and try again."
    exit 1
  fi
}

detect_compose_cmd() {
  if command -v docker-compose > /dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose)
  elif docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
  else
    echo "❌ Missing required Docker Compose command (docker-compose or docker compose)"
    exit 1
  fi
}

compose() {
  "${COMPOSE_CMD[@]}" "$@"
}

ensure_repo_root() {
  if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ docker-compose.yml not found. Run from the DogParkPals repository root."
    exit 1
  fi
}

ensure_secrets_file() {
  if [ -f "$SECRETS_FILE" ]; then
    return
  fi

  if [ ! -f "$SECRETS_EXAMPLE_FILE" ]; then
    echo "❌ Missing docker-secrets and docker-secrets-example."
    exit 1
  fi

  cp "$SECRETS_EXAMPLE_FILE" "$SECRETS_FILE"
  echo "⚠️  Created docker-secrets from docker-secrets-example"
  echo "   Review docker-secrets and update secrets before production use."
}

require_nonempty_secret() {
  local key="$1"
  local file="$2"

  if ! grep -q "^${key}=" "$file"; then
    echo "❌ Missing required setting in $(basename "$file"): $key"
    exit 1
  fi

  local value
  value=$(grep "^${key}=" "$file" | tail -n1 | cut -d'=' -f2- | tr -d '"' | xargs)
  if [ -z "$value" ]; then
    echo "❌ Empty required setting in $(basename "$file"): $key"
    exit 1
  fi
}

secret_value() {
  local key="$1"
  local file="$2"
  grep "^${key}=" "$file" 2>/dev/null | tail -n1 | cut -d'=' -f2- | tr -d '"' | xargs
}

generate_secure_password() {
  openssl rand -base64 16
}

update_or_add_secret() {
  local key="$1"
  local value="$2"
  local file="$3"
  
  if grep -q "^${key}=" "$file"; then
    # Use portable sed (detected at script start)
    $SED_INPLACE "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

fix_elasticsearch_auth() {
  local current_elastic_pass
  current_elastic_pass=$(secret_value "ELASTIC_PASSWORD" "$SECRETS_FILE")
  
  # Generate secure password if missing or using placeholder values (but allow "elastic" as valid)
  if [ -z "$current_elastic_pass" ] || 
     [ "$current_elastic_pass" = "your-elastic-password" ] || 
     [ "$current_elastic_pass" = "changeme" ]; then
    local new_pass
    new_pass=$(generate_secure_password)
    update_or_add_secret "ELASTIC_PASSWORD" "$new_pass" "$SECRETS_FILE"
    echo "✓ Generated secure ELASTIC_PASSWORD"
    current_elastic_pass="$new_pass"
  fi
  
  # Remove problematic ELASTICSEARCH_SERVICEACCOUNTTOKEN if present
  if grep -q "^ELASTICSEARCH_SERVICEACCOUNTTOKEN=" "$SECRETS_FILE"; then
    $SED_INPLACE '/^ELASTICSEARCH_SERVICEACCOUNTTOKEN=/d' "$SECRETS_FILE"
    echo "✓ Removed ELASTICSEARCH_SERVICEACCOUNTTOKEN (causes Kibana issues)"
  fi
  
  # Ensure ELASTICSEARCH_USERNAME is set to elastic
  if ! grep -q "^ELASTICSEARCH_USERNAME=" "$SECRETS_FILE"; then
    update_or_add_secret "ELASTICSEARCH_USERNAME" "elastic" "$SECRETS_FILE"
    echo "✓ Added ELASTICSEARCH_USERNAME=elastic"
  fi
  
  # Ensure ELASTICSEARCH_PASSWORD matches ELASTIC_PASSWORD
  local current_es_pass
  current_es_pass=$(secret_value "ELASTICSEARCH_PASSWORD" "$SECRETS_FILE")
  if [ "$current_es_pass" != "$current_elastic_pass" ]; then
    update_or_add_secret "ELASTICSEARCH_PASSWORD" "$current_elastic_pass" "$SECRETS_FILE"
    echo "✓ Synced ELASTICSEARCH_PASSWORD with ELASTIC_PASSWORD"
  fi
}

fix_jwt_secret() {
  local current_jwt
  current_jwt=$(secret_value "JWT_SECRET" "$SECRETS_FILE")
  
  # Generate secure JWT secret if missing or using placeholder
  if [ -z "$current_jwt" ] || 
     [ "$current_jwt" = "your-strong-jwt-secret-here-at-least-32-characters" ] || 
     [ "$current_jwt" = "changeme" ] ||
     [ ${#current_jwt} -lt 32 ]; then
    local new_jwt
    # Generate 64 hex characters (32 bytes)
    new_jwt=$(openssl rand -hex 32)
    update_or_add_secret "JWT_SECRET" "$new_jwt" "$SECRETS_FILE"
    echo "✓ Generated secure JWT_SECRET"
  fi
}

validate_observability_secrets() {
  echo "🔐 Validating and configuring authentication..."
  
  if ! fix_jwt_secret; then
    echo "❌ Failed to configure JWT secret"
    exit 1
  fi
  
  if ! fix_elasticsearch_auth; then
    echo "❌ Failed to configure Elasticsearch auth"
    exit 1
  fi
  
  if ! require_nonempty_secret "ELASTIC_PASSWORD" "$SECRETS_FILE"; then
    echo "❌ ELASTIC_PASSWORD validation failed"
    exit 1
  fi
  
  echo "✅ Authentication configured"
  echo ""
}

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
    -config "$config_file" > /dev/null 2>&1 || { rm -f "$config_file"; return 1; }

  rm -f "$config_file"
}

server_cert_has_san() {
  local certs_dir="$ROOT_DIR/certs"
  if [ ! -f "$certs_dir/server.crt" ]; then
    return 1
  fi

  openssl x509 -in "$certs_dir/server.crt" -noout -text 2>/dev/null | grep -q "DNS:localhost"
}

ensure_certificates() {
  local certs_dir="$ROOT_DIR/certs"
  local force_regen="${1:-false}"
  
  if [ "$force_regen" = "true" ] || ! all_required_certs_exist || ! server_cert_has_san; then
    echo "🔐 Generating SSL certificates..."
    
    # Clean up any corrupt cert files/directories
    rm -rf "$certs_dir"
    mkdir -p "$certs_dir" || { echo "❌ Failed to create certs directory"; exit 1; }
    
    cd "$certs_dir" || { echo "❌ Failed to change to certs directory"; exit 1; }
    
    generate_cert_with_san "server" "localhost" "DNS:localhost,IP:127.0.0.1" || { echo "❌ Failed to generate server certificate"; exit 1; }
    generate_cert_with_san "prometheus" "prometheus" "DNS:prometheus,DNS:localhost,IP:127.0.0.1" || { echo "❌ Failed to generate prometheus certificate"; exit 1; }
    generate_cert_with_san "grafana" "grafana" "DNS:grafana,DNS:localhost,IP:127.0.0.1" || { echo "❌ Failed to generate grafana certificate"; exit 1; }
    generate_cert_with_san "elasticsearch" "elasticsearch" "DNS:elasticsearch,DNS:localhost,IP:127.0.0.1" || { echo "❌ Failed to generate elasticsearch certificate"; exit 1; }
    generate_cert_with_san "kibana" "kibana" "DNS:kibana,DNS:localhost,IP:127.0.0.1" || { echo "❌ Failed to generate kibana certificate"; exit 1; }
    generate_cert_with_san "rabbitmq" "rabbitmq" "DNS:rabbitmq,DNS:localhost,IP:127.0.0.1" || { echo "❌ Failed to generate rabbitmq certificate"; exit 1; }
    
    # Set permissions so containers can read the keys
    chmod 644 *.key *.crt
    
    cd "$ROOT_DIR" || exit 1
    
    echo "✅ SSL certificates generated"
  else
    echo "✅ SSL certificates already exist"
  fi
  
  # Check for expiring certificates
  warn_if_cert_expiring "$certs_dir/server.crt" "server"
  warn_if_cert_expiring "$certs_dir/rabbitmq.crt" "rabbitmq"
  warn_if_cert_expiring "$certs_dir/prometheus.crt" "prometheus"
  warn_if_cert_expiring "$certs_dir/grafana.crt" "grafana"
  warn_if_cert_expiring "$certs_dir/elasticsearch.crt" "elasticsearch"
  warn_if_cert_expiring "$certs_dir/kibana.crt" "kibana"

  # Ensure existing certs are readable by containers running as non-root (e.g. RabbitMQ uid 999)
  normalize_cert_permissions
  
  echo ""
}

cleanup_volumes() {
  echo "🧹 Cleaning stale Elasticsearch volumes..."
  # Remove volumes to prevent authentication/state issues
  docker volume rm dogparkpals_elasticsearch-data 2>/dev/null || true
  echo "✓ Volume cleanup complete"
  echo ""
}

run_fresh() {
  echo "🚀 Starting full DogParkPals stack..."
  echo ""
  ensure_secrets_file
  validate_observability_secrets
  ensure_certificates true
  
  # Clean volumes to avoid stale Elasticsearch state
  cleanup_volumes

  echo "🔨 Building Docker images..."
  (cd "$ROOT_DIR" && compose --env-file docker-secrets build)
  
  # Start Elasticsearch first so we can generate the Kibana token before the full stack boots
  echo ""
  echo "🚀 Starting Elasticsearch (Phase 1)..."
  (cd "$ROOT_DIR" && compose --env-file docker-secrets up -d elasticsearch)
  
  echo ""
  echo "⏳ Waiting for Elasticsearch to be ready..."
  sleep 5
  
  # Load environment variables from docker-secrets
  load_env_file "$SECRETS_FILE"
  
  # Check if Elasticsearch is running
  if docker ps | grep -q "dogparkpals-elasticsearch"; then
    echo "Checking Elasticsearch health..."
    if check_container_health "dogparkpals-elasticsearch" 60; then
      echo "✅ Elasticsearch container is healthy"
    else
      echo "⚠️  Elasticsearch container not healthy yet, trying direct connection..."
    fi
    
    wait_for_url "Elasticsearch" "$ELASTICSEARCH_URL/_cluster/health" 180 "$WAIT_INTERVAL_SECONDS" "$ELASTICSEARCH_USERNAME" "$ELASTICSEARCH_PASSWORD"
    
    # Create Kibana service account token BEFORE starting the rest of the stack
    # This way, when Kibana starts, the token is already in docker-secrets
    echo ""
    echo "🔐 Creating Kibana service account token..."
    if create_kibana_service_account_token "$ELASTICSEARCH_URL" "$ELASTICSEARCH_USERNAME" "$ELASTICSEARCH_PASSWORD" "$SECRETS_FILE"; then
      echo "✅ Token created and saved to docker-secrets"
    else
      echo "⚠️  Token creation failed (non-fatal, will attempt without it)"
    fi
  else
    echo "⚠️  Elasticsearch not running - skipping token pre-generation"
  fi
  
  # Now start the full stack with token already available in docker-secrets
  echo ""
  echo "🚀 Starting full stack (Phase 2)..."
  (cd "$ROOT_DIR" && compose --env-file docker-secrets up -d)
  
  echo ""
  echo "⏳ Waiting for core services..."
  sleep 5
  
  # Load environment variables from docker-secrets
  load_env_file "$SECRETS_FILE"
  
  echo ""
  echo "🔧 Running deployment initialization..."

  if ! wait_for_running_container "dogparkpals-backend" 180 3; then
    echo "❌ Backend container did not reach running state in time."
    exit 1
  fi
  
  echo "Checking container health..."
  if check_container_health "dogparkpals-backend" 30; then
    echo "✅ Backend container is healthy"
  else
    echo "❌ Backend container failed health check"
    echo "   Check logs: docker logs dogparkpals-backend"
    exit 1
  fi
  
  wait_for_url "Backend" "$BACKEND_URL/health" 120
  
  # Kibana is optional - if it times out, continue anyway
  local KIBANA_AVAILABLE=false
  if docker ps | grep -q "dogparkpals-kibana"; then
    echo ""
    if wait_for_url "Kibana" "$KIBANA_URL/api/status" 180 5 "" "" "true"; then
      KIBANA_AVAILABLE=true
    else
      echo "⚠️  Kibana not available yet (still initializing)"
      echo "   This is normal - Kibana can take 5-10 minutes on first start"
      echo "   You can check later: docker logs dogparkpals-kibana"
      KIBANA_AVAILABLE=false
    fi
  else
    echo "⚠️  Kibana not running - skipping Kibana setup"
    KIBANA_AVAILABLE=false
  fi
  
  echo ""
  echo "1) Seeding production database"
  echo "🌱 Seeding production database..."
  
  # Run seed script inside container
  if [ -t 0 ]; then
    if docker exec -it dogparkpals-backend sh -c "cd /app && npx tsx prisma/seedProduction.ts"; then
      echo "✅ Database seeded successfully!"
    else
      echo "❌ Database seeding failed"
      exit 1
    fi
  else
    if docker exec -i dogparkpals-backend sh -c "cd /app && npx tsx prisma/seedProduction.ts"; then
      echo "✅ Database seeded successfully!"
    else
      echo "❌ Database seeding failed"
      exit 1
    fi
  fi
  
  # Only setup Kibana if it's available
  if [ "$KIBANA_AVAILABLE" = "true" ]; then
    echo ""
    echo "2) Initializing Kibana + Elasticsearch template/ILM"
    if bash "$ROOT_DIR/kibana/setup-kibana.sh"; then
      echo "✅ Kibana setup complete"
    else
      echo "⚠️  Kibana setup had issues - you may need to run it manually later"
      echo "   Command: bash kibana/setup-kibana.sh"
    fi
  else
    echo ""
    echo "2) Skipping Kibana setup (not available yet)"
    echo "   Once Kibana is ready, you can run: bash kibana/setup-kibana.sh"
  fi

  echo ""
  echo "✅ Stack startup complete!"
  echo ""
  echo "Access points:"
  echo "  Frontend:  https://localhost:5173"
  echo "  Backend:   https://localhost:3000"
  echo "  Kibana:    https://localhost:5601 (if running, may take 2-5 minutes)"
  echo "  Grafana:   https://localhost:3001"
  echo "  Prometheus: https://localhost:9090"
  echo ""
  echo "Useful commands:"
  echo "  View logs:          ${COMPOSE_CMD[*]} logs -f"
  echo "  Check status:       ${COMPOSE_CMD[*]} ps"
  echo "  Stop observability: ./scripts/stack.sh --obs-down"
  echo "  Full cleanup:       ./scripts/stack.sh --clean"
}

run_core_only() {
  echo "🚀 Starting core DogParkPals services (no observability)..."
  echo ""
  ensure_secrets_file
  validate_observability_secrets
  ensure_certificates true

  echo "🔨 Building Docker images..."
  (cd "$ROOT_DIR" && compose --env-file docker-secrets build backend frontend db-init)
  
  echo ""
  echo "🚀 Starting core containers..."
  (cd "$ROOT_DIR" && compose --env-file docker-secrets up -d backend frontend rabbitmq db-init)
  
  echo ""
  echo "⏳ Waiting for services..."
  sleep 10
  
  echo ""
  echo "🌱 Seeding database..."

  if ! wait_for_running_container "dogparkpals-backend" 180 3; then
    echo "❌ Backend container did not reach running state in time."
    exit 1
  fi
  
  # Run seed script inside container
  if [ -t 0 ]; then
    if docker exec -it dogparkpals-backend sh -c "cd /app && npx tsx prisma/seedProduction.ts"; then
      echo "✅ Database seeded successfully!"
    else
      echo "⚠️  Database seeding had issues"
    fi
  else
    if docker exec -i dogparkpals-backend sh -c "cd /app && npx tsx prisma/seedProduction.ts"; then
      echo "✅ Database seeded successfully!"
    else
      echo "⚠️  Database seeding had issues"
    fi
  fi

  echo ""
  echo "✅ Core services started!"
  echo ""
  echo "Access points:"
  echo "  Frontend:  https://localhost:5173"
  echo "  Backend:   https://localhost:3000"
  echo ""
  echo "Note: Observability services not started (fast, low-resource mode)"
  echo "To start full stack with monitoring, use: ./scripts/stack.sh --fresh"
}

run_obs_down() {
  echo "🛑 Stopping observability services..."
  ensure_secrets_file
  ensure_certificates false

  (cd "$ROOT_DIR" && compose --env-file docker-secrets stop "${OBS_SERVICES[@]}")

  echo ""
  echo "✅ Observability stack stopped"
}

run_clean() {
  echo "🧹 Stopping and cleaning DogParkPals stack..."
  ensure_secrets_file

  (cd "$ROOT_DIR" && compose --env-file docker-secrets down -v --remove-orphans --rmi local)

  echo ""
  echo "🗑️  Running system-wide Docker cleanup..."
  docker system prune --all --volumes --force

  echo ""
  echo "✅ All containers, images, volumes, and build cache removed"
}

main() {
  ensure_repo_root
  check_requirements
  detect_compose_cmd

  if [ "$#" -ne 1 ]; then
    print_usage
    exit 1
  fi

  case "$1" in
    --fresh|-f)
      run_fresh
      ;;
    --core-only|-co)
      run_core_only
      ;;
    --obs-down|-o)
      run_obs_down
      ;;
    --clean|-c)
      run_clean
      ;;
    --help|-h)
      print_usage
      ;;
    *)
      echo "❌ Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
}

main "$@"
