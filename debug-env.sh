#!/bin/bash

echo "🔍 Debugging environment variable loading..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "📋 .env file contents (without values):"
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
        # Extract variable name
        var_name=$(echo "$line" | cut -d'=' -f1)
        echo "   $var_name"
    fi
done < .env

echo ""
echo "📋 Testing different loading methods..."

echo "1. Using 'source .env':"
set -a
source .env
set +a
echo "   NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:20}..."

echo ""
echo "2. Using 'export \$(cat .env | grep -v '^#' | xargs)':"
export $(cat .env | grep -v '^#' | xargs)
echo "   NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:20}..."

echo ""
echo "3. Using 'set -a && source .env && set +a':"
set -a
source .env
set +a
echo "   NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:20}..."

echo ""
echo "🔍 Checking for common .env file issues..."

# Check for Windows line endings
if grep -q $'\r' .env; then
    echo "⚠️  Warning: .env file has Windows line endings (CRLF)"
    echo "   This might cause issues. Consider converting to Unix line endings (LF)"
fi

# Check for spaces around equals sign
if grep -q " = " .env; then
    echo "⚠️  Warning: .env file has spaces around equals signs"
    echo "   This might cause issues. Use format: VARIABLE=value"
fi

# Check for quotes
if grep -q "=" .env | grep -q "\""; then
    echo "ℹ️  Info: .env file contains quoted values"
fi

echo ""
echo "✅ Debug complete" 