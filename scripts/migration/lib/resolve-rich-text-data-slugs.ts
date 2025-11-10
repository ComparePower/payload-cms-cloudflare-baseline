/**
 * Resolves _richTextDataSlug references in Lexical JSON to actual relationship IDs
 *
 * During MDX parsing, phone number components are converted to inline blocks with
 * a temporary _richTextDataSlug field. This function resolves those slugs to actual
 * richTextDataInstances IDs by querying the database.
 *
 * Usage in seeding scripts:
 *   const resolvedContent = await resolveRichTextDataSlugs(lexicalJSON, payload)
 */

import type { Payload } from 'payload'

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  fields?: {
    blockType?: string
    _richTextDataSlug?: string
    [key: string]: any
  }
  [key: string]: any
}

/**
 * Resolve all _richTextDataSlug references in Lexical JSON
 */
export async function resolveRichTextDataSlugs(
  lexicalJSON: { root: LexicalNode } | null | undefined,
  payload: Payload
): Promise<{ root: LexicalNode } | null> {
  if (!lexicalJSON || !lexicalJSON.root) {
    return null
  }

  // Deep clone to avoid mutating original
  const result = JSON.parse(JSON.stringify(lexicalJSON))

  // Build slug → ID cache by querying all instances
  const slugToIdCache = await buildSlugCache(payload)

  // Walk the tree and resolve slugs
  await walkAndResolveNode(result.root, slugToIdCache)

  return result
}

/**
 * Build a cache of slug → ID mappings from the database
 */
async function buildSlugCache(payload: Payload): Promise<Map<string, string>> {
  const cache = new Map<string, string>()

  try {
    // Fetch all richTextDataInstances
    const { docs } = await payload.find({
      collection: 'richTextDataInstances',
      limit: 1000, // Should be enough for all instances
    })

    // Build cache
    for (const doc of docs) {
      if (doc.slug && doc.id) {
        cache.set(doc.slug, doc.id)
      }
    }

    console.log(`   ℹ️  Built slug cache: ${cache.size} richTextDataInstances`)
  } catch (error) {
    console.warn(`   ⚠️  Failed to build slug cache:`, error)
  }

  return cache
}

/**
 * Recursively walk the Lexical tree and resolve _richTextDataSlug references
 */
async function walkAndResolveNode(
  node: LexicalNode,
  slugCache: Map<string, string>
): Promise<void> {
  // Check if this is an inline block with _richTextDataSlug
  if (
    node.type === 'inlineBlock' &&
    node.fields?.blockType === 'dynamicDataInstanceSimple' &&
    node.fields?._richTextDataSlug
  ) {
    const slug = node.fields._richTextDataSlug
    const id = slugCache.get(slug)

    if (id) {
      // Replace _richTextDataSlug with actual ID string
      // For inline blocks, Payload expects just the ID, not a relationship object
      delete node.fields._richTextDataSlug
      node.fields.instance = id
    } else {
      console.warn(`   ⚠️  Could not resolve slug: "${slug}" - instance may not exist`)
      // Leave the _richTextDataSlug field so we can debug later
    }
  }

  // Recurse into children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      await walkAndResolveNode(child, slugCache)
    }
  }
}

/**
 * Resolve slugs in an array of content blocks (for providers/posts migration)
 */
export async function resolveContentBlocks(
  contentBlocks: Array<{ blockType: string; content?: any }> | undefined,
  payload: Payload
): Promise<Array<{ blockType: string; content?: any }>> {
  if (!contentBlocks || !Array.isArray(contentBlocks)) {
    return []
  }

  const results = []

  for (const block of contentBlocks) {
    if (block.blockType === 'richText' && block.content) {
      // Resolve slugs in richText content
      const resolved = await resolveRichTextDataSlugs(block.content, payload)
      results.push({
        ...block,
        content: resolved,
      })
    } else {
      // Keep non-richText blocks as-is
      results.push(block)
    }
  }

  return results
}
