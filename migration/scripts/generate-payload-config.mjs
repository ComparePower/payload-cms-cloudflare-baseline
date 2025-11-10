#!/usr/bin/env node
/**
 * Payload Config Generator
 *
 * Generates TypeScript Payload collection and block configurations from:
 * 1. Frontmatter analysis (field definitions)
 * 2. Component validation (block definitions)
 * 3. Component props (block field schemas)
 *
 * Outputs ready-to-use TypeScript files that can be integrated into Payload project.
 */

import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/migration/data'
const OUTPUT_DIR = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/migration/generated'

// Load analysis data
let frontmatterAnalysis
let componentProps
let componentValidation

/**
 * Load all analysis data
 */
async function loadAnalysisData() {
  frontmatterAnalysis = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, 'frontmatter-analysis.json'), 'utf-8')
  )

  componentProps = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, 'component-props.json'), 'utf-8')
  )

  componentValidation = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, 'component-validation.json'), 'utf-8')
  )
}

/**
 * Convert Payload field type to TypeScript type string
 */
function payloadFieldToTS(field) {
  const typeMap = {
    text: 'string',
    textarea: 'string',
    number: 'number',
    checkbox: 'boolean',
    date: 'string',  // ISO date string
    relationship: 'string | any',  // ID or populated object
    upload: 'string | any',
    array: 'any[]',
    richText: 'any',
    blocks: 'any[]'
  }

  return typeMap[field.type] || 'any'
}

/**
 * Generate TypeScript field definition
 */
function generateFieldTS(field, indent = '    ') {
  const lines = []

  lines.push(`${indent}{`)
  lines.push(`${indent}  name: '${field.name}',`)
  lines.push(`${indent}  type: '${field.type}',`)

  if (field.required) {
    lines.push(`${indent}  required: true,`)
  }

  if (field.unique) {
    lines.push(`${indent}  unique: true,`)
  }

  if (field.index) {
    lines.push(`${indent}  index: true,`)
  }

  if (field.defaultValue !== undefined) {
    const defaultVal = typeof field.defaultValue === 'string'
      ? `'${field.defaultValue}'`
      : field.defaultValue
    lines.push(`${indent}  defaultValue: ${defaultVal},`)
  }

  if (field.relationTo) {
    lines.push(`${indent}  relationTo: '${field.relationTo}',`)
  }

  if (field.hasMany) {
    lines.push(`${indent}  hasMany: true,`)
  }

  if (field.options) {
    lines.push(`${indent}  options: [`)
    field.options.forEach(opt => {
      if (typeof opt === 'string') {
        lines.push(`${indent}    { label: '${opt}', value: '${opt}' },`)
      } else {
        lines.push(`${indent}    { label: '${opt.label}', value: '${opt.value}' },`)
      }
    })
    lines.push(`${indent}  ],`)
  }

  if (field.fields) {
    lines.push(`${indent}  fields: [`)
    field.fields.forEach(subField => {
      lines.push(...generateFieldTS(subField, indent + '    ').split('\n'))
    })
    lines.push(`${indent}  ],`)
  }

  if (field.blocks) {
    lines.push(`${indent}  blocks: [`)
    field.blocks.forEach(blockName => {
      lines.push(`${indent}    ${blockName},`)
    })
    lines.push(`${indent}  ],`)
  }

  if (field.admin) {
    lines.push(`${indent}  admin: {`)
    if (field.admin.description) {
      lines.push(`${indent}    description: '${field.admin.description.replace(/'/g, "\\'")}',`)
    }
    if (field.admin.condition) {
      lines.push(`${indent}    condition: ${field.admin.condition},`)
    }
    lines.push(`${indent}  },`)
  }

  lines.push(`${indent}}`)

  return lines.join('\n')
}

/**
 * Generate Providers collection TypeScript file
 */
