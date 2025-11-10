#!/usr/bin/env node

/**
 * T042: Parse Validation Script
 *
 * Validates MDX file parsing and frontmatter extraction
 * - Checks MDX syntax
 * - Validates YAML frontmatter
 * - Verifies field extraction
 * - Checks for encoding issues
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Source directories
const SOURCE_ROOT = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end'
const PROVIDERS_DIR = path.join(SOURCE_ROOT, 'providers')
const RATES_DIR = path.join(SOURCE_ROOT, 'electricity-rates')

// Validation results
const results = {
  providersChecked: 0,
  ratesChecked: 0,
  providersErrors: [],
  ratesErrors: [],
  providersWarnings: [],
  ratesWarnings: [],
  encoding: [],
}

/**
 * Get all MDX files in a directory recursively
 */
function getMdxFiles(dir) {
  const files = []

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        traverse(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(fullPath)
      }
    }
  }

  traverse(dir)
  return files
}

/**
 * Simple YAML parser (basic support for frontmatter)
 */
function parseSimpleYaml(yamlStr) {
  const lines = yamlStr.split('\n')
  const result = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue

    const key = trimmed.substring(0, colonIndex).trim()
    let value = trimmed.substring(colonIndex + 1).trim()

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1)
    }

    result[key] = value
  }

  return result
}

/**
 * Extract frontmatter from MDX content
 */
function extractFrontmatter(content, filePath) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { error: 'No frontmatter found' }
  }

  try {
    const frontmatter = parseSimpleYaml(match[1])
    return { frontmatter }
  } catch (err) {
    return { error: `YAML parse error: ${err.message}` }
  }
}

/**
 * Validate a single MDX file
 */
function validateMdxFile(filePath, type) {
  try {
    // Check file readability
    const content = fs.readFileSync(filePath, 'utf-8')

    // Check for UTF-8 encoding issues
    if (content.includes('\uFFFD')) {
      results.encoding.push({
        file: filePath,
        issue: 'Contains replacement character (encoding issue)'
      })
    }

    // Extract and validate frontmatter
    const { frontmatter, error } = extractFrontmatter(content, filePath)

    if (error) {
      if (type === 'provider') {
        results.providersErrors.push({
          file: filePath,
          error: error,
          type: 'frontmatter'
        })
      } else {
        results.ratesErrors.push({
          file: filePath,
          error: error,
          type: 'frontmatter'
        })
      }
      return false
    }

    // Check for required fields
    const requiredFields = ['title', 'slug']
    const missingFields = requiredFields.filter(field => !frontmatter[field])

    if (missingFields.length > 0) {
      const warning = {
        file: filePath,
        warning: `Missing fields: ${missingFields.join(', ')}`,
        type: 'missing-fields'
      }

      if (type === 'provider') {
        results.providersWarnings.push(warning)
      } else {
        results.ratesWarnings.push(warning)
      }
    }

    // Check MDX structure (basic validation)
    const mdxContentMatch = content.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/)
    if (mdxContentMatch) {
      const mdxContent = mdxContentMatch[1]

      // Check for unclosed components
      const openTags = (mdxContent.match(/<[A-Z]\w+[^/>]*>/g) || []).length
      const closeTags = (mdxContent.match(/<\/[A-Z]\w+>/g) || []).length
      const selfClosing = (mdxContent.match(/<[A-Z]\w+[^>]*\/>/g) || []).length

      if (openTags !== closeTags + selfClosing) {
        const warning = {
          file: filePath,
          warning: `Possible unclosed JSX tags (open: ${openTags}, close: ${closeTags}, self-closing: ${selfClosing})`,
          type: 'jsx-structure'
        }

        if (type === 'provider') {
          results.providersWarnings.push(warning)
        } else {
          results.ratesWarnings.push(warning)
        }
      }
    }

    return true

  } catch (err) {
    if (type === 'provider') {
      results.providersErrors.push({
        file: filePath,
        error: err.message,
        type: 'parse-error'
      })
    } else {
      results.ratesErrors.push({
        file: filePath,
        error: err.message,
        type: 'parse-error'
      })
    }
    return false
  }
}

