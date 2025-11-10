#!/usr/bin/env node

/**
 * T043: Transform Validation Script
 *
 * Validates Lexical JSON structure in migrated documents
 * - Checks contentBlocks array exists
 * - Validates Lexical JSON structure
 * - Checks for orphaned inline block references
 * - Verifies inline blocks are resolved
 */

import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_DB_CONN_STRING

if (!MONGO_URI) {
  console.error('❌ MONGO_DB_CONN_STRING not found in environment')
  console.error('   Run with: ./scripts/doppler-run.sh dev node migration/scripts/validate-transform.mjs')
  process.exit(1)
}

// Validation results
const results = {
  providersChecked: 0,
  ratesChecked: 0,
  structuralIssues: [],
  malformedNodes: [],
  orphanedBlocks: [],
  unresolvedSlugs: [],
}

/**
 * Validate Lexical JSON structure
 */
function validateLexicalStructure(content, docId, docType) {
  if (!content) {
    return { error: 'No content field' }
  }

  if (!content.root) {
    return { error: 'No root node' }
  }

  if (!content.root.children) {
    return { error: 'No children array in root' }
  }

  if (!Array.isArray(content.root.children)) {
    return { error: 'Children is not an array' }
  }

  // Check for valid node types
  const validNodeTypes = [
    'paragraph',
    'heading',
    'list',
    'listitem',
    'quote',
    'text',
    'linebreak',
    'link',
    'upload',
    'block',
    'inline-block',
  ]

  function checkNode(node, path = 'root') {
    if (!node.type) {
      results.malformedNodes.push({
        docId,
        docType,
        path,
        issue: 'Node missing type property',
        node: JSON.stringify(node).substring(0, 100),
      })
      return
    }

    // Check for unresolved inline block slugs (should be IDs by now)
    if (node.type === 'inline-block' && node.fields && node.fields._richTextDataSlug) {
      results.unresolvedSlugs.push({
        docId,
        docType,
        path,
        slug: node.fields._richTextDataSlug,
      })
    }

    // Check for orphaned inline block references
    if (node.type === 'inline-block' && node.fields && node.fields.richTextDataInstance) {
      // We'll validate these references exist in a separate check
    }

    // Recursively check children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child, i) => {
        checkNode(child, `${path}.children[${i}]`)
      })
    }
  }

  content.root.children.forEach((child, i) => {
    checkNode(child, `root.children[${i}]`)
  })

  return { valid: true }
}

/**
 * Validate a single document
 */
function validateDocument(doc, docType) {
  // Check for contentBlocks array
  if (!doc.contentBlocks || !Array.isArray(doc.contentBlocks)) {
    results.structuralIssues.push({
      docId: String(doc._id),
      docType,
      issue: 'Missing or invalid contentBlocks array',
    })
    return false
  }

  if (doc.contentBlocks.length === 0) {
    results.structuralIssues.push({
      docId: String(doc._id),
      docType,
      issue: 'Empty contentBlocks array',
    })
    return false
  }

  // Validate each content block
  for (const block of doc.contentBlocks) {
    if (block.blockType === 'richText' && block.content) {
      const result = validateLexicalStructure(block.content, String(doc._id), docType)
      if (result.error) {
        results.structuralIssues.push({
          docId: String(doc._id),
          docType,
          issue: result.error,
        })
      }
    }
  }

  return true
}

/**
 * Get random sample of documents
 */
function getRandomSample(array, size) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, size)
}

/**
 * Check for orphaned inline block references
 */
async function checkOrphanedReferences(db) {
  console.log('\n🔗 Checking for orphaned inline block references...')

  // Get all RichTextDataInstance IDs
  const instances = await db.collection('richtextdatainstances').find({}).toArray()
  const validIds = new Set(instances.map(inst => String(inst._id)))

  console.log(`   Found ${validIds.size} valid RichTextDataInstance IDs`)

  // Check providers
  const providers = await db.collection('providers').find({}).toArray()
  for (const provider of providers) {
    if (provider.contentBlocks) {
      for (const block of provider.contentBlocks) {
        if (block.blockType === 'richText' && block.content) {
          checkInlineBlockReferences(block.content, String(provider._id), 'provider', validIds)
        }
      }
    }
  }

  // Check electricity rates
  const rates = await db.collection('electricity-rates').find({}).toArray()
  for (const rate of rates) {
    if (rate.contentBlocks) {
      for (const block of rate.contentBlocks) {
        if (block.blockType === 'richText' && block.content) {
          checkInlineBlockReferences(block.content, String(rate._id), 'rate', validIds)
        }
      }
    }
  }
}

