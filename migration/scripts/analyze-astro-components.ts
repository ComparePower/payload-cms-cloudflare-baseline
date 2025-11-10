#!/usr/bin/env tsx
/**
 * Analyze Astro Components
 *
 * Scans Astro source components to extract TypeScript Props interfaces
 * and generate Payload block schema definitions
 */

import fs from 'fs/promises'
import path from 'path'

const ASTRO_SOURCE = '/Users/brad/_CODE_DEV_PROJECTS/cp-content-site-astro'
const COMPONENTS_DIR = `${ASTRO_SOURCE}/src/components`
const OUTPUT_FILE = '/Users/brad/_CODE_DEV_PROJECTS/cp-cms-payload-cms-mongo/.migration-cache/component-analysis.json'

interface ComponentProps {
  [propName: string]: {
    type: string
    required: boolean
    default?: any
  }
}

interface ComponentAnalysis {
  name: string
  filePath: string
  props: ComponentProps
  category: 'phone' | 'inline' | 'block' | 'unknown'
}

async function findComponents(dir: string, patterns: RegExp[]): Promise<string[]> {
  const files: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...await findComponents(fullPath, patterns))
    } else if (entry.isFile()) {
      // Check if filename matches any pattern
      if (patterns.some(pattern => pattern.test(entry.name))) {
        files.push(fullPath)
      }
    }
  }

  return files
}

async function main() {
  console.log('🔍 Analyzing Astro Components...\n')

  // Find all component files matching these patterns
  const patterns = [
    /PhoneNumber.*\.astro$/,
    /RatesTable\.astro$/,
    /TocRankMath\.astro$/,
    /LowestRate.*\.astro$/,
    /LowestRate.*\.tsx$/,
    /PopularCities.*\.astro$/,
  ]

  const files = await findComponents(COMPONENTS_DIR, patterns)

  console.log(`📂 Found ${files.length} component files\n`)

  const analyses: ComponentAnalysis[] = []

  for (const filePath of files) {
    try {
      const analysis = await analyzeComponent(filePath)
      analyses.push(analysis)

      console.log(`✓ ${analysis.name}`)
      console.log(`  Category: ${analysis.category}`)
      console.log(`  Props: ${Object.keys(analysis.props).length}`)
      console.log()
    } catch (error: any) {
      console.error(`✗ Error analyzing ${filePath}:`, error.message)
    }
  }

  // Write output
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(analyses, null, 2))

  console.log(`\n💾 Analysis saved to: ${OUTPUT_FILE}`)
  console.log(`\n📊 Summary:`)
  console.log(`   Total components: ${analyses.length}`)
  console.log(`   Phone components: ${analyses.filter(a => a.category === 'phone').length}`)
  console.log(`   Inline components: ${analyses.filter(a => a.category === 'inline').length}`)
  console.log(`   Block components: ${analyses.filter(a => a.category === 'block').length}`)
}

async function analyzeComponent(filePath: string): Promise<ComponentAnalysis> {
  const content = await fs.readFile(filePath, 'utf-8')
  const name = path.basename(filePath, path.extname(filePath))

  // Determine category based on name
  let category: ComponentAnalysis['category'] = 'unknown'
  if (name.includes('PhoneNumber')) category = 'phone'
  else if (name.includes('RatesTable') || name.includes('TocRankMath') || name.includes('PopularCities')) category = 'block'
  else if (name.includes('LowestRate')) category = 'inline'

  // Extract Props interface
  const props = extractPropsInterface(content)

  return {
    name,
    filePath,
    props,
    category,
  }
}

function extractPropsInterface(content: string): ComponentProps {
  const props: ComponentProps = {}

  // Match interface Props { ... }
  const interfaceMatch = content.match(/interface\s+Props\s*\{([^}]+)\}/s)
  if (!interfaceMatch) {
    return props
  }

  const interfaceBody = interfaceMatch[1]

  // Parse each prop line
  const propLines = interfaceBody.split('\n').map(line => line.trim()).filter(Boolean)

  for (const line of propLines) {
    // Match: propName?: type or propName: type
    const propMatch = line.match(/^(\w+)(\?)?:\s*([^;]+);?/)
    if (propMatch) {
      const [, propName, optional, typeStr] = propMatch
      props[propName] = {
        type: typeStr.trim(),
        required: !optional,
      }
    }
  }

  // Extract default values from destructuring
  const destructureMatch = content.match(/const\s*\{([^}]+)\}\s*=\s*Astro\.props/s)
  if (destructureMatch) {
    const destructureBody = destructureMatch[1]

    // Match: propName = "defaultValue" or propName = ""
    const defaultMatches = destructureBody.matchAll(/(\w+)\s*=\s*([^,\n]+)/g)
    for (const match of defaultMatches) {
      const [, propName, defaultValue] = match
      if (props[propName]) {
        // Clean up default value
        let cleanDefault = defaultValue.trim()
        if (cleanDefault.startsWith('"') && cleanDefault.endsWith('"')) {
          cleanDefault = cleanDefault.slice(1, -1)
        }
        props[propName].default = cleanDefault
      }
    }
  }

  return props
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
