/**
 * MDX to Payload Content Blocks Converter
 *
 * Parses MDX content and splits it into separate content blocks:
 * - Rich text blocks (Markdown converted to Lexical JSON using Payload's converter)
 * - Component blocks (extracted with props)
 * - Image blocks (extracted from markdown images)
 *
 * This ensures components appear as separate blocks in Payload admin
 * and can be rendered individually on the frontend.
 */

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import { visit } from 'unist-util-visit'
import type { Root, Content } from 'mdast'
import {
  convertMarkdownToLexical,
  BoldFeature,
  ItalicFeature,
  HeadingFeature,
  UnderlineFeature,
  UnorderedListFeature,
  OrderedListFeature,
  ParagraphFeature,
  LinkFeature,
  StrikethroughFeature,
  BlockquoteFeature,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'
import type { Config, Payload } from 'payload'
import { processInlineBlocks } from './lexical-inline-block-processor'
import { processLinks } from './lexical-link-processor'
import { cleanupMarkdownArtifacts } from './lexical-markdown-cleanup'
import { uploadImage, findImageFile } from './image-uploader'
import { COMPONENT_REGISTRY, validateComponent as registryValidateComponent } from './component-registry'
import { validateComponent, type ComponentValidationError } from './mdx-component-validator'

export interface SectionMetadata {
  id: string
  title?: string
  headingLevel?: number
}

export interface ContentBlock {
  blockType: string
  content?: any // Lexical JSON for richText blocks
  fields?: Record<string, any> // Props for component blocks
  id?: string
  _section?: SectionMetadata // Section context for programmatic targeting
}

export interface UnhandledComponent {
  name: string
  usageCount: number
  componentType: 'block' | 'inline'
  firstSeenFile: string
  firstSeenLine?: number
}

export interface ParsedContent {
  contentBlocks: ContentBlock[]
  images: Array<{
    url: string
    alt: string
    position: number
  }>
  unhandledComponents: UnhandledComponent[]
}

/**
 * Parse MDX content and split into content blocks
 */
export async function parseMDXToBlocks(
  mdxContent: string,
  payloadConfig?: Config,
  payload?: Payload,
  mdxFilePath?: string,
  options?: {
    stripWrapperComponents?: boolean // Default: true - remove Section/Figure/Aside/Article wrappers
    collectUnhandled?: boolean // Default: false - when true, collect unhandled components instead of throwing
  }
): Promise<ParsedContent> {
  const blocks: ContentBlock[] = []
  const images: ParsedContent['images'] = []
  let currentContentNodes: any[] = [] // Track nodes with positions for raw text extraction
  let pendingAssetManagers: Array<{ props: Record<string, any> }> = [] // Track AssetManagers found in current paragraph
  const validationErrors: ComponentValidationError[] = [] // Track component validation errors
  const unhandledComponentsMap = new Map<string, UnhandledComponent>() // Track unhandled components

  // Default options
  const { stripWrapperComponents = true, collectUnhandled = false } = options || {}

  // Get wrapper components from Component Registry (dynamic)
  const wrapperComponents = Object.entries(COMPONENT_REGISTRY)
    .filter(([_, mapping]) => mapping.componentType === 'wrapper')
    .map(([mdxName]) => mdxName)

  // Pre-process: Remove redundant link wrappers around phone/inline components
  // Pattern: [<Component />](tel:<Component />) or [<Component />](mailto:<Component />)
  // These create corrupt link structures, and phone components already have enablePhoneLink
  const originalLength = mdxContent.length
  mdxContent = mdxContent.replace(
    /\[(<[A-Z][^>]+\s*\/>)\]\((tel:|mailto:)<[A-Z][^>]+\s*\/>\)/g,
    '$1'
  )
  if (mdxContent.length !== originalLength) {
    console.log(`   🔧 Removed link wrappers from inline components`)
  }

  // Track section context during AST traversal (will be populated during walk)
  const sectionStack: SectionMetadata[] = [] // Track nested sections

  // NOTE: We used to strip wrapper components (Section/Figure/Aside/Article) with regex here,
  // but we need to preserve Section tags in the MDX so the AST can see them and extract metadata.
  // Instead, wrapper components are handled during AST traversal (their children are flattened
  // into the main content, and Section metadata is tracked via the sectionStack).

  // Still strip non-Section wrappers if needed (Figure, Aside, Article)
  if (stripWrapperComponents) {
    const beforeLength = mdxContent.length

    // Remove opening tags: <Figure>, <Aside>, <Article> (but NOT Section)
    mdxContent = mdxContent.replace(/<(Figure|Aside|Article)(\s+[^>]*)?\s*>/gi, '\n')

    // Remove closing tags: </Figure>, </Aside>, </Article> (but NOT Section)
    mdxContent = mdxContent.replace(/<\/(Figure|Aside|Article)>/gi, '\n')

    if (mdxContent.length !== beforeLength) {
      console.log(`   🔧 Removed wrapper components (Figure/Aside/Article)`)
    }
  }

  // Parse MDX to AST (this gives us node positions in the source)
  const parser = unified().use(remarkParse).use(remarkMdx)
  const ast = parser.parse(mdxContent)
  const tree = await parser.run(ast)

  // Markdown stringifier ONLY for inline components (when we need to process JSX)
  // For regular content, we'll extract raw text from source to preserve exact spacing
  const stringifier = unified().use(remarkStringify, {
    resourceLink: true,  // Use [text](url) format for links
    emphasis: '*',       // Use * for italic
    strong: '*',         // Use * for bold (doubled automatically)
    bullet: '-',         // Use - for lists
  })

  // Helper to flush accumulated nodes as a richText block
  const flushTextBlock = async () => {
    if (currentContentNodes.length > 0) {
      // CRITICAL FIX: Extract raw markdown from source using node positions
      // This preserves EXACT spacing (including trailing spaces before links)
      // Get markdown text from either original source or stringified AST
      // Prefer original source for preserving spacing, but use stringified AST if nodes were modified
      const firstNode = currentContentNodes[0]
      const lastNode = currentContentNodes[currentContentNodes.length - 1]
      const startOffset = firstNode.position?.start?.offset
      const endOffset = lastNode.position?.end?.offset

      let markdownText: string
      // Check if any inline components were found in this block
      const hasInlineComponents = currentContentNodes.some(node => nodeContainsInlineJSX(node))

      if (hasInlineComponents) {
        // Use stringified AST because extractInlineComponents() modified the nodes
        markdownText = stringifier.stringify({ type: 'root', children: currentContentNodes }).trim()
      } else if (startOffset !== undefined && endOffset !== undefined) {
        // Use original source for exact spacing preservation
        markdownText = mdxContent.slice(startOffset, endOffset).trim()
      } else {
        // Fallback to stringify
        markdownText = stringifier.stringify({ type: 'root', children: currentContentNodes }).trim()
      }

      if (markdownText) {
        // Use Payload's converter if config provided, otherwise fallback to simple conversion
        let lexicalContent
        if (payloadConfig) {
          const editorConfig = await editorConfigFactory.fromFeatures({
            config: payloadConfig,
            features: [
              ParagraphFeature(),
              HeadingFeature({
                enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
              }),
              BoldFeature(),
              ItalicFeature(),
              UnderlineFeature(),
              StrikethroughFeature(),
              UnorderedListFeature(),
              OrderedListFeature(),
              BlockquoteFeature(),
              // LinkFeature requires full config with collections - handle links separately
            ],
          })
          lexicalContent = await convertMarkdownToLexical({
            editorConfig,
            markdown: markdownText,
          })
        } else {
          lexicalContent = markdownToLexical(markdownText)
        }

        // DEBUG: Log markdown text to see if placeholders are present
        if (markdownText.includes('{{INLINE_COMPONENT:AssetManager')) {
          console.log('[DEBUG] Markdown contains AssetManager placeholder')
          console.log('[DEBUG] First 200 chars:', markdownText.substring(0, 200))
        }

        // Post-process to convert inline component placeholders to actual inline block nodes
        lexicalContent = processInlineBlocks(lexicalContent)

        // Post-process to convert markdown link syntax to actual Lexical link nodes
        lexicalContent = processLinks(lexicalContent)

        // Clean up leftover markdown artifacts (escaped brackets, link syntax)
        lexicalContent = cleanupMarkdownArtifacts(lexicalContent)

        // CRITICAL FIX: Restore trailing spaces before links that were stripped by convertMarkdownToLexical
        // Check if markdown has "text [link" pattern and add trailing space to text node
        lexicalContent = restoreLinkSpacing(lexicalContent, markdownText)

        const block: ContentBlock = {
          blockType: 'richText',
          content: lexicalContent,
          id: generateId(),
        }

        // Add section metadata if we're inside a Section
        if (sectionStack.length > 0) {
          // Use the most recent (innermost) section
          block._section = sectionStack[sectionStack.length - 1]
        }

        blocks.push(block)
      }

      currentContentNodes = []
    }
  }

  // Track inline components found in text for post-processing
  const inlineComponents: Array<{ name: string; props: Record<string, any> }> = []

  // Walk the AST and split at component boundaries
  // Use traditional for loop to handle dynamically added children from wrapper flattening
  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i] as any

    // Handle section end marker - flush any accumulated text, then pop the section
    if (node.type === '__SECTION_END__') {
      // CRITICAL: Flush accumulated text BEFORE popping section
      // This ensures the text gets the correct section metadata
      await flushTextBlock()

      if (sectionStack.length > 0) {
        const popped = sectionStack.pop()
        console.log(`   📍 Exiting section: ${popped?.id}`)
      }
      continue
    }

    // BLOCK-LEVEL component (on its own line) → Content Block
    if (node.type === 'mdxJsxFlowElement') {
      const componentName = node.name

      // Wrapper components that contain other content - flatten their children
      // Now using Component Registry instead of hardcoded list
      if (wrapperComponents.includes(componentName)) {
        // Flush current markdown before processing wrapper children
        await flushTextBlock()

        // Special handling for Section: extract metadata and push to stack
        if (componentName === 'Section') {
          const props = extractComponentProps(node)

          if (props.id) {
            const sectionMetadata: SectionMetadata = {
              id: props.id as string,
              title: props.title as string | undefined,
              headingLevel: props.headingLevel ? parseInt(props.headingLevel as string) : undefined
            }
            sectionStack.push(sectionMetadata)
            console.log(`   📍 Entering section: ${sectionMetadata.id}`)
          }
        }

        // Process children recursively by inserting them AFTER current position
        // This ensures children are processed before the next sibling
        // CRITICAL: Use splice() not push() to maintain proper nesting order
        if (node.children && Array.isArray(node.children)) {
          // For Section: insert children after current position, then add a "pop" marker
          if (componentName === 'Section') {
            const nodesToInsert = [
              ...node.children,
              { type: '__SECTION_END__', sectionId: (node as any).attributes?.find((a: any) => a.name === 'id')?.value } as any
            ]
            // Insert after current position (i+1)
            tree.children.splice(i + 1, 0, ...nodesToInsert)
          } else {
            // Other wrappers: just insert children after current position
            tree.children.splice(i + 1, 0, ...node.children)
          }
        }

        continue
      }

      // Non-wrapper atomic components - create block
      // Flush any accumulated markdown
      await flushTextBlock()

      // Extract component props
      const props = extractComponentProps(node)

      // Validate component using Component Registry
      const validationError = validateComponent(
        componentName,
        'block',
        mdxFilePath || 'unknown',
        props
      )

      if (validationError) {
        if (collectUnhandled) {
          // Collect unhandled component instead of throwing
          if (unhandledComponentsMap.has(componentName)) {
            // Increment usage count
            const existing = unhandledComponentsMap.get(componentName)!
            existing.usageCount += 1
          } else {
            // Add new unhandled component
            unhandledComponentsMap.set(componentName, {
              name: componentName,
              usageCount: 1,
              componentType: 'block',
              firstSeenFile: mdxFilePath || 'unknown',
              firstSeenLine: node.position?.start?.line
            })
          }
          // Skip this component and continue processing
          continue
        } else {
          // Default behavior: collect error for throwing later
          validationErrors.push(validationError)
          // Continue processing to collect all errors
          continue
        }
      }

      // Special handling for Image components
      if (componentName === 'Image' && payload && mdxFilePath) {
        try {
          const src = props.src
          const alt = props.alt || ''
          const caption = props.caption || props.title || ''

          if (!src) {
            console.log(`   ⚠️  Image component missing src attribute, skipping`)
            continue
          }

          // Find and upload the image file
          const imagePath = await findImageFile(mdxFilePath, src)
          console.log(`   📸 Uploading image: ${src}`)
          const { mediaId } = await uploadImage(payload, imagePath, alt)

          // Create image block with media reference
          const imageBlock: ContentBlock = {
            blockType: 'image',
            image: mediaId, // Upload relationship field
            alt: alt,
            caption: caption,
            id: generateId(),
          }

          // Add section metadata if we're inside a Section
          if (sectionStack.length > 0) {
            imageBlock._section = sectionStack[sectionStack.length - 1]
          }

          blocks.push(imageBlock)

          console.log(`   ✅ Image uploaded: ${src} → ${mediaId}`)
        } catch (error) {
          console.error(`   ❌ Failed to upload image: ${props.src}`)
          console.error(`      Error: ${error.message}`)
          // Continue processing - don't fail entire migration for one image
        }

        continue
      }

      // Special handling for AssetManager components
      if (componentName === 'AssetManager' && payload && mdxFilePath) {
        try {
          const assetId = props.id

          if (!assetId) {
            console.log(`   ⚠️  AssetManager component missing id attribute, skipping`)
            continue
          }

          // Import AssetManager utilities
          const { getAssetById } = await import('../../../src/lib/astro-asset-manager')
          const { uploadImageWithPayload } = await import('../../../src/lib/media-uploader')

          // Resolve asset from Astro config
          const asset = getAssetById(assetId)

          if (!asset) {
            console.log(`   ⚠️  Asset not found in Astro config: ${assetId}`)
            continue
          }

          if (!asset.exists) {
            console.log(`   ⚠️  Asset file does not exist: ${asset.path}`)
            continue
          }

          // Upload image to Payload Media collection using Payload Local API
          // This triggers Sharp thumbnail generation and R2 upload automatically
          console.log(`   📸 Uploading AssetManager image: ${assetId}`)
          const mediaId = await uploadImageWithPayload(asset, payload)

          if (!mediaId) {
            console.log(`   ❌ Failed to upload asset: ${assetId}`)
            continue
          }

          // Create mediaBlock with uploaded image reference
          const mediaBlock: ContentBlock = {
            blockType: 'mediaBlock',
            media: mediaId, // Relationship to Media collection
            id: generateId(),
          }

          // Add section metadata if we're inside a Section
          if (sectionStack.length > 0) {
            mediaBlock._section = sectionStack[sectionStack.length - 1]
          }

          blocks.push(mediaBlock)

          console.log(`   ✅ AssetManager uploaded: ${assetId} → Media ID: ${mediaId}`)
        } catch (error) {
          console.error(`   ❌ Failed to process AssetManager: ${props.id}`)
          console.error(`      Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
          // Skip this AssetManager component - don't fail entire migration for one image
          continue
        }

        continue
      }

      // Normalize component name to camelCase (Payload block slugs use camelCase)
      // E.g., FaqEndpoint → faqEndpoint, Figure → figure
      const blockType = componentName.charAt(0).toLowerCase() + componentName.slice(1)

      const componentBlock: ContentBlock = {
        blockType,
        ...props, // Spread props directly on block object (not nested under 'fields')
        id: generateId(),
      }

      // Add section metadata if we're inside a Section
      if (sectionStack.length > 0) {
        componentBlock._section = sectionStack[sectionStack.length - 1]
      }

      blocks.push(componentBlock)

      // Don't process children - components are atomic blocks
      continue
    }

    // INLINE component (within text) → Track for inline block conversion
    // Note: mdxJsxTextElement components need to be embedded in Lexical content
    if (node.type === 'mdxJsxTextElement') {
      const componentName = node.name
      const props = extractComponentProps(node)

      // Validate inline component using Component Registry
      const validationError = validateComponent(
        componentName,
        'inline',
        mdxFilePath || 'unknown',
        props
      )

      if (validationError) {
        validationErrors.push(validationError)
        // Continue processing to collect all errors
        continue
      }

      console.log(
        `Found inline component: ${componentName}. Will convert to inline block within text.`
      )

      inlineComponents.push({ name: componentName, props })

      // Add a text node with placeholder that we'll convert to inline block later
      // Since we're accumulating AST nodes now, create a proper text node
      currentContentNodes.push({
        type: 'text',
        value: `{{INLINE_COMPONENT:${componentName}:${JSON.stringify(props)}}}`
      })
      continue
    }

    // Regular content node - accumulate AST nodes (stringify them together later)
    if (isContentNode(node)) {
      // Check if this node contains inline JSX elements
      const hasInlineJSX = nodeContainsInlineJSX(node)

      if (hasInlineJSX) {
        // Process the node to extract inline components and convert to placeholders
        const processedNode = extractInlineComponents(
          node,
          inlineComponents,
          collectUnhandled,
          unhandledComponentsMap,
          mdxFilePath,
          pendingAssetManagers
        )
        // Push the AST node directly - we'll stringify all nodes together later
        currentContentNodes.push(processedNode)
      } else {
        // No inline JSX - push the AST node directly
        // By accumulating AST nodes and stringifying them together, remark can preserve
        // spacing between adjacent nodes (e.g., "text" before link, link, "text" after link)
        currentContentNodes.push(node)
      }

      // Check for images in this node
      visit(node, 'image', (imageNode: any) => {
        images.push({
          url: imageNode.url,
          alt: imageNode.alt || '',
          position: blocks.length,
        })
      })
    }
  }

  // Flush any remaining markdown
  await flushTextBlock()

  // Fail-fast: Throw if any unmapped components were found (unless collectUnhandled is true)
  if (validationErrors.length > 0 && !collectUnhandled) {
    // Import throwIfValidationErrors to throw formatted error
    const { throwIfValidationErrors } = await import('./mdx-component-validator')
    throwIfValidationErrors(validationErrors, mdxFilePath || 'unknown')
  }

  return {
    contentBlocks: blocks,
    images,
    unhandledComponents: Array.from(unhandledComponentsMap.values()),
  }
}

/**
 * Extract props from MDX component node
 *
 * CRITICAL: Preserve ALL prop values for round-trip MDX import/export fidelity.
 * Empty strings and undefined values must be stored exactly as they appear in MDX.
 *
 * Updated: 2025-10-26 for round-trip fidelity (removed skipping of empty strings)
 */
function extractComponentProps(node: any): Record<string, any> {
  const props: Record<string, any> = {}

  if (!node.attributes) return props

  for (const attr of node.attributes) {
    if (attr.type === 'mdxJsxAttribute') {
      const name = attr.name
      let value: any

      if (!attr.value) {
        // No value attribute means it's a boolean prop (e.g., <Component enabled />)
        // Store as true for round-trip fidelity
        value = true
      } else if (typeof attr.value === 'string') {
        // String literal - PRESERVE empty strings for round-trip fidelity!
        // Original MDX: showUtility="" should export as showUtility=""
        value = attr.value
      } else if (attr.value.type === 'mdxJsxAttributeValueExpression') {
        // Expression (e.g., {["foo", "bar"]})
        value = evalExpression(attr.value.value)
      }

      props[name] = value
    }
  }

  return props
}

/**
 * Safely evaluate JSX expression value
 */
function evalExpression(exprString: string): any {
  try {
    // Handle common cases
    if (exprString === 'true') return true
    if (exprString === 'false') return false
    if (exprString === 'null') return null
    if (exprString === 'undefined') return undefined

    // Try to parse as JSON for arrays/objects
    if (exprString.startsWith('[') || exprString.startsWith('{')) {
      return JSON.parse(exprString.replace(/'/g, '"'))
    }

    // Numbers
    const num = Number(exprString)
    if (!isNaN(num)) return num

    // Default: return as string
    return exprString
  } catch (e) {
    // If all else fails, return the string
    return exprString
  }
}

/**
 * Check if node should be included in text blocks
 */
function isContentNode(node: any): boolean {
  const contentTypes = [
    'paragraph',
    'heading',
    'list',
    'listItem',
    'blockquote',
    'code',
    'thematicBreak',
    'html',
    'table',
  ]
  return contentTypes.includes(node.type)
}

/**
 * Check if a node contains inline JSX elements
 */
function nodeContainsInlineJSX(node: any): boolean {
  if (!node) return false

  if (node.type === 'mdxJsxTextElement' || node.type === 'mdxTextExpression') {
    return true
  }

  if (node.children && Array.isArray(node.children)) {
    return node.children.some(nodeContainsInlineJSX)
  }

  return false
}

/**
 * Extract inline components from a node tree and replace with placeholders
 * Mutates the inlineComponents array to track found components
 */
function extractInlineComponents(
  node: any,
  inlineComponents: Array<{ name: string; props: Record<string, any> }>,
  collectUnhandled: boolean = false,
  unhandledComponentsMap?: Map<string, UnhandledComponent>,
  mdxFilePath?: string,
  assetManagers?: Array<{ props: Record<string, any> }>
): any {
  if (!node) return node

  // If this is an inline JSX element, extract it and replace with placeholder
  if (node.type === 'mdxJsxTextElement') {
    const componentName = node.name
    const props = extractComponentProps(node)

    // Check if component is registered and can render inline using Component Registry
    const mapping = COMPONENT_REGISTRY[componentName]

    // DEBUG: Log AssetManager registry entry
    if (componentName === 'AssetManager') {
      console.log(`[DEBUG] AssetManager registry entry:`, JSON.stringify(mapping, null, 2))
    }

    if (mapping && mapping.canRenderInline && mapping.status === 'implemented') {
      console.log(
        `Extracting inline component from paragraph: ${componentName}. Will convert to inline block.`
      )

      inlineComponents.push({ name: componentName, props })

      return {
        type: 'text',
        value: `{{INLINE_COMPONENT:${componentName}:${JSON.stringify(props)}}}`,
      }
    } else {
      // Special handling for AssetManager - convert to inline Upload node
      if (componentName === 'AssetManager' && mapping) {
        console.log(`📸 Extracting inline AssetManager as inline Upload node (id: ${props.id || 'none'})`)

        // Add to inlineComponents array for processing
        inlineComponents.push({ name: componentName, props })

        // Return placeholder that will be converted to Lexical Upload node
        return {
          type: 'text',
          value: `{{INLINE_COMPONENT:${componentName}:${JSON.stringify(props)}}}`,
        }
      }

      // Unsupported component - collect or skip based on collectUnhandled flag
      if (collectUnhandled && unhandledComponentsMap) {
        // Collect unhandled inline component
        if (unhandledComponentsMap.has(componentName)) {
          // Increment usage count
          const existing = unhandledComponentsMap.get(componentName)!
          existing.usageCount += 1
        } else {
          // Add new unhandled inline component
          unhandledComponentsMap.set(componentName, {
            name: componentName,
            usageCount: 1,
            componentType: 'inline',
            firstSeenFile: mdxFilePath || 'unknown',
            firstSeenLine: node.position?.start?.line
          })
        }
      } else {
        // Default behavior: log warning
        console.log(
          `⚠️  Skipping unsupported inline component: ${componentName} (not registered or not implemented for inline rendering)`
        )
      }

      // Replace with placeholder text
      return {
        type: 'text',
        value: `[${componentName}]`, // Simple placeholder
      }
    }
  }

  // Strip out expressions entirely
  if (node.type === 'mdxTextExpression') {
    return {
      type: 'text',
      value: '',
    }
  }

  // If node has children, recursively process them
  if (node.children && Array.isArray(node.children)) {
    return {
      ...node,
      children: node.children.map((child) =>
        extractInlineComponents(child, inlineComponents, collectUnhandled, unhandledComponentsMap, mdxFilePath, assetManagers)
      ).filter(Boolean),
    }
  }

  return node
}

/**
 * Strip out inline JSX elements from a node tree (legacy function - keeping for compatibility)
 * This removes mdxJsxTextElement and mdxTextExpression nodes
 * so Payload's markdown converter doesn't choke on them
 */
function stripInlineJSX(node: any): any {
  if (!node) return node

  // If this is an inline JSX element or expression, replace with text placeholder
  if (node.type === 'mdxJsxTextElement') {
    return {
      type: 'text',
      value: `[${node.name}]`, // Placeholder like [Link] or [Button]
    }
  }

  if (node.type === 'mdxTextExpression') {
    return {
      type: 'text',
      value: '', // Strip out expressions entirely
    }
  }

  // If node has children, recursively strip them
  if (node.children && Array.isArray(node.children)) {
    return {
      ...node,
      children: node.children.map(stripInlineJSX).filter(Boolean),
    }
  }

  return node
}

/**
 * Convert Markdown to Lexical JSON format with inline block support
 *
 * This is a simplified converter. For production, consider using:
 * - @lexical/markdown for proper conversion
 * - markdown-to-lexical package
 */
function markdownToLexical(markdown: string): any {
  // Split into paragraphs
  const paragraphs = markdown.split(/\n\n+/)

  const children = paragraphs
    .filter(p => p.trim())
    .map(paragraph => {
      const paragraphChildren = convertTextWithInlineBlocks(paragraph.trim())

      return {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: paragraphChildren,
        direction: 'ltr'
      }
    })

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr'
    }
  }
}

/**
 * Generate unique ID for link nodes (Payload format)
 */
function generateLinkId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Parse markdown links in text and convert to Lexical link nodes
 * Matches Payload's exact link structure with fields.url
 */
function parseMarkdownLinks(text: string): any[] {
  const nodes: any[] = []

  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, linkUrl] = match
    const matchIndex = match.index

    // Add text before the link
    if (matchIndex > lastIndex) {
      const textBefore = text.substring(lastIndex, matchIndex)
      if (textBefore) {
        nodes.push({
          type: 'text',
          text: textBefore,
          format: 0,
          mode: 'normal',
          style: '',
          detail: 0,
          version: 1
        })
      }
    }

    // Add link node (matching Payload's structure exactly)
    nodes.push({
      type: 'link',
      version: 3,
      direction: null,
      format: '',
      indent: 0,
      fields: {
        url: linkUrl,
        newTab: false,
        linkType: 'custom'
      },
      id: generateLinkId(),
      children: [{
        type: 'text',
        text: linkText,
        format: 0,
        mode: 'normal',
        style: '',
        detail: 0,
        version: 1
      }]
    })

    lastIndex = matchIndex + fullMatch.length
  }

  // Add any remaining text after the last link
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex)
    if (textAfter) {
      nodes.push({
        type: 'text',
        text: textAfter,
        format: 0,
        mode: 'normal',
        style: '',
        detail: 0,
        version: 1
      })
    }
  }

  // If no links were found, return null to indicate no processing done
  if (nodes.length === 0) {
    return []
  }

  return nodes
}

/**
 * Convert text with inline component placeholders to Lexical nodes
 * Handles {{INLINE_COMPONENT:ComponentName:{"prop":"value"}}} placeholders
 * Also handles markdown links [text](url)
 */
function convertTextWithInlineBlocks(text: string): any[] {
  // First, parse markdown links
  const linksParsed = parseMarkdownLinks(text)

  // If we found links, process each segment for inline components
  if (linksParsed.length > 0) {
    const finalNodes: any[] = []

    for (const node of linksParsed) {
      if (node.type === 'text') {
        // Check if this text segment has inline components
        const processedNodes = processTextWithInlineComponents(node.text)
        finalNodes.push(...processedNodes)
      } else {
        // Keep link nodes as-is (but could process link text for inline components if needed)
        finalNodes.push(node)
      }
    }

    return finalNodes
  }

  // No links found, just process inline components
  return processTextWithInlineComponents(text)
}

/**
 * Process text for inline component placeholders only
 */
function processTextWithInlineComponents(text: string): any[] {
  const nodes: any[] = []

  // Regex to match inline component placeholders
  const inlineComponentRegex = /\{\{INLINE_COMPONENT:([^:]+):(\{[^}]*\})\}\}/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = inlineComponentRegex.exec(text)) !== null) {
    const [fullMatch, componentName, propsJson] = match
    const matchIndex = match.index

    // Add text before the component
    if (matchIndex > lastIndex) {
      const textBefore = text.substring(lastIndex, matchIndex)
      if (textBefore.trim()) {
        nodes.push({
          type: 'text',
          text: textBefore,
          format: 0,
          mode: 'normal',
          style: '',
          detail: 0,
          version: 1
        })
      }
    }

    // Parse props
    let props = {}
    try {
      props = JSON.parse(propsJson)
    } catch (e) {
      console.error(`Failed to parse inline component props: ${propsJson}`, e)
    }

    // Normalize component name to camelCase for block slug
    const blockSlug = componentName.charAt(0).toLowerCase() + componentName.slice(1)

    // Add inline block node
    nodes.push({
      type: 'block',
      format: '',
      version: 1,
      fields: {
        blockType: blockSlug,
        ...props,
      }
    })

    lastIndex = matchIndex + fullMatch.length
  }

  // Add any remaining text after the last component
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex)
    if (textAfter.trim()) {
      nodes.push({
        type: 'text',
        text: textAfter,
        format: 0,
        mode: 'normal',
        style: '',
        detail: 0,
        version: 1
      })
    }
  }

  // If no components were found, return simple text node
  if (nodes.length === 0 && text.trim()) {
    return [{
      type: 'text',
      text: text,
      format: 0,
      mode: 'normal',
      style: '',
      detail: 0,
      version: 1
    }]
  }

  return nodes
}

/**
 * Generate a unique ID for content blocks
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Restore spaces around links that were stripped by convertMarkdownToLexical
 *
 * The issue: convertMarkdownToLexical strips BOTH:
 * 1. Trailing spaces from text nodes before links: "visit [link]" becomes text:"visit" + link
 * 2. Leading spaces from text nodes after links: "[link] at" becomes link + text:"at"
 *
 * This function detects patterns in the original markdown and adds the missing spaces
 * to the corresponding text nodes in the Lexical JSON.
 */
function restoreLinkSpacing(lexicalContent: any, originalMarkdown: string): any {
  if (!lexicalContent || !lexicalContent.root) return lexicalContent

  // Find all patterns where text is immediately followed by a link in markdown
  // Pattern: "word [link]" indicates the word should have trailing space
  const beforeLinkPatterns: Array<{ word: string }> = []
  const beforeLinkRegex = /(\S+)\s+\[/g
  let match: RegExpExecArray | null
  while ((match = beforeLinkRegex.exec(originalMarkdown)) !== null) {
    const word = match[1]
    beforeLinkPatterns.push({ word })
  }

  // Find all patterns where link is immediately followed by text
  // Pattern: "[link] word" indicates the word should have leading space
  const afterLinkPatterns: Array<{ word: string }> = []
  const afterLinkRegex = /\]\([^\)]+\)\s+(\S+)/g
  while ((match = afterLinkRegex.exec(originalMarkdown)) !== null) {
    const word = match[1]
    afterLinkPatterns.push({ word })
  }

  // Recursively walk the Lexical tree and add missing spaces
  function processNode(node: any): any {
    if (!node) return node

    // Process paragraph nodes (they contain text and link nodes as siblings)
    if (node.type === 'paragraph' && node.children && Array.isArray(node.children)) {
      const newChildren = []
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        const nextChild = node.children[i + 1]
        const prevChild = i > 0 ? node.children[i - 1] : null

        // Case 1: Text node BEFORE a link - add trailing space
        if (child.type === 'text' && nextChild && nextChild.type === 'link') {
          const trimmedText = child.text.trim()
          const matchingPattern = beforeLinkPatterns.find(p => trimmedText.endsWith(p.word))
          if (matchingPattern && !child.text.endsWith(' ')) {
            newChildren.push({
              ...child,
              text: child.text + ' '
            })
            continue
          }
        }

        // Case 2: Text node AFTER a link - add leading space
        if (child.type === 'text' && prevChild && prevChild.type === 'link') {
          const trimmedText = child.text.trim()
          const matchingPattern = afterLinkPatterns.find(p => trimmedText.startsWith(p.word))
          if (matchingPattern && !child.text.startsWith(' ')) {
            newChildren.push({
              ...child,
              text: ' ' + child.text
            })
            continue
          }
        }

        newChildren.push(child)
      }

      return {
        ...node,
        children: newChildren.map(c => processNode(c))
      }
    }

    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      return {
        ...node,
        children: node.children.map((c: any) => processNode(c))
      }
    }

    return node
  }

  return {
    ...lexicalContent,
    root: processNode(lexicalContent.root)
  }
}

/**
 * Example usage:
 *
 * const mdx = `
 * This is some text.
 *
 * <LowestRateDisplay utilityId={3} pricingBasedOn={1000} />
 *
 * More text here.
 * `
 *
 * const result = await parseMDXToBlocks(mdx)
 * // result.contentBlocks = [
 * //   {blockType: 'richText', content: {root: {...}}},
 * //   {blockType: 'LowestRateDisplay', fields: {utilityId: 3, pricingBasedOn: 1000}},
 * //   {blockType: 'richText', content: {root: {...}}}
 * // ]
 */
