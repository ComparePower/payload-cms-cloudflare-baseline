#!/usr/bin/env node
/**
 * Ensure all required MongoDB indexes exist for Payload CMS collections
 *
 * This script is idempotent and safe to run multiple times.
 * Run this:
 * - After database migrations
 * - When adding new collections
 * - As part of deployment process
 * - When adding new relationship fields
 *
 * Usage: ./scripts/doppler-run.sh dev node scripts/ensure-indexes.mjs
 */

import { MongoClient } from 'mongodb'

const MONGO_DB_CONN_STRING = process.env.MONGO_DB_CONN_STRING

if (!MONGO_DB_CONN_STRING) {
  console.error('❌ Error: MONGO_DB_CONN_STRING environment variable not set')
  console.error('   Run this script via: ./scripts/doppler-run.sh dev node scripts/ensure-indexes.mjs')
  process.exit(1)
}

/**
 * Index definitions for all collections
 *
 * Format:
 * {
 *   collection: 'name',
 *   indexes: [
 *     { keys: { field: 1, ... }, options: { name: '...', ... } }
 *   ]
 * }
 */
const INDEX_DEFINITIONS = [
  // Team collection - used by relationship resolver
  {
    collection: 'team',
    indexes: [
      {
        keys: { slug: 1, _deleted: 1 },
        options: {
          name: 'slug_1__deleted_1',
          background: true,
          comment: 'Relationship resolver queries: { slug: value, _deleted: { $ne: true } }'
        }
      },
      {
        keys: { _deleted: 1 },
        options: {
          name: '_deleted_1',
          background: true,
          comment: 'Soft-delete filtering'
        }
      }
    ]
  },

  // Providers collection
  {
    collection: 'providers',
    indexes: [
      {
        keys: { slug: 1, _deleted: 1 },
        options: {
          name: 'slug_1__deleted_1',
          background: true,
          comment: 'Slug lookups with soft-delete filtering'
        }
      },
      {
        keys: { _deleted: 1 },
        options: {
          name: '_deleted_1',
          background: true,
          comment: 'Soft-delete filtering'
        }
      }
    ]
  },

  // Electricity Rates collection
  {
    collection: 'electricity-rates',
    indexes: [
      {
        keys: { slug: 1, _deleted: 1 },
        options: {
          name: 'slug_1__deleted_1',
          background: true,
          comment: 'Slug lookups with soft-delete filtering'
        }
      },
      {
        keys: { _deleted: 1 },
        options: {
          name: '_deleted_1',
          background: true,
          comment: 'Soft-delete filtering'
        }
      },
      {
        keys: { cityName: 1, _deleted: 1 },
        options: {
          name: 'cityName_1__deleted_1',
          background: true,
          comment: 'City-based queries'
        }
      }
    ]
  },

  // Rich Text Data Instances collection
  {
    collection: 'rich-text-data-instances',
    indexes: [
      {
        keys: { slug: 1, _deleted: 1 },
        options: {
          name: 'slug_1__deleted_1',
          background: true,
          comment: 'Inline block data resolution'
        }
      },
      {
        keys: { _deleted: 1 },
        options: {
          name: '_deleted_1',
          background: true,
          comment: 'Soft-delete filtering'
        }
      }
    ]
  }
]

async function ensureIndexes() {
  console.log('🔗 Connecting to MongoDB...')
  const client = new MongoClient(MONGO_DB_CONN_STRING)

  try {
    await client.connect()
    const db = client.db()

    console.log('\n📊 Ensuring indexes for all collections...\n')

    let totalCreated = 0
    let totalSkipped = 0
    let totalErrors = 0

    for (const collectionDef of INDEX_DEFINITIONS) {
      const { collection, indexes } = collectionDef

      console.log(`\n📁 Collection: ${collection}`)

      // Check if collection exists
      const collections = await db.listCollections({ name: collection }).toArray()
      if (collections.length === 0) {
        console.log(`   ⚠️  Collection does not exist yet - skipping`)
        continue
      }

      // Get existing indexes
      const existingIndexes = await db.collection(collection).indexes()
      const existingIndexNames = new Set(existingIndexes.map(idx => idx.name))

      for (const indexDef of indexes) {
        const { keys, options } = indexDef
        const indexName = options.name

        if (existingIndexNames.has(indexName)) {
          console.log(`   ✓ Index exists: ${indexName}`)
          totalSkipped++
        } else {
          try {
            await db.collection(collection).createIndex(keys, options)
            console.log(`   ✅ Created: ${indexName}`)
            totalCreated++
          } catch (err) {
            if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
              console.log(`   ℹ️  Index exists with different options: ${indexName}`)
              totalSkipped++
            } else {
              console.error(`   ❌ Failed to create ${indexName}:`, err.message)
              totalErrors++
            }
          }
        }
      }

      // Show all indexes for this collection
      const finalIndexes = await db.collection(collection).indexes()
      console.log(`   📋 Total indexes: ${finalIndexes.length}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('Summary:')
    console.log(`   ✅ Created: ${totalCreated}`)
    console.log(`   ✓ Already existed: ${totalSkipped}`)
    if (totalErrors > 0) {
      console.log(`   ❌ Errors: ${totalErrors}`)
    }
    console.log('='.repeat(60))

    if (totalErrors > 0) {
      console.log('\n⚠️  Some indexes failed to create. Check errors above.')
      process.exit(1)
    } else {
      console.log('\n✅ All indexes are up to date!')
    }

  } catch (error) {
    console.error('\n❌ Error ensuring indexes:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

ensureIndexes()
