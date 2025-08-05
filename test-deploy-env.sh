#!/bin/bash

echo "🧪 Testing deployment environment variable loading..."

# Simulate the deployment script environment
echo "📋 Simulating deployment script environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Load environment variables early - before any Docker operations
echo "📋 Loading environment variables..."
set -a  # automatically export all variables
source .env
set +a  # stop automatically exporting

# Verify key environment variables are loaded
echo "🔍 Verifying environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set"
    exit 1
fi
echo "✅ Environment variables loaded successfully"

# Check Docker permissions
echo "🔍 Checking Docker permissions..."
if ! docker ps > /dev/null 2>&1; then
    echo "⚠️  Docker permission issue detected. Using sudo with environment preservation..."
    DOCKER_COMPOSE_CMD="sudo -E docker-compose"
else
    echo "✅ Docker permissions OK"
    DOCKER_COMPOSE_CMD="docker-compose"
fi

echo "🐳 Docker compose command: $DOCKER_COMPOSE_CMD"

# Test environment variable availability
echo "🔍 Testing environment variable availability..."
echo "   NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:20}..."
echo "   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."

echo ""
echo "✅ Deployment environment test completed successfully!"
echo "   Environment variables are properly loaded and available for Docker operations." 