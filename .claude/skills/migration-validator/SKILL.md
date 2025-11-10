---
name: migration-validator
description: Verify migration results at all layers - database queries, field presence checks, relationship integrity, admin UI testing with Playwright, and comprehensive validation reporting. Use when validating migrations, verifying database seeding, checking data integrity, testing admin UI functionality, generating validation reports, or confirming migration success.
allowed-tools: Read, Write, Bash
---

# Migration Validator Skill

Comprehensive validation of migration results across all system layers.

## What This Skill Does

This skill verifies migration success through multiple validation layers:
- Database count queries
- Field presence verification
- Relationship integrity checks
- Soft-delete configuration validation
- Admin UI testing (Playwright)
- Comprehensive validation reporting

## When to Use This Skill

Use this skill when:
- Completing a collection migration
- Verifying database seeding
- Checking data integrity
- Testing admin UI functionality
- Generating validation reports
- Debugging migration failures
- Confirming 100% success rate

## Input/Output Contract

### Input
```typescript
interface ValidationInput {
  collection: string              // Collection to validate
  expectedCount: number           // Expected record count
  sampleIds?: string[]           // Specific records to test
  checkRelationships?: boolean   // Validate relationships
  testAdminUI?: boolean          // Run Playwright tests
}
```

### Output
```typescript
interface ValidationOutput {
  passed: boolean                 // Overall pass/fail
  layers: LayerResult[]          // Results per layer
  errors: ValidationError[]      // All errors found
  warnings: string[]             // Non-critical issues
  report: string                 // Human-readable report
}
```

## Validation Layers

### Layer 1: Database Count Validation

**Purpose**: Verify expected number of records exist

**Query**:
```typescript
import { getPayload } from 'payload'

async function validateCount(
  collection: string,
  expectedCount: number
): Promise<ValidationResult> {
  const payload = await getPayload({ config })

  const { totalDocs } = await payload.find({
    collection,
    limit: 1,
    where: {
      deletedAt: { equals: null }  // Active records only
    }
  })

  const passed = totalDocs === expectedCount

  return {
    layer: 'Database Count',
    passed,
    expected: expectedCount,
    actual: totalDocs,
    message: passed
      ? `✓ Found ${totalDocs} records (expected ${expectedCount})`
      : `✗ Found ${totalDocs} records (expected ${expectedCount})`
  }
}
```

**Validation Criteria**:
- [ ] Total docs equals expected count
- [ ] Query executes without errors
- [ ] Only active records counted (deletedAt: null)

### Layer 2: Required Fields Validation

**Purpose**: Verify all required fields are present and populated

**Query**:
```typescript
async function validateRequiredFields(
  collection: string,
  requiredFields: string[]
): Promise<ValidationResult> {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection,
    limit: 10,  // Sample check
    where: {
      deletedAt: { equals: null }
    }
  })

  const errors: string[] = []

  for (const doc of docs) {
    for (const field of requiredFields) {
      const value = getNestedValue(doc, field)

      if (value === null || value === undefined || value === '') {
        errors.push(`Record ${doc.id}: Missing required field "${field}"`)
      }
    }
  }

  return {
    layer: 'Required Fields',
    passed: errors.length === 0,
    checked: docs.length,
    errors
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}
```

**Required Fields Checklist**:
- [ ] `createdAt` present (ISO timestamp)
- [ ] `updatedAt` present (ISO timestamp)
- [ ] `deletedAt` present (null for active records)
- [ ] `title` present (for most collections)
- [ ] `slug` present and unique
- [ ] `publishedAt` present (if applicable)

**Validation Criteria**:
- [ ] All required fields exist
- [ ] No null/undefined/empty values
- [ ] Nested fields accessible (e.g., `seo.title`)

### Layer 3: Soft-Delete Configuration

**Purpose**: Verify soft-delete is properly configured

**Query**:
```typescript
async function validateSoftDelete(
  collection: string
): Promise<ValidationResult> {
  const payload = await getPayload({ config })

  // Check if deletedAt field exists
  const { docs } = await payload.find({
    collection,
    limit: 1,
    where: {
      deletedAt: { equals: null }
    }
  })

  if (docs.length === 0) {
    return {
      layer: 'Soft-Delete',
      passed: false,
      message: 'No records found - cannot verify soft-delete'
    }
  }

  const doc = docs[0]

  // Verify deletedAt field exists
  const hasDeletedAtField = 'deletedAt' in doc

  // Verify it's null for active records
  const isNull = doc.deletedAt === null

  const passed = hasDeletedAtField && isNull

  return {
    layer: 'Soft-Delete',
    passed,
    hasDeletedAtField,
    isNull,
    message: passed
      ? '✓ Soft-delete configured correctly'
      : '✗ Soft-delete misconfigured'
  }
}
```

