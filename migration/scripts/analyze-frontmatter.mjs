#!/usr/bin/env node
/**
 * Frontmatter Analysis Script
 *
 * Analyzes ALL frontmatter fields from MDX files to:
 * 1. Discover all unique fields used
 * 2. Infer field types (string, number, boolean, date, array, object)
 * 3. Identify relationships (author, editor, category references)
 * 4. Generate complete Payload field definitions
 * 5. Compare with Astro content config schema
 *
 * This is critical because:
 * - Astro content config may be incomplete
 * - Frontmatter may contain custom fields
 * - Relationships must be discovered for collection generation
 */

import fs from 'fs/promises'
import path from 'path'

const SOURCE_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/providers'
const OUTPUT_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/migration/data'
const ASTRO_SCHEMA_FILE = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/config/content/collections/frontend/frontend-content/providers/astro.tsx'

// Analysis results
const analysis = {
  totalFiles: 0,
  totalFields: 0,
  fields: {},  // { fieldName: { type, count, examples, isRelationship, targetCollection } }
  relationships: {},  // { fieldName: { targetCollection, isArray, references } }
  astroSchemaFields: [],
  missingFromAstro: [],
  missingFromFrontmatter: []
}

/**
 * Parse frontmatter from MDX content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const frontmatterText = match[1]
  const frontmatter = {}
  let currentKey = null
  let inArray = false
  let arrayItems = []

  const lines = frontmatterText.split('\n')

  for (const line of lines) {
    // Array item: '  - value'
    if (line.match(/^\s+-\s+/)) {
      if (inArray) {
        const value = line.replace(/^\s+-\s+/, '').trim()
        arrayItems.push(value)
      }
      continue
    }

    // Key-value: 'key: value'
    const keyValueMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/)
    if (keyValueMatch) {
      // Save previous array if exists
      if (currentKey && inArray) {
        frontmatter[currentKey] = arrayItems
        arrayItems = []
        inArray = false
      }

      const [, key, value] = keyValueMatch
      currentKey = key.trim()
      const trimmedValue = value.trim()

      if (trimmedValue === '') {
        // Empty value = start of array
        inArray = true
        arrayItems = []
      } else {
        // Inline value
        frontmatter[currentKey] = trimmedValue
        inArray = false
      }
    } else if (currentKey && !inArray) {
      // Multiline value continuation
      frontmatter[currentKey] += '\n' + line
    }
  }

  // Save last array if exists
  if (currentKey && inArray) {
    frontmatter[currentKey] = arrayItems
  }

  return frontmatter
}

/**
 * Infer field type from value
 */
function inferType(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'array (unknown type)'
    const firstType = inferType(value[0])
    const allSameType = value.every(v => inferType(v) === firstType)
    return allSameType ? `array<${firstType}>` : 'array (mixed types)'
  }

  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'

  if (typeof value === 'string') {
    // Check for date patterns
    if (value.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/)) {
      return 'date'
    }

    // Check for boolean strings
    if (value === 'true' || value === 'false') {
      return 'boolean'
    }

    // Check for number strings
    if (value.match(/^\d+$/)) {
      return 'number'
    }

    return 'string'
  }

  if (typeof value === 'object') return 'object'

  return 'unknown'
}

/**
 * Detect if field is a relationship reference
 */
function detectRelationship(fieldName, value) {
  // Known relationship patterns
  const relationshipPatterns = [
    { pattern: /_is$/, targetCollection: 'team', isArray: true },  // post_author_team_member_is
    { pattern: /^author/, targetCollection: 'team', isArray: false },
    { pattern: /^editor/, targetCollection: 'team', isArray: false },
    { pattern: /^checker/, targetCollection: 'team', isArray: false },
    { pattern: /^category/, targetCollection: 'categories', isArray: true },
    { pattern: /^tag/, targetCollection: 'tags', isArray: true },
    { pattern: /_id$/, targetCollection: 'unknown', isArray: false },
  ]

  for (const { pattern, targetCollection, isArray } of relationshipPatterns) {
    if (fieldName.match(pattern)) {
      return { targetCollection, isArray: isArray || Array.isArray(value) }
    }
  }

  return null
}

/**
 * Analyze a single MDX file
 */
