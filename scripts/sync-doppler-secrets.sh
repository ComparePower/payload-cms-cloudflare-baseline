#!/bin/bash
set -e

# Sync Doppler secrets to Wrangler secrets using bulk upload
# Usage: ./scripts/sync-doppler-secrets.sh [doppler-config] [wrangler-env]
# Example: ./scripts/sync-doppler-secrets.sh production production

DOPPLER_CONFIG=${1:-production}
WRANGLER_ENV=${2:-production}

echo "🔐 Syncing Doppler secrets to Wrangler..."
echo "   Doppler config: $DOPPLER_CONFIG"
echo "   Wrangler env: $WRANGLER_ENV"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "❌ Error: jq is not installed"
  echo "   Install with: brew install jq"
  exit 1
fi

# Load Doppler token from .doppler-tokens file
TOKENS_FILE=".doppler-tokens"
if [ ! -f "$TOKENS_FILE" ]; then
  echo "❌ Error: $TOKENS_FILE not found"
  echo "   Create this file with your Doppler tokens:"
  echo "   DOPPLER_TOKEN_DEV:dp.st.dev.xxx"
  echo "   DOPPLER_TOKEN_PROD:dp.st.prd.xxx"
  exit 1
fi

# Select the appropriate token based on config
if [ "$DOPPLER_CONFIG" = "dev" ]; then
  DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_DEV:" "$TOKENS_FILE" | cut -d':' -f2)
elif [ "$DOPPLER_CONFIG" = "production" ] || [ "$DOPPLER_CONFIG" = "prd" ]; then
  DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_PROD:" "$TOKENS_FILE" | cut -d':' -f2)
else
  echo "❌ Error: Unknown Doppler config '$DOPPLER_CONFIG'"
  echo "   Supported configs: dev, production (or prd)"
  exit 1
fi

if [ -z "$DOPPLER_TOKEN" ]; then
  echo "❌ Error: Could not find Doppler token for config '$DOPPLER_CONFIG'"
  echo "   Check $TOKENS_FILE has the correct token"
  exit 1
fi

export DOPPLER_TOKEN

# Build wrangler env flag
if [ "$WRANGLER_ENV" != "default" ]; then
  ENV_FLAG="--env=$WRANGLER_ENV"
else
  ENV_FLAG=""
fi

echo "📤 Bulk uploading secrets from Doppler..."

# Use Doppler's official bulk sync method
# This syncs ALL secrets from the Doppler config to Cloudflare Workers
doppler secrets --json | \
  jq -c 'with_entries(.value = .value.computed)' | \
  wrangler secret bulk $ENV_FLAG

echo ""
echo "✅ Doppler secrets synced to Wrangler!"
echo ""
echo "💡 What was synced:"
echo "   - All secrets from Doppler config: $DOPPLER_CONFIG"
echo "   - Uploaded to Wrangler environment: $WRANGLER_ENV"
echo ""
echo "💡 Run this script whenever you:"
echo "   - Add new secrets to Doppler"
echo "   - Change secret values in Doppler"
echo "   - Set up a new environment"
echo ""
echo "⚠️  Note: This syncs ALL secrets. Cloudflare Workers will only"
echo "   use secrets that your code references (like PAYLOAD_SECRET)"
