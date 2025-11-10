#!/usr/bin/env node
/**
 * Seed Payload Database
 *
 * Seeds Payload collections with prepared data:
 * - PURGES existing data from target collection (fresh start)
 * - Seeds providers from prepared JSON
 * - Shows progress and handles errors
 * - Validates data integrity
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../../src/payload.config.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED_DATA_FILE = path.join(__dirname, '../data/seed/providers.json')

// Parse command line args
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SKIP_PURGE = args.includes('--skip-purge')

/**
 * Initialize Payload
 */
async function initPayload() {
  console.log('🔌 Initializing Payload...')

  const payload = await getPayload({ config })

  console.log('   ✓ Payload initialized\n')
  return payload
}

/**
 * Purge existing providers
 */
async function purgeProviders(payload) {
  if (SKIP_PURGE) {
    console.log('⏭️  Skipping purge (--skip-purge flag)\n')
    return { deleted: 0 }
  }

  console.log('🗑️  Purging existing providers...')

  if (DRY_RUN) {
    // Count existing
    const { docs } = await payload.find({
      collection: 'providers',
      limit: 0
    })
    console.log(`   [DRY RUN] Would delete ${docs.totalDocs} providers\n`)
    return { deleted: 0 }
  }

  // Delete all providers
  try {
    const result = await payload.delete({
      collection: 'providers',
      where: {} // Delete all
    })

    console.log(`   ✓ Deleted ${result.docs.length} providers\n`)
    return { deleted: result.docs.length }
  } catch (error) {
    console.error(`   ❌ Purge failed: ${error.message}`)
    throw error
  }
}

/**
 * Seed providers
 */
async function seedProviders(payload, providers) {
  console.log(`📥 Seeding ${providers.length} providers...\n`)

  const results = {
    total: providers.length,
    created: 0,
    failed: 0,
    errors: []
  }

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]
    const progress = `[${i + 1}/${providers.length}]`

    try {
      if (DRY_RUN) {
        console.log(`   ${progress} [DRY RUN] Would create: ${provider.title}`)
        results.created++
      } else {
        const doc = await payload.create({
          collection: 'providers',
          data: provider
        })

        console.log(`   ${progress} ✓ Created: ${doc.title} (ID: ${doc.id})`)
        results.created++
      }
    } catch (error) {
      console.error(`   ${progress} ❌ Failed: ${provider.title}`)
      console.error(`      Error: ${error.message}`)

      results.failed++
      results.errors.push({
        provider: provider.title,
        error: error.message
      })

      // Stop if too many failures
      if (results.failed > 10) {
        console.error('\n❌ Too many failures, stopping seed\n')
        break
      }
    }

    // Progress indicator every 20 items
    if ((i + 1) % 20 === 0) {
      console.log(`\n   Progress: ${i + 1}/${providers.length} (${Math.round((i + 1) / providers.length * 100)}%)\n`)
    }
  }

  return results
}

/**
 * Verify seeded data
 */
async function verifySeeding(payload, expectedCount) {
  console.log('\n🔍 Verifying seeded data...')

  const { docs, totalDocs } = await payload.find({
    collection: 'providers',
    limit: 0
  })

  console.log(`   Total providers in database: ${totalDocs}`)
  console.log(`   Expected: ${expectedCount}`)

  if (totalDocs === expectedCount) {
    console.log('   ✅ Count matches!\n')
    return true
  } else {
    console.warn(`   ⚠️  Count mismatch! Expected ${expectedCount}, got ${totalDocs}\n`)
    return false
  }
}

/**
 * Main seeding function
 */
async function seed() {
  console.log('🌱 Starting Database Seeding...\n')

  if (DRY_RUN) {
    console.log('🔬 DRY RUN MODE - No actual changes will be made\n')
  }

  // Load seed data
  console.log('📂 Loading seed data...')
  const seedData = JSON.parse(await fs.readFile(SEED_DATA_FILE, 'utf-8'))
  console.log(`   ✓ Loaded ${seedData.length} providers\n`)

  // Initialize Payload
  const payload = await initPayload()

  try {
    // Purge existing data
    const purgeResult = await purgeProviders(payload)

    // Seed providers
    const seedResults = await seedProviders(payload, seedData)

    // Verify seeding
    if (!DRY_RUN) {
      await verifySeeding(payload, seedResults.created)
    }

    // Final summary
    console.log('📊 Seeding Summary:')
    console.log(`   Total records: ${seedResults.total}`)
    console.log(`   Created: ${seedResults.created}`)
    console.log(`   Failed: ${seedResults.failed}`)

    if (!DRY_RUN) {
      console.log(`   Purged: ${purgeResult.deleted}`)
    }

    if (seedResults.errors.length > 0) {
      console.log(`\n❌ Errors (${seedResults.errors.length}):`)
      seedResults.errors.forEach(({ provider, error }) => {
        console.log(`   - ${provider}: ${error}`)
      })
    }

    if (seedResults.failed === 0) {
      console.log('\n✅ Seeding completed successfully!\n')
    } else {
      console.log(`\n⚠️  Seeding completed with ${seedResults.failed} failures\n`)
    }

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message)
    console.error(error.stack)
    throw error
  } finally {
    // Close database connection
    if (payload?.db?.connection) {
      await payload.db.connection.close()
      console.log('🔌 Database connection closed\n')
    }
  }
}

// Run seeding
seed().catch((error) => {
  console.error('\n💥 Fatal error:', error.message)
  process.exit(1)
})
