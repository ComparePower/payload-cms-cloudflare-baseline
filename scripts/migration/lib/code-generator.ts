/**
 * Code Generator
 *
 * Auto-generates TypeScript code snippets for:
 * 1. Payload collection schema field definitions
 * 2. TypeScript interface properties
 * 3. Field mapper mapping logic
 * 4. Frontmatter field registry additions
 *
 * Used by interactive field mapper to generate code after user answers prompts.
 */

import type { FieldAnalysis } from './field-type-detector.js'

export interface FieldConfig {
  frontmatterName: string // Original name in MDX frontmatter (e.g., "editorial_team_editor")
  payloadName: string // camelCase name for Payload (e.g., "editorialTeamEditor")
  fieldType: 'text' | 'number' | 'checkbox' | 'date' | 'relationship' | 'upload'
  required: boolean
  relationTo?: string // For relationship fields (e.g., "team", "categories")
  uploadRelationTo?: string // For upload fields (e.g., "media", "files")
}

/**
 * Generate Payload schema field definition
 *
 * @example
 * generatePayloadSchemaField({
 *   frontmatterName: 'editorial_team_editor',
 *   payloadName: 'editorialTeamEditor',
 *   fieldType: 'relationship',
 *   required: false,
 *   relationTo: 'team'
 * })
 * // Returns:
 * // {
 * //   name: 'editorialTeamEditor',
 * //   type: 'relationship',
 * //   relationTo: 'team',
 * //   required: false
 * // }
 */
export function generatePayloadSchemaField(config: FieldConfig): string {
  const field: Record<string, any> = {
    name: config.payloadName,
    type: config.fieldType,
  }

  // Add required flag if true
  if (config.required) {
    field.required = true
  }

  // Add relationship-specific config
  if (config.fieldType === 'relationship' && config.relationTo) {
    field.relationTo = config.relationTo
  }

  // Add upload-specific config
  if (config.fieldType === 'upload' && config.uploadRelationTo) {
    field.relationTo = config.uploadRelationTo
  }

  // Format as JSON with 2-space indent
  return JSON.stringify(field, null, 2)
}

/**
 * Generate TypeScript interface property
 *
 * @example
 * generateInterfaceProperty({
 *   frontmatterName: 'editorial_team_editor',
 *   payloadName: 'editorialTeamEditor',
 *   fieldType: 'relationship',
 *   required: false,
 *   relationTo: 'team'
 * })
 * // Returns: "editorial_team_editor?: string  // Slug before resolution"
 */
export function generateInterfaceProperty(config: FieldConfig): string {
  const tsType = getTypeScriptType(config.fieldType)
  const optional = config.required ? '' : '?'
  const comment = getInterfaceComment(config.fieldType)

  return `${config.frontmatterName}${optional}: ${tsType}${comment ? `  // ${comment}` : ''}`
}

/**
 * Get TypeScript type for field type
 */
function getTypeScriptType(fieldType: FieldConfig['fieldType']): string {
  switch (fieldType) {
    case 'text':
      return 'string'
    case 'number':
      return 'number'
    case 'checkbox':
      return 'boolean'
    case 'date':
      return 'string' // ISO date string
    case 'relationship':
      return 'string | string[]' // Slug(s) before resolution
    case 'upload':
      return 'string' // Path before resolution
    default:
      return 'any'
  }
}

/**
 * Get helpful comment for interface property
 */
function getInterfaceComment(fieldType: FieldConfig['fieldType']): string {
  switch (fieldType) {
    case 'relationship':
      return 'Slug(s) before resolution'
    case 'upload':
      return 'Path before resolution'
    case 'date':
      return 'ISO date string or YYYY-MM-DD'
    default:
      return ''
  }
}

/**
 * Generate field mapper mapping logic
 *
 * @example
 * generateMapperLogic({
 *   frontmatterName: 'editorial_team_editor',
 *   payloadName: 'editorialTeamEditor',
 *   fieldType: 'text',
 *   required: false
 * })
 * // Returns: "editorialTeamEditor: cleanString(frontmatter.editorial_team_editor),"
 */
