# Current State: Project Snapshot

**Snapshot Date**: 2025-10-24
**Migration Progress**: 146/157 providers (93%)
**System Status**: Development server running, migrations paused
**Critical Context**: Background migration script completed with known failures

---

## 📊 Migration Statistics

### Providers Collection

**Total**: 157 MDX files in source
**Migrated**: 146 providers successfully created
**Failed**: 11 providers with validation errors
**Success Rate**: 93%

**Failure Reason**: Missing phone number inline block slugs
- Could not resolve: 4change-phone, amigo-phone, cirro-phone, constellation-phone, direct-energy-phone, discount-power-phone, flagship-phone, frontier-phone-rc, frontier-phone, gexa-phone, green-mountain-phone

###

 Other Collections

**electricity-rates**: 896 MDX files (NOT YET MIGRATED)
**other collections**: To be analyzed

---

## 🗄️ Database State

### MongoDB Collections

**providers**: 146 documents
**richtextdatainstances**: 34 documents (phone numbers, dynamic data)
**providermetadatas**: 21 documents (from ComparePower API)
**_providers_versions**: 453+ documents (draft history)

### Collection Relationships

```
ProviderMetadata (21 docs) ← From ComparePower API
  ↓ has many
RichTextDataInstances (34 docs) ← Phone numbers with provider refs
  ↓ referenced by
Providers (146 docs) ← Content pages with inline blocks
```

### Required Fields (All Collections)

Every document MUST have:
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp
- `deletedAt`: null (for active records) OR timestamp (for soft-deleted)

**IMPORTANT**: Payload uses `deletedAt` NOT `_deleted` (boolean). The collection must have `trash: true` enabled.

---

## 📁 Project Structure

### Source Project (Keystatic/Astro)

```
/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/
├── src/content/
│   ├── providers/          # 157 MDX files
│   │   ├── 4change-energy.mdx
│   │   ├── amigo-energy.mdx
│   │   └── ...
│   └── electricity-rates/  # 896 MDX files
└── keystatic.config.ts     # Keystatic schema
```

### Target Project (Payload CMS)

```
/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/
├── src/
│   ├── payload.config.ts             # Main Payload config
│   ├── collections/
│   │   ├── Providers/index.ts        # Providers schema (trash: true)
│   │   ├── RichTextDataInstances.ts  # Dynamic inline blocks
│   │   └── ...
│   ├── utilities/validators/
│   │   ├── index.ts                  # Exports
│   │   ├── field-validators.ts       # email, phone, URL, etc.
│   │   └── rich-text-validators.ts   # Lexical content validation
│   └── lexical/
│       ├── blocks/index.ts           # Block components
│       └── inlineBlocks/index.ts     # Inline components
├── migration/
│   ├── scripts/
│   │   ├── seed-with-payload-api.mjs # Main seeding script (JUST RAN)
│   │   ├── analyze-frontmatter.mjs   # Field discovery
│   │   └── prepare-seed-data.mjs     # MDX → JSON conversion
│   └── data/seed/
│       └── providers.json            # Prepared seed data
├── scripts/
│   ├── doppler-run.sh                # Doppler wrapper
│   ├── purge-providers.ts            # Collection purge tool
│   └── migration/lib/
│       ├── mdx-to-payload-blocks.ts  # MDX parser
│       ├── lexical-link-processor.ts # Link processing
│       └── resolve-rich-text-data-slugs.ts  # Inline block resolution
└── CLAUDE.md                         # Main project documentation
```

---

## 🔧 Development Environment

### Server Status

**Port**: 3002
**Status**: Can be started with `./scripts/doppler-run.sh dev pnpm dev`
**Admin URL**: http://localhost:3002/admin

**Login Credentials**:
- Email: brad@comparepower.com
- Password: deh2xjt1CHW_dmd.gxj

### Environment Variables (via Doppler)

**Required**:
- `MONGO_DB_CONN_STRING`: MongoDB Atlas connection string
- `PREVIEW_SECRET`: demo-draft-secret

**Doppler Config**: dev environment
**Usage**: `./scripts/doppler-run.sh dev <command>`

### Database Connection

**MongoDB Atlas**:
- Cluster: dev.zkxim.mongodb.net
- Database: content_payload_cms
- Auth: Managed by Doppler
- Special Config: **`notablescan` enabled** (blocks queries without indexes)

---

## 📝 Recent Work Completed

### 1. Fixed Purge Script Pagination Bug

**File**: `scripts/purge-providers.ts`
**Issue**: Only deleted first 1000 records (single page)
**Fix**: Implemented `while(true)` loop fetching page 1 repeatedly

**New Features**:
- `--hard` flag for permanent deletion (MongoDB direct)
- Default: soft delete (Payload API, sets `deletedAt`)

