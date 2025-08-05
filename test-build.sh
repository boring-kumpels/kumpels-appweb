#!/bin/bash

echo "🧪 Testing build process..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your Supabase configuration."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Test if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env"
    exit 1
fi

echo "✅ Environment variables loaded successfully"

# Test Docker build
echo "🐳 Testing Docker build..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  --build-arg DIRECT_URL="$DIRECT_URL" \
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-arg NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET="$NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET" \
  -t kumpels-app-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
else
    echo "❌ Docker build failed!"
    exit 1
fi

echo "🎉 Build test completed successfully!" 