/**
 * Provider Field Mapper
 *
 * Task: T019
 *
 * Maps frontmatter fields from Astro MDX files to Payload CMS field structure.
 * Handles all 17 discovered frontmatter fields including nested fields (seo, hero).
 *
 * Frontmatter Fields (17 total):
 * - title, wp_slug, wp_post_id, seo_meta_desc, draft, pubDate, updatedDate
 * - wp_author, seo_title, hero_heading_line_1, hero_heading_line_2, hero_cta_text
 * - target_keyword, post_author_team_member_is, post_editor_team_member_is,
 *   post_checker_team_member_is, description
 *
 * Payload Fields:
 * - title, slug, wordpressSlug, wpPostId, wpAuthor, status, publishedAt, updatedDate
 * - seo: { title, metaDescription }
 * - hero: { headingLine1, headingLine2, ctaText }
 * - targetKeyword
 * - content (richText), contentBlocks (blocks array)
 */

import { generateSlugWithFallback } from './slug-generator.js'

export interface ProviderFrontmatter {
  title?: string
  wp_slug?: string
  wp_post_id?: number | string
  seo_meta_desc?: string
  seo_title?: string
  draft?: boolean | string
  pubDate?: string
  updatedDate?: string
  wp_author?: string
  hero_heading_line_1?: string
  hero_heading_line_2?: string
  hero_cta_text?: string
  cp_hero_heading_line_1?: string
  cp_hero_heading_line_2?: string
  cp_hero_cta_text?: string
  target_keyword?: string
  description?: string
  // Relationship fields (rarely used, 1 file only)
  post_author_team_member_is?: string[]
  post_editor_team_member_is?: string[]
  post_checker_team_member_is?: string[]
  [key: string]: any
}

export interface ProviderData {
  title: string
  slug: string
  wordpressSlug?: string
  wpPostId?: number
  wpAuthor?: string
  status: 'draft' | 'published'
  publishedAt: string
  updatedDate?: string
  seo?: {
    title?: string
    metaDescription?: string
  }
  hero?: {
    headingLine1?: string
    headingLine2?: string
    ctaText?: string
  }
  targetKeyword?: string
  _mdxContent?: string // Temporary field for content processing
}

/**
 * Map provider frontmatter to Payload field structure
 *
 * @param frontmatter - Parsed frontmatter object
 * @param filePath - Absolute path to MDX file
 * @param sourceDir - Base directory for slug generation
 * @param mdxContent - MDX content body (optional, stored temporarily)
 * @returns Mapped Payload data
 *
 * @example
 * const data = mapProviderFields(
 *   { title: '"4Change Energy"', draft: false, pubDate: '2024-01-01' },
 *   '/path/to/4change-energy/index.mdx',
 *   '/path/to/providers'
 * )
 */
export async function mapProviderFields(
  frontmatter: ProviderFrontmatter,
  filePath: string,
  sourceDir: string,
  mdxContent?: string
): Promise<ProviderData> {
  // Clean string values (remove quotes)
  const cleanString = (value: any): string | undefined => {
    if (!value) return undefined
    return String(value).replace(/^"|"$/g, '').trim()
  }

  // Parse boolean values
  const parseBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim()
      return lower === 'true' || lower === '1'
    }
    return Boolean(value)
  }

  // Parse number values
  const parseNumber = (value: any): number | undefined => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const cleaned = value.replace(/^"|"$/g, '').trim()
      const num = parseInt(cleaned, 10)
      return isNaN(num) ? undefined : num
    }
    return undefined
  }

  // Parse date to ISO string
  const parseDate = (value: any): string => {
    if (!value) {
      // Default to current date if missing
      return new Date().toISOString()
    }

    let cleaned = cleanString(value) || ''

    // Replace MDX component placeholders with current year
    cleaned = cleaned.replace(/<CurrentYearDirect\s*\/>/g, new Date().getFullYear().toString())

    // If already ISO format, parse it
    if (cleaned.includes('T')) {
      const parsed = new Date(cleaned)
      if (isNaN(parsed.getTime())) {
        console.warn(`Invalid ISO date: ${cleaned}, using current date`)
        return new Date().toISOString()
      }
      return parsed.toISOString()
    }

    // Parse YYYY-MM-DD format
    if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parsed = new Date(cleaned + 'T00:00:00Z')
      if (isNaN(parsed.getTime())) {
        console.warn(`Invalid date: ${cleaned}, using current date`)
        return new Date().toISOString()
      }
      return parsed.toISOString()
    }

    // Fallback to current date
    console.warn(`Unparseable date: ${cleaned}, using current date`)
    return new Date().toISOString()
  }

  // Generate slug - ALWAYS use path-based slug for uniqueness
  // wp_slug is stored separately in wordpressSlug field
  const { generateUniqueSlug } = await import('./slug-generator.js')
  const slug = generateUniqueSlug(filePath, sourceDir)

  // Map fields to Payload structure
  const data: ProviderData = {
    // Required fields
    title: cleanString(frontmatter.title) || 'Untitled',
    slug: slug,
    status: parseBoolean(frontmatter.draft) ? 'draft' : 'published',
    publishedAt: parseDate(frontmatter.pubDate),

    // Optional WordPress fields
    wordpressSlug: cleanString(frontmatter.wp_slug),
    wpPostId: parseNumber(frontmatter.wp_post_id),
    wpAuthor: cleanString(frontmatter.wp_author),

    // Optional date field
    updatedDate: frontmatter.updatedDate ? parseDate(frontmatter.updatedDate) : undefined,

    // SEO group (nested)
    seo: {},

    // Hero group (nested)
    hero: {},

    // SEO target keyword
    targetKeyword: cleanString(frontmatter.target_keyword),
  }

  // Build SEO nested object
  if (frontmatter.seo_title || frontmatter.seo_meta_desc) {
    data.seo = {
      title: cleanString(frontmatter.seo_title),
      metaDescription: cleanString(frontmatter.seo_meta_desc),
    }
  } else {
    delete data.seo // Remove empty object
  }

  // Build Hero nested object (support both hero_ and cp_hero_ prefixes)
  const heroLine1 = frontmatter.hero_heading_line_1 || frontmatter.cp_hero_heading_line_1
  const heroLine2 = frontmatter.hero_heading_line_2 || frontmatter.cp_hero_heading_line_2
  const heroCtaText = frontmatter.hero_cta_text || frontmatter.cp_hero_cta_text

  if (heroLine1 || heroLine2 || heroCtaText) {
    data.hero = {
      headingLine1: cleanString(heroLine1),
      headingLine2: cleanString(heroLine2),
      ctaText: cleanString(heroCtaText),
    }
  } else {
    delete data.hero // Remove empty object
  }

  // Store MDX content temporarily for later processing
  if (mdxContent) {
    data._mdxContent = mdxContent
  }

  return data
}

/**
 * Validate required provider fields are present
 *
 * @param data - Mapped provider data
 * @returns Array of missing field names (empty if valid)
 */
export function validateProviderData(data: ProviderData): string[] {
  const missing: string[] = []

  if (!data.title || data.title === 'Untitled') {
    missing.push('title')
  }

  if (!data.slug) {
    missing.push('slug')
  }

  if (!data.status) {
    missing.push('status')
  }

  if (!data.publishedAt) {
    missing.push('publishedAt')
  }

  return missing
}
