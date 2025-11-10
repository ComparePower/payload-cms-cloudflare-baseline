#!/usr/bin/env node
/**
 * Verify RichTextDataInstances Seeding
 *
 * Verifies that all expected data instances exist in the database
 * with correct slugs, categories, and values.
 */

import { MongoClient } from 'mongodb'

// Expected phone number slugs (19 total)
const EXPECTED_PHONE_SLUGS = [
  '4change-phone',
  'amigo-phone',
  'cirro-phone',
  'constellation-phone',
  'direct-energy-phone',
  'discount-power-phone',
  'flagship-phone',
  'frontier-phone',
  'frontier-phone-rc',
  'gexa-phone',
  'green-mountain-phone',
  'just-phone',
  'new-power-phone',
  'payless-power-phone',
  'pulse-power-phone',
  'reliant-phone',
  'rhythm-phone',
  'tara-phone',
  'txu-phone',
]

// Expected other data instance slugs
const EXPECTED_OTHER_SLUGS = [
  'avg-tx-residential-rate',
  'comparepower-review-count',
]

/**
 * Main verification function
 */
async function verify() {
  console.log('🔍 Verifying RichTextDataInstances Seeding...\n')

  // Check for connection string
  if (!process.env.MONGO_DB_CONN_STRING) {
    console.error('❌ MONGO_DB_CONN_STRING not found in environment')
    console.error('   Run with: ./scripts/doppler-run.sh dev node migration/scripts/verify-data-instances.mjs')
    process.exit(1)
  }

  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...')
  const client = new MongoClient(process.env.MONGO_DB_CONN_STRING)
  await client.connect()
  const db = client.db()
  console.log('   ✓ Connected\n')

  try {
    // Note: MongoDB collection name is lowercase
    const collection = db.collection('richtextdatainstances')

    // 1. Count total instances
    console.log('📊 Checking total count...')
    const totalCount = await collection.countDocuments()
    const expectedTotal = EXPECTED_PHONE_SLUGS.length + EXPECTED_OTHER_SLUGS.length
    console.log(`   Total instances: ${totalCount}`)
    console.log(`   Expected: ${expectedTotal}`)

    if (totalCount === expectedTotal) {
      console.log('   ✅ Count matches!\n')
    } else {
      console.warn(`   ⚠️  Count mismatch! Found ${totalCount}, expected ${expectedTotal}\n`)
    }

    // 2. Check phone instances
    console.log('📞 Checking phone number instances...')
    const phoneInstances = await collection.find({ category: 'phone' }).toArray()
    console.log(`   Found ${phoneInstances.length} phone instances`)

    const missingPhones = []
    const foundPhones = []

    for (const expectedSlug of EXPECTED_PHONE_SLUGS) {
      const instance = phoneInstances.find((inst) => inst.slug === expectedSlug)
      if (instance) {
        foundPhones.push(expectedSlug)
        console.log(`   ✓ ${expectedSlug}: "${instance.name}" = ${instance.value}`)
      } else {
        missingPhones.push(expectedSlug)
        console.error(`   ❌ Missing: ${expectedSlug}`)
      }
    }

    console.log()

    // 3. Check other instances
    console.log('📈 Checking other data instances...')
    const otherInstances = await collection.find({ category: 'other' }).toArray()
    console.log(`   Found ${otherInstances.length} other instances`)

    const missingOther = []
    const foundOther = []

    for (const expectedSlug of EXPECTED_OTHER_SLUGS) {
      const instance = otherInstances.find((inst) => inst.slug === expectedSlug)
      if (instance) {
        foundOther.push(expectedSlug)
        console.log(`   ✓ ${expectedSlug}: "${instance.name}" = ${instance.value}`)
      } else {
        missingOther.push(expectedSlug)
        console.error(`   ❌ Missing: ${expectedSlug}`)
      }
    }

    console.log()

    // 4. Check for unexpected instances
    console.log('🔎 Checking for unexpected instances...')
    const allExpectedSlugs = [...EXPECTED_PHONE_SLUGS, ...EXPECTED_OTHER_SLUGS]
    const allInstances = await collection.find({}).toArray()
    const unexpectedInstances = allInstances.filter(
      (inst) => !allExpectedSlugs.includes(inst.slug)
    )

    if (unexpectedInstances.length > 0) {
      console.warn(`   ⚠️  Found ${unexpectedInstances.length} unexpected instances:`)
      unexpectedInstances.forEach((inst) => {
        console.warn(`      - ${inst.slug} (${inst.category}): ${inst.name}`)
      })
    } else {
      console.log('   ✅ No unexpected instances')
    }

    console.log()

    // 5. Summary
    console.log('📋 Summary:')
    console.log(`   Phone numbers: ${foundPhones.length}/${EXPECTED_PHONE_SLUGS.length}`)
    console.log(`   Other instances: ${foundOther.length}/${EXPECTED_OTHER_SLUGS.length}`)
    console.log(`   Total: ${foundPhones.length + foundOther.length}/${expectedTotal}`)

    const allMissing = [...missingPhones, ...missingOther]
    if (allMissing.length > 0) {
      console.log()
      console.error('❌ Missing instances:')
      allMissing.forEach((slug) => console.error(`   - ${slug}`))
      console.log()
    }

    // 6. Verification result
    console.log()
    if (
      totalCount === expectedTotal &&
      missingPhones.length === 0 &&
      missingOther.length === 0 &&
      unexpectedInstances.length === 0
    ) {
      console.log('✅ Verification PASSED!')
      console.log('   All expected data instances exist with correct slugs and categories.\n')
    } else {
      console.error('❌ Verification FAILED!')
      console.error('   Some instances are missing, unexpected, or have incorrect data.\n')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message)
    console.error(error.stack)
    throw error
  } finally {
    await client.close()
  }
}

// Run verification
verify()
  .then(() => {
    console.log('✅ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message)
    process.exit(1)
  })
