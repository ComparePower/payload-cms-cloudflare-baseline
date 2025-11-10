#!/bin/bash
set -e

# Start local development with Doppler secrets
# Usage: ./scripts/dev.sh [environment]
# Example: ./scripts/dev.sh dev

ENVIRONMENT=${1:-dev}

echo "🚀 Starting local development..."
echo "   Environment: $ENVIRONMENT"
echo ""

# Map environment to Doppler config
case $ENVIRONMENT in
  dev|development)
    DOPPLER_CONFIG="dev"
    ;;
  *)
    echo "❌ Error: Unknown environment '$ENVIRONMENT'"
    echo "   Supported: dev, development"
    exit 1
    ;;
esac

# Load Doppler token from .doppler-tokens file
TOKENS_FILE=".doppler-tokens"
if [ ! -f "$TOKENS_FILE" ]; then
  echo "❌ Error: $TOKENS_FILE not found"
  echo "   Create this file with your Doppler tokens:"
  echo "   DOPPLER_TOKEN_DEV:dp.st.dev.xxx"
  echo "   DOPPLER_TOKEN_PROD:dp.st.prd.xxx"
  exit 1
fi

DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_DEV:" "$TOKENS_FILE" | cut -d':' -f2)

if [ -z "$DOPPLER_TOKEN" ]; then
  echo "❌ Error: Could not find Doppler token for dev environment"
  echo "   Check $TOKENS_FILE has DOPPLER_TOKEN_DEV"
  exit 1
fi

export DOPPLER_TOKEN

echo "═══════════════════════════════════════════"
echo "STEP 1: Killing any process on port 3000"
echo "═══════════════════════════════════════════"

# Find and kill any process using port 3000
PORT=3000
PID=$(lsof -ti:$PORT 2>/dev/null || echo "")

if [ -n "$PID" ]; then
  echo "Found process $PID on port $PORT, killing it..."
  kill -9 $PID 2>/dev/null || true
  sleep 1
  echo "✅ Port $PORT is now free"
else
  echo "✅ Port $PORT is already free"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "STEP 2: Loading secrets from Doppler"
echo "═══════════════════════════════════════════"

# Show what secrets will be loaded (masked)
echo "📋 Doppler secrets to be loaded:"
doppler secrets --json 2>/dev/null | jq -r 'keys[]' | while read -r key; do
  echo "   • $key"
done

echo ""
echo "═══════════════════════════════════════════"
echo "STEP 3: Starting Next.js dev server"
echo "═══════════════════════════════════════════"
echo ""

# Run Next.js dev server with Doppler secrets injected
# Use pnpm exec to ensure cross-env is in PATH
doppler run -- pnpm exec cross-env NODE_OPTIONS=--no-deprecation next dev
