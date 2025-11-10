# Content Migration: Astro/Keystatic → Payload CMS

**Main entry point for Claude Code agents working on this migration.**

This document is the **living source of truth** for migration work. Update it continuously as you learn new things.

---

## 🎯 Project Identification

### SOURCE Project
- **Path**: `/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro`
- **Type**: Astro + Keystatic CMS
- **Content Format**: MDX files with YAML frontmatter
- **Collections**:
  - `providers` (157 files)
  - `electricity-rates` (896 files)
  - Others (to be analyzed)

### TARGET Project
- **Path**: `/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo`
- **Type**: Payload CMS v3 + Next.js 15 + MongoDB
- **Database**: MongoDB Atlas (via Doppler for connection string)
- **Port**: 3002 (dev server)

---

## 🔀 Development Workflow

**🚨 CRITICAL - YOU MUST READ THESE FILES BEFORE PROCEEDING**:

1. **[`.claude/GITHUB-ISSUES-WORKFLOW.md`](.claude/GITHUB-ISSUES-WORKFLOW.md)** - Complete GitHub Issues-First Development Workflow
2. **[`.claude/SCRIPT-ORGANIZATION.md`](.claude/SCRIPT-ORGANIZATION.md)** - Script Organization & Management Methodology

**DO NOT PROCEED** without reading and understanding these workflow files. They contain mandatory protocols for all development work.

---

### Quick Start: Use `/start` Command

Run `/start` to initialize your session. This command will:
- ✅ Read and confirm understanding of all workflows
- ✅ Validate GitHub connection
- ✅ List open issues
- ✅ Ask which issue to work on first

---

### Project-Specific GitHub Configuration

**Repository**: `ComparePower/cp-cms-payload-cms-mongo`
**Tool**: `gh` CLI (private repo - WebFetch will fail)
**Branch Format**: `issue-{number}-{kebab-case-description}`

### Branching Strategy

**Development → Production Flow**:
```
feature branches → next (development default) → prod (production releases)
```

**Branch Purposes**:
- **`next`** (default branch) - Development work, merge all completed feature branches here
- **`prod`** - Production releases, merge from `next` when ready to deploy
- **`main`** - Legacy baseline (39 commits behind, can be deleted)
- **`001-keystatic-to-payload-migration`** - Legacy migration branch (now merged into `next`)

### Git Worktree Workflow (MANDATORY)

**ALL issue work MUST use git worktrees**, not branches in the main repository.

**Worktree Directory**: `.worktrees/` (project-local, hidden, in .gitignore)

**Directory Structure**:
```
cp-cms-payload-cms-mongo/
├── .worktrees/                      ← Worktrees stored HERE (hidden, ignored by git)
│   ├── issue-30/                    ← Worktree for Issue #30
│   ├── issue-31/                    ← Worktree for Issue #31
│   └── issue-32/                    ← Worktree for Issue #32
├── src/
├── scripts/
├── .gitignore                       ← Contains .worktrees/
└── (main repo stays on 'next')
```

**Workflow**:
1. **Create worktree** from `next`:
   ```bash
   cd cp-cms-payload-cms-mongo
   git checkout next && git pull
   git worktree add .worktrees/issue-X -b issue-X-description
   cd .worktrees/issue-X
   pnpm install
   ```

2. **Work in worktree**: All changes happen in `.worktrees/issue-X/`

3. **Merge back to next**:
   ```bash
   cd ../../  # Back to main repo
   git checkout next
   git merge --no-ff issue-X-description
   git push origin next
   ```

4. **Cleanup**:
   ```bash
   git worktree remove .worktrees/issue-X  # Deletes directory AND branch
   ```

5. **Production release** (when ready): merge `next` into `prod`

**Only commit directly to `next` for**:
- Documentation updates (README, CLAUDE.md, .claude/)
- Emergency hotfixes (with justification)

**Quick Commands**:
```bash
# List open issues
gh issue list --repo ComparePower/cp-cms-payload-cms-mongo --state open

# View issue details
gh issue view {number} --repo ComparePower/cp-cms-payload-cms-mongo --json title,body,labels,state

# Comment on issue
gh issue comment {number} --repo ComparePower/cp-cms-payload-cms-mongo --body "✅ Progress update"

# Close issue
gh issue close {number} --repo ComparePower/cp-cms-payload-cms-mongo --comment "✅ Complete"
```

