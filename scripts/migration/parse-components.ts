#!/usr/bin/env node

/**
 * Component Usage Parser
 *
 * Parses MDX files to extract JSX component usage and props
 *
 * Usage:
 *   npm run parse:components
 *   tsx scripts/migration/parse-components.ts --file=/path/to/file.mdx
 *   tsx scripts/migration/parse-components.ts --catalog=.migration-cache/mdx-files-catalog.json
 */

import fs from 'fs/promises'
import path from 'path'
import { parseMdxFile } from './lib/mdx-parser-v2'
import type { ParsedMdxFile, ScanResult } from './lib/types'

// Configuration
const CATALOG_FILE =  process.env.CATALOG_FILE ||
  path.join(process.cwd(), '.migration-cache/mdx-files-catalog.json')
const OUTPUT_DIR = process.env.OUTPUT_DIR ||
  path.join(process.cwd(), '.migration-cache/components-parsed')

/**
 * Parse a single file and output results
 */
async function parseSingleFile(filePath: string): Promise<void> {
  console.log(`\n📄 Parsing file: ${filePath}`)

  const result = await parseMdxFile(filePath)

  console.log(`   Components found: ${result.componentCount}`)
  console.log(`   Unique components: ${result.uniqueComponents.join(', ') || 'none'}`)

  if (result.errors.length > 0) {
    console.log(`   ⚠️  Errors: ${result.errors.length}`)
    result.errors.forEach(err => console.log(`      - ${err}`))
  }

  // Output to file
  const outputFile = path.join(OUTPUT_DIR, 'single-file-result.json')
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  await fs.writeFile(outputFile, JSON.stringify(result, null, 2), 'utf-8')

  console.log(`\n💾 Results saved to: ${outputFile}`)
}

/**
 * Parse all files from catalog
 */
async function parseFromCatalog(catalogPath: string): Promise<void> {
  console.log(`\n📂 Loading catalog: ${catalogPath}`)

  // Load catalog
  const catalogContent = await fs.readFile(catalogPath, 'utf-8')
  const catalog: ScanResult = JSON.parse(catalogContent)

  console.log(`   Total files in catalog: ${catalog.files.length}`)
  console.log(`\n🔍 Starting component parsing...`)

  const startTime = Date.now()
  const results: ParsedMdxFile[] = []
  let successCount = 0
  let errorCount = 0

  // Parse each file
  for (let i = 0; i < catalog.files.length; i++) {
    const file = catalog.files[i]
    const progress = `[${i + 1}/${catalog.files.length}]`

    try {
      const result = await parseMdxFile(file.filePath)
      results.push(result)

      if (result.errors.length > 0) {
        errorCount++
        console.log(`${progress} ⚠️  ${file.relativePath} - ${result.errors.length} errors`)
      } else {
        successCount++
        if ((i + 1) % 10 === 0 || i === 0) {
          console.log(`${progress} ✓ ${file.relativePath} - ${result.componentCount} components`)
        }
      }
    } catch (error) {
      errorCount++
      console.log(`${progress} ❌ ${file.relativePath} - Parse failed`)
      results.push({
        filePath: file.filePath,
        components: [],
        componentCount: 0,
        uniqueComponents: [],
        errors: [error instanceof Error ? error.message : String(error)],
      })
    }
  }

  const executionTimeMs = Date.now() - startTime

  // Calculate aggregate statistics
  const totalComponents = results.reduce((sum, r) => sum + r.componentCount, 0)
  const allUniqueComponents = [
    ...new Set(results.flatMap(r => r.uniqueComponents)),
  ].sort()

  console.log(`\n✅ Parsing complete!`)
  console.log(`   Files processed: ${catalog.files.length}`)
  console.log(`   Successful: ${successCount}`)
  console.log(`   With errors: ${errorCount}`)
  console.log(`   Total components found: ${totalComponents}`)
  console.log(`   Unique component types: ${allUniqueComponents.length}`)
  console.log(`   Components: ${allUniqueComponents.join(', ')}`)
  console.log(`   Execution time: ${executionTimeMs}ms`)

  // Save individual results
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  for (const result of results) {
    const fileName = path.basename(result.filePath, path.extname(result.filePath)) + '.json'
    const outputFile = path.join(OUTPUT_DIR, fileName)
    await fs.writeFile(outputFile, JSON.stringify(result, null, 2), 'utf-8')
  }

  // Save aggregate summary
  const summary = {
    totalFiles: catalog.files.length,
    successCount,
    errorCount,
    totalComponents,
    uniqueComponents: allUniqueComponents,
    executionTimeMs,
    parsedAt: new Date().toISOString(),
  }

  const summaryFile = path.join(OUTPUT_DIR, '_summary.json')
  await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2), 'utf-8')

  console.log(`\n💾 Results saved to: ${OUTPUT_DIR}`)
  console.log(`   Individual files: ${results.length} JSON files`)
  console.log(`   Summary: ${summaryFile}`)
}

/**
 * CLI entry point
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2)
    const fileArg = args.find(arg => arg.startsWith('--file='))
    const catalogArg = args.find(arg => arg.startsWith('--catalog='))

    if (fileArg) {
      // Parse single file
      const filePath = fileArg.split('=')[1]
      await parseSingleFile(filePath)
    } else if (catalogArg) {
      // Parse from custom catalog
      const catalogPath = catalogArg.split('=')[1]
      await parseFromCatalog(catalogPath)
    } else {
      // Default: parse from catalog
      await parseFromCatalog(CATALOG_FILE)
    }

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  main()
}

// Export for testing
export { parseSingleFile, parseFromCatalog }