async function generateProvidersCollection() {
  console.log('\n📝 Generating Providers collection...')

  const fields = frontmatterAnalysis.fields
  const payloadFields = []

  // Add slug field (from wp_slug or generated from title)
  payloadFields.push({
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      description: 'URL-friendly identifier (auto-generated from title)'
    }
  })

  // Add parent field for hierarchy
  payloadFields.push({
    name: 'parent',
    type: 'relationship',
    relationTo: 'providers',
    admin: {
      description: 'Parent entry for hierarchical structure'
    }
  })

  // Map all frontmatter fields
  for (const [fieldName, fieldData] of Object.entries(fields)) {
    if (fieldName === 'wp_slug') continue // Already handled as 'slug'

    const payloadField = {
      name: fieldName,
      type: fieldData.isRelationship ? 'relationship' : fieldData.type.includes('array') ? 'array' : fieldData.type,
      required: fieldData.count === frontmatterAnalysis.totalFiles && !fieldData.nullable,
      admin: {
        description: `Found in ${fieldData.count}/${frontmatterAnalysis.totalFiles} files`
      }
    }

    // Handle specific field types
    if (fieldData.isRelationship) {
      payloadField.relationTo = fieldData.targetCollection
      payloadField.hasMany = fieldData.type.includes('array')
    }

    if (fieldData.type === 'boolean') {
      payloadField.type = 'checkbox'
    }

    if (fieldData.type === 'string' && fieldData.examples.length > 0) {
      const avgLength = fieldData.examples.reduce((sum, ex) => sum + String(ex).length, 0) / fieldData.examples.length
      payloadField.type = avgLength > 100 ? 'textarea' : 'text'
    }

    if (fieldData.type.includes('array<')) {
      payloadField.type = 'array'
      const itemType = fieldData.type.match(/array<(\w+)>/)
      if (itemType && itemType[1] === 'string') {
        payloadField.fields = [
          {
            name: 'item',
            type: 'text'
          }
        ]
      }
    }

    // Special handling for wp_post_id (it's a number, not a relationship!)
    if (fieldName === 'wp_post_id') {
      payloadField.type = 'number'
      delete payloadField.relationTo
      delete payloadField.hasMany
    }

    payloadFields.push(payloadField)
  }

  // Add contentBlocks field
  payloadFields.push({
    name: 'contentBlocks',
    type: 'blocks',
    blocks: ['/* Import all generated blocks */'],
    admin: {
      description: 'Rich content blocks (MDX converted to Lexical)'
    }
  })

  // Add heroImage field
  payloadFields.push({
    name: 'heroImage',
    type: 'upload',
    relationTo: 'media',
    admin: {
      description: 'Featured/hero image'
    }
  })

  // Generate TypeScript file
  const tsContent = `import { CollectionConfig } from 'payload/types'

/**
 * Providers Collection
 *
 * Generated from frontmatter analysis on ${new Date().toISOString()}
 * Total files analyzed: ${frontmatterAnalysis.totalFiles}
 * Total fields: ${Object.keys(fields).length}
 */

export const Providers: CollectionConfig = {
  slug: 'providers',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'draft', 'updatedAt'],
    description: 'Provider hub pages with hierarchical structure'
  },
  fields: [
${payloadFields.map(f => generateFieldTS(f, '    ')).join(',\n')}
  ],
  hooks: {
    beforeValidate: [
      // Auto-generate slug from title if not provided
      ({ data }) => {
        if (!data.slug && data.title) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        }
        return data
      }
    ]
  }
}
`

  await fs.mkdir(path.join(OUTPUT_DIR, 'collections'), { recursive: true })
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'collections', 'Providers.ts'),
    tsContent
  )

  console.log('  ✓ Generated: collections/Providers.ts')
}

/**
 * Generate Team collection TypeScript file
 */
