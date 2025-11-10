#!/usr/bin/env node

/**
 * Generate Component Registration Template
 *
 * Reads component analysis JSON and generates a template file showing
 * all unregistered components with helpful comments about what needs
 * to be decided/implemented for each one.
 *
 * Usage:
 *   pnpm tsx migration/scripts/generate-registration-template.mjs
 *
 * Output: migration/COMPONENT-REGISTRATION-TODO.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ANALYSIS_JSON = '/tmp/component-analysis.json'
const OUTPUT_PATH = path.join(__dirname, '..', 'COMPONENT-REGISTRATION-TODO.ts')

console.log('📝 Generating Component Registration Template...\n')

// Read analysis data
if (!fs.existsSync(ANALYSIS_JSON)) {
  console.error(`❌ Analysis JSON not found: ${ANALYSIS_JSON}`)
  console.error('Run: pnpm tsx migration/scripts/analyze-mdx-components.mjs --json /tmp/component-analysis.json')
  process.exit(1)
}

const analysis = JSON.parse(fs.readFileSync(ANALYSIS_JSON, 'utf-8'))

// Filter unregistered components
const unregisteredComponents = Object.entries(analysis.components)
  .filter(([_, data]) => data.status === 'unregistered')
  .sort((a, b) => b[1].count - a[1].count) // Sort by usage count descending

console.log(`Found ${unregisteredComponents.length} unregistered components\n`)

// Generate template
let template = `/**
 * COMPONENT REGISTRATION TODO
 *
 * This file contains all unregistered MDX components that need to be added
 * to the Component Registry before migration can proceed.
 *
 * Generated: ${new Date().toISOString()}
 *
 * INSTRUCTIONS:
 * ------------
 * For each component below, decide:
 *
 * 1. Component Type:
 *    - 'block': Standalone block-level component (like RatesTable)
 *    - 'inline': Inline component within text (like ReliantPhoneNumber)
 *    - 'wrapper': Container removed during parsing (like Section, Figure)
 *
 * 2. Rendering Capabilities:
 *    - canRenderBlock: Can this component render as a standalone block?
 *    - canRenderInline: Can this component render inline within text?
 *
 * 3. Implementation Status:
 *    - 'implemented': Fully working Payload block/inline block exists
 *    - 'needs-work': Registered but implementation incomplete
 *    - 'placeholder': Registered but no implementation yet
 *
 * 4. Fields:
 *    - List all props this component accepts
 *    - Map to Payload field types (text, number, relationship, etc.)
 *
 * AFTER UPDATING:
 * --------------
 * Copy the completed entries to scripts/migration/lib/component-registry.ts
 * in the COMPONENT_REGISTRY object.
 *
 * Total unregistered: ${unregisteredComponents.length}
 * Total usages affected: ${unregisteredComponents.reduce((sum, [_, data]) => sum + data.count, 0)}
 */

import { type ComponentMapping } from '../../scripts/migration/lib/component-registry'

// ============================================================================
// UNREGISTERED COMPONENTS - NEED DECISIONS
// ============================================================================

