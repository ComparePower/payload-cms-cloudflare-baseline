#!/usr/bin/env tsx
/**
 * Test Rate Migration - Single File
 *
 * Task: T035
 *
 * Tests the complete migration pipeline for ONE electricity-rate file:
 * 1. Parse MDX file
 * 2. Map frontmatter fields to Payload structure
 * 3. Convert MDX content to Lexical JSON
 * 4. Resolve inline blocks
 * 5. Verify output structure
 *
 * This validates the pipeline before processing all 896 files.
 */

import fs from 'fs/promises'
import path from 'path'

// Import migration utilities
import { parseMdxFile } from './lib/mdx-parser.js'
import { mapRateFields, validateRateData } from './lib/rate-field-mapper.js'
import { parseMDXToBlocks } from './lib/mdx-to-payload-blocks.js'
import { resolveContentBlocks } from './lib/resolve-rich-text-data-slugs.js'

const SOURCE_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/electricity-rates'

// Test with Point, Texas (first clean file we found)
const TEST_FILE = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/electricity-rates/texas/point-electricity-rates-energy-plans/index.mdx'

async function testSingleRate() {
  console.log('🔍 Testing Rate Migration - Single File\n')
  console.log(`Test file: ${path.relative(SOURCE_DIR, TEST_FILE)}\n`)

  try {
    // Step 1: Parse MDX file
    console.log('Step 1: Parsing MDX file...')
    const { frontmatter, content: mdxContent } = await parseMdxFile(TEST_FILE)
    console.log('  ✅ Frontmatter parsed')
    console.log('  Fields:', Object.keys(frontmatter).join(', '))
    console.log('  Content length:', mdxContent.length, 'chars')
    console.log()

    // Step 2: Map frontmatter to Payload structure
    console.log('Step 2: Mapping fields to Payload structure...')
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
      return
    }
    console.log('  ✅ All required fields present')
    console.log()

    // Step 3: Convert MDX content to Lexical blocks
    console.log('Step 3: Converting MDX to Lexical JSON...')
    const parsed = await parseMDXToBlocks(mdxContent)
    const contentBlocks = parsed.contentBlocks
    console.log('  ✅ Lexical blocks created')
    console.log('  Blocks count:', contentBlocks?.length || 0)
    console.log()

    // Step 4: Resolve inline blocks in content
    console.log('Step 4: Resolving inline blocks...')
    const resolvedBlocks = await resolveContentBlocks(contentBlocks)
    console.log('  ✅ Inline blocks resolved')
    console.log()

    // Step 5: Build final rate object
    const finalRate = {
      ...rateData,
      contentBlocks: resolvedBlocks,
    }

    // Remove temporary field
    delete finalRate._mdxContent

    // Display final structure
    console.log('✅ Final Rate Structure:\n')
    console.log(JSON.stringify(finalRate, null, 2))
    console.log()

    // Summary
    console.log('📊 Summary:')
    console.log(`  Title: ${finalRate.title}`)
    console.log(`  Slug: ${finalRate.slug}`)
    console.log(`  City: ${finalRate.cityName}`)
    console.log(`  Status: ${finalRate.status}`)
    console.log(`  Content blocks: ${finalRate.contentBlocks.length}`)
    console.log(`  SEO title: ${finalRate.seo?.title || 'N/A'}`)
    console.log(`  Hero line 1: ${finalRate.hero?.headingLine1 || 'N/A'}`)
    console.log()

    console.log('✅ Single file test PASSED')
  } catch (error: any) {
    console.error('❌ Test FAILED:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

testSingleRate()
