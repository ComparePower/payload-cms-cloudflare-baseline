/**
 * Test Phone Number Component Conversion
 *
 * Tests that MDX phone number components are correctly converted to
 * dynamicDataInstanceSimple inline blocks with proper slug references
 */

import { parseMDXToBlocks } from './lib/mdx-to-payload-blocks'
import fs from 'fs/promises'
import path from 'path'

const TEST_MDX = `
# Test Phone Number Conversion

This is a paragraph with an inline phone number: Call <TxuPhoneNumber /> for rates.

You can also call <ReliantPhoneNumber /> or <AmigoPhoneNumber /> for more information.

<ProviderCard providerId="txu-energy" />

For the average rate in Texas, see <AvgTexasResidentialRate /> cents per kWh.

We have <ComparepowerReviewCount /> happy customers!
`

async function testConversion() {
  console.log('🧪 Testing Phone Number Component Conversion\n')

  try {
    // Parse MDX
    console.log('📝 Parsing test MDX content...')
    const result = await parseMDXToBlocks(TEST_MDX)

    console.log(`   ✓ Parsed into ${result.contentBlocks.length} blocks\n`)

    // Examine each block
    for (let i = 0; i < result.contentBlocks.length; i++) {
      const block = result.contentBlocks[i]
      console.log(`Block ${i + 1}: ${block.blockType}`)

      if (block.blockType === 'richText' && block.content) {
        // Check for inline blocks in the rich text
        const inlineBlocks = findInlineBlocks(block.content.root)

        if (inlineBlocks.length > 0) {
          console.log(`   Found ${inlineBlocks.length} inline block(s):`)
          for (const inlineBlock of inlineBlocks) {
            console.log(`   - ${inlineBlock.fields.blockType}`)
            if (inlineBlock.fields._richTextDataSlug) {
              console.log(`     Slug: ${inlineBlock.fields._richTextDataSlug}`)
              console.log(`     Category: ${inlineBlock.fields.category}`)
              console.log(`     Enable Phone Link: ${inlineBlock.fields.enablePhoneLink}`)
            }
          }
        }
      } else if (block.fields) {
        console.log(`   Fields: ${JSON.stringify(block.fields, null, 2)}`)
      }

      console.log()
    }

    // Write full result to file for inspection
    const outputPath = path.join(process.cwd(), '.migration-cache', 'test-phone-conversion-result.json')
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8')

    console.log(`✅ Full result written to: ${outputPath}\n`)

    // Validate expectations
    console.log('🔍 Validating conversion...')

    const richTextBlocks = result.contentBlocks.filter(b => b.blockType === 'richText')
    console.log(`   ✓ Found ${richTextBlocks.length} richText blocks`)

    let totalInlineBlocks = 0
    let phoneBlocks = 0
    let dynamicDataBlocks = 0

    for (const block of richTextBlocks) {
      const inlineBlocks = findInlineBlocks(block.content.root)
      totalInlineBlocks += inlineBlocks.length

      for (const inlineBlock of inlineBlocks) {
        if (inlineBlock.fields.category === 'phone') {
          phoneBlocks++
        } else if (inlineBlock.fields.category === 'other') {
          dynamicDataBlocks++
        }
      }
    }

    console.log(`   ✓ Found ${totalInlineBlocks} total inline blocks`)
    console.log(`   ✓ ${phoneBlocks} phone number blocks`)
    console.log(`   ✓ ${dynamicDataBlocks} dynamic data blocks`)

    // Expected: 3 phone blocks (TXU, Reliant, Amigo) + 2 dynamic data (AvgRate, ReviewCount)
    if (phoneBlocks === 3 && dynamicDataBlocks === 2) {
      console.log('\n✅ All tests passed!')
    } else {
      console.log(`\n⚠️  Expected 3 phone blocks and 2 dynamic data blocks, got ${phoneBlocks} and ${dynamicDataBlocks}`)
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

/**
 * Recursively find all inline blocks in Lexical tree
 */
function findInlineBlocks(node: any): any[] {
  const results: any[] = []

  if (!node) return results

  if (node.type === 'inlineBlock') {
    results.push(node)
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      results.push(...findInlineBlocks(child))
    }
  }

  return results
}

// Run test
testConversion()
