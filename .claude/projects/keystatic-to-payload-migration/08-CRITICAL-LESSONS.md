# Critical Lessons: Errors Fixed & Pitfalls Avoided

**Purpose**: Document every error encountered, fix applied, and lesson learned
**Use**: Read this BEFORE starting work to avoid known mistakes

---

## 🚨 Critical Error #1: `_deleted` vs `deletedAt` Confusion

### What I Got Wrong

**My Incorrect Assumption**:
I assumed Payload CMS used `_deleted` (boolean field) for soft-deletes, like many ORMs do.

**The Reality**:
Payload CMS 3 uses `deletedAt` (timestamp field) and requires `trash: true` in collection config.

### The Error Chain

1. I created indexes for `_deleted` field that never existed
2. I wrote documentation about `_deleted` behavior
3. I explained soft-delete logic incorrectly
4. The field was never part of Payload's system

### The Truth

**Payload's Actual Soft-Delete System**:
```typescript
export const Providers: CollectionConfig = {
  slug: 'providers',
  trash: true,  // ← REQUIRED to enable soft-delete
  // ...
}
```

**What this does**:
- Adds `deletedAt` field (timestamp, not boolean)
- Creates trash view at `/admin/collections/providers/trash`
- Soft-deletes set `deletedAt: new Date().toISOString()`
- Hard-deletes remove record entirely
- Restore sets `deletedAt: null`

### How I Discovered This

**User asked**: "is _deleted your concept or payload concept?"

**I searched Payload docs** and found:
- Official trash documentation uses `deletedAt`
- No mention of `_deleted` boolean anywhere
- `trash: true` is required configuration

### The Fix

**File**: `src/collections/Providers/index.ts`

```typescript
export const Providers: CollectionConfig = {
  slug: 'providers',
  // ... other config ...
  trash: true,  // ← Added this
  // ...
}
```

**Cleanup**:
- Created `CORRECTION-PAYLOAD-TRASH.md` documenting error
- Removed references to `_deleted` field
- Updated MongoDB indexes to use `deletedAt`

### Lesson Learned

**NEVER assume field names** - always check official documentation first.

**RED FLAGS**:
- "This is probably like other systems I've used"
- "Most ORMs do it this way"
- "I'll check the docs later"

**CORRECT APPROACH**:
- Search official docs immediately
- Look for examples in codebase
- Test with small example first

---

## 🚨 Critical Error #2: Purge Script Pagination Bug

### The Problem

**Original Code**:
```typescript
const { docs } = await payload.find({
  collection: 'providers',
  limit: 1000  // ← Only fetches once!
})

for (const provider of docs) {
  await payload.delete({ collection: 'providers', id: provider.id })
}
```