**Validation Criteria**:
- [ ] `deletedAt` field exists
- [ ] `deletedAt` is `null` for active records
- [ ] Collection has `trash: true` in config
- [ ] Queries filter on `deletedAt` by default

### Layer 4: Relationship Integrity

**Purpose**: Verify all relationship references resolve

**Query**:
```typescript
async function validateRelationships(
  collection: string,
  relationships: RelationshipConfig[]
): Promise<ValidationResult> {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection,
    limit: 100,  // Sample check
    where: {
      deletedAt: { equals: null }
    }
  })

  const errors: string[] = []

  for (const doc of docs) {
    for (const rel of relationships) {
      const value = getNestedValue(doc, rel.field)

      if (!value) continue  // Optional relationship

      // Single relationship
      if (rel.hasMany === false) {
        const exists = await checkReferenceExists(
          payload,
          rel.collection,
          value
        )

        if (!exists) {
          errors.push(
            `Record ${doc.id}: Invalid ${rel.field} reference "${value}"`
          )
        }
      }

      // Multiple relationships
      if (rel.hasMany === true && Array.isArray(value)) {
        for (const refId of value) {
          const exists = await checkReferenceExists(
            payload,
            rel.collection,
            refId
          )

          if (!exists) {
            errors.push(
              `Record ${doc.id}: Invalid ${rel.field} reference "${refId}"`
            )
          }
        }
      }
    }
  }

  return {
    layer: 'Relationship Integrity',
    passed: errors.length === 0,
    checked: docs.length,
    errors
  }
}

async function checkReferenceExists(
  payload: Payload,
  collection: string,
  id: string
): Promise<boolean> {
  try {
    const doc = await payload.findByID({
      collection,
      id
    })
    return !!doc
  } catch {
    return false
  }
}
```

**Validation Criteria**:
- [ ] All relationship IDs exist in target collection
- [ ] No orphaned references
- [ ] `hasMany` relationships are arrays
- [ ] Single relationships are strings

### Layer 5: Admin UI Testing (Playwright)

**Purpose**: Verify records display correctly in admin UI

**Test Script**:
```typescript
import { test, expect } from '@playwright/test'

test('Collection loads in admin UI', async ({ page }) => {
  // Navigate to admin
  await page.goto('http://localhost:3002/admin')

  // Login
  await page.fill('input[name="email"]', 'admin@example.com')
  await page.fill('input[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Wait for dashboard
  await expect(page.locator('h1')).toContainText('Dashboard')

  // Navigate to collection
  await page.click(`a[href="/admin/collections/providers"]`)

  // Wait for collection list
  await expect(page.locator('h1')).toContainText('Providers')

  // Verify records appear
  const rows = page.locator('table tbody tr')
  await expect(rows).toHaveCount.greaterThan(0)

  // Click first record
  await rows.first().click()

  // Verify detail view loads
  await expect(page.locator('h1')).toContainText('Provider')

  // Check for "Document not found" error
  const errorMessage = page.locator('text=Document not found')
  await expect(errorMessage).not.toBeVisible()
})
```

**Validation Criteria**:
- [ ] Collection list loads
- [ ] Records appear in table
- [ ] Individual record detail view loads
- [ ] No "Document not found" errors
- [ ] All fields render without errors

### Layer 6: Field Type Validation

**Purpose**: Verify field values match expected types

**Query**:
```typescript
async function validateFieldTypes(
  collection: string,
  fieldTypes: Record<string, string>
): Promise<ValidationResult> {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection,
    limit: 10,
    where: {
      deletedAt: { equals: null }
    }
  })

  const errors: string[] = []

  for (const doc of docs) {
    for (const [field, expectedType] of Object.entries(fieldTypes)) {
      const value = getNestedValue(doc, field)

      if (value === null || value === undefined) continue  // Optional field

      const actualType = typeof value

      if (actualType !== expectedType) {
        errors.push(
          `Record ${doc.id}: Field "${field}" has type ${actualType} (expected ${expectedType})`
        )
      }
    }
  }

  return {
    layer: 'Field Types',
    passed: errors.length === 0,
    checked: docs.length,
    errors
  }
}
```

**Validation Criteria**:
- [ ] String fields are strings
- [ ] Number fields are numbers
- [ ] Date fields are valid ISO timestamps
- [ ] Boolean fields are booleans
- [ ] Array fields are arrays

## Example Validation

### Input Configuration

```typescript
const validationConfig = {
  collection: 'providers',
  expectedCount: 157,
  requiredFields: [
    'title',
    'slug',
    'status',
    'publishedAt',
    'createdAt',
    'updatedAt',
    'deletedAt'
  ],
  relationships: [
    {
      field: 'providerMetadata',
      collection: 'providerMetadatas',
      hasMany: false
    }
  ],
  fieldTypes: {
    'title': 'string',
    'slug': 'string',
    'publishedAt': 'string',
    'wpPostId': 'number'
  },
  testAdminUI: true
}
```

### Validation Report

