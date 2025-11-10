/**
 * AssetManager Component Analyzer
 *
 * Dynamically reads and parses the AssetManager.astro component to understand:
 * - Props interface structure
 * - Supported properties and types
 * - Asset path resolution logic
 * - Auto-detection features
 *
 * This allows the migration system to adapt in real-time if the AssetManager
 * component changes during development.
 */

import fs from 'fs/promises'
import path from 'path'

/**
 * Parsed AssetManager prop definition
 */
export interface AssetManagerProp {
  name: string
  type: string
  optional: boolean
  description?: string
  defaultValue?: string
  examples?: string[]
}

/**
 * Complete AssetManager component analysis
 */
export interface AssetManagerAnalysis {
  props: AssetManagerProp[]
  pathPrefixes: string[]
  layoutModes: string[]
  loadingModes: string[]
  autoDetectFeatures: string[]
  version: string // Hash of component file for cache invalidation
}

/**
 * Parse TypeScript interface from component file
 */
function parsePropsInterface(content: string): AssetManagerProp[] {
  const props: AssetManagerProp[] = []

  // Find the Props interface block
  const interfaceMatch = content.match(/interface Props \{([\s\S]*?)\}/m)
  if (!interfaceMatch) {
    throw new Error('Could not find Props interface in AssetManager.astro')
  }

  const interfaceBody = interfaceMatch[1]

  // Parse each prop line (handle multi-line JSDoc comments)
  const propRegex = /\/\*\*[\s\S]*?\*\/\s*(\w+)(\?)?\s*:\s*([^;]+);/g
  let match

  while ((match = propRegex.exec(interfaceBody)) !== null) {
    const [fullMatch, propName, optional, propType] = match

    // Extract JSDoc description
    const jsdocMatch = fullMatch.match(/\/\*\*([\s\S]*?)\*\//)
    let description = ''
    const examples: string[] = []

    if (jsdocMatch) {
      const jsdoc = jsdocMatch[1]

      // Extract main description (first @remarks or first paragraph)
      const descMatch = jsdoc.match(/\*\s*([^@\n][^\n]*)/m)
      if (descMatch) {
        description = descMatch[1].trim()
      }

      // Extract @example values
      const exampleMatches = jsdoc.matchAll(/@example\s+([^\n]+)/g)
      for (const exMatch of exampleMatches) {
        examples.push(exMatch[1].trim())
      }
    }

    // Extract default value from JSDoc
    const defaultMatch = fullMatch.match(/@default\s+"?([^"\n]+)"?/)
    const defaultValue = defaultMatch ? defaultMatch[1].trim() : undefined

    props.push({
      name: propName,
      type: propType.trim(),
      optional: !!optional,
      description,
      defaultValue,
      examples: examples.length > 0 ? examples : undefined,
    })
  }

  return props
}

/**
 * Extract asset path prefixes from component
 */
function extractPathPrefixes(content: string): string[] {
  const prefixes = new Set<string>()

  // Find all path prefix checks
  const prefixMatches = content.matchAll(/startsWith\(['"](@[^'"]+)['"]\)/g)
  for (const match of prefixMatches) {
    prefixes.add(match[1])
  }

  // Also check for replace patterns
  const replaceMatches = content.matchAll(/\.replace\(['"](@[^'"]+)['"],/g)
  for (const match of replaceMatches) {
    prefixes.add(match[1])
  }

  return Array.from(prefixes).sort()
}

/**
 * Extract layout modes from component
 */
function extractLayoutModes(content: string): string[] {
  const layoutMatch = content.match(/layout\?\s*:\s*"([^"]+)"\s*\|\s*"([^"]+)"\s*\|\s*"([^"]+)"/)
  if (layoutMatch) {
    return [layoutMatch[1], layoutMatch[2], layoutMatch[3]]
  }

  // Fallback: search for string literals in layout prop type
  const layoutPropMatch = content.match(/layout\?\s*:\s*([^;]+);/)
  if (layoutPropMatch) {
    const matches = layoutPropMatch[1].matchAll(/"([^"]+)"/g)
    return Array.from(matches, m => m[1])
  }

  return ['constrained', 'full-width', 'fixed'] // Fallback defaults
}

/**
 * Extract loading modes from component
 */
