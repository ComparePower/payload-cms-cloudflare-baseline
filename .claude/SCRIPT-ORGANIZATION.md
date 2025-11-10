# Script Organization & Management Methodology

**Purpose**: Prevent script clutter, preserve context, and maintain clean repository organization.

**Applicable to**: Any project with utility scripts, build scripts, or automation tools.

---

## Core Principle

**All scripts must be properly categorized and documented to preserve context and prevent repository clutter.**

---

## Directory Structure

```
scripts/
├── production/          # Production-critical scripts (NEVER DELETE)
│   └── [deployment, CI/CD, critical automation]
├── admin/               # Admin utilities (maintenance, indexes, backups)
│   └── [database maintenance, index creation, cleanup]
├── test/                # Test/verification scripts (keep for CI/CD)
│   └── [integration tests, verification, validation]
├── archive/             # Issue-specific scripts organized by context
│   ├── issue-{number}-{description}/
│   │   ├── README.md    # Why these scripts exist, what they solved
│   │   └── [one-off debug/verification scripts]
│   └── ...
└── [global utilities]   # Well-documented reusable tools
```

---

## Decision Tree: Where to Put New Scripts

When creating a new script, follow this decision tree:

```
┌─────────────────────────────────┐
│   Creating New Script?          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Is this production-critical?    │
│ (Called by admin UI, API routes,│
│  or deployment processes)       │
└────────────┬────────────────────┘
             │
      ┌──────┴───────┐
      │              │
     YES             NO
      │              │
      ▼              ▼
 scripts/       Is this a test/
 production/    verification script?
      │              │
      │         ┌────┴────┐
      │        YES       NO
      │         │         │
      │         ▼         ▼
      │    scripts/   Is this admin
      │    test/      maintenance?
      │         │         │
      │         │    ┌────┴────┐
      │         │   YES       NO
      │         │    │         │
      │         │    ▼         ▼
      │         │ scripts/  Is this a
      │         │ admin/    one-off debug
      │         │    │      or issue-specific?
      │         │    │         │
      │         │    │        YES
      │         │    │         │
      │         │    │         ▼
      │         │    │    scripts/archive/
      │         │    │    issue-{number}-{description}/
      │         │    │         │
      └─────────┴────┴─────────┘
                │
                ▼
         Add proper header
         documentation
```

---

## Required Header Documentation

### For Global Utility Scripts (production/, admin/, test/)

**MANDATORY header template**:

```javascript
#!/usr/bin/env node
/**
 * [Script Name] - [One-line description]
 *
 * Created: YYYY-MM-DD (Issue #{number} or Context)
 * Author: [Your name or Team]
 * Context: [Why this script was created - problem it solves]
 * Reusability: [Why this is a global utility vs issue-specific]
 *
 * Usage:
 *   ./scripts/{name}.sh [options]
 *   npm run script-name [args]
 *
 * Related Files:
 *   - src/path/to/file.ts (calls this script)
 *   - scripts/lib/dependency.ts (dependency)
 *
 * Dependencies:
 *   - Node 20+
 *   - npm packages: [list key packages]
 *   - Environment variables: [list required env vars]
 *
 * Exit Codes:
 *   0 - Success
 *   1 - Error occurred
 *
 * Examples:
 *   # Example 1: Basic usage
 *   ./scripts/script-name.sh --option value
 *
 *   # Example 2: Dry run mode
 *   ./scripts/script-name.sh --dry-run
 */
```

**Example (cleanup-database.sh)**:

```javascript
#!/usr/bin/env node
/**
 * Comprehensive Database Cleanup Script
 *
 * Created: 2025-01-06 (Issue #29)
 * Author: DevOps Team
 * Context: Created during API audit to provide capability for properly
 *          cleaning collections using proper API instead of direct database access.
 *          This ensures all lifecycle hooks execute (soft-delete, versioning).
 * Reusability: Global utility because collection cleanup is a recurring need across
 *              multiple issues/migrations. Not specific to Issue #29 - that issue just
 *              identified the gap and created this capability.
 *
 * Usage:
 *   ./scripts/cleanup-database.sh
 *   ./scripts/cleanup-database.sh --collection=users
 *   ./scripts/cleanup-database.sh --dry-run
 *
 * Related Files:
 *   - docs/DATABASE-CLEANUP.md (documentation)
 *   - config/database.js (collection definitions)
 *
 * Dependencies:
 *   - Node 20+
 *   - Environment: DATABASE_URL required
 *
 * Exit Codes:
 *   0 - Success (all deletions completed)
 *   1 - Error occurred during cleanup
 */
```

---

## For Issue-Specific Scripts (archive/)

**MANDATORY: Create README.md in issue folder**:

```markdown
# Issue #{number}: {Title}

**Created**: YYYY-MM-DD
**Status**: Closed/Resolved
**GitHub Issue**: https://github.com/OWNER/REPO/issues/{number}

## Problem Statement

[What problem was this issue trying to solve?]

## Scripts in This Directory

### script-name.sh
- **Purpose**: [What this specific script does]
- **Why Created**: [Specific debugging/one-off need]
- **Results**: [What we learned or discovered]
- **Archived Because**: [Why no longer needed - superseded by X, debugging complete, etc.]

### another-script.sh
- **Purpose**: ...
- **Why Created**: ...

## Key Findings

[What did these scripts help us discover?]

## Lessons Learned

[What did this issue teach us?]

## Related Documentation

- [Link to issue]
- [Link to related docs]
- [Link to global utilities created]
```