/**
 * Recursively check inline block references in content
 */
function checkInlineBlockReferences(content, docId, docType, validIds) {
  if (!content || !content.root) return

  function checkNode(node) {
    if (node.type === 'inline-block' && node.fields && node.fields.richTextDataInstance) {
      const refId = node.fields.richTextDataInstance
      if (!validIds.has(refId)) {
        results.orphanedBlocks.push({
          docId,
          docType,
          referenceId: refId,
        })
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(checkNode)
    }
  }

  content.root.children.forEach(checkNode)
}

/**
 * Main validation function
 */
async function validateTransform() {
  console.log('🔍 Starting transform validation...\n')

  const client = new MongoClient(MONGO_URI)

  try {
    await client.connect()
    const db = client.db()

    // Get all documents
    console.log('📁 Fetching documents from database...')
    const providers = await db.collection('providers').find({}).toArray()
    const rates = await db.collection('electricity-rates').find({}).toArray()

    console.log(`Found ${providers.length} providers`)
    console.log(`Found ${rates.length} electricity rates\n`)

    // Sample 25 from each
    const providerSample = getRandomSample(providers, 25)
    const rateSample = getRandomSample(rates, 25)

    console.log(`📊 Validating ${providerSample.length} providers (sample)...`)
    for (const doc of providerSample) {
      validateDocument(doc, 'provider')
      results.providersChecked++
    }

    console.log(`📊 Validating ${rateSample.length} rates (sample)...`)
    for (const doc of rateSample) {
      validateDocument(doc, 'rate')
      results.ratesChecked++
    }

    // Check for orphaned references
    await checkOrphanedReferences(db)

    console.log('\n✅ Transform validation complete!\n')

    // Print results
    console.log('=' .repeat(80))
    console.log('TRANSFORM VALIDATION RESULTS')
    console.log('=' .repeat(80))
    console.log()

    console.log('📊 Documents Checked:')
    console.log(`   Providers: ${results.providersChecked}`)
    console.log(`   Rates: ${results.ratesChecked}`)
    console.log()

    if (results.structuralIssues.length > 0) {
      console.log('❌ Structural Issues:')
      results.structuralIssues.forEach(({ docId, docType, issue }) => {
        console.log(`   [${docType}] ${docId}: ${issue}`)
      })
      console.log()
    }

    if (results.malformedNodes.length > 0) {
      console.log('❌ Malformed Nodes:')
      results.malformedNodes.slice(0, 10).forEach(({ docId, docType, path, issue }) => {
        console.log(`   [${docType}] ${docId} at ${path}: ${issue}`)
      })
      if (results.malformedNodes.length > 10) {
        console.log(`   ... and ${results.malformedNodes.length - 10} more`)
      }
      console.log()
    }

    if (results.orphanedBlocks.length > 0) {
      console.log('❌ Orphaned Inline Block References:')
      results.orphanedBlocks.forEach(({ docId, docType, referenceId }) => {
        console.log(`   [${docType}] ${docId} references missing ID: ${referenceId}`)
      })
      console.log()
    }

    if (results.unresolvedSlugs.length > 0) {
      console.log('⚠️  Unresolved Inline Block Slugs (should be IDs):')
      results.unresolvedSlugs.slice(0, 10).forEach(({ docId, docType, path, slug }) => {
        console.log(`   [${docType}] ${docId} at ${path}: slug="${slug}"`)
      })
      if (results.unresolvedSlugs.length > 10) {
        console.log(`   ... and ${results.unresolvedSlugs.length - 10} more`)
      }
      console.log()
    }

    console.log('=' .repeat(80))
    console.log()

    const totalIssues =
      results.structuralIssues.length +
      results.malformedNodes.length +
      results.orphanedBlocks.length +
      results.unresolvedSlugs.length

    console.log(`Total Issues: ${totalIssues}`)
    console.log()

    // Exit code
    if (totalIssues > 0) {
      console.log('❌ Transform validation FAILED')
      process.exit(1)
    } else {
      console.log('✅ Transform validation PASSED')
      process.exit(0)
    }

  } catch (err) {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  } finally {
    await client.close()
  }
}

// Run validation
validateTransform()
