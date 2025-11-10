#!/usr/bin/env node

/**
 * Component Catalog Generator
 *
 * Combines scanner and parser results to generate comprehensive component catalog
 *
 * Usage:
 *   pnpm run catalog:generate
 *   tsx scripts/migration/generate-component-catalog.ts
 *   tsx scripts/migration/generate-component-catalog.ts --catalog=/path/to/catalog.json
 */

import fs from 'fs/promises'
import path from 'path'
import { parseMdxFile } from './lib/mdx-parser-v2'
import { buildCatalog, generateMarkdownReport } from './lib/catalog-builder'
import type { ScanResult, ParsedMdxFile } from './lib/types'

// Configuration
const SCAN_CATALOG_FILE = process.env.SCAN_CATALOG_FILE ||
  path.join(process.cwd(), '.migration-cache/mdx-files-catalog.json')
const OUTPUT_DIR = process.env.OUTPUT_DIR ||
  path.join(process.cwd(), '.migration-cache')
const CATALOG_OUTPUT_FILE = path.join(OUTPUT_DIR, 'component-catalog.json')
const REPORT_OUTPUT_FILE = path.join(OUTPUT_DIR, 'component-catalog-report.md')

/**
 * Parse all files and generate catalog
 */
async function generateCatalog(scanCatalogPath: string): Promise<void> {
  console.log('\n📊 Component Catalog Generator')
  console.log('=' .repeat(50))

  const startTime = Date.now()

  // Load scan catalog
  console.log(`\n📂 Loading scan catalog: ${scanCatalogPath}`)
  const scanContent = await fs.readFile(scanCatalogPath, 'utf-8')
  const scanResult: ScanResult = JSON.parse(scanContent)

  console.log(`   Total files in catalog: ${scanResult.files.length}`)

  // Parse all files
  console.log(`\n🔍 Parsing components from all files...`)

  const parsedFiles: ParsedMdxFile[] = []
  let successCount = 0
  let errorCount = 0
  let totalComponentsFound = 0

  for (let i = 0; i < scanResult.files.length; i++) {
    const file = scanResult.files[i]
    const progress = `[${i + 1}/${scanResult.files.length}]`

    try {
      const result = await parseMdxFile(file.filePath)
      parsedFiles.push(result)

      if (result.errors.length > 0) {
        errorCount++
        console.log(`${progress} ⚠️  ${file.fileName} - Parse errors`)
      } else {
        successCount++
        totalComponentsFound += result.componentCount

        // Show progress every 25 files
        if ((i + 1) % 25 === 0 || i === 0) {
          console.log(`${progress} ✓ ${file.fileName} - ${result.componentCount} components`)
        }
      }
    } catch (error) {
      errorCount++
      console.log(`${progress} ❌ ${file.fileName} - Failed to parse`)
      parsedFiles.push({
        filePath: file.filePath,
        components: [],
        componentCount: 0,
        uniqueComponents: [],
        errors: [error instanceof Error ? error.message : String(error)],
      })
    }
  }

  const parsingTimeMs = Date.now() - startTime

  console.log(`\n✅ Parsing complete!`)
  console.log(`   Files processed: ${scanResult.files.length}`)
  console.log(`   Successful: ${successCount}`)
  console.log(`   With errors: ${errorCount}`)
  console.log(`   Total components found: ${totalComponentsFound}`)
  console.log(`   Parsing time: ${parsingTimeMs}ms`)

  // Build catalog
  console.log(`\n🏗️  Building component catalog...`)

  const catalog = buildCatalog(parsedFiles, parsingTimeMs)

  console.log(`   Unique component types: ${catalog.metadata.uniqueComponentTypes}`)
  console.log(`   Files with components: ${catalog.statistics.filesWithComponents}`)
  console.log(`   Files without components: ${catalog.statistics.filesWithoutComponents}`)

  if (catalog.statistics.mostUsedComponent) {
    console.log(`   Most used component: ${catalog.statistics.mostUsedComponent} (${catalog.statistics.mostUsedComponentCount} instances)`)
  }

  // Generate outputs
  console.log(`\n💾 Generating outputs...`)

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // Write JSON catalog
  await fs.writeFile(
    CATALOG_OUTPUT_FILE,
    JSON.stringify(catalog, null, 2),
    'utf-8'
  )
  console.log(`   ✓ JSON catalog: ${CATALOG_OUTPUT_FILE}`)

  // Generate and write Markdown report
  const markdownReport = generateMarkdownReport(catalog)
  await fs.writeFile(
    REPORT_OUTPUT_FILE,
    markdownReport,
    'utf-8'
  )
  console.log(`   ✓ Markdown report: ${REPORT_OUTPUT_FILE}`)

  const totalTime = Date.now() - startTime

  console.log(`\n🎉 Catalog generation complete!`)
  console.log(`   Total execution time: ${totalTime}ms`)

  if (totalTime > 10000) {
    console.log(`   ⚠️  Warning: Execution time exceeds 10s requirement (${totalTime}ms)`)
  } else {
    console.log(`   ✅ Performance requirement met (<10s)`)
  }

  // Print top 5 components
  console.log(`\n📋 Top 5 Components by Usage:`)
  const topComponents = Object.values(catalog.components)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  for (let i = 0; i < topComponents.length; i++) {
    const comp = topComponents[i]
    const propCount = Object.keys(comp.props).length
    console.log(`   ${i + 1}. ${comp.name} - ${comp.count} instances, ${propCount} unique props`)
  }

  console.log('\n')
}

/**
 * CLI entry point
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2)
    const catalogArg = args.find(arg => arg.startsWith('--catalog='))

    const scanCatalogPath = catalogArg
      ? catalogArg.split('=')[1]
      : SCAN_CATALOG_FILE

    await generateCatalog(scanCatalogPath)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  main()
}

// Export for testing
export { generateCatalog }
