/**
 * File Writer
 *
 * Safely updates TypeScript files with new field definitions.
 * Handles insertion at proper locations with validation.
 *
 * Files updated:
 * 1. scripts/migration/lib/frontmatter-field-registry.ts
 * 2. scripts/migration/lib/{collection}-field-mapper.ts (interface)
 * 3. scripts/migration/lib/{collection}-field-mapper.ts (mapping logic)
 * 4. src/collections/{Collection}/index.ts (schema) - NOT IMPLEMENTED YET
 *
 * For now, schema updates must be done manually or via the Payload admin UI.
 */

import fs from 'fs/promises'
import path from 'path'

export interface FileUpdateResult {
  success: boolean
  filePath: string
  error?: string
  lineNumber?: number
}

/**
 * Add field to frontmatter field registry
 *
 * Inserts field name at the end of the RATE_KNOWN_FIELDS or PROVIDER_KNOWN_FIELDS array
 *
 * @param fieldName - Frontmatter field name (e.g., "editorial_team_editor")
 * @param collectionName - Collection to update registry for
 * @param comment - Optional comment to add after field name
 * @returns Update result
 */
export async function addFieldToRegistry(
  fieldName: string,
  collectionName: 'providers' | 'electricity-rates',
  comment?: string
): Promise<FileUpdateResult> {
  const registryPath = path.resolve(
    process.cwd(),
    'scripts/migration/lib/frontmatter-field-registry.ts'
  )

  try {
    let content = await fs.readFile(registryPath, 'utf-8')

    // Determine which array to update
    const arrayName =
      collectionName === 'providers' ? 'PROVIDER_KNOWN_FIELDS' : 'RATE_KNOWN_FIELDS'

    // Find the array closing bracket
    const arrayPattern = new RegExp(`export const ${arrayName} = \\[([\\s\\S]*?)\\]`, 'm')
    const match = content.match(arrayPattern)

    if (!match) {
      return {
        success: false,
        filePath: registryPath,
        error: `Could not find ${arrayName} array`,
      }
    }

    // Check if field already exists
    const fieldPattern = new RegExp(`['"]${fieldName}['"]`)
    if (fieldPattern.test(match[1])) {
      return {
        success: true,
        filePath: registryPath,
        error: `Field '${fieldName}' already exists in registry`,
      }
    }

    // Build the new line
    const commentStr = comment ? `  // ${comment}` : ''
    const newLine = `  '${fieldName}',${commentStr}\n`

    // Find the last field in the array (before closing bracket)
    const lastFieldMatch = match[1].match(/\n\s*'[^']+',.*\n/)
    if (!lastFieldMatch) {
      return {
        success: false,
        filePath: registryPath,
        error: 'Could not determine insertion point',
      }
    }

    // Insert new field after last field
    const insertIndex = match.index! + match[0].lastIndexOf(']')
    content = content.slice(0, insertIndex) + newLine + content.slice(insertIndex)

    // Write updated content
    await fs.writeFile(registryPath, content, 'utf-8')

    return {
      success: true,
      filePath: registryPath,
    }
  } catch (error) {
    return {
      success: false,
      filePath: registryPath,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Add property to field mapper interface
 *
 * Inserts property before the `[key: string]: any` line
 *
 * @param interfaceProperty - Full property line (e.g., "editorial_team_editor?: string  // Comment")
 * @param collectionName - Collection to update mapper for
 * @returns Update result
 */
export async function addPropertyToInterface(
  interfaceProperty: string,
  collectionName: 'providers' | 'electricity-rates'
): Promise<FileUpdateResult> {
  const mapperFileName =
    collectionName === 'providers' ? 'provider-field-mapper.ts' : 'rate-field-mapper.ts'

  const mapperPath = path.resolve(
    process.cwd(),
    'scripts/migration/lib',
    mapperFileName
  )

  try {
    let content = await fs.readFile(mapperPath, 'utf-8')

    // Determine interface name
    const interfaceName =
      collectionName === 'providers' ? 'ProviderFrontmatter' : 'RateFrontmatter'

    // Find the interface
    const interfacePattern = new RegExp(
      `export interface ${interfaceName} \\{([\\s\\S]*?)\\[key: string\\]: any`,
      'm'
    )
    const match = content.match(interfacePattern)

    if (!match) {
      return {
        success: false,
        filePath: mapperPath,
        error: `Could not find ${interfaceName} interface`,
      }
    }

    // Check if property already exists (extract field name from property)
    const fieldName = interfaceProperty.split(/[?:]/)[0].trim()
    const fieldPattern = new RegExp(`^\\s*${fieldName}[?:]`, 'm')
    if (fieldPattern.test(match[1])) {
      return {
        success: true,
        filePath: mapperPath,
        error: `Property '${fieldName}' already exists in interface`,
      }
    }

    // Insert before [key: string]: any
    const insertPoint = content.indexOf('  [key: string]: any', match.index!)
    if (insertPoint === -1) {
      return {
        success: false,
        filePath: mapperPath,
        error: 'Could not find [key: string]: any line',
      }
    }

    // Add property with proper indentation
    const newLine = `  ${interfaceProperty}\n`
    content = content.slice(0, insertPoint) + newLine + content.slice(insertPoint)

    // Write updated content
    await fs.writeFile(mapperPath, content, 'utf-8')

    return {
      success: true,
      filePath: mapperPath,
    }
  } catch (error) {
    return {
      success: false,
      filePath: mapperPath,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Add mapping logic to field mapper function
 *
 * Inserts mapping line in the return statement of mapProviderFields/mapRateFields
 *
 * NOTE: This is complex because the return statement spans multiple lines.
 * For now, we'll just display instructions for manual addition.
 *
 * @param mappingLine - Full mapping line (e.g., "editorialTeamEditor: cleanString(frontmatter.editorial_team_editor),")
 * @param collectionName - Collection to update mapper for
 * @returns Update result
 */
export async function addMappingToFunction(
  mappingLine: string,
  collectionName: 'providers' | 'electricity-rates'
): Promise<FileUpdateResult> {
  const mapperFileName =
    collectionName === 'providers' ? 'provider-field-mapper.ts' : 'rate-field-mapper.ts'

  const mapperPath = path.resolve(
    process.cwd(),
    'scripts/migration/lib',
    mapperFileName
  )

  // For now, return a message that manual addition is required
  // Automatically inserting into the complex return statement is risky
  return {
    success: false,
    filePath: mapperPath,
    error: 'Mapping logic must be added manually to the return statement',
  }
}

/**
 * Update all files for a new field
 *
 * Convenience method that updates all necessary files in one call
 *
 * @param fieldName - Frontmatter field name
 * @param interfaceProperty - Interface property line
 * @param mappingLine - Mapping logic line
 * @param registryComment - Comment for registry entry
 * @param collectionName - Collection name
 * @returns Array of update results
 */
export async function updateAllFiles(
  fieldName: string,
  interfaceProperty: string,
  mappingLine: string,
  registryComment: string,
  collectionName: 'providers' | 'electricity-rates'
): Promise<FileUpdateResult[]> {
  const results: FileUpdateResult[] = []

  // 1. Add to registry
  results.push(await addFieldToRegistry(fieldName, collectionName, registryComment))

  // 2. Add to interface
  results.push(await addPropertyToInterface(interfaceProperty, collectionName))

  // 3. Mapping logic (manual for now)
  results.push({
    success: false,
    filePath: `scripts/migration/lib/${collectionName === 'providers' ? 'provider' : 'rate'}-field-mapper.ts`,
    error: 'Mapping logic must be added manually to the return statement',
  })

  // 4. Schema (manual for now)
  results.push({
    success: false,
    filePath: `src/collections/${collectionName === 'providers' ? 'Providers' : 'ElectricityRates'}/index.ts`,
    error: 'Payload schema field must be added manually or via admin UI',
  })

  return results
}

/**
 * Display file update results
 *
 * @param results - Array of update results
 * @returns Summary string
 */
export function formatUpdateResults(results: FileUpdateResult[]): string {
  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  let output = `\nFile Update Results:\n`
  output += `  ✓ Successful: ${successful}\n`
  output += `  ✗ Failed: ${failed}\n\n`

  for (const result of results) {
    const status = result.success ? '✓' : '✗'
    const fileName = path.basename(result.filePath)
    output += `  ${status} ${fileName}\n`

    if (!result.success && result.error) {
      output += `     ${result.error}\n`
    }
  }

  return output
}
