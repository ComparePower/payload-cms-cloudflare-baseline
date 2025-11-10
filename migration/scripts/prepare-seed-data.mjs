#!/usr/bin/env node
/**
 * Prepare Seed Data for Payload
 *
 * Reads MDX files from Astro project and prepares JSON data for Payload seeding:
 * - Parses frontmatter from all provider MDX files
 * - Converts markdown content to simple rich text
 * - Maps component props to content blocks
 * - Resolves relationships (Team members)
 * - Outputs JSON files ready for seeding
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Recursively find all .mdx files in a directory
 */
async function findMdxFiles(dir) {
  const files = []

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(fullPath)
      }
    }
  }

  await walk(dir)
  return files
}
const ASTRO_PROVIDERS_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro/src/content/front-end/providers'
const OUTPUT_DIR = path.join(__dirname, '../data/seed')

/**
 * Parse YAML frontmatter from MDX content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const frontmatter = {}
  const yamlContent = match[1]

  // Parse YAML line by line (simple parser)
  const lines = yamlContent.split('\n')
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }

    // Parse booleans
    if (value === 'true') value = true
    if (value === 'false') value = false

    // Parse numbers
    if (/^\d+$/.test(value)) value = parseInt(value, 10)

    frontmatter[key] = value
  }

  return frontmatter
}

/**
 * Extract MDX content (after frontmatter)
 */
function extractContent(mdxContent) {
  const match = mdxContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)/)
  return match ? match[1] : mdxContent
}

/**
 * Convert simple markdown to Lexical-compatible rich text
 * For now, we'll store markdown as-is and let Payload handle it
 */
function convertMarkdownToLexical(markdown) {
  // Simplified: Store as paragraphs
  // In production, you'd use a proper MD→Lexical converter
  const paragraphs = markdown.split('\n\n').filter(p => p.trim())

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: paragraphs.map(text => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            format: 0,
            text: text.trim(),
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      }))
    }
  }
}

/**
 * Extract component usage from MDX content
 */
function extractComponents(mdxContent) {
  const components = []

  // Match component tags like <ZipcodeSearchbar ... />
  const componentRegex = /<(\w+)([^>]*?)\/>/g
  let match

  while ((match = componentRegex.exec(mdxContent)) !== null) {
    const componentName = match[1]
    const propsString = match[2]

    // Parse props
    const props = {}
    const propRegex = /(\w+)="([^"]*)"/g
    let propMatch

    while ((propMatch = propRegex.exec(propsString)) !== null) {
      props[propMatch[1]] = propMatch[2]
    }

    components.push({ name: componentName, props })
  }

  return components
}

/**
 * Map MDX component to Payload block
 * Uses actual block slugs from /src/lexical/blocks/
 */
function componentToBlock(component) {
  const { name, props } = component

  // Map component names to block slugs
  const blockMapping = {
    'ProviderCard': 'providerCard',
    'RatesTable': 'ratesTable',
    'ProvidersPhoneTable': 'providersPhoneTable',
    'PopularCitiesList': 'popularCitiesList',
    'PopularZipcodes': 'popularZipcodes',
    'ZipcodeSearchbar': 'zipcodeSearchbar',
    'Faq': 'faqBlock',
    'HelpMeChoose': 'helpMeChoose',
  }

  const blockType = blockMapping[name]

  if (!blockType) {
    console.warn(`⚠️  Unknown component: ${name}`)
    return null
  }

  // Return block with all props (Payload will validate based on block definition)
  return {
    blockType,
    ...props
  }
}

/**
 * Generate unique slug from file path
 */
function generateUniqueSlug(filePath, frontmatter) {
  // Get relative path from providers directory
  const relativePath = path.relative(ASTRO_PROVIDERS_DIR, filePath)

  // Remove /index.mdx and .mdx extensions
  let pathSlug = relativePath.replace(/\/index\.mdx$/, '').replace(/\.mdx$/, '')

  // Convert to slug format
  pathSlug = pathSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // Use wp_slug from frontmatter as a fallback if path is empty
  if (!pathSlug || pathSlug === 'index') {
    return frontmatter.wp_slug || frontmatter.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'provider'
  }

  return pathSlug
}

