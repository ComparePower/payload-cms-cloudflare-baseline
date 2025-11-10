#!/usr/bin/env node
/**
 * Electricity Rates Migration Using Payload Local API
 *
 * Task: T037 - T038
 *
 * Migrates 896 electricity-rate MDX files to Payload CMS
 * Uses payload.create() instead of direct MongoDB inserts
 * - Automatically handles all metadata (_deleted, createdAt, updatedDate)
 * - Runs validation
 * - Manages relationships properly
 * - Works with Payload's hooks and schema
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import matter from 'gray-matter'
import config from '../../src/payload.config.ts'
import { mapRateFields, validateRateData } from '../../scripts/migration/lib/rate-field-mapper.ts'
import { parseMDXToBlocks } from '../../scripts/migration/lib/mdx-to-payload-blocks.ts'
import { resolveContentBlocks } from '../../scripts/migration/lib/resolve-rich-text-data-slugs.ts'
import { markMigrationInProgress, markMigrationBlocked, markMigrationSuccess } from '../../src/lib/migration-status.ts'
import { generateTodoFile } from '../../scripts/migration/lib/auto-generate-todo.ts'
import { autoMergeComponents } from '../../scripts/migration/lib/auto-merge-registry.ts'
import { displayBlockingError } from '../../scripts/migration/lib/display-blocking-error.ts'
import { RATE_KNOWN_FIELDS, validateFrontmatterFields, displayUnmappedFieldsError } from '../../scripts/migration/lib/frontmatter-field-registry.ts'
import { analyzeUnmappedFields } from '../../scripts/migration/lib/field-type-detector.ts'
import { generateCodeSnippets, suggestPayloadFieldName, buildFieldConfig, formatSnippetsForDisplay } from '../../scripts/migration/lib/code-generator.ts'
import { updateAllFiles, formatUpdateResults } from '../../scripts/migration/lib/file-writer.ts'
import { interactiveComponentMapper } from './lib/inquirer-component-mapper.mjs'
import { interactiveFieldMapper } from './lib/inquirer-field-mapper.mjs'
import { runValidationLoop } from './lib/validation-loop.mjs'
import chalk from 'chalk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/electricity-rates'

// Parse command line args
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SKIP_PURGE = args.includes('--skip-purge')
const IGNORE_UNHANDLED = args.includes('--ignore-unhandled')
const IGNORE_UNMAPPED_FIELDS = args.includes('--ignore-unmapped-fields')
const INTERACTIVE = false // Interactive prompts don't work through doppler wrapper - validation will report errors and exit
const LIMIT = args.find(a => a.startsWith('--limit='))?.split('=')[1]
const limitCount = LIMIT ? parseInt(LIMIT, 10) : null
const SLUG_FILTER = args.find(a => a.startsWith('--slug='))?.split('=')[1]

/**
 * Find all MDX files recursively
 */
async function findMDXFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await findMDXFiles(fullPath, files)
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Main migration function
 */
