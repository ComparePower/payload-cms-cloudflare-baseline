/**
 * Test Batch Provider Migration
 *
 * Task: T021
 *
 * Tests migration pipeline with 10 provider files to validate:
 * 1. All files parse successfully
 * 2. Field mapping works for all providers
 * 3. Content conversion succeeds
 * 4. No errors or warnings
 * 5. 100% success rate
 *
 * Run: pnpm tsx scripts/migration/test-batch-providers.ts
 */

import { readdir } from 'fs/promises'
import path from 'path'
import { parseMdxFile } from './lib/mdx-parser.js'
import { mapProviderFields, validateProviderData } from './lib/provider-field-mapper.js'
import { convertMdxToLexical } from './lib/mdx-to-lexical-converter.js'

const ASTRO_PROVIDERS_DIR =
  '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/providers'
const TEST_COUNT = 10

interface TestResult {
  file: string
  success: boolean
  error?: string
  provider?: {
    title: string
    slug: string
    status: string
    hasContent: boolean
    contentBlocks: number
    hasSeo: boolean
    hasHero: boolean
    inlineComponents: number
  }
}

async function testBatchProviders() {
  console.log('🧪 Testing Batch Provider Migration (10 files)\n')

  // Find provider MDX files recursively
  console.log('📁 Finding provider files...')

  async function findMdxFiles(dir: string, files: string[] = []): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (files.length >= TEST_COUNT) break

      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await findMdxFiles(fullPath, files)
      } else if (entry.isFile() && entry.name === 'index.mdx') {
        files.push(fullPath)
      }
    }

    return files
  }

  const testFiles = await findMdxFiles(ASTRO_PROVIDERS_DIR)

  console.log(`   Found ${testFiles.length} files to test\n`)

  // Test each file
  const results: TestResult[] = []

  for (let i = 0; i < testFiles.length; i++) {
    const file = testFiles[i]
    const fileName = path.basename(path.dirname(file))
    const progress = `[${i + 1}/${testFiles.length}]`

    console.log(`${progress} Testing: ${fileName}`)

    try {
      // Parse MDX
      const parsed = await parseMdxFile(file)
      if (parsed.errors.length > 0) {
        throw new Error(`Parse errors: ${parsed.errors.join(', ')}`)
      }

      // Map fields
      const mapped = await mapProviderFields(parsed.frontmatter, file, ASTRO_PROVIDERS_DIR, parsed.content)

      // Validate
      const missing = validateProviderData(mapped)
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`)
      }

      // Convert content
      const lexical = await convertMdxToLexical(parsed.content)

      // Count inline components
      const contentStr = JSON.stringify(lexical)
      const inlineCount = (contentStr.match(/{{INLINE_COMPONENT:/g) || []).length

      // Success
      results.push({
        file: fileName,
        success: true,
        provider: {
          title: mapped.title,
          slug: mapped.slug,
          status: mapped.status,
          hasContent: lexical.root.children.length > 0,
          contentBlocks: lexical.root.children.length,
          hasSeo: Boolean(mapped.seo),
          hasHero: Boolean(mapped.hero),
          inlineComponents: inlineCount,
        },
      })

      console.log(`   ✓ Success - ${mapped.title}`)
    } catch (error: any) {
      results.push({
        file: fileName,
        success: false,
        error: error.message,
      })

      console.log(`   ❌ Failed - ${error.message}`)
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary\n')

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length
  const successRate = (successCount / results.length) * 100

  console.log(`Total: ${results.length}`)
  console.log(`Success: ${successCount}`)
  console.log(`Failed: ${failCount}`)
  console.log(`Success Rate: ${successRate.toFixed(1)}%\n`)

  // Show failed migrations
  if (failCount > 0) {
    console.log('❌ Failed Migrations:\n')
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.file}: ${r.error}`)
      })
    console.log()
  }

  // Show successful migrations stats
  if (successCount > 0) {
    console.log('✅ Successful Migrations:\n')

    const withSeo = results.filter((r) => r.success && r.provider?.hasSeo).length
    const withHero = results.filter((r) => r.success && r.provider?.hasHero).length
    const withInline = results.filter((r) => r.success && (r.provider?.inlineComponents || 0) > 0)
      .length

    console.log(`   Providers with SEO: ${withSeo}/${successCount}`)
    console.log(`   Providers with Hero: ${withHero}/${successCount}`)
    console.log(`   Providers with inline components: ${withInline}/${successCount}`)

    const avgContentBlocks =
      results
        .filter((r) => r.success)
        .reduce((sum, r) => sum + (r.provider?.contentBlocks || 0), 0) / successCount

    console.log(`   Average content nodes: ${avgContentBlocks.toFixed(0)}`)
    console.log()
  }

  // Save results
  const cacheDir = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/.migration-cache'
  const cacheFile = path.join(cacheDir, 'test-batch-providers-result.json')

  await import('fs/promises').then((fs) =>
    fs.writeFile(
      cacheFile,
      JSON.stringify(
        {
          testCount: results.length,
          successCount,
          failCount,
          successRate,
          results,
        },
        null,
        2
      )
    )
  )

  console.log(`💾 Results saved to: ${cacheFile}`)

  // Exit code
  if (successRate < 100) {
    console.log('\n⚠️  Not all tests passed!')
    process.exit(1)
  } else {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  }
}

testBatchProviders().catch((error) => {
  console.error('\n💥 Test failed:', error.message)
  console.error(error.stack)
  process.exit(1)
})
