/**
 * Image to AssetManager Transformer
 *
 * Detects <Image>, <svg>, <Picture> tags in MDX and transforms them to
 * AssetManager blocks (block-level) or inline blocks (inline usage).
 *
 * Features:
 * - Dynamically adapts to AssetManager component structure
 * - Creates asset registry entries
 * - Creates media records in Payload
 * - Maps image attributes to AssetManager props
 * - Generates unique asset IDs
 * - Handles both block and inline image usage
 */

import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import type { AssetManagerAnalysis } from './asset-manager-analyzer.js'
import { getAssetManagerAnalysis } from './asset-manager-analyzer.js'

/**
 * Image tag detected in MDX
 */
export interface DetectedImage {
  type: 'Image' | 'svg' | 'Picture' | 'img'
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  class?: string
  title?: string
  loading?: string
  layout?: string
  props: Record<string, string> // All attributes
  isInline: boolean // True if inside paragraph, false if block-level
  originalTag: string // Full original tag for context
}

/**
 * Asset registry entry to be created
 */
export interface AssetRegistryEntry {
  id: string // e.g., "image-provider-logo-reliant"
  name: string
  path: string // With @assets-* prefix
  width?: number
  height?: number
  alt?: string
}

/**
 * Media record to be created in Payload
 */
export interface MediaRecord {
  assetId: string
  filename: string
  alt: string
  mimeType?: string
  filesize?: number
  width?: number
  height?: number
}

/**
 * AssetManager block/inline block configuration
 */
export interface AssetManagerBlockConfig {
  blockType: 'assetManager' | 'assetManagerInline'
  assetId: string
  props: {
    id: string
    width?: number | string
    height?: number | string
    alt?: string
    class?: string
    loading?: string
    layout?: string
  }
}

/**
 * Transformation result for a single image
 */
export interface ImageTransformResult {
  detectedImage: DetectedImage
  assetRegistryEntry: AssetRegistryEntry
  mediaRecord: MediaRecord
  blockConfig: AssetManagerBlockConfig
}

/**
 * Detect all image tags in MDX content
 *
 * @param mdxContent - MDX content to scan
 * @returns Array of detected images
 */
export function detectImages(mdxContent: string): DetectedImage[] {
  const images: DetectedImage[] = []

  // Pattern 1: <Image ... /> (Astro Image component)
  const imageRegex = /<Image\s+([^>]+?)\/>/gi
  let match

  while ((match = imageRegex.exec(mdxContent)) !== null) {
    const propsString = match[1]
    const props = parseProps(propsString)

    images.push({
      type: 'Image',
      src: props.src || '',
      alt: props.alt,
      width: props.width,
      height: props.height,
      class: props.class || props.className,
      loading: props.loading,
      layout: props.layout,
      props,
      isInline: isInsideParagraph(mdxContent, match.index),
      originalTag: match[0],
    })
  }

  // Pattern 2: <img ... /> (HTML img tag)
  const imgRegex = /<img\s+([^>]+?)\/?>/gi
  while ((match = imgRegex.exec(mdxContent)) !== null) {
    const propsString = match[1]
    const props = parseProps(propsString)

    images.push({
      type: 'img',
      src: props.src || '',
      alt: props.alt,
      width: props.width,
      height: props.height,
      class: props.class || props.className,
      loading: props.loading,
      props,
      isInline: isInsideParagraph(mdxContent, match.index),
      originalTag: match[0],
    })
  }

  // Pattern 3: <svg ... /> (inline SVG)
  const svgRegex = /<svg\s+([^>]*?)(?:\/>|>[\s\S]*?<\/svg>)/gi
  while ((match = svgRegex.exec(mdxContent)) !== null) {
    const propsString = match[1]
    const props = parseProps(propsString)

    // For SVG, check if it has a src/href attribute (external SVG reference)
    // If no src, it's an inline SVG that shouldn't be converted to AssetManager
    if (!props.src && !props.href) {
      continue // Skip inline SVG definitions
    }

    images.push({
      type: 'svg',
      src: props.src || props.href || '',
      alt: props.alt || props.title,
      width: props.width,
      height: props.height,
      class: props.class || props.className,
      props,
      isInline: isInsideParagraph(mdxContent, match.index),
      originalTag: match[0],
    })
  }

  // Pattern 4: <Picture> (Astro Picture component)
  const pictureRegex = /<Picture\s+([^>]+?)\/>/gi
  while ((match = pictureRegex.exec(mdxContent)) !== null) {
    const propsString = match[1]
    const props = parseProps(propsString)

    images.push({
      type: 'Picture',
      src: props.src || '',
      alt: props.alt,
      width: props.width,
      height: props.height,
      class: props.class || props.className,
      loading: props.loading,
      props,
      isInline: isInsideParagraph(mdxContent, match.index),
      originalTag: match[0],
    })
  }

  return images
}

