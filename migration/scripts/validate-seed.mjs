#!/usr/bin/env node

/**
 * T044: Seed Validation Script
 *
 * Validates database counts and field presence
 * - Checks expected document counts
 * - Validates required fields are present
 * - Checks data quality metrics
 */

import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_DB_CONN_STRING

if (!MONGO_URI) {
  console.error('❌ MONGO_DB_CONN_STRING not found in environment')
  console.error('   Run with: ./scripts/doppler-run.sh dev node migration/scripts/validate-seed.mjs')
  process.exit(1)
}

// Expected counts
const EXPECTED_COUNTS = {
  providers: 156,
  'electricity-rates': 895,
  'richtextdatainstances': 21,
}

// Required fields for each collection
const REQUIRED_FIELDS = {
  providers: [
    'title',
    'slug',
    'status',
    'publishedAt',
    'contentBlocks',
  ],
  'electricity-rates': [
    'title',
    'slug',
    'status',
    'cityName',
    'publishedAt',
    'contentBlocks',
  ],
}

// Validation results
const results = {
  counts: {},
  fieldCoverage: {},
  missingFields: [],
  dataQualityIssues: [],
}

/**
 * Get nested field value
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Check if document has all required fields
 */
function checkRequiredFields(doc, requiredFields, collectionName) {
  const missing = []

  for (const field of requiredFields) {
    const value = getNestedValue(doc, field)
    if (value === undefined || value === null) {
      missing.push(field)
    }
  }

  if (missing.length > 0) {
    results.missingFields.push({
      collection: collectionName,
      docId: String(doc._id),
      docTitle: doc.title || 'untitled',
      missingFields: missing,
    })
  }

  return missing.length === 0
}

/**
 * Validate data quality for a document
 */
function validateDataQuality(doc, collectionName) {
  const issues = []

  // Check for empty strings in required text fields
  if (doc.title && doc.title.trim() === '') {
    issues.push('Empty title')
  }

  if (doc.slug && doc.slug.trim() === '') {
    issues.push('Empty slug')
  }

  // Check for invalid status
  if (doc.status && !['draft', 'published'].includes(doc.status)) {
    issues.push(`Invalid status: ${doc.status}`)
  }

  // Check for empty contentBlocks
  if (doc.contentBlocks && Array.isArray(doc.contentBlocks) && doc.contentBlocks.length === 0) {
    issues.push('Empty contentBlocks array')
  }

  // Check for missing publishedAt on published documents
  if (doc.status === 'published' && !doc.publishedAt) {
    issues.push('Published document missing publishedAt')
  }

  // Note: _deleted field is not used in this migration
  // Documents without _deleted are considered active

  if (issues.length > 0) {
    results.dataQualityIssues.push({
      collection: collectionName,
      docId: String(doc._id),
      docTitle: doc.title || 'untitled',
      issues,
    })
  }

  return issues.length === 0
}

/**
 * Get random sample from array
 */
function getRandomSample(array, size) {
  if (array.length <= size) return array
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, size)
}

/**
 * Validate a collection
 */
async function validateCollection(db, collectionName, expectedCount, requiredFields, sampleSize = 20) {
  console.log(`\n📊 Validating ${collectionName}...`)

  // Get count
  const count = await db.collection(collectionName).countDocuments({})
  results.counts[collectionName] = {
    actual: count,
    expected: expectedCount,
    match: count === expectedCount,
  }

  console.log(`   Count: ${count}/${expectedCount} ${count === expectedCount ? '✅' : '❌'}`)

  // Sample documents for field validation
  const docs = await db.collection(collectionName).find({}).toArray()
  const sample = getRandomSample(docs, sampleSize)

  console.log(`   Checking ${sample.length} documents for required fields...`)

  let fieldsValid = 0
  let dataQualityValid = 0

  for (const doc of sample) {
    if (checkRequiredFields(doc, requiredFields, collectionName)) {
      fieldsValid++
    }

    if (validateDataQuality(doc, collectionName)) {
      dataQualityValid++
    }
  }

  results.fieldCoverage[collectionName] = {
    checked: sample.length,
    valid: fieldsValid,
    percentage: ((fieldsValid / sample.length) * 100).toFixed(2),
  }

  console.log(`   Field coverage: ${fieldsValid}/${sample.length} (${results.fieldCoverage[collectionName].percentage}%)`)
  console.log(`   Data quality: ${dataQualityValid}/${sample.length} (${((dataQualityValid / sample.length) * 100).toFixed(2)}%)`)

  return count === expectedCount && fieldsValid === sample.length && dataQualityValid === sample.length
}

