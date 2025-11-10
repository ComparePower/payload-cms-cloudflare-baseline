#!/usr/bin/env node
/**
 * Seed RichTextDataInstances Collection
 *
 * Populates the richTextDataInstances collection with phone numbers,
 * dynamic values, and other reusable inline data.
 *
 * Uses Payload local API for proper data handling:
 * - Automatically handles metadata (_deleted, createdAt, updatedAt)
 * - Runs validation
 * - Manages indexes (slug uniqueness)
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../../src/payload.config.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED_DATA_FILE = path.join(__dirname, '../data/seed/rich-text-data-instances.json')

// Parse command line args
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SKIP_PURGE = args.includes('--skip-purge')

/**
 * Main seeding function
 */
async function seed() {
  console.log('🌱 Starting RichTextDataInstances Seeding...\n')

  if (DRY_RUN) {
    console.log('🔬 DRY RUN MODE - No actual changes will be made\n')
  }

  // Load seed data
  console.log('📂 Loading seed data...')
  const instances = JSON.parse(await fs.readFile(SEED_DATA_FILE, 'utf-8'))
  console.log(`   ✓ Loaded ${instances.length} data instances\n`)
  console.log(`   Categories: ${[...new Set(instances.map(i => i.category))].join(', ')}\n`)

  // Initialize Payload
  console.log('🔌 Initializing Payload...')
  const payload = await getPayload({ config })
  console.log('   ✓ Payload initialized\n')

  try {
    // Purge existing instances
    if (!SKIP_PURGE) {
      console.log('🗑️  Purging existing data instances...')

      if (DRY_RUN) {
        const { totalDocs } = await payload.find({
          collection: 'richTextDataInstances',
          limit: 0,
        })
        console.log(`   [DRY RUN] Would delete ${totalDocs} instances\n`)
      } else {
        // Delete all instances using Payload API
        const { docs } = await payload.find({
          collection: 'richTextDataInstances',
          limit: 1000, // Get all
        })

        let deleted = 0
        for (const doc of docs) {
          await payload.delete({
            collection: 'richTextDataInstances',
            id: doc.id,
          })
          deleted++
        }
        console.log(`   ✓ Deleted ${deleted} instances\n`)
      }
    } else {
      console.log('⏭️  Skipping purge (--skip-purge flag)\n')
    }

    // Seed instances
    console.log(`📥 Seeding ${instances.length} data instances...\n`)

    const results = {
      total: instances.length,
      created: 0,
      failed: 0,
      errors: [],
      byCategory: {}
    }

    if (DRY_RUN) {
      console.log('   [DRY RUN] Would create all instances\n')
      results.created = instances.length
    } else {
      // Create instances one by one
      for (let i = 0; i < instances.length; i++) {
        const instance = instances[i]
        const progress = `[${i + 1}/${instances.length}]`

        try {
          // Create using Payload API - it handles all metadata automatically
          const created = await payload.create({
            collection: 'richTextDataInstances',
            data: instance,
          })

          results.created++

          // Track by category
          if (!results.byCategory[instance.category]) {
            results.byCategory[instance.category] = 0
          }
          results.byCategory[instance.category]++

          console.log(`   ${progress} ✓ Created: ${instance.name} (${instance.category})`)
        } catch (error) {
          console.error(`   ${progress} ❌ Failed: ${instance.name}`)
          console.error(`      Error: ${error.message}`)
          results.failed++
          results.errors.push({
            instance: instance.name,
            error: error.message
          })
        }
      }
    }

    console.log('\n✅ Seeding complete!\n')

    // Verify
    if (!DRY_RUN) {
      console.log('🔍 Verifying...')
      const { totalDocs } = await payload.find({
        collection: 'richTextDataInstances',
        limit: 0,
      })
      console.log(`   Total instances in database: ${totalDocs}`)
      console.log(`   Expected: ${results.created}`)

      if (totalDocs === results.created) {
        console.log('   ✅ Verification passed!\n')
      } else {
        console.warn(`   ⚠️  Count mismatch!`)
        console.warn(`   Database has ${totalDocs}, expected ${results.created}\n`)
      }

      // Verify by category
      console.log('📊 Breakdown by category:')
      for (const [category, count] of Object.entries(results.byCategory)) {
        const { totalDocs: categoryCount } = await payload.find({
          collection: 'richTextDataInstances',
          where: {
            category: { equals: category }
          },
          limit: 0,
        })
        console.log(`   ${category}: ${categoryCount} (expected ${count})`)
      }
      console.log()
    }

    // Summary
    console.log('📊 Summary:')
    console.log(`   Total: ${results.total}`)
    console.log(`   Created: ${results.created}`)
    console.log(`   Failed: ${results.failed}`)

    if (results.errors.length > 0) {
      console.log(`\n❌ Errors:`)
      results.errors.forEach(({ instance, error }) => {
        console.log(`   - ${instance}: ${error}`)
      })
    }

    console.log()

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message)
    console.error(error.stack)
    throw error
  }
}

// Run seeding
seed()
  .then(() => {
    console.log('✅ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message)
    process.exit(1)
  })
