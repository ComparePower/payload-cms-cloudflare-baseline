#!/usr/bin/env node
/**
 * Analyze Providers Directory Structure
 *
 * Scans the providers directory to understand:
 * - Hierarchy (parent/child relationships)
 * - MDX components used
 * - Images and references
 * - Frontmatter fields
 * - Content statistics
 */

import fs from 'fs/promises'
import path from 'path'

const SOURCE_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/providers'
const OUTPUT_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/migration/data'

// Track all findings
const analysis = {
  totalEntries: 0,
  hierarchy: [],
  components: new Set(),
  frontmatterFields: new Set(),
  images: [],
  issues: [],
  stats: {
    maxDepth: 0,
    avgContentLength: 0,
    entriesWithImages: 0,
    entriesWithHeroImage: 0,
  }
}

/**
 * Parse frontmatter from MDX content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const frontmatter = {}
  const lines = match[1].split('\n')

  let currentKey = null
  let currentValue = ''
  let inArray = false

  for (const line of lines) {
    if (line.trim().startsWith('-') && inArray) {
      // Array item
      const value = line.trim().substring(1).trim()
      if (!Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey] = []
      }
      frontmatter[currentKey].push(value)
    } else if (line.includes(':')) {
      // New key
      if (currentKey && currentValue && !inArray) {
        frontmatter[currentKey] = currentValue.trim()
      }

      const [key, ...valueParts] = line.split(':')
      currentKey = key.trim()
      currentValue = valueParts.join(':').trim()

      // Check if this is an array
      if (currentValue === '') {
        inArray = true
        frontmatter[currentKey] = []
      } else {
        inArray = false
        // Remove quotes if present
        if (currentValue.startsWith('"') && currentValue.endsWith('"')) {
          currentValue = currentValue.slice(1, -1)
        }
        frontmatter[currentKey] = currentValue
      }
    } else if (currentKey && !inArray) {
      // Continuation of previous value
      currentValue += ' ' + line.trim()
    }
  }

  // Store last key
  if (currentKey && currentValue && !inArray) {
    frontmatter[currentKey] = currentValue.trim()
  }

  return frontmatter
}

/**
 * Extract MDX components from content
 */
function extractComponents(content) {
  const components = new Set()

  // JSX-style components: <ComponentName ...>
  const jsxMatches = content.matchAll(/<([A-Z][a-zA-Z0-9]*)[^>]*>/g)
  for (const match of jsxMatches) {
    components.add(match[1])
  }

  // Inline text patterns like %currentyear%
  const patternMatches = content.matchAll(/%([a-z]+)%/gi)
  for (const match of patternMatches) {
    components.add(`%${match[1]}%`)
  }

  return Array.from(components)
}

/**
 * Calculate entry depth from path
 */
function calculateDepth(filePath) {
  const relativePath = path.relative(SOURCE_DIR, filePath)
  const depth = relativePath.split(path.sep).length - 1 // -1 for index.mdx itself
  return depth
}

/**
 * Get parent path from file path
 */
function getParentPath(filePath) {
  const dir = path.dirname(filePath)
  const parentDir = path.dirname(dir)

  // Check if parent has index.mdx
  const parentIndex = path.join(parentDir, 'index.mdx')
  if (parentDir !== SOURCE_DIR) {
    return parentIndex
  }

  return null
}

/**
 * Analyze a single MDX file
 */