async function migrateElectricityRates() {
  console.log('🌱 Starting Electricity Rates Migration (Payload API)...\n')

  if (DRY_RUN) {
    console.log('🔬 DRY RUN MODE - No actual changes will be made\n')
  }

  const startTime = Date.now()

  // Find all MDX files
  console.log('📂 Scanning for electricity-rate MDX files...')
  let mdxFiles = await findMDXFiles(SOURCE_DIR)
  console.log(`   ✓ Found ${mdxFiles.length} MDX files\n`)

  // Filter by slug if requested
  if (SLUG_FILTER) {
    const { generateUniqueSlug } = await import('../../scripts/migration/lib/slug-generator.js')
    mdxFiles = mdxFiles.filter(f => {
      const fileSlug = generateUniqueSlug(f, SOURCE_DIR)
      // Match if generated slug equals filter OR if file path contains filter (partial match)
      return fileSlug === SLUG_FILTER || f.includes(SLUG_FILTER)
    })
    console.log(`   🔍 Filtering by slug: "${SLUG_FILTER}" - ${mdxFiles.length} files match\n`)
  }

  // Limit if requested
  if (limitCount) {
    mdxFiles = mdxFiles.slice(0, limitCount)
    console.log(`   ⚠️  Limiting to ${limitCount} files for testing\n`)
  }

  // Mark migration as in progress
  markMigrationInProgress()

  // Run validation loop with interactive configuration
  const validationPassed = await runValidationLoop(
    mdxFiles,
    SOURCE_DIR,
    'electricity-rates',
    {
      interactive: INTERACTIVE,
      ignoreUnmappedFields: IGNORE_UNMAPPED_FIELDS,
      ignoreUnhandled: IGNORE_UNHANDLED,
      interactiveFieldMapper,
      interactiveComponentMapper,
    }
  )

  if (!validationPassed) {
    console.log(chalk.red('\n❌ Validation failed. Please fix issues manually and try again.\n'))
    process.exit(1)
  }

  // Initialize Payload
  console.log('🔌 Initializing Payload...')
  const payload = await getPayload({ config })
  console.log('   ✓ Payload initialized\n')

  try {
    // Purge existing electricity-rates
    if (!SKIP_PURGE) {
      console.log('🗑️  Purging existing electricity-rates...')

      if (DRY_RUN) {
        const { totalDocs } = await payload.find({
          collection: 'electricity-rates',
          limit: 0,
        })
        console.log(`   [DRY RUN] Would delete ${totalDocs} electricity-rates\n`)
      } else {
        // Delete all electricity-rates using Payload API
        const { docs } = await payload.find({
          collection: 'electricity-rates',
          limit: 10000, // Get all
        })

        let deleted = 0
        for (const doc of docs) {
          await payload.delete({
            collection: 'electricity-rates',
            id: doc.id,
          })
          deleted++
        }
        console.log(`   ✓ Deleted ${deleted} electricity-rates\n`)
      }
    } else {
      console.log('⏭️  Skipping purge (--skip-purge flag)\n')
    }

    // Migration tracking
    const results = {
      total: mdxFiles.length,
      created: 0,
      failed: 0,
      errors: []
    }

    console.log(`📥 Migrating ${mdxFiles.length} electricity rates...\n`)

    if (DRY_RUN) {
      console.log('   [DRY RUN] Would migrate all rates\n')
      results.created = mdxFiles.length
    } else {
      // Process each MDX file
      for (let i = 0; i < mdxFiles.length; i++) {
        const filePath = mdxFiles[i]
        const progress = `[${i + 1}/${mdxFiles.length}]`
        const relativePath = path.relative(SOURCE_DIR, filePath)

        try {
          // Step 1: Parse MDX file
          const fileContent = await fs.readFile(filePath, 'utf-8')
          const { data: frontmatter, content: mdxContent } = matter(fileContent)

          // Step 2: Map frontmatter to Payload structure
          const rateData = await mapRateFields(frontmatter, filePath, SOURCE_DIR, mdxContent)

          // Validate required fields
          const missing = validateRateData(rateData)
          if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`)
          }

          // Step 3: Remove temporary MDX content field
          const { _mdxContent, ...cleanData } = rateData

          // Step 4: Convert MDX content to Lexical blocks
          if (_mdxContent) {
            const parsed = await parseMDXToBlocks(
              _mdxContent,
              payload.config,
              payload,
              filePath
            )
            cleanData.contentBlocks = parsed.contentBlocks
          }

          // Step 5: Resolve inline blocks (phone numbers, data instances)
          if (cleanData.contentBlocks && Array.isArray(cleanData.contentBlocks)) {
            cleanData.contentBlocks = await resolveContentBlocks(cleanData.contentBlocks, payload)
          }

          // Step 6: Truncate SEO meta description to max length (500 chars for rates)
          if (cleanData.seo?.metaDescription && cleanData.seo.metaDescription.length > 500) {
            cleanData.seo.metaDescription = cleanData.seo.metaDescription.substring(0, 497) + '...'
          }

          // Step 7: Create using Payload API
          const created = await payload.create({
            collection: 'electricity-rates',
            data: cleanData,
          })

          results.created++

          // Progress reporting every 10 records
          if ((i + 1) % 10 === 0 || i === mdxFiles.length - 1) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
            const avgTime = (elapsed / (i + 1)).toFixed(2)
            console.log(`   ${progress} ✓ ${rateData.title} | ${elapsed}s elapsed | ${avgTime}s/file`)
          }
        } catch (error) {
          console.error(`   ${progress} ❌ Failed: ${relativePath}`)
          console.error(`      Error: ${error.message}`)
          results.failed++
          results.errors.push({
            file: relativePath,
            error: error.message
          })
        }
      }
    }

    console.log('\n✅ Migration complete!\n')

    // Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
    const avgTime = (totalTime / results.total).toFixed(2)

    console.log('📊 Migration Summary:')
    console.log(`   Total files: ${results.total}`)
    console.log(`   Successfully created: ${results.created}`)
    console.log(`   Failed: ${results.failed}`)
    console.log(`   Success rate: ${((results.created / results.total) * 100).toFixed(2)}%`)
    console.log(`   Total time: ${totalTime}s`)
    console.log(`   Average time per file: ${avgTime}s`)
    console.log()

    // Verify
    if (!DRY_RUN) {
      console.log('🔍 Verifying...')
      const { totalDocs } = await payload.find({
        collection: 'electricity-rates',
        limit: 0,
      })
      console.log(`   Total electricity rates in database: ${totalDocs}`)
      console.log(`   Expected: ${results.created}`)
      console.log()

      if (totalDocs === results.created) {
        console.log('✅ Verification PASSED - counts match!\n')
      } else {
        console.log('⚠️  Verification WARNING - counts do not match\n')
      }
    }

    // Report failures
    if (results.failed > 0) {
      console.log('❌ Failed migrations:\n')
      results.errors.forEach(({ file, error }) => {
        console.log(`   - ${file}`)
        console.log(`     Error: ${error}`)
      })
      console.log()
    }

    // Mark migration as successful if no failures
    if (!DRY_RUN && results.failed === 0) {
      markMigrationSuccess()
    }
  } finally {
    // Destroy payload connection
    await payload.db.destroy()
  }
}

// Run migration
migrateElectricityRates().catch((error) => {
  console.error('💥 Migration failed:', error)
  process.exit(1)
})
