# Migration Issues Report - Providers Collection

## ❌ CRITICAL: Data Loss Detected

Verification testing revealed that **8 out of 17 frontmatter fields** are NOT being migrated to the database.

## Missing Fields

### 1. **wpPostId** (wp_post_id in frontmatter)
- **Type**: number
- **Present in source**: 156/157 files
- **Present in database**: NO
- **Impact**: Critical - WordPress post ID needed for migration tracking

### 2. **updatedDate**
- **Type**: date
- **Present in source**: 156/157 files
- **Present in database**: NO
- **Impact**: High - Last updated tracking lost

### 3. **targetKeyword** (target_keyword in frontmatter)
- **Type**: string
- **Present in source**: Most files
- **Present in database**: NO
- **Impact**: High - SEO keyword tracking lost

### 4. **wp_author**
- **Type**: string
- **Present in source**: Many files
- **Present in database**: NO
- **Impact**: Medium - Author information lost

### 5. **post_author_team_member_is**
- **Type**: relationship → team collection
- **Present in source**: Some files
- **Present in database**: NO
- **Impact**: **CRITICAL** - Relationship data lost, team member links broken

### 6. **post_editor_team_member_is**
- **Type**: relationship → team collection
- **Present in source**: Some files
- **Present in database**: NO
- **Impact**: **CRITICAL** - Relationship data lost

### 7. **post_checker_team_member_is**
- **Type**: relationship → team collection
- **Present in source**: Some files
- **Present in database**: NO
- **Impact**: **CRITICAL** - Relationship data lost

### 8. **description**
- **Type**: string
- **Present in source**: Some files
- **Present in database**: NO
- **Impact**: Medium - Description field lost

## Root Cause

The `prepare-seed-data.mjs` script has hardcoded field extraction that only captures a subset of frontmatter fields. It does not dynamically extract all fields discovered during the frontmatter analysis phase.

**File**: `migration/scripts/prepare-seed-data.mjs`
**Lines**: 256-276 (provider object construction)

## Required Fix

### Step 1: Update Data Preparation Script

Modify `prepare-seed-data.mjs` to extract ALL 17 fields:

```javascript
const provider = {
  // Basic fields
  title: frontmatter.title,
  slug: uniqueSlug,
  status: frontmatter.draft === false ? 'published' : 'draft',

  // WordPress fields
  wordpressSlug: frontmatter.wp_slug,
  wpPostId: frontmatter.wp_post_id,                    // FIX: Add this
  wpAuthor: frontmatter.wp_author,                     // FIX: Add this

  // SEO fields
  seo: {
    title: frontmatter.seo_title,
    metaDescription: frontmatter.seo_meta_desc
  },

  // Dates
  publishedAt: frontmatter.pubDate,
  updatedDate: frontmatter.updatedDate,                // FIX: Add this

  // Hero section
  hero: {
    headingLine1: frontmatter.cp_hero_heading_line_1,
    headingLine2: frontmatter.cp_hero_heading_line_2,
    ctaText: frontmatter.cp_hero_cta_text
  },

  // Content
  content: lexicalContent,
  contentBlocks: components.map(componentToBlock),
  description: frontmatter.description,                // FIX: Add this
  targetKeyword: frontmatter.target_keyword,           // FIX: Add this

  // Team relationships (CRITICAL)
  postAuthorTeamMemberIs: frontmatter.post_author_team_member_is,    // FIX: Add this
  postEditorTeamMemberIs: frontmatter.post_editor_team_member_is,    // FIX: Add this
  postCheckerTeamMemberIs: frontmatter.post_checker_team_member_is,  // FIX: Add this
}
```

### Step 2: Re-run Data Preparation
```bash
node migration/scripts/prepare-seed-data.mjs
```

### Step 3: Re-seed Database
```bash
./scripts/doppler-run.sh dev node migration/scripts/seed-database-simple.mjs
```

### Step 4: Verify with Comprehensive Tests
```bash
./scripts/doppler-run.sh dev node migration/scripts/verify-migration-comprehensive.mjs
```

## Verification Test Results (Current State)

### Test 1: Database Count
- ✅ PASS - 157 providers in database

### Test 2: Field Presence
- ❌ FAIL - Missing 11/17 fields (some were nested fields misidentified)
- Actual missing count: 8 critical fields

### Test 3: Data Integrity
- ✅ PASS - Sample records have basic required fields

### Test 4: Frontmatter Preservation
- ⚠️ PARTIAL PASS - Basic fields match, but not all fields tested

### Test 5: Missing Critical Fields
- ❌ FAIL - All 5 tested critical fields are missing from database

## Impact Assessment

### Data Loss
- **High**: 8 fields with valuable metadata lost
- **Critical**: 3 relationship fields lost (team member links)
- **Medium**: SEO and tracking data compromised

### Functionality Impact
- Team member relationships cannot be displayed
- WordPress migration tracking broken
- SEO keyword tracking lost
- Last updated dates missing
- Content descriptions missing

## Next Steps

1. **IMMEDIATE**: Fix `prepare-seed-data.mjs` to include all fields
2. **IMMEDIATE**: Re-prepare and re-seed data
3. **IMMEDIATE**: Run comprehensive verification
4. **BEFORE CONTINUING**: Ensure all tests pass
5. **ONLY THEN**: Proceed to electricity-rates collection

## Lessons Learned

1. ✅ **Good**: Built frontmatter analysis to discover all fields
2. ❌ **BAD**: Didn't use analysis results in data preparation
3. ❌ **BAD**: Declared success without comprehensive verification
4. ✅ **Good**: Comprehensive test suite caught the issues
5. **IMPROVEMENT NEEDED**: Use analysis output to drive code generation

## Status

🔴 **BLOCKED** - Migration incomplete, data loss detected, requires fix before proceeding