async function analyzeMDXFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const frontmatter = parseFrontmatter(content)

    if (!frontmatter) {
      console.warn(`⚠️  No frontmatter in: ${path.relative(SOURCE_DIR, filePath)}`)
      return
    }

    analysis.totalFiles++

    // Analyze each field
    for (const [fieldName, value] of Object.entries(frontmatter)) {
      // Initialize field analysis if first occurrence
      if (!analysis.fields[fieldName]) {
        analysis.fields[fieldName] = {
          type: null,
          count: 0,
          examples: [],
          nullable: false,
          types: new Set(),  // Track all types seen
          isRelationship: false,
          targetCollection: null
        }
        analysis.totalFields++
      }

      const field = analysis.fields[fieldName]
      field.count++

      // Infer type
      const inferredType = inferType(value)
      field.types.add(inferredType)

      // Store example (max 5 examples)
      if (field.examples.length < 5) {
        field.examples.push(value)
      }

      // Detect relationships
      const relationship = detectRelationship(fieldName, value)
      if (relationship) {
        field.isRelationship = true
        field.targetCollection = relationship.targetCollection

        if (!analysis.relationships[fieldName]) {
          analysis.relationships[fieldName] = {
            targetCollection: relationship.targetCollection,
            isArray: relationship.isArray,
            references: new Set()
          }
        }

        // Collect unique references
        if (Array.isArray(value)) {
          value.forEach(ref => analysis.relationships[fieldName].references.add(ref))
        } else {
          analysis.relationships[fieldName].references.add(value)
        }
      }

      // Check for null values
      if (value === null || value === undefined || value === '') {
        field.nullable = true
      }
    }
  } catch (error) {
    console.error(`❌ Error analyzing ${filePath}:`, error.message)
  }
}

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
 * Parse Astro schema to extract field definitions
 */
async function parseAstroSchema() {
  try {
    const content = await fs.readFile(ASTRO_SCHEMA_FILE, 'utf-8')

    // Extract field names from z.object({ ... })
    const schemaMatch = content.match(/z\.object\({([^}]+)}\)/s)
    if (!schemaMatch) {
      console.warn('⚠️  Could not parse Astro schema')
      return
    }

    const schemaText = schemaMatch[1]
    const fieldMatches = schemaText.matchAll(/(\w+):\s*z\./g)

    for (const match of fieldMatches) {
      const fieldName = match[1]
      analysis.astroSchemaFields.push(fieldName)
    }

    console.log(`\n📋 Astro Schema Fields: ${analysis.astroSchemaFields.length}`)
  } catch (error) {
    console.error('❌ Error reading Astro schema:', error.message)
  }
}

/**
 * Compare frontmatter fields with Astro schema
 */
function compareWithAstroSchema() {
  const frontmatterFields = Object.keys(analysis.fields)

  // Fields in frontmatter but not in Astro schema
  analysis.missingFromAstro = frontmatterFields.filter(
    field => !analysis.astroSchemaFields.includes(field)
  )

  // Fields in Astro schema but not in frontmatter
  analysis.missingFromFrontmatter = analysis.astroSchemaFields.filter(
    field => !frontmatterFields.includes(field)
  )
}

/**
 * Finalize field types
 */
function finalizeFieldTypes() {
  for (const [fieldName, field] of Object.entries(analysis.fields)) {
    // Convert Set to array
    const types = Array.from(field.types)

    // Determine primary type
    if (types.length === 1) {
      field.type = types[0]
    } else if (types.length === 2 && types.includes('null')) {
      // Nullable field
      field.type = types.find(t => t !== 'null')
      field.nullable = true
    } else {
      // Mixed types
      field.type = types.join(' | ')
    }

    // Remove the Set (not JSON serializable)
    delete field.types
  }
}

/**
 * Generate Payload field definition from analyzed field
 */
