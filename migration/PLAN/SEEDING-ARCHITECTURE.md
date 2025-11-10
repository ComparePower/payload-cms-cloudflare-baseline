# Payload CMS Seeding System Architecture

**Purpose**: Reusable content migration and database seeding system that can bootstrap any Payload CMS instance from source content.

**Date**: 2025-10-23

---

## Design Goals

1. **Repeatable**: Can run on fresh Payload instances multiple times
2. **Idempotent**: Safe to re-run without duplicating data
3. **Configurable**: Target any Payload instance via configuration
4. **Complete**: Generates both Payload config code AND seed data
5. **Validated**: Ensures data quality before and after seeding
6. **Documented**: Every step tracked and logged

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOURCE CONTENT                            │
│  /cp-content-site-astro/src/content/front-end/providers/   │
│  - 157 MDX files with frontmatter                           │
│  - 49 unique Astro components                               │
│  - Images and media files                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PHASE 1: ANALYSIS & VALIDATION                  │
│  ✅ scripts/analyze-providers.mjs                           │
│  ✅ scripts/validate-components.mjs                         │
│  ├─ Find all components in source                           │
│  ├─ Extract TypeScript interfaces                           │
│  ├─ Validate all usages against types                       │
│  └─ Generate validation reports                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         PHASE 2: PAYLOAD CONFIG GENERATION                   │
│  🆕 scripts/generate-payload-config.mjs                     │
│  ├─ Read component-props.json                               │
│  ├─ Generate Block definitions (TypeScript)                 │
│  ├─ Generate Collection configs (TypeScript)                │
│  ├─ Generate Field schemas                                  │
│  └─ Output ready-to-use Payload config files                │
│                                                              │
│  Output:                                                     │
│  ├─ generated/blocks/                                       │
│  │   ├─ RatesTable.ts                                       │
│  │   ├─ ZipcodeSearchbar.ts                                 │
│  │   └─ ... (all component blocks)                          │
│  ├─ generated/collections/                                  │
│  │   └─ Providers.ts                                        │
│  └─ generated/payload.config.snippet.ts                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           PHASE 3: DATA PREPARATION                          │
│  🆕 scripts/prepare-seed-data.mjs                           │
│  ├─ Convert MDX → Lexical JSON                              │
│  ├─ Extract all images and media                            │
│  ├─ Build relationship maps                                 │
│  ├─ Resolve parent/child hierarchies                        │
│  └─ Generate seed data files                                │
│                                                              │
│  Output:                                                     │
│  ├─ seed-data/                                              │
│  │   ├─ providers.json          (157 entries)               │
│  │   ├─ media.json               (all images)               │
│  │   ├─ richTextDataInstances.json (19 phone numbers)       │
│  │   └─ relationships.json       (parent/child maps)        │
│  └─ seed-data/media/              (copied image files)      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PHASE 4: DATABASE SEEDING                       │
│  🆕 scripts/seed-database.mjs                               │
│  ├─ Connect to target Payload instance                      │
│  ├─ Check/create collections                                │
│  ├─ Upload all media files                                  │
│  ├─ Create RichTextDataInstances                            │
│  ├─ Create content entries (with relationships)             │
│  └─ Validate seeded data                                    │
│                                                              │
│  Config: seed.config.json                                   │
│  ├─ target: { url, secret }                                 │
│  ├─ collections: ['providers', 'media', ...]                │
│  ├─ mode: 'seed' | 'update' | 'upsert'                      │
│  └─ options: { skipExisting, dryRun, ... }                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          PHASE 5: VERIFICATION & REPORTING                   │
│  🆕 scripts/verify-seeded-data.mjs                          │
│  ├─ Query all seeded entries                                │
│  ├─ Verify relationships                                    │
│  ├─ Check media uploads                                     │
│  ├─ Compare with source data                                │
│  └─ Generate completion report                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  TARGET PAYLOAD INSTANCE                     │
│  - Fully configured payload.config.ts                       │
│  - All blocks and collections defined                       │
│  - Database populated with 157 entries                      │
│  - All relationships intact                                 │
│  - All media uploaded                                       │
│  - Ready for production use                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
migration/
├── 00-MIGRATION-PLAN.md                    ✅ Master plan
├── 02-component-mapping.md                 ✅ Component strategy
├── SEEDING-ARCHITECTURE.md                 🆕 This file
├── FINDINGS-SUMMARY.md                     ✅ Analysis results
│
├── config/
│   └── seed.config.json                    🆕 Seeding configuration
│       ├─ target: { url, secret, database }
│       ├─ source: { path, collections }
│       ├─ collections: [...]
│       ├─ mode: 'seed' | 'update'
│       └─ options: { skipExisting, dryRun }
│
├── scripts/
│   ├── analyze-providers.mjs               ✅ Source analysis
│   ├── validate-components.mjs             ✅ Component validation
│   ├── generate-payload-config.mjs         🆕 Config generator
│   ├── prepare-seed-data.mjs               🆕 Data preparation
│   ├── seed-database.mjs                   🆕 Database seeding
│   └── verify-seeded-data.mjs              🆕 Post-seed verification
│
├── data/
│   ├── providers-analysis.json             ✅ Analysis results
│   ├── providers-tree.json                 ✅ Hierarchy tree
│   ├── components-found.json               ✅ All components
│   ├── component-validation.json           ✅ Validation results
│   └── component-props.json                ✅ Component interfaces
│
├── generated/                              🆕 Auto-generated code
│   ├── blocks/
│   │   ├── RatesTable.ts                   🆕 Generated block
│   │   ├── ZipcodeSearchbar.ts             🆕 Generated block
│   │   ├── TocRankMath.ts                  🆕 Generated block
│   │   └── ... (all 34 component blocks)
│   ├── collections/
│   │   ├── Providers.ts                    🆕 Generated collection
│   │   └── RichTextDataInstances.ts        🆕 Generated collection
│   ├── payload.config.snippet.ts           🆕 Config snippet
│   └── README.md                           🆕 Integration instructions
│
├── seed-data/                              🆕 Prepared seed data
│   ├── providers.json                      🆕 157 entries (Lexical)
│   ├── media.json                          🆕 Image metadata
│   ├── richTextDataInstances.json          🆕 19 phone numbers
│   ├── relationships.json                  🆕 Parent/child maps
│   └── media/                              🆕 Copied image files
│       ├── provider-1/
│       │   ├── heroImage.png
│       │   └── images/
│       └── ...
│
└── logs/
    ├── seed-YYYY-MM-DD-HH-MM-SS.log        🆕 Seeding logs
    └── verification-YYYY-MM-DD.log         🆕 Verification logs
