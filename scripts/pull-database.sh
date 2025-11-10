#!/bin/bash
set -e

# Pull remote D1 database to local
echo "🔽 Pulling remote D1 database to local..."

# Set the database name and backup file
DB_NAME="payload-cms-cloudflare-baseline"
BACKUP_FILE="./db-pull-$(date +%Y%m%d-%H%M%S).sql"

# Check if CLOUDFLARE_ENV is set
if [ -z "$CLOUDFLARE_ENV" ]; then
  echo "⚠️  Warning: CLOUDFLARE_ENV is not set. Using default environment."
  ENV_FLAG=""
else
  ENV_FLAG="--env=$CLOUDFLARE_ENV"
  echo "📍 Using environment: $CLOUDFLARE_ENV"
fi

# Export remote database
echo "📦 Exporting remote database..."
wrangler d1 export "$DB_NAME" --remote --output="$BACKUP_FILE" $ENV_FLAG

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Failed to create backup file"
  exit 1
fi

echo "✅ Remote database exported to $BACKUP_FILE"

# Ask for confirmation before overwriting local
echo ""
echo "⚠️  WARNING: This will OVERWRITE your LOCAL development database!"
echo "   Environment: ${CLOUDFLARE_ENV:-default}"
echo "   Backup file: $BACKUP_FILE"
echo "   This will replace all data in: .wrangler/state/v3/d1/"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Pull cancelled. Remote backup saved at $BACKUP_FILE"
  exit 0
fi

# Import to local database
echo "📥 Importing to local database..."
wrangler d1 execute "$DB_NAME" --local --file="$BACKUP_FILE" $ENV_FLAG

echo "✅ Database pulled successfully!"
echo "📝 Remote backup saved at: $BACKUP_FILE"
echo "ℹ️  Your local development database is now synced with remote."
