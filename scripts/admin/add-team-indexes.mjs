#!/usr/bin/env node
/**
 * Add missing indexes to Team collection
 *
 * Fixes "notablescan" errors when resolving team member relationships during import
 */

import { MongoClient } from 'mongodb'

const MONGO_DB_CONN_STRING = process.env.MONGO_DB_CONN_STRING

if (!MONGO_DB_CONN_STRING) {
  console.error('❌ ERROR: MONGO_DB_CONN_STRING environment variable not set')
  console.error('   Run with: ./scripts/doppler-run.sh dev node scripts/add-team-indexes.mjs')
  process.exit(1)
}

async function addTeamIndexes() {
  console.log('🔗 Connecting to MongoDB...')
  const client = new MongoClient(MONGO_DB_CONN_STRING)

  try {
    await client.connect()
    const db = client.db()
    const collection = db.collection('team')

    console.log('\n📊 Checking existing indexes...')
    const existingIndexes = await collection.indexes()
    console.log('Current indexes:', JSON.stringify(existingIndexes.map(i => i.name), null, 2))

    // Add slug index (for relationship resolution)
    console.log('\n🔧 Creating index on slug field...')
    await collection.createIndex(
      { slug: 1 },
      { name: 'slug_1', background: true }
    )
    console.log('✅ Created slug index')

    // Add _deleted index (for soft-delete queries)
    console.log('\n🔧 Creating index on _deleted field...')
    await collection.createIndex(
      { _deleted: 1 },
      { name: '_deleted_1', background: true }
    )
    console.log('✅ Created _deleted index')

    // Add compound index for common query pattern
    console.log('\n🔧 Creating compound index on slug + _deleted...')
    await collection.createIndex(
      { slug: 1, _deleted: 1 },
      { name: 'slug_1__deleted_1', background: true }
    )
    console.log('✅ Created compound index')

    console.log('\n📊 Final index list:')
    const finalIndexes = await collection.indexes()
    console.log(JSON.stringify(finalIndexes.map(i => ({ name: i.name, key: i.key })), null, 2))

    console.log('\n✅ All team indexes created successfully!')
    console.log('\n🎉 Import should now work without notablescan errors!')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    throw error
  } finally {
    await client.close()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

addTeamIndexes().catch(console.error)
