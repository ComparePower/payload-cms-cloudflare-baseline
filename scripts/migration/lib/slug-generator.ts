/**
 * Unique Slug Generator
 *
 * Task: T018
 *
 * Generates unique slugs from file paths using full relative path to avoid collisions.
 * This prevents duplicate slugs when multiple MDX files have the same base filename
 * in different directories.
 *
 * Example:
 *   Input:  /path/to/providers/_drafts/ratings/index.mdx
 *   Source: /path/to/providers
 *   Output: "drafts-ratings"
 *
 *   Input:  /path/to/providers/texas-electricity-energy-companies/_drafts/ratings/index.mdx
 *   Source: /path/to/providers
 *   Output: "texas-electricity-energy-companies-drafts-ratings"
 */

import path from 'path'

/**
 * Generate unique slug from file path using full relative path
 *
 * @param filePath - Absolute path to MDX file
 * @param sourceDir - Base directory to calculate relative path from
 * @returns Unique slug string
 *
 * @example
 * const slug = generateUniqueSlug(
 *   '/Users/brad/astro/providers/4change-energy/index.mdx',
 *   '/Users/brad/astro/providers'
 * )
 * // Returns: "4change-energy"
 *
 * @example
 * const slug = generateUniqueSlug(
 *   '/Users/brad/astro/providers/_drafts/ratings/index.mdx',
 *   '/Users/brad/astro/providers'
 * )
 * // Returns: "drafts-ratings"
 */
export function generateUniqueSlug(filePath: string, sourceDir: string): string {
  // Get relative path from source directory
  const relativePath = path.relative(sourceDir, filePath)

  // Remove file extension and /index.mdx suffix
  let pathSlug = relativePath
    .replace(/\/index\.mdx$/, '') // Remove /index.mdx
    .replace(/\.mdx$/, '') // Remove .mdx
    .toLowerCase()

  // Convert path separators and special chars to hyphens
  pathSlug = pathSlug
    .replace(/\//g, '-') // / → -
    .replace(/_/g, '-') // _ → - (so _drafts becomes drafts)
    .replace(/[^a-z0-9-]+/g, '-') // Remove non-alphanumeric except hyphens
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens

  return pathSlug
}

/**
 * Generate slug from frontmatter wp_slug if available, otherwise use file path
 *
 * @param filePath - Absolute path to MDX file
 * @param sourceDir - Base directory
 * @param frontmatter - Parsed frontmatter object
 * @returns Slug string
 *
 * @example
 * const slug = generateSlugWithFallback(
 *   '/path/to/file.mdx',
 *   '/path/to',
 *   { wp_slug: '4change-energy' }
 * )
 * // Returns: "4change-energy"
 */
export function generateSlugWithFallback(
  filePath: string,
  sourceDir: string,
  frontmatter: Record<string, any>
): string {
  // Prefer wp_slug from frontmatter if available
  if (frontmatter.wp_slug && typeof frontmatter.wp_slug === 'string') {
    return frontmatter.wp_slug.replace(/^"|"$/g, '').trim()
  }

  // Fallback to path-based slug
  return generateUniqueSlug(filePath, sourceDir)
}

/**
 * Validate slug meets Payload requirements
 *
 * @param slug - Slug to validate
 * @returns true if valid, error message if invalid
 *
 * Rules:
 * - Lowercase alphanumeric + hyphens only
 * - No leading/trailing hyphens
 * - No consecutive hyphens
 * - Max 100 characters
 * - Min 1 character
 */
export function validateSlug(slug: string): true | string {
  if (!slug || slug.length === 0) {
    return 'Slug cannot be empty'
  }

  if (slug.length > 100) {
    return `Slug too long (${slug.length} chars, max 100)`
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return 'Slug must contain only lowercase letters, numbers, and hyphens'
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return 'Slug cannot start or end with hyphens'
  }

  if (slug.includes('--')) {
    return 'Slug cannot contain consecutive hyphens'
  }

  return true
}
