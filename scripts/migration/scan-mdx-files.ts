#!/usr/bin/env node

/**
 * MDX File Scanner
 *
 * Recursively scans the Keystatic content directory and catalogs all .mdx files
 * with metadata about their collection and locale.
 *
 * Usage:
 *   npm run scan:mdx
 *   node scripts/migration/scan-mdx-files.js
 *   node scripts/migration/scan-mdx-files.js --output=custom-output.json
 */

import fs from 'fs/promises'
import path from 'path'
import { MdxFileInfo, ScanResult, ScanStats } from './lib/types'

// Configuration
const KEYSTATIC_DATA_DIR = process.env.KEYSTATIC_DATA_DIR ||
  '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/data'
const OUTPUT_FILE = process.env.OUTPUT_FILE ||
  path.join(process.cwd(), '.migration-cache/mdx-files-catalog.json')

/**
 * Extract collection name and locale from directory path
 *
 * Examples:
 *   /data/advisor/en/post-name/index.mdoc -> { collection: 'advisor', locale: 'en' }
 *   /data/team/john-doe.mdoc -> { collection: 'team', locale: null }
 */
function extractMetadata(relativePath: string): { collection: string; locale: string | null } {
  const parts = relativePath.split(path.sep).filter(Boolean)

  if (parts.length === 0) {
    return { collection: 'unknown', locale: null }
  }

  const collection = parts[0]

  // Check if second part is a locale (en, es, etc.)
  const possibleLocale = parts[1]
  const locale = possibleLocale && /^[a-z]{2}$/.test(possibleLocale) ? possibleLocale : null

  return { collection, locale }
}

/**
 * Recursively scan directory for .mdx and .mdoc files
 */
async function scanDirectory(dirPath: string, baseDir: string): Promise<MdxFileInfo[]> {
  const files: MdxFileInfo[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanDirectory(fullPath, baseDir)
        files.push(...subFiles)
      } else if (entry.isFile() && (entry.name.endsWith('.mdx') || entry.name.endsWith('.mdoc'))) {
        // Found an MDX/MDOC file
        const relativePath = path.relative(baseDir, fullPath)
        const { collection, locale } = extractMetadata(relativePath)
        const fileName = path.basename(entry.name, path.extname(entry.name))

        files.push({
          filePath: fullPath,
          relativePath,
          collection,
          locale,
          fileName,
          fullFileName: entry.name,
        })
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message)
    }
  }

  return files
}

/**
 * Calculate scan statistics
 */
function calculateStats(files: MdxFileInfo[], executionTimeMs: number): ScanStats {
  const collections = [...new Set(files.map(f => f.collection))].sort()
  const locales = [...new Set(files.map(f => f.locale).filter(Boolean) as string[])].sort()

  // Count directories by unique directory paths
  const directories = new Set(files.map(f => path.dirname(f.filePath)))

  return {
    totalFiles: files.length,
    totalDirectories: directories.size,
    executionTimeMs,
    collections,
    locales,
  }
}

/**
 * Main scanner function
 */
async function scanMdxFiles(): Promise<ScanResult> {
  const startTime = Date.now()

  console.log(`📂 Scanning directory: ${KEYSTATIC_DATA_DIR}`)
  console.log(`⏱️  Starting scan at ${new Date().toISOString()}`)

  // Check if directory exists
  try {
    await fs.access(KEYSTATIC_DATA_DIR)
  } catch (error) {
    throw new Error(`Directory not found: ${KEYSTATIC_DATA_DIR}`)
  }

  // Scan for files
  const files = await scanDirectory(KEYSTATIC_DATA_DIR, KEYSTATIC_DATA_DIR)

  const executionTimeMs = Date.now() - startTime
  const stats = calculateStats(files, executionTimeMs)

  const result: ScanResult = {
    files,
    stats,
    scannedAt: new Date().toISOString(),
  }

  // Log summary
  console.log(`\n✅ Scan complete!`)
  console.log(`   Files found: ${stats.totalFiles}`)
  console.log(`   Collections: ${stats.collections.join(', ')}`)
  console.log(`   Locales: ${stats.locales.join(', ')}`)
  console.log(`   Execution time: ${stats.executionTimeMs}ms`)

  return result
}

/**
 * Save result to JSON file
 */
async function saveResult(result: ScanResult, outputPath: string): Promise<void> {
  const dir = path.dirname(outputPath)

  // Ensure output directory exists
  await fs.mkdir(dir, { recursive: true })

  // Write JSON file with pretty formatting
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8')

  console.log(`\n💾 Results saved to: ${outputPath}`)
}

/**
 * CLI entry point
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2)
    const outputArg = args.find(arg => arg.startsWith('--output='))
    const outputPath = outputArg ? outputArg.split('=')[1] : OUTPUT_FILE

    // Run scanner
    const result = await scanMdxFiles()

    // Save results
    await saveResult(result, outputPath)

    // Exit successfully
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Export for testing
export { scanMdxFiles, scanDirectory, extractMetadata, calculateStats }

// Run if executed directly (ES module check)
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  main()
}
