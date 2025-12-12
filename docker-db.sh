#!/bin/bash

# DogParkPals PostgreSQL Database Management Script
# Usage: ./docker-db.sh [start|stop|restart|status]
# Requires: .docker-secrets file with DB credentials

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS_FILE="$SCRIPT_DIR/.docker-secrets"
CONTAINER_NAME="postgres-dogparkpals"

# Load secrets from file
if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Error: $SECRETS_FILE not found!"
  echo "Please create a .docker-secrets file with the following content:"
  echo ""
  echo "DB_NAME=dog_park_pals"
  echo "DB_USER=postgres"
  echo "DB_PASSWORD=your_secure_password"
  echo "DB_PORT=5432"
  echo ""
  exit 1
fi

source "$SECRETS_FILE"

# Validate required variables
if [[ -z "$DB_NAME" || -z "$DB_USER" || -z "$DB_PASSWORD" || -z "$DB_PORT" ]]; then
  echo "Error: Missing required variables in $SECRETS_FILE"
  echo "Required: DB_NAME, DB_USER, DB_PASSWORD, DB_PORT"
  exit 1
fi

function start_db() {
  echo "Starting PostgreSQL container..."
  
  # Check if container already exists
  if sudo docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Container already exists. Starting..."
    sudo docker start "$CONTAINER_NAME"
  else
    echo "Creating new PostgreSQL container..."
    sudo docker run \
      --name "$CONTAINER_NAME" \
      -e POSTGRES_DB="$DB_NAME" \
      -e POSTGRES_USER="$DB_USER" \
      -e POSTGRES_PASSWORD="$DB_PASSWORD" \
      -p "$DB_PORT":5432 \
      -d \
      postgres:latest
  fi
  
  echo "Waiting for PostgreSQL to be ready..."
  sleep 5
  echo "PostgreSQL is running on localhost:$DB_PORT"
}

function stop_db() {
  echo "Stopping PostgreSQL container..."
  
  if sudo docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    sudo docker stop "$CONTAINER_NAME"
    echo "PostgreSQL container stopped."
  else
    echo "Container is not running."
  fi
}

function restart_db() {
  echo "Restarting PostgreSQL container..."
  stop_db
  sleep 2
  start_db
}

function status_db() {
  echo "Checking PostgreSQL container status..."
  
  if sudo docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✓ PostgreSQL is running"
    sudo docker ps --filter "name=$CONTAINER_NAME"
  elif sudo docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✗ PostgreSQL container exists but is not running"
    sudo docker ps -a --filter "name=$CONTAINER_NAME"
  else
    echo "✗ PostgreSQL container does not exist"
  fi
}

# Main script logic
case "${1:-start}" in
  start)
    start_db
    ;;
  stop)
    stop_db
    ;;
  restart)
    restart_db
    ;;
  status)
    status_db
    ;;
  *)
    echo "Usage: $0 [start|stop|restart|status]"
    echo ""
    echo "Commands:"
    echo "  start   - Start the PostgreSQL container (create if needed)"
    echo "  stop    - Stop the PostgreSQL container"
    echo "  restart - Restart the PostgreSQL container"
    echo "  status  - Show container status"
    exit 1
    ;;
esac