```
===========================================
MIGRATION VALIDATION REPORT
===========================================

Collection: providers
Timestamp: 2025-10-24T12:30:00Z

-------------------------------------------
LAYER 1: Database Count
-------------------------------------------
Status: ✓ PASSED
Expected: 157
Actual: 157
Message: Found 157 active records

-------------------------------------------
LAYER 2: Required Fields
-------------------------------------------
Status: ✓ PASSED
Checked: 10 sample records
Missing: 0

Required fields verified:
  ✓ title
  ✓ slug
  ✓ status
  ✓ publishedAt
  ✓ createdAt
  ✓ updatedAt
  ✓ deletedAt

-------------------------------------------
LAYER 3: Soft-Delete Configuration
-------------------------------------------
Status: ✓ PASSED
deletedAt field: Present
Value for active records: null
Config setting (trash): true

-------------------------------------------
LAYER 4: Relationship Integrity
-------------------------------------------
Status: ✓ PASSED
Checked: 100 records
Relationships verified:
  ✓ providerMetadata → providerMetadatas

Orphaned references: 0

-------------------------------------------
LAYER 5: Admin UI Testing
-------------------------------------------
Status: ✓ PASSED

Tests executed:
  ✓ Collection list loads
  ✓ Records appear in table (157 rows)
  ✓ Individual record loads
  ✓ No "Document not found" errors
  ✓ All fields render

-------------------------------------------
LAYER 6: Field Types
-------------------------------------------
Status: ✓ PASSED
Checked: 10 sample records

Field types verified:
  ✓ title: string
  ✓ slug: string
  ✓ publishedAt: string (ISO date)
  ✓ wpPostId: number

-------------------------------------------
OVERALL RESULT: ✓ PASSED
-------------------------------------------

All 6 validation layers passed successfully.
Migration is complete and verified.

===========================================
```

## Scripts Reference

### `scripts/verify-database.mjs`

**Purpose**: Run database validation layers

**Usage**:
```bash
./scripts/doppler-run.sh dev node \
  .claude/skills/migration-validator/scripts/verify-database.mjs \
  --collection providers \
  --expected-count 157
```

**Output**: Database validation report

### `scripts/verify-admin-ui.mjs`

**Purpose**: Run Playwright admin UI tests

**Usage**:
```bash
pnpm playwright test \
  .claude/skills/migration-validator/scripts/verify-admin-ui.mjs
```

**Output**: Playwright test results

## Validation Checklist

Before marking validation complete, verify:

- [ ] Database count matches expected
- [ ] All required fields present
- [ ] Soft-delete configured (deletedAt field)
- [ ] All relationships resolve
- [ ] Field types correct
- [ ] Admin UI loads collection
- [ ] Individual records load in admin UI
- [ ] No "Document not found" errors
- [ ] Validation report generated
- [ ] All layers passed

## Troubleshooting

### Issue: Count Mismatch

**Symptom**: Total docs ≠ expected count

**Causes**:
- Some records failed to seed
- Duplicate slugs prevented insertion
- Soft-deleted records not excluded

**Fix**:
1. Query for failed records
2. Check seed script logs
3. Verify slug uniqueness
4. Re-seed missing records

### Issue: Missing Fields

**Symptom**: Required fields missing or null

**Causes**:
- Field not mapped in seed script
- Frontmatter missing in source
- Field name mismatch

**Fix**:
1. Check frontmatter in source files
2. Verify field mapping in seed script
3. Update schema if needed
4. Re-seed affected records

### Issue: Orphaned References

**Symptom**: Relationship IDs don't exist

**Causes**:
- Related collection not seeded yet
- Incorrect ID mapping
- Deleted referenced records

**Fix**:
1. Seed related collection first
2. Verify ID resolution logic
3. Check for deleted references
4. Update references or re-seed

### Issue: Admin UI Errors

**Symptom**: "Document not found" when clicking records

**Causes**:
- Missing `deletedAt` field
- MongoDB index missing
- Payload query filtering incorrectly

**Fix**:
1. Check `deletedAt` field exists and is null
2. Create MongoDB indexes
3. Verify collection config has `trash: true`
4. Check Payload access control

## Best Practices

1. **Run After Every Migration**: Don't skip validation
2. **Test Sample First**: Start with 10 records before full validation
3. **Check All Layers**: Don't stop at database queries
4. **Use Playwright**: UI testing catches real issues
5. **Generate Reports**: Document validation results
6. **Fix Before Proceeding**: Don't continue with failed validation
7. **Automate**: Include validation in CI/CD pipeline

## Resources

- **Playwright Documentation**: https://playwright.dev/docs/intro
- **Payload Find API**: https://payloadcms.com/docs/queries/overview
- **MongoDB Indexes**: https://www.mongodb.com/docs/manual/indexes/

---

**Created**: 2025-10-24
**Version**: 1.0
**Use**: Ask "Validate the provider migration"
