/**
 * MDX Component Validator - Fail-Fast on Unmapped Components
 *
 * Validates that ALL MDX components (both block-level and inline) are properly
 * mapped to Payload CMS blocks/inline blocks before migration.
 *
 * This prevents raw MDX text from appearing in migrated content by catching
 * unmapped components early and providing actionable error messages.
 *
 * Related: Issue #2 - Robust MDX Importer (CRITICAL)
 *
 * Phase 2 Update: Now uses Component Registry as single source of truth
 */

import {
  COMPONENT_REGISTRY,
  isComponentImplemented,
  validateComponent as registryValidateComponent,
  type ComponentMapping,
} from './component-registry'

export interface ComponentValidationError {
  componentName: string
  componentType: 'block' | 'inline'
  usage: 'block-level' | 'inline' // How it's used in MDX
  filePath: string
  props: Record<string, any>
  message: string
  suggestion: string
}

/**
 * Get all components from registry that can render as blocks
 * Uses Component Registry as single source of truth
 */
function getValidBlockComponents(): Set<string> {
  const blockComponents = new Set<string>()

  for (const [mdxName, mapping] of Object.entries(COMPONENT_REGISTRY)) {
    if (mapping.canRenderBlock && mapping.componentType !== 'wrapper') {
      blockComponents.add(mdxName)
    }
  }

  return blockComponents
}

/**
 * Get all components from registry that can render inline
 * Uses Component Registry as single source of truth
 */
function getValidInlineComponents(): Set<string> {
  const inlineComponents = new Set<string>()

  for (const [mdxName, mapping] of Object.entries(COMPONENT_REGISTRY)) {
    if (mapping.canRenderInline && mapping.componentType !== 'wrapper') {
      inlineComponents.add(mdxName)
    }
  }

  return inlineComponents
}

/**
 * Get wrapper components that should be stripped during parsing
 * Uses Component Registry as single source of truth
 */
function getWrapperComponents(): Set<string> {
  const wrappers = new Set<string>()

  for (const [mdxName, mapping] of Object.entries(COMPONENT_REGISTRY)) {
    if (mapping.componentType === 'wrapper') {
      wrappers.add(mdxName)
    }
  }

  return wrappers
}

/**
 * Validate a single MDX component using Component Registry
 *
 * @param componentName - The component name from MDX (e.g., "RatesTable")
 * @param componentType - Whether it's a block-level or inline component in the AST
 * @param filePath - Path to the MDX file being processed
 * @param props - Component props from MDX
 * @returns Error object if invalid, null if valid
 */
export function validateComponent(
  componentName: string,
  componentType: 'block' | 'inline',
  filePath: string,
  props: Record<string, any>
): ComponentValidationError | null {
  const validBlocks = getValidBlockComponents()
  const validInline = getValidInlineComponents()
  const wrappers = getWrapperComponents()

  // Skip wrapper components (they're intentionally removed)
  if (wrappers.has(componentName)) {
    return null
  }

  // Use registry validation
  const registryResult = registryValidateComponent(componentName, props)

  if (!registryResult.valid) {
    return {
      componentName,
      componentType,
      usage: componentType === 'block' ? 'block-level' : 'inline',
      filePath,
      props,
      message: registryResult.error || `Unmapped MDX component: <${componentName} />`,
      suggestion: createSuggestion(componentName, componentType, props, registryResult.mapping),
    }
  }

  // Check rendering capability matches usage
  const mapping = registryResult.mapping!
  const usedAsBlock = componentType === 'block'
  const usedAsInline = componentType === 'inline'

  if (usedAsBlock && !mapping.canRenderBlock) {
    console.warn(
      `⚠️  Component "${componentName}" cannot render as block but used as block-level in ${filePath}. ` +
      `canRenderBlock: false. This will cause rendering issues.`
    )
  }

  if (usedAsInline && !mapping.canRenderInline) {
    console.warn(
      `⚠️  Component "${componentName}" cannot render inline but used inline in ${filePath}. ` +
      `canRenderInline: false. This may cause rendering issues.`
    )
  }

  return null
}

