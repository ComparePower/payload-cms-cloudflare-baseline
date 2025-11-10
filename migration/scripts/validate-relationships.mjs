#!/usr/bin/env node

/**
 * T048: Relationship Integrity Validation Script
 *
 * Validates relationship integrity across collections
 * - Checks inline block references point to valid instances
 * - Validates no orphaned references
 * - Checks relationship field integrity
 */

import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_DB_CONN_STRING

if (!MONGO_URI) {
  console.error('❌ MONGO_DB_CONN_STRING not found in environment')
  console.error('   Run with: ./scripts/doppler-run.sh dev node migration/scripts/validate-relationships.mjs')
  process.exit(1)
}

// Validation results
const results = {
  providersChecked: 0,
  ratesChecked: 0,
  totalInlineBlocksChecked: 0,
  brokenReferences: [],
  orphanedBlocks: [],
  validReferences: 0,
}

/**
 * Extract all inline block references from Lexical content
 */
function extractInlineBlockReferences(content) {
  const references = []

  if (!content || !content.root || !content.root.children) {
    return references
  }

  function traverse(node) {
    if (node.type === 'inline-block' && node.fields && node.fields.richTextDataInstance) {
      references.push(node.fields.richTextDataInstance)
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  content.root.children.forEach(traverse)
  return references
}

/**
 * Get all inline block references from a document
 */
function getDocumentReferences(doc) {
  const references = []

  if (doc.contentBlocks && Array.isArray(doc.contentBlocks)) {
    for (const block of doc.contentBlocks) {
      if (block.blockType === 'richText' && block.content) {
        const blockRefs = extractInlineBlockReferences(block.content)
        references.push(...blockRefs)
      }
    }
  }

  return references
}

/**
 * Validate references for a single document
 */
function validateDocumentReferences(doc, docType, validInstanceIds) {
  const references = getDocumentReferences(doc)
  results.totalInlineBlocksChecked += references.length

  for (const refId of references) {
    if (!validInstanceIds.has(refId)) {
      results.brokenReferences.push({
        docId: String(doc._id),
        docType,
        referenceId: refId,
        docTitle: doc.title,
      })
    } else {
      results.validReferences++
    }
  }

  return references.length
}

/**
 * Get random sample from array
 */
function getRandomSample(array, size) {
  if (array.length <= size) return array
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, size)
}

/**
 * Check for orphaned RichTextDataInstances (not referenced by any document)
 */
async function checkOrphanedInstances(db, validInstanceIds, allReferences) {
  console.log('\n🔗 Checking for orphaned RichTextDataInstances...')

  const instances = await db
    .collection('richtextdatainstances')
    .find({})
    .toArray()

  for (const instance of instances) {
    const instanceId = String(instance._id)
    const isReferenced = allReferences.has(instanceId)
    if (!isReferenced) {
      results.orphanedBlocks.push({
        instanceId: instanceId,
        slug: instance.slug,
        type: instance.type,
      })
    }
  }

  console.log(`   Found ${results.orphanedBlocks.length} orphaned instances`)
}

/**
 * Main validation function
 */
async function validateRelationships() {
  console.log('🔍 Starting relationship integrity validation...\n')

  const client = new MongoClient(MONGO_URI)

  try {
    await client.connect()
    const db = client.db()

    console.log('📁 Fetching data from database...')

    // Get all RichTextDataInstances
    const instances = await db
      .collection('richtextdatainstances')
      .find({})
      .toArray()

    const validInstanceIds = new Set(instances.map(inst => String(inst._id)))
    console.log(`   Found ${validInstanceIds.size} RichTextDataInstances`)

    // Get all documents
    const providers = await db
      .collection('providers')
      .find({})
      .toArray()

    const rates = await db
      .collection('electricity-rates')
      .find({})
      .toArray()

    console.log(`   Found ${providers.length} providers`)
    console.log(`   Found ${rates.length} electricity rates\n`)

    // Sample 50 from each (or all if less than 50)
    const providerSample = getRandomSample(providers, 50)
    const rateSample = getRandomSample(rates, 50)

    console.log(`📊 Validating ${providerSample.length} providers (sample)...`)

    const allReferences = new Set()

    for (const doc of providerSample) {
      const refs = getDocumentReferences(doc)
      refs.forEach(ref => allReferences.add(ref))
      validateDocumentReferences(doc, 'provider', validInstanceIds)
      results.providersChecked++
    }

    console.log(`📊 Validating ${rateSample.length} rates (sample)...`)

    for (const doc of rateSample) {
      const refs = getDocumentReferences(doc)
      refs.forEach(ref => allReferences.add(ref))
      validateDocumentReferences(doc, 'rate', validInstanceIds)
      results.ratesChecked++
    }

    // Check for orphaned instances
    await checkOrphanedInstances(db, validInstanceIds, allReferences)

    console.log('\n✅ Relationship validation complete!\n')

    // Print results
    console.log('=' .repeat(80))
    console.log('RELATIONSHIP INTEGRITY VALIDATION RESULTS')
    console.log('=' .repeat(80))
    console.log()

    console.log('📊 Documents Checked:')
    console.log(`   Providers: ${results.providersChecked}`)
    console.log(`   Rates: ${results.ratesChecked}`)
    console.log(`   Total inline blocks checked: ${results.totalInlineBlocksChecked}`)
    console.log(`   Valid references: ${results.validReferences}`)
    console.log()

    console.log('📊 RichTextDataInstances:')
    console.log(`   Total instances: ${validInstanceIds.size}`)
    console.log(`   Unique references found: ${allReferences.size}`)
    console.log()

    if (results.brokenReferences.length > 0) {
      console.log('❌ Broken References (references to non-existent instances):')
      results.brokenReferences.forEach(({ docId, docType, referenceId, docTitle }) => {
        console.log(`   [${docType}] ${docTitle} (${docId})`)
        console.log(`      → References missing instance: ${referenceId}`)
      })
      console.log()
    }

    if (results.orphanedBlocks.length > 0) {
      console.log('⚠️  Orphaned RichTextDataInstances (not referenced by any document):')
      results.orphanedBlocks.forEach(({ instanceId, slug, type }) => {
        console.log(`   ${slug} (${type}) - ID: ${instanceId}`)
      })
      console.log()
      console.log('   Note: Orphaned instances are not critical errors, but may indicate')
      console.log('   unused data that could be cleaned up.')
      console.log()
    }

    console.log('=' .repeat(80))
    console.log()

    const totalIssues = results.brokenReferences.length

    console.log('Summary:')
    console.log(`  Documents checked: ${results.providersChecked + results.ratesChecked}`)
    console.log(`  Inline blocks validated: ${results.totalInlineBlocksChecked}`)
    console.log(`  Valid references: ${results.validReferences}`)
    console.log(`  Broken references: ${results.brokenReferences.length}`)
    console.log(`  Orphaned instances: ${results.orphanedBlocks.length} (warning only)`)
    console.log()

    // Exit code (orphaned instances are warnings, not failures)
    if (results.brokenReferences.length > 0) {
      console.log('❌ Relationship validation FAILED (broken references found)')
      process.exit(1)
    } else {
      console.log('✅ Relationship validation PASSED')
      if (results.orphanedBlocks.length > 0) {
        console.log('   (with warnings about orphaned instances)')
      }
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
validateRelationships()
