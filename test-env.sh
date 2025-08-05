#!/bin/bash

echo "🧪 Testing environment variable loading..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "📋 Loading environment variables..."
set -a  # automatically export all variables
source .env
set +a  # stop automatically exporting

echo "🔍 Checking environment variables..."

# Check required variables
variables=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "DATABASE_URL"
    "DIRECT_URL"
    "NEXT_PUBLIC_SITE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET"
)

all_good=true

for var in "${variables[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is not set"
        all_good=false
    else
        echo "✅ $var is set"
    fi
done

if [ "$all_good" = true ]; then
    echo ""
    echo "🎉 All environment variables are loaded correctly!"
    echo ""
    echo "📋 Environment variable summary:"
    echo "   NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:20}..."
    echo "   DATABASE_URL: ${DATABASE_URL:0:20}..."
    echo "   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
else
    echo ""
    echo "❌ Some environment variables are missing!"
    exit 1
fi 