/**
 * Process a single MDX file
 */
async function processProviderFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8')

  // Parse frontmatter
  const frontmatter = parseFrontmatter(content)
  if (!frontmatter) {
    console.warn(`  ⚠️  No frontmatter found in ${filePath}`)
    return null
  }

  // Extract content
  const mdxContent = extractContent(content)

  // Generate unique slug from file path
  const uniqueSlug = generateUniqueSlug(filePath, frontmatter)

  // Build Payload provider object with ALL frontmatter fields
  const provider = {
    // Basic fields
    title: frontmatter.title,
    slug: uniqueSlug,
    status: frontmatter.draft === false ? 'published' : 'draft',

    // WordPress fields
    wordpressSlug: frontmatter.wp_slug,
    wpPostId: frontmatter.wp_post_id,
    wpAuthor: frontmatter.wp_author,

    // SEO fields
    seo: {
      title: frontmatter.seo_title,
      metaDescription: frontmatter.seo_meta_desc
    },

    // Dates
    publishedAt: frontmatter.pubDate,
    updatedDate: frontmatter.updatedDate,

    // Hero section
    hero: {
      headingLine1: frontmatter.cp_hero_heading_line_1,
      headingLine2: frontmatter.cp_hero_heading_line_2,
      ctaText: frontmatter.cp_hero_cta_text
    },

    // Content - store full MDX content for parsing during seeding
    _mdxContent: mdxContent,
    description: frontmatter.description,
    targetKeyword: frontmatter.target_keyword,

    // Team relationships (CRITICAL)
    postAuthorTeamMemberIs: frontmatter.post_author_team_member_is,
    postEditorTeamMemberIs: frontmatter.post_editor_team_member_is,
    postCheckerTeamMemberIs: frontmatter.post_checker_team_member_is
  }

  return provider
}

/**
 * Main preparation function
 */
async function prepareData() {
  console.log('🔧 Preparing Seed Data...\n')

  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // Find all provider MDX files
  console.log('📁 Finding provider MDX files...')
  const mdxFiles = await findMdxFiles(ASTRO_PROVIDERS_DIR)
  console.log(`   Found ${mdxFiles.length} files\n`)

  // Process each file
  console.log('🔄 Processing files...')
  const providers = []

  for (const filePath of mdxFiles) {
    const relativePath = path.relative(ASTRO_PROVIDERS_DIR, filePath)
    try {
      const provider = await processProviderFile(filePath)
      if (provider) {
        providers.push(provider)
        console.log(`   ✓ ${relativePath}`)
      }
    } catch (error) {
      console.error(`   ❌ ${relativePath}: ${error.message}`)
    }
  }

  console.log(`\n✅ Processed ${providers.length} providers\n`)

  // Write output
  console.log('💾 Writing seed data...')
  const outputFile = path.join(OUTPUT_DIR, 'providers.json')
  await fs.writeFile(outputFile, JSON.stringify(providers, null, 2))
  console.log(`   ✓ ${outputFile}\n`)

  // Summary
  console.log('📊 Summary:')
  console.log(`   Total files: ${mdxFiles.length}`)
  console.log(`   Processed: ${providers.length}`)
  console.log(`   Failed: ${mdxFiles.length - providers.length}`)

  const publishedCount = providers.filter(p => p.status === 'published').length
  const draftCount = providers.filter(p => p.status === 'draft').length
  console.log(`   Published: ${publishedCount}`)
  console.log(`   Drafts: ${draftCount}\n`)

  console.log('✅ Data preparation complete!\n')
}

// Run preparation
prepareData().catch(console.error)