```

---

## Configuration System

### seed.config.json

```json
{
  "target": {
    "url": "http://localhost:3001",
    "apiSecret": "env:PAYLOAD_SECRET",
    "database": "mongodb://localhost/payload-cms"
  },

  "source": {
    "astroProject": "/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro",
    "contentPath": "src/content/front-end/providers",
    "componentsPath": "src/components"
  },

  "collections": {
    "providers": {
      "slug": "providers",
      "hierarchical": true,
      "enabled": true
    },
    "media": {
      "slug": "media",
      "enabled": true
    },
    "richTextDataInstances": {
      "slug": "richTextDataInstances",
      "enabled": true,
      "createDefaults": true
    }
  },

  "mode": "seed",

  "options": {
    "skipExisting": true,
    "dryRun": false,
    "verbose": true,
    "batchSize": 10,
    "trackProgress": true,
    "generateBackup": true
  },

  "validation": {
    "strictMode": true,
    "failOnErrors": true,
    "failOnWarnings": false
  }
}
```

---

## Phase 2: Config Generator

### generate-payload-config.mjs

**Purpose**: Generate TypeScript Payload config files from component validation data

**Input**:
- `component-props.json` - Component TypeScript interfaces
- `component-validation.json` - Validation results
- `component-mapping.md` - Manual mapping decisions

**Output**:
- `generated/blocks/*.ts` - Block definitions
- `generated/collections/*.ts` - Collection configs
- `generated/payload.config.snippet.ts` - Integration code

**Process**:

1. **Read component-props.json**
   ```javascript
   {
     "RatesTable": {
       "required": ["provider", "utility"],
       "optional": ["showComparison", "rateType"],
       "types": {
         "provider": "string",
         "utility": "string",
         "showComparison": "boolean",
         "rateType": "'fixed' | 'variable'"
       }
     }
   }
   ```

2. **Generate Block Definition**
   ```typescript
   // generated/blocks/RatesTable.ts
   import { Block } from 'payload/types'

   export const RatesTable: Block = {
     slug: 'ratesTable',
     interfaceName: 'RatesTableBlock',
     fields: [
       {
         name: 'provider',
         type: 'text',
         required: true,
         admin: {
           description: 'Provider ID or name'
         }
       },
       {
         name: 'utility',
         type: 'text',
         required: true,
         admin: {
           description: 'Utility company ID'
         }
       },
       {
         name: 'showComparison',
         type: 'checkbox',
         defaultValue: false
       },
       {
         name: 'rateType',
         type: 'select',
         options: [
           { label: 'Fixed', value: 'fixed' },
           { label: 'Variable', value: 'variable' }
         ]
       }
     ]
   }
   ```

3. **Generate Collection Config**
   ```typescript
   // generated/collections/Providers.ts
   import { CollectionConfig } from 'payload/types'

   export const Providers: CollectionConfig = {
     slug: 'providers',
     admin: {
       useAsTitle: 'title'
     },
     fields: [
       {
         name: 'title',
         type: 'text',
         required: true
       },
       {
         name: 'slug',
         type: 'text',
         required: true,
         unique: true,
         index: true
       },
       {
         name: 'parent',
         type: 'relationship',
         relationTo: 'providers',
         admin: {
           description: 'Parent entry for hierarchical structure'
         }
       },
       {
         name: 'contentBlocks',
         type: 'blocks',
         blocks: [
           // Import all generated blocks
           RatesTable,
           ZipcodeSearchbar,
           TocRankMath,
           // ... etc
         ]
       },
       // ... all other fields from frontmatter
     ]
   }
   ```

4. **Generate Integration Snippet**
   ```typescript
   // generated/payload.config.snippet.ts

   // Import all generated blocks
   import { RatesTable } from './blocks/RatesTable'
   import { ZipcodeSearchbar } from './blocks/ZipcodeSearchbar'
   // ... (import all 34 blocks)

   // Import all generated collections
   import { Providers } from './collections/Providers'

   // Add to your payload.config.ts:
   export default buildConfig({
     collections: [
       Providers,
       // ... your other collections
     ],
     // Blocks are already included in collection configs
   })
   ```

---

## Phase 3: Data Preparation

### prepare-seed-data.mjs

**Purpose**: Convert source MDX to Payload-ready JSON with Lexical format

**Input**:
- `providers-tree.json` - All 157 entries
- Source MDX files
- Component validation data

**Output**:
- `seed-data/providers.json` - Ready for Payload import
- `seed-data/media.json` - Media file metadata
- `seed-data/richTextDataInstances.json` - Dynamic data instances
- `seed-data/media/*` - Copied media files

**Process**:

1. **For Each Entry**:
   - Read MDX file
   - Parse frontmatter → Payload fields
   - Convert MDX body → Lexical JSON using Payload's converter
   - Replace components with block definitions:
     - `<RatesTable provider="txu" ...>` → `{ blockType: 'ratesTable', provider: 'txu', ... }`
     - `<AmigoPhoneNumber />` → `{ blockType: 'dynamicDataInstanceSimple', instance: 'amigo-phone' }`
   - Extract image references
   - Build relationship IDs

2. **Component Replacement Logic**:
   ```javascript
   function convertComponentToBlock(component, props) {
     const mapping = {
       'RatesTable': 'ratesTable',
       'AmigoPhoneNumber': 'dynamicDataInstanceSimple',
       'TocRankMath': 'tocRankMath',
       // ... all 49 components
     }

     return {
       blockType: mapping[component],
       ...props,
       _originalComponent: component // for debugging
     }
   }
   ```

3. **Media Processing**:
   ```javascript
   {
     "id": "provider-1-hero",
     "filename": "heroImage.png",
     "sourcePath": "/providers/provider-1/heroImage.png",
     "alt": "Provider 1 Hero Image",
     "mimeType": "image/png",
     "relatedTo": {
       "collection": "providers",
       "entrySlug": "provider-1"
     }
   }
   ```

4. **Relationship Resolution**:
   ```javascript
   {
     "entrySlug": "reliant-vs-direct-energy",
     "parentSlug": "comparisons",
     "depth": 2,
     "authors": ["author-1", "author-2"],
     "editors": ["editor-1"],
     "categories": ["comparisons"]
   }
   ```

---

## Phase 4: Database Seeding

### seed-database.mjs

**Purpose**: Populate Payload database with prepared seed data

**Input**:
- `seed.config.json` - Target configuration
- `seed-data/*.json` - Prepared data files

**Output**:
- Populated Payload database
- Seeding log with all IDs created
- Error tracking

**Process**:

1. **Initialize Connection**:
   ```javascript
   const payload = await getPayloadClient()

   // Or via REST API:
   const apiUrl = config.target.url
   const apiSecret = process.env.PAYLOAD_SECRET
   ```

2. **Purge Collections Before Seeding**:
   ```javascript
   async function purgeCollection(collection) {
     const confirm = await askUser(
       `⚠️  Purge all entries in '${collection}' collection? (yes/no): `
     )

     if (confirm === 'yes') {
       const { docs } = await payload.find({
         collection,
         limit: 0  // Get count
       })

       console.log(`Deleting ${docs.length} entries from '${collection}'...`)

       // Delete all entries
       await payload.delete({
         collection,
         where: {} // Delete all
       })

       console.log(`✅ Purged ${docs.length} entries from '${collection}'`)
     } else {
       throw new Error(`Seeding cancelled - '${collection}' not purged`)
     }
   }

   // Purge each collection we're about to seed
   const collectionsToSeed = ['faqs', 'richTextDataInstances', 'providers', 'media']
   for (const collection of collectionsToSeed) {
     await purgeCollection(collection)
   }
   ```

3. **Seeding Order** (respects dependencies):
   ```javascript
   const seedingOrder = [
     'faqs',                     // 1. Create FAQ entries first
     'media',                    // 2. Upload all images
     'richTextDataInstances',    // 3. Create phone numbers
     'providers-root',           // 4. Root entries (no parent)
     'providers-depth-1',        // 5. First level children
     'providers-depth-2',        // 6. Second level children
     'providers-depth-3',        // 7. Third level children
   ]
   ```

4. **Idempotent Creation**:
   ```javascript
   async function createOrUpdate(collection, data) {
     // Check if exists by slug
     const existing = await payload.find({
       collection,
       where: { slug: { equals: data.slug } }
     })

     if (existing.docs.length > 0) {
       if (config.options.skipExisting) {
         log(`Skipping existing: ${data.slug}`)
         return existing.docs[0]
       } else {
         log(`Updating: ${data.slug}`)
         return await payload.update({
           collection,
           id: existing.docs[0].id,
           data
         })
       }
     }

     log(`Creating: ${data.slug}`)
     return await payload.create({
       collection,
       data
     })
   }
   ```

4. **Progress Tracking**:
   ```javascript
   {
     "timestamp": "2025-10-23T10:30:00Z",
     "phase": "providers-depth-1",
     "progress": {
       "total": 157,
       "completed": 45,
       "skipped": 0,
       "failed": 0
     },
     "currentEntry": "comparisons/reliant-vs-direct"
   }
   ```

5. **Error Handling**:
   ```javascript
   try {
     await createOrUpdate('providers', entry)
   } catch (error) {
     errors.push({
       entry: entry.slug,
       error: error.message,
       phase: 'creation',
       data: entry
     })

     if (config.validation.failOnErrors) {
       throw error
     }
   }
   ```

---

## Phase 5: Verification

### verify-seeded-data.mjs

**Purpose**: Validate seeded data integrity

**Checks**:

1. **Count Verification**:
   - Expected: 157 provider entries
   - Expected: 124 media files
   - Expected: 19 richTextDataInstances
   - Query actual counts and compare

2. **Relationship Verification**:
   - All parent references valid
   - All author/editor references exist
   - Hierarchy depth matches source

3. **Content Verification**:
   - All required fields populated
   - Lexical JSON valid
   - Block types match generated configs

4. **Media Verification**:
   - All images uploaded
   - File sizes match
   - URLs accessible

5. **Report Generation**:
   ```markdown
   # Seeding Verification Report

   **Date**: 2025-10-23
   **Target**: http://localhost:3001

   ## Summary
   ✅ Entries: 157/157 (100%)
   ✅ Media: 124/124 (100%)
   ✅ Relationships: 157/157 (100%)
   ⚠️ Warnings: 3
   ❌ Errors: 0

   ## Warnings
   - Entry "provider-x" missing optional field "hero_cta_text"
   ```

---

## Usage Workflow

### First Time Setup (Target Payload Project)

```bash
# 1. Configure target
edit migration/config/seed.config.json
# Set target Payload URL and credentials

# 2. Validate source content
node migration/scripts/validate-components.mjs

# 3. Generate Payload configs
node migration/scripts/generate-payload-config.mjs
# Generates: blocks, collections, payload.config snippet

# 4. Deploy configs to target Payload project
node migration/scripts/deploy-to-target.mjs
# Copies generated files to target project
# Updates payload.config.ts with new collections/blocks

# 5. Test target Payload (Playwright)
node migration/scripts/test-target-payload.mjs
# Uses Playwright to verify:
# - Collections exist
# - Blocks render correctly
# - Admin UI functional

# 6. Prepare seed data (ONLY fully validated components)
node migration/scripts/prepare-seed-data.mjs --validated-only
# Converts MDX → Lexical for valid components
# Creates placeholder EditorBlocks for pending issues

# 7. Seed database (with purge)
node migration/scripts/seed-database.mjs
# Prompts to purge each collection
# Seeds in dependency order: FAQs → Media → Instances → Content

# 8. Verify seeded data
node migration/scripts/verify-seeded-data.mjs
# Checks counts, relationships, media uploads

# 9. Test frontend rendering (Playwright)
node migration/scripts/test-frontend-rendering.mjs
# Verifies content renders correctly on Astro frontend
```

### Re-seeding (Update Existing Data)

```bash
# Update seed.config.json:
{
  "mode": "update",
  "options": {
    "skipExisting": false
  }
}

# Run seeding again
node migration/scripts/seed-database.mjs
```

### Dry Run (Test Without Writing)

```bash
# Update seed.config.json:
{
  "options": {
    "dryRun": true
  }
}

node migration/scripts/seed-database.mjs
```

---

## Key Benefits

1. **Repeatable**: Run on any Payload instance
2. **Version Controlled**: All config generation is code-based
3. **Documented**: Every component and field is documented
4. **Validated**: Multi-phase validation ensures quality
5. **Idempotent**: Safe to re-run
6. **Traceable**: Full logs of all operations
7. **Recoverable**: Can regenerate configs at any time
8. **Testable**: Dry-run mode for testing

---

## Future Tasks (Note But Don't Implement Now)

### 1. Cleanup Script for Non-Migrated Entries
**Purpose**: Remove entries/blocks that weren't migrated (with user confirmation)

**Features**:
- Scan for orphaned entries
- Identify unused blocks
- Find broken relationships
- Interactive confirmation before deletion
- Generate cleanup report

**Usage**:
```bash
node migration/scripts/cleanup-non-migrated.mjs
```

### 2. Cloud Storage Migration Script
**Purpose**: Migrate media from local storage to cloud (S3, Cloudflare R2, etc.)

**Features**:
- Upload all media to cloud storage
- Update Payload media collection with new URLs
- Reconfigure Payload to use cloud storage
- Verify all media accessible

**Usage**:
```bash
node migration/scripts/migrate-to-cloud.mjs --provider=cloudflare
```

---

## Immediate Next Steps

1. ✅ **Validation report created** - [03-component-validation-report.md](./03-component-validation-report.md)
2. ✅ **FAQ collection design** - [FAQ-COLLECTION-DESIGN.md](./FAQ-COLLECTION-DESIGN.md)
3. ✅ **Seeding architecture updated** with decisions
4. ⏭️ **Build config generator** - `generate-payload-config.mjs`
   - Generate FAQ collection config
   - Generate FaqBlock definition
   - Generate all component blocks
   - Generate Providers collection
5. ⏭️ **Build deployment script** - `deploy-to-target.mjs`
   - Copy generated configs to target project
   - Update payload.config.ts
   - Test with Playwright
6. ⏭️ **Build data preparation** - `prepare-seed-data.mjs`
   - MDX → Lexical conversion
   - Component → Block mapping
   - Media file preparation
7. ⏭️ **Build seeding script** - `seed-database.mjs`
   - Collection purging with confirmation
   - Dependency-aware seeding
8. ⏭️ **Test and verify** with Playwright

---

## Architecture Decisions ✅

### 1. FaqRankMath → FAQ Collection
**Decision**: Create reusable FAQ collection (like RichTextDataInstances pattern)
- Users select one or more FAQs from collection
- Wrap with schema.org/FAQPage markup (like Organization schema for phone numbers)
- See [FAQ-COLLECTION-DESIGN.md](./FAQ-COLLECTION-DESIGN.md) for full design

### 2. Config Integration → Deploy to Target & Test
**Decision**: Generate locally, deploy to target, test with Playwright
- Generate configs in `migration/generated/`
- Copy generated configs to target Payload project
- Write files directly to target project
- Test functionality with Playwright skill
- **First step**: Purge collections we're importing (per collection, not whole DB)

**Future Task** (note but don't implement now):
- Cleanup script for non-migrated entries with user confirmation

### 3. Media Upload → Local API (Cloud Later)
**Decision**: Use Payload's local API for media uploads
- Adaptable to whatever target project uses
- Currently: local storage
- Maintains flexibility for future cloud migration

**Future Task** (note but don't implement now):
- Script to migrate media to cloud storage (S3, Cloudflare, etc.)
- Reconfigure Payload to use cloud storage

### 4. Seeding Priority → Fully Validated Only
**Decision**: Migrate ONLY fully validated content
- Track non-validated content separately
- Fix validation issues incrementally
- Only populate fully working content
- Keep problematic entries pending until fixed

**Migration Phases**:
1. **Phase 1**: 9 components with zero validation issues (612 usages)
   - Components: AdvisorPostsTabs, CurrentYearDirect, HelpMeChoose, LowestRateDisplay, PopularCitiesList, PopularZipcodes, ProviderCard, ProvidersPhoneTable, VcBasicGrid
   - Status: ✅ Ready to migrate immediately
   - Entries affected: ~75% of all entries

2. **Phase 2**: Fix phone component warnings (minor prop name issues)
   - Components: 19 phone number components
   - Issue: Using `name` prop instead of correct prop name
   - Fix: Map to DynamicDataInstanceSimple (ignores invalid props)
   - Status: ⚠️ Non-blocking warnings
   - Entries affected: ~25% of all entries

3. **Phase 3**: Resolve FaqRankMath → FAQ collection conversion
   - Component: FaqRankMath (28 files with missing required prop)
   - Solution: Create FAQ collection, parse existing FAQ data where possible
   - Status: 🔴 Requires FAQ collection implementation
   - Entries affected: ~18% of all entries

4. **Phase 4**: Handle legacy WpBlocks
   - Components: 11 legacy WordPress blocks (WpBlock59853, etc.)
   - Solution: Create EditorBlock placeholders with original IDs
   - Status: 🔴 Requires manual review post-migration
   - Entries affected: Unknown (need to count usages)

**Migration Strategy**:
- Migrate phases 1 & 2 first (fully functional content)
- Track phase 3 & 4 entries separately
- Fix issues incrementally
- Re-run seeding for fixed entries
