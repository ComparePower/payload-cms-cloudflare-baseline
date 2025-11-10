/**
 * Frontmatter Field Registry
 *
 * Defines all known/mapped frontmatter fields for each collection.
 * Used for pre-flight validation to catch unmapped fields before migration.
 *
 * Similar to component registry, but for YAML frontmatter fields instead of MDX components.
 */

/**
 * PROVIDERS Collection - Known Frontmatter Fields
 *
 * These fields are handled by provider-field-mapper.ts
 * If a field appears in frontmatter but NOT in this list, migration will fail.
 */
export const PROVIDER_KNOWN_FIELDS = [
  // Core fields
  'title',
  'draft',

  // WordPress legacy fields
  'wp_slug',
  'wp_post_id',
  'wp_author',

  // SEO fields
  'seo_title',
  'seo_meta_desc',
  'target_keyword',
  'description',

  // Hero fields (old format)
  'hero_heading_line_1',
  'hero_heading_line_2',
  'hero_cta_text',

  // Hero fields (cp_ prefixed format)
  'cp_hero_heading_line_1',
  'cp_hero_heading_line_2',
  'cp_hero_cta_text',

  // Dates
  'pubDate',
  'updatedDate',

  // Editorial team (rare - only 1 provider uses these)
  'post_author_team_member_is',
  'post_editor_team_member_is',
  'post_checker_team_member_is',
]

/**
 * ELECTRICITY RATES Collection - Known Frontmatter Fields
 *
 * These fields are handled by rate-field-mapper.ts
 * If a field appears in frontmatter but NOT in this list, migration will fail.
 */
export const RATE_KNOWN_FIELDS = [
  // Core fields
  'title',
  'draft',

  // City fields
  'cityName',
  'cityRef',

  // WordPress legacy fields
  'wp_slug',
  'wp_post_id',
  'wp_author',

  // Team member fields (ignored - team member relationships not migrated for rates)
  'post_author_team_member_is',
  'post_editor_team_member_is',
  'post_checker_team_member_is',

  // SEO fields
  'seo_title',
  'seo_meta_desc',
  'target_keyword',

  // Hero fields (cp_ prefixed format only - rates don't use old format)
  'cp_hero_heading_line_1',
  'cp_hero_heading_line_2',
  'cp_hero_cta_text',

  // Dates
  'pubDate',
  'updatedDate',
]

/**
 * Validate frontmatter fields against known fields registry
 *
 * @param discoveredFields - Set of all fields found in frontmatter across all files
 * @param knownFields - Array of known/mapped fields for this collection
 * @returns Array of unmapped fields (empty if all fields are known)
 */
export function validateFrontmatterFields(
  discoveredFields: Set<string>,
  knownFields: string[]
): string[] {
  const unmappedFields = [...discoveredFields].filter(
    field => !knownFields.includes(field)
  )

  return unmappedFields.sort() // Alphabetical for consistency
}

/**
 * Display error message for unmapped frontmatter fields
 *
 * @param unmappedFields - Array of field names that aren't in the registry
 * @param collectionName - Name of the collection (for helpful error messages)
 */
export function displayUnmappedFieldsError(
  unmappedFields: string[],
  collectionName: 'providers' | 'electricity-rates'
): void {
  const fieldMapperFile = collectionName === 'providers'
    ? 'provider-field-mapper.ts'
    : 'rate-field-mapper.ts'

  const collectionSchemaFile = collectionName === 'providers'
    ? 'Providers/index.ts'
    : 'ElectricityRates/index.ts'

  const registryConst = collectionName === 'providers'
    ? 'PROVIDER_KNOWN_FIELDS'
    : 'RATE_KNOWN_FIELDS'

  console.error('\n')
  console.error('╔════════════════════════════════════════════════════════════════╗')
  console.error('║                                                                ║')
  console.error(`║   ❌  MIGRATION FAILED: ${unmappedFields.length} unmapped frontmatter fields          ║`)
  console.error('║                                                                ║')
  console.error('╚════════════════════════════════════════════════════════════════╝')
  console.error('\n')
  console.error('The following frontmatter fields exist in MDX files but are NOT mapped:\n')

  unmappedFields.forEach((field, i) => {
    console.error(`  ${i + 1}. ${field}`)
  })

  console.error('\n📋 Next Steps:\n')
  console.error('For each unmapped field, decide:\n')
  console.error('  Option A: Add field mapping (if you need this data)')
  console.error(`    1. Add field to: scripts/migration/lib/${fieldMapperFile}`)
  console.error(`       - Add to interface (e.g., ${unmappedFields[0]}?: string)`)
  console.error('       - Add mapping logic in mapFields() function')
  console.error(`    2. Add field to: src/collections/${collectionSchemaFile}`)
  console.error('       - Define Payload field schema')
  console.error(`    3. Add field to: scripts/migration/lib/frontmatter-field-registry.ts`)
  console.error(`       - Add to ${registryConst} array\n`)

  console.error('  Option B: Explicitly ignore field (if you don\'t need this data)')
  console.error(`    - Add to ${registryConst} array with a comment: // Ignored - not needed\n`)

  console.error('⚠️  DO NOT proceed until all fields are either mapped or explicitly ignored.\n')
  console.error('💡 Tip: Use --ignore-unmapped-fields flag to temporarily bypass this check.\n')
}
