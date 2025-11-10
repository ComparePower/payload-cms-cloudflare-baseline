#!/usr/bin/env node
/**
 * Simple Database Seeding
 *
 * Direct MongoDB seeding without Payload Local API:
 * - Connects directly to MongoDB
 * - PURGES existing providers
 * - Seeds from prepared JSON
 * - Fast and simple
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { MongoClient } from 'mongodb'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED_DATA_FILE = path.join(__dirname, '../data/seed/providers.json')

// Get MongoDB connection string from environment
const MONGO_URI = process.env.MONGO_DB_CONN_STRING

if (!MONGO_URI) {
  console.error('❌ MONGO_DB_CONN_STRING environment variable not set')
  console.error('   Run with: ./scripts/doppler-run.sh dev node migration/scripts/seed-database-simple.mjs')
  process.exit(1)
}

// Parse command line args
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SKIP_PURGE = args.includes('--skip-purge')

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
  const providers = JSON.parse(await fs.readFile(SEED_DATA_FILE, 'utf-8'))
  console.log(`   ✓ Loaded ${providers.length} providers\n`)

  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...')
  const client = new MongoClient(MONGO_URI)

  try {
    await client.connect()
    console.log('   ✓ Connected\n')

    const db = client.db()
    const providersCollection = db.collection('providers')

    // Purge existing providers
    if (!SKIP_PURGE) {
      console.log('🗑️  Purging existing providers...')

      if (DRY_RUN) {
        const count = await providersCollection.countDocuments()
        console.log(`   [DRY RUN] Would delete ${count} providers\n`)
      } else {
        const result = await providersCollection.deleteMany({})
        console.log(`   ✓ Deleted ${result.deletedCount} providers\n`)
      }
    } else {
      console.log('⏭️  Skipping purge (--skip-purge flag)\n')
    }

    // Seed providers
    console.log(`📥 Seeding ${providers.length} providers...\n`)

    const results = {
      total: providers.length,
      created: 0,
      failed: 0,
      errors: []
    }

    if (DRY_RUN) {
      console.log('   [DRY RUN] Would insert all providers\n')
      results.created = providers.length
    } else {
      // Insert in batches for better performance
      const BATCH_SIZE = 10
      for (let i = 0; i < providers.length; i += BATCH_SIZE) {
        const batch = providers.slice(i, i + BATCH_SIZE)
        const progress = `[${Math.min(i + BATCH_SIZE, providers.length)}/${providers.length}]`

        try {
          // Add Payload required metadata fields
          const now = new Date().toISOString()
          const docs = batch.map(provider => ({
            ...provider,
            _deleted: false,              // CRITICAL: Soft-deletion flag
            createdAt: now,
            updatedAt: now
          }))

          const result = await providersCollection.insertMany(docs, { ordered: false })
          results.created += result.insertedCount

          console.log(`   ${progress} ✓ Inserted batch of ${result.insertedCount}`)
        } catch (error) {
          console.error(`   ${progress} ❌ Batch failed: ${error.message}`)
          results.failed += batch.length
          results.errors.push({
            batch: `${i}-${i + BATCH_SIZE}`,
            error: error.message
          })
        }
      }
    }

    console.log('\n✅ Seeding complete!\n')

    // Verify
    if (!DRY_RUN) {
      console.log('🔍 Verifying...')
      const count = await providersCollection.countDocuments()
      console.log(`   Total providers in database: ${count}`)
      console.log(`   Expected: ${results.created}`)

      if (count === results.created) {
        console.log('   ✅ Verification passed!\n')
      } else {
        console.warn(`   ⚠️  Count mismatch!\n`)
      }
    }

    // Summary
    console.log('📊 Summary:')
    console.log(`   Total: ${results.total}`)
    console.log(`   Created: ${results.created}`)
    console.log(`   Failed: ${results.failed}`)

    if (results.errors.length > 0) {
      console.log(`\n❌ Errors:`)
      results.errors.forEach(({ batch, error }) => {
        console.log(`   - Batch ${batch}: ${error}`)
      })
    }

    console.log()

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message)
    console.error(error.stack)
    throw error
  } finally {
    await client.close()
    console.log('🔌 Database connection closed\n')
  }
}

// Run seeding
seed().catch((error) => {
  console.error('\n💥 Fatal error:', error.message)
  process.exit(1)
})
