#!/bin/bash
set -e

# Pull remote R2 images to local
echo "🔽 Pulling remote R2 images to local..."

# Set the bucket name
BUCKET_NAME="R2"
LOCAL_R2_PATH=".wrangler/state/v3/r2/payload-cms-cloudflare-baseline/blobs"
TEMP_DOWNLOAD_DIR="./r2-download-temp"

# Check if CLOUDFLARE_ENV is set
if [ -z "$CLOUDFLARE_ENV" ]; then
  echo "⚠️  Warning: CLOUDFLARE_ENV is not set. Using default environment."
  ENV_FLAG=""
else
  ENV_FLAG="--env=$CLOUDFLARE_ENV"
  echo "📍 Using environment: $CLOUDFLARE_ENV"
fi

# Create local R2 directory if it doesn't exist
mkdir -p "$LOCAL_R2_PATH"

# Create temp download directory
mkdir -p "$TEMP_DOWNLOAD_DIR"

# List remote objects
echo "📦 Listing remote R2 objects..."
OBJECT_LIST=$(wrangler r2 object list "$BUCKET_NAME" $ENV_FLAG --json 2>/dev/null || echo "[]")

# Count objects
OBJECT_COUNT=$(echo "$OBJECT_LIST" | grep -o '"key"' | wc -l | tr -d ' ')

if [ "$OBJECT_COUNT" -eq 0 ]; then
  echo "ℹ️  No objects found in remote R2 bucket."
  rm -rf "$TEMP_DOWNLOAD_DIR"
  exit 0
fi

echo "📦 Found $OBJECT_COUNT object(s) to download"

# Ask for confirmation before downloading
echo ""
echo "⚠️  WARNING: This will download files from REMOTE R2 bucket to your local development!"
echo "   Environment: ${CLOUDFLARE_ENV:-default}"
echo "   Objects: $OBJECT_COUNT"
echo "   Destination: $LOCAL_R2_PATH"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Pull cancelled."
  rm -rf "$TEMP_DOWNLOAD_DIR"
  exit 0
fi

# Download each object
echo "📥 Downloading files from remote R2..."
DOWNLOAD_COUNT=0

# Parse JSON and download each object
echo "$OBJECT_LIST" | grep -o '"key":"[^"]*"' | sed 's/"key":"//;s/"$//' | while read -r key; do
  if [ -n "$key" ]; then
    # Download to temp directory
    TEMP_FILE="$TEMP_DOWNLOAD_DIR/$(basename "$key")"

    if wrangler r2 object get "$BUCKET_NAME/$key" --file="$TEMP_FILE" $ENV_FLAG > /dev/null 2>&1; then
      # Move to local R2 storage
      mv "$TEMP_FILE" "$LOCAL_R2_PATH/$(basename "$key")"
      DOWNLOAD_COUNT=$((DOWNLOAD_COUNT + 1))
      echo "   ✓ Downloaded: $key"
    else
      echo "   ✗ Failed: $key"
    fi
  fi
done

# Cleanup
rm -rf "$TEMP_DOWNLOAD_DIR"

echo ""
echo "✅ Image pull completed!"
echo "📝 Downloaded $DOWNLOAD_COUNT file(s) to $LOCAL_R2_PATH"
