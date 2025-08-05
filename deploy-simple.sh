#!/bin/bash

# Simple deployment script for Kumpels App
# This script focuses on fixing the environment variable issue

set -e

echo "🚀 Starting Kumpels App deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your Supabase configuration."
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
set -a  # automatically export all variables
source .env
set +a  # stop automatically exporting

# Check if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env"
    exit 1
fi

echo "✅ Environment variables loaded successfully"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build with environment variables
echo "🔨 Building application..."
docker-compose -f docker-compose.prod.yml build

# Start containers
echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

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
    echo "📋 Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi