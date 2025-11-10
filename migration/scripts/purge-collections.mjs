#!/usr/bin/env node
/**
 * Purge Collections - Complete Cleanup Tool
 *
 * Removes collections from:
 * - MongoDB database
 * - Payload schema (src/collections/)
 * - payload.config.ts imports and references
 *
 * Usage:
 *   # Interactive mode - asks which collections to purge
 *   ./scripts/doppler-run.sh dev node migration/scripts/purge-collections.mjs
 *
 *   # Auto mode - purge specific collections
 *   ./scripts/doppler-run.sh dev node migration/scripts/purge-collections.mjs --collections providers,team
 *
 *   # Purge all migrated collections
 *   ./scripts/doppler-run.sh dev node migration/scripts/purge-collections.mjs --all
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { MongoClient } from 'mongodb'
import readline from 'readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.join(__dirname, '../..')
const COLLECTIONS_DIR = path.join(PROJECT_ROOT, 'src/collections')
const CONFIG_FILE = path.join(PROJECT_ROOT, 'src/payload.config.ts')

// Parse command line args
const args = process.argv.slice(2)
const AUTO_MODE = args.includes('--all')
const SPECIFIC_COLLECTIONS = args.find(arg => arg.startsWith('--collections='))
  ?.split('=')[1]
  ?.split(',')
  .map(c => c.trim())

/**
 * Ask user a question
 */
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => rl.question(query, ans => {
    rl.close()
    resolve(ans)
  }))
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Backup file
 */
async function backupFile(filePath) {
  if (!(await fileExists(filePath))) return null

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = `${filePath}.backup-${timestamp}`
  await fs.copyFile(filePath, backupPath)
  console.log(`   📦 Backed up: ${path.basename(backupPath)}`)
  return backupPath
}

/**
 * Find all collection directories in src/collections/
 */
