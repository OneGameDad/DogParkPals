#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
SECRETS_FILE="$ROOT_DIR/docker-secrets"
SECRETS_EXAMPLE_FILE="$ROOT_DIR/docker-secrets-example"

OBS_SERVICES=(elasticsearch logstash kibana prometheus grafana rabbitmq-exporter)

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

run_fresh() {
  echo "🚀 Starting full DogParkPals stack..."
  ensure_secrets_file

  (cd "$ROOT_DIR" && bash "$SCRIPT_DIR/docker-setup.sh")
  (cd "$ROOT_DIR" && bash "$SCRIPT_DIR/deployment-init.sh")

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
