#!/usr/bin/env tsx
/**
 * Import Abilene Electricity Rate
 *
 * Tests the complete migration pipeline for the Abilene electricity-rate:
 * 1. Parse MDX file from Astro project
 * 2. Map frontmatter fields to Payload structure
 * 3. Convert MDX content to Lexical JSON blocks
 * 4. Upload images to R2 via Payload media collection
 * 5. Resolve inline blocks and create electricity-rate entry
 *
 * This validates the pipeline works with Cloudflare D1/R2 before processing all 896 files.
 */

import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

// Import migration utilities
import { parseMdxFile } from './lib/mdx-parser-v2.js'
import { mapRateFields, validateRateData } from './lib/rate-field-mapper.js'
import { parseMDXToBlocks } from './lib/mdx-to-payload-blocks.js'
import { resolveContentBlocks } from './lib/resolve-rich-text-data-slugs.js'
import { uploadImageToPayload } from './lib/payload-media-uploader.js'

const SOURCE_DIR =
  '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/electricity-rates'

// Test with Abilene (the file we have a Playwright test for)
const TEST_FILE =
  '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/electricity-rates/texas/abilene-electricity-rates-energy-plans/index.mdx'

async function importAbilene() {
  console.log('🔍 Importing Abilene Electricity Rate\n')
  console.log(`Source file: ${path.relative(SOURCE_DIR, TEST_FILE)}\n`)

  let payload: any

  try {
    // Initialize Payload
    console.log('Step 1: Initializing Payload with Cloudflare D1/R2...')
    payload = await getPayload({ config })
    console.log('  ✅ Payload initialized')
    console.log()

    // Step 2: Parse MDX file
    console.log('Step 2: Parsing MDX file...')
    const { frontmatter, content: mdxContent } = await parseMdxFile(TEST_FILE)
    console.log('  ✅ Frontmatter parsed')
    console.log('  Fields:', Object.keys(frontmatter).join(', '))
    console.log('  Content length:', mdxContent.length, 'chars')
    console.log()

    // Step 3: Map frontmatter to Payload structure
    console.log('Step 3: Mapping fields to Payload structure...')
    const rateData = await mapRateFields(frontmatter, TEST_FILE, SOURCE_DIR, mdxContent)
    console.log('  ✅ Fields mapped')
    console.log('  Title:', rateData.title)
    console.log('  Slug:', rateData.slug)
    console.log('  City:', rateData.cityName)
    console.log('  Status:', rateData.status)
    console.log('  Published:', rateData.publishedAt)
    console.log()

    // Validate required fields
    const missing = validateRateData(rateData)
    if (missing.length > 0) {
      console.error('  ❌ Missing required fields:', missing)
      process.exit(1)
    }
    console.log('  ✅ All required fields present')
    console.log()

    // Step 4: Upload hero image to R2
    console.log('Step 4: Uploading hero image to R2...')
    const heroImagePath = path.join(path.dirname(TEST_FILE), 'heroImage.jpg')
    try {
      await fs.access(heroImagePath)
      const uploadResult = await uploadImageToPayload(
        payload,
        {
          assetId: `hero-${rateData.slug}`,
          filePath: heroImagePath,
          alt: `${rateData.cityName} Electricity Rates Hero Image`,
          caption: undefined
        }
      )
      console.log('  ✅ Hero image uploaded to R2')
      console.log('  Media ID:', uploadResult.mediaId)
      console.log('  Asset ID:', uploadResult.assetId)
      console.log('  URL:', uploadResult.url)
      console.log()
    } catch (error: any) {
      console.warn('  ⚠️  Hero image not found, skipping:', error.message)
      console.log()
    }

    // Step 5: Convert MDX content to Lexical blocks
    console.log('Step 5: Converting MDX to Lexical JSON...')
    const parsed = await parseMDXToBlocks(mdxContent)
    const contentBlocks = parsed.contentBlocks
    console.log('  ✅ Lexical blocks created')
    console.log('  Blocks count:', contentBlocks?.length || 0)
    console.log()

    // Step 6: Upload inline images referenced in content
    console.log('Step 6: Processing inline images...')
    // TODO: Extract image references from AssetManager blocks and upload them
    console.log('  ⚠️  Inline image upload not yet implemented')
    console.log()

    // Step 7: Resolve inline blocks in content
    console.log('Step 7: Resolving inline blocks...')
    const resolvedBlocks = await resolveContentBlocks(contentBlocks)
    console.log('  ✅ Inline blocks resolved')
    console.log()

    // Step 8: Build final rate object
    const finalRate = {
      ...rateData,
      contentBlocks: resolvedBlocks,
    }

    // Remove temporary field
    delete finalRate._mdxContent

    // Step 9: Check if entry already exists
    console.log('Step 8: Checking for existing entry...')
    const existing = await payload.find({
      collection: 'electricity-rates',
      where: {
        slug: {
          equals: finalRate.slug,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log('  ⚠️  Entry already exists with slug:', finalRate.slug)
      console.log('  Existing ID:', existing.docs[0].id)
      console.log('  Would you like to update it? (Not implemented yet)')
      console.log()
    } else {
      console.log('  ✅ No existing entry found, ready to create')
      console.log()
    }

    // Step 9: Create electricity-rate entry via Payload API
    console.log('Step 9: Creating electricity-rate entry...')
    const created = await payload.create({
      collection: 'electricity-rates',
      data: finalRate,
    })
    console.log('  ✅ Entry created successfully!')
    console.log('  ID:', created.id)
    console.log('  Slug:', created.slug)
    console.log()

    // Summary
    console.log('📊 Summary:')
    console.log(`  Title: ${created.title}`)
    console.log(`  Slug: ${created.slug}`)
    console.log(`  City: ${created.cityName}`)
    console.log(`  Status: ${created.status}`)
    console.log(`  Content blocks: ${created.contentBlocks?.length || 0}`)
    console.log(`  SEO title: ${created.seo?.title || 'N/A'}`)
    console.log(`  Hero line 1: ${created.hero?.headingLine1 || 'N/A'}`)
    console.log()

    console.log('✅ Abilene import COMPLETED successfully!')
    console.log(`\n🌐 View in admin: http://localhost:3003/admin/collections/electricity-rates/${created.id}`)
  } catch (error: any) {
    console.error('❌ Import FAILED:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    // Close Payload connection
    if (payload) {
      // Payload doesn't have a close method, just exit
    }
  }
}

importAbilene()
