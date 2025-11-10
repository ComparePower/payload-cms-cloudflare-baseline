# Production Database Backups

These are automatic backups of the production database taken before syncing.

## Latest Backup
- **SQL File**: prod-backup-default-2025-11-10-130604.sql
- **Metadata**: prod-backup-default-2025-11-10-130604.json
- **Date**: 2025-11-10 13:06:08
- **Environment**: default
- **Size**: 9.8K
- **Inserts**: 28 statements

## View Backup Metadata
```bash
cat backups/prod-backup-default-2025-11-10-130604.json
```

## How to Restore

```bash
# Restore to remote production
wrangler d1 execute payload-cms-cloudflare-baseline \
  --remote \
  --file=backups/prod-backup-default-2025-11-10-130604.sql

# Or restore to local dev
wrangler d1 execute payload-cms-cloudflare-baseline \
  --local \
  --file=backups/prod-backup-default-2025-11-10-130604.sql
```

## Backups Are Committed to Git
These backups are tracked in git for safety. You can:
- Roll back to any previous backup
- See backup history: `git log backups/`
- Compare backups: `git diff HEAD~1 backups/`