/**
 * Sample files from an array (for performance)
 */
function sampleFiles(files, sampleSize = 50) {
  if (files.length <= sampleSize) {
    return files
  }

  const shuffled = [...files].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, sampleSize)
}

/**
 * Main validation function
 */
async function validateParse() {
  console.log('🔍 Starting parse validation...\n')

  // Get all MDX files
  console.log('📁 Discovering MDX files...')
  const providerFiles = getMdxFiles(PROVIDERS_DIR)
  const rateFiles = getMdxFiles(RATES_DIR)

  console.log(`Found ${providerFiles.length} provider files`)
  console.log(`Found ${rateFiles.length} rate files\n`)

  // Sample files for validation (50 from each)
  const providerSample = sampleFiles(providerFiles, 50)
  const rateSample = sampleFiles(rateFiles, 50)

  console.log(`📊 Validating ${providerSample.length} provider files (sample)...`)
  for (const file of providerSample) {
    validateMdxFile(file, 'provider')
    results.providersChecked++
  }

  console.log(`📊 Validating ${rateSample.length} rate files (sample)...`)
  for (const file of rateSample) {
    validateMdxFile(file, 'rate')
    results.ratesChecked++
  }

  console.log('\n✅ Parse validation complete!\n')

  // Print results
  console.log('=' .repeat(80))
  console.log('PARSE VALIDATION RESULTS')
  console.log('=' .repeat(80))
  console.log()

  console.log('📊 Files Checked:')
  console.log(`   Providers: ${results.providersChecked}/${providerFiles.length}`)
  console.log(`   Rates: ${results.ratesChecked}/${rateFiles.length}`)
  console.log()

  if (results.providersErrors.length > 0) {
    console.log('❌ Provider Errors:')
    results.providersErrors.forEach(({ file, error, type }) => {
      console.log(`   [${type}] ${path.basename(file)}: ${error}`)
    })
    console.log()
  }

  if (results.ratesErrors.length > 0) {
    console.log('❌ Rate Errors:')
    results.ratesErrors.forEach(({ file, error, type }) => {
      console.log(`   [${type}] ${path.basename(file)}: ${error}`)
    })
    console.log()
  }

  if (results.providersWarnings.length > 0) {
    console.log('⚠️  Provider Warnings:')
    results.providersWarnings.slice(0, 10).forEach(({ file, warning, type }) => {
      console.log(`   [${type}] ${path.basename(file)}: ${warning}`)
    })
    if (results.providersWarnings.length > 10) {
      console.log(`   ... and ${results.providersWarnings.length - 10} more`)
    }
    console.log()
  }

  if (results.ratesWarnings.length > 0) {
    console.log('⚠️  Rate Warnings:')
    results.ratesWarnings.slice(0, 10).forEach(({ file, warning, type }) => {
      console.log(`   [${type}] ${path.basename(file)}: ${warning}`)
    })
    if (results.ratesWarnings.length > 10) {
      console.log(`   ... and ${results.ratesWarnings.length - 10} more`)
    }
    console.log()
  }

  if (results.encoding.length > 0) {
    console.log('🔤 Encoding Issues:')
    results.encoding.forEach(({ file, issue }) => {
      console.log(`   ${path.basename(file)}: ${issue}`)
    })
    console.log()
  }

  console.log('=' .repeat(80))
  console.log()

  const totalErrors = results.providersErrors.length + results.ratesErrors.length
  const totalWarnings = results.providersWarnings.length + results.ratesWarnings.length

  console.log(`Total Errors: ${totalErrors}`)
  console.log(`Total Warnings: ${totalWarnings}`)
  console.log(`Encoding Issues: ${results.encoding.length}`)
  console.log()

  // Exit code
  if (totalErrors > 0) {
    console.log('❌ Parse validation FAILED')
    process.exit(1)
  } else {
    console.log('✅ Parse validation PASSED')
    process.exit(0)
  }
}

// Run validation
validateParse().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
