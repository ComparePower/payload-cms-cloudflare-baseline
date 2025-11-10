#!/usr/bin/env node
import { MongoClient } from 'mongodb'

const mongoUrl = process.env.MONGO_DB_CONN_STRING

const client = new MongoClient(mongoUrl)
await client.connect()

const db = client.db()
const collections = ['advisors', 'authors', 'categories', 'demos', 'faqs', 'media', 'otherpages', 'pages', 'posts', 'products', 'tags', 'team', 'richtextdatainstances']

for (const coll of collections) {
  try {
    await db.collection(coll).drop()
    console.log(`✅ Dropped: ${coll}`)
  } catch (e) {
    console.log(`ℹ️  ${coll}: ${e.message}`)
  }
}

await client.close()
console.log('\n✅ Old collections dropped')
