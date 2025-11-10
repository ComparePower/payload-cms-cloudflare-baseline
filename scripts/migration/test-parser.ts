#!/usr/bin/env tsx
/**
 * Test MDX Parser
 *
 * Tests the mdx-to-payload-blocks parser with real MDX files
 */

import fs from 'fs/promises'
import { parseMDXToBlocks } from './lib/mdx-to-payload-blocks'

async function main() {
  // Test file path - the electricity bill post with figure/figcaption and FaqEndpoint
  const testFile = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/data/advisor/en/how-to-read-your-electricity-bill-in-texas/index.mdx'

  console.log('📖 Reading test file...')
  const content = await fs.readFile(testFile, 'utf-8')

  // Split frontmatter and body
  const parts = content.split('---')
  const body = parts.length >= 3 ? parts.slice(2).join('---').trim() : content

  console.log('\n📝 Testing MDX parser...')
  console.log('Body length:', body.length, 'characters')
  console.log('\nFirst 200 chars of body:')
  console.log(body.substring(0, 200))

  try {
    const result = await parseMDXToBlocks(body)

    console.log('\n✅ Parser succeeded!')
    console.log(`\n📊 Results:`)
    console.log(`   Content blocks: ${result.contentBlocks.length}`)
    console.log(`   Images found: ${result.images.length}`)

    console.log('\n📦 Content Blocks:')
    result.contentBlocks.forEach((block, i) => {
      console.log(`\n   Block ${i + 1}:`)
      console.log(`     Type: ${block.blockType}`)

      if (block.blockType === 'richText' && block.content) {
        const text = JSON.stringify(block.content).substring(0, 100)
        console.log(`     Content preview: ${text}...`)
      } else if (block.fields) {
        console.log(`     Props:`, JSON.stringify(block.fields, null, 2).substring(0, 200))
      }
    })

    if (result.images.length > 0) {
      console.log('\n🖼️  Images:')
      result.images.forEach((img, i) => {
        console.log(`   ${i + 1}. ${img.url}`)
        console.log(`      Alt: ${img.alt}`)
        console.log(`      Position: ${img.position}`)
      })
    }

    // Save result to JSON for inspection
    const outputFile = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/.migration-cache/parser-test-result.json'
    await fs.writeFile(outputFile, JSON.stringify(result, null, 2))
    console.log(`\n💾 Full result saved to: ${outputFile}`)

  } catch (error) {
    console.error('\n❌ Parser failed:', error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

main()