async function findCollectionDirs() {
  const entries = await fs.readdir(COLLECTIONS_DIR, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
}

/**
 * Find all collection TypeScript files (non-directory collections)
 */
async function findCollectionFiles() {
  const entries = await fs.readdir(COLLECTIONS_DIR, { withFileTypes: true })
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.ts'))
    .map(entry => entry.name.replace('.ts', ''))
}

/**
 * Get all collections (both directory and file-based)
 */
async function getAllCollections() {
  const dirs = await findCollectionDirs()
  const files = await findCollectionFiles()
  return [...dirs, ...files].sort()
}

/**
 * Purge collection from MongoDB
 */
async function purgeFromDatabase(client, collectionName) {
  console.log(`\n🗑️  Purging "${collectionName}" from MongoDB...`)

  try {
    const db = client.db()
    const collections = await db.listCollections({ name: collectionName }).toArray()

    if (collections.length === 0) {
      console.log(`   ℹ️  Collection "${collectionName}" not found in database`)
      return { dropped: false, count: 0 }
    }

    // Get count before dropping
    const count = await db.collection(collectionName).countDocuments()

    // Drop collection
    await db.collection(collectionName).drop()
    console.log(`   ✅ Dropped collection "${collectionName}" (${count} documents)`)

    return { dropped: true, count }
  } catch (error) {
    console.error(`   ❌ Failed to drop collection: ${error.message}`)
    return { dropped: false, count: 0, error: error.message }
  }
}

/**
 * Remove collection from filesystem
 */
async function removeFromFilesystem(collectionName) {
  console.log(`\n🗑️  Removing "${collectionName}" from filesystem...`)

  // Check if it's a directory or file
  const dirPath = path.join(COLLECTIONS_DIR, collectionName)
  const filePath = path.join(COLLECTIONS_DIR, `${collectionName}.ts`)

  let removed = false

  if (await fileExists(dirPath)) {
    // Backup entire directory
    const backupPath = `${dirPath}.backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`
    await fs.rename(dirPath, backupPath)
    console.log(`   📦 Backed up directory to: ${path.basename(backupPath)}`)
    removed = true
  }

  if (await fileExists(filePath)) {
    await backupFile(filePath)
    await fs.unlink(filePath)
    console.log(`   ✅ Removed file: ${collectionName}.ts`)
    removed = true
  }

  if (!removed) {
    console.log(`   ℹ️  No files found for "${collectionName}"`)
  }

  return removed
}

/**
 * Remove collection from payload.config.ts
 */
async function removeFromConfig(collectionName) {
  console.log(`\n📝 Updating payload.config.ts...`)

  // Backup config
  await backupFile(CONFIG_FILE)

  let content = await fs.readFile(CONFIG_FILE, 'utf-8')
  let changed = false

  // Remove import statement (both directory and file imports)
  const importPatterns = [
    new RegExp(`import\\s*{\\s*${collectionName}\\s*}\\s*from\\s*['"]@/collections/${collectionName}['"]\\s*\\n?`, 'g'),
    new RegExp(`import\\s*{\\s*${collectionName}\\s*}\\s*from\\s*['"]\\./collections/${collectionName}['"]\\s*\\n?`, 'g'),
    new RegExp(`import\\s*{\\s*${collectionName}\\s*}\\s*from\\s*['"]@/collections/${collectionName}/index['"]\\s*\\n?`, 'g'),
    new RegExp(`import\\s*{\\s*${collectionName}\\s*}\\s*from\\s*['"]\\./collections/${collectionName}/index['"]\\s*\\n?`, 'g'),
  ]

  for (const pattern of importPatterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, '')
      changed = true
      console.log(`   ✓ Removed import for ${collectionName}`)
    }
  }

  // Remove from collections array
  const collectionsArrayMatch = content.match(/collections:\s*\[([\s\S]*?)\]/m)
  if (collectionsArrayMatch) {
    const originalArray = collectionsArrayMatch[0]
    let modifiedArray = originalArray

    // Remove the collection reference (with optional trailing comma and newline)
    modifiedArray = modifiedArray.replace(new RegExp(`\\s*${collectionName},?\\s*\\n?`, 'g'), '\n')

    if (modifiedArray !== originalArray) {
      content = content.replace(originalArray, modifiedArray)
      changed = true
      console.log(`   ✓ Removed ${collectionName} from collections array`)
    }
  }

  // Remove any "Migration generated collections" comments if no imports follow
  const lines = content.split('\n')
  const filteredLines = []
  let skipNextEmptyLines = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.includes('// Migration generated collections')) {
      // Check if next non-empty line is an import
      let hasImportAfter = false
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '') continue
        if (lines[j].trim().startsWith('import ')) {
          hasImportAfter = true
          break
        }
        break
      }

      if (!hasImportAfter) {
        skipNextEmptyLines = true
        continue // Skip the comment line
      }
    }

    if (skipNextEmptyLines && line.trim() === '') {
      continue // Skip empty lines after removed comment
    }

    skipNextEmptyLines = false
    filteredLines.push(line)
  }

  if (filteredLines.length !== lines.length) {
    content = filteredLines.join('\n')
    changed = true
  }

  if (changed) {
    await fs.writeFile(CONFIG_FILE, content)
    console.log(`   ✅ Updated payload.config.ts`)
  } else {
    console.log(`   ℹ️  No changes needed in payload.config.ts`)
  }

  return changed
}

/**
 * Purge a single collection (database + filesystem + config)
 */
