#!/bin/bash

# Step-by-step deployment script for debugging
# Run each step individually to identify issues

set -e

echo "🚀 Kumpels App Step-by-Step Deployment"
echo "======================================"

# Step 1: Check .env file
echo ""
echo "Step 1: Checking .env file..."
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi
echo "✅ .env file found"

# Step 2: Load environment variables
echo ""
echo "Step 2: Loading environment variables..."
set -a
source .env
set +a

# Step 3: Verify environment variables
echo ""
echo "Step 3: Verifying environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set"
    exit 1
fi
echo "✅ Environment variables loaded successfully"

# Step 4: Stop existing containers
echo ""
echo "Step 4: Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo "✅ Containers stopped"

# Step 5: Build Docker image
echo ""
echo "Step 5: Building Docker image..."
echo "This may take several minutes..."
docker-compose -f docker-compose.prod.yml build
echo "✅ Docker image built successfully"

# Step 6: Start containers
echo ""
echo "Step 6: Starting containers..."
docker-compose -f docker-compose.prod.yml up -d
echo "✅ Containers started"

# Step 7: Wait for services
echo ""
echo "Step 7: Waiting for services to be ready..."
sleep 30

# Step 8: Check health
echo ""
echo "Step 8: Checking application health..."
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