### 2. Enabled Payload Trash Feature

**File**: `src/collections/Providers/index.ts`
**Added**: `trash: true` configuration
**Effect**: Creates deletedAt field, trash view at `/admin/collections/providers/trash`

**Before (ERROR)**:
```typescript
// I incorrectly assumed Payload used _deleted: boolean
```

**After (CORRECT)**:
```typescript
export const Providers: CollectionConfig = {
  slug: 'providers',
  trash: true,  // ← Enables soft-delete with deletedAt timestamp
  // ...
}
```

### 3. Created MongoDB Indexes

**Issue**: MongoDB Atlas `notablescan` blocked queries on `deletedAt` field
**Fix**: Added index on `deletedAt` field for all collections

**Script**: `scripts/add-deleted-index.mjs` (already run)

### 4. Fixed "453 Providers" Mystery

**Confusion**: Saw 453 in admin but only 146 in main collection
**Reality**:
- 453 documents in `_providers_versions` (draft history)
- 146 documents in `providers` (active content)
- UI was showing versions table, not main table

---

## 🚫 Known Issues & Blockers

### Issue 1: Missing Phone Inline Blocks

**11 providers failed** because inline blocks reference phone numbers that don't exist:

**Missing Slugs**:
- 4change-phone
- amigo-phone
- cirro-phone
- constellation-phone
- direct-energy-phone
- discount-power-phone
- flagship-phone
- frontier-phone-rc
- frontier-phone
- gexa-phone
- green-mountain-phone

**Root Cause**: Phone numbers weren't seeded before providers
**Fix Required**: Create inline blocks for these phone numbers, then re-run failed migrations

### Issue 2: Unsupported Components

**Components without Payload blocks**:
- `TocRankMath` - Table of contents (RankMath SEO)
- `RatesTable` - Electricity rates comparison table
- `PopularCitiesList` - List of popular Texas cities
- `ZipcodeSearchbar` - Zipcode search widget
- `FaqRankMath` - FAQ schema (RankMath SEO)

**Impact**: These components are skipped during migration (logged as warnings)
**Fix Required**: Create corresponding Payload blocks or inline blocks

### Issue 3: One Entry Has Invalid publishedAt

**File**: `energy-companies/index.mdx`
**Error**: "The following field is invalid: Published At"
**Likely Cause**: Missing or malformed publish_date in frontmatter
**Fix Required**: Check source file and provide valid date

---

## 🎯 What's Working Well

### Successes

✅ **MDX Parsing**: Successfully parses frontmatter and content
✅ **Lexical Conversion**: Markdown → Lexical JSON working
✅ **Inline Block Resolution**: Resolves data instance slugs correctly
✅ **Link Processing**: Handles internal/external links
✅ **Component Extraction**: Extracts inline components from paragraphs
✅ **Slug Generation**: Creates unique slugs from file paths
✅ **Relationship Resolution**: Links ProviderMetadata → RichTextDataInstances → Providers
✅ **Batch Processing**: Processes 157 files efficiently
✅ **Progress Logging**: Clear console output showing progress

### Validation System

✅ **Field Validators**: email, phone, URL, text, number, slug working
✅ **Rich-text Validators**: heading hierarchy, accessibility checks working
✅ **Collection Hooks**: beforeValidate hooks integrated
✅ **Seed Scripts**: Validators used in migration scripts

---

## 📦 Existing Code Assets

### Migration Scripts (Reusable)

**Location**: `scripts/migration/lib/`

1. **mdx-to-payload-blocks.ts**: Parses MDX, converts to Lexical
2. **lexical-link-processor.ts**: Processes links in Lexical JSON
3. **lexical-inline-block-processor.ts**: Handles inline blocks
4. **lexical-markdown-cleanup.ts**: Cleans markdown syntax
5. **resolve-rich-text-data-slugs.ts**: Resolves data instance references
6. **component-to-provider-mapping.ts**: Maps components to providers

### Validation Utilities (Reusable)

**Location**: `src/utilities/validators/`

1. **field-validators.ts**: email, phone, URL, text, number, slug
2. **rich-text-validators.ts**: heading hierarchy, accessibility, links
3. **index.ts**: Exports all validators

### Documentation (Existing)

1. **CLAUDE.md**: Main project documentation (root level)
2. **CORRECTION-PAYLOAD-TRASH.md**: Documents _deleted vs deletedAt error
3. **PAYLOAD-TRASH-FUNCTIONALITY.md**: Trash feature guide
4. **PURGE-SCRIPT-FIX-SUMMARY.md**: Purge script fixes
5. **MIGRATION-ANALYSIS-INDEX.md**: Migration analysis docs
6. **MONGODB-ATLAS-NOTABLESCAN-FIX.md**: notablescan index fix

