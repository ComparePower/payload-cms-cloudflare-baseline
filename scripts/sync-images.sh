#!/bin/bash
set -e

# Sync local R2 images to remote
echo "🔄 Syncing local R2 images to remote..."

# Set the bucket name
BUCKET_NAME="payload-cms-cloudflare-baseline"
LOCAL_R2_PATH=".wrangler/state/v3/r2/payload-cms-cloudflare-baseline/blobs"

# Check if CLOUDFLARE_ENV is set
if [ -z "$CLOUDFLARE_ENV" ]; then
  echo "⚠️  Warning: CLOUDFLARE_ENV is not set. Using default environment."
  ENV_FLAG=""
else
  ENV_FLAG="--env=$CLOUDFLARE_ENV"
  echo "📍 Using environment: $CLOUDFLARE_ENV"
fi

# Check if local R2 directory exists
if [ ! -d "$LOCAL_R2_PATH" ]; then
  echo "❌ Local R2 directory not found: $LOCAL_R2_PATH"
  echo "   No images to sync."
  exit 0
fi

# Count files to upload
FILE_COUNT=$(find "$LOCAL_R2_PATH" -type f ! -name "*.sqlite" | wc -l | tr -d ' ')

if [ "$FILE_COUNT" -eq 0 ]; then
  echo "ℹ️  No images found to sync."
  exit 0
fi

echo "📦 Found $FILE_COUNT file(s) to upload"

# Ask for confirmation before uploading to remote
echo ""
echo "⚠️  WARNING: This will upload files to your REMOTE production R2 bucket!"
echo "   Environment: ${CLOUDFLARE_ENV:-default}"
echo "   Files: $FILE_COUNT"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Sync cancelled."
  exit 0
fi

# Upload each file
echo "📤 Uploading files to remote R2..."
UPLOAD_COUNT=0

find "$LOCAL_R2_PATH" -type f ! -name "*.sqlite" | while read -r file; do
  # Get relative path from blobs directory
  filename=$(basename "$file")

  # Upload to R2
  if wrangler r2 object put "$BUCKET_NAME/$filename" --file="$file" $ENV_FLAG > /dev/null 2>&1; then
    UPLOAD_COUNT=$((UPLOAD_COUNT + 1))
    echo "   ✓ Uploaded: $filename"
  else
    echo "   ✗ Failed: $filename"
  fi
done

echo ""
echo "✅ Image sync completed!"
echo "📝 Note: If you need to verify uploads, use: wrangler r2 object list $BUCKET_NAME $ENV_FLAG"