async function purgeCollection(client, collectionName) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🗑️  PURGING COLLECTION: ${collectionName}`)
  console.log('='.repeat(60))

  const results = {
    collection: collectionName,
    database: null,
    filesystem: null,
    config: null
  }

  // 1. Purge from database
  results.database = await purgeFromDatabase(client, collectionName.toLowerCase())

  // 2. Remove from filesystem
  results.filesystem = await removeFromFilesystem(collectionName)

  // 3. Update config
  results.config = await removeFromConfig(collectionName)

  return results
}

/**
 * Main purge process
 */
async function purge() {
  console.log('🧹 Collection Purge Tool\n')

  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...')
  const mongoUrl = process.env.MONGO_DB_CONN_STRING

  if (!mongoUrl) {
    console.error('❌ MONGO_DB_CONN_STRING not found in environment')
    console.error('   Make sure to run with Doppler: ./scripts/doppler-run.sh dev node ...')
    process.exit(1)
  }

  const client = new MongoClient(mongoUrl)
  await client.connect()
  console.log('✅ Connected to MongoDB\n')

  try {
    // Get all available collections
    const allCollections = await getAllCollections()

    if (allCollections.length === 0) {
      console.log('ℹ️  No collections found to purge')
      return
    }

    console.log('📋 Available collections:')
    allCollections.forEach((col, i) => {
      console.log(`   ${i + 1}. ${col}`)
    })
    console.log()

    // Determine which collections to purge
    let collectionsToPurge = []

    if (AUTO_MODE) {
      collectionsToPurge = allCollections
      console.log('🤖 AUTO MODE: Will purge ALL collections\n')
    } else if (SPECIFIC_COLLECTIONS) {
      collectionsToPurge = SPECIFIC_COLLECTIONS.filter(c =>
        allCollections.some(ac => ac.toLowerCase() === c.toLowerCase())
      )
      console.log(`📝 Purging specified collections: ${collectionsToPurge.join(', ')}\n`)
    } else {
      // Interactive mode
      const answer = await askQuestion('Which collections to purge? (comma-separated names or "all"): ')

      if (answer.toLowerCase() === 'all') {
        collectionsToPurge = allCollections
      } else {
        const requested = answer.split(',').map(s => s.trim()).filter(s => s)
        collectionsToPurge = requested.filter(c =>
          allCollections.some(ac => ac.toLowerCase() === c.toLowerCase())
        )
      }
    }

    if (collectionsToPurge.length === 0) {
      console.log('ℹ️  No collections to purge')
      return
    }

    // Confirm
    if (!AUTO_MODE) {
      console.log(`\n⚠️  About to purge ${collectionsToPurge.length} collection(s):`)
      collectionsToPurge.forEach(c => console.log(`   - ${c}`))
      console.log('\nThis will:')
      console.log('  1. Drop MongoDB collections')
      console.log('  2. Delete collection files from src/collections/')
      console.log('  3. Remove from payload.config.ts')
      console.log('  4. Backup everything first\n')

      const confirm = await askQuestion('Continue? (yes/no): ')

      if (confirm.toLowerCase() !== 'yes') {
        console.log('\n❌ Aborted')
        return
      }
    }

    // Purge each collection
    const results = []
    for (const collectionName of collectionsToPurge) {
      const result = await purgeCollection(client, collectionName)
      results.push(result)
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`)
    console.log('📊 PURGE SUMMARY')
    console.log('='.repeat(60))

    results.forEach(r => {
      console.log(`\n${r.collection}:`)
      console.log(`  Database: ${r.database?.dropped ? `✅ Dropped (${r.database.count} docs)` : '❌ Not dropped'}`)
      console.log(`  Filesystem: ${r.filesystem ? '✅ Removed' : '❌ Not removed'}`)
      console.log(`  Config: ${r.config ? '✅ Updated' : '❌ Not updated'}`)
    })

    console.log(`\n✅ Purge complete!`)
    console.log('\n📋 Next steps:')
    console.log('  1. Restart Payload server: pkill -f "pnpm dev" && ./scripts/doppler-run.sh dev pnpm dev')
    console.log('  2. Verify in admin UI: http://localhost:3002/admin')
    console.log('  3. Check backups if needed (*.backup-* files)\n')

  } finally {
    await client.close()
  }
}

// Run purge
purge().catch(error => {
  console.error('\n💥 Fatal error:', error.message)
  console.error(error.stack)
  process.exit(1)
})