/**
 * Main validation function
 */
async function validateSeed() {
  console.log('🔍 Starting seed validation...\n')

  const client = new MongoClient(MONGO_URI)

  try {
    await client.connect()
    const db = client.db()

    console.log('📁 Connected to database')

    // Validate providers
    await validateCollection(
      db,
      'providers',
      EXPECTED_COUNTS.providers,
      REQUIRED_FIELDS.providers,
      20
    )

    // Validate electricity rates
    await validateCollection(
      db,
      'electricity-rates',
      EXPECTED_COUNTS['electricity-rates'],
      REQUIRED_FIELDS['electricity-rates'],
      20
    )

    // Validate RichTextDataInstances
    const rtdiCount = await db.collection('richtextdatainstances').countDocuments({})
    results.counts['richtextdatainstances'] = {
      actual: rtdiCount,
      expected: EXPECTED_COUNTS['richtextdatainstances'],
      match: rtdiCount === EXPECTED_COUNTS['richtextdatainstances'],
    }
    console.log(`\n📊 RichTextDataInstances: ${rtdiCount}/${EXPECTED_COUNTS['richtextdatainstances']} ${rtdiCount === EXPECTED_COUNTS['richtextdatainstances'] ? '✅' : '❌'}`)

    console.log('\n✅ Seed validation complete!\n')

    // Print detailed results
    console.log('=' .repeat(80))
    console.log('SEED VALIDATION RESULTS')
    console.log('=' .repeat(80))
    console.log()

    console.log('📊 Document Counts:')
    for (const [collection, data] of Object.entries(results.counts)) {
      const status = data.match ? '✅' : '❌'
      console.log(`   ${status} ${collection}: ${data.actual}/${data.expected}`)
    }
    console.log()

    console.log('📊 Field Coverage:')
    for (const [collection, data] of Object.entries(results.fieldCoverage)) {
      const status = data.valid === data.checked ? '✅' : '⚠️'
      console.log(`   ${status} ${collection}: ${data.valid}/${data.checked} (${data.percentage}%)`)
    }
    console.log()

    if (results.missingFields.length > 0) {
      console.log('❌ Missing Required Fields:')
      results.missingFields.slice(0, 10).forEach(({ collection, docTitle, missingFields }) => {
        console.log(`   [${collection}] ${docTitle}: ${missingFields.join(', ')}`)
      })
      if (results.missingFields.length > 10) {
        console.log(`   ... and ${results.missingFields.length - 10} more`)
      }
      console.log()
    }

    if (results.dataQualityIssues.length > 0) {
      console.log('⚠️  Data Quality Issues:')
      results.dataQualityIssues.slice(0, 10).forEach(({ collection, docTitle, issues }) => {
        console.log(`   [${collection}] ${docTitle}: ${issues.join(', ')}`)
      })
      if (results.dataQualityIssues.length > 10) {
        console.log(`   ... and ${results.dataQualityIssues.length - 10} more`)
      }
      console.log()
    }

    console.log('=' .repeat(80))
    console.log()

    // Calculate overall success
    const countsMatch = Object.values(results.counts).every(c => c.match)
    const fieldCoverageGood = Object.values(results.fieldCoverage).every(
      c => parseFloat(c.percentage) >= 95
    )
    const dataQualityGood = results.dataQualityIssues.length === 0

    console.log('Summary:')
    console.log(`  ${countsMatch ? '✅' : '❌'} Document counts match expected`)
    console.log(`  ${fieldCoverageGood ? '✅' : '⚠️'} Field coverage >= 95%`)
    console.log(`  ${dataQualityGood ? '✅' : '⚠️'} No data quality issues`)
    console.log()

    // Exit code
    if (countsMatch && fieldCoverageGood && results.dataQualityIssues.length <= 5) {
      console.log('✅ Seed validation PASSED')
      process.exit(0)
    } else {
      console.log('❌ Seed validation FAILED')
      process.exit(1)
    }

  } catch (err) {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  } finally {
    await client.close()
  }
}

// Run validation
validateSeed()
