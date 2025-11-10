import fs from 'fs'

const slug = 'understanding-your-electric-billing-cycle'
const response = await fetch(`http://localhost:3001/api/posts?where[slug][equals]=${slug}&limit=1&depth=2`)
const data = await response.json()

const post = data.docs[0]

console.log('=== Post Data ===')
console.log('Title:', post?.title)
console.log('Slug:', post?.slug)
console.log('Content Blocks count:', post?.contentBlocks?.length)

// Check each content block
post?.contentBlocks?.forEach((block, i) => {
  console.log(`\nBlock ${i}:`, block.blockType)

  if (block.blockType === 'richText' && block.content) {
    console.log('  Has lexical content')
    console.log('  Root children count:', block.content.root?.children?.length)

    // Look through paragraphs for inline blocks
    block.content.root?.children?.forEach((child, j) => {
      if (child.type === 'paragraph') {
        console.log(`\n  Paragraph ${j}:`)
        child.children?.forEach((pChild, k) => {
          console.log(`    [${k}] type: ${pChild.type}`)
          if (pChild.type === 'inlineBlock' || pChild.type === 'block') {
            console.log(`      ✓ INLINE BLOCK FOUND!`)
            console.log(`      blockType: ${pChild.fields?.blockType}`)
            console.log(JSON.stringify(pChild, null, 2))
          }
        })
      }
    })
  }
})

// Save full response for inspection
fs.writeFileSync('/tmp/post-debug.json', JSON.stringify(post, null, 2))
console.log('\n✅ Full post saved to /tmp/post-debug.json')
