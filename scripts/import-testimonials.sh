#!/bin/bash
set -e

# Import testimonials using Doppler for environment variables
echo "🚀 Starting testimonial import..."

# Load Doppler token from .doppler-tokens file
TOKENS_FILE=".doppler-tokens"
if [ ! -f "$TOKENS_FILE" ]; then
  echo "❌ Error: $TOKENS_FILE not found"
  exit 1
fi

DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_DEV:" "$TOKENS_FILE" | cut -d':' -f2)

if [ -z "$DOPPLER_TOKEN" ]; then
  echo "❌ Error: Could not find Doppler token for dev environment"
  exit 1
fi

export DOPPLER_TOKEN

# Run the import script with Doppler secrets
doppler run -- npx tsx src/scripts/import-testimonials.ts
