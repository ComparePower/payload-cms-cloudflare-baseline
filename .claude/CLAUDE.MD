# Content Migration: Astro/Keystatic → Payload CMS (Cloudflare D1/R2)

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
- **Path**: `/Users/brad/_CODE_DEV_PROJECTS/payload-cms-cloudflare-baseline`
- **Type**: Payload CMS v3 + Next.js 15 + Cloudflare D1/R2
- **Database**: Cloudflare D1 (SQLite) via `@payloadcms/db-d1-sqlite`
- **Storage**: Cloudflare R2 via `@payloadcms/storage-r2`
- **Port**: 3000 (dev server) - ⚠️ **Note**: Tests expect 3003
- **Custom Domains**:
  - Admin: `payload.comparepower.com`
  - R2 Images: `r2.payload.comparepower.com`

### Reference Project (MongoDB Version)
- **Path**: `/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo`
- **Status**: 93% complete (146/157 providers migrated)
- **Purpose**: Reference implementation - utilities and patterns ported from here

---

## 🔀 Development Workflow

### Project Status: Infrastructure Build Phase

**This is a NEW project building baseline infrastructure.** We're porting the successful migration system from the MongoDB version to work with Cloudflare D1/R2.

**Current Phase**: Foundation - Creating collections and Lexical blocks infrastructure

**Future Phases**: Once infrastructure complete, will add:
- GitHub Issues workflow (see `.claude/GITHUB-ISSUES-WORKFLOW.md` from MongoDB project)
- Git worktree workflow for feature development
- `/start` command for session initialization

### Script Organization

**See**: `.claude/SCRIPT-ORGANIZATION.md` for complete categorization methodology.

**Directory Structure**:
```
scripts/
├── dev.sh                      # Doppler wrapper for local dev
├── migration/                  # Migration utilities (31 files ported from MongoDB)
│   ├── lib/                    # Core migration functions
│   ├── import-abilene.ts       # Test script for single import
│   └── (other migration scripts)
└── (future: admin/, test/, archive/)
```

---

## ⚙️ Payload CMS Baseline Configuration

### Core Features (from `src/payload.config.ts`)

**Database**:
- Cloudflare D1 (SQLite) via `@payloadcms/db-d1-sqlite`
- Local dev: Wrangler provides D1 binding automatically
- No connection string needed (bindings via `wrangler.jsonc`)
- Migration command: `pnpm run payload migrate`

**Storage**:
- Cloudflare R2 via `@payloadcms/storage-r2`
- Custom domain configured: `r2.payload.comparepower.com`
- **Limitations**: No sharp support (no image processing on Workers)
- Crop/focal point **disabled** due to Workers constraints

**Editor**:
- Lexical editor (not Slate)
- **Current**: Basic configuration only
- **Planned**: Full configuration with:
  - Headings (h1-h6)
  - Text formatting (bold, italic, underline, strikethrough)
  - Lists (ordered, unordered)
  - Links (with internal page references)
  - Inline blocks (dynamic phone numbers, data)
  - Indent, Tables
  - 26 content blocks + 10 inline blocks

**Collections** (Current - 3 total):
- Users (basic auth)
- Media (simple upload, alt text only)
- ElectricityRates (basic schema, **NO contentBlocks yet**)

**Collections** (Planned - will port from MongoDB):
- **RichTextDataInstances** (CRITICAL - dynamic phone numbers, emails)
- **Providers** (with full contentBlocks array)
- **ProviderMetadata** (provider lookup data)
- **UtilityMetadata** (utility lookup data)

**Soft Deletion**:
- D1 uses `deletedAt` timestamp (NOT `_deleted: false` like MongoDB)
- Enable with `trash: true` in collection config
- Creates trash view: `/admin/collections/{collection}/trash`

**Versioning**:
- ✅ **ENABLED** via `versions: { drafts: true }`
- Draft/Published workflow supported
- Autosave configurable (MongoDB version uses 375ms)

**Access Control Pattern** (to be implemented):
- Admin-only for create/update/delete (via `adminOnly` helper)
- Public read for published content (via `adminOrPublishedStatus` helper)

**Required Metadata Fields** (auto-added by Payload):
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp
- `deletedAt`: timestamp (for soft-deleted records) or null

---

## 📊 Migration Infrastructure Status