async function generateTeamCollection() {
  console.log('\n📝 Generating Team collection...')

  const tsContent = `import { CollectionConfig } from 'payload/types'

/**
 * Team Collection
 *
 * Team members for author/editor/checker relationships
 * Generated on ${new Date().toISOString()}
 */

export const Team: CollectionConfig = {
  slug: 'team',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'email'],
    description: 'Team members (authors, editors, checkers)'
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name'
      }
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier'
      }
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Email address'
      }
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Author', value: 'author' },
        { label: 'Editor', value: 'editor' },
        { label: 'Checker', value: 'checker' },
        { label: 'Multiple Roles', value: 'multiple' }
      ],
      defaultValue: 'author',
      admin: {
        description: 'Primary role'
      }
    },
    {
      name: 'bio',
      type: 'richText',
      admin: {
        description: 'Biography (optional)'
      }
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile photo'
      }
    }
  ],
  hooks: {
    beforeValidate: [
      // Auto-generate slug from name if not provided
      ({ data }) => {
        if (!data.slug && data.name) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        }
        return data
      }
    ]
  }
}
`

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'collections', 'Team.ts'),
    tsContent
  )

  console.log('  ✓ Generated: collections/Team.ts')
}

/**
 * Generate FAQs collection TypeScript file
 */
async function generateFAQsCollection() {
  console.log('\n📝 Generating FAQs collection...')

  const tsContent = `import { CollectionConfig } from 'payload/types'

/**
 * FAQs Collection
 *
 * Reusable FAQ entries with schema.org/FAQPage support
 * Generated on ${new Date().toISOString()}
 */

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'updatedAt'],
    description: 'Reusable FAQ entries for content'
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      admin: {
        description: 'The FAQ question'
      }
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      admin: {
        description: 'The answer (supports rich text formatting)'
      }
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Electricity Providers', value: 'providers' },
        { label: 'Rates & Plans', value: 'rates' },
        { label: 'Billing', value: 'billing' },
        { label: 'General', value: 'general' }
      ],
      admin: {
        description: 'Category for organizing FAQs'
      }
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier'
      }
    },
    {
      name: 'relatedTopics',
      type: 'array',
      fields: [
        {
          name: 'topic',
          type: 'text'
        }
      ],
      admin: {
        description: 'Related topics/keywords for search'
      }
    }
  ],
  hooks: {
    beforeValidate: [
      // Auto-generate slug from question if not provided
      ({ data }) => {
        if (!data.slug && data.question) {
          data.slug = data.question
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 60)  // Limit length
        }
        return data
      }
    ]
  }
}
`

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'collections', 'FAQs.ts'),
    tsContent
  )

  console.log('  ✓ Generated: collections/FAQs.ts')
}

/**
 * Generate FAQ Block TypeScript file
 */
async function generateFaqBlock() {
  console.log('\n📝 Generating FaqBlock...')

  const tsContent = `import { Block } from 'payload/types'

/**
 * FAQ Block
 *
 * Displays one or more FAQs with schema.org/FAQPage markup
 * Generated on ${new Date().toISOString()}
 */

export const FaqBlock: Block = {
  slug: 'faqBlock',
  interfaceName: 'FaqBlockType',
  fields: [
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      required: true,
      admin: {
        description: 'Select one or more FAQs to display'
      }
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Optional title above FAQ section (e.g., "Frequently Asked Questions")'
      }
    },
    {
      name: 'showNumbers',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show numbered list (1, 2, 3...)'
      }
    },
    {
      name: 'expandable',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Make FAQs collapsible/expandable (accordion style)'
      }
    },
    {
      name: 'includeSchema',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Include schema.org/FAQPage structured data for SEO'
      }
    }
  ]
}
`

  await fs.mkdir(path.join(OUTPUT_DIR, 'blocks'), { recursive: true })
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'blocks', 'FaqBlock.ts'),
    tsContent
  )

  console.log('  ✓ Generated: blocks/FaqBlock.ts')
}

/**
 * Generate component block TypeScript file
 */