---

### Project-Specific Script Organization

**Directory Structure**:
```
scripts/
├── doppler-run.sh              # Doppler environment wrapper
├── cleanup-database.mjs        # Global utility (Issue #29)
├── admin/                      # Admin utilities (indexes, maintenance)
├── test/                       # Test/verification scripts
└── archive/                    # Issue-specific scripts with context
    └── issue-{number}-{description}/
        └── README.md           # Context documentation
```

**See**: `.claude/SCRIPT-ORGANIZATION.md` for complete categorization decision tree and header templates.

---

### Open GitHub Issues in old project, but will need to recreate here locally where applicable.

**Block Replacer Enhancements** (Issues #1-8):
- [Issue #1](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/1): SSE Streaming for Search
- [Issue #2](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/2): Robust MDX Importer (CRITICAL)
- [Issue #3](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/3): Post-Replacement Verification
- [Issue #4](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/4): ContentChangeHistory Collection
- [Issue #5](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/5): Complete Operation Button
- [Issue #6](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/6): Extended Find/Replace for Fields
- [Issue #7](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/7): Context-Aware Replacement
- [Issue #8](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/8): Field & SEO Validation

**Import Wizard & Component Mapping** (Issues #22+):
- [Issue #22](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/22): AssetManager Integration for Image Components (HIGH PRIORITY) - Related to Issue #2

**Payload CMS Plugins** (Issues #9-14):
- [Issue #9](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/9): Import/Export Plugin
- [Issue #10](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/10): Nested Docs Plugin
- [Issue #11](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/11): Form Builder Plugin
- [Issue #12](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/12): SEO Plugin (HIGH PRIORITY)
- [Issue #13](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/13): Search Plugin (HIGH PRIORITY)
- [Issue #14](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/14): MCP (AI) Plugin

**Localization & Search** (Issues #23-26):
- [Issue #23](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/23): Implement Localization for Spanish Content Translations (MEDIUM PRIORITY)
- [Issue #24](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/24): Implement Payload CMS Search Plugin (HIGH PRIORITY)
- [Issue #25](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/25): Implement Typesense Search Integration (MEDIUM PRIORITY)
- [Issue #26](https://github.com/ComparePower/cp-cms-payload-cms-mongo/issues/26): Ensure Search Works with Spanish Localization (MEDIUM PRIORITY)

---

## 🛠️ Building Reusable Functionality

### When to Create Skills vs Subagents

**Create a Skill when**:
- Functionality will be reused across multiple projects
- You're building a reusable workflow or methodology
- User explicitly requests creating reusable capability
- Pattern/tool should be available in skill library

**Create a Subagent when**:
- Task is project-specific (one-time use)
- Exploring codebase or gathering context
- Performing specific migration or data transformation
- No expectation of reuse in other projects

**Examples**:
- Skill: "MDX validation framework" (reusable across Astro/Next.js projects)
- Subagent: "Migrate providers collection from Keystatic to Payload" (project-specific)

**See**: `.claude/` directory for examples of reusable methodologies that can be copied to new projects.

---

## ⚙️ Payload CMS Baseline Configuration

### Core Features (from `src/payload.config.ts`)

**Database**:
- MongoDB via `@payloadcms/db-mongodb`
- Connection string from env: `MONGO_DB_CONN_STRING`
- Doppler required for local dev

**Editor**:
- Lexical editor (not Slate)
- Enabled features:
  - Headings (h1-h6)
  - Text formatting (bold, italic, underline, strikethrough)
  - Lists (ordered, unordered)
  - Links (with internal page references)
  - Inline blocks (dynamic data)
  - Indent
  - Tables (experimental)

**Collections** (12 total):
- Users
- Authors, Advisors, Team
- Posts, Pages, OtherPages, Demos, Providers
- Categories, Tags, Faqs
- Media, RichTextDataInstances

**Soft Deletion**:
- ✅ **ENABLED** via `_deleted: false` field
- Required for all seeded records
- Critical for Payload admin UI functionality

**Versioning**:
- ✅ **ENABLED** via `versions: { drafts: true }`
- Draft/Published workflow supported

**Media/Uploads**:
- ⚠️ **NOT CONFIGURED** - No storage adapter in config
- Default: Local filesystem (Next.js public directory)
- Options available: S3, Cloudflare R2, local
- **TODO**: Confirm strategy with user

**Live Preview**:
- ✅ **FULLY IMPLEMENTED** - Dual deployment pattern (static + SSR)
- Collections enabled: TestPosts, ElectricityRates, Providers
- Autosave every 375ms with refresh button
- 100% E2E test success rate
- **See**: `ASTRO-LIVE-PREVIEW-IMPLEMENTATION.md` for complete guide

**Access Control Pattern**:
- Admin-only for create/update/delete (via `adminOnly` helper)
- Public read for published content (via `adminOrPublishedStatus` helper)

**Required Metadata Fields** (auto-added by Payload):
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp
- `_deleted`: boolean (false for active records)

---

## 📋 Migration Strategy

### Phase 1: Discovery & Analysis
1. Scan Astro content directory for all MDX files
2. Parse frontmatter to discover ALL fields (not just Astro schema)
3. Extract MDX components and map to Payload blocks
4. Analyze relationships (Team members, categories, tags)
5. Generate field mapping documentation

### Phase 2: Schema Generation
1. Generate Payload collection configs from analysis
2. Map MDX components to Payload block types
3. Ensure all frontmatter fields are captured
4. Handle nested fields (SEO group, hero group, etc.)

### Phase 3: Data Preparation
1. Parse MDX files with frontmatter
2. Convert markdown content to Lexical JSON
3. Map components to content blocks
4. Generate unique slugs (path-based to avoid duplicates)
5. Output JSON files for seeding

### Phase 4: Database Seeding
1. Connect directly to MongoDB (bypass Payload API for performance)
2. **CRITICAL**: Purge existing collection data first
3. Add required Payload metadata: `_deleted: false`, `createdAt`, `updatedAt`
4. Batch insert (10 records at a time)
5. Verify record count

### Phase 5: Verification
1. Direct database queries to validate field presence
2. Payload admin UI testing (login, list, click individual records)
3. Field-by-field comparison with source frontmatter
4. Relationship integrity checks
5. Playwright automated testing

---

## 📁 File Structure

```
cp-cms-payload-cms-mongo/
├── CLAUDE.MD                          ← YOU ARE HERE (main entry point)
├── src/
│   ├── payload.config.ts              ← Main Payload configuration
│   ├── collections/
│   │   ├── Providers/index.ts         ← Providers collection schema
│   │   ├── Team/index.ts              ← Team members (relationships)
│   │   └── ...                        ← Other collections
│   ├── access/
│   │   ├── adminOnly.ts               ← Admin-only access control
│   │   └── adminOrPublishedStatus.ts  ← Public read for published
│   └── lexical/
│       └── inlineBlocks.ts            ← Inline block definitions
├── migration/
│   ├── scripts/
│   │   ├── purge-collections.mjs      ← PURGE tool (DB + schema cleanup)
│   │   ├── analyze-frontmatter.mjs    ← Discover ALL frontmatter fields
│   │   ├── prepare-seed-data.mjs      ← MDX → JSON conversion
│   │   ├── seed-with-payload-api.mjs  ← Seed using Payload API (PROPER)
│   │   └── verify-migration-comprehensive.mjs  ← Verification tests
│   ├── data/
│   │   └── seed/
│   │       └── providers.json         ← Prepared seed data
│   └── MIGRATION-ISSUES-REPORT.md     ← Known issues & fixes
├── scripts/
│   └── doppler-run.sh                 ← Doppler wrapper for env vars
└── test-providers-migration.mjs       ← Playwright verification test
```

---

## 🔧 Commands Reference

### Development
```bash
# Start Payload dev server (requires Doppler)
./scripts/doppler-run.sh dev pnpm dev
# → http://localhost:3002/admin

# Login credentials (from user)
# Email: brad@comparepower.com
# Password: deh2xjt1CHW_dmd.gxj
```

### Migration Commands

**⚠️ CRITICAL: Use ONLY `seed-with-payload-api.mjs` - This is the CORRECT script!**

```bash
# 0. PURGE collections (hard delete - removes ALL records including versions)
./scripts/doppler-run.sh dev node -e "
const { MongoClient } = require('mongodb');
(async () => {
  const client = new MongoClient(process.env.MONGO_DB_CONN_STRING);
  await client.connect();
  const db = client.db();

  // Providers
  await db.collection('providers').deleteMany({});
  await db.collection('_providers_versions').deleteMany({});

  // Electricity Rates
  await db.collection('electricity-rates').deleteMany({});
  await db.collection('_electricity-rates_versions').deleteMany({});

  console.log('✅ All collections purged!');
  await client.close();
})();
"

# 1. Seed Providers using CORRECT script (with proper MDX block extraction)
./scripts/doppler-run.sh dev pnpm tsx migration/scripts/seed-with-payload-api.mjs

# 2. Seed Electricity Rates
./scripts/doppler-run.sh dev pnpm tsx migration/scripts/seed-electricity-rates-with-payload-api.mjs

# 3. Verify migration
./scripts/doppler-run.sh dev pnpm tsx migration/scripts/validate-seed.mjs
```

**❌ DO NOT USE** (archived as .BROKEN):
- `seed-providers-enhanced.mjs` - Uses wrong parser, puts all content in single richText block
- `mdx-to-lexical-converter.ts` - Naive converter without block extraction
- `mdx-parser.ts` - Basic frontmatter parser without component handling

**✅ CORRECT MODULES** (must use these):
- `migration/scripts/seed-with-payload-api.mjs` - Main provider migration script
- `scripts/migration/lib/mdx-to-payload-blocks.ts` - Proper MDX block extraction
- `scripts/migration/lib/lexical-inline-block-processor.ts` - Inline component conversion
- `scripts/migration/lib/resolve-rich-text-data-slugs.ts` - Slug to ID resolution


---

## 📐 Code Style & Standards

### CRITICAL: Always Use Path Aliases

**NEVER use relative imports beyond one level (`../`)**. Always use configured path aliases instead.

**Configured Aliases** (from `tsconfig.json`):
```typescript
"@/*"         → "./src/*"           // All src files
"@/scripts/*" → "./scripts/*"       // Migration scripts
"@payload-config" → "./src/payload.config.ts"
```

**Centralized Configuration**:
- **Migration paths**: Use `@/lib/migration-config` for all Astro project paths
- **Never hardcode** absolute paths like `/Users/brad/_CODE_DEV_PROJECTS/...`
- **Use environment variables** with fallback defaults

**Examples**:

❌ **BAD** - Terrible relative imports:
```typescript
import { parseMDXToBlocks } from '../../../../../../scripts/migration/lib/mdx-to-payload-blocks'
const ASTRO_PATH = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro'
```

✅ **GOOD** - Clean aliases and centralized config:
```typescript
import { parseMDXToBlocks } from '@/scripts/migration/lib/mdx-to-payload-blocks'
import { MIGRATION_CONFIG } from '@/lib/migration-config'

const { ASTRO_CONTENT_DIR } = MIGRATION_CONFIG
```

**Why**: Relative imports are fragile, hard to maintain, and break when files move. Aliases provide stable, readable imports.

### Playwright Testing Requirement

**CRITICAL**: Never report UI work as complete without Playwright verification.

**Workflow**:
1. Implement UI feature/fix
2. Write Playwright test covering all user flows
3. Run tests: `pnpm test:e2e`
4. Fix any failing tests
5. ONLY after tests pass → declare work complete

**Why**: Manual testing misses edge cases. Automated tests catch bugs before they reach users.

---

## 🚨 Critical Lessons Learned

### Issue 1: Missing `_deleted` Field
**Problem**: Directly inserting records to MongoDB without `_deleted: false` causes Payload admin UI to show "document not found" errors when clicking individual records.

**Root Cause**: Payload's soft-deletion system requires `_deleted` field. MongoDB Atlas blocks table scans, so queries with missing fields fail.

**Solution**: Always add `_deleted: false` when seeding:
```javascript
const docs = batch.map(provider => ({
  ...provider,
  _deleted: false,  // CRITICAL
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}))
```

### Issue 2: Duplicate Slugs
**Problem**: Multiple MDX files with same base filename in different directories caused duplicate slug errors.

**Example**:
- `_drafts/ratings/index.mdx` → slug: "ratings"
- `texas-electricity-energy-companies/_drafts/ratings/index.mdx` → slug: "ratings" (duplicate!)

**Solution**: Use full relative path for slug generation:
```javascript
function generateUniqueSlug(filePath, frontmatter) {
  const relativePath = path.relative(ASTRO_PROVIDERS_DIR, filePath)
  let pathSlug = relativePath
    .replace(/\/index\.mdx$/, '')
    .replace(/\.mdx$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  return pathSlug
}
// Result: "drafts-ratings" vs "texas-electricity-energy-companies-drafts-ratings"
```


---

## 🎭 Initial Setup Q&A Workflow

**When starting a new migration or resuming work, ALWAYS run this Q&A first:**

### 1. Confirm Projects
Scan `/Users/brad/_CODE_DEV_PROJECTS/` and present options:

```
I found these projects in your parent directory:

SOURCE (Astro/Content) options:
  1. cp-content-site-astro ← Current SOURCE


TARGET (Payload CMS) options:
  1. payload-cms-cloudflare-baseline ← Current TARGET
  2. payload-demo

Are these correct?
- Yes → Continue
- No → Which would you like to use?
```

### 2. Baseline Config Questions


**Collections to Migrate**:
```
Which Astro collections should I migrate?
  1. All collections (auto-discover)
  2. Specific collections (let me choose)
  3. Continue with current (providers, electricity-rates)
```

### 3. Verification Strategy
```
How thorough should verification be?
  1. Comprehensive (database + UI + field-by-field)
  2. Basic (counts + sample records)
  3. Custom (specify tests)
```

---

## 📝 Documentation Update Protocol

**CRITICAL**: Update this file whenever you:
- Discover new fields or data structures
- Encounter and fix errors
- Learn new constraints or requirements
- Complete major migration phases
- Change baseline configurations

**DO NOT** wait for user to tell you to update documentation. This is your job.

**Update sections**:
- Baseline Configuration → When config changes
- Critical Lessons Learned → When encountering/fixing errors
- Current Status → After completing tasks
- File Structure → When adding new files
- Commands Reference → When creating new scripts

---

## 🔧 Content Management Tools

### Import Wizard 🆕

**Location**: `/admin/utilities/import-wizard`

**Purpose**: Multi-step wizard for importing MDX content from Astro/Keystatic to Payload CMS. Replaces CLI-based migration scripts with user-friendly UI.

**Status**: 🚧 35% Complete (Steps 1-2 done, Steps 3-6 in progress)

**Completed Features** (✅):
- Step 1: Source Selection
  - Collection cards (Providers, Electricity Rates, Posts, Pages)
  - File count analysis
  - API integration
- Step 2: Component Analysis
  - Parse sample MDX file
  - Show mapped/unmapped components
  - Block import until all components mapped
  - Component table with status indicators

**In Progress** (🚧):
- Fixing API import paths
- Testing with Abilene electricity rate
- Component mapping UI

**Roadmap** (📋):
- Step 3: Field Mapping (frontmatter → Payload schema)
- Step 4: Preview (MDX → Lexical conversion preview)
- Step 5: Execute Import (SSE streaming progress)
- Step 6: Verification (database checks, link to admin UI)

**Documentation**:
- [IMPORT-WIZARD-PROGRESS.md](IMPORT-WIZARD-PROGRESS.md) - Detailed progress tracking

**API Endpoints**:
- `POST /api/utilities/import-wizard/analyze-source` - Analyze source directory
- `POST /api/utilities/import-wizard/analyze-components` - Extract MDX components
- `POST /api/utilities/import-wizard/analyze-fields` - TODO
- `POST /api/utilities/import-wizard/preview` - TODO
- `POST /api/utilities/import-wizard/execute` - TODO (SSE streaming)
- `POST /api/utilities/import-wizard/verify` - TODO

**E2E Test**: `scripts/test-abilene-import-e2e.mjs` - Tests full Abilene import workflow

---

### Block Replacer Utility

**Location**: `/admin/utilities/replace-blocks`

**Purpose**: Find and replace content blocks across all collections with preview, approval workflow, and audit trail.

**Current Features** (✅ Complete):
- Real-time SSE connection status indicator
- Live progress updates during operations
- Block-type filtering with collection selection
- Property filters for targeted replacement
- Field transformations (copy or custom values)
- Interactive preview modal with before/after comparison
- Individual block selection with clickable links
- Document-level and block-level approval

**Roadmap** (📋 Planned):

1. **SSE Streaming for Search** (Priority: High)
   - Replace fetch-based search with SSE streaming
   - Show real-time progress during "Apply Filters" operation
   - Display collection-by-collection scanning status

2. **Robust MDX Importer** (Priority: Critical)
   - Production-ready validation with fail-fast on unmapped components
   - Handle both inline (`<LowestRateDisplay>`) and block-level (`<RatesTable>`) components
   - Complete mapping of ALL MDX components to Payload blocks/inline blocks
   - Report unmapped components with file path, props, and actionable error messages
   - Stop migration immediately on unmapped component detection

3. **Post-Replacement Verification** (Priority: High)
   - Re-query database after replacement to verify changes
   - Add "CONFIRMED" column showing actual vs expected results
   - Three-column view: Before → After (expected) → Confirmed (actual)
   - Close the verification loop with real database checks

4. **Change History & Audit Trail** (Priority: High)
   - New Payload collection: `ContentChangeHistory`
   - Track: what changed, who made change, when, before/after states
   - Enable rollback capability for bulk operations
   - Full audit trail for compliance and debugging

5. **"Complete Operation" Button** (Priority: Medium)
   - Reset all filters and app state after successful operation
   - Clear selections and preview results
   - Allow starting fresh search/replace without page reload

6. **Extended Find/Replace: Regular Fields** (Priority: Medium)
   - Find/replace on any field across collections (not just content blocks)
   - Example: "Find all entries where status='draft' and change to 'published'"
   - Support for: text fields, select fields, relationship fields, dates

7. **Context-Aware Text/Link/Image Replacement** (Priority: High)
   - Smart targeting by content type to prevent accidental corruption
   - Separate handlers for:
     - Rich text content (e.g., "ComparePower" → "Compare Power")
     - URLs and links (preserve structure, prevent breaking)
     - Image references (update paths, alt text)
   - Example: Change text without touching URLs that contain same text

8. **Field & SEO Validation** (Priority: Medium)
   - MDX-style validation for field data
   - SEO requirement checks (meta descriptions, titles, keywords)
   - Automated quality assurance before and after operations
   - *(Details to be provided when task is started)*

**Documentation**:
- [BLOCK-REPLACER-APPROVAL-WORKFLOW.md](BLOCK-REPLACER-APPROVAL-WORKFLOW.md) - Approval workflow implementation
- [BLOCK-REPLACER-ENHANCED-UI.txt](BLOCK-REPLACER-ENHANCED-UI.txt) - Enhanced prop filters UI

**API Endpoints**:
- `POST /api/utilities/replace-blocks` - Main replacement endpoint with dry-run support
- `POST /api/utilities/replace-blocks/stream` - SSE streaming for real-time progress
- `GET /api/utilities/replace-blocks` - Fetch available block types and variants

---

## 🔗 Related Documentation

### Migration & Components
- [INTERACTIVE-VALIDATION-WIZARD-SPEC.md](INTERACTIVE-VALIDATION-WIZARD-SPEC.md) - **Interactive migration wizard specification** (stdin handling, validation workflow)
- [INTERACTIVE-PROMPTS-INQUIRER-FIX.md](INTERACTIVE-PROMPTS-INQUIRER-FIX.md) - Prompts library migration and lessons learned
- [COMPONENT-REGISTRY-DESIGN.md](migration/COMPONENT-REGISTRY-DESIGN.md) - **Type-safe MDX ↔ Payload mapping system** (Issue #2)
- [UNMAPPED-COMPONENTS-ANALYSIS.md](migration/UNMAPPED-COMPONENTS-ANALYSIS.md) - Analysis of 11 unmapped components
- [MIGRATION-ISSUES-REPORT.md](migration/MIGRATION-ISSUES-REPORT.md) - Detailed issue tracking
- [COMPLETE-MIGRATION-GUIDE.md](migration/COMPLETE-MIGRATION-GUIDE.md) - Comprehensive migration guide (11k+ lines)

### Live Preview & Content Tools
- [ASTRO-LIVE-PREVIEW-IMPLEMENTATION.md](ASTRO-LIVE-PREVIEW-IMPLEMENTATION.md) - **Complete live preview guide** (100% working, E2E tested)
- [BLOCK-REPLACER-APPROVAL-WORKFLOW.md](BLOCK-REPLACER-APPROVAL-WORKFLOW.md) - Approval workflow implementation

### General
- [DOPPLER_SETUP.md](DOPPLER_SETUP.md) - Doppler configuration guide (if exists)
- [README.md](README.md) - Project README

---

**Last Updated**: 2025-10-27 (Component Registry Design documented for Issue #2)
**Updated By**: Claude Code (Added Component Registry Design for type-safe MDX component mapping)
