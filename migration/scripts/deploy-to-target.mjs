#!/usr/bin/env node
/**
 * Deploy to Target Payload Project
 *
 * Copies generated Payload configs to target project:
 * - Detects conflicts with existing collections
 * - Backs up existing files
 * - Copies generated files
 * - Updates payload.config.ts
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GENERATED_DIR = path.join(__dirname, '../generated')
const TARGET_PROJECT = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo'
const TARGET_COLLECTIONS = path.join(TARGET_PROJECT, 'src/collections')
const TARGET_BLOCKS = path.join(TARGET_PROJECT, 'src/lexical/blocks')
const TARGET_CONFIG = path.join(TARGET_PROJECT, 'src/payload.config.ts')

// Parse command line args
const args = process.argv.slice(2)
const AUTO_MODE = args.includes('--auto') || args.includes('--yes')

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
 * Backup existing file
 */
async function backupFile(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = `${filePath}.backup-${timestamp}`
  await fs.copyFile(filePath, backupPath)
  console.log(`  📦 Backed up: ${path.basename(backupPath)}`)
  return backupPath
}

/**
 * Copy directory recursively
 */
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
      console.log(`  ✓ Copied: ${entry.name}`)
    }
  }
}

/**
 * Update payload.config.ts with new collections
 */
async function updatePayloadConfig() {
  console.log('\n📝 Updating payload.config.ts...')

  const configContent = await fs.readFile(TARGET_CONFIG, 'utf-8')

  // Check if collections already imported
  const hasProviders = configContent.includes("from './collections/Providers'") ||
                       configContent.includes('from "./collections/Providers"')
  const hasTeam = configContent.includes("from './collections/Team'") ||
                  configContent.includes('from "./collections/Team"')
  const hasFAQs = configContent.includes("from './collections/FAQs'") ||
                  configContent.includes('from "./collections/FAQs"')

  if (hasProviders && hasTeam && hasFAQs) {
    console.log('  ✓ Collections already imported in payload.config.ts')
    return
  }

  // Backup config first
  await backupFile(TARGET_CONFIG)

  // Add imports at top (after existing imports)
  let updatedConfig = configContent

  // Find the last import statement
  const importLines = configContent.split('\n')
  let lastImportIndex = 0
  for (let i = 0; i < importLines.length; i++) {
    if (importLines[i].trim().startsWith('import ')) {
      lastImportIndex = i
    }
  }

  // Insert our imports after last import
  const newImports = []
  if (!hasProviders) newImports.push("import { Providers } from './collections/Providers'")
  if (!hasTeam) newImports.push("import { Team } from './collections/Team'")
  if (!hasFAQs) newImports.push("import { FAQs } from './collections/FAQs'")

  if (newImports.length > 0) {
    importLines.splice(lastImportIndex + 1, 0, '', '// Migration generated collections', ...newImports)
    updatedConfig = importLines.join('\n')
  }

  // Add to collections array
  // Find collections: [ ... ]
  const collectionsMatch = updatedConfig.match(/collections:\s*\[([\s\S]*?)\]/m)
  if (collectionsMatch) {
    const existingCollections = collectionsMatch[1]

    // Check if already added
    if (!existingCollections.includes('Providers') && !hasProviders) {
      const newCollections = existingCollections.trim() +
        (existingCollections.trim().endsWith(',') ? '' : ',') +
        '\n    Providers,\n    Team,\n    FAQs,'

      updatedConfig = updatedConfig.replace(
        /collections:\s*\[([\s\S]*?)\]/m,
        `collections: [${newCollections}\n  ]`
      )
    }
  }

  // Write updated config
  await fs.writeFile(TARGET_CONFIG, updatedConfig)
  console.log('  ✓ Updated payload.config.ts')
}

/**
 * Deploy collections
 */
