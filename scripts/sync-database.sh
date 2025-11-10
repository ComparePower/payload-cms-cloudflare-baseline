#!/bin/bash
set -e

# Sync local D1 database DATA to remote (assumes schema already deployed)
echo "🔄 Syncing local D1 database DATA to remote..."
echo "ℹ️  Note: This syncs data only. Run 'pnpm run deploy:database' first to ensure schema is up to date."

# Set the database name and backup file
DB_NAME="payload-cms-cloudflare-baseline"
BACKUP_FILE="./db-backup-$(date +%Y%m%d-%H%M%S).sql"

# Check if CLOUDFLARE_ENV is set
if [ -z "$CLOUDFLARE_ENV" ]; then
  echo "⚠️  Warning: CLOUDFLARE_ENV is not set. Using default environment."
  ENV_FLAG=""
else
  ENV_FLAG="--env=$CLOUDFLARE_ENV"
  echo "📍 Using environment: $CLOUDFLARE_ENV"
fi

# Export local database (data only, no schema)
echo "📦 Exporting local database data..."
wrangler d1 export "$DB_NAME" --local --no-schema --output="$BACKUP_FILE" $ENV_FLAG

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Failed to create backup file"
  exit 1
fi

echo "✅ Local database exported to $BACKUP_FILE"

# Ask for confirmation before uploading to remote
echo ""
echo "⚠️  WARNING: This will INSERT data into your REMOTE production database!"
echo "   Environment: ${CLOUDFLARE_ENV:-default}"
echo "   Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Sync cancelled. Backup file saved at $BACKUP_FILE"
  exit 0
fi

# Import to remote database
echo "📤 Importing to remote database..."
wrangler d1 execute "$DB_NAME" --remote --file="$BACKUP_FILE" $ENV_FLAG

echo "✅ Database synced successfully!"
echo "📝 Backup saved at: $BACKUP_FILE"
