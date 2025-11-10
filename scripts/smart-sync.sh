#!/bin/bash
set -e

# Parse arguments
SKIP_BACKUP=false
for arg in "$@"; do
  case $arg in
    --no-backup)
      SKIP_BACKUP=true
      shift
      ;;
  esac
done

# Smart sync: Upserts local changes to remote (doesn't overwrite entire DB)
echo "🔄 Smart sync: Upserting local changes to remote..."
echo ""
echo "This will:"
echo "  ✓ UPDATE existing remote records with local changes"
echo "  ✓ INSERT new local records that don't exist remotely"
echo "  ✓ Upload new/modified media files"
echo "  ✗ NOT delete remote records that don't exist locally"
echo "  ✗ NOT drop or recreate tables"
echo ""

# Read configuration from wrangler.jsonc
source "$(dirname "$0")/lib/read-wrangler-config.sh"
read_wrangler_config

echo "📋 Using configuration from wrangler.jsonc:"
echo "   Database: $DB_NAME"
echo "   Bucket: $BUCKET_NAME"
echo ""

# Set file paths
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
EXPORT_FILE="./db-export-$TIMESTAMP.sql"
UPSERT_FILE="./db-upsert-$TIMESTAMP.sql"
LOCAL_R2_PATH=".wrangler/state/v3/r2/$BUCKET_NAME/blobs"
BACKUP_DIR="backups"

# Check if CLOUDFLARE_ENV is set
if [ -z "$CLOUDFLARE_ENV" ]; then
  echo "⚠️  Warning: CLOUDFLARE_ENV is not set. Using default environment."
  ENV_FLAG=""
else
  ENV_FLAG="--env=$CLOUDFLARE_ENV"
  echo "📍 Using environment: $CLOUDFLARE_ENV"
fi

# ============================================
# PART 0: Backup Production (unless --no-backup)
# ============================================
if [ "$SKIP_BACKUP" = true ]; then
  echo "⚠️  Skipping production backup (--no-backup flag)"
  echo ""
else
  echo ""
  echo "💾 PART 0: Backing up production before sync"
  echo "═══════════════════════════════════════════"
  echo "ℹ️  Creating backup of production data before making changes..."
  echo ""

  # Create backup directory
  mkdir -p "$BACKUP_DIR"

  # Create a descriptive backup filename
  DATE=$(date +%Y-%m-%d)
  TIME=$(date +%H%M%S)
  ENV_NAME=${CLOUDFLARE_ENV:-default}
  BACKUP_DB_FILE="$BACKUP_DIR/prod-backup-${ENV_NAME}-${DATE}-${TIME}.sql"

  echo "📥 Downloading remote database..."
  if wrangler d1 export "$DB_NAME" --remote --output="$BACKUP_DB_FILE" $ENV_FLAG 2>&1 | tee /tmp/backup-output.txt | grep -q "successfully"; then
    echo "✅ Database backed up to: $BACKUP_DB_FILE"

    # Get backup file size and row count
    BACKUP_SIZE=$(ls -lh "$BACKUP_DB_FILE" | awk '{print $5}')
    ROW_COUNT=$(grep -c "INSERT" "$BACKUP_DB_FILE" 2>/dev/null || echo "0")

    # Create metadata JSON for this backup
    BACKUP_JSON="${BACKUP_DB_FILE%.sql}.json"
    cat > "$BACKUP_JSON" << JSONEOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "local_time": "$(date "+%Y-%m-%d %H:%M:%S")",
  "environment": "$ENV_NAME",
  "database_name": "$DB_NAME",
  "bucket_name": "$BUCKET_NAME",
  "sql_file": "$(basename "$BACKUP_DB_FILE")",
  "file_size": "$BACKUP_SIZE",
  "insert_statements": $ROW_COUNT,
  "wrangler_version": "$(wrangler --version 2>/dev/null | head -1 || echo 'unknown')",
  "backup_reason": "pre-sync-automatic"
}
JSONEOF

    echo "📋 Metadata saved to: $BACKUP_JSON"

    # Create a human-readable README in backups directory
    cat > "$BACKUP_DIR/README.md" << EOF
# Production Database Backups

These are automatic backups of the production database taken before syncing.

## Latest Backup
- **SQL File**: $(basename "$BACKUP_DB_FILE")
- **Metadata**: $(basename "$BACKUP_JSON")
- **Date**: $(date "+%Y-%m-%d %H:%M:%S")
- **Environment**: $ENV_NAME
- **Size**: $BACKUP_SIZE
- **Inserts**: $ROW_COUNT statements