export const UNREGISTERED_COMPONENTS: Record<string, ComponentMapping> = {

`

// Add each unregistered component with helpful comments
for (const [componentName, data] of unregisteredComponents) {
  const props = Object.keys(data.props || {})
  const usageCount = data.count
  const fileCount = data.fileCount

  // Determine likely component type based on name patterns
  let suggestedType = 'block' // default
  let suggestedRenderBlock = true
  let suggestedRenderInline = false

  if (componentName === 'Section' || componentName === 'Figure' || componentName === 'Article' || componentName === 'Aside') {
    suggestedType = 'wrapper'
    suggestedRenderBlock = false
    suggestedRenderInline = false
  } else if (componentName === 'Image' || componentName === 'Call' || componentName.includes('Inline')) {
    suggestedType = 'inline'
    suggestedRenderBlock = false
    suggestedRenderInline = true
  }

  template += `  // ──────────────────────────────────────────────────────────────────────────
  // ${componentName}
  // ──────────────────────────────────────────────────────────────────────────
  // Usage: ${usageCount} times in ${fileCount} files
  // Props: ${props.length > 0 ? props.join(', ') : 'none'}
  //
  // TODO: Decide component type and implementation strategy
  // [ ] Review actual usage in MDX files
  // [ ] Determine if this should be block/inline/wrapper
  // [ ] Create Payload block definition if needed
  // [ ] Map all props to Payload fields
  // [ ] Test rendering in admin UI
  //
  '${componentName}': {
    status: 'needs-work', // TODO: Change to 'implemented' after creating block
    componentType: '${suggestedType}', // TODO: Verify - 'block' | 'inline' | 'wrapper'
    canRenderBlock: ${suggestedRenderBlock}, // TODO: Can this render as standalone block?
    canRenderInline: ${suggestedRenderInline}, // TODO: Can this render inline in text?

    payloadBlockType: undefined, // TODO: Add block type if implementing
    // payloadBlockType: '${componentName}Block', // Example

    mdxUsageCount: ${usageCount},

    fields: {
${props.length > 0
  ? props.map(prop => `      // TODO: Map prop '${prop}' to Payload field type\n      // '${prop}': { type: '???' },`).join('\n')
  : '      // No props detected - verify in actual MDX files'
}
    },

    todos: [
      // TODO: Add implementation tasks here, for example:
      // 'Create src/lexical/blocks/${componentName}Block.ts',
      // 'Export from src/lexical/blocks/index.ts',
      // 'Add to payload.config.ts lexical editor config',
      // 'Test in admin UI',
    ],
  },

`
}

template += `}

// ============================================================================
// PRIORITY RECOMMENDATIONS
// ============================================================================

/**
 * HIGH PRIORITY (>1000 uses):
 * ---------------------------
 * These components are used extensively and should be implemented first:
 *
${unregisteredComponents
  .filter(([_, data]) => data.count > 1000)
  .map(([name, data]) => ` * - ${name}: ${data.count} uses`)
  .join('\n')
}
 *
 * MEDIUM PRIORITY (100-1000 uses):
 * --------------------------------
${unregisteredComponents
  .filter(([_, data]) => data.count >= 100 && data.count <= 1000)
  .map(([name, data]) => ` * - ${name}: ${data.count} uses`)
  .join('\n')
}
 *
 * LOW PRIORITY (<100 uses):
 * -------------------------
 * ${unregisteredComponents.filter(([_, data]) => data.count < 100).length} components with fewer than 100 uses each
 * Consider marking these as 'wrapper' if they're just containers
 * or implementing as simple text replacements
 */

// ============================================================================
// NEXT STEPS
// ============================================================================

/**
 * 1. Review each component marked with TODO comments above
 * 2. For high-priority components, examine actual MDX usage:
 *    - Find example file from analysis report
 *    - Look at how component is used in context
 *    - Determine what functionality it provides
 *
 * 3. Decide implementation strategy:
 *    - Full Payload block: Interactive component needs props/data
 *    - Wrapper: Just a container, strip during parsing
 *    - Text replacement: Static content, replace with markdown
 *
 * 4. Copy completed entries to component-registry.ts
 *
 * 5. Re-run analysis to verify:
 *    pnpm tsx migration/scripts/analyze-mdx-components.mjs
 */
`

// Write template file
fs.writeFileSync(OUTPUT_PATH, template, 'utf-8')

console.log('✅ Template generated successfully!')
console.log(`📄 Output: ${OUTPUT_PATH}`)
console.log(`\n📊 Summary:`)
console.log(`   - Total unregistered: ${unregisteredComponents.length}`)
console.log(`   - High priority (>1000 uses): ${unregisteredComponents.filter(([_, data]) => data.count > 1000).length}`)
console.log(`   - Medium priority (100-1000): ${unregisteredComponents.filter(([_, data]) => data.count >= 100 && data.count <= 1000).length}`)
console.log(`   - Low priority (<100): ${unregisteredComponents.filter(([_, data]) => data.count < 100).length}`)
console.log(`\n💡 Next: Review the generated file and fill in TODO comments`)
console.log(`   Then copy completed entries to component-registry.ts`)
