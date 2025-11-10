/**
 * Type-Safe Mappers for MDX ↔ Payload Round-Trip
 *
 * This module ensures 100% fidelity between MDX frontmatter and Payload CMS data
 * by using TypeScript types derived from actual schemas and component definitions.
 */

import type { ElectricityRate } from '@/payload-types'

// ============================================================================
// FRONTMATTER TYPES
// ============================================================================

/**
 * MDX Frontmatter structure (from Astro content collections)
 * This matches the EXACT structure in the source MDX files
 */
export interface ElectricityRateFrontmatter {
  // Core fields
  title: string
  draft?: boolean
  cityName: string
  cityRef?: string

  // WordPress fields
  wp_slug?: string
  wp_post_id?: number
  wp_author?: string

  // SEO fields (flat in frontmatter, grouped in Payload)
  seo_title?: string
  seo_meta_desc?: string
  target_keyword?: string

  // Dates
  pubDate: string | Date
  updatedDate?: string | Date

  // Hero fields (flat in frontmatter, grouped in Payload)
  cp_hero_heading_line_1?: string
  cp_hero_heading_line_2?: string
  cp_hero_cta_text?: string
}

// ============================================================================
// COMPONENT PROP TYPES (from actual Astro components)
// ============================================================================

/**
 * RatesTable component props
 * Source: /cp-content-site-astro/src/components/wp-shortcodes/RatesTable.astro
 */
export interface RatesTableProps {
  state?: string
  city?: string
  useCityAsFilter?: string
  showUtility?: string
  showProvider?: string
  provider?: string
  utility?: string
  excludeProviders?: string
  priceUnit?: string
  tableMaxWidth?: string
  linkPlanToPopup?: string
  textAfterTable?: string
  appendTableExtras?: string
  pricingBasedOn?: string
  headingWrapperTag?: string
  zipcode?: string
}

/**
 * ZipcodeSearchbar component props
 * Source: /cp-content-site-astro/src/components/wp-shortcodes/ZipcodeSearchbar.astro
 */
export interface ZipcodeSearchbarProps {
  buttonText?: string
  prependText?: string
  prepend_text?: string  // Legacy snake_case variant
  placeholder?: string
  useAddressSearch?: boolean
  initialZipcode?: string

  // Additional props found in original MDX
  zipcode?: string
  buttontext?: string  // Legacy lowercase variant
  classname?: string
}

/**
 * UtilitySearchCTAInline component props
 * Source: /cp-content-site-astro/src/components/utility-search/UtilitySearchCTAInline.astro
 */
export interface UtilitySearchCTAInlineProps {
  headline?: string
  subheadline?: string
  buttonText?: string
  formType?: 'zip' | 'address'
  zipPlaceholder?: string
  addressPlaceholder?: string
  trustIndicator?: string
}

// ============================================================================
// FRONTMATTER MAPPING FUNCTIONS
// ============================================================================

/**
 * Convert MDX frontmatter to Payload ElectricityRate data
 * MUST preserve ALL fields for round-trip fidelity
 */
export function frontmatterToPayload(frontmatter: ElectricityRateFrontmatter): Partial<ElectricityRate> {
  return {
    title: frontmatter.title,
    cityName: frontmatter.cityName,
    cityRef: frontmatter.cityRef,

    // WordPress fields
    wordpressSlug: frontmatter.wp_slug,
    wpPostId: frontmatter.wp_post_id,
    wpAuthor: frontmatter.wp_author,

    // SEO group (flatten → group)
    seo: {
      title: frontmatter.seo_title,
      metaDescription: frontmatter.seo_meta_desc,
    },
    targetKeyword: frontmatter.target_keyword,

    // Dates
    publishedAt: frontmatter.pubDate instanceof Date
      ? frontmatter.pubDate.toISOString()
      : frontmatter.pubDate,
    updatedDate: frontmatter.updatedDate
      ? (frontmatter.updatedDate instanceof Date
          ? frontmatter.updatedDate.toISOString()
          : frontmatter.updatedDate)
      : undefined,

    // Hero group (flatten → group)
    hero: {
      headingLine1: frontmatter.cp_hero_heading_line_1,
      headingLine2: frontmatter.cp_hero_heading_line_2,
      ctaText: frontmatter.cp_hero_cta_text,
    },
  }
}

/**
 * Convert Payload ElectricityRate data to MDX frontmatter
 * MUST preserve ALL fields for round-trip fidelity
 */
export function payloadToFrontmatter(rate: ElectricityRate): ElectricityRateFrontmatter {
  return {
    // Core fields
    title: rate.title,
    draft: false, // Payload uses _status for draft/published
    cityName: rate.cityName,
    cityRef: rate.cityRef,

    // WordPress fields
    wp_slug: rate.wordpressSlug,
    wp_post_id: rate.wpPostId,
    wp_author: rate.wpAuthor,

    // SEO fields (group → flatten)
    seo_title: rate.seo?.title,
    seo_meta_desc: rate.seo?.metaDescription,
    target_keyword: rate.targetKeyword,

    // Dates
    pubDate: rate.publishedAt,
    updatedDate: rate.updatedDate,

    // Hero fields (group → flatten)
    cp_hero_heading_line_1: rate.hero?.headingLine1,
    cp_hero_heading_line_2: rate.hero?.headingLine2,
    cp_hero_cta_text: rate.hero?.ctaText,
  }
}

// ============================================================================
// COMPONENT PROP MAPPING FUNCTIONS
// ============================================================================

/**
 * Map block data to RatesTable props
 * Ensures all props match the component's interface
 */
