# Payload CMS + Cloudflare: Data Sync Guide

Complete guide for managing data between local development and production Cloudflare environments.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Understanding the Architecture](#-understanding-the-architecture)
- [Common Use Cases](#-common-use-cases)
- [All Available Commands](#-all-available-commands)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

**The most common commands you'll use:**

```bash
pnpm run dev              # Develop locally with local D1 + R2 (safe, default)
pnpm run sync             # Push local changes → production (smart upsert)
pnpm run pull:all         # Pull production → local (when returning to dev)
pnpm run deploy           # Full deployment with secrets sync (RECOMMENDED)
pnpm run deploy:quick     # Quick deploy without syncing secrets
```

---

## 🏗️ Understanding the Architecture

### Two Separate Environments

Your project has **two completely separate data stores**:

#### 🏠 Local Development
- **Location**: `.wrangler/state/v3/`
- **Database**: Local D1 (SQLite file)
- **Storage**: Local R2 (filesystem blobs)
- **Changes**: Only affect your local machine
- **Speed**: Fast, no network latency

#### ☁️ Remote Production
- **Location**: Cloudflare's infrastructure
- **Database**: Remote D1 (production)
- **Storage**: Remote R2 (production bucket)
- **Changes**: Affect live users
- **Speed**: Network latency applies

### How Data Flows

```
┌─────────────────┐         sync          ┌──────────────────┐
│                 │  ─────────────────>   │                  │
│  LOCAL DEV      │                       │  PRODUCTION      │
│  (your machine) │  <─────────────────   │  (Cloudflare)    │
│                 │       pull:all        │                  │
└─────────────────┘                       └──────────────────┘
```

### What Gets Synced

- ✅ **Database records** (users, content, etc.)
- ✅ **Media files** (images, documents)
- ❌ **NOT schema** (tables/columns structure)
- ❌ **NOT code** (Next.js app)

**Important**: Schema changes are deployed separately via `deploy:database`

---

## 💼 Common Use Cases

### Use Case 1: CMS Data Migration

**Scenario**: You're migrating data from an old CMS to Payload, building the migration locally first.

```bash
# 1. Deploy schema to production (creates tables)
export CLOUDFLARE_ENV=production
pnpm run deploy:database

# 2. Run your migration tools locally
pnpm run dev
# ... your migration scripts populate local D1 + R2 ...

# 3. Test everything locally
# - Verify data looks correct
# - Check images display properly

# 4. Push local data to production
pnpm run sync

# 5. Deploy the app code
pnpm run deploy:app

# Done! Your production now has all migrated data
```

### Use Case 2: Incremental Development

**Scenario**: You're adding a new field to Users collection and need to populate it.

```bash
# 1. Update your Payload config locally (add field to Users collection)
# Edit: src/collections/Users.ts

# 2. Deploy schema changes
pnpm run deploy:database

# 3. Develop locally - update user records with new field
pnpm run dev
# ... make changes to users locally ...

# 4. Sync changes (updates existing users, inserts new ones)
pnpm run sync

# 5. Deploy app code
pnpm run deploy:app
```

**What `sync` does**:
- Updates remote users with your new field values
- Keeps all other remote data untouched
- Uses SQLite's `INSERT OR REPLACE` (upsert)

### Use Case 3: Returning to Development

**Scenario**: Production has been running, users added content, and now you're back to develop new features.

```bash
# 1. Pull latest production data to local
pnpm run pull:all

# 2. Start developing with real production data
pnpm run dev

# 3. Make your changes locally

# 4. Sync your changes back when ready
pnpm run sync
```

### Use Case 4: Direct Production Development

**Scenario**: Quick fix or content update directly on production (⚠️ use cautiously).

```bash
# Connect local dev to production database
pnpm run dev:remote

# ALL changes now affect production immediately!
# No sync step needed, but be very careful
```

### Use Case 5: Schema-Only Updates

**Scenario**: You changed collection structure but don't need to sync data.

```bash
# Just deploy the schema and app
pnpm run deploy
```

This runs:
1. `deploy:database` (schema migrations)
2. `deploy:app` (Next.js app)

### Use Case 6: First-Time Production Deployment

**Scenario**: Setting up production for the first time with Doppler secrets.

```bash
# One-command deployment (syncs secrets, deploys schema + app)
pnpm run deploy production

# If you have local data to migrate, sync it afterward
pnpm run sync
```

**What it does automatically**:
1. Syncs secrets from Doppler → Cloudflare Workers
2. Runs database migrations (creates tables)
3. Deploys application code to Cloudflare Workers

### Use Case 7: Regular Production Deployment

**Scenario**: Deploying code/schema changes to production.

```bash
# Full deployment (includes secret sync)
pnpm run deploy production

# Or quick deployment (skip secret sync if secrets haven't changed)
export CLOUDFLARE_ENV=production
pnpm run deploy:quick

# If data changed locally, sync it
pnpm run sync
```

**When to use which**:
- `pnpm run deploy` - First time setup, or when secrets changed in Doppler
- `pnpm run deploy:quick` - Regular deployments when secrets are unchanged

---

## 📦 All Available Commands

### Development Commands

#### `pnpm run dev` 🌟 **RECOMMENDED**
**Local development with Doppler secrets**
- ✅ **KILLS** any process on port 3000 first
- ✅ **LOADS** secrets from Doppler dev config automatically
- ✅ Uses local D1 database
- ✅ Uses local R2 storage
- ✅ No `.env` file needed - all secrets from Doppler

**What it does**:
1. Checks for processes on port 3000 and kills them
2. Loads your dev token from `.doppler-tokens`
3. Injects all secrets from Doppler dev config
4. Starts Next.js dev server

**Usage**:
```bash
pnpm run dev
```

No need to set environment variables - everything is managed by Doppler!

#### `pnpm run dev:remote` ⚠️
**Remote-bound development (use with caution)**
- Connects to production D1
- Connects to production R2
- **ALL changes affect production immediately**
- Use only when you need live data

### Sync Commands (Local → Remote)

#### `pnpm run sync` 🌟 **RECOMMENDED**
**Smart sync with upsert + automatic backup**

What it does:
- ✅ **BACKS UP** production database to `backups/` directory first (committed to git!)
- ✅ Reads config from `wrangler.jsonc` automatically
- ✅ **UPDATES** existing remote records with local changes
- ✅ **INSERTS** new records that don't exist remotely
- ✅ **UPLOADS** media files to remote R2
- ❌ Does NOT delete remote records
- ❌ Does NOT drop/recreate tables

**Backup filename format**: `backups/prod-backup-{env}-{date}-{time}.sql`
- Example: `backups/prod-backup-default-2025-11-10-143022.sql`

**Skip backup** (if you're confident):
```bash
pnpm run sync -- --no-backup
```

Perfect for:
- CMS migrations
- Incremental updates
- Adding/updating data

**Backups are committed to git** for safety and history tracking!

#### `pnpm run sync:database`
**Database sync only (data, no schema)**
- Exports local D1 data
- Imports to remote D1
- Uses simple INSERT (not upsert)
- May fail on duplicates

#### `pnpm run sync:images`
**Images sync only**
- Uploads local R2 files to remote
- Overwrites if files exist

#### `pnpm run sync:all`
**Combined database + images**
- Runs both sync:database and sync:images
- Uses simple INSERT (not upsert)

### Pull Commands (Remote → Local)

#### `pnpm run pull:database`
**Pull production database to local**
- Downloads remote D1
- Imports to local D1
- ⚠️ Overwrites local data

#### `pnpm run pull:images`
**Pull production images to local**
- Downloads remote R2 files
- Saves to local R2 storage

#### `pnpm run pull:all`
**Pull everything from production**
- Runs both pull:database and pull:images
- Useful when returning to development

### Deployment Commands

#### `pnpm run deploy [environment]` 🌟 **RECOMMENDED**
**Full deployment with automatic secret syncing**

What it does:
- ✅ **SYNCS** secrets from Doppler to Cloudflare Workers
- ✅ **MIGRATES** database schema (CREATE/ALTER TABLE)
- ✅ **DEPLOYS** application code
- ❌ Does NOT sync data (use `pnpm run sync` separately)

**Usage**:
```bash
# Deploy to production
pnpm run deploy production

# Deploy to dev
pnpm run deploy dev
```

**Perfect for**:
- First-time deployment
- When secrets changed in Doppler
- Full end-to-end deployment

#### `pnpm run deploy:quick`
**Quick deployment without secret syncing**
- Runs `deploy:database` (schema)
- Runs `deploy:app` (code)
- Skips secret syncing (faster)

**Usage**:
```bash
export CLOUDFLARE_ENV=production
pnpm run deploy:quick
```

**Use when**:
- Secrets haven't changed since last deployment
- You want faster deployments
- You already ran `sync:secrets` manually

#### `pnpm run deploy:database`
**Deploy schema migrations only**
- Runs Payload migrations (CREATE/ALTER TABLE)
- Updates database structure
- Does NOT deploy app code
- Does NOT sync data or secrets

#### `pnpm run deploy:app`
**Deploy Next.js app only**
- Builds and deploys worker
- Does NOT run migrations
- Does NOT sync data or secrets

### Utility Commands

#### `pnpm run sync:secrets`
**Sync Doppler secrets to Wrangler**
- Bulk uploads ALL secrets from Doppler config to Cloudflare Workers
- Uses Doppler's official bulk sync method
- Requires `jq` CLI tool (already installed)
- Usage: `pnpm run sync:secrets [doppler-config] [wrangler-env]`
- Default: `production` config → `production` environment

**When to use**:
- After adding new secrets to Doppler
- After changing secret values in Doppler
- When setting up a new environment

**Example**:
```bash
# Sync production Doppler config to production Cloudflare Workers
pnpm run sync:secrets production production

# Or with default values
pnpm run sync:secrets
```

**Note**: This syncs ALL secrets from Doppler. Cloudflare Workers will only use secrets that your code references (like `PAYLOAD_SECRET`).

#### `pnpm run generate:types`
**Generate TypeScript types**
- Creates Payload types from collections
- Creates Cloudflare binding types
- Run after changing collection schemas

#### `pnpm run generate:importmap`
**Generate Payload import map**
- Updates admin UI module resolution
- Run after adding admin customizations

---

## ⚙️ Configuration

### Environment Variables

Set these before running commands:

```bash
# Which Cloudflare environment to target
export CLOUDFLARE_ENV=production  # or staging, dev, etc.
```

If not set, uses the default environment from `wrangler.jsonc`.

### Doppler Integration

This project uses Doppler for secrets management. Here's how it works:

#### Local Development
- **No `.env` file needed!** - All secrets loaded from Doppler
- `pnpm run dev` automatically uses Doppler dev token from `.doppler-tokens`
- Secrets are injected at runtime via `doppler run`
- Port 3000 is automatically cleared if in use

#### Production Deployment
Cloudflare Workers **don't use .env files** in production. Instead, secrets are stored in **Wrangler Secrets** (encrypted values in Cloudflare).

**Automated deployment workflow** (RECOMMENDED):

```bash
# One command does everything!
pnpm run deploy production
```

This automatically:
1. Syncs secrets from Doppler → Cloudflare Workers
2. Runs database migrations (schema updates)
3. Builds and deploys your application

**Manual deployment workflow** (advanced):

```bash
export CLOUDFLARE_ENV=production

# 1. Sync secrets (only if changed)
pnpm run sync:secrets production production

# 2. Deploy database schema (only if schema changed)
pnpm run deploy:database

# 3. Deploy application code
pnpm run deploy:app
```

#### Setting Up Doppler

**1. Create `.doppler-tokens` file** (git-ignored):

```bash
# Create the file in your project root
cat > .doppler-tokens << EOF
DOPPLER_TOKEN_DEV:dp.st.dev.YOUR_DEV_TOKEN_HERE
DOPPLER_TOKEN_PROD:dp.st.prd.YOUR_PROD_TOKEN_HERE
EOF
```

Get your tokens from Doppler dashboard:
1. Go to your Doppler project
2. Select the config (dev or production)
3. Go to Access → Service Tokens
4. Create a token with read-only access

**2. Set up Doppler configs**:

Create these Doppler configs to match your environments:

1. **`dev`** - Local development
   - `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000`
   - `R2_PUBLIC_URL=http://localhost:3000` (or leave blank for local)
   - `PAYLOAD_SECRET=<your-dev-secret>`

2. **`production`** - Production environment
   - `PAYLOAD_PUBLIC_SERVER_URL=https://payload.comparepower.com`
   - `R2_PUBLIC_URL=https://r2.payload.comparepower.com`
   - `PAYLOAD_SECRET=<your-prod-secret>` (should be different from dev!)

3. **`staging`** (optional) - Staging environment
   - Similar to production but with staging URLs

#### When to Sync Secrets

Run `pnpm run sync:secrets` whenever you:
- Set up a new Cloudflare environment
- Add a new secret to Doppler (like API keys)
- Change an existing secret value in Doppler
- Notice your Worker is using outdated secret values

**Note**: Syncing secrets is separate from deploying code. You only need to sync secrets when they change, not on every deployment.

### Wrangler Configuration

All scripts automatically read from `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [{
    "binding": "D1",
    "database_name": "your-db-name",  // ← Scripts read this
    "database_id": "..."
  }],
  "r2_buckets": [{
    "binding": "R2",
    "bucket_name": "your-bucket-name"  // ← Scripts read this
  }]
}
```

**No hardcoded names** - change `wrangler.jsonc` and scripts adapt automatically!

---

## 🔍 Troubleshooting

### Images not appearing in production

**Symptoms**: Media records in database, but images don't load

**Solutions**:
1. Check images uploaded:
   ```bash
   wrangler r2 object get your-bucket-name/image.jpg --remote --file=/tmp/test.jpg
   ```
2. Verify bucket name in `wrangler.jsonc` matches
3. Check Payload config uses correct R2 binding

### "Table already exists" error

**Symptoms**: Sync fails with table creation error

**Solutions**:
1. Run `deploy:database` first (creates schema)
2. Use `sync` command (not `sync:all`) - it uses upsert
3. Sync scripts should use `--no-schema` flag (already configured)

### Duplicate record errors

**Symptoms**: "UNIQUE constraint failed" on sync

**Solutions**:
- Use `pnpm run sync` (upsert) instead of `sync:database` (insert)
- Or clear remote data first for fresh migration

### Local and remote out of sync

**Symptoms**: Local has old data, production has new content

**Solution**:
```bash
pnpm run pull:all  # Download production → local
```

### Permission errors

**Symptoms**: "Authentication error" or "Access denied"

**Solutions**:
1. Login: `wrangler login`
2. Verify account has access to D1 database and R2 bucket
3. Check `database_id` and `bucket_name` in `wrangler.jsonc`

### Script can't find database/bucket name

**Symptoms**: "Could not find database_name in wrangler.jsonc"

**Solutions**:
1. Ensure `wrangler.jsonc` exists in project root
2. Check JSON is valid (comments are OK in `.jsonc`)
3. Verify `database_name` and `bucket_name` fields exist

### Dev server can't connect to bindings

**Symptoms**: Errors about D1 or R2 not being available

**Solutions**:
- Regular dev: `pnpm run dev` (uses local)
- Remote dev: `pnpm run dev:remote` (uses production)

---

## 📚 Quick Reference

| Task | Command | Direction |
|------|---------|-----------|
| Develop locally | `pnpm run dev` | Local only |
| Develop on production | `pnpm run dev:remote` | Direct to prod ⚠️ |
| Push local data | `pnpm run sync` | Local → Remote |
| Pull production data | `pnpm run pull:all` | Remote → Local |
| Sync secrets only | `pnpm run sync:secrets` | Doppler → Cloudflare |
| **Deploy everything** | `pnpm run deploy [env]` | **Secrets + Schema + App** ⭐ |
| Deploy without secrets | `pnpm run deploy:quick` | Schema + App |

---

## 🎯 Best Practices

1. **Always deploy schema before syncing data**
   ```bash
   pnpm run deploy:database  # First
   pnpm run sync             # Then
   ```

2. **Test locally before syncing to production**
   - Verify data looks correct
   - Check images display
   - Test functionality

3. **Use `sync` (upsert) instead of `sync:all` (insert)**
   - Safer for repeated syncs
   - Handles updates gracefully

4. **Pull production data when returning to development**
   ```bash
   pnpm run pull:all
   pnpm run dev
   ```

5. **Avoid `dev:remote` unless necessary**
   - Easy to accidentally modify production
   - Use local dev + sync workflow instead

6. **Sync secrets to Cloudflare when they change in Doppler**
   ```bash
   pnpm run sync:secrets production production
   ```
   - Only needed when secrets change, not on every deployment
   - Run once per environment during initial setup
   - Run again when adding/changing secrets in Doppler

7. **Git-committed backups protect you**
   - `pnpm run sync` automatically backs up production first
   - Backups committed to `backups/` directory in git
   - Full version history of all production states
   - Rollback to any previous backup via git history

---

## 💾 Backups & Recovery

### Automatic Git-Committed Backups

Every time you run `pnpm run sync`, production data is automatically backed up to `backups/` **and committed to git** for full version history.

**Backup location**: `backups/prod-backup-{env}-{date}-{time}.sql`

Example:
```
backups/
├── README.md                                    # Auto-generated restore instructions
├── prod-backup-default-2025-11-10-143022.sql  # Morning backup SQL
├── prod-backup-default-2025-11-10-143022.json # Morning backup metadata
├── prod-backup-default-2025-11-10-150145.sql  # After sync #1 SQL
├── prod-backup-default-2025-11-10-150145.json # After sync #1 metadata
└── ...
```

**Each backup includes**:
- `.sql` file - The actual database dump
- `.json` file - Metadata (timestamp, size, row counts, environment, etc.)

### Why Git-Committed Backups?

- **Version History**: See all changes over time (`git log backups/`)
- **Easy Rollback**: Restore to any previous state (`git checkout <commit> backups/`)
- **Compare Backups**: See what changed between backups (`git diff`)
- **Team Awareness**: Everyone sees backup history
- **No Data Loss**: Even if your local machine fails, backups are in git

### View Backup Metadata

Each backup has a JSON file with useful information:

```bash
# View latest backup metadata
cat backups/prod-backup-default-2025-11-10-143022.json
```

Example metadata:
```json
{
  "timestamp": "2025-11-10T19:43:22Z",
  "local_time": "2025-11-10 11:43:22",
  "environment": "default",
  "database_name": "payload-cms-cloudflare-baseline",
  "bucket_name": "payload-cms-cloudflare-baseline",
  "sql_file": "prod-backup-default-2025-11-10-143022.sql",
  "file_size": "9.8K",
  "insert_statements": 45,
  "wrangler_version": "wrangler 4.46.0",
  "backup_reason": "pre-sync-automatic"
}
```

**Useful for**:
- Checking backup size before restoring
- Seeing how many records are in a backup
- Confirming environment and timestamp
- Comparing backups over time

### Restore from Backup

If something goes wrong, restore from a backup:

```bash
# 1. Find the backup you want to restore
ls -la backups/

# 2. Import to remote database
wrangler d1 execute payload-cms-cloudflare-baseline \
  --remote \
  --file=backups/prod-backup-default-2025-11-10-143022.sql

# 3. Verify the restoration worked
wrangler d1 execute payload-cms-cloudflare-baseline \
  --remote \
  --command="SELECT COUNT(*) FROM users;"
```

### Restore from Git History

You can even restore a backup from an older commit:

```bash
# See backup history
git log --oneline backups/

# Checkout an older backup
git show commit-hash:backups/prod-backup-default-2025-11-10-143022.sql > restore.sql

# Import it
wrangler d1 execute payload-cms-cloudflare-baseline --remote --file=restore.sql
```

### Skip Backup (Advanced)

If you're syncing frequently and don't need a backup every time:

```bash
pnpm run sync -- --no-backup
```

**⚠️ Warning**: Only skip backup if you:
- Just made a backup recently
- Are confident in your changes
- Don't need the git history for this sync

---

## 🆘 Need Help?

- Check `wrangler.jsonc` for correct database/bucket names
- Verify you're logged in: `wrangler whoami`
- Run scripts with verbose output (remove `> /dev/null 2>&1`)
- Check `.wrangler/state/v3/` for local data files

