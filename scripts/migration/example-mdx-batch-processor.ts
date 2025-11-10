/**
 * Example: Batch MDX Processor
 *
 * Demonstrates how to use the MDX pipeline modules (T007-T010)
 * to process multiple MDX files in batch.
 *
 * This example shows:
 * 1. Finding all MDX files
 * 2. Parsing frontmatter + content
 * 3. Converting to Lexical JSON
 * 4. Extracting inline components
 * 5. Mapping components to providers
 * 6. Generating Payload-ready data
 *
 * Usage:
 *   tsx scripts/migration/example-mdx-batch-processor.ts [source-dir]
 */

import { parseMdxFile, validateFrontmatter, extractExcerpt } from './lib/mdx-parser'
import { convertMdxToLexical } from './lib/mdx-to-lexical-converter'
import { extractInlineComponents } from './lib/inline-component-extractor'
import {
  getProviderFromComponent,
  generateInlineBlockSlug,
  generateInlineBlockName
} from './lib/component-to-provider-mapping'
import { readdir, stat } from 'fs/promises'
import { join, relative } from 'path'

interface ProcessedMdxFile {
  filePath: string
  relativePath: string
  frontmatter: Record<string, any>
  lexicalContent: any
  inlineComponents: Array<{
    name: string
    provider?: string
    slug?: string
    displayName?: string
    props: Record<string, any>
  }>
  excerpt: string
  errors: string[]
  processingTimeMs: number
}

/**
 * Find all MDX files in a directory recursively
 */
async function findMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)

      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath)
        }
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(fullPath)
      }
    }
  }

  await walk(dir)
  return files
}

/**
 * Process a single MDX file through the complete pipeline
 */
