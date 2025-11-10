#!/usr/bin/env node

/**
 * Prepare Electricity Rates Seed Data
 *
 * Parses all 894 MDX files from Astro electricity-rates collection
 * and converts them to JSON format for Payload CMS seeding.
 *
 * Based on analysis from analyze-electricity-rates.mjs:
 * - 8 frontmatter fields (title, draft, cityName, wp_slug, wp_post_id, seo_title, cityRef, wp_author)
 * - 41 unique components
 * - Template-driven structure (all cities same format)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Source: Astro electricity-rates directory
const ASTRO_RATES_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/electricity-rates/texas'

// Output: Prepared seed data
const OUTPUT_FILE = path.join(__dirname, '../data/seed/electricity-rates.json')

/**
 * Parse YAML frontmatter from MDX content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const frontmatter = {}
  const yamlContent = match[1]
  const lines = yamlContent.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // Parse booleans
    if (value === 'true') value = true
    if (value === 'false') value = false

    // Parse numbers
    if (/^\d+$/.test(value)) {
      value = parseInt(value, 10)
    }

    frontmatter[key] = value
  }

  return frontmatter
}

/**
 * Extract MDX content (everything after frontmatter)
 */
function extractContent(mdxContent) {
  const match = mdxContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)/)
  return match ? match[1].trim() : ''
}

/**
 * Extract component usage from MDX content
 * Matches both self-closing and regular tags
 */
function extractComponents(mdxContent) {
  const components = []

  // Match self-closing component tags like <ZipcodeSearchbar ... />
  const selfClosingRegex = /<(\w+)([^>]*?)\/>/g
  let match

  while ((match = selfClosingRegex.exec(mdxContent)) !== null) {
    const componentName = match[1]
    const propsString = match[2]

    // Parse props
    const props = {}
    const propRegex = /(\w+)="([^"]*)"/g
    let propMatch

    while ((propMatch = propRegex.exec(propsString)) !== null) {
      props[propMatch[1]] = propMatch[2]
    }

    components.push({
      name: componentName,
      props,
      originalTag: match[0]
    })
  }

  return components
}

/**
 * Map MDX component to Payload block
 * Uses actual block slugs from /src/lexical/blocks/
 */
function componentToBlock(component) {
  const { name, props } = component

  // Map component names to block slugs
  const blockMapping = {
    'ProviderCard': 'providerCard',
    'RatesTable': 'ratesTable',
    'ProvidersPhoneTable': 'providersPhoneTable',
    'PopularCitiesList': 'popularCitiesList',
    'PopularZipcodes': 'popularZipcodes',
    'ZipcodeSearchbar': 'zipcodeSearchbar',
    'Faq': 'faqBlock',
    'HelpMeChoose': 'helpMeChoose',
  }

  const blockType = blockMapping[name]

  if (!blockType) {
    console.warn(`⚠️  Unknown component: ${name}`)
    return null
  }

  // Return block with all props (Payload will validate based on block definition)
  return {
    blockType,
    ...props
  }
}

/**
 * Generate unique slug from file path
 * Uses full relative path to avoid duplicates
 */
function generateUniqueSlug(filePath) {
  const relativePath = path.relative(ASTRO_RATES_DIR, filePath)
  let slug = relativePath
    .replace(/\/index\.mdx$/, '')
    .replace(/\.mdx$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug
}

/**
 * Find all MDX files recursively
 */
function findMDXFiles(dir) {
  const files = []

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        scan(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(fullPath)
      }
    }
  }

  scan(dir)
  return files
}

/**
 * Convert single MDX file to Payload format
 */
function convertToPayloadFormat(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const frontmatter = parseFrontmatter(content)

  if (!frontmatter) {
    console.warn(`⚠️  No frontmatter found in: ${filePath}`)
    return null
  }

  const mdxContent = extractContent(content)
  const slug = generateUniqueSlug(filePath)

  // Map frontmatter fields to Payload schema
  const payloadDoc = {
    title: frontmatter.title || '',
    slug: slug,
    status: frontmatter.draft === false ? 'published' : 'draft',
    cityName: frontmatter.cityName || '',
    cityRef: frontmatter.cityRef || undefined,
    wordpressSlug: frontmatter.wp_slug || undefined,
    wpPostId: frontmatter.wp_post_id || undefined,
    wpAuthor: frontmatter.wp_author || undefined,
    seo: {
      title: frontmatter.seo_title || undefined,
    },
    // Store full MDX content for parsing during seeding
    _mdxContent: mdxContent,
  }

  // Remove undefined fields (keep nulls, but remove undefined)
  Object.keys(payloadDoc).forEach(key => {
    if (payloadDoc[key] === undefined) {
      delete payloadDoc[key]
    }
  })

  // Remove empty nested objects
  if (payloadDoc.seo && Object.keys(payloadDoc.seo).length === 0) {
    delete payloadDoc.seo
  }

  return payloadDoc
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Finding all electricity-rates MDX files...')

  if (!fs.existsSync(ASTRO_RATES_DIR)) {
    console.error(`❌ Source directory not found: ${ASTRO_RATES_DIR}`)
    process.exit(1)
  }

  const mdxFiles = findMDXFiles(ASTRO_RATES_DIR)
  console.log(`📄 Found ${mdxFiles.length} MDX files`)

  console.log('\n🔄 Converting to Payload format...')

  const results = []
  let successCount = 0
  let errorCount = 0

  for (const filePath of mdxFiles) {
    try {
      const doc = convertToPayloadFormat(filePath)
      if (doc) {
        results.push(doc)
        successCount++
      } else {
        errorCount++
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message)
      errorCount++
    }
  }

  console.log(`\n✅ Converted: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write JSON output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2))

  console.log(`\n💾 Saved to: ${OUTPUT_FILE}`)
  console.log(`📊 Total records: ${results.length}`)

  // Sample record
  if (results.length > 0) {
    console.log('\n📋 Sample record:')
    console.log(JSON.stringify(results[0], null, 2))
  }

  // Statistics
  console.log('\n📊 Field statistics:')
  const fieldCounts = {}
  results.forEach(doc => {
    Object.keys(doc).forEach(field => {
      fieldCounts[field] = (fieldCounts[field] || 0) + 1
    })
  })

  Object.entries(fieldCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([field, count]) => {
      const percentage = ((count / results.length) * 100).toFixed(1)
      console.log(`  ${field}: ${count} (${percentage}%)`)
    })
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
