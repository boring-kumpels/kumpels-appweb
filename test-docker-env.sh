#!/bin/bash

echo "🧪 Testing Docker environment variable passing..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
set -a
source .env
set +a

# Verify environment variables are loaded
echo "🔍 Verifying environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi
echo "✅ Environment variables loaded successfully"

# Check Docker permissions
if ! docker ps > /dev/null 2>&1; then
    echo "⚠️  Docker permission issue detected. Using sudo..."
    DOCKER_COMPOSE_CMD="sudo -E docker-compose"
else
    echo "✅ Docker permissions OK"
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Test environment variable passing to Docker
echo "🐳 Testing Docker environment variable passing..."

# Create a temporary docker-compose file for testing
cat > docker-compose.test.yml << 'EOF'
version: '3.8'
services:
  test:
    image: alpine:latest
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    command: env | grep -E "(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)"
EOF

echo "📋 Testing with docker-compose..."
$DOCKER_COMPOSE_CMD -f docker-compose.test.yml up --abort-on-container-exit

# Clean up
rm -f docker-compose.test.yml

echo ""
echo "✅ Docker environment variable test complete" 