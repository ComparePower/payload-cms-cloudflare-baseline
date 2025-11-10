/**
 * Component Catalog Builder
 *
 * Aggregates component usage from parsed MDX files to build a comprehensive catalog
 */

import type { ParsedMdxFile, ComponentUsage, ComponentProp } from './types'

/**
 * Prop usage statistics
 */
export interface PropUsage {
  /** Prop name */
  name: string
  /** How many times this prop is used */
  frequency: number
  /** Inferred type from usage */
  type: string
  /** Example values */
  examples: Array<{
    file: string
    value: string | null
    lineNumber: number
  }>
}

/**
 * Component catalog entry
 */
export interface ComponentCatalogEntry {
  /** Component name */
  name: string
  /** Total usage count */
  count: number
  /** Number of files using this component */
  fileCount: number
  /** Files where this component is used */
  files: string[]
  /** Props used with this component */
  props: Record<string, PropUsage>
  /** Example usages */
  examples: Array<{
    file: string
    props: ComponentProp[]
    lineNumber: number
  }>
}

/**
 * Complete component catalog
 */
export interface ComponentCatalog {
  /** Metadata about the catalog */
  metadata: {
    generatedAt: string
    totalFiles: number
    totalComponents: number
    uniqueComponentTypes: number
    executionTimeMs: number
  }
  /** Components indexed by name */
  components: Record<string, ComponentCatalogEntry>
  /** Overall statistics */
  statistics: {
    filesWithComponents: number
    filesWithoutComponents: number
    averageComponentsPerFile: number
    mostUsedComponent: string | null
    mostUsedComponentCount: number
  }
}

/**
 * Build component catalog from parsed MDX files
 */
export function buildCatalog(parsedFiles: ParsedMdxFile[], executionTimeMs: number): ComponentCatalog {
  const startTime = Date.now()

  // Initialize components map
  const componentsMap = new Map<string, ComponentCatalogEntry>()

  // Track files with/without components
  let filesWithComponents = 0
  let filesWithoutComponents = 0
  let totalComponents = 0

  // Process each file
  for (const file of parsedFiles) {
    if (file.components.length === 0) {
      filesWithoutComponents++
      continue
    }

    filesWithComponents++
    totalComponents += file.components.length

    // Process each component in the file
    for (const component of file.components) {
      const componentName = component.component

      // Get or create catalog entry
      let entry = componentsMap.get(componentName)
      if (!entry) {
        entry = {
          name: componentName,
          count: 0,
          fileCount: 0,
          files: [],
          props: {},
          examples: [],
        }
        componentsMap.set(componentName, entry)
      }

      // Update usage count
      entry.count++

      // Add file if not already tracked
      if (!entry.files.includes(file.filePath)) {
        entry.files.push(file.filePath)
        entry.fileCount++
      }

      // Process props
      for (const prop of component.props) {
        const propName = prop.name

        // Get or create prop usage entry
        let propUsage = entry.props[propName]
        if (!propUsage) {
          propUsage = {
            name: propName,
            frequency: 0,
            type: prop.type,
            examples: [],
          }
          entry.props[propName] = propUsage
        }

        // Update prop frequency
        propUsage.frequency++

        // Add example if we have fewer than 3
        if (propUsage.examples.length < 3) {
          propUsage.examples.push({
            file: file.filePath,
            value: prop.value,
            lineNumber: component.lineNumber,
          })
        }
      }

      // Add example usage if we have fewer than 5
      if (entry.examples.length < 5) {
        entry.examples.push({
          file: file.filePath,
          props: component.props,
          lineNumber: component.lineNumber,
        })
      }
    }
  }

  // Convert map to object
  const components: Record<string, ComponentCatalogEntry> = {}
  componentsMap.forEach((entry, name) => {
    components[name] = entry
  })

  // Calculate statistics
  const componentEntries = Object.values(components)
  const averageComponentsPerFile = filesWithComponents > 0
    ? totalComponents / filesWithComponents
    : 0

  let mostUsedComponent: string | null = null
  let mostUsedComponentCount = 0

  for (const entry of componentEntries) {
    if (entry.count > mostUsedComponentCount) {
      mostUsedComponent = entry.name
      mostUsedComponentCount = entry.count
    }
  }

  // Build final catalog
  const catalog: ComponentCatalog = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalFiles: parsedFiles.length,
      totalComponents,
      uniqueComponentTypes: componentsMap.size,
      executionTimeMs,
    },
    components,
    statistics: {
      filesWithComponents,
      filesWithoutComponents,
      averageComponentsPerFile: Math.round(averageComponentsPerFile * 100) / 100,
      mostUsedComponent,
      mostUsedComponentCount,
    },
  }

  return catalog
}