### ✅ What Exists (Copied from MongoDB)
- **Migration utilities** (31 files in `scripts/migration/lib/`)
  - `mdx-parser-v2.ts` - Parse MDX files with AST
  - `image-uploader.ts` & `payload-media-uploader.ts` - Upload to R2
  - `mdx-to-payload-blocks.ts` - Convert MDX to Lexical JSON
  - `lexical-inline-block-processor.ts` - Handle inline components
  - `resolve-rich-text-data-slugs.ts` - Resolve relationship slugs to IDs
  - `component-registry.ts` - Track component mappings
  - `rate-field-mapper.ts` & `provider-field-mapper.ts` - Field mapping
  - 24 more utilities...

- **Migration scripts** (38 files in `migration/scripts/`)
  - Analysis tools, seed scripts, validation tools

- **Claude Skills** (6 skills in `.claude/skills/`)
  - `mdx-to-lexical` - MDX conversion workflow
  - `payload-schema-generator` - Generate Payload schemas
  - `migration-validator` - Validation workflows
  - `schema-drift-detector` - API change detection
  - `skill-creator` - Create new skills
  - `validation-manager` - Manage custom validators

- **Test Script**:
  - `scripts/migration/import-abilene.ts` - Test single electricity-rate import
  - `tests/abilene-migration.spec.ts` - Playwright E2E validation

### ❌ What's Missing (Needs Porting from MongoDB)

#### Collections (CRITICAL)
- ❌ `src/collections/RichTextDataInstances.ts` - Dynamic data collection
- ❌ `src/collections/Providers/index.ts` - Provider collection with contentBlocks
- ❌ `src/collections/ProviderMetadata.ts` - Provider metadata
- ❌ `src/collections/UtilityMetadata.ts` - Utility metadata
- ⚠️ `src/collections/ElectricityRates.ts` - Exists but missing contentBlocks field

#### Lexical Infrastructure (CRITICAL)
- ❌ `src/lexical/blocks/` - **26 content block definitions**:
  - ImageBlock, RatesTableBlock, ProviderCardBlock
  - ProvidersPhoneTableBlock, PopularCitiesListBlock
  - PopularZipcodesBlock, ZipcodeSearchbarBlock
  - FaqRankMathBlock, TocRankMathBlock
  - HelpMeChooseBlock, LowestRateDisplayBlock
  - VcBasicGridBlock, AdvisorPostsTabsBlock
  - 13 WordPress legacy blocks (WpBlock*)

- ❌ `src/lexical/inlineBlocks/` - **10 inline block definitions**:
  - CurrentYear, CurrentMonth, YearsSince
  - DynamicDataInstance, DynamicDataInstanceInline
  - DynamicDataInstanceSimple (phone/email inserter)
  - ComparepowerReviewCount, AvgTexasResidentialRate
  - CurrentYearDirect, LowestRateDisplayBlock

- ❌ `src/blocks/MediaBlock/` - Media block component
- ❌ Lexical editor configuration in `payload.config.ts`

#### Supporting Code
- ❌ `src/access/` - Access control helpers (adminOnly, adminOrPublishedStatus)
- ❌ `src/lib/` - Migration status tracking
- ❌ `src/utilities/validators/` - Custom field validators
  - field-validators.ts (email, phone, URL, text, number, slug)
  - rich-text-validators.ts (heading hierarchy, accessibility)

---

## 🌩️ Cloudflare D1/R2 Specifics

### Database Differences (D1 vs MongoDB)

**D1 is SQLite**:
- Lighter-weight than MongoDB
- Different query patterns (handled by Payload abstractions)
- Sufficient for content management workloads

**Relationships**:
- Payload API abstracts database differences
- Should work identically to MongoDB version
- Test early with RichTextDataInstances relationships

**Transactions**:
- SQLite transactions instead of MongoDB multi-document
- Payload handles automatically

**Full-Text Search**:
- May need different approach than MongoDB text indexes
- Not critical for initial migration (future enhancement)

**Indexes**:
- Define with `index: true` in collection field config
- Payload generates appropriate SQLite indexes

### Storage Differences (R2 vs S3)

**No sharp Processing**:
- Image transforms unavailable on Workers
- Crop and focal point **disabled** in Media collection
- Upload original images without processing

