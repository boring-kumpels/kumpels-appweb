#!/bin/bash

# Wrapper script that properly handles environment variables with sudo
# This script loads environment variables and then runs docker-compose commands

set -e

echo "🚀 Kumpels App Deployment with Environment Variables"
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Load environment variables
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

# Stop existing containers
echo "🛑 Stopping existing containers..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml down 2>/dev/null || true

# Build Docker image
echo "🔨 Building Docker image..."
echo "This may take several minutes..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build

# Start containers
echo "🚀 Starting containers..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "📊 Application URL: http://localhost"
    echo "🏥 Health Check: http://localhost/api/health"
else
    echo "❌ Application health check failed."
    echo "📋 Check logs with: $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs"
    exit 1
fi 