async function generateComponentBlock(componentName, props) {
  const blockSlug = componentName.charAt(0).toLowerCase() + componentName.slice(1)

  const fields = []

  // Add fields from component props
  if (props.required && props.required.length > 0) {
    props.required.forEach(propName => {
      const propType = props.types[propName] || 'string'

      fields.push({
        name: propName,
        type: inferPayloadType(propType),
        required: true,
        admin: {
          description: `Required prop (type: ${propType})`
        }
      })
    })
  }

  if (props.optional && props.optional.length > 0) {
    props.optional.forEach(propName => {
      const propType = props.types[propName] || 'string'

      fields.push({
        name: propName,
        type: inferPayloadType(propType),
        admin: {
          description: `Optional prop (type: ${propType})`
        }
      })
    })
  }

  // If no fields, add a note field
  if (fields.length === 0) {
    fields.push({
      name: 'note',
      type: 'textarea',
      admin: {
        description: 'Component has no props - this is a static component'
      }
    })
  }

  const tsContent = `import { Block } from 'payload/types'

/**
 * ${componentName} Block
 *
 * Generated from component analysis on ${new Date().toISOString()}
 * Source: Component from Astro project
 */

export const ${componentName}Block: Block = {
  slug: '${blockSlug}',
  interfaceName: '${componentName}BlockType',
  fields: [
${fields.map(f => generateFieldTS(f, '    ')).join(',\n')}
  ]
}
`

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'blocks', `${componentName}Block.ts`),
    tsContent
  )
}

/**
 * Infer Payload field type from TypeScript type string
 */
function inferPayloadType(tsType) {
  if (tsType.includes('string')) return 'text'
  if (tsType.includes('number')) return 'number'
  if (tsType.includes('boolean')) return 'checkbox'
  if (tsType.includes('date')) return 'date'
  return 'text'  // Default
}

/**
 * Generate all component blocks
 */
async function generateComponentBlocks() {
  console.log('\n📝 Generating component blocks...')

  let count = 0

  for (const [componentName, props] of Object.entries(componentProps)) {
    await generateComponentBlock(componentName, props)
    count++
  }

  console.log(`  ✓ Generated ${count} component blocks`)
}

/**
 * Generate payload.config.snippet.ts
 */
async function generatePayloadConfigSnippet() {
  console.log('\n📝 Generating payload.config.snippet.ts...')

  const blockImports = Object.keys(componentProps)
    .map(name => `import { ${name}Block } from './blocks/${name}Block'`)
    .join('\n')

  const blockList = Object.keys(componentProps)
    .map(name => `    ${name}Block,`)
    .join('\n')

  const tsContent = `/**
 * Payload Config Integration Snippet
 *
 * Copy the imports and add to your payload.config.ts
 * Generated on ${new Date().toISOString()}
 */

// ====================
// COLLECTION IMPORTS
// ====================

import { Providers } from './collections/Providers'
import { Team } from './collections/Team'
import { FAQs } from './collections/FAQs'

// ====================
// BLOCK IMPORTS
// ====================

import { FaqBlock } from './blocks/FaqBlock'
${blockImports}

// ====================
// CONFIG
// ====================

export default buildConfig({
  // ... other config

  collections: [
    // Add these collections
    Providers,
    Team,
    FAQs,

    // ... your existing collections
  ],

  // Blocks are included in the Providers collection's contentBlocks field
  // No need to register them separately
})

// ====================
// NOTES
// ====================

/*
 * 1. Collections are ready to use
 * 2. Blocks are imported in Providers.ts contentBlocks field
 * 3. All fields have admin descriptions
 * 4. Relationships are properly configured
 * 5. Auto-slug generation hooks included
 */
`

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'payload.config.snippet.ts'),
    tsContent
  )

  console.log('  ✓ Generated: payload.config.snippet.ts')
}

/**
 * Generate README for generated files
 */
