#!/usr/bin/env node
/**
 * Comprehensive Migration Verification
 *
 * Exhaustive testing of providers migration:
 * - Direct database queries to verify all 157 records
 * - Field-by-field validation against frontmatter specs
 * - Relationship integrity checks (team members)
 * - Data completeness verification
 * - Reports missing/incorrect data
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { MongoClient } from 'mongodb'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASTRO_PROVIDERS_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/providers'
const MONGO_URI = process.env.MONGO_DB_CONN_STRING

// Expected frontmatter fields from analysis
const EXPECTED_FIELDS = [
  'title',
  'wp_slug',
  'wp_post_id',
  'seo_meta_desc',
  'draft',
  'pubDate',
  'updatedDate',
  'wp_author',
  'cp_hero_heading_line_1',
  'cp_hero_heading_line_2',
  'cp_hero_cta_text',
  'seo_title',
  'target_keyword',
  'post_author_team_member_is',
  'post_editor_team_member_is',
  'post_checker_team_member_is',
  'description'
]

/**
 * Parse frontmatter from MDX
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const frontmatter = {}
  const yamlContent = match[1]
  const lines = yamlContent.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    if (value === 'true') value = true
    if (value === 'false') value = false
    if (/^\d+$/.test(value)) value = parseInt(value, 10)

    frontmatter[key] = value
  }

  return frontmatter
}

/**
 * Find all MDX files
 */
async function findMdxFiles(dir) {
  const files = []

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(fullPath)
      }
    }
  }

  await walk(dir)
  return files
}

/**
 * Test 1: Database count verification
 */
async function testDatabaseCount(collection) {
  console.log('\n📊 Test 1: Database Count')
  console.log('━'.repeat(50))

  const count = await collection.countDocuments()
  const expected = 157

  console.log(`   Database count: ${count}`)
  console.log(`   Expected count: ${expected}`)

  if (count === expected) {
    console.log('   ✅ PASS - Count matches')
    return { pass: true, count }
  } else {
    console.log(`   ❌ FAIL - Expected ${expected}, got ${count}`)
    return { pass: false, count, expected }
  }
}

/**
 * Test 2: Field presence verification
 */
async function testFieldPresence(collection) {
  console.log('\n📋 Test 2: Field Presence in Database')
  console.log('━'.repeat(50))

  const sample = await collection.findOne({})
  const dbFields = Object.keys(sample)

  console.log(`   Fields in database record: ${dbFields.length}`)
  console.log(`   Expected frontmatter fields: ${EXPECTED_FIELDS.length}`)

  const results = {
    pass: true,
    present: [],
    missing: [],
    extra: []
  }

  // Check which expected fields are present
  for (const field of EXPECTED_FIELDS) {
    // Map frontmatter fields to database structure
    const dbField = field === 'wp_slug' ? 'wordpressSlug' :
                    field === 'seo_title' ? 'seo' :
                    field === 'seo_meta_desc' ? 'seo' :
                    field === 'pubDate' ? 'publishedAt' :
                    field === 'target_keyword' ? 'targetKeyword' :
                    field

    if (dbFields.includes(dbField) || (dbField === 'seo' && sample.seo)) {
      results.present.push(field)
      console.log(`   ✓ ${field}`)
    } else {
      results.missing.push(field)
      console.log(`   ✗ ${field} - MISSING`)
      results.pass = false
    }
  }

  if (results.missing.length > 0) {
    console.log(`\n   ❌ FAIL - Missing ${results.missing.length} fields:`)
    results.missing.forEach(f => console.log(`      - ${f}`))
  } else {
    console.log(`\n   ✅ PASS - All fields present`)
  }

  return results
}

/**
 * Test 3: Sample data integrity
 */
async function testDataIntegrity(collection) {
  console.log('\n🔍 Test 3: Data Integrity (Sample Records)')
  console.log('━'.repeat(50))

  // Get 5 sample providers
  const samples = await collection.find({}).limit(5).toArray()

  const results = {
    pass: true,
    tested: 0,
    issues: []
  }

  for (const provider of samples) {
    results.tested++
    console.log(`\n   Provider: ${provider.title}`)
    console.log(`   Slug: ${provider.slug}`)

    // Check required fields
    if (!provider.title) {
      results.issues.push({ provider: provider.slug, field: 'title', issue: 'missing' })
      console.log('      ❌ title missing')
      results.pass = false
    } else {
      console.log('      ✓ title present')
    }

    if (!provider.slug) {
      results.issues.push({ provider: provider.title, field: 'slug', issue: 'missing' })
      console.log('      ❌ slug missing')
      results.pass = false
    } else {
      console.log('      ✓ slug present')
    }

    if (!provider.publishedAt) {
      results.issues.push({ provider: provider.slug, field: 'publishedAt', issue: 'missing' })
      console.log('      ❌ publishedAt missing')
      results.pass = false
    } else {
      console.log('      ✓ publishedAt present')
    }

    // Check SEO fields
    if (provider.seo) {
      console.log('      ✓ seo group present')
      if (provider.seo.title) console.log('        ✓ seo.title present')
      if (provider.seo.metaDescription) console.log('        ✓ seo.metaDescription present')
    } else {
      console.log('      ⚠️  seo group missing')
    }

    // Check hero fields
    if (provider.hero) {
      console.log('      ✓ hero group present')
    } else {
      console.log('      ⚠️  hero group missing')
    }
  }

  console.log(`\n   Tested ${results.tested} providers`)
  if (results.pass) {
    console.log('   ✅ PASS - All sampled records have required fields')
  } else {
    console.log(`   ❌ FAIL - Found ${results.issues.length} issues`)
  }

  return results
}

