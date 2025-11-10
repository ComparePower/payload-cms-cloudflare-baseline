/**
 * Asset Registry Updater
 *
 * Automatically appends new asset entries to the Astro assets.config.ts file
 */

import fs from 'fs/promises'
import path from 'path'
import type { AssetRegistryEntry } from './image-to-asset-manager-transformer.ts'

/**
 * Format asset entry as TypeScript code
 */
function formatAssetEntry(entry: AssetRegistryEntry): string {
  const lines = [
    `  "${entry.id}": {`,
    `    id: "${entry.id}",`,
    `    name: "${entry.name.replace(/"/g, '\\"')}",`,
    `    path: "${entry.path}",`,
  ]

  if (entry.width !== undefined) {
    lines.push(`    width: ${entry.width},`)
  }

  if (entry.height !== undefined) {
    lines.push(`    height: ${entry.height},`)
  }

  if (entry.alt) {
    lines.push(`    alt: "${entry.alt.replace(/"/g, '\\"')}",`)
  }

  lines.push('  },')

  return lines.join('\n')
}

/**
 * Check if asset ID already exists in registry
 */
async function assetExists(
  configPath: string,
  assetId: string
): Promise<boolean> {
  try {
    const content = await fs.readFile(configPath, 'utf-8')
    return content.includes(`"${assetId}":`)
  } catch (error) {
    return false
  }
}

/**
 * Append new asset entries to assets.config.ts
 *
 * @param astroProjectPath - Path to Astro project
 * @param entries - Asset entries to add
 * @param options - Update options
 * @returns Number of entries added
 */
export async function appendAssetEntries(
  astroProjectPath: string,
  entries: AssetRegistryEntry[],
  options: {
    skipExisting?: boolean
    dryRun?: boolean
  } = {}
): Promise<{
  added: number
  skipped: number
  entries: AssetRegistryEntry[]
}> {
  const configPath = path.join(astroProjectPath, 'src/config/assets.config.ts')

  // Read current config
  let content: string
  try {
    content = await fs.readFile(configPath, 'utf-8')
  } catch (error) {
    throw new Error(`Could not read assets.config.ts: ${error}`)
  }

  // Find the ASSETS object
  const assetsMatch = content.match(/export const ASSETS: Record<string, Asset> = \{([\s\S]*?)\n\}/)
  if (!assetsMatch) {
    throw new Error('Could not find ASSETS object in assets.config.ts')
  }

  const existingAssets = assetsMatch[1]
  const insertionPoint = content.indexOf(assetsMatch[0]) + assetsMatch[0].length - 2 // Before closing }

  // Filter entries
  const toAdd: AssetRegistryEntry[] = []
  const skipped: string[] = []

  for (const entry of entries) {
    const exists = await assetExists(configPath, entry.id)

    if (exists && options.skipExisting) {
      skipped.push(entry.id)
      continue
    }

    toAdd.push(entry)
  }

  if (toAdd.length === 0) {
    return {
      added: 0,
      skipped: skipped.length,
      entries: []
    }
  }

  // Generate new entries code
  const newEntriesCode = toAdd.map(formatAssetEntry).join('\n\n')

  // Insert new entries before closing brace
  const before = content.substring(0, insertionPoint)
  const after = content.substring(insertionPoint)

  // Add comment header
  const timestamp = new Date().toISOString().split('T')[0]
  const header = `\n  // Assets added by migration (${timestamp})\n`

  const updatedContent = before + header + newEntriesCode + '\n' + after

  // Write updated config
  if (!options.dryRun) {
    await fs.writeFile(configPath, updatedContent, 'utf-8')
  }

  return {
    added: toAdd.length,
    skipped: skipped.length,
    entries: toAdd
  }
}

/**
 * Generate asset entry from uploaded media
 */
export function mediaToAssetEntry(
  uploadResult: {
    mediaId: string
    assetId: string
    url: string
    filename: string
    width?: number
    height?: number
  },
  alt?: string
): AssetRegistryEntry {
  return {
    id: uploadResult.assetId,
    name: uploadResult.assetId.replace(/-/g, ' ').replace(/^(image|icon|asset) /, ''),
    path: `@assets-cdn/${uploadResult.filename}`, // Use CDN path since it's uploaded to R2
    width: uploadResult.width,
    height: uploadResult.height,
    alt: alt || undefined
  }
}

/**
 * Batch update asset registry from multiple uploads
 */
export async function updateRegistryFromUploads(
  astroProjectPath: string,
  uploads: Array<{
    mediaId: string
    assetId: string
    url: string
    filename: string
    width?: number
    height?: number
  }>,
  altTexts: Map<string, string> = new Map(),
  options: {
    skipExisting?: boolean
    dryRun?: boolean
  } = {}
): Promise<{
  added: number
  skipped: number
  entries: AssetRegistryEntry[]
}> {
  const entries = uploads.map(upload =>
    mediaToAssetEntry(upload, altTexts.get(upload.assetId))
  )

  return await appendAssetEntries(astroProjectPath, entries, options)
}

/**
 * Preview what would be added without making changes
 */
export async function previewAssetUpdates(
  astroProjectPath: string,
  entries: AssetRegistryEntry[]
): Promise<{
  willAdd: AssetRegistryEntry[]
  willSkip: string[]
  preview: string
}> {
  const configPath = path.join(astroProjectPath, 'src/config/assets.config.ts')

  const willAdd: AssetRegistryEntry[] = []
  const willSkip: string[] = []

  for (const entry of entries) {
    const exists = await assetExists(configPath, entry.id)

    if (exists) {
      willSkip.push(entry.id)
    } else {
      willAdd.push(entry)
    }
  }

  const preview = willAdd.map(formatAssetEntry).join('\n\n')

  return {
    willAdd,
    willSkip,
    preview
  }
}
