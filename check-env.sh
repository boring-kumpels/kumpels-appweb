#!/bin/bash

# Script to check and validate environment variables

echo "🔍 Checking environment configuration..."

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file from env.example:"
    echo "   cp env.example .env"
    echo "   nano .env"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check required variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "DIRECT_URL"
    "NEXT_PUBLIC_SITE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET"
)

MISSING_VARS=()
EMPTY_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env; then
        MISSING_VARS+=("$var")
    elif grep -q "^${var}=$" .env || grep -q "^${var}=\"\"$" .env; then
        EMPTY_VARS+=("$var")
    else
        echo "✅ $var is set"
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo ""
    echo "❌ Missing variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
fi

if [ ${#EMPTY_VARS[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Empty variables:"
    for var in "${EMPTY_VARS[@]}"; do
        echo "   - $var"
    done
fi

if [ ${#MISSING_VARS[@]} -gt 0 ] || [ ${#EMPTY_VARS[@]} -gt 0 ]; then
    echo ""
    echo "🔧 Please update your .env file with the missing/empty variables."
    echo "You can find examples in env.example"
    echo ""
    echo "📚 For Supabase setup, see: SUPABASE-SETUP.md"
    exit 1
else
    echo ""
    echo "✅ All required environment variables are configured!"
fi

# Test .env loading
echo ""
echo "🧪 Testing environment loading..."
set -a
source .env
set +a

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$DATABASE_URL" ]; then
    echo "✅ Environment variables loaded successfully"
else
    echo "❌ Failed to load environment variables"
    exit 1
fi

echo ""
echo "🎉 Environment configuration is valid!"