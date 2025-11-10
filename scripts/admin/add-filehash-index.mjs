#!/usr/bin/env node
/**
 * Add fileHash index to media collection for deduplication
 */

import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_DB_CONN_STRING

if (!MONGO_URI) {
  console.error('❌ MONGO_DB_CONN_STRING environment variable not set')
  process.exit(1)
}

async function main() {
  const client = new MongoClient(MONGO_URI)

  try {
    await client.connect()
    console.log('✓ Connected to MongoDB\n')

    const db = client.db()

    // Create compound index for fileHash + mimeType (for deduplication query)
    console.log('Creating compound fileHash+mimeType index...')
    try {
      await db.collection('media').createIndex(
        { fileHash: 1, mimeType: 1 },
        { name: 'fileHash_mimeType_1', background: true }
      )
      console.log('✓ Created compound index\n')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✓ Compound index already exists\n')
      } else {
        throw error
      }
    }

    // List indexes
    console.log('Current indexes on media collection:')
    const indexes = await db.collection('media').listIndexes().toArray()
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`)
    })

    console.log('\n✅ Index creation complete!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

main()
