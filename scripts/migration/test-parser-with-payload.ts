#!/usr/bin/env tsx
/**
 * Test MDX Parser with Payload's Markdown Converter
 *
 * Tests the mdx-to-payload-blocks parser using Payload's convertMarkdownToLexical
 */

import fs from 'fs/promises'
import { parseMDXToBlocks } from './lib/mdx-to-payload-blocks'
import config from '../../src/payload.config'

async function main() {
  // Test file path
  const testFile =
    '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/data/advisor/en/how-to-read-your-electricity-bill-in-texas/index.mdx'

  console.log('📖 Reading test file...')
  const content = await fs.readFile(testFile, 'utf-8')

  // Split frontmatter and body
  const parts = content.split('---')
  const body = parts.length >= 3 ? parts.slice(2).join('---').trim() : content

  console.log('\n📝 Testing MDX parser with Payload converter...')
  console.log('Body length:', body.length, 'characters')

  try {
    const result = await parseMDXToBlocks(body, config)

    console.log('\n✅ Parser succeeded!')
    console.log(`\n📊 Results:`)
    console.log(`   Content blocks: ${result.contentBlocks.length}`)
    console.log(`   Images found: ${result.images.length}`)

    console.log('\n📦 Content Blocks:')
    result.contentBlocks.forEach((block, i) => {
      console.log(`\n   Block ${i + 1}:`)
      console.log(`     Type: ${block.blockType}`)

      if (block.blockType === 'richText' && block.content) {
        // Show first paragraph
        const firstPara = block.content?.root?.children?.[0]
        if (firstPara) {
          const text =
            firstPara.children?.[0]?.text?.substring(0, 80) || JSON.stringify(firstPara).substring(0, 80)
          console.log(`     First para: ${text}...`)
        }
      } else if (block.fields) {
        console.log(`     Props:`, JSON.stringify(block.fields, null, 2))
      }
    })

    if (result.images.length > 0) {
      console.log('\n🖼️  Images:')
      result.images.forEach((img, i) => {
        console.log(`   ${i + 1}. ${img.url}`)
        console.log(`      Alt: ${img.alt}`)
      })
    }

    // Save result to JSON for inspection
    const outputFile = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/.migration-cache/parser-payload-result.json'
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
