#!/usr/bin/env node
/**
 * Analyze Electricity Rates Frontmatter
 *
 * Scans all MDX files in electricity-rates collection to discover:
 * - All frontmatter fields (not just Astro schema)
 * - Field types and usage patterns
 * - Component usage
 * - Sample values
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RATES_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/electricity-rates/texas'

/**
 * Recursively find all .mdx files
 */
async function findMdxFiles(dir) {
  const files = []

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(fullPath)
      }
    }
  }

  await walk(dir)
  return files
}

/**
 * Parse YAML frontmatter
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const frontmatter = {}
  const yamlContent = match[1]

  // Simple YAML parser (handles basic cases)
  const lines = yamlContent.split('\n')
  let currentKey = null
  let currentValue = ''
  let inMultiline = false

  for (const line of lines) {
    if (inMultiline) {
      if (line.trim() === '') {
        // End of multiline
        frontmatter[currentKey] = currentValue.trim()
        inMultiline = false
        currentKey = null
        currentValue = ''
      } else {
        currentValue += ' ' + line.trim()
      }
      continue
    }

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    // Multiline value
    if (value === '>-' || value === '|-' || value === '>') {
      currentKey = key
      currentValue = ''
      inMultiline = true
      continue
    }

    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }

    // Parse booleans
    if (value === 'true') value = true
    if (value === 'false') value = false

    // Parse numbers
    if (/^\d+$/.test(value)) value = parseInt(value, 10)

    frontmatter[key] = value
  }

  return frontmatter
}

/**
 * Extract MDX content
 */
function extractContent(mdxContent) {
  const match = mdxContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)/)
  return match ? match[1] : mdxContent
}

/**
 * Extract component usage
 */
function extractComponents(mdxContent) {
  const components = new Set()

  // Self-closing tags
  const selfClosingRegex = /<(\w+)([^>]*?)\/>/g
  let match
  while ((match = selfClosingRegex.exec(mdxContent)) !== null) {
    components.add(match[1])
  }

  // Opening tags (for paired tags like <Section>)
  const openingRegex = /<(\w+)([^>]*?)>/g
  while ((match = openingRegex.exec(mdxContent)) !== null) {
    const tagName = match[1]
    // Skip HTML tags
    if (!['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'br', 'hr'].includes(tagName.toLowerCase())) {
      components.add(tagName)
    }
  }

  return Array.from(components).sort()
}

/**
 * Analyze all files
 */
async function analyze() {
  console.log('📊 Analyzing Electricity Rates Collection...\\n')

  // Find all MDX files
  console.log('📁 Finding MDX files...')
  const mdxFiles = await findMdxFiles(RATES_DIR)
  console.log(`   Found ${mdxFiles.length} files\\n`)

  // Collect all fields
  const fieldCounts = new Map()
  const fieldSamples = new Map()
  const fieldTypes = new Map()
  const allComponents = new Set()

  console.log('🔍 Analyzing frontmatter and content...')

  for (let i = 0; i < mdxFiles.length; i++) {
    const filePath = mdxFiles[i]

    if (i % 100 === 0) {
      console.log(`   Progress: ${i}/${mdxFiles.length}`)
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const frontmatter = parseFrontmatter(content)

      if (!frontmatter) continue

      // Count fields
      for (const [key, value] of Object.entries(frontmatter)) {
        fieldCounts.set(key, (fieldCounts.get(key) || 0) + 1)

        // Sample values (first 3)
        if (!fieldSamples.has(key)) {
          fieldSamples.set(key, [])
        }
        if (fieldSamples.get(key).length < 3) {
          fieldSamples.get(key).push(value)
        }

        // Infer types
        if (!fieldTypes.has(key)) {
          const type = typeof value
          fieldTypes.set(key, type)
        }
      }

      // Extract components
      const mdxContent = extractContent(content)
      const components = extractComponents(mdxContent)
      components.forEach(c => allComponents.add(c))

    } catch (error) {
      console.error(`   ❌ Error in ${path.basename(filePath)}: ${error.message}`)
    }
  }

  console.log(`   ✅ Analyzed ${mdxFiles.length} files\\n`)

  // Results
  console.log('=' .repeat(80))
  console.log('📋 FRONTMATTER FIELDS ANALYSIS')
  console.log('='.repeat(80))
  console.log()

  // Sort by usage count
  const sortedFields = Array.from(fieldCounts.entries())
    .sort((a, b) => b[1] - a[1])

  console.log(`Total unique fields: ${sortedFields.length}\\n`)

  sortedFields.forEach(([field, count]) => {
    const percentage = ((count / mdxFiles.length) * 100).toFixed(1)
    const type = fieldTypes.get(field)
    const samples = fieldSamples.get(field)

    console.log(`${field}:`)
    console.log(`  Usage: ${count}/${mdxFiles.length} (${percentage}%)`)
    console.log(`  Type: ${type}`)
    console.log(`  Samples:`)
    samples.forEach(sample => {
      const displayValue = typeof sample === 'string' && sample.length > 60
        ? sample.substring(0, 60) + '...'
        : sample
      console.log(`    - ${JSON.stringify(displayValue)}`)
    })
    console.log()
  })

  // Components
  console.log('=' .repeat(80))
  console.log('🧩 COMPONENTS USED')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total unique components: ${allComponents.size}\\n`)

  Array.from(allComponents).sort().forEach(component => {
    console.log(`  - <${component} />`)
  })
  console.log()

  // Summary
  console.log('=' .repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total MDX files: ${mdxFiles.length}`)
  console.log(`Unique frontmatter fields: ${sortedFields.length}`)
  console.log(`Unique components: ${allComponents.size}`)
  console.log()

  // Required fields (100% usage)
  const requiredFields = sortedFields.filter(([, count]) => count === mdxFiles.length)
  console.log(`Required fields (100% usage): ${requiredFields.length}`)
  requiredFields.forEach(([field]) => {
    console.log(`  - ${field}`)
  })
  console.log()

  // Optional fields (<100% usage)
  const optionalFields = sortedFields.filter(([, count]) => count < mdxFiles.length)
  console.log(`Optional fields (<100% usage): ${optionalFields.length}`)
  console.log()
}

// Run analysis
analyze().catch(console.error)