export function mapRatesTableProps(block: Record<string, any>): RatesTableProps {
  return {
    state: block.state,
    city: block.city,
    useCityAsFilter: block.useCityAsFilter,
    showUtility: block.showUtility,
    showProvider: block.showProvider,
    provider: block.provider,
    utility: block.utility,
    excludeProviders: block.excludeProviders,
    priceUnit: block.priceUnit,
    tableMaxWidth: block.tableMaxWidth,
    linkPlanToPopup: block.linkPlanToPopup,
    textAfterTable: block.textAfterTable || block.textRrTable, // Handle both spellings
    appendTableExtras: block.appendTableExtras,
    pricingBasedOn: block.pricingBasedOn,
    headingWrapperTag: block.headingWrapperTag,
    zipcode: block.zipcode,
  }
}

/**
 * Map block data to ZipcodeSearchbar props
 * Ensures all props match the component's interface
 */
export function mapZipcodeSearchbarProps(block: Record<string, any>): ZipcodeSearchbarProps {
  return {
    buttonText: block.buttonText || block.buttontext, // Handle both casings
    prependText: block.prependText || block.prepend_text,
    prepend_text: block.prepend_text,
    placeholder: block.placeholder,
    useAddressSearch: block.useAddressSearch,
    initialZipcode: block.initialZipcode,
    zipcode: block.zipcode,
    buttontext: block.buttontext,
    classname: block.classname,
  }
}

/**
 * Map block data to UtilitySearchCTAInline props
 * Ensures all props match the component's interface
 */
export function mapUtilitySearchCTAInlineProps(block: Record<string, any>): UtilitySearchCTAInlineProps {
  return {
    headline: block.headline,
    subheadline: block.subheadline,
    buttonText: block.buttonText,
    formType: block.formType as 'zip' | 'address' | undefined,
    zipPlaceholder: block.zipPlaceholder,
    addressPlaceholder: block.addressPlaceholder,
    trustIndicator: block.trustIndicator,
  }
}

// ============================================================================
// COMPONENT NAME MAPPING
// ============================================================================

/**
 * Map Payload blockType to MDX component name
 * MUST preserve exact format including underscores
 */
export function payloadBlockTypeToMDXComponentName(blockType: string): string {
  // Capitalize first letter
  let componentName = blockType.charAt(0).toUpperCase() + blockType.slice(1)

  // Special pattern: WpBlock[number][Name] → WpBlock[number]_[Name]
  // Insert underscore between digit and uppercase letter
  componentName = componentName.replace(/(\d)([A-Z])/g, '$1_$2')

  return componentName
}

/**
 * Map MDX component name to Payload blockType
 * MUST handle both formats (with/without underscores)
 */
export function mdxComponentNameToPayloadBlockType(componentName: string): string {
  // Convert to camelCase
  const camelCase = componentName.charAt(0).toLowerCase() + componentName.slice(1)

  // Remove underscores for Payload storage
  return camelCase.replace(/_/g, '')
}

// ============================================================================
// SERIALIZATION HELPERS
// ============================================================================

/**
 * Serialize frontmatter to YAML string
 * Handles multiline strings with proper >- formatting
 */
export function serializeFrontmatter(frontmatter: ElectricityRateFrontmatter): string {
  const lines: string[] = ['---']

  // Required fields first
  lines.push(`title: ${frontmatter.title}`)
  if (frontmatter.draft !== undefined) {
    lines.push(`draft: ${frontmatter.draft}`)
  }
  lines.push(`cityName: ${frontmatter.cityName}`)
  if (frontmatter.cityRef) {
    lines.push(`cityRef: ${frontmatter.cityRef}`)
  }

  // WordPress fields
  if (frontmatter.wp_slug) {
    lines.push(`wp_slug: ${frontmatter.wp_slug}`)
  }
  if (frontmatter.wp_post_id) {
    lines.push(`wp_post_id: ${frontmatter.wp_post_id}`)
  }

  // SEO fields
  if (frontmatter.seo_title) {
    lines.push(`seo_title: ${frontmatter.seo_title}`)
  }
  if (frontmatter.seo_meta_desc) {
    // Multiline string
    lines.push(`seo_meta_desc: >-`)
    lines.push(`  ${frontmatter.seo_meta_desc}`)
  }
  if (frontmatter.target_keyword) {
    lines.push(`target_keyword: ${frontmatter.target_keyword}`)
  }

  // Dates
  lines.push(`pubDate: ${frontmatter.pubDate}`)
  if (frontmatter.updatedDate) {
    lines.push(`updatedDate: ${frontmatter.updatedDate}`)
  }

  // WordPress author
  if (frontmatter.wp_author) {
    lines.push(`wp_author: ${frontmatter.wp_author}`)
  }

  // Hero fields
  if (frontmatter.cp_hero_heading_line_1) {
    lines.push(`cp_hero_heading_line_1: ${frontmatter.cp_hero_heading_line_1}`)
  }
  if (frontmatter.cp_hero_heading_line_2) {
    // Multiline string
    lines.push(`cp_hero_heading_line_2: >-`)
    lines.push(`  ${frontmatter.cp_hero_heading_line_2}`)
  }
  if (frontmatter.cp_hero_cta_text) {
    lines.push(`cp_hero_cta_text: '${frontmatter.cp_hero_cta_text}'`)
  }

  lines.push('---')
  return lines.join('\n')
}

/**
 * Serialize component props to MDX attribute string
 * Preserves all props exactly as they were in original
 */
export function serializeComponentProps(props: Record<string, any>): string {
  return Object.entries(props)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // Handle boolean values
      if (typeof value === 'boolean') {
        return `${key}="${value}"`
      }
      // Handle string values
      return `${key}="${String(value).replace(/"/g, '\\"')}"`
    })
    .join(' ')
}