**What this did**:
- Fetched first 1000 records
- Deleted those 1000
- **STOPPED** (didn't loop)
- Remaining records still in database

### Why This Happened

I assumed a single fetch would get all records. I didn't consider:
- Collections with > 1000 documents
- Payload's default pagination (limit: 10)
- Need to loop until empty

### The Fix

**File**: `scripts/purge-providers.ts`

```typescript
while (true) {
  // Always fetch page 1 since we're deleting as we go
  const { docs } = await payload.find({
    collection: 'providers',
    limit: 100,  // Smaller batches for reliability
    page: 1      // Always page 1!
  })

  if (docs.length === 0) {
    break  // No more records to delete
  }

  for (const provider of docs) {
    await payload.delete({ collection: 'providers', id: provider.id })
    totalDeleted++
    console.log(`[${totalDeleted}/${totalDocs}] Deleted: ${provider.title}`)
  }
}
```

**Key Insight**: When deleting from page 1, the next batch moves to page 1. Loop until empty.

### Lesson Learned

**ALWAYS consider pagination** when processing large datasets.

**RED FLAGS**:
- Single call to `.find()` without loop
- Assuming all records returned in one fetch
- No check for remaining records

**CORRECT APPROACH**:
- Loop until `docs.length === 0`
- Always fetch page 1 (when deleting)
- Use smaller batch sizes (100 vs 1000)
- Log progress for monitoring

---

## 🚨 Critical Error #3: MongoDB Atlas notablescan Blocking Queries

### The Problem

**Symptom**: Clicking providers in admin UI showed "document not found" errors

**MongoDB Error** (in logs):
```
MongoServerError: error processing query: ns=content_payload_cms.providers
COLLSCAN
error: no query solutions
```

**Translation**: MongoDB blocked the query because no index existed for the queried field.

### What notablescan Means

**MongoDB Atlas `notablescan` setting**:
- Blocks all queries that would require full collection scans
- Forces queries to use indexes
- Prevents performance issues in production
- Common in Atlas clusters

**Payload was querying**:
```javascript
db.providers.find({ deletedAt: { $ne: null } })
// ← No index on deletedAt field = BLOCKED
```

### Why This Happened

1. Enabled `trash: true` on collection (adds deletedAt field)
2. MongoDB Atlas has notablescan enabled
3. No index created for deletedAt field
4. Queries failed silently (no clear error in UI)

### The "453 Providers" Mystery

**User saw**: "453 providers" in admin UI
**Reality**:
- 453 documents in `_providers_versions` (draft history table)
- 146 documents in `providers` (main table)
- UI was showing version table IDs
- Clicking IDs looked in main table (not found!)

### The Fix

**Script**: `scripts/add-deleted-index.mjs`

```javascript
const collections = ['providers', 'richtextdatainstances', /* ... */]

for (const collectionName of collections) {
  await db.collection(collectionName).createIndex(
    { deletedAt: 1 },
    {
      name: 'deletedAt_1',
      background: true  // Don't block other operations
    }
  )
  console.log(`✓ Created deletedAt index on ${collectionName}`)
}
```

**Run once**:
```bash
./scripts/doppler-run.sh dev node scripts/add-deleted-index.mjs
```

### Lesson Learned

**ALWAYS create indexes** for fields used in queries, especially with MongoDB Atlas.

**RED FLAGS**:
- "Document not found" errors in UI
- MongoDB "no query solutions" errors
- Atlas clusters (likely have notablescan)
- New fields added to queries

**CORRECT APPROACH**:
- Create index when adding new queryable field
- Use `{ background: true }` for production
- Test queries with `.explain()` to verify index usage
- Check MongoDB logs for scan warnings

---

## 🚨 Issue #4: Duplicate Slug Generation

### The Problem

**Original Slug Logic**:
```typescript
function generateSlug(filePath) {
  const filename = path.basename(filePath, '.mdx')
  return filename.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
```

**Example Collisions**:
- `_drafts/ratings/index.mdx` → slug: "ratings"
- `texas-electricity/ratings/index.mdx` → slug: "ratings"  // DUPLICATE!

**Payload Error**:
```
E11000 duplicate key error collection: content_payload_cms.providers index: slug_1 dup key: { slug: "ratings" }
```

### Why This Happened

Multiple directories with same filename:
- `index.mdx` in different folders
- Same base name in different paths
- Slug generation only looked at filename, not full path

### The Fix

**Use full relative path for slug generation**:

```typescript
function generateUniqueSlug(filePath, frontmatter) {
  const relativePath = path.relative(ASTRO_PROVIDERS_DIR, filePath)

  let pathSlug = relativePath
    .replace(/\/index\.mdx$/, '')  // Remove /index.mdx
    .replace(/\.mdx$/, '')          // Remove .mdx
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')          // Trim hyphens

  return pathSlug
}
```

**Results**:
- `_drafts/ratings/index.mdx` → "drafts-ratings"
- `texas-electricity/ratings/index.mdx` → "texas-electricity-ratings"
- No collisions!

### Lesson Learned

**Use full paths for unique identifiers**, not just filenames.

**RED FLAGS**:
- Duplicate key errors
- Only using basename for slugs
- Not considering directory structure
- Common filenames (index, README, etc.)

**CORRECT APPROACH**:
- Use full relative path
- Include directory structure in slug
- Test for collisions before insertion
- Log generated slugs for review

---

## 🚨 Issue #5: Incomplete Field Extraction

### The Problem

**Astro Schema** (content.config.ts):
```typescript
const providers = defineCollection({
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    // ... 8 fields defined
  })
})
```

**Actual Frontmatter** (in files):
```yaml
---
title: Provider Name
slug: provider-slug
wordpress_slug: wp-provider
wp_post_id: 12345
seo_title: Custom SEO Title
# ... 17 fields total!
---
```

**What I did wrong**: Only extracted fields from Astro schema (8 fields), missing 9 additional fields.

### Why This Happened

1. Trusted Astro schema as source of truth
2. Didn't analyze actual frontmatter
3. Assumed schema was complete
4. Hardcoded field extraction

### The Fix

**Discovery Script**: `migration/scripts/analyze-frontmatter.mjs`

```javascript
const allFields = new Set()

// Scan all MDX files
for (const file of mdxFiles) {
  const { data: frontmatter } = matter(fs.readFileSync(file, 'utf8'))

  // Add all keys to set
  Object.keys(frontmatter).forEach(key => allFields.add(key))
}

console.log('Fields discovered:', Array.from(allFields))
// Found 17 fields total (not 8!)
```

**Extraction Logic**: Map ALL discovered fields, not just schema fields.

### Lesson Learned

**ALWAYS analyze actual data**, don't trust schema definitions.

**RED FLAGS**:
- Hardcoded field lists
- Trusting schemas without verification
- Not scanning actual files
- Assuming completeness

**CORRECT APPROACH**:
1. Scan all files first (discovery phase)
2. Extract all unique fields
3. Map to target schema
4. Handle optional fields gracefully
5. Log unmapped fields

---

## 🚨 Issue #6: Missing Phone Inline Blocks

### The Problem

**11 providers failed** during migration:

```
[15/157] ❌ Failed: 4Change Energy
    Error: Content Blocks > Block 4 (Rich Text) > Content
    Could not resolve slug: "4change-phone" - instance may not exist
```

**Root Cause**: Phone number inline blocks referenced before being created.

### Why This Happened

**Migration Order**:
1. ✅ Seeded ProviderMetadata (21 docs)
2. ✅ Seeded RichTextDataInstances (34 docs) - BUT incomplete
3. ❌ Seeded Providers (146/157 success) - 11 failed

**Problem**: Not all phone numbers were in RichTextDataInstances before providers migration.

### The Missing Slugs

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

### The Fix (To Do)

**Step 1**: Create missing inline blocks

```bash
./scripts/doppler-run.sh dev pnpm tsx scripts/seed/create-missing-phone-blocks.ts
```

**Step 2**: Retry failed provider migrations

```bash
./scripts/doppler-run.sh dev pnpm tsx migration/scripts/retry-failed-providers.ts
```

### Lesson Learned

**ALWAYS seed dependencies before dependents**.

**Correct Order**:
1. Seed ProviderMetadata (no dependencies)
2. Seed ALL RichTextDataInstances (depends on ProviderMetadata)
3. **Verify all inline blocks exist**
4. Then seed Providers (depends on both)

**RED FLAGS**:
- "Could not resolve slug" errors
- Referencing data that hasn't been created yet
- Assuming seed data is complete
- Not validating dependencies

**CORRECT APPROACH**:
- Identify all dependencies first
- Seed in topological order
- Verify each step before proceeding
- Validate references exist

---

## 💡 General Lessons

### Validation is Critical

**Always validate**:
- YAML syntax before testing skills
- Field presence before querying
- Index existence before complex queries
- Dependency existence before references
- Slug uniqueness before insertion

### Documentation is Not Optional

**Document**:
- Every error encountered
- How you fixed it
- Why it happened
- How to prevent it

**Don't assume** someone (including future you) will remember.

### Test with Small Batches First

**Before processing 157 files**:
- Test with 1 file
- Test with 10 files
- Check results carefully
- Then run full batch

**Failure on file 1** is better than failure on file 157.

### Read Official Docs, Don't Assume

**Never assume**:
- Field names (check docs)
- Default behaviors (test them)
- Pagination limits (verify)
- Index requirements (check Atlas settings)

### MongoDB Atlas is Different

**Atlas-specific issues**:
- notablescan enabled by default
- Stricter query requirements
- Requires indexes for queries
- Different performance characteristics

**Always check Atlas docs** if using Atlas.

---

## 🎯 Pre-Flight Checklist

**Before starting any migration work, check**:

- [ ] Read all critical lessons above
- [ ] Understand Payload's soft-delete system (deletedAt, trash: true)
- [ ] Know pagination requirements (loop until empty)
- [ ] Check if MongoDB Atlas used (create indexes!)
- [ ] Analyze actual data, not just schemas
- [ ] Verify dependency order (seed parents before children)
- [ ] Test with small batch first
- [ ] Validate YAML syntax
- [ ] Check official documentation

---

## 📚 Related Documentation

- **CORRECTION-PAYLOAD-TRASH.md** - Full _deleted vs deletedAt explanation
- **PURGE-SCRIPT-FIX-SUMMARY.md** - Pagination bug details
- **MONGODB-ATLAS-NOTABLESCAN-FIX.md** - Index creation details
- **Payload Trash Docs**: https://payloadcms.com/docs/trash/overview

---

**Last Updated**: 2025-10-24
**Errors Documented**: 6 major issues + general lessons
**Purpose**: Prevent repeating these mistakes