async function processMdxFile(filePath: string, sourceDir: string): Promise<ProcessedMdxFile> {
  const startTime = Date.now()
  const errors: string[] = []

  try {
    // Step 1: Parse frontmatter and content (T007)
    const parsed = await parseMdxFile(filePath)
    errors.push(...parsed.errors)

    // Validate required fields
    const requiredFields = ['title'] // Adjust based on your schema
    const missingFields = validateFrontmatter(parsed.frontmatter, requiredFields)
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`)
    }

    // Step 2: Convert to Lexical JSON (T008)
    const lexical = await convertMdxToLexical(parsed.content)

    // Step 3: Extract inline components (T009)
    const { lexicalJSON, components } = extractInlineComponents(lexical)

    // Step 4: Map components to providers (T010)
    const enrichedComponents = components.map(comp => {
      const provider = getProviderFromComponent(comp.name)

      return {
        name: comp.name,
        props: comp.props,
        provider,
        slug: provider ? generateInlineBlockSlug(comp.name, provider) : undefined,
        displayName: provider ? generateInlineBlockName(comp.name, provider) : undefined
      }
    })

    // Generate excerpt from content
    const excerpt = extractExcerpt(parsed.content, 200)

    return {
      filePath,
      relativePath: relative(sourceDir, filePath),
      frontmatter: parsed.frontmatter,
      lexicalContent: lexicalJSON,
      inlineComponents: enrichedComponents,
      excerpt,
      errors,
      processingTimeMs: Date.now() - startTime
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    errors.push(`Processing failed: ${errorMessage}`)

    return {
      filePath,
      relativePath: relative(sourceDir, filePath),
      frontmatter: {},
      lexicalContent: { root: { type: 'root', children: [] } },
      inlineComponents: [],
      excerpt: '',
      errors,
      processingTimeMs: Date.now() - startTime
    }
  }
}

/**
 * Process multiple MDX files in parallel chunks
 */
async function processMdxBatch(
  filePaths: string[],
  sourceDir: string,
  chunkSize: number = 10
): Promise<ProcessedMdxFile[]> {
  const results: ProcessedMdxFile[] = []

  // Process in chunks to avoid overwhelming the system
  for (let i = 0; i < filePaths.length; i += chunkSize) {
    const chunk = filePaths.slice(i, i + chunkSize)

    console.log(`Processing batch ${Math.floor(i / chunkSize) + 1}/${Math.ceil(filePaths.length / chunkSize)} (${chunk.length} files)...`)

    const chunkResults = await Promise.all(
      chunk.map(filePath => processMdxFile(filePath, sourceDir))
    )

    results.push(...chunkResults)

    // Show progress
    const successCount = chunkResults.filter(r => r.errors.length === 0).length
    const errorCount = chunkResults.filter(r => r.errors.length > 0).length
    console.log(`  ✓ ${successCount} success, ${errorCount > 0 ? '✗ ' + errorCount + ' errors' : ''}`)
  }

  return results
}

/**
 * Generate summary statistics
 */
function generateSummary(results: ProcessedMdxFile[]) {
  const totalFiles = results.length
  const successFiles = results.filter(r => r.errors.length === 0).length
  const errorFiles = results.filter(r => r.errors.length > 0).length

  const totalComponents = results.reduce((sum, r) => sum + r.inlineComponents.length, 0)
  const componentNames = new Set(
    results.flatMap(r => r.inlineComponents.map(c => c.name))
  )

  const totalProcessingTime = results.reduce((sum, r) => sum + r.processingTimeMs, 0)
  const avgProcessingTime = totalProcessingTime / totalFiles

  // Component usage stats
  const componentUsage = new Map<string, number>()
  for (const result of results) {
    for (const comp of result.inlineComponents) {
      componentUsage.set(comp.name, (componentUsage.get(comp.name) || 0) + 1)
    }
  }

  const topComponents = Array.from(componentUsage.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return {
    totalFiles,
    successFiles,
    errorFiles,
    totalComponents,
    uniqueComponents: componentNames.size,
    totalProcessingTimeMs: totalProcessingTime,
    avgProcessingTimeMs: avgProcessingTime,
    topComponents
  }
}

/**
 * Main function
 */
async function main() {
  const sourceDir = process.argv[2] || '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/.migration-backup-20251013-172540/posts'

  console.log('📦 MDX Batch Processor')
  console.log('='.repeat(80))
  console.log(`Source: ${sourceDir}\n`)

  // Step 1: Find all MDX files
  console.log('🔍 Finding MDX files...')
  const mdxFiles = await findMdxFiles(sourceDir)
  console.log(`✅ Found ${mdxFiles.length} MDX files\n`)

  if (mdxFiles.length === 0) {
    console.log('⚠️  No MDX files found. Exiting.')
    return
  }

  // Limit for demo (remove this in production)
  const filesToProcess = mdxFiles.slice(0, 20)
  console.log(`📝 Processing ${filesToProcess.length} files (limited for demo)...\n`)

  // Step 2: Process files
  const startTime = Date.now()
  const results = await processMdxBatch(filesToProcess, sourceDir, 5)
  const totalTime = Date.now() - startTime

  // Step 3: Generate summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 Processing Summary')
  console.log('='.repeat(80))

  const summary = generateSummary(results)

  console.log(`\nFiles:`)
  console.log(`  Total: ${summary.totalFiles}`)
  console.log(`  Success: ${summary.successFiles}`)
  console.log(`  Errors: ${summary.errorFiles}`)

  console.log(`\nComponents:`)
  console.log(`  Total instances: ${summary.totalComponents}`)
  console.log(`  Unique components: ${summary.uniqueComponents}`)

  if (summary.topComponents.length > 0) {
    console.log(`\n  Top components:`)
    for (const [name, count] of summary.topComponents) {
      console.log(`    - ${name}: ${count}`)
    }
  }

  console.log(`\nPerformance:`)
  console.log(`  Total time: ${totalTime}ms`)
  console.log(`  Avg per file: ${summary.avgProcessingTimeMs.toFixed(2)}ms`)

  // Step 4: Show sample results
  console.log('\n' + '='.repeat(80))
  console.log('📄 Sample Results')
  console.log('='.repeat(80))

  const sampleResults = results.slice(0, 3)
  for (const result of sampleResults) {
    console.log(`\n${result.relativePath}`)
    console.log(`  Frontmatter: ${Object.keys(result.frontmatter).length} fields`)
    console.log(`  Lexical nodes: ${result.lexicalContent.root.children.length}`)
    console.log(`  Inline components: ${result.inlineComponents.length}`)

    if (result.inlineComponents.length > 0) {
      for (const comp of result.inlineComponents) {
        console.log(`    - ${comp.name} → ${comp.provider || 'Unknown provider'}`)
      }
    }

    if (result.errors.length > 0) {
      console.log(`  ⚠️  Errors: ${result.errors.join(', ')}`)
    }
  }

  // Step 5: Show errors (if any)
  const filesWithErrors = results.filter(r => r.errors.length > 0)
  if (filesWithErrors.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('⚠️  Files with Errors')
    console.log('='.repeat(80))

    for (const result of filesWithErrors.slice(0, 5)) {
      console.log(`\n${result.relativePath}`)
      for (const error of result.errors) {
        console.log(`  - ${error}`)
      }
    }

    if (filesWithErrors.length > 5) {
      console.log(`\n... and ${filesWithErrors.length - 5} more files with errors`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Processing Complete')
  console.log('='.repeat(80))
  console.log('\nNext steps:')
  console.log('  1. Review results and fix any errors')
  console.log('  2. Integrate with seed scripts')
  console.log('  3. Validate in Payload admin UI')
  console.log('')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
}

export { processMdxFile, processMdxBatch, findMdxFiles, generateSummary }
