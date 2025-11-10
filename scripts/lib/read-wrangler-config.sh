#!/bin/bash

# Shared function to read wrangler.jsonc configuration
# Usage: source this file, then call read_wrangler_config

read_wrangler_config() {
  WRANGLER_CONFIG="wrangler.jsonc"

  if [ ! -f "$WRANGLER_CONFIG" ]; then
    echo "❌ Error: wrangler.jsonc not found"
    exit 1
  fi

  # Parse database name (strip comments and extract database_name)
  DB_NAME=$(grep -o '"database_name"[[:space:]]*:[[:space:]]*"[^"]*"' "$WRANGLER_CONFIG" | head -1 | sed 's/.*"database_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

  # Parse bucket name (strip comments and extract bucket_name)
  BUCKET_NAME=$(grep -o '"bucket_name"[[:space:]]*:[[:space:]]*"[^"]*"' "$WRANGLER_CONFIG" | head -1 | sed 's/.*"bucket_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

  if [ -z "$DB_NAME" ]; then
    echo "❌ Error: Could not find database_name in wrangler.jsonc"
    exit 1
  fi

  if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Error: Could not find bucket_name in wrangler.jsonc"
    exit 1
  fi

  # Export for use in calling script
  export DB_NAME
  export BUCKET_NAME
}
