#!/bin/bash

# DogParkPals Docker Setup Script
# ================================

set -e

echo "🐕 DogParkPals Docker Setup"
echo "=========================="
echo ""

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
    if [ ! -f "certs/server.crt" ]; then
        return 1
    fi

    openssl x509 -in certs/server.crt -noout -text 2>/dev/null | grep -q "DNS:localhost"
}

# Generate SSL certificates if they don't exist
if [ ! -f "certs/server.crt" ] || [ ! -f "certs/server.key" ] || ! server_cert_has_san; then
    echo "🔐 Generating SSL certificates..."
    rm -rf certs
    mkdir -p certs
    cd certs
    
    # Backend server certificate
    generate_cert_with_san "server" "localhost" "DNS:localhost,IP:127.0.0.1"
    
    # Observability services certificates
    generate_cert_with_san "prometheus" "prometheus" "DNS:prometheus,DNS:localhost,IP:127.0.0.1"
    generate_cert_with_san "grafana" "grafana" "DNS:grafana,DNS:localhost,IP:127.0.0.1"
    generate_cert_with_san "elasticsearch" "elasticsearch" "DNS:elasticsearch,DNS:localhost,IP:127.0.0.1"
    generate_cert_with_san "kibana" "kibana" "DNS:kibana,DNS:localhost,IP:127.0.0.1"
    generate_cert_with_san "rabbitmq" "rabbitmq" "DNS:rabbitmq,DNS:localhost,IP:127.0.0.1"
    
    # Set permissions so containers can read the keys
    chmod 644 *.key *.crt
    
    cd ..
    echo "✅ SSL certificates generated (backend + observability)"
    echo ""
else
    echo "✅ SSL certificates already exist"
    echo ""
fi

# Check if docker-secrets exists
if [ ! -f "docker-secrets" ]; then
    echo "⚠️  docker-secrets file not found!"
    echo ""
    echo "Creating docker-secrets from example..."
    cp docker-secrets-example docker-secrets
    echo ""
    echo "✅ docker-secrets created"
    echo ""
    echo "⚠️  IMPORTANT: For production use, consider updating:"
    echo "   - GOOGLE_CLIENT_ID (if using OAuth)"
    echo "   - GOOGLE_CLIENT_SECRET (if using OAuth)"
    echo "   Note: JWT_SECRET and ELASTIC_PASSWORD will be auto-generated if needed"
    echo ""
fi

# Basic validation - detailed auth setup is handled by stack.sh
if [ -f "docker-secrets" ]; then
    echo "✅ docker-secrets file found"
    echo ""
fi

# Build and start containers
echo ""
echo "🔨 Building Docker images..."
docker compose --env-file docker-secrets build

echo ""
echo "🚀 Starting containers..."
docker compose --env-file docker-secrets up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Docker setup complete!"
echo ""
echo "Services running:"
echo "  - Backend:  https://localhost:3000"
echo "  - Frontend: https://localhost:5173"
echo ""
echo "Note: You'll see certificate warnings for self-signed certificates"
echo ""
echo "Useful commands:"
echo "  - View logs:     docker compose --env-file docker-secrets logs -f"
echo "  - Stop:          docker compose down"
echo "  - Restart:       docker compose --env-file docker-secrets restart"
echo "  - Shell access:  docker exec -it dogparkpals-backend sh"
echo ""
