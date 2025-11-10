#!/usr/bin/env node
/**
 * Retry Failed Provider Migrations
 *
 * Task: T029
 *
 * Re-runs migration for providers that failed during the initial migration.
 * Reads the list of failed providers from PROVIDER-FAILURES.md and attempts
 * to migrate them again.
 *
 * Run:
 *   ./scripts/doppler-run.sh dev pnpm tsx migration/scripts/retry-failed-providers.mjs
 *   ./scripts/doppler-run.sh dev pnpm tsx migration/scripts/retry-failed-providers.mjs --dry-run
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../../src/payload.config.ts'
import { parseMdxFile } from '../../scripts/migration/lib/mdx-parser.ts'
import { mapProviderFields } from '../../scripts/migration/lib/provider-field-mapper.ts'
import { convertMdxToLexical } from '../../scripts/migration/lib/mdx-to-lexical-converter.ts'
import { resolveRichTextDataSlugs } from '../../scripts/migration/lib/resolve-rich-text-data-slugs.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASTRO_PROVIDERS_DIR =
  '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/providers'
const FAILURES_FILE = path.join(__dirname, '../PROVIDER-FAILURES.md')

// Parse command line args
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

/**
 * Parse failed provider filenames from PROVIDER-FAILURES.md
 */
async function parseFailedProviders() {
  try {
    const content = await fs.readFile(FAILURES_FILE, 'utf-8')

    // Extract filenames from "### N. filename" pattern
    const fileMatches = content.matchAll(/^### \d+\. (.+)$/gm)
    const files = []

    for (const match of fileMatches) {
      files.push(match[1])
    }

    return files
  } catch (error) {
    console.error('❌ Could not read PROVIDER-FAILURES.md:', error.message)
    console.error('   Make sure to run the main migration script first')
    return []
  }
}

/**
 * Find full path for a provider file
 */
async function findProviderFile(fileName) {
  const stack = [ASTRO_PROVIDERS_DIR]

  while (stack.length > 0) {
    const dir = stack.pop()
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        stack.push(fullPath)
      } else if (entry.isFile() && entry.name === fileName) {
        // Check if this matches the relative path pattern
        const relativePath = path.relative(ASTRO_PROVIDERS_DIR, fullPath)
        if (relativePath === fileName || path.basename(fullPath) === fileName) {
          return fullPath
        }
      }
    }
  }

  return null
}

/**
 * Main retry function
 */
async function retry() {
  console.log('🔄 Retrying Failed Provider Migrations\n')

  if (DRY_RUN) {
    console.log('🔬 DRY RUN MODE - No actual changes will be made\n')
  }

  // Parse failed providers
  console.log('📂 Reading failed providers from PROVIDER-FAILURES.md...')
  const failedFiles = await parseFailedProviders()

  if (failedFiles.length === 0) {
    console.log('   ✅ No failed providers found - nothing to retry!\n')
    process.exit(0)
  }

  console.log(`   Found ${failedFiles.length} failed provider(s):\n`)
  failedFiles.forEach((file, i) => {
    console.log(`   ${i + 1}. ${file}`)
  })
  console.log()

  // Initialize Payload
  console.log('🔌 Initializing Payload...')
  const payload = await getPayload({ config })
  console.log('   ✓ Payload initialized\n')

  try {
    // Retry each failed provider
    console.log(`📥 Retrying ${failedFiles.length} provider(s)...\n`)

    const results = {
      total: failedFiles.length,
      success: 0,
      failed: 0,
      errors: [],
    }

    for (let i = 0; i < failedFiles.length; i++) {
      const fileName = failedFiles[i]
      const progress = `[${i + 1}/${failedFiles.length}]`

      console.log(`${progress} Processing: ${fileName}`)

      try {
        // Find full file path
        const filePath = await findProviderFile(fileName)
        if (!filePath) {
          throw new Error(`File not found: ${fileName}`)
        }

        if (DRY_RUN) {
          console.log(`   [DRY RUN] Would process: ${filePath}`)
          results.success++
          continue
        }

        // Step 1: Parse MDX
        const parsed = await parseMdxFile(filePath)
        if (parsed.errors.length > 0) {
          throw new Error(`Parse errors: ${parsed.errors.join(', ')}`)
        }

        // Step 2: Map frontmatter to Payload fields
        const mapped = await mapProviderFields(parsed.frontmatter, filePath, ASTRO_PROVIDERS_DIR)

        // Step 3: Convert content to Lexical
        const lexical = await convertMdxToLexical(parsed.content)

        // Step 4: Resolve inline block slugs
        const resolved = await resolveRichTextDataSlugs(lexical, payload)

        // Step 5: Build contentBlocks
        const data = {
          ...mapped,
          contentBlocks: [
            {
              blockType: 'richText',
              content: resolved,
            },
          ],
        }

        // Truncate SEO meta description to 160 chars max
        if (data.seo?.metaDescription && data.seo.metaDescription.length > 160) {
          data.seo.metaDescription = data.seo.metaDescription.substring(0, 157) + '...'
        }

        // Create using Payload API
        const created = await payload.create({
          collection: 'providers',
          data,
        })

        results.success++
        console.log(`   ✓ Success: ${mapped.title}`)
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`)
        results.failed++
        results.errors.push({
          file: fileName,
          error: error.message,
        })
      }
      console.log()
    }

    // Summary
    console.log('📊 Retry Summary:\n')
    console.log(`   Total: ${results.total}`)
    console.log(`   Success: ${results.success}`)
    console.log(`   Failed: ${results.failed}`)

    if (results.failed > 0) {
      console.log('\n❌ Still failing:\n')
      results.errors.forEach(({ file, error }) => {
        console.log(`   - ${file}: ${error}`)
      })
      console.log()
    }

    if (results.success === results.total) {
      console.log('\n✅ All retried providers migrated successfully!\n')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some providers still failing - manual intervention required\n')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Retry failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

retry()
