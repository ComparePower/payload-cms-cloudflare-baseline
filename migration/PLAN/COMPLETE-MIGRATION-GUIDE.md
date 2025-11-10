# Complete Migration Guide: Keystatic/Astro → Payload CMS

**Purpose**: Fully documented, agent-resumable migration process

**Status**: Ready for implementation

**Last Updated**: 2025-10-23

---

## Table of Contents

1. [Overview](#overview)
2. [Discovery Phase Results](#discovery-phase-results)
3. [Required Collections](#required-collections)
4. [Field Mappings](#field-mappings)
5. [Relationship Graph](#relationship-graph)
6. [Component Mappings](#component-mappings)
7. [Implementation Steps](#implementation-steps)
8. [Config Deployment Strategy](#config-deployment-strategy)
9. [Seeding Process](#seeding-process)
10. [Verification Checklist](#verification-checklist)

---

## Overview

### Source System
- **System**: Keystatic with Astro Content Collections
- **Content**: 157 provider entries with nested hierarchies
- **Location**: `/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/providers`
- **Format**: MDX files with YAML frontmatter

### Target System
- **System**: Payload CMS v3 with MongoDB
- **Location**: `/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo`
- **Mode**: Fresh instance with purge-before-seed

### Migration Scope
- 157 entries across 3 hierarchy levels
- 17 unique frontmatter fields
- 49 unique MDX components (2,130 usages)
- 4 relationship fields → Team collection
- 124 media files (hero images)
- 93 image folders (content images)

---

## Discovery Phase Results

### Analysis Scripts Completed ✅

1. **analyze-providers.mjs** (✅ Complete)
   - Output: `data/providers-analysis.json`
   - Output: `data/providers-tree.json`
   - Output: `data/components-found.json`
   - Result: 157 entries, 49 components, 3-level hierarchy

2. **validate-components.mjs** (✅ Complete)
   - Output: `data/component-validation.json`
   - Output: `data/component-props.json`
   - Output: `validation-output.log`
   - Result: 34 found, 11 missing, 39 critical errors, 6,098 warnings

3. **analyze-frontmatter.mjs** (✅ Complete)
   - Output: `data/frontmatter-analysis.json`
   - Output: `data/payload-providers-config.json`
   - Result: 17 fields, 4 relationships, 9 missing from Astro schema

### Critical Findings

**Astro Schema is Incomplete**:
- Astro schema defines only 8 fields
- Frontmatter actually uses 17 fields
- 9 fields exist in content but NOT in Astro schema:
  - `wp_post_id` (used in 156/157 files)
  - `pubDate` (used in 157/157 files) - DIFFERENT FORMAT than Astro schema
  - `updatedDate` (used in 156/157 files)
  - `wp_author` (used in 156/157 files)
  - `target_keyword` (used in 93/157 files)
  - `post_author_team_member_is` (used in 1/157 files) - RELATIONSHIP
  - `post_editor_team_member_is` (used in 1/157 files) - RELATIONSHIP
  - `post_checker_team_member_is` (used in 1/157 files) - RELATIONSHIP
  - `description` (used in 1/157 files)

**Implication**: Must use frontmatter analysis, not Astro schema, to build Payload config!

---

## Required Collections

### 1. Providers (Main Collection)

**Purpose**: Provider hub pages with hierarchical structure

**Fields** (from frontmatter analysis):

```typescript
{
  slug: 'providers',
  admin: { useAsTitle: 'title' },
  fields: [
    // Core fields
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'draft', type: 'checkbox', defaultValue: false },

    // Hierarchy
    { name: 'parent', type: 'relationship', relationTo: 'providers' },

    // SEO fields
    { name: 'seo_title', type: 'text' },
    { name: 'seo_meta_desc', type: 'textarea' },
    { name: 'target_keyword', type: 'text' },

    // Hero fields
    { name: 'cp_hero_heading_line_1', type: 'text' },
    { name: 'cp_hero_heading_line_2', type: 'text' },
    { name: 'cp_hero_cta_text', type: 'text' },

    // Dates
    { name: 'pubDate', type: 'date', required: true },
    { name: 'updatedDate', type: 'date' },

    // Legacy WordPress fields
    { name: 'wp_slug', type: 'text' },
    { name: 'wp_post_id', type: 'number' },  // NOT relationship
    { name: 'wp_author', type: 'text' },

    // Relationships
    { name: 'post_author_team_member_is', type: 'relationship', relationTo: 'team', hasMany: true },
    { name: 'post_editor_team_member_is', type: 'relationship', relationTo: 'team', hasMany: true },
    { name: 'post_checker_team_member_is', type: 'relationship', relationTo: 'team', hasMany: true },

    // Content blocks
    { name: 'contentBlocks', type: 'blocks', blocks: [/* all generated blocks */] },

    // Media
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
  ]
}
```

### 2. Team Collection (MUST CREATE)

**Purpose**: Team members for author/editor/checker relationships

**Discovered from frontmatter**: 3 relationship fields point to this collection

**Fields**:

```typescript
{
  slug: 'team',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'role', type: 'select', options: [
      { label: 'Author', value: 'author' },
      { label: 'Editor', value: 'editor' },
      { label: 'Checker', value: 'checker' }
    ]},
    { name: 'bio', type: 'richText' },
    { name: 'avatar', type: 'upload', relationTo: 'media' }
  ]
}
```

**Data Source**: Extract from `wp_author` field (156 unique author names found)

### 3. FAQs Collection (NEW)

**Purpose**: Reusable FAQ entries with schema.org markup

**Design**: See `FAQ-COLLECTION-DESIGN.md`

**Fields**:

```typescript
{
  slug: 'faqs',
  admin: { useAsTitle: 'question' },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'richText', required: true },
    { name: 'category', type: 'select', options: ['providers', 'rates', 'billing', 'general'] },
    { name: 'slug', type: 'text', unique: true, index: true },
    { name: 'relatedTopics', type: 'array', fields: [{ name: 'topic', type: 'text' }] }
  ]
}
```

### 4. Media Collection (EXISTING)

**Purpose**: Images and media files

**Already exists** in Payload - no changes needed

### 5. RichTextDataInstances Collection (EXISTING)

**Purpose**: Dynamic inline data (phone numbers, emails, etc.)

**Already exists** - need to seed 19 provider phone numbers

---

## Field Mappings

### Frontmatter → Payload Field Type Mapping

| Frontmatter Field | Inferred Type | Payload Type | Required | Notes |
|-------------------|---------------|--------------|----------|-------|
| title | string | text | YES | |
| draft | boolean | checkbox | YES | |
| wp_slug | string | text | NO | Legacy |
| wp_post_id | number | number | NO | NOT a relationship! |
| seo_title | string | text | NO | |
| seo_meta_desc | string | textarea | NO | ~100+ chars |
| target_keyword | string | text | NO | Only 93/157 files |
| pubDate | date/string | date | YES | Mixed formats! |
| updatedDate | date | date | NO | |
| wp_author | string | text | NO | Extract to Team |
| cp_hero_heading_line_1 | string | text | NO | |
| cp_hero_heading_line_2 | string | text | NO | |
| cp_hero_cta_text | string | text | NO | |
| post_author_team_member_is | array<string> | relationship | NO | → team |
| post_editor_team_member_is | array<string> | relationship | NO | → team |
| post_checker_team_member_is | array<string> | relationship | NO | → team |
| description | string | text | NO | Only 1 file |

### Special Field Handling

**pubDate**:
- Found in 157/157 files
- Mixed formats: Some are strings, some are dates
- Must normalize during migration

**wp_post_id**:
- Found in 156/157 files
- Type: number, NOT relationship
- Keep as number field for legacy reference

**Team Relationships**:
- Only used in 1/157 files (experimental)
- Need to create Team collection
- Seed from `wp_author` field extraction

---

## Relationship Graph

```
Providers
├── parent → Providers (self-referential, hierarchical)
├── heroImage → Media
├── post_author_team_member_is → Team (hasMany)
├── post_editor_team_member_is → Team (hasMany)
└── post_checker_team_member_is → Team (hasMany)

Team
└── avatar → Media

FAQs
(no relationships)

RichTextDataInstances
(no relationships)

Media
(no relationships)
```

**Seeding Order** (respects dependencies):
1. Media (no dependencies)
2. Team (depends on Media for avatars)
3. FAQs (no dependencies)
4. RichTextDataInstances (no dependencies)
5. Providers depth=0 (root) (depends on Media, Team)
6. Providers depth=1 (depends on Providers depth=0)
7. Providers depth=2 (depends on Providers depth=1)
8. Providers depth=3 (depends on Providers depth=2)

---

## Component Mappings

### Components with Zero Issues (9 components) ✅

**Ready to migrate immediately**:

1. `AdvisorPostsTabs` - 2 usages
2. `CurrentYearDirect` - 2 usages
3. `HelpMeChoose` - 2 usages
4. `LowestRateDisplay` - 100 usages (most used!)
5. `PopularCitiesList` - 124 usages → Standard Astro component
6. `PopularZipcodes` - 128 usages → Standard Astro component
7. `ProviderCard` - 74 usages
8. `ProvidersPhoneTable` - 178 usages
9. `VcBasicGrid` - 2 usages

**Total valid usages**: 612 (29% of all component usages)

### Phone Number Components (19 components) ⚠️

**Status**: Non-blocking warnings only

**Issue**: Using `name` prop instead of correct prop, but will map to `DynamicDataInstanceSimple` anyway

**Components**:
- AmigoPhoneNumber, CirroEnergyPhoneNumber, ConstellationPhoneNumber
- DirectEnergyPhoneNumber, DiscountPowerPhoneNumber, FlagshipPhoneNumber
- FourChangePhoneNumber, FrontierPhoneNumber, FrontierPhoneNumberLinkRc
- GexaPhoneNumber, GreenMountainPhoneNumber, JustPhoneNumber
- NewPowerPhoneNumber, PaylessPowerPhoneNumber, PulsePowerPhoneNumber
- ReliantPhoneNumber, RhythmEnergyPhone, TaraEnergyPhoneNumber, TxuPhoneNumber

**Migration Strategy**: Map to `DynamicDataInstanceSimple` inline blocks

**Required**: Create 19 RichTextDataInstance entries (one per provider)

### FAQ Component (1 component) 🔴

**Component**: `FaqRankMath`

**Issue**: 28 files missing required `questions` prop

**Solution**: Create FAQ collection + FaqBlock

**See**: `FAQ-COLLECTION-DESIGN.md` for complete design

### Legacy WordPress Blocks (11 components) 🔴

**Components**: WpBlock59853, WpBlock60549, WpBlock61154, WpBlock61258, WpBlock61260, WpBlock61277, WpBlock75232, WpBlock77727, WpBlock81492, WpBlock84548, WpBlock94368

**Issue**: Components don't exist in Astro project

**Solution**: Create generic EditorBlock placeholders with original IDs

---

## Implementation Steps

### Phase 0: Preparation (COMPLETE ✅)

- [x] Analyze providers structure
- [x] Validate components
- [x] Analyze frontmatter
- [x] Design FAQ collection
- [x] Document architecture

### Phase 1: Generate Payload Configs

**Script**: `migration/scripts/generate-payload-config.mjs`

**Inputs**:
- `data/frontmatter-analysis.json`
- `data/component-props.json`
- `data/component-validation.json`

**Outputs** (to `migration/generated/`):
- `collections/Providers.ts` - Generated from frontmatter analysis
- `collections/Team.ts` - New collection for relationships
- `collections/FAQs.ts` - New FAQ collection
- `blocks/FaqBlock.ts` - FAQ display block
- `blocks/LowestRateDisplay.ts` - Rate display block
- `blocks/PopularCitiesList.ts` - Cities list block
- ... (all 34 component blocks)
- `payload.config.snippet.ts` - Integration code

**Process**:
1. Read `frontmatter-analysis.json`
2. For each field, generate Payload field definition
3. Map field types (string→text, date→date, array→relationship, etc.)
4. Generate relationship fields with proper `relationTo`
5. Generate block definitions from `component-props.json`
6. Output TypeScript files

**Run**:
```bash
node migration/scripts/generate-payload-config.mjs
```

### Phase 2: Deploy to Target Payload Project

**Script**: `migration/scripts/deploy-to-target.mjs`

**Purpose**: Copy generated configs to target and handle conflicts

**Process**:

1. **Check Target**:
   ```typescript
   const targetPayloadConfig = '/path/to/target/payload.config.ts'
   const targetCollections = '/path/to/target/src/collections'
   const targetBlocks = '/path/to/target/src/lexical/blocks'
   ```

2. **Detect Conflicts**:
   ```typescript
   // Check if collections already exist
   const existingCollections = ['providers', 'team', 'faqs']
   const conflicts = existingCollections.filter(c => fs.existsSync(`${targetCollections}/${c}.ts`))

   if (conflicts.length > 0) {
     // Ask user what to do
   }
   ```

3. **User Interaction**:
   ```
   ⚠️  Found existing collections: providers, team

   What would you like to do?

   1. Backup and replace (recommended for fresh instance)
   2. Merge fields (advanced - manual review required)
   3. Skip conflicting collections
   4. Abort deployment

   Choice: _
   ```

4. **Backup Existing**:
   ```bash
   cp target/src/collections/Providers.ts target/src/collections/Providers.ts.backup-2025-10-23
   ```

5. **Copy Generated Files**:
   ```bash
   cp migration/generated/collections/* target/src/collections/
   cp migration/generated/blocks/* target/src/lexical/blocks/
   ```

6. **Update payload.config.ts**:
   ```typescript
   // Add imports
   import { Providers } from './collections/Providers'
   import { Team } from './collections/Team'
   import { FAQs } from './collections/FAQs'

   // Add to config
   collections: [
     Providers,
     Team,
     FAQs,
     // ... existing collections
   ]
   ```

7. **Restart Payload**:
   ```bash
   # Kill existing Payload process
   # Start fresh
   ```

**Run**:
```bash
node migration/scripts/deploy-to-target.mjs --target=/path/to/payload/project
```

### Phase 3: Test Target Payload (Playwright)

**Script**: `migration/scripts/test-target-payload.mjs`

**Tests**:

1. **Collections Exist**:
   ```typescript
   await page.goto('http://localhost:3001/admin/collections/providers')
   await expect(page).toHaveTitle(/Providers/)
   ```

2. **Fields Render**:
   ```typescript
   await page.click('button:has-text("Create New")')
   await expect(page.locator('input[name="title"]')).toBeVisible()
   await expect(page.locator('input[name="seo_title"]')).toBeVisible()
   // ... all fields
   ```

3. **Blocks Render**:
   ```typescript
   await page.click('button:has-text("Add Block")')
   await expect(page.locator('text=FAQ Block')).toBeVisible()
   await expect(page.locator('text=Lowest Rate Display')).toBeVisible()
   ```

4. **Relationships Work**:
   ```typescript
   await page.click('button:has-text("Select Team Member")')
   await expect(page.locator('[role="listbox"]')).toBeVisible()
   ```

**Run**:
```bash
node migration/scripts/test-target-payload.mjs
```

### Phase 4: Prepare Seed Data

**Script**: `migration/scripts/prepare-seed-data.mjs`

**Flags**:
- `--validated-only` - Only prepare fully validated components
- `--all` - Prepare all, create placeholders for problematic components

**Process**:

1. **Read Source MDX**:
   ```typescript
   const files = await findAllMDXFiles(SOURCE_DIR)
   ```

2. **Parse Frontmatter**:
   ```typescript
   const frontmatter = parseFrontmatter(content)
   // Use results from analyze-frontmatter.mjs
   ```

3. **Extract Team Members**:
   ```typescript
   // From wp_author field
   const authors = new Set()
   files.forEach(file => {
     if (file.frontmatter.wp_author) {
       authors.add(file.frontmatter.wp_author)
     }
   })

   // Generate team-seed-data.json
   const teamData = Array.from(authors).map(name => ({
     name,
     role: 'author',
     slug: slugify(name)
   }))
   ```

4. **Convert MDX → Lexical**:
   ```typescript
   import { convertMDXToLexical } from '@payloadcms/richtext-lexical/converters'

   const lexicalContent = await convertMDXToLexical(mdxContent)
   ```

5. **Replace Components with Blocks**:
   ```typescript
   // Find: <LowestRateDisplay providerId="txu" />
   // Replace with Lexical block:
   {
     type: 'block',
     blockType: 'lowestRateDisplay',
     fields: {
       providerId: 'txu'
     }
   }
   ```

6. **Handle Phone Numbers**:
   ```typescript
   // Find: <TxuPhoneNumber />
   // Replace with inline block:
   {
     type: 'inlineBlock',
     blockType: 'dynamicDataInstanceSimple',
     category: 'phone',
     instance: 'txu-phone',  // Reference to RichTextDataInstance
     enablePhoneLink: true
   }
   ```

7. **Handle FAQs**:
   ```typescript
   // Find: <FaqRankMath questions={...} />
   // If has questions data:
   //   - Create FAQ entries
   //   - Replace with FaqBlock
   // If missing questions:
   //   - Create EditorBlock placeholder
   ```

8. **Process Media**:
   ```typescript
   // Copy heroImage.png
   // Copy images/* folder
   // Generate media metadata
   ```

9. **Build Relationships**:
   ```typescript
   // Resolve parent references
   // Link to Team members (from wp_author)
   // Generate relationship IDs
   ```

**Outputs** (to `migration/seed-data/`):
- `providers.json` - 157 entries with Lexical content
- `team.json` - Extracted team members
- `faqs.json` - FAQ entries (where parseable)
- `richTextDataInstances.json` - 19 phone numbers
- `media.json` - Media metadata
- `media/` - Copied image files
- `relationships.json` - Parent/child maps

**Run**:
```bash
node migration/scripts/prepare-seed-data.mjs --validated-only
```

### Phase 5: Seed Database

**Script**: `migration/scripts/seed-database.mjs`

**Flags**:
- `--config=path/to/seed.config.json` - Use custom config
- `--dry-run` - Don't write to database
- `--skip-purge` - Don't purge existing data

**Process**:

1. **Connect to Payload**:
   ```typescript
   const payload = await getPayloadClient()
   ```

2. **Purge Collections** (with confirmation):
   ```typescript
   for (const collection of ['faqs', 'richTextDataInstances', 'team', 'providers', 'media']) {
     const confirm = await askUser(`Purge '${collection}'? (yes/no): `)
     if (confirm === 'yes') {
       await payload.delete({ collection, where: {} })
     } else {
       throw new Error('Seeding cancelled')
     }
   }
   ```

3. **Seed in Order**:
   ```typescript
   const seedingOrder = [
     { collection: 'media', file: 'media.json' },
     { collection: 'team', file: 'team.json' },
     { collection: 'faqs', file: 'faqs.json' },
     { collection: 'richTextDataInstances', file: 'richTextDataInstances.json' },
     { collection: 'providers', file: 'providers-depth-0.json' },
     { collection: 'providers', file: 'providers-depth-1.json' },
     { collection: 'providers', file: 'providers-depth-2.json' },
     { collection: 'providers', file: 'providers-depth-3.json' },
   ]

   for (const { collection, file } of seedingOrder) {
     const data = JSON.parse(await fs.readFile(`seed-data/${file}`, 'utf-8'))

     for (const entry of data) {
       await payload.create({ collection, data: entry })
       console.log(`✓ Created: ${entry.slug}`)
     }
   }
   ```

4. **Track Progress**:
   ```typescript
   const progress = {
     total: 157,
     completed: 0,
     failed: 0,
     errors: []
   }
   ```

5. **Handle Errors**:
   ```typescript
   try {
     await payload.create({ collection, data: entry })
   } catch (error) {
     progress.errors.push({
       entry: entry.slug,
       error: error.message
     })
     if (config.validation.failOnErrors) {
       throw error
     }
   }
   ```

6. **Save Log**:
   ```typescript
   await fs.writeFile(
     `logs/seed-${timestamp}.json`,
     JSON.stringify(progress, null, 2)
   )
   ```

**Run**:
```bash
node migration/scripts/seed-database.mjs
```

### Phase 6: Verify Seeded Data

**Script**: `migration/scripts/verify-seeded-data.mjs`

**Checks**:

1. **Count Verification**:
   ```typescript
   const expected = { providers: 157, team: 50, faqs: 100, richTextDataInstances: 19 }
   const actual = {}

   for (const collection of Object.keys(expected)) {
     const { totalDocs } = await payload.find({ collection, limit: 0 })
     actual[collection] = totalDocs
   }

   // Compare and report
   ```

2. **Relationship Integrity**:
   ```typescript
   // Check all parent references valid
   const providers = await payload.find({ collection: 'providers' })
   for (const provider of providers.docs) {
     if (provider.parent) {
       const parentExists = await payload.findByID({
         collection: 'providers',
         id: provider.parent
       })
       if (!parentExists) {
         errors.push(`Broken parent reference: ${provider.slug}`)
       }
     }
   }
   ```

3. **Media Uploads**:
   ```typescript
   // Check all media files accessible
   const media = await payload.find({ collection: 'media' })
   for (const file of media.docs) {
     const exists = await fs.access(file.url)
     if (!exists) {
       errors.push(`Missing media file: ${file.filename}`)
     }
   }
   ```

4. **Content Blocks**:
   ```typescript
   // Check all blocks have valid types
   const providers = await payload.find({ collection: 'providers' })
   for (const provider of providers.docs) {
     for (const block of provider.contentBlocks || []) {
       if (!VALID_BLOCK_TYPES.includes(block.blockType)) {
         errors.push(`Invalid block type: ${block.blockType} in ${provider.slug}`)
       }
     }
   }
   ```

**Run**:
```bash
node migration/scripts/verify-seeded-data.mjs
```

### Phase 7: Test Frontend Rendering (Playwright)

**Script**: `migration/scripts/test-frontend-rendering.mjs`

**Tests**:

1. **Page Renders**:
   ```typescript
   await page.goto('http://localhost:4321/posts/some-provider')
   await expect(page.locator('h1')).toContainText('Provider Title')
   ```

2. **Schema.org Markup**:
   ```typescript
   const schemaScript = await page.locator('script[type="application/ld+json"]').textContent()
   const schema = JSON.parse(schemaScript)
   expect(schema['@type']).toBe('Article')
   ```

3. **Dynamic Components**:
   ```typescript
   // Check phone numbers render with schema
   await expect(page.locator('[itemprop="telephone"]')).toBeVisible()
   ```

4. **FAQ Blocks**:
   ```typescript
   await expect(page.locator('[itemtype="https://schema.org/FAQPage"]')).toBeVisible()
   ```

**Run**:
```bash
node migration/scripts/test-frontend-rendering.mjs
```

---

## Config Deployment Strategy

### Scenario 1: Fresh Payload Instance

**Situation**: Target is brand new with no existing collections

**Process**:
1. Run `deploy-to-target.mjs`
2. Script detects no conflicts
3. Copies all generated files
4. Updates payload.config.ts
5. Restarts Payload
6. ✅ Ready for seeding

### Scenario 2: Existing Collections (Same Names)

**Situation**: Target has `providers` or `team` collections already

**Process**:
1. Run `deploy-to-target.mjs`
2. Script detects conflicts:
   ```
   ⚠️  Found existing collections: providers

   What would you like to do?

   1. Backup and replace (DESTRUCTIVE - will lose existing config)
   2. Merge fields (manual review required)
   3. Skip conflicting collections (will NOT work with seeding)
   4. Abort deployment

   Choice: _
   ```

**User Chooses**:

**Option 1: Backup and Replace**
   - Script backs up existing: `Providers.ts.backup-2025-10-23`
   - Replaces with generated config
   - ⚠️ Any custom fields in old config are LOST
   - Requires manual review of backup

**Option 2: Merge Fields**
   - Script generates merge diff
   - Shows fields to add/remove/modify
   - User manually merges in editor
   - Re-run deployment after manual merge

**Option 3: Skip**
   - Script skips conflicting collections
   - Seeding will fail if skipped collection is required
   - Only use if you're NOT migrating that collection

**Option 4: Abort**
   - Safe exit
   - No changes made

### Scenario 3: Existing Collections (Different Names)

**Situation**: Target has `posts` collection, we want to migrate to `providers`

**Process**:
1. No conflicts detected
2. Both collections will exist side-by-side
3. Seeding only populates `providers`
4. User can manually migrate `posts` → `providers` later if desired

---

## Seeding Process

### Pre-Seeding Checks

Before running `seed-database.mjs`:

1. ✅ Target Payload is running
2. ✅ Collections are deployed
3. ✅ Playwright tests passed
4. ✅ Seed data prepared (run `prepare-seed-data.mjs`)
5. ✅ Backup database (if not fresh instance)

### Seeding Execution

**Interactive Purge**:
```bash
$ node migration/scripts/seed-database.mjs

🔍 Connecting to Payload at http://localhost:3001...
✓ Connected

⚠️  About to purge and seed the following collections:
  - media (current: 10 entries)
  - team (current: 5 entries)
  - faqs (current: 0 entries)
  - richTextDataInstances (current: 3 entries)
  - providers (current: 2 entries)

Purge 'media' collection? (yes/no): yes
✓ Purged 10 entries from 'media'

Purge 'team' collection? (yes/no): yes
✓ Purged 5 entries from 'team'

Purge 'faqs' collection? (yes/no): yes
✓ Purged 0 entries from 'faqs'

Purge 'richTextDataInstances' collection? (yes/no): yes
✓ Purged 3 entries from 'richTextDataInstances'

Purge 'providers' collection? (yes/no): yes
✓ Purged 2 entries from 'providers'

🌱 Starting seeding...

📁 Seeding media...
  ✓ provider-1-hero.png
  ✓ provider-1-image-1.png
  ...
  ✓ 124 media files uploaded

👥 Seeding team...
  ✓ john-doe
  ✓ jane-smith
  ...
  ✓ 50 team members created

❓ Seeding faqs...
  ✓ what-is-electricity-rate
  ✓ how-to-switch-providers
  ...
  ✓ 100 FAQs created

📞 Seeding richTextDataInstances...
  ✓ txu-phone
  ✓ reliant-phone
  ...
  ✓ 19 instances created

📝 Seeding providers (depth 0)...
  ✓ providers (root)
  ✓ 1 providers created

📝 Seeding providers (depth 1)...
  ✓ comparisons
  ✓ top-energy-companies
  ✓ texas-electricity-energy-companies
  ✓ 3 providers created

📝 Seeding providers (depth 2)...
  ✓ reliant-vs-direct-energy
  ✓ best-companies-for-low-usage
  ...
  ✓ 125 providers created

📝 Seeding providers (depth 3)...
  ✓ (none)
  ✓ 0 providers created

✅ Seeding complete!

📊 Summary:
  - Total entries created: 300
  - Errors: 0
  - Warnings: 3
  - Duration: 45.2 seconds

📝 Log saved to: logs/seed-2025-10-23-14-30-00.json
```

### Post-Seeding

1. Run `verify-seeded-data.mjs`
2. Review verification report
3. Test in Payload admin UI
4. Test frontend rendering
5. Fix any issues
6. Re-seed if needed (idempotent)

---

## Verification Checklist

### Database Verification

- [ ] Entry count matches expected (157 providers)
- [ ] All parent references valid
- [ ] All team member references valid
- [ ] No orphaned entries
- [ ] All media files uploaded

### Content Verification

- [ ] All required fields populated
- [ ] Lexical JSON valid
- [ ] Block types match generated configs
- [ ] Inline blocks reference valid instances

### Relationship Verification

- [ ] Hierarchy preserved (parent/child)
- [ ] Team member assignments work
- [ ] FAQ block references valid

### Media Verification

- [ ] All hero images uploaded
- [ ] All content images uploaded
- [ ] File sizes correct
- [ ] URLs accessible

### Frontend Verification

- [ ] Pages render correctly
- [ ] Schema.org markup present
- [ ] Phone numbers render with links
- [ ] FAQ blocks render with schema
- [ ] Dynamic components work

### Admin UI Verification

- [ ] Collections appear in sidebar
- [ ] All fields visible in forms
- [ ] Relationship selects work
- [ ] Block adding/editing works
- [ ] Inline blocks render correctly

---

## Troubleshooting

### Issue: Collections Don't Appear in Admin

**Cause**: payload.config.ts not updated or Payload not restarted

**Fix**:
```bash
# Check payload.config.ts has imports
# Restart Payload
pkill -f "pnpm dev"
pnpm dev
```

### Issue: Seeding Fails with "Collection not found"

**Cause**: Collections not deployed to target

**Fix**:
```bash
node migration/scripts/deploy-to-target.mjs
# Restart Payload
node migration/scripts/seed-database.mjs
```

### Issue: Relationship References Invalid

**Cause**: Seeding order wrong or Team collection not seeded

**Fix**:
```bash
# Check seed-data/team.json exists
# Re-run seeding
node migration/scripts/seed-database.mjs
```

### Issue: Lexical Content Invalid

**Cause**: MDX conversion failed or block types invalid

**Fix**:
```bash
# Re-run data preparation
node migration/scripts/prepare-seed-data.mjs --validated-only
# Review generated Lexical JSON
# Fix block type mappings
# Re-seed
```

---

## Resuming This Migration

If another agent needs to resume this migration:

1. **Read this file first** - Complete context provided
2. **Check progress**:
   ```bash
   ls migration/data/           # Analysis complete?
   ls migration/generated/      # Configs generated?
   ls migration/seed-data/      # Data prepared?
   cat logs/seed-latest.json    # Last seeding status?
   ```
3. **Resume from last incomplete phase** (see Implementation Steps)
4. **All scripts are documented** with inputs/outputs/process
5. **All decisions are documented** in SEEDING-ARCHITECTURE.md
6. **All issues are tracked** in component-validation-report.md

---

## Success Criteria

Migration is complete when:

- ✅ All 157 provider entries migrated
- ✅ All relationships intact
- ✅ All media uploaded
- ✅ Frontend renders correctly
- ✅ Schema.org markup present
- ✅ Payload admin UI functional
- ✅ Verification script passes
- ✅ Playwright tests pass
- ✅ Zero critical errors
- ✅ All issues documented

---

**End of Complete Migration Guide**

**Next Action**: Run Phase 1 - Generate Payload Configs
