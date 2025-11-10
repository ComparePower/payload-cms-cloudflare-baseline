#!/usr/bin/env node
/**
 * Proper Database Seeding Using Payload Local API
 *
 * Uses payload.create() instead of direct MongoDB inserts
 * - Automatically handles all metadata (_deleted, createdAt, updatedAt)
 * - Runs validation
 * - Manages relationships properly
 * - Works with Payload's hooks and schema
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../../src/payload.config.ts'
import { resolveContentBlocks } from '../../scripts/migration/lib/resolve-rich-text-data-slugs.ts'
import { parseMDXToBlocks } from '../../scripts/migration/lib/mdx-to-payload-blocks.ts'
import { markMigrationInProgress, markMigrationBlocked, markMigrationSuccess } from '../../src/lib/migration-status.ts'
import { generateTodoFile } from '../../scripts/migration/lib/auto-generate-todo.ts'
import { autoMergeComponents } from '../../scripts/migration/lib/auto-merge-registry.ts'
import { displayBlockingError } from '../../scripts/migration/lib/display-blocking-error.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED_DATA_FILE = path.join(__dirname, '../data/seed/providers.json')

// Parse command line args
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SKIP_PURGE = args.includes('--skip-purge')
const IGNORE_UNHANDLED = args.includes('--ignore-unhandled')

/**
 * Main seeding function
 */
async function seed() {
  console.log('🌱 Starting Database Seeding (Payload API)...\n')

  if (DRY_RUN) {
    console.log('🔬 DRY RUN MODE - No actual changes will be made\n')
  }

  // Mark migration as in progress
  markMigrationInProgress()

  // Load seed data
  console.log('📂 Loading seed data...')
  const providers = JSON.parse(await fs.readFile(SEED_DATA_FILE, 'utf-8'))
  console.log(`   ✓ Loaded ${providers.length} providers\n`)

  // PRE-FLIGHT VALIDATION: Check for unhandled components
  if (!IGNORE_UNHANDLED) {
    console.log('🔍 Pre-flight validation: Checking for unhandled components...\n')

    const unhandledComponentsMap = new Map()

    // Parse each provider's MDX content with collectUnhandled=true
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i]
      const progress = `[${i + 1}/${providers.length}]`

      if (provider._mdxContent) {
        try {
          const parsed = await parseMDXToBlocks(provider._mdxContent, undefined, undefined, provider.title, {
            collectUnhandled: true
          })

          // Aggregate unhandled components
          for (const component of parsed.unhandledComponents) {
            if (unhandledComponentsMap.has(component.name)) {
              const existing = unhandledComponentsMap.get(component.name)
              existing.usageCount += component.usageCount
            } else {
              unhandledComponentsMap.set(component.name, component)
            }
          }

          // Silent success - only log failures
        } catch (error) {
          console.error(`   ${progress} ❌ Parse error: ${provider.title}`)
          console.error(`      ${error.message}`)
        }
      }
    }

    // If unhandled components found, FAIL immediately
    if (unhandledComponentsMap.size > 0) {
      const components = Array.from(unhandledComponentsMap.values())
        .sort((a, b) => b.usageCount - a.usageCount)

      // Mark migration as blocked
      markMigrationBlocked(components)

      // Generate TODO file
      await generateTodoFile(components)

      // Auto-merge into registry
      await autoMergeComponents(components)

      // Display error message
      displayBlockingError(components)

      // Exit with error code
      process.exit(1)
    }

    console.log('   ✓ No unhandled components detected\n')
  } else {
    console.log('⏭️  Skipping unhandled component check (--ignore-unhandled flag)\n')
  }

  // Initialize Payload
  console.log('🔌 Initializing Payload...')
  const payload = await getPayload({ config })
  console.log('   ✓ Payload initialized\n')

  try {
    // Purge existing providers
    if (!SKIP_PURGE) {
      console.log('🗑️  Purging existing providers...')

      if (DRY_RUN) {
        const { totalDocs } = await payload.find({
          collection: 'providers',
          limit: 0,
        })
        console.log(`   [DRY RUN] Would delete ${totalDocs} providers\n`)
      } else {
        // Delete all providers using Payload API
        const { docs } = await payload.find({
          collection: 'providers',
          limit: 1000, // Get all
        })

        let deleted = 0
        for (const doc of docs) {
          await payload.delete({
            collection: 'providers',
            id: doc.id,
          })
          deleted++
        }
        console.log(`   ✓ Deleted ${deleted} providers\n`)
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
      console.log('   [DRY RUN] Would create all providers\n')
      results.created = providers.length
    } else {
      // Create providers one by one
      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i]
        const progress = `[${i + 1}/${providers.length}]`

        try {
          // Remove internal fields used for processing
          const { _mdxContent, ...cleanData } = provider

          // Parse MDX content to blocks
          if (_mdxContent) {
            console.log(`   📝 Parsing MDX content for: ${provider.title}`)
            const parsed = await parseMDXToBlocks(
              _mdxContent,
              payload.config,
              payload,
              undefined // filePath (not needed for providers)
            )
            cleanData.contentBlocks = parsed.contentBlocks
          }

          // Resolve phone number slugs in contentBlocks to actual relationship IDs
          if (cleanData.contentBlocks && Array.isArray(cleanData.contentBlocks)) {
            cleanData.contentBlocks = await resolveContentBlocks(cleanData.contentBlocks, payload)
          }

          // Truncate SEO meta description to 160 chars max
          if (cleanData.seo?.metaDescription && cleanData.seo.metaDescription.length > 160) {
            cleanData.seo.metaDescription = cleanData.seo.metaDescription.substring(0, 157) + '...'
          }

          // Create using Payload API - it handles all metadata automatically
          const created = await payload.create({
            collection: 'providers',
            data: cleanData,
          })

          results.created++
          console.log(`   ${progress} ✓ Created: ${provider.title}`)
        } catch (error) {
          console.error(`   ${progress} ❌ Failed: ${provider.title}`)
          console.error(`      Error: ${error.message}`)
          results.failed++
          results.errors.push({
            provider: provider.title,
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
        collection: 'providers',
        limit: 0,
      })
      console.log(`   Total providers in database: ${totalDocs}`)
      console.log(`   Expected: ${results.created}`)

      if (totalDocs === results.created) {
        console.log('   ✅ Verification passed!\n')
      } else {
        console.warn(`   ⚠️  Count mismatch!`)
        console.warn(`   Database has ${totalDocs}, expected ${results.created}\n`)
      }
    }

    // Summary
    console.log('📊 Summary:')
    console.log(`   Total: ${results.total}`)
    console.log(`   Created: ${results.created}`)
    console.log(`   Failed: ${results.failed}`)

    if (results.errors.length > 0) {
      console.log(`\n❌ Errors:`)
      results.errors.forEach(({ provider, error }) => {
        console.log(`   - ${provider}: ${error}`)
      })
    }

    console.log()

    // Mark migration as successful
    if (!DRY_RUN && results.failed === 0) {
      markMigrationSuccess()
    }

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