**Upload API**:
- R2 plugin (`@payloadcms/storage-r2`) handles differences
- Same Payload API as S3 version
- Test with `image-uploader.ts` utilities

**Custom Domain**:
- Images served from `r2.payload.comparepower.com`
- Configured in `payload.config.ts` → `r2Storage` plugin

**Local Development**:
- Wrangler provides R2 binding automatically
- No additional configuration needed for local dev

### Workers Bundle Size Considerations

**Critical Constraint**:
- Free tier: 3MB bundle limit
- Paid tier: Larger limits
- Lexical + blocks = significant size

**Monitoring**:
- Check bundle size: `pnpm run build`
- Monitor `.open-next/worker.js` size
- May require paid Workers plan

**Mitigation**:
- Code splitting where possible
- Remove unused blocks if needed
- Optimize imports

---

## 🗺️ Implementation Roadmap

### Current Sprint: Foundation (Phase 1 - Weeks 1-2)
**Goal**: Build target infrastructure to match MongoDB capabilities

**Status**: 🏗️ In Progress

**Tasks**:
1. ✅ Create ElectricityRates collection (DONE - basic schema)
2. ⏳ Port RichTextDataInstances collection from MongoDB
3. ⏳ Port Providers collection from MongoDB
4. ⏳ Port ProviderMetadata & UtilityMetadata
5. ⏳ Update ElectricityRates with contentBlocks field
6. ⏳ Copy access control helpers (`src/access/`)
7. ⏳ Copy validators (`src/utilities/validators/`)
8. ⏳ Register all collections in `payload.config.ts`
9. ⏳ Run migration to create D1 tables
10. ⏳ Test manual record creation in admin UI

**Success Criteria**:
- ✅ Can manually create records in all collections
- ✅ Admin UI shows all collections
- ✅ Relationships work in D1 (test with RichTextDataInstances)
- ✅ Soft delete (trash) works correctly

### Next Sprint: Lexical Infrastructure (Phase 2 - Week 3)
**Goal**: Enable rich content editing with full block support

**Tasks**:
1. Copy all 26 content blocks from MongoDB (`src/lexical/blocks/`)
2. Copy all 10 inline blocks from MongoDB (`src/lexical/inlineBlocks/`)
3. Copy MediaBlock component (`src/blocks/MediaBlock/`)
4. Update `payload.config.ts` with full Lexical configuration:
   - Add BlocksFeature with CONTENT_BLOCKS
   - Add InlineBlocksFeature with INLINE_BLOCKS
   - Configure LinkFeature, UploadFeature, etc.
5. Test block insertion in admin UI
6. Verify blocks save correctly to D1
7. Test inline blocks (especially DynamicDataInstanceSimple for phones)

**Success Criteria**:
- ✅ Lexical editor shows all 26 content blocks
- ✅ Can insert and edit blocks in contentBlocks field
- ✅ Can insert inline blocks (phone numbers)
- ✅ Blocks persist correctly in D1

### Future Sprint: Utilities Testing (Phase 3 - Week 4)
**Goal**: Ensure migration utilities work with D1/R2

**Tasks**:
1. Test image upload with R2 binding
2. Test MDX parser with sample Abilene file
3. Test MDX-to-Blocks conversion
4. Test relationship resolution with D1 queries
5. Adapt any MongoDB-specific queries if needed
6. Run `import-abilene.ts` end-to-end

**Success Criteria**:
- ✅ Images upload to R2 successfully
- ✅ MDX parses and converts to Lexical JSON
- ✅ Inline block slugs resolve to relationship IDs
- ✅ Can import Abilene successfully

### Future Sprint: Data Preparation (Phase 4 - Week 5)
**Goal**: Prepare seed data for migration

**Tasks**:
1. Create RichTextDataInstances seed data (18+ phone numbers)
2. Create seed script for RichTextDataInstances
3. Test seeding with D1
4. Extract electricity-rates data (or use MongoDB export)
5. Verify component registry completeness

**Success Criteria**:
- ✅ RichTextDataInstances seeded successfully
- ✅ Can query instances by slug
- ✅ Seed data validated
- ✅ Ready for full migration

### Future Sprint: Migration Execution (Phase 5 - Weeks 6-7)
**Goal**: Run full electricity-rates and providers migration