/**
 * Create actionable suggestion for unmapped component
 * Uses Component Registry data when available
 */
function createSuggestion(
  componentName: string,
  componentType: 'block' | 'inline',
  props: Record<string, any>,
  mapping?: ComponentMapping
): string {
  // If mapping exists but has todos, show them
  if (mapping?.todos && mapping.todos.length > 0) {
    return `
ACTION REQUIRED: Component exists in registry but needs work
  Status: ${mapping.status}
  TODOs from Component Registry:
${mapping.todos.map((todo, i) => `    ${i + 1}. ${todo}`).join('\n')}

  Props: ${Object.keys(props).join(', ') || 'none'}
`
  }
  const propsList = Object.keys(props).length > 0
    ? `\n  Props: ${JSON.stringify(props, null, 2)}`
    : ''

  if (componentType === 'block') {
    return `
ACTION REQUIRED: Add to Component Registry then create Payload block
  1. Add "${componentName}" to COMPONENT_REGISTRY in component-registry.ts
     - Set status: 'needs-work'
     - Define fields: ${Object.keys(props).join(', ') || 'none'}
     - Set componentType: 'block'
     - Set canRenderBlock: true, canRenderInline: false
  2. Create file: src/lexical/blocks/${componentName}Block.ts
  3. Export from: src/lexical/blocks/index.ts
  4. Update registry status to 'implemented'${propsList}

ALTERNATIVE: If this is a wrapper component (Section/Figure/etc):
  1. Add "${componentName}" to COMPONENT_REGISTRY with componentType: 'wrapper'
`
  } else {
    return `
ACTION REQUIRED: Add to Component Registry then create inline block
  1. Add "${componentName}" to COMPONENT_REGISTRY in component-registry.ts
     - Set status: 'needs-work'
     - Define fields: ${Object.keys(props).join(', ') || 'none'}
     - Set componentType: 'inline'
     - Set canRenderInline: true, canRenderBlock: false
  2. Define inline block in src/lexical/inlineBlocks.ts
  3. Create frontend component for rendering
  4. Update registry status to 'implemented'${propsList}

ALTERNATIVE: Convert to block-level component if it should be standalone
`
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ComponentValidationError[]): string {
  if (errors.length === 0) {
    return '✅ All MDX components are properly mapped'
  }

  const header = `
❌ MIGRATION FAILED: ${errors.length} unmapped component(s) found

The following MDX components are not mapped to Payload blocks.
Migration CANNOT proceed until these components are mapped.
`

  const errorDetails = errors
    .map((error, index) => {
      return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Error #${index + 1}: ${error.message}

  File: ${error.filePath}
  Component: <${error.componentName} ${formatProps(error.props)} />
  Usage: ${error.usage}
  Type: ${error.componentType}
${error.suggestion}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    })
    .join('\n')

  const footer = `
🛠️  NEXT STEPS:
  1. Review the errors above
  2. Create the missing block/inline block definitions
  3. Re-run the migration

For guidance on creating blocks, see:
  - docs/creating-payload-blocks.md
  - src/lexical/blocks/README.md
`

  return header + errorDetails + footer
}

/**
 * Format component props for display
 */
function formatProps(props: Record<string, any>): string {
  if (Object.keys(props).length === 0) {
    return ''
  }

  return Object.entries(props)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`
      }
      return `${key}={${JSON.stringify(value)}}`
    })
    .join(' ')
}

/**
 * Aggregate validation errors and throw if any found
 *
 * @param errors - Array of validation errors collected during parsing
 * @param filePath - Path to file being processed (for context)
 * @throws Error with formatted error message if unmapped components found
 */
export function throwIfValidationErrors(
  errors: ComponentValidationError[],
  filePath: string
): void {
  if (errors.length > 0) {
    const message = formatValidationErrors(errors)
    throw new Error(message)
  }
}