---

## When to Archive vs Keep Scripts

### Archive Immediately (move to `scripts/archive/issue-{number}-{description}/`)

- ✅ One-off debugging scripts (`debug-*.sh`, `inspect-*.sh`, `check-*.sh`)
- ✅ Issue-specific verification scripts used only once
- ✅ Scripts superseded by better implementations
- ✅ Proof-of-concept scripts that informed final design

### Keep Permanently

- ✅ Production-critical scripts called by admin UI or API routes
- ✅ Admin maintenance utilities (indexes, backups, monitoring)
- ✅ Test/verification scripts used in CI/CD
- ✅ Infrastructure code (build, deployment, migration tools)
- ✅ Reusable utilities with clear documentation

---

## Script Archival Workflow

When completing an issue with scripts:

### 1. Create Archive Directory
```bash
mkdir -p scripts/archive/issue-{number}-{short-description}
```

### 2. Move Issue-Specific Scripts
```bash
mv scripts/debug-something.sh scripts/archive/issue-29-api-audit/
mv scripts/check-something.sh scripts/archive/issue-29-api-audit/
```

### 3. Create README.md
- Use template above
- Document WHY each script exists
- Capture key findings and lessons learned

### 4. Update .gitignore (if needed)
```
# scripts/.gitignore
archive/*/node_modules/
archive/*/*.log
archive/*/temp/
```

### 5. Commit with Context
```bash
git add scripts/archive/issue-29-api-audit/
git commit -m "chore: archive Issue #29 debug scripts

- Move 11 one-off debug scripts to archive/issue-29-api-audit/
- Add README documenting context and findings
- Scripts preserved for historical reference

Part of Issue #29 cleanup"
```

---

## Global Utility Script Checklist

Before declaring a script "global" and placing in `scripts/` root or category folder:

- [ ] Script is called by production code (admin UI, API routes, deployment)
- [ ] Script solves a recurring problem (not one-off debugging)
- [ ] Script has comprehensive header documentation (see template above)
- [ ] Script includes usage examples in header
- [ ] Script lists all dependencies and related files
- [ ] Script has proper error handling and exit codes
- [ ] You can explain why this is NOT issue-specific

**If any checkbox is unchecked**, script belongs in `scripts/archive/issue-{number}/`

---

## Benefits of Issue-Based Organization

1. **Context Preservation**: README files explain WHY scripts exist, what they solved
2. **Clean Repository**: Production scripts clearly separated from debug/one-off scripts
3. **Knowledge Transfer**: New team members understand historical decisions
4. **Easy Cleanup**: Can delete entire issue directories if truly obsolete
5. **Audit Trail**: Git history shows when/why scripts were created and archived
6. **Prevents Clutter**: Repo doesn't accumulate mystery scripts over time

---

## Anti-Patterns to Avoid

### ❌ **Don't**:
- Leave one-off debug scripts in `scripts/` root without documentation
- Create global utilities without explaining reusability justification
- Delete scripts without archiving (loses context)
- Forget to create README.md in archive directories
- Use vague names like `test.sh`, `temp.sh`, `script1.sh`

### ✅ **Do**:
- Archive issue-specific scripts immediately after issue closes
- Document WHY global utilities are global (not issue-specific)
- Create descriptive directory names (`issue-29-api-audit`)
- Write comprehensive README files capturing lessons learned
- Use descriptive script names (`cleanup-database.sh`, `verify-api-usage.sh`)

---

## Script Naming Conventions

### Global Utilities
- Use descriptive verb-noun format: `cleanup-database.sh`, `generate-reports.sh`
- Include purpose in name: `deploy-production.sh`, `backup-configs.sh`
- Avoid version numbers in names: Use git tags instead

### Issue-Specific Scripts
- Prefix with purpose: `debug-auth-flow.sh`, `check-api-response.sh`, `inspect-logs.sh`
- Include context: `test-migration-v2.sh`, `verify-issue-29-fix.sh`
- These will be archived, so names should indicate purpose

### Archive Directories
- Format: `issue-{number}-{short-kebab-description}`
- Examples: `issue-29-api-audit`, `issue-15-migration-refactor`
- Keep description under 30 characters

---

## Migration Guide for Existing Projects

If adopting this methodology in an existing project:

### Step 1: Audit Current Scripts
```bash
# List all scripts
find scripts/ -type f -name "*.sh" -o -name "*.mjs" -o -name "*.js"

# Categorize each by asking:
# 1. Is it called by production code?
# 2. Is it admin maintenance?
# 3. Is it a test script?
# 4. Is it debug/one-off?
```

### Step 2: Create Directory Structure
```bash
mkdir -p scripts/{production,admin,test,archive}
```

### Step 3: Move Scripts Gradually
- Start with obvious categories (production, test)
- Move debug scripts to archive with proper documentation
- Don't rush - categorize carefully

### Step 4: Add Header Documentation
- Update global utilities with full headers
- Create README files for archived scripts
- Document dependencies and usage

### Step 5: Update Documentation
- Update project README with script organization
- Add this methodology to project docs
- Train team on new structure

---

## Example Archive README

See `scripts/archive/issue-29-payload-api-audit/README.md` for a complete example of:
- Problem statement
- Script documentation
- Key findings
- Lessons learned
- Related documentation links

---

**Version**: 1.0
**Last Updated**: 2025-01-06
**Applicable to**: Any project with scripts
**Related**: `.claude/GITHUB-ISSUES-WORKFLOW.md`
