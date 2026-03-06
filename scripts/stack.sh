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
  ./scripts/stack.sh --obs-down    Stop observability services only
  ./scripts/stack.sh --clean       Stop all services and remove app volumes/images
  ./scripts/stack.sh --help
EOF
}

check_requirements() {
  local missing=0
  
  for cmd in docker docker-compose openssl curl; do
    if ! command -v "$cmd" &> /dev/null; then
      echo "❌ Missing required command: $cmd"
      missing=1
    fi
  done
  
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

ensure_certificates() {
  local certs_dir="$ROOT_DIR/certs"
  local required_certs=(server.crt server.key elasticsearch.crt elasticsearch.key kibana.crt kibana.key prometheus.crt prometheus.key grafana.crt grafana.key rabbitmq.crt rabbitmq.key)
  
  local missing=0
  for cert in "${required_certs[@]}"; do
    if [ ! -f "$certs_dir/$cert" ]; then
      missing=1
      break
    fi
  done
  
  if [ "$missing" -eq 1 ]; then
    echo "🔐 Generating SSL certificates..."
    mkdir -p "$certs_dir" || { echo "❌ Failed to create certs directory"; exit 1; }
    
    cd "$certs_dir" || { echo "❌ Failed to change to certs directory"; exit 1; }
    
    openssl req -x509 -newkey rsa:2048 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=localhost/O=DogParkPals/C=US" 2>&1 || { echo "❌ Failed to generate server certificate"; exit 1; }
    openssl req -x509 -newkey rsa:2048 -keyout prometheus.key -out prometheus.crt -days 365 -nodes -subj "/CN=prometheus/O=DogParkPals/C=US" 2>&1 || { echo "❌ Failed to generate prometheus certificate"; exit 1; }
    openssl req -x509 -newkey rsa:2048 -keyout grafana.key -out grafana.crt -days 365 -nodes -subj "/CN=grafana/O=DogParkPals/C=US" 2>&1 || { echo "❌ Failed to generate grafana certificate"; exit 1; }
    openssl req -x509 -newkey rsa:2048 -keyout elasticsearch.key -out elasticsearch.crt -days 365 -nodes -subj "/CN=elasticsearch/O=DogParkPals/C=US" 2>&1 || { echo "❌ Failed to generate elasticsearch certificate"; exit 1; }
    openssl req -x509 -newkey rsa:2048 -keyout kibana.key -out kibana.crt -days 365 -nodes -subj "/CN=kibana/O=DogParkPals/C=US" 2>&1 || { echo "❌ Failed to generate kibana certificate"; exit 1; }
    openssl req -x509 -newkey rsa:2048 -keyout rabbitmq.key -out rabbitmq.crt -days 365 -nodes -subj "/CN=rabbitmq/O=DogParkPals/C=US" 2>&1 || { echo "❌ Failed to generate rabbitmq certificate"; exit 1; }
    
    cd "$ROOT_DIR" || exit 1
    
    echo "✅ SSL certificates generated"
    echo ""
  fi
}

run_fresh() {
  echo "🚀 Starting full DogParkPals stack..."
  ensure_secrets_file

  echo ""
  echo "📝 Running docker setup (certificates, build, start)..."
  if ! (cd "$ROOT_DIR" && bash "$SCRIPT_DIR/docker-setup.sh"); then
    echo "❌ Failed during docker setup"
    exit 1
  fi

  echo ""
  echo "🔧 Running deployment initialization (seeding, Kibana setup, test logs)..."
  if ! (cd "$ROOT_DIR" && bash "$SCRIPT_DIR/deployment-init.sh"); then
    echo "❌ Failed during deployment initialization"
    exit 1
  fi

  echo ""
  echo "✅ Fresh startup + seeding complete"
}

run_obs_down() {
  echo "🛑 Stopping observability services..."
  ensure_secrets_file

  (cd "$ROOT_DIR" && docker compose --env-file docker-secrets stop "${OBS_SERVICES[@]}")

  echo ""
  echo "✅ Observability stack stopped"
}

run_clean() {
  echo "🧹 Stopping and cleaning DogParkPals stack..."
  ensure_secrets_file

  (cd "$ROOT_DIR" && docker compose --env-file docker-secrets down -v --remove-orphans --rmi local)

  echo ""
  echo "✅ All app containers, local images, and volumes removed"
}

main() {
  ensure_repo_root
  check_requirements
  ensure_certificates

  if [ "$#" -ne 1 ]; then
    print_usage
    exit 1
  fi

  case "$1" in
    --fresh|-f)
      run_fresh
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