**Tasks**:
1. Run pre-flight validation (check unmapped components)
2. Seed RichTextDataInstances first
3. Migrate 5-10 electricity-rates as test batch
4. Verify in admin UI
5. Run full electricity-rates migration (896 files)
6. Track failures and iterate
7. Migrate providers collection (157 files)

**Success Criteria**:
- ✅ Can migrate 1 rate successfully
- ✅ Can migrate 10 rates
- ✅ Success rate ≥ 90% (806+ rates)
- ✅ All rates viewable in admin

### Future Sprint: Validation (Phase 6 - Week 8)
**Goal**: Ensure migration quality

**Tasks**:
1. Run Playwright tests (`abilene-migration.spec.ts`)
2. Verify inline phone blocks render
3. Verify images load from R2
4. Compare content quality vs MongoDB version
5. Performance testing with D1

**Success Criteria**:
- ✅ Playwright tests pass
- ✅ No data loss vs source MDX
- ✅ Images display correctly
- ✅ Admin UI performs well

---

## 📋 Migration Strategy

### Phase 1: Discovery & Analysis (MongoDB Reference)
1. Scan Astro content directory for all MDX files
2. Parse frontmatter to discover ALL fields (not just Astro schema)
3. Extract MDX components and map to Payload blocks
4. Analyze relationships (Team members, categories, tags)
5. Generate field mapping documentation

**Status**: ✅ Complete in MongoDB project (used as reference)

### Phase 2: Schema Generation (MongoDB Reference)
1. Generate Payload collection configs from analysis
2. Map MDX components to Payload block types
3. Ensure all frontmatter fields are captured
4. Handle nested fields (SEO group, hero group, etc.)

**Status**: ✅ Complete in MongoDB project (porting to Cloudflare)

### Phase 3: Data Preparation
1. Parse MDX files with frontmatter
2. Convert markdown content to Lexical JSON
3. Map components to content blocks
4. Generate unique slugs (path-based to avoid duplicates)
5. Upload images to R2

**Tools**: `mdx-to-payload-blocks.ts`, `image-uploader.ts`

### Phase 4: Database Seeding
1. Seed RichTextDataInstances FIRST (phone numbers, emails)
2. Seed electricity-rates using Payload API
3. Add required Payload metadata: `deletedAt: null`, `createdAt`, `updatedAt`
4. Batch processing for performance
5. Resolve inline block slugs to relationship IDs

**Tools**: `seed-rich-text-data.ts`, `import-abilene.ts`

### Phase 5: Verification
1. Direct D1 queries to validate field presence
2. Payload admin UI testing (login, list, click records)
3. Field-by-field comparison with source frontmatter
4. Relationship integrity checks
5. Playwright automated testing

**Tools**: `abilene-migration.spec.ts`, validation scripts

---

## 📁 File Structure

```
payload-cms-cloudflare-baseline/
├── .claude/
│   ├── CLAUDE.MD                          ← YOU ARE HERE (main entry point)
│   ├── GITHUB-ISSUES-WORKFLOW.md         ← Workflow methodology (for future)
│   ├── SCRIPT-ORGANIZATION.md            ← Script categorization methodology
│   ├── skills/                           ← 6 Claude Code Skills
│   └── projects/                         ← Project documentation (MongoDB ref)
├── src/
│   ├── payload.config.ts                 ← Main Payload configuration
│   ├── collections/
│   │   ├── ElectricityRates.ts           ← Electricity rates (basic, needs contentBlocks)
│   │   ├── Media.ts                      ← Simple upload config
│   │   ├── Users.ts                      ← Basic auth
│   │   └── (TO ADD: RichTextDataInstances, Providers, Metadata)
│   ├── access/                           ← (TO CREATE: adminOnly helpers)
│   ├── lib/                              ← (TO CREATE: migration-status)
│   ├── utilities/validators/             ← (TO CREATE: custom validators)
│   ├── lexical/                          ← (TO CREATE: blocks + inlineBlocks)
│   └── blocks/                           ← (TO CREATE: MediaBlock)
├── scripts/
│   ├── dev.sh                            ← Doppler wrapper for local dev
│   ├── migration/
│   │   ├── lib/                          ← 31 migration utilities
│   │   └── import-abilene.ts             ← Test single import
│   └── (future: seed scripts, validators)
├── tests/
│   └── abilene-migration.spec.ts         ← Playwright E2E test
├── wrangler.jsonc                        ← Cloudflare bindings config
└── package.json                          ← Project dependencies
```

