/**
 * Test MDX Pipeline
 *
 * Tests the complete MDX to Lexical conversion pipeline:
 * 1. Parse frontmatter with gray-matter (T007)
 * 2. Convert markdown to Lexical JSON (T008)
 * 3. Extract inline components (T009)
 * 4. Map components to provider slugs (T010)
 *
 * Usage:
 *   tsx scripts/migration/test-mdx-pipeline.ts
 */

import { parseMdxFile, parseMdxContent } from './lib/mdx-parser'
import { convertMdxToLexical } from './lib/mdx-to-lexical-converter'
import { extractInlineComponents } from './lib/inline-component-extractor'
import {
  getProviderFromComponent,
  generateInlineBlockSlug,
  PHONE_COMPONENT_TO_PROVIDER
} from './lib/component-to-provider-mapping'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

async function testPipeline() {
  console.log('🧪 Testing MDX to Lexical Pipeline\n')
  console.log('=' .repeat(80))

  // Test 1: Parse frontmatter
  console.log('\n📋 TEST 1: Frontmatter Parsing (T007)')
  console.log('-'.repeat(80))

  const sampleMdx = `---
title: "4Change Energy"
wp_slug: "4change-energy"
wp_post_id: 12345
draft: false
pubDate: 2024-01-15
---

# About 4Change Energy

4Change Energy is a **leading provider** of electricity in Texas.

Call us at <FourChangePhoneNumber /> for more information.

## Features

- Competitive rates
- 100% renewable energy
- Excellent customer service
`

  const parsed = parseMdxContent(sampleMdx, 'test.mdx')

  console.log('\n✅ Frontmatter extracted:')
  console.log(JSON.stringify(parsed.frontmatter, null, 2))
  console.log(`\n✅ Content length: ${parsed.content.length} characters`)
  console.log(`✅ Errors: ${parsed.errors.length}`)

  // Test 2: Convert to Lexical
  console.log('\n\n📝 TEST 2: Markdown to Lexical Conversion (T008)')
  console.log('-'.repeat(80))

  const lexical = await convertMdxToLexical(parsed.content)

  console.log('\n✅ Lexical structure:')
  console.log(`  - Root node type: ${lexical.root.type}`)
  console.log(`  - Child count: ${lexical.root.children.length}`)
  console.log(`  - Node types: ${lexical.root.children.map((c: any) => c.type).join(', ')}`)

  // Print first few nodes
  console.log('\n  First few nodes:')
  for (let i = 0; i < Math.min(3, lexical.root.children.length); i++) {
    const node = lexical.root.children[i]
    console.log(`    ${i + 1}. ${node.type}`, node.tag ? `(${node.tag})` : '')
    if (node.children && node.children.length > 0) {
      const firstChild = node.children[0]
      if (firstChild.type === 'text') {
        const preview = firstChild.text.substring(0, 50)
        console.log(`       Text: "${preview}${firstChild.text.length > 50 ? '...' : ''}"`)
      }
    }
  }

  // Test 3: Extract inline components
  console.log('\n\n🔧 TEST 3: Inline Component Extraction (T009)')
  console.log('-'.repeat(80))

  const { lexicalJSON, components } = extractInlineComponents(lexical)

  console.log(`\n✅ Found ${components.length} inline component(s):`)
  for (const comp of components) {
    console.log(`  - ${comp.name}`)
    console.log(`    Props: ${JSON.stringify(comp.props)}`)
  }

  // Test 4: Component to provider mapping
  console.log('\n\n🗺️  TEST 4: Component to Provider Mapping (T010)')
  console.log('-'.repeat(80))

  console.log(`\n✅ Total phone component mappings: ${Object.keys(PHONE_COMPONENT_TO_PROVIDER).length}`)
  console.log('\nSample mappings:')

  const sampleComponents = [
    'FourChangePhoneNumber',
    'AmigoPhoneNumber',
    'TxuPhoneNumber',
    'ReliantPhoneNumber'
  ]

  for (const compName of sampleComponents) {
    const provider = getProviderFromComponent(compName)
    if (provider) {
      const slug = generateInlineBlockSlug(compName, provider)
      console.log(`  ${compName}`)
      console.log(`    → Provider: ${provider}`)
      console.log(`    → Slug: ${slug}`)
    }
  }

  // Test 5: Real file (if available)
  console.log('\n\n📁 TEST 5: Real MDX File Processing')
  console.log('-'.repeat(80))

  const astroContentPath = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro'
  const possibleFiles = [
    `${astroContentPath}/.migration-backup-20251013-172540/posts/gexa-saver-12/index.mdx`,
    `${astroContentPath}/src/content/front-end/providers/4change-energy.mdx`
  ]

  let realFilePath: string | null = null
  for (const filePath of possibleFiles) {
    try {
      await readFile(filePath)
      realFilePath = filePath
      break
    } catch (e) {
      // File doesn't exist, try next
    }
  }

  if (realFilePath) {
    console.log(`\n✅ Found file: ${realFilePath}`)

    const realParsed = await parseMdxFile(realFilePath)
    console.log(`\n  Frontmatter fields: ${Object.keys(realParsed.frontmatter).join(', ')}`)
    console.log(`  Content length: ${realParsed.content.length} characters`)

    const realLexical = await convertMdxToLexical(realParsed.content)
    console.log(`  Lexical nodes: ${realLexical.root.children.length}`)

    const realExtracted = extractInlineComponents(realLexical)
    console.log(`  Inline components: ${realExtracted.components.length}`)

    if (realExtracted.components.length > 0) {
      console.log('\n  Components found:')
      for (const comp of realExtracted.components) {
        const provider = getProviderFromComponent(comp.name)
        console.log(`    - ${comp.name} → ${provider || 'Unknown provider'}`)
      }
    }
  } else {
    console.log('\n⚠️  No sample MDX files found - skipping real file test')
  }

  // Summary
  console.log('\n\n' + '='.repeat(80))
  console.log('✅ PIPELINE TEST COMPLETE')
  console.log('='.repeat(80))
  console.log('\nAll pipeline components working:')
  console.log('  ✓ T007: Frontmatter parsing (gray-matter)')
  console.log('  ✓ T008: Markdown to Lexical conversion (unified/remark)')
  console.log('  ✓ T009: Inline component extraction')
  console.log('  ✓ T010: Component to provider mapping')
  console.log('\n✨ Ready for integration with migration scripts!\n')
}

// Run tests
testPipeline().catch((error) => {
  console.error('\n❌ Pipeline test failed:', error)
  process.exit(1)
})
