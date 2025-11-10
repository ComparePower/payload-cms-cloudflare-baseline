/**
 * Test Single Provider Migration
 *
 * Task: T020
 *
 * Tests the complete MDX-to-Payload pipeline with a single provider file:
 * 1. Parse MDX frontmatter and content
 * 2. Map frontmatter fields to Payload structure
 * 3. Convert MDX content to Lexical JSON
 * 4. Process inline components (phone numbers)
 * 5. Validate final structure
 *
 * Run: pnpm tsx scripts/migration/test-single-provider.ts
 */

import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { parseMdxFile } from './lib/mdx-parser.js'
import { mapProviderFields, validateProviderData } from './lib/provider-field-mapper.js'
import { convertMdxToLexical } from './lib/mdx-to-lexical-converter.js'

const ASTRO_PROVIDERS_DIR =
  '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/providers'

async function testSingleProvider() {
  console.log('🧪 Testing Single Provider Migration Pipeline\n')

  // Find first non-draft MDX file
  console.log('📁 Finding a provider file...')
  const entries = await readdir(ASTRO_PROVIDERS_DIR, { withFileTypes: true })

  let testFile: string | null = null

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const indexPath = path.join(ASTRO_PROVIDERS_DIR, entry.name, 'index.mdx')
      try {
        await readFile(indexPath)
        testFile = indexPath
        break
      } catch {
        // File doesn't exist, continue
      }
    }
  }

  if (!testFile) {
    console.error('❌ No provider file found')
    process.exit(1)
  }

  console.log(`   Found: ${path.basename(path.dirname(testFile))}\n`)

  // Step 1: Parse MDX
  console.log('📝 Step 1: Parsing MDX file...')
  const parsed = await parseMdxFile(testFile)

  if (parsed.errors.length > 0) {
    console.error('   ❌ Parse errors:', parsed.errors)
    process.exit(1)
  }

  console.log('   ✓ Frontmatter fields:', Object.keys(parsed.frontmatter).length)
  console.log('   ✓ Content length:', parsed.content.length, 'chars')
  console.log('   ✓ Frontmatter:')
  console.log(JSON.stringify(parsed.frontmatter, null, 2))

  // Step 2: Map fields
  console.log('\n📋 Step 2: Mapping fields to Payload structure...')
  const mapped = await mapProviderFields(
    parsed.frontmatter,
    testFile,
    ASTRO_PROVIDERS_DIR,
    parsed.content
  )

  console.log('   ✓ Title:', mapped.title)
  console.log('   ✓ Slug:', mapped.slug)
  console.log('   ✓ Status:', mapped.status)
  console.log('   ✓ Published:', mapped.publishedAt)
  console.log('   ✓ WordPress Slug:', mapped.wordpressSlug || 'N/A')
  console.log('   ✓ WordPress Post ID:', mapped.wpPostId || 'N/A')
  console.log('   ✓ WordPress Author:', mapped.wpAuthor || 'N/A')
  console.log('   ✓ SEO:', mapped.seo ? 'Yes' : 'No')
  console.log('   ✓ Hero:', mapped.hero ? 'Yes' : 'No')

  // Validate
  const missing = validateProviderData(mapped)
  if (missing.length > 0) {
    console.error('\n   ❌ Missing required fields:', missing)
    process.exit(1)
  }

  // Step 3: Convert content to Lexical
  console.log('\n🔄 Step 3: Converting MDX content to Lexical JSON...')
  const lexical = await convertMdxToLexical(parsed.content)

  console.log('   ✓ Root node type:', lexical.root.type)
  console.log('   ✓ Children count:', lexical.root.children.length)

  // Show first few nodes
  console.log('   ✓ First 3 nodes:')
  lexical.root.children.slice(0, 3).forEach((node: any, i: number) => {
    console.log(`      ${i + 1}. ${node.type} - ${JSON.stringify(node).slice(0, 60)}...`)
  })

  // Step 4: Check for inline components (phone numbers)
  console.log('\n🔍 Step 4: Checking for inline components...')
  const contentStr = JSON.stringify(lexical)
  const inlineComponentCount = (contentStr.match(/{{INLINE_COMPONENT:/g) || []).length

  console.log('   ℹ️  Inline component placeholders found:', inlineComponentCount)

  if (inlineComponentCount > 0) {
    console.log('   ℹ️  Note: Inline components will be processed during seeding')
    console.log('   ℹ️  They will be resolved to richTextDataInstances relationships')
  }

  // Step 5: Build final structure
  console.log('\n📦 Step 5: Building final provider data structure...')
  const finalData = {
    ...mapped,
    contentBlocks: [
      {
        blockType: 'richText',
        content: lexical,
      },
    ],
  }

  delete finalData._mdxContent // Remove temporary field

  console.log('   ✓ Final data structure:')
  console.log('      - Title:', finalData.title)
  console.log('      - Slug:', finalData.slug)
  console.log('      - Status:', finalData.status)
  console.log('      - Content blocks:', finalData.contentBlocks.length)
  console.log('      - SEO:', finalData.seo ? 'configured' : 'not configured')
  console.log('      - Hero:', finalData.hero ? 'configured' : 'not configured')

  // Summary
  console.log('\n✅ Single Provider Test Complete!\n')
  console.log('📊 Summary:')
  console.log('   - Frontmatter parsing: ✓')
  console.log('   - Field mapping: ✓')
  console.log('   - Content conversion: ✓')
  console.log('   - Inline components:', inlineComponentCount > 0 ? 'detected' : 'none')
  console.log('   - Final structure: ✓')
  console.log()

  // Write to cache for inspection
  const cacheDir = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/.migration-cache'
  const cacheFile = path.join(cacheDir, 'test-single-provider-result.json')

  await import('fs/promises').then((fs) =>
    fs.writeFile(cacheFile, JSON.stringify(finalData, null, 2))
  )
  console.log(`💾 Result saved to: ${cacheFile}`)
}

testSingleProvider().catch((error) => {
  console.error('\n💥 Test failed:', error.message)
  console.error(error.stack)
  process.exit(1)
})