async function deployCollections() {
  console.log('\n📦 Deploying collections...')

  const collections = ['Providers.ts', 'Team.ts', 'FAQs.ts']

  for (const collection of collections) {
    const src = path.join(GENERATED_DIR, 'collections', collection)
    const dest = path.join(TARGET_COLLECTIONS, collection)

    // Check if exists and backup
    if (await fileExists(dest)) {
      if (!AUTO_MODE) {
        console.log(`  ⚠️  ${collection} already exists`)
      }
      await backupFile(dest)
    }

    // Copy
    await fs.copyFile(src, dest)
    console.log(`  ✓ Deployed: ${collection}`)
  }
}

/**
 * Deploy blocks
 */
async function deployBlocks() {
  console.log('\n📦 Deploying blocks...')

  const blocksDir = path.join(GENERATED_DIR, 'blocks')
  const blocks = await fs.readdir(blocksDir)

  let count = 0
  for (const block of blocks) {
    const src = path.join(blocksDir, block)
    const dest = path.join(TARGET_BLOCKS, block)

    // Skip if directory
    const stat = await fs.stat(src)
    if (stat.isDirectory()) continue

    // Backup if exists
    if (await fileExists(dest)) {
      await backupFile(dest)
    }

    // Copy
    await fs.copyFile(src, dest)
    count++
  }

  console.log(`  ✓ Deployed ${count} blocks`)
}

/**
 * Update Providers collection to import blocks
 */
async function updateProvidersWithBlocks() {
  console.log('\n📝 Updating Providers collection with block imports...')

  const providersPath = path.join(TARGET_COLLECTIONS, 'Providers.ts')
  let content = await fs.readFile(providersPath, 'utf-8')

  // Get all block files
  const blocksDir = path.join(TARGET_BLOCKS)
  const blockFiles = await fs.readdir(blocksDir)
  const blockNames = blockFiles
    .filter(f => f.endsWith('Block.ts'))
    .map(f => f.replace('.ts', ''))

  // Add imports at top
  const blockImports = blockNames
    .map(name => `import { ${name} } from '../lexical/blocks/${name}'`)
    .join('\n')

  // Find where to insert imports (after existing imports)
  const lines = content.split('\n')
  let lastImportIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i
    }
  }

  lines.splice(lastImportIndex + 1, 0, '', '// Generated block imports', blockImports)
  content = lines.join('\n')

  // Replace the contentBlocks field's blocks array
  const blockList = blockNames.map(name => `      ${name},`).join('\n')

  content = content.replace(
    /blocks:\s*\[\/\*\s*Import all generated blocks\s*\*\/\]/,
    `blocks: [\n${blockList}\n    ]`
  )

  await fs.writeFile(providersPath, content)
  console.log('  ✓ Updated Providers.ts with block imports')
}

/**
 * Main deployment
 */
async function deploy() {
  console.log('🚀 Starting Deployment to Target...\n')

  if (AUTO_MODE) {
    console.log('🤖 Running in AUTO mode (will backup and replace existing files)\n')
  }

  // Check target directories exist
  console.log('🔍 Checking target project...')

  if (!(await fileExists(TARGET_COLLECTIONS))) {
    await fs.mkdir(TARGET_COLLECTIONS, { recursive: true })
    console.log('  ✓ Created collections directory')
  }

  if (!(await fileExists(TARGET_BLOCKS))) {
    await fs.mkdir(TARGET_BLOCKS, { recursive: true })
    console.log('  ✓ Created blocks directory')
  }

  // Deploy files
  await deployCollections()
  await deployBlocks()
  await updateProvidersWithBlocks()
  await updatePayloadConfig()

  console.log('\n✅ Deployment Complete!\n')
  console.log('📋 Next steps:')
  console.log('  1. Restart Payload: pkill -f "pnpm dev" && pnpm dev')
  console.log('  2. Test: node migration/scripts/test-target-payload.mjs')
  console.log('  3. Seed: node migration/scripts/seed-database.mjs')
}

// Run deployment
deploy().catch(console.error)