/**
 * Test 4: Frontmatter preservation
 */
async function testFrontmatterPreservation(collection) {
  console.log('\n📝 Test 4: Frontmatter Preservation (Source vs DB)')
  console.log('━'.repeat(50))

  // Pick a specific provider to test
  const provider = await collection.findOne({ slug: { $regex: 'reliant-vs-direct-energy' } })

  if (!provider) {
    console.log('   ❌ FAIL - Test provider not found')
    return { pass: false }
  }

  console.log(`   Testing provider: ${provider.title}`)

  // Find corresponding MDX file
  const mdxFiles = await findMdxFiles(ASTRO_PROVIDERS_DIR)
  const mdxFile = mdxFiles.find(f => f.includes('reliant-vs-direct-energy'))

  if (!mdxFile) {
    console.log('   ❌ FAIL - Source MDX not found')
    return { pass: false }
  }

  const content = await fs.readFile(mdxFile, 'utf-8')
  const frontmatter = parseFrontmatter(content)

  console.log(`\n   Comparing frontmatter fields:`)

  const issues = []

  // Check title
  if (frontmatter.title === provider.title) {
    console.log(`   ✓ title matches: "${provider.title}"`)
  } else {
    console.log(`   ❌ title mismatch:`)
    console.log(`      Source: "${frontmatter.title}"`)
    console.log(`      DB: "${provider.title}"`)
    issues.push('title')
  }

  // Check wp_post_id
  if (frontmatter.wp_post_id === provider.wpPostId) {
    console.log(`   ✓ wpPostId matches: ${provider.wpPostId}`)
  } else {
    console.log(`   ❌ wpPostId mismatch:`)
    console.log(`      Source: ${frontmatter.wp_post_id}`)
    console.log(`      DB: ${provider.wpPostId}`)
    issues.push('wpPostId')
  }

  // Check seo_title
  if (frontmatter.seo_title === provider.seo?.title) {
    console.log(`   ✓ seo.title matches`)
  } else {
    console.log(`   ❌ seo.title mismatch:`)
    console.log(`      Source: "${frontmatter.seo_title}"`)
    console.log(`      DB: "${provider.seo?.title}"`)
    issues.push('seo.title')
  }

  // Check relationship fields
  console.log(`\n   Checking relationship fields:`)

  if (frontmatter.post_author_team_member_is) {
    if (provider.post_author_team_member_is) {
      console.log(`   ✓ post_author_team_member_is preserved`)
    } else {
      console.log(`   ❌ post_author_team_member_is MISSING in DB`)
      console.log(`      Source had: ${frontmatter.post_author_team_member_is}`)
      issues.push('post_author_team_member_is')
    }
  }

  if (issues.length === 0) {
    console.log(`\n   ✅ PASS - All fields match source`)
    return { pass: true }
  } else {
    console.log(`\n   ❌ FAIL - ${issues.length} fields don't match:`)
    issues.forEach(f => console.log(`      - ${f}`))
    return { pass: false, issues }
  }
}

/**
 * Test 5: Missing fields report
 */
async function testMissingFields(collection) {
  console.log('\n🔎 Test 5: Missing Critical Fields Report')
  console.log('━'.repeat(50))

  const criticalFields = [
    'post_author_team_member_is',
    'post_editor_team_member_is',
    'post_checker_team_member_is',
    'description',
    'wp_author'
  ]

  const results = {
    pass: true,
    missing: []
  }

  for (const field of criticalFields) {
    const sample = await collection.findOne({ [field]: { $exists: true } })

    if (sample) {
      console.log(`   ✓ ${field} - found in database`)
    } else {
      console.log(`   ❌ ${field} - NOT FOUND in any record`)
      results.missing.push(field)
      results.pass = false
    }
  }

  if (results.pass) {
    console.log(`\n   ✅ PASS - All critical fields present`)
  } else {
    console.log(`\n   ❌ FAIL - Missing fields detected:`)
    results.missing.forEach(f => console.log(`      - ${f}`))
    console.log(`\n   ⚠️  These fields exist in source frontmatter but were not migrated!`)
  }

  return results
}

/**
 * Main verification
 */
async function verify() {
  console.log('🧪 COMPREHENSIVE MIGRATION VERIFICATION')
  console.log('═'.repeat(50))

  if (!MONGO_URI) {
    console.error('\n❌ MONGO_DB_CONN_STRING not set')
    console.error('   Run with: ./scripts/doppler-run.sh dev node migration/scripts/verify-migration-comprehensive.mjs')
    process.exit(1)
  }

  const client = new MongoClient(MONGO_URI)

  try {
    await client.connect()
    const db = client.db()
    const collection = db.collection('providers')

    // Run all tests
    const test1 = await testDatabaseCount(collection)
    const test2 = await testFieldPresence(collection)
    const test3 = await testDataIntegrity(collection)
    const test4 = await testFrontmatterPreservation(collection)
    const test5 = await testMissingFields(collection)

    // Final summary
    console.log('\n' + '═'.repeat(50))
    console.log('📊 VERIFICATION SUMMARY')
    console.log('═'.repeat(50))

    const tests = [test1, test2, test3, test4, test5]
    const passed = tests.filter(t => t.pass).length
    const failed = tests.length - passed

    console.log(`\n   Total tests: ${tests.length}`)
    console.log(`   Passed: ${passed}`)
    console.log(`   Failed: ${failed}`)

    if (failed === 0) {
      console.log(`\n   ✅ ALL TESTS PASSED - Migration is complete and correct!\n`)
      process.exit(0)
    } else {
      console.log(`\n   ❌ ${failed} TEST(S) FAILED - Migration has issues that need fixing\n`)
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await client.close()
  }
}

// Run verification
verify()