/**
 * Parse component props from string
 *
 * Handles: prop="value", prop={value}, prop={`template`}, prop
 */
function parseProps(propsString: string): Record<string, string> {
  const props: Record<string, string> = {}

  // Pattern: propName="value" or propName='value'
  const quotedPropRegex = /(\w+)=["']([^"']+)["']/g
  let match

  while ((match = quotedPropRegex.exec(propsString)) !== null) {
    props[match[1]] = match[2]
  }

  // Pattern: propName={value} or propName={`template`}
  const bracePropRegex = /(\w+)=\{`?([^}`]+)`?\}/g
  while ((match = bracePropRegex.exec(propsString)) !== null) {
    props[match[1]] = match[2]
  }

  // Pattern: boolean prop (no value)
  const boolPropRegex = /\s(\w+)(?=\s|$|\/)/g
  while ((match = boolPropRegex.exec(propsString)) !== null) {
    if (!props[match[1]]) {
      props[match[1]] = 'true'
    }
  }

  return props
}

/**
 * Check if match index is inside a paragraph block
 */
function isInsideParagraph(content: string, matchIndex: number): boolean {
  // Look backward to find the start of the line
  let lineStart = matchIndex
  while (lineStart > 0 && content[lineStart - 1] !== '\n') {
    lineStart--
  }

  // Look forward to find the end of the line
  let lineEnd = matchIndex
  while (lineEnd < content.length && content[lineEnd] !== '\n') {
    lineEnd++
  }

  const line = content.substring(lineStart, lineEnd).trim()

  // Check if line starts with markdown block syntax
  const blockStarters = /^(#{1,6}\s|>\s|\*\s|-\s|\d+\.\s|```|<[A-Z])/
  if (blockStarters.test(line)) {
    return false // Block-level
  }

  // Check if preceded/followed by text on same line
  const beforeMatch = content.substring(lineStart, matchIndex).trim()
  const afterMatch = content.substring(matchIndex, lineEnd).trim()

  // If there's text before or after on the same line, it's inline
  return beforeMatch.length > 0 || afterMatch.length > 0
}

/**
 * Generate unique asset ID from image source
 *
 * @param src - Image source path
 * @param type - Image type
 * @param idHint - Optional hint for ID naming (e.g., "provider-logo")
 * @returns Unique asset ID
 */
export function generateAssetId(
  src: string,
  type: string,
  idHint?: string
): string {
  // Extract filename without extension
  const filename = path.basename(src, path.extname(src))
  const cleanFilename = filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Determine category prefix
  let prefix = 'asset'

  if (type === 'Image' || type === 'img') {
    prefix = 'image'
  } else if (type === 'svg') {
    prefix = 'icon'
  }

  // Use hint if provided
  if (idHint) {
    return `${prefix}-${idHint}-${cleanFilename}`
  }

  // Check for common patterns in path
  if (src.includes('/logos/')) {
    prefix = src.includes('/providers/') ? 'image-logo-provider' : 'image-logo'
  } else if (src.includes('/team/')) {
    prefix = 'image-team'
  } else if (src.includes('/icons/')) {
    prefix = 'icon'
  }

  return `${prefix}-${cleanFilename}`
}