/**
 * Generate Markdown report from catalog
 */
export function generateMarkdownReport(catalog: ComponentCatalog): string {
  const lines: string[] = []

  lines.push('# Component Catalog Report')
  lines.push('')
  lines.push(`**Generated**: ${catalog.metadata.generatedAt}`)
  lines.push(`**Execution Time**: ${catalog.metadata.executionTimeMs}ms`)
  lines.push('')

  lines.push('## Summary Statistics')
  lines.push('')
  lines.push(`- **Total Files Scanned**: ${catalog.metadata.totalFiles}`)
  lines.push(`- **Files With Components**: ${catalog.statistics.filesWithComponents}`)
  lines.push(`- **Files Without Components**: ${catalog.statistics.filesWithoutComponents}`)
  lines.push(`- **Total Component Instances**: ${catalog.metadata.totalComponents}`)
  lines.push(`- **Unique Component Types**: ${catalog.metadata.uniqueComponentTypes}`)
  lines.push(`- **Average Components Per File**: ${catalog.statistics.averageComponentsPerFile}`)

  if (catalog.statistics.mostUsedComponent) {
    lines.push(`- **Most Used Component**: \`${catalog.statistics.mostUsedComponent}\` (${catalog.statistics.mostUsedComponentCount} instances)`)
  }

  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('## Component Details')
  lines.push('')

  // Sort components by usage count (descending)
  const sortedComponents = Object.values(catalog.components)
    .sort((a, b) => b.count - a.count)

  for (const component of sortedComponents) {
    lines.push(`### \`${component.name}\``)
    lines.push('')
    lines.push(`**Usage Statistics**:`)
    lines.push('')
    lines.push(`- Total instances: ${component.count}`)
    lines.push(`- Used in ${component.fileCount} file${component.fileCount === 1 ? '' : 's'}`)
    lines.push('')

    // Props
    const propNames = Object.keys(component.props)
    if (propNames.length > 0) {
      lines.push(`**Props** (${propNames.length} unique):`)
      lines.push('')

      // Sort props by frequency
      const sortedProps = Object.values(component.props)
        .sort((a, b) => b.frequency - a.frequency)

      for (const prop of sortedProps) {
        lines.push(`- \`${prop.name}\` (\`${prop.type}\`) - Used ${prop.frequency} time${prop.frequency === 1 ? '' : 's'}`)

        if (prop.examples.length > 0) {
          const firstExample = prop.examples[0]
          if (firstExample.value !== null) {
            lines.push(`  - Example: \`${firstExample.value}\``)
          }
        }
      }

      lines.push('')
    } else {
      lines.push(`**Props**: None (component used without props)`)
      lines.push('')
    }

    // Example usage
    if (component.examples.length > 0) {
      lines.push(`**Example Usage**:`)
      lines.push('')

      const firstExample = component.examples[0]
      const propsStr = firstExample.props
        .map(p => {
          if (p.type === 'boolean' && p.value === 'true') {
            return p.name
          }
          return `${p.name}={${p.value}}`
        })
        .join(' ')

      lines.push('```tsx')
      lines.push(`<${component.name}${propsStr ? ' ' + propsStr : ''} />`)
      lines.push('```')
      lines.push('')

      // Show file reference
      const fileName = firstExample.file.split('/').pop() || firstExample.file
      lines.push(`*From: \`${fileName}\` (line ${firstExample.lineNumber})*`)
      lines.push('')
    }

    lines.push('---')
    lines.push('')
  }

  // Add files section
  lines.push('## Files by Component Usage')
  lines.push('')

  const filesWithComponentCounts = new Map<string, number>()
  for (const component of Object.values(catalog.components)) {
    for (const file of component.files) {
      filesWithComponentCounts.set(file, (filesWithComponentCounts.get(file) || 0) + 1)
    }
  }

  const sortedFiles = Array.from(filesWithComponentCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20) // Top 20

  lines.push('**Top 20 Files by Number of Unique Components**:')
  lines.push('')

  for (const [file, count] of sortedFiles) {
    const fileName = file.split('/').pop() || file
    lines.push(`- \`${fileName}\` - ${count} unique component${count === 1 ? '' : 's'}`)
  }

  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('*Generated by Component Catalog Builder*')

  return lines.join('\n')
}
