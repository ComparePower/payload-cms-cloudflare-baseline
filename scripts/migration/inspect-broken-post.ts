#!/usr/bin/env tsx
/**
 * Inspect a broken post to see its current content structure
 */

import { getPayload } from 'payload'
import config from '../../src/payload.config'

async function main() {
  const postId = '68f8ff2fb02d58d139aa59ba'

  console.log('🔍 Fetching post from Payload...\n')

  const payload = await getPayload({ config })

  try {
    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
      depth: 0,
    })

    console.log('📄 Post Details:')
    console.log(`   ID: ${post.id}`)
    console.log(`   Title: ${post.title}`)
    console.log(`   Slug: ${post.slug}`)
    console.log(`   Content Blocks: ${post.contentBlocks?.length || 0}`)

    if (post.contentBlocks && post.contentBlocks.length > 0) {
      console.log('\n📦 Content Blocks Structure:')
      post.contentBlocks.forEach((block: any, i: number) => {
        console.log(`\n   Block ${i + 1}:`)
        console.log(`     Type: ${block.blockType}`)

        if (block.blockType === 'richText' && block.content) {
          const firstChild = block.content?.root?.children?.[0]
          if (firstChild) {
            const text = JSON.stringify(firstChild).substring(0, 150)
            console.log(`     First child: ${text}...`)
          }
        } else if (block.fields) {
          console.log(`     Fields: ${JSON.stringify(block.fields).substring(0, 100)}`)
        }
      })

      // Check first block for component tags
      const firstBlock = post.contentBlocks[0]
      if (firstBlock.blockType === 'richText' && firstBlock.content) {
        const fullText = JSON.stringify(firstBlock.content)
        const hasComponents = fullText.includes('<') && fullText.includes('/>')

        console.log(`\n⚠️  Issue Detection:`)
        console.log(`     Contains HTML tags: ${hasComponents ? 'YES - BROKEN!' : 'No'}`)

        if (hasComponents) {
          const componentMatches = fullText.match(/<[A-Z][a-zA-Z0-9]+ /g)
          if (componentMatches) {
            console.log(`     Component tags found: ${componentMatches.slice(0, 5).join(', ')}`)
          }
        }
      }
    }

    console.log(`\n💾 Saving full post data to file for inspection...`)
    const fs = await import('fs/promises')
    await fs.writeFile(
      '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/.migration-cache/broken-post-data.json',
      JSON.stringify(post, null, 2)
    )
    console.log('   Saved to: .migration-cache/broken-post-data.json')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  process.exit(0)
}

main()