## View Backup Metadata
\`\`\`bash
cat backups/$(basename "$BACKUP_JSON")
\`\`\`

## How to Restore

\`\`\`bash
# Restore to remote production
wrangler d1 execute $DB_NAME \\
  --remote \\
  --file=$BACKUP_DB_FILE

# Or restore to local dev
wrangler d1 execute $DB_NAME \\
  --local \\
  --file=$BACKUP_DB_FILE
\`\`\`

## Backups Are Committed to Git
These backups are tracked in git for safety. You can:
- Roll back to any previous backup
- See backup history: \`git log backups/\`
- Compare backups: \`git diff HEAD~1 backups/\`
EOF

  else
    echo "⚠️  Warning: Failed to backup remote database"
    read -p "Continue anyway? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      echo "❌ Smart sync cancelled."
      exit 0
    fi
  fi

  echo ""
  echo "💡 Backup saved to: $BACKUP_DB_FILE"
  echo "   This backup will be committed to git for safety"
  echo "   To skip backup in future: pnpm run sync -- --no-backup"
  echo ""
fi

# Ask for confirmation
echo ""
read -p "Continue with smart sync? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Smart sync cancelled."
  exit 0
fi

# ============================================
# PART 1: Database Upsert
# ============================================
echo ""
echo "📊 PART 1: Database Upsert"
echo "═══════════════════════════"

# Export local database (data only, no schema)
echo "📦 Exporting local database data..."
wrangler d1 export "$DB_NAME" --local --no-schema --output="$EXPORT_FILE" $ENV_FLAG

if [ ! -f "$EXPORT_FILE" ]; then
  echo "❌ Failed to create export file"
  exit 1
fi

echo "✅ Local database exported"

# Transform INSERT statements to INSERT OR REPLACE (SQLite upsert)
echo "🔧 Converting to upsert statements..."
sed 's/INSERT INTO/INSERT OR REPLACE INTO/g' "$EXPORT_FILE" > "$UPSERT_FILE"

if [ ! -f "$UPSERT_FILE" ]; then
  echo "❌ Failed to create upsert file"
  exit 1
fi

echo "✅ Upsert file created"

# Execute upsert on remote
echo "📤 Upserting data to remote database..."
wrangler d1 execute "$DB_NAME" --remote --file="$UPSERT_FILE" $ENV_FLAG

echo "✅ Database upserted successfully!"

# ============================================
# PART 2: Media Upload
# ============================================
echo ""
echo "📸 PART 2: Media Files"
echo "═══════════════════════════"

# Check if local R2 directory exists
if [ ! -d "$LOCAL_R2_PATH" ]; then
  echo "ℹ️  No local R2 directory found. Skipping media sync."
else
  # Find R2 metadata database
  R2_METADATA_DB=$(find .wrangler/state/v3/r2 -name "*.sqlite" -type f | head -1)

  if [ -z "$R2_METADATA_DB" ]; then
    echo "⚠️  Warning: Could not find R2 metadata database. Skipping media sync."
  else
    # Get key-to-blob mappings from R2 metadata
    MAPPINGS=$(sqlite3 "$R2_METADATA_DB" "SELECT key, blob_id FROM _mf_objects;" 2>/dev/null)

    if [ -z "$MAPPINGS" ]; then
      echo "ℹ️  No media files found to sync."
    else
      # Count mappings
      FILE_COUNT=$(echo "$MAPPINGS" | wc -l | tr -d ' ')
      echo "📦 Found $FILE_COUNT media file(s) to upload"
      echo "📤 Uploading to remote R2..."

      UPLOAD_COUNT=0

      # Process each mapping (key|blob_id)
      echo "$MAPPINGS" | while IFS='|' read -r key blob_id; do
        # Find the blob file
        BLOB_FILE="$LOCAL_R2_PATH/$blob_id"

        if [ -f "$BLOB_FILE" ]; then
          # Upload using the actual key (filename) not the blob hash
          if wrangler r2 object put "$BUCKET_NAME/$key" --file="$BLOB_FILE" --remote $ENV_FLAG > /dev/null 2>&1; then
            UPLOAD_COUNT=$((UPLOAD_COUNT + 1))
            echo "   ✓ Uploaded: $key"
          else
            echo "   ✗ Failed: $key"
          fi
        else
          echo "   ⚠️  Blob not found: $key (blob: $blob_id)"
        fi
      done

      echo "✅ Media files uploaded!"
    fi
  fi
fi

# ============================================
# Summary
# ============================================
echo ""
echo "═══════════════════════════════════════"
echo "✅ Smart sync completed!"
echo "═══════════════════════════════════════"
echo "📝 SQL files saved:"
echo "   - Original export: $EXPORT_FILE"
echo "   - Upsert version: $UPSERT_FILE"
echo ""
echo "💡 What happened:"
echo "   • Existing records were UPDATED with local changes"
echo "   • New records were INSERTED"
echo "   • Remote records not in local were LEFT UNTOUCHED"
echo "   • Media files were uploaded (overwriting if they existed)"
echo ""
