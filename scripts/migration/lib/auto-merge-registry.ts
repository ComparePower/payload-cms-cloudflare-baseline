/**
 * Auto-merge unhandled components into main registry
 *
 * Merges components from COMPONENT-REGISTRATION-TODO.ts into the main
 * component registry at src/lib/component-registry.ts. Preserves existing
 * components and adds new ones with isBlocking: true.
 *
 * @module auto-merge-registry
 */

import fs from 'fs/promises'
import path from 'path'
import type { UnhandledComponent } from './mdx-to-payload-blocks.js'
import type { ComponentMapping } from '../../../src/lib/component-registry.js'

/**
 * Auto-merge unhandled components into main registry
 *
 * Reads the current component registry, reads the TODO file, merges them,
 * and writes back to the registry file. Preserves existing components and
 * their configurations.
 *
 * @param components - Array of unhandled components (used for logging)
 * @returns Object with merge statistics
 *
 * @example
 * ```typescript
 * const unhandledComponents = [...]
 * const result = await autoMergeComponents(unhandledComponents)
 * console.log(`Added ${result.added} new components`)
 * ```
 */
export async function autoMergeComponents(components: UnhandledComponent[]): Promise<{
  added: number
  skipped: number
  total: number
}> {
  const registryPath = path.join(process.cwd(), 'src', 'lib', 'component-registry.ts')
  const todoFilePath = path.join(process.cwd(), 'migration', 'COMPONENT-REGISTRATION-TODO.ts')

  // Read current registry file content
  const registryContent = await fs.readFile(registryPath, 'utf-8')

  // Read TODO file to get UNREGISTERED_COMPONENTS
  let unregisteredComponents: Record<string, ComponentMapping> = {}
  try {
    // Dynamic import doesn't work well for file:// URLs in all Node versions
    // So we'll parse the TODO file content manually
    const todoContent = await fs.readFile(todoFilePath, 'utf-8')

    // Extract the UNREGISTERED_COMPONENTS object (basic parsing)
    // This is a bit hacky but avoids ESM import issues
    const match = todoContent.match(/export const UNREGISTERED_COMPONENTS[^=]*=\s*({[\s\S]*})\s*$/m)
    if (match) {
      // For now, we'll use a different approach: read the existing registry
      // and add components that are missing
      console.log('⚠️  Auto-merge will add components inline instead of importing from TODO file')
    }
  } catch (error) {
    console.log('⚠️  Could not read TODO file, will generate components from provided array')
  }

  // Build map of components to add from the provided array
  const componentsToAdd = new Map<string, ComponentMapping>()
  for (const component of components) {
    const { name, usageCount, componentType } = component

    // Check if component already exists in registry
    const existsInRegistry = registryContent.includes(`'${name}'`) || registryContent.includes(`"${name}"`)

    if (!existsInRegistry) {
      const canRenderBlock = componentType === 'block'
      const canRenderInline = componentType === 'inline'

      componentsToAdd.set(name, {
        status: 'needs-work',
        componentType: componentType === 'both' ? 'block' : componentType,
        canRenderBlock,
        canRenderInline,
        payloadBlockType: undefined,
        mdxUsageCount: usageCount,
        fields: {},
        todos: [
          'Configure component type',
          'Set rendering capabilities',
          'Implement Payload block or inline block',
          'Test with sample MDX',
        ],
        isBlocking: true,
      })
    }
  }

  // If no new components to add, return early
  if (componentsToAdd.size === 0) {
    console.log('✅ No new components to add to registry')
    return {
      added: 0,
      skipped: components.length,
      total: components.length,
    }
  }

  // Generate component entries to append
  let newComponentsCode = '\n  // ========================================\n'
  newComponentsCode += '  // AUTO-GENERATED COMPONENTS (needs configuration)\n'
  newComponentsCode += '  // ========================================\n\n'

  for (const [name, mapping] of componentsToAdd) {
    newComponentsCode += `  '${name}': {\n`
    newComponentsCode += `    status: '${mapping.status}',\n`
    newComponentsCode += `    componentType: '${mapping.componentType}',\n`
    newComponentsCode += `    canRenderBlock: ${mapping.canRenderBlock},\n`
    newComponentsCode += `    canRenderInline: ${mapping.canRenderInline},\n`
    newComponentsCode += `    payloadBlockType: undefined,\n`
    newComponentsCode += `    mdxUsageCount: ${mapping.mdxUsageCount},\n`
    newComponentsCode += `    fields: {},\n`
    newComponentsCode += `    todos: [\n`
    for (const todo of mapping.todos || []) {
      newComponentsCode += `      '${todo}',\n`
    }
    newComponentsCode += `    ],\n`
    newComponentsCode += `    isBlocking: true,\n`
    newComponentsCode += `  },\n\n`
  }

  // Find the closing brace of COMPONENT_REGISTRY and insert before it
  // Look for the pattern: "} as const" or "}" at the end of the registry
  const registryEndPattern = /(\n}\s+as const\s*\n)/
  const match = registryContent.match(registryEndPattern)

  if (!match) {
    throw new Error('Could not find end of COMPONENT_REGISTRY object in registry file')
  }

  // Insert new components before the closing brace
  const updatedContent = registryContent.replace(
    registryEndPattern,
    `${newComponentsCode}$1`
  )

  // Write updated registry file
  await fs.writeFile(registryPath, updatedContent, 'utf-8')

  console.log(`✨ Merged ${componentsToAdd.size} new components into registry`)

  return {
    added: componentsToAdd.size,
    skipped: components.length - componentsToAdd.size,
    total: components.length,
  }
}

/**
 * Check if a component exists in the registry
 *
 * @param componentName - Name of the component to check
 * @returns True if component exists in registry, false otherwise
 */
export async function componentExistsInRegistry(componentName: string): Promise<boolean> {
  const registryPath = path.join(process.cwd(), 'src', 'lib', 'component-registry.ts')
  const registryContent = await fs.readFile(registryPath, 'utf-8')

  return registryContent.includes(`'${componentName}'`) || registryContent.includes(`"${componentName}"`)
}

/**
 * Remove auto-generated components section from registry
 *
 * Removes the section added by autoMergeComponents. Useful for testing or
 * when user wants to regenerate from scratch.
 *
 * @returns Number of lines removed
 */
export async function removeAutoGeneratedComponents(): Promise<number> {
  const registryPath = path.join(process.cwd(), 'src', 'lib', 'component-registry.ts')
  const registryContent = await fs.readFile(registryPath, 'utf-8')

  // Find and remove the auto-generated section
  const startMarker = '  // ========================================\n  // AUTO-GENERATED COMPONENTS (needs configuration)'
  const endMarker = '} as const'

  const startIndex = registryContent.indexOf(startMarker)
  if (startIndex === -1) {
    console.log('⚠️  No auto-generated components section found')
    return 0
  }

  const beforeSection = registryContent.substring(0, startIndex)
  const afterStart = registryContent.substring(startIndex)
  const endIndex = afterStart.indexOf(endMarker)

  if (endIndex === -1) {
    throw new Error('Could not find end of registry')
  }

  // Count lines removed
  const removedSection = afterStart.substring(0, endIndex)
  const linesRemoved = (removedSection.match(/\n/g) || []).length

  // Reconstruct file without auto-generated section
  const updatedContent = beforeSection + afterStart.substring(endIndex)

  await fs.writeFile(registryPath, updatedContent, 'utf-8')

  console.log(`🗑️  Removed auto-generated section (${linesRemoved} lines)`)

  return linesRemoved
}
