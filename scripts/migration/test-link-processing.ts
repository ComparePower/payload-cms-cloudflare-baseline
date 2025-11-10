/**
 * Test script to process one entry (top-energy-companies) with link processing
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import { parseMDXToBlocks } from './lib/mdx-to-payload-blocks'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SOURCE_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/providers'

async function main() {
  console.log('🚀 Starting link processing test...\n')

  // Initialize Payload
  const payload = await getPayload({ config: await configPromise })
  console.log('✅ Payload initialized\n')

  try {
    // Read the MDX file
    const mdxPath = path.join(SOURCE_DIR, 'top-energy-companies', 'index.mdx')
    console.log(`📖 Reading: ${mdxPath}`)
    const mdxContent = await fs.readFile(mdxPath, 'utf-8')

    // Parse MDX to blocks
    console.log('🔄 Parsing MDX to blocks with link processing...')
    const parsed = await parseMDXToBlocks(mdxContent, payload.config)

    console.log(`\n✅ Parsed ${parsed.contentBlocks.length} content blocks`)
    console.log(`📊 Block breakdown:`)

    const blockTypes = parsed.contentBlocks.reduce((acc, block) => {
      acc[block.blockType] = (acc[block.blockType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(blockTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`)
    })

    // Save result to file
    const outputPath = path.join(__dirname, '../../.migration-cache/test-link-processing-result.json')
    await fs.writeFile(outputPath, JSON.stringify(parsed, null, 2))
    console.log(`\n💾 Saved result to: ${outputPath}`)

    // Show sample of first richText block with links
    const firstRichText = parsed.contentBlocks.find(b => b.blockType === 'richText')
    if (firstRichText) {
      console.log('\n📝 First rich text block structure:')
      console.log(JSON.stringify(firstRichText.content, null, 2).substring(0, 1000) + '...')
    }

    // Check for link nodes
    console.log('\n🔍 Checking for link nodes...')
    const hasLinks = JSON.stringify(parsed).includes('"type":"link"')
    console.log(hasLinks ? '✅ Link nodes found!' : '❌ No link nodes found')

    // Delete existing entry if it exists
    console.log('\n🗑️  Checking for existing "top-energy-companies" entry...')
    const existing = await payload.find({
      collection: 'providers',
      where: {
        slug: {
          equals: 'top-energy-companies',
        },
      },
    })

    if (existing.docs.length > 0) {
      console.log(`   Found existing entry with ID: ${existing.docs[0].id}`)
      console.log('   Deleting...')
      await payload.delete({
        collection: 'providers',
        id: existing.docs[0].id,
      })
      console.log('   ✅ Deleted')
    } else {
      console.log('   No existing entry found')
    }

    // Transform blocks to Payload API format (flatten fields to root level)
    const fixedBlocks = parsed.contentBlocks.map(block => {
      if (block.blockType === 'richText') {
        // Rich text blocks keep their structure
        return {
          blockType: block.blockType,
          content: block.content,
          id: block.id,
        }
      } else {
        // Component blocks need fields flattened to root level
        return {
          blockType: block.blockType,
          ...block.fields, // Spread fields at root level
          id: block.id,
        }
      }
    })

    // Create new entry with the processed blocks
    console.log('\n✨ Creating new entry with processed blocks...')
    const newEntry = await payload.create({
      collection: 'providers',
      data: {
        title: 'Best Texas Energy Companies',
        slug: 'top-energy-companies',
        publishedAt: new Date().toISOString(), // Add required publishedAt field
        contentBlocks: fixedBlocks,
      },
    })

    console.log(`\n✅ Created entry with ID: ${newEntry.id}`)
    console.log(`   Total blocks: ${newEntry.contentBlocks?.length || 0}`)
    console.log(`   View at: http://localhost:3000/admin/collections/providers/${newEntry.id}`)

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }

  process.exit(0)
}

main()