---

## 🔧 Commands Reference

### Development
```bash
# Start Payload dev server (Wrangler handles D1/R2 bindings)
pnpm dev
# → http://localhost:3000/admin

# OR with Doppler secrets:
./scripts/dev.sh
# → http://localhost:3000/admin

# Login credentials (from Doppler)
# Email: brad@comparepower.com
# Password: deh2xjt1CHW_dmd.gxj
```

### Database Migrations
```bash
# Create new migration file
bash -c 'DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_DEV:" .doppler-tokens | cut -d":" -f2) && export DOPPLER_TOKEN && doppler run -- pnpm run payload migrate:create'

# Run pending migrations (creates D1 tables)
bash -c 'DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_DEV:" .doppler-tokens | cut -d":" -f2) && export DOPPLER_TOKEN && doppler run -- pnpm run payload migrate'
```

### Migration Commands (After Infrastructure Built)
```bash
# 1. Seed RichTextDataInstances (phone numbers, emails)
bash -c 'DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_DEV:" .doppler-tokens | cut -d":" -f2) && export DOPPLER_TOKEN && doppler run -- pnpm exec tsx scripts/migration/seed-rich-text-data.ts'

# 2. Import Abilene test record
bash -c 'DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_DEV:" .doppler-tokens | cut -d":" -f2) && export DOPPLER_TOKEN && doppler run -- pnpm exec tsx scripts/migration/import-abilene.ts'

# 3. Run full electricity-rates migration
bash -c 'DOPPLER_TOKEN=$(grep "DOPPLER_TOKEN_DEV:" .doppler-tokens | cut -d":" -f2) && export DOPPLER_TOKEN && doppler run -- pnpm exec tsx scripts/migration/seed-electricity-rates.ts'

# 4. Run Playwright validation
pnpm run test:e2e tests/abilene-migration.spec.ts
```

### Cloudflare Deployment
```bash
# Build for production
pnpm run build

# Deploy database migrations to production D1
CLOUDFLARE_ENV=production pnpm run deploy:database

# Deploy application to Cloudflare Workers
CLOUDFLARE_ENV=production pnpm run deploy:app

# Or deploy everything
CLOUDFLARE_ENV=production pnpm run deploy
```

### Utilities
```bash
# Generate Payload types
pnpm run generate:types:payload

# Generate Cloudflare types
pnpm run generate:types:cloudflare

# Lint
pnpm run lint

# Tests
pnpm run test           # All tests
pnpm run test:int       # Integration tests
pnpm run test:e2e       # E2E tests (Playwright)
```

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

**Examples**:

❌ **BAD** - Terrible relative imports:
```typescript
import { parseMDXToBlocks } from '../../../../../../scripts/migration/lib/mdx-to-payload-blocks'
const ASTRO_PATH = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro'
```

✅ **GOOD** - Clean aliases:
```typescript
import { parseMDXToBlocks } from '@/scripts/migration/lib/mdx-to-payload-blocks'
const ASTRO_PATH = process.env.ASTRO_CONTENT_PATH || '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro'
```

**Why**: Relative imports are fragile, hard to maintain, and break when files move. Aliases provide stable, readable imports.

### Playwright Testing Requirement

**CRITICAL**: Never report migration work as complete without Playwright verification.

**Workflow**:
1. Implement migration feature
2. Write Playwright test covering user flows
3. Run tests: `pnpm test:e2e`
4. Fix any failing tests
5. ONLY after tests pass → declare work complete

**Why**: Manual testing misses edge cases. Automated tests catch bugs before they reach production.

---

## 🚨 Critical Lessons Learned

### Lesson 1: Soft Delete with D1 (NOT like MongoDB)
**Problem**: D1 uses different soft-delete mechanism than MongoDB.

**MongoDB Version**: Used `_deleted: false` boolean field

**D1 Version**: Uses `deletedAt: null` timestamp field

**Solution**: Enable trash in collection config:
```typescript
export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  trash: true,  // Enables soft delete with deletedAt field
  // ...
}
```