async function generateReadme() {
  console.log('\n📝 Generating README...')

  const tsContent = `# Generated Payload Configuration

**Generated on**: ${new Date().toISOString()}

## Files Generated

### Collections
- \`collections/Providers.ts\` - Main provider content collection
- \`collections/Team.ts\` - Team members (authors, editors, checkers)
- \`collections/FAQs.ts\` - Reusable FAQ entries

### Blocks
- \`blocks/FaqBlock.ts\` - FAQ display block
- \`blocks/*Block.ts\` - ${Object.keys(componentProps).length} component blocks

### Config
- \`payload.config.snippet.ts\` - Integration code for your project

## Integration Steps

### 1. Copy Generated Files to Your Project

\`\`\`bash
# From migration directory
cp -r generated/collections/* /path/to/your/project/src/collections/
cp -r generated/blocks/* /path/to/your/project/src/lexical/blocks/
\`\`\`

### 2. Update your payload.config.ts

See \`payload.config.snippet.ts\` for the imports and config additions.

### 3. Update Providers Collection to Include Blocks

Edit \`src/collections/Providers.ts\` and update the \`contentBlocks\` field:

\`\`\`typescript
import { FaqBlock } from '../lexical/blocks/FaqBlock'
import { LowestRateDisplayBlock } from '../lexical/blocks/LowestRateDisplayBlock'
// ... import all other blocks

// In fields array:
{
  name: 'contentBlocks',
  type: 'blocks',
  blocks: [
    FaqBlock,
    LowestRateDisplayBlock,
    // ... all other blocks
  ]
}
\`\`\`

### 4. Restart Payload

\`\`\`bash
# Kill existing process
pkill -f "pnpm dev"

# Start fresh
pnpm dev
\`\`\`

### 5. Verify in Admin UI

1. Navigate to http://localhost:3001/admin
2. Check that "Providers", "Team", and "FAQs" collections appear
3. Click "Create New" in Providers
4. Verify all fields render correctly
5. Try adding a block - FAQ Block should be available

## Field Mappings

### Providers Collection

${Object.entries(frontmatterAnalysis.fields)
  .map(([name, field]) => `- \`${name}\`: ${field.type} (${field.count}/${frontmatterAnalysis.totalFiles} files)`)
  .join('\n')}

### Relationships

- \`parent\` → Providers (self-referential)
- \`post_author_team_member_is\` → Team (hasMany)
- \`post_editor_team_member_is\` → Team (hasMany)
- \`post_checker_team_member_is\` → Team (hasMany)
- \`heroImage\` → Media

## Next Steps

After integration:

1. Run \`deploy-to-target.mjs\` to automate deployment
2. Run \`test-target-payload.mjs\` to verify with Playwright
3. Run \`prepare-seed-data.mjs\` to prepare MDX data
4. Run \`seed-database.mjs\` to populate collections

---

**Need Help?** See \`COMPLETE-MIGRATION-GUIDE.md\` for full documentation
`

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'README.md'),
    tsContent
  )

  console.log('  ✓ Generated: README.md')
}

/**
 * Main generation function
 */
async function generate() {
  console.log('🚀 Starting Payload Config Generation...\n')

  // Load analysis data
  console.log('📁 Loading analysis data...')
  await loadAnalysisData()
  console.log('  ✓ Loaded frontmatter analysis')
  console.log('  ✓ Loaded component props')
  console.log('  ✓ Loaded component validation')

  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // Generate collections
  await generateProvidersCollection()
  await generateTeamCollection()
  await generateFAQsCollection()

  // Generate blocks
  await generateFaqBlock()
  await generateComponentBlocks()

  // Generate config snippet
  await generatePayloadConfigSnippet()

  // Generate README
  await generateReadme()

  // Summary
  console.log('\n\n✅ Payload Config Generation Complete!\n')
  console.log('📊 Summary:')
  console.log(`  - Collections: 3 (Providers, Team, FAQs)`)
  console.log(`  - Blocks: ${Object.keys(componentProps).length + 1} (FAQ + ${Object.keys(componentProps).length} components)`)
  console.log(`  - Fields in Providers: ${Object.keys(frontmatterAnalysis.fields).length + 3}`)
  console.log(`\n📂 Output directory: ${OUTPUT_DIR}`)
  console.log(`\n📖 Next steps: See ${OUTPUT_DIR}/README.md`)
}

// Run generation
generate().catch(console.error)