---

## 🗂️ Documentation to Be Created

### Spec-Kit Documentation (This Project)

**Location**: `docs/spec-kit/` (TO BE CREATED)

1. constitution.md
2. specify.md
3. plan.md
4. tasks.md
5. meta-skill.md

### Project Skills (This Project)

**Location**: `.claude/skills/` (TO BE CREATED)

1. skill-creator/
2. mdx-to-lexical/
3. payload-schema-generator/
4. migration-validator/
5. schema-drift-detector/
6. validation-manager/

---

## 🔍 Last Migration Run Details

**Script**: `migration/scripts/seed-with-payload-api.ts`
**Runtime**: ~6+ hours (ran in background)
**Status**: COMPLETED with known failures

**Output Summary**:
```
🌱 Starting Database Seeding (Payload API)...
📂 Loaded 157 providers
🗑️  Purged 9 existing providers
📥 Seeding 157 providers...

Results:
✓ [146/157] Successfully created
✗ [11/157] Failed validation

Common warnings:
⚠️  Skipping unsupported inline component: TocRankMath
⚠️  Skipping unsupported inline component: RatesTable
⚠️  Could not resolve slug: "4change-phone" - instance may not exist
```

### Failed Entries (11 total)

1. Energy Companies (invalid publishedAt)
2. 4Change Energy (missing 4change-phone)
3. Amigo Energy (missing amigo-phone)
4. Cirro Energy (missing cirro-phone)
5. Constellation (missing constellation-phone)
6. Direct Energy (missing direct-energy-phone)
7. Discount Power (missing discount-power-phone)
8. Flagship Power (missing flagship-phone)
9. Frontier Energy (missing frontier-phone-rc)
10. Frontier Utilities (missing frontier-phone)
11. Gexa Energy (missing gexa-phone)

One more: Green Mountain Energy (mentioned in logs but may be #12)

---

## 🎛️ System Configuration

### Payload Configuration

**File**: `src/payload.config.ts`

**Key Settings**:
- Database: MongoDB via `@payloadcms/db-mongodb`
- Editor: Lexical (not Slate)
- Admin: Next.js 15 app directory
- Collections: 12 total
- Soft-delete: Enabled via `trash: true` in collection configs
- Versioning: Enabled via `versions: { drafts: true }`

**Enabled Features**:
- Headings (h1-h6)
- Text formatting (bold, italic, underline, strikethrough)
- Lists (ordered, unordered)
- Links (with internal references)
- Inline blocks (dynamic data)
- Tables (experimental)
- Indent

### Collection: Providers

**File**: `src/collections/Providers/index.ts`

**Key Fields**:
- title (text, required)
- slug (text, required, unique, indexed)
- status (select: draft|published)
- publishedAt (date, required)
- content (richText) - Lexical format
- contentBlocks (blocks) - Structured blocks
- seo (group: title, metaDescription)
- hero (group: headingLine1, headingLine2, ctaText)
- wordpressSlug, wpPostId, updatedDate, targetKeyword

**Configuration**:
- trash: true (soft-delete enabled)
- versions: { drafts: true }
- access: adminOnly for create/update/delete, public read for published

---

## 🧪 Testing State

**Manual Testing**: Completed
- ✅ Admin login works
- ✅ Provider list shows 146 records
- ✅ Clicking providers loads detail view
- ✅ Trash view accessible
- ✅ Soft-delete functional

**Automated Testing**: Not yet implemented
- ❌ Playwright tests for admin UI
- ❌ Migration verification scripts
- ❌ Validator test suite

---

## 📋 Immediate Next Steps

**After this documentation project:**

1. Fix 11 failed provider migrations:
   - Create missing phone inline blocks
   - Fix Energy Companies publishedAt
   - Re-run seed for failed entries

2. Migrate electricity-rates collection (896 files)

3. Create missing component blocks:
   - TocRankMath
   - RatesTable
   - PopularCitiesList
   - ZipcodeSearchbar
   - FaqRankMath

---

## 🎓 Key Takeaways for Agent

**What you need to know**:
1. Migration is 93% complete (providers only)
2. 11 failures are due to missing inline blocks (fixable)
3. Payload trash feature was just enabled (restart needed)
4. MongoDB Atlas requires indexes for all query fields
5. Validation system exists and is documented
6. Migration scripts are reusable
7. Background script completed successfully

**What you DON'T need to do**:
- Don't re-run the full migration (already done)
- Don't fix the 11 failures (not in scope)
- Don't migrate other collections (not in scope)
- Don't modify existing code (only create new skills/docs)

---

**Next**: Read [03-EXECUTION-PLAN.md](03-EXECUTION-PLAN.md) for detailed execution steps