/**
 * Resolve image source to asset path with prefix
 *
 * @param src - Original image source
 * @param astroProjectPath - Path to Astro project
 * @returns Resolved path with @assets-* prefix
 */
export function resolveAssetPath(
  src: string,
  astroProjectPath: string
): string {
  // If already has a prefix, return as-is
  if (src.startsWith('@assets-')) {
    return src
  }

  // CDN URL
  if (src.startsWith('http://') || src.startsWith('https://')) {
    if (src.includes('cdn.comparepower.com')) {
      return src.replace('https://cdn.comparepower.com/', '@assets-cdn/')
    }
    // External URL - keep as-is
    return src
  }

  // Absolute path from public/
  if (src.startsWith('/')) {
    return `@assets-public${src}`
  }

  // Relative path - assume it's in src/assets/
  return `@assets-src-images/${src}`
}

/**
 * Transform detected image to AssetManager configuration
 *
 * @param image - Detected image
 * @param analysis - AssetManager component analysis
 * @param astroProjectPath - Path to Astro project
 * @returns Transformation result
 */
export function transformImageToAssetManager(
  image: DetectedImage,
  analysis: AssetManagerAnalysis,
  astroProjectPath: string
): ImageTransformResult {
  const assetId = generateAssetId(image.src, image.type)
  const assetPath = resolveAssetPath(image.src, astroProjectPath)

  // Parse width/height to numbers if possible
  const width = typeof image.width === 'string' ? parseInt(image.width, 10) : image.width
  const height = typeof image.height === 'string' ? parseInt(image.height, 10) : image.height

  // Generate asset registry entry
  const assetRegistryEntry: AssetRegistryEntry = {
    id: assetId,
    name: image.alt || path.basename(image.src, path.extname(image.src)),
    path: assetPath,
    width: width || undefined,
    height: height || undefined,
    alt: image.alt,
  }

  // Generate media record
  const mediaRecord: MediaRecord = {
    assetId,
    filename: path.basename(image.src),
    alt: image.alt || '',
    width: width || undefined,
    height: height || undefined,
  }

  // Generate AssetManager block config
  const blockConfig: AssetManagerBlockConfig = {
    blockType: image.isInline ? 'assetManagerInline' : 'assetManager',
    assetId,
    props: {
      id: assetId,
      width: image.width,
      height: image.height,
      alt: image.alt,
      class: image.class,
      loading: image.loading,
      layout: image.layout,
    },
  }

  return {
    detectedImage: image,
    assetRegistryEntry,
    mediaRecord,
    blockConfig,
  }
}

/**
 * Transform all images in MDX content to AssetManager configurations
 *
 * @param mdxContent - MDX content to process
 * @param astroProjectPath - Path to Astro project
 * @returns Array of transformation results
 */
export async function transformAllImages(
  mdxContent: string,
  astroProjectPath: string
): Promise<ImageTransformResult[]> {
  const analysis = await getAssetManagerAnalysis(astroProjectPath)
  const detectedImages = detectImages(mdxContent)

  return detectedImages.map(image =>
    transformImageToAssetManager(image, analysis, astroProjectPath)
  )
}

/**
 * Generate asset registry code for multiple assets
 *
 * @param entries - Asset registry entries
 * @returns TypeScript code for asset registry
 */
export function generateAssetRegistryCode(entries: AssetRegistryEntry[]): string {
  const lines = entries.map(entry => {
    const props = [
      `    id: "${entry.id}",`,
      `    name: "${entry.name}",`,
      `    path: "${entry.path}",`,
      entry.width ? `    width: ${entry.width},` : null,
      entry.height ? `    height: ${entry.height},` : null,
      entry.alt ? `    alt: "${entry.alt.replace(/"/g, '\\"')}",` : null,
    ].filter(Boolean).join('\n')

    return `  "${entry.id}": {\n${props}\n  },`
  })

  return lines.join('\n\n')
}
