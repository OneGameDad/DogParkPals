#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
SECRETS_FILE="$ROOT_DIR/docker-secrets"
SECRETS_EXAMPLE_FILE="$ROOT_DIR/docker-secrets-example"

OBS_SERVICES=(elasticsearch logstash kibana prometheus grafana rabbitmq-exporter)

# Error trap for better error reporting
trap 'echo "❌ Command failed on line $LINENO"; exit 1' ERR

print_usage() {
  cat <<EOF
DogParkPals stack control

Usage:
  ./scripts/stack.sh --fresh       Start full stack and run deployment initialization + seeding
  ./scripts/stack.sh --core-only   Start core app only (backend, frontend, no observability)
  ./scripts/stack.sh --obs-down    Stop observability services only
  ./scripts/stack.sh --clean       Stop all services and remove app volumes/images
  ./scripts/stack.sh --help
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
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

fix_elasticsearch_auth() {
  local current_elastic_pass
  current_elastic_pass=$(secret_value "ELASTIC_PASSWORD" "$SECRETS_FILE")
  
  # Generate secure password if missing or using placeholder values
  if [ -z "$current_elastic_pass" ] || 
     [ "$current_elastic_pass" = "elastic" ] || 
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
    sed -i '/^ELASTICSEARCH_SERVICEACCOUNTTOKEN=/d' "$SECRETS_FILE"
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
  fix_jwt_secret
  fix_elasticsearch_auth
  require_nonempty_secret "ELASTIC_PASSWORD" "$SECRETS_FILE"
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
  local required_certs=(server.crt server.key elasticsearch.crt elasticsearch.key kibana.crt kibana.key prometheus.crt prometheus.key grafana.crt grafana.key rabbitmq.crt rabbitmq.key)
  
  local missing=0
  for cert in "${required_certs[@]}"; do
    if [ ! -f "$certs_dir/$cert" ]; then
      missing=1
      break
    fi
  done
  
  if [ "$missing" -eq 1 ] || [ "$force_regen" = "true" ] || ! server_cert_has_san; then
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
    echo ""
  fi
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
  (cd "$ROOT_DIR" && docker compose --env-file docker-secrets build)
  
  echo ""
  echo "🚀 Starting containers..."
  (cd "$ROOT_DIR" && docker compose --env-file docker-secrets up -d)
  
  echo ""
  echo "⏳ Waiting for core services..."
  sleep 5
  
  echo ""
  echo "🔧 Running deployment initialization (seeding, observability setup)..."
  if ! (cd "$ROOT_DIR" && bash "$SCRIPT_DIR/deployment-init.sh"); then
    echo "⚠️  Deployment initialization had issues (check logs above)"
    echo "   Core services (backend/frontend) should still be running"
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
  echo "  View logs:          docker compose logs -f"
  echo "  Check status:       docker compose ps"
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
  (cd "$ROOT_DIR" && docker compose --env-file docker-secrets build backend frontend db-init)
  
  echo ""
  echo "🚀 Starting core containers..."
  (cd "$ROOT_DIR" && docker compose --env-file docker-secrets up -d backend frontend rabbitmq db-init)
  
  echo ""
  echo "⏳ Waiting for services..."
  sleep 10
  
  echo ""
  echo "🌱 Seeding database..."
  if ! (cd "$ROOT_DIR" && bash "$SCRIPT_DIR/docker-seed.sh"); then
    echo "⚠️  Database seeding had issues"
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

  (cd "$ROOT_DIR" && docker compose --env-file docker-secrets stop "${OBS_SERVICES[@]}")

  echo ""
  echo "✅ Observability stack stopped"
}

run_clean() {
  echo "🧹 Stopping and cleaning DogParkPals stack..."
  ensure_secrets_file

  (cd "$ROOT_DIR" && docker compose --env-file docker-secrets down -v --remove-orphans --rmi local)

  echo ""
  echo "🗑️  Running system-wide Docker cleanup..."
  docker system prune --all --volumes --force

  echo ""
  echo "✅ All containers, images, volumes, and build cache removed"
}

main() {
  ensure_repo_root
  check_requirements

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