function extractLoadingModes(content: string): string[] {
  const loadingMatch = content.match(/loading\?\s*:\s*"([^"]+)"\s*\|\s*"([^"]+)"/)
  if (loadingMatch) {
    return [loadingMatch[1], loadingMatch[2]]
  }

  return ['lazy', 'eager'] // Fallback defaults
}

/**
 * Detect auto-detection features from component
 */
function extractAutoDetectFeatures(content: string): string[] {
  const features: string[] = []

  if (content.includes('detectSizeFromClass')) {
    features.push('width-from-tailwind')
  }

  if (content.includes('w-28') || content.includes('size-')) {
    features.push('tailwind-size-classes')
  }

  if (content.includes('finalWidth') && content.includes('detectedWidth')) {
    features.push('width-priority-resolution')
  }

  return features
}

/**
 * Generate version hash from file content
 */
function generateVersionHash(content: string): string {
  // Simple hash for cache invalidation (first 8 chars of content-based hash)
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8)
}

/**
 * Analyze AssetManager component structure
 *
 * @param astroProjectPath - Path to Astro project root
 * @returns Complete analysis of AssetManager component
 */
export async function analyzeAssetManager(
  astroProjectPath: string
): Promise<AssetManagerAnalysis> {
  const componentPath = path.join(
    astroProjectPath,
    'src/components/common/AssetManager.astro'
  )

  try {
    const content = await fs.readFile(componentPath, 'utf-8')

    return {
      props: parsePropsInterface(content),
      pathPrefixes: extractPathPrefixes(content),
      layoutModes: extractLayoutModes(content),
      loadingModes: extractLoadingModes(content),
      autoDetectFeatures: extractAutoDetectFeatures(content),
      version: generateVersionHash(content),
    }
  } catch (error: any) {
    throw new Error(
      `Failed to analyze AssetManager component: ${error.message}\n` +
      `Path: ${componentPath}\n` +
      `Make sure the Astro project path is correct.`
    )
  }
}

/**
 * Get asset registry structure
 *
 * @param astroProjectPath - Path to Astro project root
 * @returns Asset registry information
 */
export async function analyzeAssetRegistry(astroProjectPath: string) {
  const registryPath = path.join(astroProjectPath, 'src/config/assets.config.ts')

  try {
    const content = await fs.readFile(registryPath, 'utf-8')

    // Extract Asset interface
    const assetInterfaceMatch = content.match(/export interface Asset \{([\s\S]*?)\}/)
    const assetFields: string[] = []

    if (assetInterfaceMatch) {
      const fieldRegex = /(\w+)(\?)?\s*:\s*([^;]+);/g
      let match
      while ((match = fieldRegex.exec(assetInterfaceMatch[1])) !== null) {
        assetFields.push(match[1])
      }
    }

    // Extract AssetId type pattern
    const assetIdPattern = content.match(/export type AssetId = (.+);/)

    // Count assets in registry
    const assetMatches = content.matchAll(/"([^"]+)":\s*\{/g)
    const assetCount = Array.from(assetMatches).length

    return {
      fields: assetFields,
      assetIdType: assetIdPattern ? assetIdPattern[1].trim() : 'keyof typeof ASSETS',
      assetCount,
      registryPath,
    }
  } catch (error: any) {
    throw new Error(
      `Failed to analyze asset registry: ${error.message}\n` +
      `Path: ${registryPath}`
    )
  }
}

/**
 * Cached analysis result
 */
let cachedAnalysis: {
  analysis: AssetManagerAnalysis
  timestamp: number
  version: string
} | null = null

const CACHE_TTL_MS = 5000 // 5 seconds

/**
 * Get AssetManager analysis with caching
 *
 * @param astroProjectPath - Path to Astro project root
 * @param forceRefresh - Force refresh even if cached
 * @returns AssetManager analysis
 */
export async function getAssetManagerAnalysis(
  astroProjectPath: string,
  forceRefresh = false
): Promise<AssetManagerAnalysis> {
  const now = Date.now()

  if (!forceRefresh && cachedAnalysis && (now - cachedAnalysis.timestamp) < CACHE_TTL_MS) {
    return cachedAnalysis.analysis
  }

  const analysis = await analyzeAssetManager(astroProjectPath)

  // Invalidate cache if version changed
  if (cachedAnalysis && cachedAnalysis.version !== analysis.version) {
    console.log('⚠️  AssetManager component changed - cache invalidated')
  }

  cachedAnalysis = {
    analysis,
    timestamp: now,
    version: analysis.version,
  }

  return analysis
}