async function analyzeFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const dir = path.dirname(filePath)
    const relativePath = path.relative(SOURCE_DIR, filePath)
    const depth = calculateDepth(filePath)
    const parentPath = getParentPath(filePath)

    // Parse frontmatter
    const frontmatter = parseFrontmatter(content)
    if (frontmatter) {
      Object.keys(frontmatter).forEach(key => analysis.frontmatterFields.add(key))
    }

    // Extract components
    const components = extractComponents(content)
    components.forEach(comp => analysis.components.add(comp))

    // Check for images
    const dirContents = await fs.readdir(dir)
    const hasHeroImage = dirContents.includes('heroImage.png') || dirContents.includes('heroImage.jpg')
    const hasImagesDir = dirContents.includes('images')

    let imageFiles = []
    if (hasImagesDir) {
      const imagesDir = path.join(dir, 'images')
      const images = await fs.readdir(imagesDir)
      imageFiles = images.filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f))
    }

    // Content length
    const bodyContent = content.replace(/^---[\s\S]*?---\n/, '')
    const contentLength = bodyContent.length

    // Build entry object
    const entry = {
      path: relativePath,
      fullPath: filePath,
      depth,
      parentPath: parentPath ? path.relative(SOURCE_DIR, parentPath) : null,
      slug: frontmatter?.wp_slug || path.basename(dir),
      title: frontmatter?.title || 'Untitled',
      frontmatter,
      components,
      hasHeroImage,
      imageFiles,
      contentLength,
    }

    analysis.hierarchy.push(entry)
    analysis.totalEntries++

    if (depth > analysis.stats.maxDepth) {
      analysis.stats.maxDepth = depth
    }

    if (hasHeroImage) {
      analysis.stats.entriesWithHeroImage++
    }

    if (imageFiles.length > 0) {
      analysis.stats.entriesWithImages++
    }

    console.log(`✓ Analyzed: ${relativePath} (depth: ${depth}, components: ${components.length})`)

  } catch (error) {
    analysis.issues.push({
      type: 'analysis_error',
      file: filePath,
      error: error.message,
    })
    console.error(`✗ Error analyzing ${filePath}:`, error.message)
  }
}

/**
 * Recursively find all index.mdx files
 */
async function findIndexFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') {
        await findIndexFiles(fullPath, files)
      }
    } else if (entry.isFile() && entry.name === 'index.mdx') {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Main analysis function
 */
async function analyze() {
  console.log('🔍 Starting providers directory analysis...\n')

  // Find all index.mdx files
  const files = await findIndexFiles(SOURCE_DIR)

  console.log(`Found ${files.length} index.mdx files\n`)

  // Analyze each file
  for (const file of files) {
    await analyzeFile(file)
  }

  // Calculate averages
  if (analysis.totalEntries > 0) {
    const totalLength = analysis.hierarchy.reduce((sum, entry) => sum + entry.contentLength, 0)
    analysis.stats.avgContentLength = Math.round(totalLength / analysis.totalEntries)
  }

  // Sort hierarchy by depth then path
  analysis.hierarchy.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth
    return a.path.localeCompare(b.path)
  })

  // Convert Sets to Arrays for JSON
  analysis.components = Array.from(analysis.components).sort()
  analysis.frontmatterFields = Array.from(analysis.frontmatterFields).sort()

  // Save results
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'providers-analysis.json'),
    JSON.stringify(analysis, null, 2)
  )

  // Save hierarchy tree
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'providers-tree.json'),
    JSON.stringify(analysis.hierarchy, null, 2)
  )

  // Save components list
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'components-found.json'),
    JSON.stringify({
      total: analysis.components.length,
      components: analysis.components,
    }, null, 2)
  )

  // Print summary
  console.log('\n📊 Analysis Complete!\n')
  console.log(`Total Entries: ${analysis.totalEntries}`)
  console.log(`Max Depth: ${analysis.stats.maxDepth}`)
  console.log(`Unique Components: ${analysis.components.length}`)
  console.log(`Unique Frontmatter Fields: ${analysis.frontmatterFields.length}`)
  console.log(`Entries with Hero Image: ${analysis.stats.entriesWithHeroImage}`)
  console.log(`Entries with Images: ${analysis.stats.entriesWithImages}`)
  console.log(`Average Content Length: ${analysis.stats.avgContentLength} chars`)
  console.log(`Issues Found: ${analysis.issues.length}`)

  console.log('\n📝 Results saved to:')
  console.log(`  - ${OUTPUT_DIR}/providers-analysis.json`)
  console.log(`  - ${OUTPUT_DIR}/providers-tree.json`)
  console.log(`  - ${OUTPUT_DIR}/components-found.json`)

  if (analysis.issues.length > 0) {
    console.log('\n⚠️  Issues:')
    analysis.issues.forEach(issue => {
      console.log(`  - ${issue.type}: ${issue.file}`)
      console.log(`    ${issue.error}`)
    })
  }

  console.log('\n✅ Analysis complete!')
}

// Run analysis
analyze().catch(console.error)
