#!/usr/bin/env tsx
/**
 * Fix a single post by re-parsing its MDX source
 * and updating it with properly split content blocks
 */

import fs from 'fs/promises'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import { parseMDXToBlocks } from './lib/mdx-to-payload-blocks'

const POST_ID = '68f8ff2fb02d58d139aa59ba'
const MDX_SOURCE_PATH =
  '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/data/advisor/en/how-to-read-your-electricity-bill-in-texas/index.mdx'

/**
 * Transform component props to match Payload field structure
 */
function transformPropsToPayloadFields(blockType: string, props: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {}

  // FaqEndpoint: ids array needs to be transformed (note: blockType is now camelCase)
  if (blockType === 'faqEndpoint' && props.ids && Array.isArray(props.ids)) {
    fields.ids = props.ids.map((id: string) => ({ value: id }))
    return fields
  }

  // Default: just copy all props
  return props
}

async function main() {
  console.log('🔧 Fixing post with proper content blocks...\n')

  const payload = await getPayload({ config })

  try {
    // 1. Read the MDX source file
    console.log('📖 Reading MDX source file...')
    const mdxContent = await fs.readFile(MDX_SOURCE_PATH, 'utf-8')

    // Split frontmatter and body
    const parts = mdxContent.split('---')
    const body = parts.length >= 3 ? parts.slice(2).join('---').trim() : mdxContent

    console.log(`   ✓ Read ${body.length} characters\n`)

    // 2. Parse MDX into content blocks
    console.log('🔍 Parsing MDX with block splitter...')
    const { contentBlocks, images } = await parseMDXToBlocks(body, config)

    console.log(`   ✓ Created ${contentBlocks.length} content blocks`)
    console.log(`   ✓ Found ${images.length} images\n`)

    // 3. Transform props to match Payload field structure
    console.log('🔄 Transforming block props to Payload format...')

    // Known invalid blocks that don't exist in Payload
    const invalidBlocks = ['figure', 'figcaption']

    const transformedBlocks = contentBlocks
      .filter((block) => {
        if (invalidBlocks.includes(block.blockType)) {
          console.log(`   ⚠️  Skipping invalid block type: ${block.blockType}`)
          return false
        }
        return true
      })
      .map((block) => {
        if (block.blockType === 'richText') {
          return block
        }

        // Transform component block props
        const transformedFields = transformPropsToPayloadFields(block.blockType, block.fields || {})

        return {
          ...block,
          fields: transformedFields,
        }
      })

    console.log(`   ✓ Transformed ${transformedBlocks.length} blocks\n`)

    // 4. Display preview
    console.log('📦 Content Blocks Preview:')
    transformedBlocks.forEach((block, i) => {
      console.log(`\n   Block ${i + 1}: ${block.blockType}`)
      if (block.blockType === 'richText') {
        const firstPara = block.content?.root?.children?.[0]
        if (firstPara) {
          const text = JSON.stringify(firstPara).substring(0, 100)
          console.log(`     Preview: ${text}...`)
        }
      } else if (block.fields) {
        console.log(`     Fields: ${JSON.stringify(block.fields).substring(0, 150)}`)
      }
    })

    // 5. Save to file for inspection
    const previewFile = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/.migration-cache/fixed-post-preview.json'
    await fs.writeFile(previewFile, JSON.stringify({ contentBlocks: transformedBlocks, images }, null, 2))
    console.log(`\n💾 Saved preview to: .migration-cache/fixed-post-preview.json`)

    // 6. Update the post in Payload
    console.log(`\n📝 Updating post ${POST_ID}...`)
    const updatedPost = await payload.update({
      collection: 'posts',
      id: POST_ID,
      data: {
        contentBlocks: transformedBlocks as any,
      },
    })

    console.log(`   ✓ Post updated successfully!`)
    console.log(`\n✅ Done! View the post at: http://localhost:3003/admin/collections/posts/${POST_ID}`)
  } catch (error) {
    console.error('\n❌ Error:', error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }

  process.exit(0)
}

main()