export function generateMapperLogic(config: FieldConfig): string {
  const transformer = getTransformerFunction(config.fieldType)
  const value = `frontmatter.${config.frontmatterName}`

  return `${config.payloadName}: ${transformer}(${value}),`
}

/**
 * Get transformer function name for field type
 */
function getTransformerFunction(fieldType: FieldConfig['fieldType']): string {
  switch (fieldType) {
    case 'text':
      return 'cleanString'
    case 'number':
      return 'parseNumber'
    case 'checkbox':
      return 'parseBoolean'
    case 'date':
      return 'parseDate'
    case 'relationship':
      return 'cleanString' // Slug remains string until resolution
    case 'upload':
      return 'cleanString' // Path remains string until resolution
    default:
      return 'String'
  }
}

/**
 * Generate frontmatter field registry entry
 *
 * @example
 * generateRegistryEntry({
 *   frontmatterName: 'editorial_team_editor',
 *   payloadName: 'editorialTeamEditor',
 *   fieldType: 'relationship',
 *   required: false,
 *   relationTo: 'team'
 * })
 * // Returns: "'editorial_team_editor',  // relationship → team"
 */
export function generateRegistryEntry(config: FieldConfig): string {
  let comment = config.fieldType

  if (config.fieldType === 'relationship' && config.relationTo) {
    comment = `${config.fieldType} → ${config.relationTo}`
  } else if (config.fieldType === 'upload' && config.uploadRelationTo) {
    comment = `${config.fieldType} → ${config.uploadRelationTo}`
  }

  return `'${config.frontmatterName}',  // ${comment}`
}

/**
 * Generate complete code snippets for a field
 *
 * Returns formatted snippets ready for display or file insertion
 */
export interface CodeSnippets {
  payloadSchema: string
  interfaceProperty: string
  mapperLogic: string
  registryEntry: string
}

export function generateCodeSnippets(config: FieldConfig): CodeSnippets {
  return {
    payloadSchema: generatePayloadSchemaField(config),
    interfaceProperty: generateInterfaceProperty(config),
    mapperLogic: generateMapperLogic(config),
    registryEntry: generateRegistryEntry(config),
  }
}

/**
 * Suggest Payload field name from frontmatter name
 *
 * Converts snake_case to camelCase
 *
 * @example
 * suggestPayloadFieldName('editorial_team_editor') // → 'editorialTeamEditor'
 * suggestPayloadFieldName('seo_title') // → 'seoTitle'
 */
export function suggestPayloadFieldName(frontmatterName: string): string {
  return frontmatterName
    .split('_')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('')
}

/**
 * Format code snippets for display
 *
 * Returns markdown-formatted code blocks for terminal display
 */
export function formatSnippetsForDisplay(
  snippets: CodeSnippets,
  collectionName: 'providers' | 'electricity-rates'
): string {
  const collectionSchemaFile =
    collectionName === 'providers' ? 'Providers/index.ts' : 'ElectricityRates/index.ts'

  const fieldMapperFile =
    collectionName === 'providers' ? 'provider-field-mapper.ts' : 'rate-field-mapper.ts'

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 src/collections/${collectionSchemaFile}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${snippets.payloadSchema}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 scripts/migration/lib/${fieldMapperFile} (Interface)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${snippets.interfaceProperty}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 scripts/migration/lib/${fieldMapperFile} (Mapping)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${snippets.mapperLogic}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 scripts/migration/lib/frontmatter-field-registry.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${snippets.registryEntry}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim()
}

/**
 * Generate field config from field analysis and user choices
 *
 * Helper to convert field analysis + user responses into FieldConfig
 */
export function buildFieldConfig(
  analysis: FieldAnalysis,
  userChoices: {
    fieldType: FieldConfig['fieldType']
    payloadName: string
    required: boolean
    relationTo?: string
    uploadRelationTo?: string
  }
): FieldConfig {
  return {
    frontmatterName: analysis.fieldName,
    payloadName: userChoices.payloadName,
    fieldType: userChoices.fieldType,
    required: userChoices.required,
    relationTo: userChoices.relationTo,
    uploadRelationTo: userChoices.uploadRelationTo,
  }
}
