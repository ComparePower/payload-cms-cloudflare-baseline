/**
 * AssetManager TypeScript Type Extractor
 *
 * Extracts actual TypeScript interface definitions from AssetManager.astro
 * and validates that migration code is type-safe against the component.
 *
 * This ensures breaking changes in AssetManager are caught immediately.
 */

import fs from 'fs/promises'
import path from 'path'
import ts from 'typescript'

/**
 * Extract TypeScript interface from .astro file
 */
export async function extractAssetManagerTypes(astroProjectPath: string) {
  const componentPath = path.join(
    astroProjectPath,
    'src/components/common/AssetManager.astro'
  )

  const content = await fs.readFile(componentPath, 'utf-8')

  // Extract the frontmatter (TypeScript section)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    throw new Error('Could not find frontmatter in AssetManager.astro')
  }

  const frontmatter = frontmatterMatch[1]

  // Create TypeScript source file
  const sourceFile = ts.createSourceFile(
    'AssetManager.astro.ts',
    frontmatter,
    ts.ScriptTarget.Latest,
    true
  )

  // Find the Props interface
  let propsInterface: ts.InterfaceDeclaration | null = null

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node) && node.name.text === 'Props') {
      propsInterface = node
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  if (!propsInterface) {
    throw new Error('Could not find Props interface in AssetManager.astro')
  }

  // Extract member signatures
  const props: Record<string, {
    type: string
    optional: boolean
    comment?: string
  }> = {}

  for (const member of propsInterface.members) {
    if (ts.isPropertySignature(member) && member.name) {
      const propName = member.name.getText(sourceFile)
      const propType = member.type ? member.type.getText(sourceFile) : 'unknown'
      const optional = !!member.questionToken

      // Extract JSDoc comment
      const jsDocComment = ts.getJSDocCommentsAndTags(member)
        .map(doc => doc.getText(sourceFile))
        .join('\n')

      props[propName] = {
        type: propType,
        optional,
        comment: jsDocComment || undefined
      }
    }
  }

  return {
    interface: propsInterface.getText(sourceFile),
    props,
    sourceFile: frontmatter
  }
}

/**
 * Generate TypeScript type definition file from extracted types
 */
export async function generateTypeDefinition(
  astroProjectPath: string,
  outputPath: string
) {
  const extracted = await extractAssetManagerTypes(astroProjectPath)

  const typeDefinition = `/**
 * AssetManager Props Types
 *
 * Auto-generated from: ${astroProjectPath}/src/components/common/AssetManager.astro
 * Generated: ${new Date().toISOString()}
 *
 * DO NOT EDIT MANUALLY - Run regenerate script if AssetManager changes
 */

${extracted.interface}

/**
 * Individual prop types for validation
 */
export const ASSET_MANAGER_PROP_TYPES = ${JSON.stringify(extracted.props, null, 2)} as const

/**
 * Type guard to validate AssetManager props at runtime
 */
export function isValidAssetManagerProps(props: any): props is Props {
  if (!props || typeof props !== 'object') return false

  // Required props
  if (!('id' in props)) return false

  // Type validation for provided props
  const validProps = new Set(Object.keys(ASSET_MANAGER_PROP_TYPES))
  for (const key of Object.keys(props)) {
    if (!validProps.has(key)) {
      console.warn(\`Unknown AssetManager prop: \${key}\`)
      return false
    }
  }

  return true
}

/**
 * Validate props and throw detailed error if invalid
 */
export function validateAssetManagerProps(props: any): asserts props is Props {
  if (!isValidAssetManagerProps(props)) {
    const requiredProps = Object.entries(ASSET_MANAGER_PROP_TYPES)
      .filter(([_, meta]) => !meta.optional)
      .map(([name]) => name)

    const providedProps = Object.keys(props || {})
    const missingRequired = requiredProps.filter(p => !providedProps.includes(p))

    throw new Error(
      \`Invalid AssetManager props.\\n\` +
      \`Missing required: [\${missingRequired.join(', ')}]\\n\` +
      \`Provided: [\${providedProps.join(', ')}]\`
    )
  }
}
`

  await fs.writeFile(outputPath, typeDefinition, 'utf-8')

  return {
    outputPath,
    props: extracted.props
  }
}

/**
 * Compare current types with previously extracted types
 * Returns list of breaking changes
 */
export async function detectTypeChanges(
  astroProjectPath: string,
  previousTypesPath: string
): Promise<string[]> {
  const current = await extractAssetManagerTypes(astroProjectPath)

  let previous: any
  try {
    const previousContent = await fs.readFile(previousTypesPath, 'utf-8')
    const match = previousContent.match(/export const ASSET_MANAGER_PROP_TYPES = ({[\s\S]*?}) as const/)
    if (match) {
      previous = JSON.parse(match[1])
    }
  } catch (error) {
    // No previous types file, first time
    return []
  }

  const breakingChanges: string[] = []

  // Check for removed props
  for (const propName of Object.keys(previous)) {
    if (!(propName in current.props)) {
      breakingChanges.push(`REMOVED: Property "${propName}" was removed`)
    }
  }

  // Check for type changes
  for (const [propName, currentMeta] of Object.entries(current.props)) {
    if (propName in previous) {
      const prevMeta = previous[propName]

      if (currentMeta.type !== prevMeta.type) {
        breakingChanges.push(
          `TYPE CHANGE: "${propName}" type changed from "${prevMeta.type}" to "${currentMeta.type}"`
        )
      }

      if (!currentMeta.optional && prevMeta.optional) {
        breakingChanges.push(
          `REQUIRED: "${propName}" is now required (was optional)`
        )
      }
    }
  }

  // Check for new required props
  for (const [propName, currentMeta] of Object.entries(current.props)) {
    if (!(propName in previous) && !currentMeta.optional) {
      breakingChanges.push(`NEW REQUIRED: Property "${propName}" is required but didn't exist before`)
    }
  }

  return breakingChanges
}
