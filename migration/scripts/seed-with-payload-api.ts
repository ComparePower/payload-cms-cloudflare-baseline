#!/usr/bin/env tsx
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
import config from '../../src/payload.config.js'
import { resolveContentBlocks } from '../../scripts/migration/lib/resolve-rich-text-data-slugs.js'
import { parseMDXToBlocks } from '../../scripts/migration/lib/mdx-to-payload-blocks.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SEED_DATA_FILE = path.join(__dirname, '../data/seed/providers.json')

// Parse command line args
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SKIP_PURGE = args.includes('--skip-purge')

/**
 * Main seeding function
 */
async function seed() {
  console.log('🌱 Starting Database Seeding (Payload API)...\n')

  if (DRY_RUN) {
    console.log('🔬 DRY RUN MODE - No actual changes will be made\n')
  }

  // Load seed data
  console.log('📂 Loading seed data...')
  const providersData = await fs.readFile(SEED_DATA_FILE, 'utf-8')
  const providers = JSON.parse(providersData)
  console.log(`   ✓ Loaded ${providers.length} providers\n`)

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
      errors: [] as Array<{ provider: string; error: string }>
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
            const parsed = await parseMDXToBlocks(_mdxContent, payload.config)
            cleanData.contentBlocks = parsed.contentBlocks
          }

          // Resolve phone number slugs in contentBlocks to actual relationship IDs
          if (cleanData.contentBlocks && Array.isArray(cleanData.contentBlocks)) {
            console.log(`   🔗 Resolving data instance slugs for: ${provider.title}`)
            cleanData.contentBlocks = await resolveContentBlocks(cleanData.contentBlocks, payload)

            // Apply default values and clean up block fields
            cleanData.contentBlocks = cleanData.contentBlocks.map((block: any) => {
              if (block.blockType === 'providersPhoneTable' || block.blockType === 'popularZipcodes') {
                // Ensure state has default value if missing or empty
                const state = block.fields?.state?.trim() || 'TX'
                return {
                  ...block,
                  fields: {
                    ...block.fields,
                    state,
                  }
                }
              }
              return block
            })

            // DEBUG: Check if inline blocks exist and are properly resolved
            const json = JSON.stringify(cleanData.contentBlocks)
            const hasInlineBlocks = json.includes('"type":"inlineBlock"')
            const hasUnresolvedSlugs = json.includes('_richTextDataSlug')
            const hasResolvedInstance = json.includes('"instance"')

            if (hasInlineBlocks) {
              console.log(`   🔍 DEBUG: Found inline blocks`)
              console.log(`      - Unresolved slugs: ${hasUnresolvedSlugs ? 'YES ⚠️' : 'NO ✓'}`)
              console.log(`      - Resolved instances: ${hasResolvedInstance ? 'YES ✓' : 'NO ⚠️'}`)

              // Save first provider with inline blocks to file for inspection
              if (hasInlineBlocks && !hasUnresolvedSlugs && i === 14) {
                await fs.writeFile(
                  '/tmp/debug-provider-with-inline-blocks.json',
                  JSON.stringify(cleanData, null, 2)
                )
                console.log(`   💾 Saved debug data to /tmp/debug-provider-with-inline-blocks.json`)
              }
            }
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
        } catch (error: any) {
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

  } catch (error: any) {
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
