#!/bin/bash
set -e

# Deploy to Cloudflare with automatic secret syncing
# Usage: ./scripts/deploy-with-secrets.sh [environment]
# Example: ./scripts/deploy-with-secrets.sh production

ENVIRONMENT=${1:-production}

echo "🚀 Deploying to Cloudflare with secret sync..."
echo "   Environment: $ENVIRONMENT"
echo ""

# Map environment to Doppler config and Wrangler env
case $ENVIRONMENT in
  dev|development)
    DOPPLER_CONFIG="dev"
    WRANGLER_ENV="dev"
    ;;
  prod|production)
    DOPPLER_CONFIG="production"
    WRANGLER_ENV="production"
    ;;
  *)
    echo "❌ Error: Unknown environment '$ENVIRONMENT'"
    echo "   Supported: dev, development, prod, production"
    exit 1
    ;;
esac

# Set CLOUDFLARE_ENV for other scripts
export CLOUDFLARE_ENV=$WRANGLER_ENV

echo "═══════════════════════════════════════════"
echo "STEP 1: Sync Secrets from Doppler"
echo "═══════════════════════════════════════════"
./scripts/sync-doppler-secrets.sh "$DOPPLER_CONFIG" "$WRANGLER_ENV"

echo ""
echo "═══════════════════════════════════════════"
echo "STEP 2: Deploy Database Schema"
echo "═══════════════════════════════════════════"

# Load Doppler token
TOKENS_FILE=".doppler-tokens"
if [ "$DOPPLER_CONFIG" = "dev" ]; then
  DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_DEV:" "$TOKENS_FILE" | cut -d':' -f2)
else
  DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_PROD:" "$TOKENS_FILE" | cut -d':' -f2)
fi
export DOPPLER_TOKEN

# Run migrations with Doppler env vars
echo "Running database migrations..."
doppler run -- pnpm exec cross-env NODE_ENV=production payload migrate

# Optimize database
echo "Optimizing database..."
wrangler d1 execute D1 --command 'PRAGMA optimize' --env=$WRANGLER_ENV --remote

echo ""
echo "═══════════════════════════════════════════"
echo "STEP 3: Deploy Application"
echo "═══════════════════════════════════════════"

# Build and deploy with Doppler env vars injected
echo "Building application..."
doppler run -- pnpm exec opennextjs-cloudflare build --env=$WRANGLER_ENV

echo "Deploying to Cloudflare Workers..."
doppler run -- pnpm exec opennextjs-cloudflare deploy --env=$WRANGLER_ENV

echo ""
echo "═══════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo "═══════════════════════════════════════════"
echo ""
echo "📝 What was deployed:"
echo "   • Secrets synced from Doppler ($DOPPLER_CONFIG)"
echo "   • Database schema migrated"
echo "   • Application deployed to Cloudflare ($WRANGLER_ENV)"
echo ""
echo "🌐 Your app should now be live!"