function generatePayloadField(fieldName, field) {
  const payloadField = {
    name: fieldName,
    type: null,
    required: !field.nullable && field.count === analysis.totalFiles,
    admin: {
      description: `Found in ${field.count}/${analysis.totalFiles} files`
    }
  }

  // Map types to Payload field types
  if (field.isRelationship) {
    payloadField.type = 'relationship'
    payloadField.relationTo = field.targetCollection
    payloadField.hasMany = field.type.startsWith('array')
  } else if (field.type.startsWith('array')) {
    payloadField.type = 'array'
    // Try to infer item type
    const itemType = field.type.match(/array<(\w+)>/)
    if (itemType) {
      payloadField.fields = [
        {
          name: 'item',
          type: itemType[1] === 'string' ? 'text' : itemType[1]
        }
      ]
    }
  } else if (field.type === 'boolean') {
    payloadField.type = 'checkbox'
  } else if (field.type === 'number') {
    payloadField.type = 'number'
  } else if (field.type === 'date') {
    payloadField.type = 'date'
  } else if (field.type === 'string') {
    // Determine if text or textarea based on examples
    const avgLength = field.examples.reduce((sum, ex) => sum + String(ex).length, 0) / field.examples.length
    payloadField.type = avgLength > 100 ? 'textarea' : 'text'
  } else {
    payloadField.type = 'text'  // Default
  }

  return payloadField
}

/**
 * Generate Payload collection config
 */
function generatePayloadCollectionConfig() {
  const fields = []

  for (const [fieldName, field] of Object.entries(analysis.fields)) {
    fields.push(generatePayloadField(fieldName, field))
  }

  return {
    slug: 'providers',
    admin: {
      useAsTitle: 'title'
    },
    fields
  }
}

/**
 * Main analysis function
 */
async function analyze() {
  console.log('🔍 Starting Frontmatter Analysis...\n')

  // Parse Astro schema first
  await parseAstroSchema()

  // Find all MDX files
  console.log(`📁 Scanning: ${SOURCE_DIR}`)
  const mdxFiles = await findMDXFiles(SOURCE_DIR)
  console.log(`Found ${mdxFiles.length} MDX files\n`)

  // Analyze each file
  console.log('Analyzing frontmatter...')
  for (const file of mdxFiles) {
    await analyzeMDXFile(file)
  }

  // Finalize analysis
  finalizeFieldTypes()
  compareWithAstroSchema()

  // Generate Payload config
  const payloadConfig = generatePayloadCollectionConfig()

  // Summary
  console.log('\n\n📊 Frontmatter Analysis Summary\n')
  console.log(`Total MDX Files: ${analysis.totalFiles}`)
  console.log(`Total Unique Fields: ${analysis.totalFields}`)
  console.log(`Relationship Fields: ${Object.keys(analysis.relationships).length}`)
  console.log(`\nAstro Schema Fields: ${analysis.astroSchemaFields.length}`)
  console.log(`Missing from Astro Schema: ${analysis.missingFromAstro.length}`)
  console.log(`Missing from Frontmatter: ${analysis.missingFromFrontmatter.length}`)

  // Show missing fields
  if (analysis.missingFromAstro.length > 0) {
    console.log('\n⚠️  Fields in Frontmatter but NOT in Astro Schema:')
    analysis.missingFromAstro.forEach(field => {
      const fieldData = analysis.fields[field]
      console.log(`  - ${field} (${fieldData.type}, used in ${fieldData.count} files)`)
    })
  }

  if (analysis.missingFromFrontmatter.length > 0) {
    console.log('\n⚠️  Fields in Astro Schema but NOT in Frontmatter:')
    analysis.missingFromFrontmatter.forEach(field => {
      console.log(`  - ${field}`)
    })
  }

  // Show relationships
  if (Object.keys(analysis.relationships).length > 0) {
    console.log('\n🔗 Relationship Fields Detected:')
    for (const [fieldName, rel] of Object.entries(analysis.relationships)) {
      console.log(`  - ${fieldName} → ${rel.targetCollection} (${rel.isArray ? 'hasMany' : 'hasOne'})`)
      console.log(`    References: ${rel.references.size} unique values`)
    }
  }

  // Save results
  console.log('\n📝 Saving results...')

  // Convert Sets to arrays for JSON serialization
  const serializableAnalysis = JSON.parse(JSON.stringify(analysis, (key, value) => {
    if (value instanceof Set) {
      return Array.from(value)
    }
    return value
  }))

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'frontmatter-analysis.json'),
    JSON.stringify(serializableAnalysis, null, 2)
  )

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'payload-providers-config.json'),
    JSON.stringify(payloadConfig, null, 2)
  )

  console.log(`  - ${OUTPUT_DIR}/frontmatter-analysis.json`)
  console.log(`  - ${OUTPUT_DIR}/payload-providers-config.json`)

  console.log('\n✅ Frontmatter analysis complete!')
}

// Run analysis
analyze().catch(console.error)