**Effect**: Creates `/admin/collections/my-collection/trash` view for soft-deleted records.

### Lesson 2: Duplicate Slugs (Still Relevant from MongoDB)
**Problem**: Multiple MDX files with same base filename in different directories caused duplicate slug errors.

**Example**:
- `_drafts/ratings/index.mdx` → slug: "ratings"
- `texas-electricity-energy-companies/_drafts/ratings/index.mdx` → slug: "ratings" (duplicate!)

**Solution**: Use full relative path for slug generation:
```typescript
function generateUniqueSlug(filePath: string, sourceDir: string): string {
  const relativePath = path.relative(sourceDir, filePath)
  return relativePath
    .replace(/\/index\.mdx$/, '')
    .replace(/\.mdx$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
}
// Result: "drafts-ratings" vs "texas-electricity-energy-companies-drafts-ratings"
```

### Lesson 3: R2 Image Upload Testing
**Problem**: R2 has different characteristics than S3.

**Solution**: Test early with small batch:
```typescript
// Test single image upload BEFORE bulk migration
const testImage = await uploadImageToPayload(
  payload,
  {
    assetId: 'test-hero-image',
    filePath: '/path/to/test-image.jpg',
    alt: 'Test Image',
    caption: undefined
  }
)
console.log('Test upload successful:', testImage.url)
// Verify image loads from r2.payload.comparepower.com
```

### Lesson 4: Workers Bundle Size
**Problem**: Lexical + blocks = large bundle size.

**Solution**: Monitor during development:
```bash
pnpm run build
# Check .open-next/worker.js size
# If > 3MB on free tier, need paid plan
```

### Lesson 5: Component Registry Critical
**Problem**: Migrating with unmapped components causes failures.

**Solution**: Pre-flight validation from MongoDB project:
```typescript
// BEFORE migration, check for unmapped components
for each MDX file {
  const components = extractComponents(mdxContent)
  const unmapped = components.filter(c => !componentRegistry.has(c))
  if (unmapped.length > 0) {
    throw new Error(`Unmapped components: ${unmapped.join(', ')}`)
  }
}
```

**Benefit**: Fail fast, fix mapping, then run migration successfully.

---

## 📝 Documentation Update Protocol

**CRITICAL**: Update this file whenever you:
- Port collections or blocks from MongoDB project
- Discover D1/R2-specific differences
- Encounter and fix errors
- Learn new constraints or requirements
- Complete implementation phases
- Change baseline configurations

**DO NOT** wait for user to tell you to update documentation. This is your job.

**Update sections**:
- Implementation Roadmap → When completing phases
- Collections Status → When porting collections
- Lexical Infrastructure → When adding blocks
- Critical Lessons Learned → When encountering/fixing errors
- Commands Reference → When creating new scripts

---

## 🔗 Related Documentation

### Project Documentation
- [README.md](../README.md) - Project overview and setup
- [.claude/GITHUB-ISSUES-WORKFLOW.md](.claude/GITHUB-ISSUES-WORKFLOW.md) - Development workflow (for future)
- [.claude/SCRIPT-ORGANIZATION.md](.claude/SCRIPT-ORGANIZATION.md) - Script categorization methodology

### MongoDB Reference Project
- Path: `/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo`
- Status: 93% complete (146/157 providers migrated)
- Reference for: collections, blocks, utilities, patterns

### Migration Documentation (MongoDB Project)
- [COMPONENT-REGISTRY-DESIGN.md](../migration/COMPONENT-REGISTRY-DESIGN.md) - Type-safe MDX ↔ Payload mapping
- [COMPLETE-MIGRATION-GUIDE.md](../migration/COMPLETE-MIGRATION-GUIDE.md) - Comprehensive guide (11k+ lines)

### Skills
- [.claude/skills/mdx-to-lexical/](skills/mdx-to-lexical/) - MDX conversion workflow
- [.claude/skills/payload-schema-generator/](skills/payload-schema-generator/) - Schema generation
- [.claude/skills/migration-validator/](skills/migration-validator/) - Validation workflows

---

**Last Updated**: 2025-11-10 (Initial Cloudflare D1/R2 version created from MongoDB template)
**Updated By**: Claude Code (Adapted MongoDB CLAUDE.MD for Cloudflare project)
**Next Update**: When Phase 1 collections are ported
